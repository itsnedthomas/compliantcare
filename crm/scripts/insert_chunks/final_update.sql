
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
