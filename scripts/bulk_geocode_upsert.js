/**
 * Efficient Bulk Geocoding Update Script
 * Uses Supabase client with batched upserts
 * Run with: node bulk_geocode_upsert.js
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://qdrbwvxqtgwjgitcambn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkcmJ3dnhxdGd3amdpdGNhbWJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4OTE4NDMsImV4cCI6MjA4NTQ2Nzg0M30.8oJPT8Nyr4FbS2SZp9j9VEsnk5oAumV2_kWNam-RZD4';

// Parse geocode_updates.sql to extract location_id -> lat/lng mappings
function parseGeocodeFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const updates = [];

    // Match: UPDATE facilities SET latitude = X, longitude = Y WHERE "Location ID" = 'Z';
    const regex = /UPDATE facilities SET latitude = ([\d.-]+), longitude = ([\d.-]+) WHERE "Location ID" = '([^']+)'/g;

    let match;
    while ((match = regex.exec(content)) !== null) {
        updates.push({
            location_id: match[3],
            latitude: parseFloat(match[1]),
            longitude: parseFloat(match[2])
        });
    }

    return updates;
}

async function main() {
    console.log('=== Bulk Geocoding Update ===\n');

    const sqlFile = path.join(__dirname, 'geocode_updates.sql');

    if (!fs.existsSync(sqlFile)) {
        console.log('Error: geocode_updates.sql not found');
        console.log('Run geocode_facilities_sql.js first to generate the file');
        return;
    }

    const updates = parseGeocodeFile(sqlFile);
    console.log(`Parsed ${updates.length} updates from SQL file\n`);

    // Output as JSON for importing into Supabase
    const jsonFile = path.join(__dirname, 'geocode_data.json');
    fs.writeFileSync(jsonFile, JSON.stringify(updates, null, 2));
    console.log(`Written JSON data to: ${jsonFile}`);

    // Create a CSV version for Supabase import
    const csvFile = path.join(__dirname, 'geocode_data.csv');
    const csvContent = 'location_id,latitude,longitude\n' +
        updates.map(u => `"${u.location_id}",${u.latitude},${u.longitude}`).join('\n');
    fs.writeFileSync(csvFile, csvContent);
    console.log(`Written CSV data to: ${csvFile}`);

    console.log('\n=== Done ===');
    console.log('\nTo apply updates, you can:');
    console.log('1. Import the CSV via Supabase dashboard');
    console.log('2. Run the SQL batches via Supabase SQL Editor');
    console.log('3. Use the merge SQL approach below\n');

    // Generate merge SQL
    console.log('Generating merge SQL...');

    // Create temporary table and bulk insert SQL
    const mergeSqlFile = path.join(__dirname, 'geocode_merge.sql');
    let mergeSql = `-- Create temporary geocoding table
CREATE TEMP TABLE geocode_temp (
    location_id TEXT PRIMARY KEY,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION
);

-- Insert geocoding data
INSERT INTO geocode_temp (location_id, latitude, longitude) VALUES
`;

    // Add all values
    const values = updates.map(u =>
        `('${u.location_id.replace(/'/g, "''")}', ${u.latitude}, ${u.longitude})`
    );

    // Split into chunks of 1000 for SQL compatibility
    const chunkSize = 1000;
    const chunks = [];
    for (let i = 0; i < values.length; i += chunkSize) {
        chunks.push(values.slice(i, i + chunkSize));
    }

    mergeSql += chunks[0].join(',\n') + ';\n\n';

    for (let i = 1; i < chunks.length; i++) {
        mergeSql += `INSERT INTO geocode_temp (location_id, latitude, longitude) VALUES\n`;
        mergeSql += chunks[i].join(',\n') + ';\n\n';
    }

    mergeSql += `
-- Update facilities from temp table
UPDATE facilities f
SET 
    latitude = g.latitude,
    longitude = g.longitude
FROM geocode_temp g
WHERE f."Location ID" = g.location_id;

-- Verify
SELECT COUNT(*) as updated FROM facilities WHERE latitude IS NOT NULL;

-- Cleanup
DROP TABLE geocode_temp;
`;

    fs.writeFileSync(mergeSqlFile, mergeSql);
    console.log(`Written merge SQL to: ${mergeSqlFile}`);
    console.log(`Size: ${(fs.statSync(mergeSqlFile).size / 1024 / 1024).toFixed(2)} MB`);
}

main();
