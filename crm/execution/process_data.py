#!/usr/bin/env python3
"""
Process CQC Care Home Ratings CSV into clean JSON for CRM.

This script:
1. Parses the raw CSV (~295K rows with duplicates)
2. Deduplicates by Location ID, keeping only "Overall" domain ratings
3. Consolidates multi-domain ratings into single record per facility
4. Generates clean facilities.json (~49K records)
5. Extracts unique values for filters
"""

import csv
import json
import os
from collections import defaultdict

# Paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
CSV_PATH = "/Users/nedthomas/Desktop/AFO/02_January_2026_Latest_CareHome_Ratings.xlsx - Locations.csv"
OUTPUT_PATH = os.path.join(PROJECT_DIR, "data", "facilities.json")
FILTERS_PATH = os.path.join(PROJECT_DIR, "data", "filters.json")


def clean_value(value):
    """Clean and normalize a value."""
    if value is None:
        return ""
    return value.strip()


def process_csv():
    """Process the CSV and return deduplicated facilities."""
    facilities = {}
    
    print(f"Reading CSV from: {CSV_PATH}")
    
    with open(CSV_PATH, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        row_count = 0
        
        for row in reader:
            row_count += 1
            
            loc_id = clean_value(row.get('Location ID', ''))
            if not loc_id:
                continue
            
            # Initialize facility record if first time seeing this ID
            if loc_id not in facilities:
                facilities[loc_id] = {
                    'id': loc_id,
                    'odsCode': clean_value(row.get('Location ODS Code', '')),
                    'name': clean_value(row.get('Location Name', '')),
                    'isCareHome': clean_value(row.get('Care Home?', '')) == 'Y',
                    'locationType': clean_value(row.get('Location Type', '')),
                    'inspectionCategory': clean_value(row.get('Location Primary Inspection Category', '')),
                    'address': {
                        'street': clean_value(row.get('Location Street Address', '')),
                        'line2': clean_value(row.get('Location Address Line 2', '')),
                        'city': clean_value(row.get('Location City', '')),
                        'postcode': clean_value(row.get('Location Post Code', '')),
                        'localAuthority': clean_value(row.get('Location Local Authority', '')),
                        'region': clean_value(row.get('Location Region', '')),
                    },
                    'ccg': clean_value(row.get('Location ONSPD CCG', '')),
                    'serviceGroup': clean_value(row.get('Service / Population Group', '')),
                    'url': clean_value(row.get('URL', '')),
                    'provider': {
                        'id': clean_value(row.get('Provider ID', '')),
                        'name': clean_value(row.get('Provider Name', '')),
                    },
                    'brand': {
                        'id': clean_value(row.get('Brand ID', '')),
                        'name': clean_value(row.get('Brand Name', '')),
                    },
                    'ratings': {},
                    'overallRating': None,
                    'publicationDate': None,
                }
            
            # Extract rating information
            domain = clean_value(row.get('Domain', ''))
            rating = clean_value(row.get('Latest Rating', ''))
            pub_date = clean_value(row.get('Publication Date', ''))
            
            if domain and rating:
                facilities[loc_id]['ratings'][domain] = rating
                
                # Track overall rating separately
                if domain == 'Overall':
                    facilities[loc_id]['overallRating'] = rating
                    facilities[loc_id]['publicationDate'] = pub_date
            
            if row_count % 50000 == 0:
                print(f"  Processed {row_count:,} rows...")
    
    print(f"Total rows processed: {row_count:,}")
    print(f"Unique facilities found: {len(facilities):,}")
    
    return list(facilities.values())


def extract_filters(facilities):
    """Extract unique filter values from facilities."""
    filters = {
        'regions': set(),
        'localAuthorities': set(),
        'locationTypes': set(),
        'inspectionCategories': set(),
        'ratings': set(),
        'serviceGroups': set(),
    }
    
    for f in facilities:
        if f['address']['region']:
            filters['regions'].add(f['address']['region'])
        if f['address']['localAuthority']:
            filters['localAuthorities'].add(f['address']['localAuthority'])
        if f['locationType']:
            filters['locationTypes'].add(f['locationType'])
        if f['inspectionCategory']:
            filters['inspectionCategories'].add(f['inspectionCategory'])
        if f['overallRating']:
            filters['ratings'].add(f['overallRating'])
        if f['serviceGroup']:
            filters['serviceGroups'].add(f['serviceGroup'])
    
    # Convert sets to sorted lists
    return {k: sorted(list(v)) for k, v in filters.items()}


def main():
    print("=" * 60)
    print("CompliantCare CRM - Data Processing")
    print("=" * 60)
    
    # Process CSV
    facilities = process_csv()
    
    # Filter to care homes only for primary dataset
    care_homes = [f for f in facilities if f['isCareHome']]
    print(f"\nCare homes (isCareHome=True): {len(care_homes):,}")
    
    # Extract filter options
    filters = extract_filters(facilities)
    
    print("\nFilter options found:")
    for key, values in filters.items():
        print(f"  {key}: {len(values)} unique values")
    
    # Ensure output directory exists
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    
    # Save all facilities
    print(f"\nSaving all facilities to: {OUTPUT_PATH}")
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(facilities, f, indent=2)
    
    # Save filter options
    print(f"Saving filter options to: {FILTERS_PATH}")
    with open(FILTERS_PATH, 'w', encoding='utf-8') as f:
        json.dump(filters, f, indent=2)
    
    # Print sample record
    print("\n" + "=" * 60)
    print("Sample facility record:")
    print("=" * 60)
    sample = care_homes[0] if care_homes else facilities[0]
    print(json.dumps(sample, indent=2))
    
    print("\n✅ Data processing complete!")
    print(f"   - Total facilities: {len(facilities):,}")
    print(f"   - Care homes: {len(care_homes):,}")
    print(f"   - Output: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
