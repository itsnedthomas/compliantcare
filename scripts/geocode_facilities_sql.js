/**
 * Batch Geocoding Script for UK Facilities - SQL Version
 * Uses postcodes.io (free API) to geocode all facilities
 * Generates SQL UPDATE statements for batch execution
 * Run this with: node geocode_facilities_sql.js
 */

const fs = require('fs');
const path = require('path');

const BATCH_SIZE = 100; // postcodes.io allows max 100 per request
const DELAY_MS = 150; // Delay between requests to be polite
const SQL_BATCH_SIZE = 500; // How many updates per SQL file

async function geocodePostcodes(postcodes) {
    // postcodes.io bulk lookup
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

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    console.log('=== UK Facilities Geocoding Script (SQL) ===\n');

    // Read all postcodes from Supabase
    const SUPABASE_URL = 'https://qdrbwvxqtgwjgitcambn.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkcmJ3dnhxdGd3amdpdGNhbWJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4OTE4NDMsImV4cCI6MjA4NTQ2Nzg0M30.8oJPT8Nyr4FbS2SZp9j9VEsnk5oAumV2_kWNam-RZD4';

    try {
        // Step 1: Fetch all facilities
        console.log('Fetching all facilities...');
        let allFacilities = [];
        let offset = 0;
        const pageSize = 1000;

        while (true) {
            const url = `${SUPABASE_URL}/rest/v1/facilities?select=%22Location%20ID%22,%22Location%20Post%20Code%22&latitude=is.null&limit=${pageSize}&offset=${offset}`;

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

            console.log(`Fetched ${allFacilities.length} facilities so far...`);

            if (data.length < pageSize) break;
            offset += pageSize;
        }

        console.log(`\nTotal facilities needing geocoding: ${allFacilities.length}\n`);

        if (allFacilities.length === 0) {
            console.log('All facilities already geocoded!');
            return;
        }

        // Create postcode -> location ID mapping
        const postcodeMap = {};
        for (const f of allFacilities) {
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
        console.log(`Unique postcodes to geocode: ${uniquePostcodes.length}\n`);

        // Step 2: Geocode and collect updates
        const allUpdates = [];
        let geocoded = 0;
        let failed = 0;
        const failedPostcodes = [];

        const totalBatches = Math.ceil(uniquePostcodes.length / BATCH_SIZE);

        for (let i = 0; i < uniquePostcodes.length; i += BATCH_SIZE) {
            const batch = uniquePostcodes.slice(i, i + BATCH_SIZE);
            const batchNum = Math.floor(i / BATCH_SIZE) + 1;

            process.stdout.write(`\rGeocoding batch ${batchNum}/${totalBatches}... (${allUpdates.length} updates so far)`);

            try {
                const results = await geocodePostcodes(batch);

                for (const r of results) {
                    if (r.result) {
                        const lat = r.result.latitude;
                        const lng = r.result.longitude;
                        const locationIds = postcodeMap[r.query.toUpperCase()];

                        if (locationIds) {
                            for (const locId of locationIds) {
                                allUpdates.push({
                                    locationId: locId.replace(/'/g, "''"), // Escape quotes
                                    lat,
                                    lng
                                });
                            }
                        }
                        geocoded++;
                    } else {
                        failed++;
                        failedPostcodes.push(r.query);
                    }
                }

            } catch (err) {
                console.error(`\nBatch ${batchNum} error: ${err.message}`);
            }

            // Rate limiting
            await delay(DELAY_MS);
        }

        console.log(`\n\nGeocoding complete!`);
        console.log(`Postcodes geocoded: ${geocoded}`);
        console.log(`Postcodes failed: ${failed}`);
        console.log(`Total updates to apply: ${allUpdates.length}`);

        // Step 3: Generate SQL file
        console.log(`\nGenerating SQL updates...`);

        // Create one big SQL file
        let sql = '-- Auto-generated geocoding updates\n';
        sql += '-- Generated: ' + new Date().toISOString() + '\n\n';

        for (let i = 0; i < allUpdates.length; i++) {
            const u = allUpdates[i];
            sql += `UPDATE facilities SET latitude = ${u.lat}, longitude = ${u.lng} WHERE "Location ID" = '${u.locationId}';\n`;
        }

        const sqlFile = path.join(__dirname, 'geocode_updates.sql');
        fs.writeFileSync(sqlFile, sql);
        console.log(`\nSQL file written to: ${sqlFile}`);
        console.log(`Total lines: ${allUpdates.length}`);

        // Also save failed postcodes
        if (failedPostcodes.length > 0) {
            const failedFile = path.join(__dirname, 'failed_postcodes.txt');
            fs.writeFileSync(failedFile, failedPostcodes.join('\n'));
            console.log(`Failed postcodes saved to: ${failedFile}`);
        }

        console.log('\n=== Done ===');
        console.log('Run the SQL file using Supabase dashboard or supabase-mcp-server to apply updates.');

    } catch (error) {
        console.error('Error:', error);
    }
}

main();
