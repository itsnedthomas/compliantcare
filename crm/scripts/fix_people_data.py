#!/usr/bin/env python3
"""
Fix People Data - Recalculate aggregated fields from facilities
Updates total_beds, total_properties, and region for all people records
by aggregating data from their provider's facilities.
"""

import requests

# Supabase config
SUPABASE_URL = 'https://qdrbwvxqtgwjgitcambn.supabase.co'
SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkcmJ3dnhxdGd3amdpdGNhbWJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4OTE4NDMsImV4cCI6MjA4NTQ2Nzg0M30.8oJPT8Nyr4FbS2SZp9j9VEsnk5oAumV2_kWNam-RZD4'

HEADERS = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
    'Content-Type': 'application/json',
}


def get_people_to_fix():
    """Get people records with missing data."""
    all_people = []
    offset = 0
    page_size = 1000
    
    while True:
        url = f'{SUPABASE_URL}/rest/v1/people'
        params = {
            'select': 'id,name,provider_id,total_beds,total_properties,region',
            'role': 'eq.nominated_individual',
            'order': 'id.asc',
            'limit': page_size,
            'offset': offset
        }
        
        response = requests.get(url, headers=HEADERS, params=params, timeout=60)
        if response.status_code != 200:
            print(f"Error fetching people: {response.status_code} {response.text}")
            break
        
        people = response.json()
        if not people:
            break
            
        all_people.extend(people)
        print(f"  Fetched batch: {len(people)} people (total: {len(all_people)})")
        
        if len(people) < page_size:
            break
        offset += page_size
    
    # Filter to only those needing fixes
    to_fix = [p for p in all_people if 
              (p.get('total_beds') == 0 or p.get('total_beds') is None) or
              (p.get('total_properties') == 0 or p.get('total_properties') is None) or
              p.get('region') is None]
    
    print(f"Total people: {len(all_people)}, Need fixing: {len(to_fix)}")
    return to_fix


def get_provider_aggregates():
    """Get aggregated data for all providers from facilities."""
    all_facilities = []
    offset = 0
    page_size = 1000
    
    while True:
        url = f'{SUPABASE_URL}/rest/v1/facilities'
        params = {
            'select': '"Provider ID",number_of_beds,"Location Region"',
            'limit': page_size,
            'offset': offset
        }
        
        response = requests.get(url, headers=HEADERS, params=params, timeout=120)
        if response.status_code != 200:
            print(f"Error fetching facilities: {response.status_code} {response.text}")
            break
        
        facilities = response.json()
        if not facilities:
            break
            
        all_facilities.extend(facilities)
        print(f"  Fetched batch: {len(facilities)} facilities (total: {len(all_facilities)})")
        
        if len(facilities) < page_size:
            break
        offset += page_size
    
    facilities = all_facilities
    print(f"Fetched {len(facilities)} total facilities")
    
    # Aggregate by provider
    provider_data = {}
    for f in facilities:
        provider_id = f.get('Provider ID')
        if not provider_id:
            continue
            
        if provider_id not in provider_data:
            provider_data[provider_id] = {
                'total_beds': 0,
                'total_properties': 0,
                'regions': []
            }
        
        provider_data[provider_id]['total_properties'] += 1
        beds = f.get('number_of_beds') or 0
        provider_data[provider_id]['total_beds'] += beds
        
        region = f.get('Location Region')
        if region:
            provider_data[provider_id]['regions'].append(region)
    
    # Calculate most common region for each provider
    for provider_id, data in provider_data.items():
        if data['regions']:
            # Mode (most common region)
            from collections import Counter
            region_counts = Counter(data['regions'])
            data['region'] = region_counts.most_common(1)[0][0]
        else:
            data['region'] = None
        del data['regions']
    
    print(f"Aggregated data for {len(provider_data)} providers")
    return provider_data


def update_person(person_id, update_data):
    """Update a single person record."""
    url = f'{SUPABASE_URL}/rest/v1/people?id=eq.{person_id}'
    
    response = requests.patch(url, headers=HEADERS, json=update_data, timeout=30)
    return response.status_code == 204


def main():
    print("=" * 60)
    print("Fix People Data - Recalculate Aggregated Fields")
    print("=" * 60)
    
    # Get provider aggregates from facilities
    print("\n1. Calculating provider aggregates from facilities...")
    provider_data = get_provider_aggregates()
    
    # Get people needing fixes
    print("\n2. Finding people records needing fixes...")
    people_to_fix = get_people_to_fix()
    
    if not people_to_fix:
        print("\nNo people records need fixing!")
        return
    
    # Update each person
    print(f"\n3. Updating {len(people_to_fix)} people records...")
    success = 0
    failed = 0
    no_provider_data = 0
    
    for i, person in enumerate(people_to_fix, 1):
        provider_id = person.get('provider_id')
        
        if not provider_id or provider_id not in provider_data:
            no_provider_data += 1
            continue
        
        agg = provider_data[provider_id]
        update = {
            'total_beds': agg['total_beds'],
            'total_properties': agg['total_properties'],
            'region': agg['region']
        }
        
        if update_person(person['id'], update):
            success += 1
        else:
            failed += 1
        
        if i % 100 == 0 or i == len(people_to_fix):
            print(f"  [{i}/{len(people_to_fix)}] Success: {success}, Failed: {failed}, No provider data: {no_provider_data}")
    
    print("\n" + "=" * 60)
    print(f"COMPLETE: Updated {success} records")
    print(f"Failed: {failed}")
    print(f"No provider data: {no_provider_data}")
    print("=" * 60)


if __name__ == '__main__':
    main()
