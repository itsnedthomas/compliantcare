# Geocoding Facilities - Instructions

## Overview
This document provides instructions for completing the geocoding of 34,220 UK care facilities with accurate latitude/longitude coordinates from their postcodes.

## Current Status
- **Total Facilities**: 34,220
- **Geocoded**: 151 (as of last check)
- **Pending**: ~34,069

## Files Generated
The following files have been generated to facilitate geocoding:

### Data Files
- `scripts/geocode_data.json` - JSON array of geocoding data
- `scripts/geocode_data.csv` - CSV format for import
- `scripts/geocode_updates.sql` - Individual UPDATE statements (34,060 total)

### Batch Insert Files
- `scripts/insert_chunks/chunk_000.sql` to `chunk_068.sql` - 69 files, each with 500 INSERT statements
- `scripts/insert_chunks/final_update.sql` - Final UPDATE to copy from lookup to facilities

## Method 1: Via Supabase SQL Editor (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/qdrbwvxqtgwjgitcambn
2. Navigate to **SQL Editor**
3. Run the following SQL to create the lookup table (if not exists):

```sql
CREATE TABLE IF NOT EXISTS geocode_lookup (
    location_id TEXT PRIMARY KEY,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION
);
```

4. Copy and paste the contents of each `chunk_XXX.sql` file from `scripts/insert_chunks/` and execute them one at a time.

5. After all chunks are inserted, run the final update:

```sql
-- Update facilities from lookup table
UPDATE facilities f
SET 
    latitude = g.latitude,
    longitude = g.longitude
FROM geocode_lookup g
WHERE f."Location ID" = g.location_id
AND (f.latitude IS NULL OR f.latitude != g.latitude);

-- Verify count
SELECT COUNT(*) as geocoded FROM facilities WHERE latitude IS NOT NULL;
```

## Method 2: Using All Updates File

1. Open `scripts/all_geocode_updates.sql` (3.3MB file)
2. Split into manageable chunks (the file contains 171 batched UPDATE statements)
3. Execute via SQL Editor or psql

## Method 3: Using Combined Merge SQL

1. Use the file `scripts/geocode_merge.sql` (1.28MB)
2. This file uses a temp table approach for bulk insert
3. May need to be split into sections for large imports

## Verification

After completing the import, verify the geocoding:

```sql
-- Check total geocoded
SELECT 
    COUNT(*) as total,
    COUNT(latitude) as geocoded,
    COUNT(*) - COUNT(latitude) as pending
FROM facilities;

-- Sample of geocoded facilities
SELECT "Name", "Location Post Code", latitude, longitude
FROM facilities 
WHERE latitude IS NOT NULL 
LIMIT 10;
```

## Troubleshooting

### RLS (Row Level Security) Issues
If you get permission errors via the REST API, use:
- Supabase SQL Editor (uses admin access)
- psql with service role connection string

### Query Size Limits
If individual file is too large:
- Use the smaller `insert_chunks/` files instead
- Each chunk is ~20KB with 500 records

## Notes
- Geocoding data was obtained from postcodes.io (free UK postcode API)
- 152 postcodes failed to geocode (likely invalid/outdated)
- The `data.js` file has been updated to use real coordinates when available
