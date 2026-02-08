#!/usr/bin/env python3
"""
Geocode UK Postcodes using postcodes.io API

This script:
1. Reads facilities.json
2. Extracts unique postcodes
3. Batch geocodes using postcodes.io (100 per request, free API)
4. Updates facilities.json with lat/lng coordinates
5. Saves geocode cache for future use
"""

import json
import os
import time
import requests
from collections import defaultdict

# Paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
DATA_DIR = os.path.join(PROJECT_DIR, "data")
FACILITIES_PATH = os.path.join(DATA_DIR, "facilities.json")
GEOCODE_CACHE_PATH = os.path.join(DATA_DIR, "geocode_cache.json")
OUTPUT_PATH = os.path.join(DATA_DIR, "facilities_geocoded.json")

# postcodes.io API endpoint
POSTCODES_API = "https://api.postcodes.io/postcodes"
BATCH_SIZE = 100  # Max allowed by API


def load_geocode_cache():
    """Load existing geocode cache if available."""
    if os.path.exists(GEOCODE_CACHE_PATH):
        with open(GEOCODE_CACHE_PATH, 'r') as f:
            return json.load(f)
    return {}


def save_geocode_cache(cache):
    """Save geocode cache to file."""
    with open(GEOCODE_CACHE_PATH, 'w') as f:
        json.dump(cache, f, indent=2)


def batch_geocode(postcodes, cache):
    """
    Geocode a batch of postcodes using postcodes.io API.
    Returns dict of postcode -> {lat, lng} or None if not found.
    """
    # Filter out already cached postcodes
    to_geocode = [pc for pc in postcodes if pc not in cache]
    
    if not to_geocode:
        return
    
    print(f"  Geocoding {len(to_geocode)} new postcodes...")
    
    # Process in batches of 100
    for i in range(0, len(to_geocode), BATCH_SIZE):
        batch = to_geocode[i:i + BATCH_SIZE]
        
        try:
            response = requests.post(
                POSTCODES_API,
                json={"postcodes": batch},
                timeout=30
            )
            response.raise_for_status()
            
            data = response.json()
            
            if data.get("status") == 200:
                for result in data.get("result", []):
                    query = result.get("query", "").upper().strip()
                    result_data = result.get("result")
                    
                    if result_data:
                        cache[query] = {
                            "lat": result_data.get("latitude"),
                            "lng": result_data.get("longitude"),
                            "region": result_data.get("region"),
                            "admin_district": result_data.get("admin_district")
                        }
                    else:
                        # Postcode not found, mark as null
                        cache[query] = None
            
            # Save cache periodically
            if i % 1000 == 0 and i > 0:
                save_geocode_cache(cache)
                print(f"    Saved cache at {i + len(batch)} postcodes...")
            
            # Rate limiting: be nice to the free API
            time.sleep(0.1)
            
        except requests.exceptions.RequestException as e:
            print(f"  Error geocoding batch {i}: {e}")
            time.sleep(1)  # Wait before retry
            continue
    
    return cache


def normalize_postcode(postcode):
    """Normalize postcode format for consistent lookup."""
    if not postcode:
        return ""
    # Remove extra spaces and uppercase
    return " ".join(postcode.upper().strip().split())


def main():
    print("=" * 60)
    print("CompliantCare CRM - Postcode Geocoding")
    print("=" * 60)
    
    # Load facilities
    print(f"\nLoading facilities from: {FACILITIES_PATH}")
    with open(FACILITIES_PATH, 'r') as f:
        facilities = json.load(f)
    
    print(f"Loaded {len(facilities):,} facilities")
    
    # Extract unique postcodes
    postcodes = set()
    for facility in facilities:
        pc = normalize_postcode(facility.get("address", {}).get("postcode", ""))
        if pc:
            postcodes.add(pc)
    
    print(f"Found {len(postcodes):,} unique postcodes")
    
    # Load existing cache
    cache = load_geocode_cache()
    cached_count = len(cache)
    print(f"Loaded {cached_count:,} cached geocodes")
    
    # Geocode all postcodes
    print("\nGeocoding postcodes...")
    batch_geocode(list(postcodes), cache)
    
    # Save final cache
    save_geocode_cache(cache)
    new_geocodes = len(cache) - cached_count
    print(f"\nGeocoded {new_geocodes:,} new postcodes")
    print(f"Total cached: {len(cache):,}")
    
    # Calculate success rate
    found = sum(1 for v in cache.values() if v is not None)
    not_found = sum(1 for v in cache.values() if v is None)
    print(f"Found: {found:,}, Not found: {not_found:,}")
    
    # Update facilities with geocoded coordinates
    print("\nUpdating facilities with coordinates...")
    updated = 0
    missing = 0
    
    for facility in facilities:
        pc = normalize_postcode(facility.get("address", {}).get("postcode", ""))
        
        if pc and pc in cache and cache[pc]:
            facility["latitude"] = cache[pc]["lat"]
            facility["longitude"] = cache[pc]["lng"]
            updated += 1
        else:
            facility["latitude"] = None
            facility["longitude"] = None
            missing += 1
    
    print(f"Updated {updated:,} facilities with coordinates")
    print(f"Missing coordinates for {missing:,} facilities")
    
    # Save geocoded facilities
    print(f"\nSaving to: {OUTPUT_PATH}")
    with open(OUTPUT_PATH, 'w') as f:
        json.dump(facilities, f, indent=2)
    
    # Also update the original file
    with open(FACILITIES_PATH, 'w') as f:
        json.dump(facilities, f, indent=2)
    
    print("\n✅ Geocoding complete!")
    
    # Print sample
    sample = next((f for f in facilities if f.get("latitude")), None)
    if sample:
        print("\nSample geocoded facility:")
        print(f"  Name: {sample['name']}")
        print(f"  Postcode: {sample['address']['postcode']}")
        print(f"  Coordinates: {sample['latitude']}, {sample['longitude']}")


if __name__ == "__main__":
    main()
