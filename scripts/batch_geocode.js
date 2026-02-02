/**
 * Batch Geocoding Script for UK Facilities - Improved Version
 * Uses postcodes.io (free API) and batch SQL updates via file output
 * Run this with: node batch_geocode.js
 */

const fs = require('fs');

const SUPABASE_URL = 'https://qdrbwvxqtgwjgitcambn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkcmJ3dnhxdGd3amdpdGNhbWJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4OTE4NDMsImV4cCI6MjA4NTQ2Nzg0M30.8oJPT8Nyr4FbS2SZp9j9VEsnk5oAumV2_kWNam-RZD4';

const BATCH_SIZE = 100; // postcodes.io allows max 100 per request  
const DELAY_MS = 250; // Delay between requests

async function fetchAllFacilities() {
    console.log('Fetching all facilities...');

    let allFacilities = [];
    let offset = 0;
    const pageSize = 1000;

    while (true) {
        const url = `${SUPABASE_URL}/rest/v1/facilities?select="Location ID","Location Post Code"&limit=${pageSize}&offset=${offset}`;

        const response = await fetch(url, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.status}`);
        }

        const data = await response.json();
        allFacilities = allFacilities.concat(data);

        console.log(`Fetched ${allFacilities.length} facilities...`);

        if (data.length < pageSize) break;
        offset += pageSize;
    }

    return allFacilities;
}

async function geocodePostcodes(postcodes) {
    const response = await fetch('https://api.postcodes.io/postcodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postcodes: postcodes })
    });

    if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.status}`);
    }

    const data = await response.json();
    return data.result;
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    console.log('=== UK Facilities Batch Geocoding ===\n');

    try {
        // Fetch all facilities
        const facilities = await fetchAllFacilities();
        console.log(`\nTotal facilities: ${facilities.length}\n`);

        // Build postcode -> location IDs mapping
        const postcodeMap = {};
        for (const f of facilities) {
            const postcode = f['Location Post Code'];
            if (postcode && postcode.trim()) {
                const cleanPostcode = postcode.trim().toUpperCase();
                if (!postcodeMap[cleanPostcode]) {
                    postcodeMap[cleanPostcode] = [];
                }
                postcodeMap[cleanPostcode].push(f['Location ID']);
            }
        }

        const uniquePostcodes = Object.keys(postcodeMap);
        console.log(`Unique postcodes to geocode: ${uniquePostcodes.length}`);

        // Geocode all postcodes and build coordinate map
        const coordMap = {}; // postcode -> {lat, lng}
        let geocoded = 0;
        let failed = 0;

        for (let i = 0; i < uniquePostcodes.length; i += BATCH_SIZE) {
            const batch = uniquePostcodes.slice(i, i + BATCH_SIZE);
            const batchNum = Math.floor(i / BATCH_SIZE) + 1;
            const totalBatches = Math.ceil(uniquePostcodes.length / BATCH_SIZE);

            process.stdout.write(`\rGeocoding batch ${batchNum}/${totalBatches}...`);

            try {
                const results = await geocodePostcodes(batch);

                for (const r of results) {
                    if (r.result) {
                        coordMap[r.query.toUpperCase()] = {
                            lat: r.result.latitude,
                            lng: r.result.longitude
                        };
                        geocoded++;
                    } else {
                        failed++;
                    }
                }
            } catch (err) {
                console.error(`\nBatch ${batchNum} error: ${err.message}`);
            }

            await delay(DELAY_MS);
        }

        console.log(`\n\nGeocoding complete!`);
        console.log(`Postcodes geocoded: ${geocoded}`);
        console.log(`Postcodes failed: ${failed}`);

        // Save the coordinate map to a JSON file
        const outputData = {
            generatedAt: new Date().toISOString(),
            totalPostcodes: Object.keys(coordMap).length,
            postcodeToLocationIds: postcodeMap,
            postcodeCoords: coordMap
        };

        fs.writeFileSync('geocode_data.json', JSON.stringify(outputData, null, 2));
        console.log(`\nSaved geocode data to geocode_data.json`);

        // Now generate SQL update statements in batches
        const sqlStatements = [];
        const locationIds = Object.keys(postcodeMap).flatMap(postcode => {
            const coords = coordMap[postcode];
            if (coords) {
                return postcodeMap[postcode].map(locId => ({
                    locId,
                    lat: coords.lat,
                    lng: coords.lng
                }));
            }
            return [];
        });

        console.log(`\nTotal locations to update: ${locationIds.length}`);

        // Create update SQL file in chunks
        const SQL_BATCH_SIZE = 500;
        let sqlFile = '-- Batch coordinate updates\n';

        for (let i = 0; i < locationIds.length; i += SQL_BATCH_SIZE) {
            const chunk = locationIds.slice(i, i + SQL_BATCH_SIZE);

            // Build CASE statement for this batch
            let sql = 'UPDATE facilities SET latitude = CASE "Location ID"\n';
            for (const item of chunk) {
                sql += `  WHEN '${item.locId.replace(/'/g, "''")}' THEN ${item.lat}\n`;
            }
            sql += 'END, longitude = CASE "Location ID"\n';
            for (const item of chunk) {
                sql += `  WHEN '${item.locId.replace(/'/g, "''")}' THEN ${item.lng}\n`;
            }
            sql += `END WHERE "Location ID" IN (${chunk.map(i => `'${i.locId.replace(/'/g, "''")}'`).join(',')});\n\n`;

            sqlFile += sql;
        }

        fs.writeFileSync('update_coords.sql', sqlFile);
        console.log(`\nGenerated SQL file: update_coords.sql`);
        console.log(`Contains ${Math.ceil(locationIds.length / SQL_BATCH_SIZE)} batch UPDATE statements`);

    } catch (error) {
        console.error('Error:', error);
    }
}

main();
