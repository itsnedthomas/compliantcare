#!/usr/bin/env python3
"""
Upload CQC Facility Data to Supabase
Processes CSV and uploads in batches
"""

import csv
import json
import os
import sys
from datetime import datetime

# Supabase credentials (service role for admin access)
SUPABASE_URL = "https://qdrbwvxqtgwjgitcambn.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkcmJ3dnhxdGd3amdpdGNhbWJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg5MTg0MywiZXhwIjoyMDg1NDY3ODQzfQ.UfG5JPIELjNViAN5hbX2Lt_5v9hRweAYTE32u_D1TRE"

try:
    from supabase import create_client, Client
except ImportError:
    print("Installing supabase-py...")
    os.system("pip install supabase")
    from supabase import create_client, Client

def parse_csv(filepath):
    """Parse CSV and extract facility records"""
    facilities = []
    seen_ids = set()
    
    print(f"Reading CSV: {filepath}")
    
    with open(filepath, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            location_id = row.get('Location ID', '').strip()
            
            # Skip duplicates and invalid
            if not location_id or location_id in seen_ids:
                continue
            
            # Only keep "Overall" service group rows
            service_group = row.get('Service / Population Group', '').strip()
            if service_group != 'Overall':
                continue
                
            seen_ids.add(location_id)
            
            # Build facility record
            facility = {
                'id': location_id,
                'ods_code': row.get('Location ODS Code', '').strip() or None,
                'name': row.get('Location Name', '').strip(),
                'is_care_home': row.get('Care home?', '').strip().upper() == 'Y',
                'location_type': row.get('Location Type', '').strip() or None,
                'inspection_category': row.get('Location Inspection Category', '').strip() or None,
                
                # Address
                'street': row.get('Location Street Address', '').strip() or None,
                'address_line2': row.get('Location Address Line 2', '').strip() or None,
                'city': row.get('Location City', '').strip() or None,
                'postcode': row.get('Location Post Code', '').strip() or None,
                'local_authority': row.get('Location Local Authority', '').strip() or None,
                'region': row.get('Location Region', '').strip() or None,
                
                # Provider
                'provider_id': row.get('Provider ID', '').strip() or None,
                'provider_name': row.get('Provider Name', '').strip() or None,
                
                # Brand
                'brand_id': row.get('Brand ID', '').strip() or None,
                'brand_name': row.get('Brand Name', '').strip() or None,
                
                # Ratings
                'rating_safe': row.get('Safe', '').strip() or None,
                'rating_effective': row.get('Effective', '').strip() or None,
                'rating_caring': row.get('Caring', '').strip() or None,
                'rating_responsive': row.get('Responsive', '').strip() or None,
                'rating_well_led': row.get('Well-led', '').strip() or None,
                'rating_overall': row.get('Overall', '').strip() or None,
                
                # Meta
                'ccg': row.get('Location CCG', '').strip() or None,
                'url': row.get('Location URL', '').strip() or None,
                'publication_date': row.get('Publication Date', '').strip() or None,
            }
            
            facilities.append(facility)
    
    print(f"Parsed {len(facilities)} unique facilities")
    return facilities


def upload_to_supabase(facilities):
    """Upload facilities to Supabase in batches"""
    print(f"\nConnecting to Supabase...")
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # Upload in batches of 500
    batch_size = 500
    total = len(facilities)
    
    for i in range(0, total, batch_size):
        batch = facilities[i:i + batch_size]
        batch_num = (i // batch_size) + 1
        total_batches = (total + batch_size - 1) // batch_size
        
        print(f"Uploading batch {batch_num}/{total_batches} ({len(batch)} records)...")
        
        try:
            # Upsert to handle duplicates
            result = supabase.table('facilities').upsert(batch, on_conflict='id').execute()
            print(f"  ✓ Uploaded successfully")
        except Exception as e:
            print(f"  ✗ Error: {e}")
            # Try smaller batches if there's an error
            if batch_size > 50:
                print("  Retrying with smaller batches...")
                for j in range(0, len(batch), 50):
                    mini_batch = batch[j:j+50]
                    try:
                        supabase.table('facilities').upsert(mini_batch, on_conflict='id').execute()
                        print(f"    ✓ Mini-batch {j//50 + 1} uploaded")
                    except Exception as e2:
                        print(f"    ✗ Mini-batch error: {e2}")
    
    print(f"\n✓ Upload complete! {total} facilities in Supabase")


def create_table_sql():
    """Print SQL to create the facilities table"""
    sql = """
-- Run this in Supabase SQL Editor:

CREATE TABLE IF NOT EXISTS facilities (
    id TEXT PRIMARY KEY,
    ods_code TEXT,
    name TEXT NOT NULL,
    is_care_home BOOLEAN DEFAULT FALSE,
    location_type TEXT,
    inspection_category TEXT,
    
    -- Address
    street TEXT,
    address_line2 TEXT,
    city TEXT,
    postcode TEXT,
    local_authority TEXT,
    region TEXT,
    
    -- Provider
    provider_id TEXT,
    provider_name TEXT,
    
    -- Brand
    brand_id TEXT,
    brand_name TEXT,
    
    -- Ratings
    rating_safe TEXT,
    rating_effective TEXT,
    rating_caring TEXT,
    rating_responsive TEXT,
    rating_well_led TEXT,
    rating_overall TEXT,
    
    -- Meta
    ccg TEXT,
    url TEXT,
    publication_date TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_facilities_region ON facilities(region);
CREATE INDEX IF NOT EXISTS idx_facilities_rating ON facilities(rating_overall);
CREATE INDEX IF NOT EXISTS idx_facilities_provider ON facilities(provider_name);
CREATE INDEX IF NOT EXISTS idx_facilities_care_home ON facilities(is_care_home);
CREATE INDEX IF NOT EXISTS idx_facilities_name ON facilities(name);

-- Enable Row Level Security (optional)
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public read access" ON facilities FOR SELECT USING (true);
"""
    return sql


if __name__ == "__main__":
    csv_path = "/Users/nedthomas/Desktop/AFO/02_January_2026_Latest_CareHome_Ratings.xlsx - Locations.csv"
    
    if "--sql" in sys.argv:
        print(create_table_sql())
        sys.exit(0)
    
    if not os.path.exists(csv_path):
        print(f"CSV not found: {csv_path}")
        sys.exit(1)
    
    # Parse CSV
    facilities = parse_csv(csv_path)
    
    if "--dry-run" in sys.argv:
        print(f"\nDry run - would upload {len(facilities)} facilities")
        print(f"Sample record: {json.dumps(facilities[0], indent=2)}")
        sys.exit(0)
    
    # Upload
    upload_to_supabase(facilities)
