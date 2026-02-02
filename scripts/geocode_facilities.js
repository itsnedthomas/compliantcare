/**
 * Batch Geocoding Script for UK Facilities
 * Uses postcodes.io (free API) to geocode all facilities
 * Run this with: node geocode_facilities.js
 */

const SUPABASE_URL = 'https://qdrbwvxqtgwjgitcambn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkcmJ3dnhxdGd3amdpdGNhbWJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4OTE4NDMsImV4cCI6MjA4NTQ2Nzg0M30.8oJPT8Nyr4FbS2SZp9j9VEsnk5oAumV2_kWNam-RZD4';

const BATCH_SIZE = 100; // postcodes.io allows max 100 per request
const DELAY_MS = 200; // Delay between requests to be polite

async function fetchFacilitiesWithoutCoords() {
    console.log('Fetching facilities that need geocoding...');

    let allFacilities = [];
    let offset = 0;
    const pageSize = 1000;

    while (true) {
        const url = `${SUPABASE_URL}/rest/v1/facilities?select="Location ID","Location Post Code"&latitude=is.null&limit=${pageSize}&offset=${offset}`;

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

    return allFacilities;
}

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

async function updateFacilityCoords(locationId, lat, lng) {
    // Column name with space needs quotes in Supabase REST API
    const url = `${SUPABASE_URL}/rest/v1/facilities?%22Location%20ID%22=eq.${encodeURIComponent(locationId)}`;

    const response = await fetch(url, {
        method: 'PATCH',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ latitude: lat, longitude: lng })
    });

    if (!response.ok) {
        const text = await response.text();
        console.error(`Failed to update ${locationId}: ${response.status} - ${text}`);
    }
}

async function batchUpdateCoords(updates) {
    // Updates is array of { locationId, lat, lng }
    const promises = updates.map(u => updateFacilityCoords(u.locationId, u.lat, u.lng));
    await Promise.all(promises);
}

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    console.log('=== UK Facilities Geocoding Script ===\n');

    try {
        // Step 1: Fetch all facilities without coordinates
        const facilities = await fetchFacilitiesWithoutCoords();
        console.log(`\nFound ${facilities.length} facilities needing geocoding\n`);

        if (facilities.length === 0) {
            console.log('All facilities already geocoded!');
            return;
        }

        // Create postcode -> location ID mapping
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

        // Step 2: Batch geocode
        let geocoded = 0;
        let failed = 0;
        let updated = 0;

        for (let i = 0; i < uniquePostcodes.length; i += BATCH_SIZE) {
            const batch = uniquePostcodes.slice(i, i + BATCH_SIZE);

            process.stdout.write(`\rGeocoding batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(uniquePostcodes.length / BATCH_SIZE)}...`);

            try {
                const results = await geocodePostcodes(batch);
                const updates = [];

                for (const r of results) {
                    if (r.result) {
                        const lat = r.result.latitude;
                        const lng = r.result.longitude;
                        const locationIds = postcodeMap[r.query.toUpperCase()];

                        if (locationIds) {
                            for (const locId of locationIds) {
                                updates.push({ locationId: locId, lat, lng });
                            }
                        }
                        geocoded++;
                    } else {
                        failed++;
                    }
                }

                // Update database in batches of 50 updates at a time
                for (let j = 0; j < updates.length; j += 50) {
                    await batchUpdateCoords(updates.slice(j, j + 50));
                    updated += Math.min(50, updates.length - j);
                }

            } catch (err) {
                console.error(`\nBatch error: ${err.message}`);
            }

            // Rate limiting
            await delay(DELAY_MS);
        }

        console.log(`\n\n=== Geocoding Complete ===`);
        console.log(`Postcodes geocoded: ${geocoded}`);
        console.log(`Postcodes failed: ${failed}`);
        console.log(`Facilities updated: ${updated}`);

    } catch (error) {
        console.error('Error:', error);
    }
}

main();
