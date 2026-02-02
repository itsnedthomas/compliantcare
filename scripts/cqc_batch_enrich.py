#!/usr/bin/env python3
"""
CQC Batch Enrichment Script
Enriches all care homes in the database with full CQC data.
Runs with rate limiting to respect CQC API limits.
"""

import time
import requests
from dotenv import load_dotenv

load_dotenv()

# Configuration - CompliantCare Supabase
SUPABASE_URL = 'https://qdrbwvxqtgwjgitcambn.supabase.co'
SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkcmJ3dnhxdGd3amdpdGNhbWJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4OTE4NDMsImV4cCI6MjA4NTQ2Nzg0M30.8oJPT8Nyr4FbS2SZp9j9VEsnk5oAumV2_kWNam-RZD4'
EDGE_FUNCTION_URL = f"{SUPABASE_URL}/functions/v1/cqc-enrich-full"

# Rate limiting: CQC recommends max 10 requests per second - using 10 for speed
REQUESTS_PER_SECOND = 10
DELAY_BETWEEN_REQUESTS = 1 / REQUESTS_PER_SECOND  # 0.1 seconds

# Batch size for progress reporting
BATCH_REPORT_SIZE = 100


def get_care_homes_to_enrich():
    """Get all care homes that haven't been enriched yet or need updating."""
    headers = {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
        'Content-Type': 'application/json',
    }
    
    # Call RPC function that handles the column name with ? properly
    url = f'{SUPABASE_URL}/rest/v1/rpc/get_unenriched_care_homes'
    response = requests.post(url, headers=headers, json={'max_count': 15000})
    
    if response.status_code != 200:
        print(f"Error fetching care homes: {response.status_code} {response.text}")
        return []
    
    return [r['location_id'] for r in response.json()]


def enrich_location(location_id):
    """Call the Edge Function to enrich a single location."""
    try:
        response = requests.post(
            EDGE_FUNCTION_URL,
            json={'locationId': location_id},
            headers={'Content-Type': 'application/json'},
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            return True, data.get('name', location_id)
        else:
            return False, f"HTTP {response.status_code}: {response.text[:100]}"
            
    except Exception as e:
        return False, str(e)


def main():
    batch_num = 0
    total_overall_success = 0
    total_overall_failed = 0
    overall_start = time.time()
    
    print("=" * 60)
    print("CQC Batch Enrichment Script (Continuous Mode)")
    print("=" * 60)
    
    while True:
        batch_num += 1
        print(f"\n--- BATCH {batch_num} ---")
        
        # Get care homes to enrich
        print("Fetching care homes to enrich...")
        location_ids = get_care_homes_to_enrich()
        total = len(location_ids)
        
        if total == 0:
            print("\n" + "=" * 60)
            print("ALL CARE HOMES ENRICHED!")
            print(f"Total successful: {total_overall_success}")
            print(f"Total failed: {total_overall_failed}")
            print(f"Total time: {(time.time() - overall_start)/60:.1f} minutes")
            print("=" * 60)
            return
        
        print(f"Found {total} care homes to enrich in this batch")
        print(f"Estimated time for batch: {total * DELAY_BETWEEN_REQUESTS / 60:.1f} minutes")
        print("-" * 60)
        
        # Process each care home
        success_count = 0
        fail_count = 0
        start_time = time.time()
        
        for i, location_id in enumerate(location_ids, 1):
            success, result = enrich_location(location_id)
            
            if success:
                success_count += 1
            else:
                fail_count += 1
                print(f"  Error: {result}")
            
            # Progress report every BATCH_REPORT_SIZE records
            if i % BATCH_REPORT_SIZE == 0 or i == total:
                elapsed = time.time() - start_time
                rate = i / elapsed if elapsed > 0 else 0
                remaining = (total - i) / rate if rate > 0 else 0
                
                print(f"[{i}/{total}] ({100*i/total:.1f}%) | "
                      f"Success: {success_count} | Failed: {fail_count} | "
                      f"Rate: {rate:.1f}/sec | ETA: {remaining/60:.1f} min")
            
            # Rate limiting
            time.sleep(DELAY_BETWEEN_REQUESTS)
        
        # Batch summary
        total_overall_success += success_count
        total_overall_failed += fail_count
        elapsed = time.time() - start_time
        print(f"\nBatch {batch_num} complete: {success_count} success, {fail_count} failed in {elapsed/60:.1f} min")
        print(f"Overall progress: {total_overall_success} enriched, {total_overall_failed} failed")


if __name__ == '__main__':
    main()

