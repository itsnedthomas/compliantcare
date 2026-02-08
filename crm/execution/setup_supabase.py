#!/usr/bin/env python3
"""
Supabase Database Setup Script
Creates facilities table and uploads data using direct PostgreSQL connection
"""

import os
import csv
import sys

# Database connection settings
# Get password from: Supabase Dashboard > Project Settings > Database > Connection string
DB_HOST = "db.qdrbwvxqtgwjgitcambn.supabase.co"
DB_PORT = "5432"
DB_NAME = "postgres"
DB_USER = "postgres"
DB_PASSWORD = os.environ.get("SUPABASE_DB_PASSWORD", "")

# Supabase API settings (for data upload via REST)
SUPABASE_URL = "https://qdrbwvxqtgwjgitcambn.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkcmJ3dnhxdGd3amdpdGNhbWJuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTg5MTg0MywiZXhwIjoyMDg1NDY3ODQzfQ.UfG5JPIELjNViAN5hbX2Lt_5v9hRweAYTE32u_D1TRE"


def create_table_with_psycopg2():
    """Create table using direct PostgreSQL connection"""
    try:
        import psycopg2
    except ImportError:
        print("Installing psycopg2...")
        os.system("pip install psycopg2-binary")
        import psycopg2
    
    if not DB_PASSWORD:
        print("ERROR: Set SUPABASE_DB_PASSWORD environment variable")
        print("Get password from: Supabase Dashboard > Project Settings > Database")
        return False
    
    conn_string = f"host={DB_HOST} port={DB_PORT} dbname={DB_NAME} user={DB_USER} password={DB_PASSWORD}"
    
    print(f"Connecting to PostgreSQL at {DB_HOST}...")
    
    try:
        conn = psycopg2.connect(conn_string)
        cur = conn.cursor()
        
        # Create table
        create_sql = """
        CREATE TABLE IF NOT EXISTS facilities (
            id TEXT PRIMARY KEY,
            ods_code TEXT,
            name TEXT NOT NULL,
            is_care_home BOOLEAN DEFAULT FALSE,
            location_type TEXT,
            inspection_category TEXT,
            street TEXT,
            address_line2 TEXT,
            city TEXT,
            postcode TEXT,
            local_authority TEXT,
            region TEXT,
            provider_id TEXT,
            provider_name TEXT,
            brand_id TEXT,
            brand_name TEXT,
            rating_safe TEXT,
            rating_effective TEXT,
            rating_caring TEXT,
            rating_responsive TEXT,
            rating_well_led TEXT,
            rating_overall TEXT,
            ccg TEXT,
            url TEXT,
            publication_date TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_facilities_region ON facilities(region);
        CREATE INDEX IF NOT EXISTS idx_facilities_rating ON facilities(rating_overall);
        CREATE INDEX IF NOT EXISTS idx_facilities_provider ON facilities(provider_name);
        CREATE INDEX IF NOT EXISTS idx_facilities_care_home ON facilities(is_care_home);
        CREATE INDEX IF NOT EXISTS idx_facilities_name ON facilities(name);
        
        ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Public read access" ON facilities;
        CREATE POLICY "Public read access" ON facilities FOR SELECT USING (true);
        """
        
        print("Creating table and indexes...")
        cur.execute(create_sql)
        conn.commit()
        
        print("✓ Table 'facilities' created successfully!")
        
        cur.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"✗ Error: {e}")
        return False


def upload_data_via_rest():
    """Upload data via Supabase REST API (requires table to exist)"""
    from supabase import create_client
    
    csv_path = "/Users/nedthomas/Desktop/AFO/02_January_2026_Latest_CareHome_Ratings.xlsx - Locations.csv"
    
    print(f"\nReading CSV: {csv_path}")
    
    facilities = []
    seen_ids = set()
    
    with open(csv_path, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        
        for row in reader:
            location_id = row.get('Location ID', '').strip()
            service_group = row.get('Service / Population Group', '').strip()
            
            if not location_id or location_id in seen_ids or service_group != 'Overall':
                continue
            
            seen_ids.add(location_id)
            
            facility = {
                'id': location_id,
                'name': row.get('Location Name', '').strip(),
                'is_care_home': row.get('Care home?', '').strip().upper() == 'Y',
                'postcode': row.get('Location Post Code', '').strip() or None,
                'city': row.get('Location City', '').strip() or None,
                'region': row.get('Location Region', '').strip() or None,
                'provider_name': row.get('Provider Name', '').strip() or None,
                'rating_overall': row.get('Overall', '').strip() or None,
            }
            
            facilities.append(facility)
    
    print(f"Parsed {len(facilities)} facilities")
    
    # Upload via Supabase client
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    batch_size = 500
    total = len(facilities)
    
    for i in range(0, total, batch_size):
        batch = facilities[i:i + batch_size]
        batch_num = (i // batch_size) + 1
        total_batches = (total + batch_size - 1) // batch_size
        
        print(f"Uploading batch {batch_num}/{total_batches}...")
        
        try:
            supabase.table('facilities').upsert(batch, on_conflict='id').execute()
            print(f"  ✓ Done")
        except Exception as e:
            print(f"  ✗ Error: {e}")
    
    print(f"\n✓ Upload complete!")


if __name__ == "__main__":
    if "--create-table" in sys.argv:
        create_table_with_psycopg2()
    elif "--upload" in sys.argv:
        upload_data_via_rest()
    else:
        print("Usage:")
        print("  SUPABASE_DB_PASSWORD=xxx python3 setup_supabase.py --create-table")
        print("  python3 setup_supabase.py --upload")
