/**
 * Batch Geocoding Script for UK Facilities - Version 2
 * Uses postcodes.io (free API) to geocode all facilities
 * Uses SQL batch updates for efficiency
 * Run this with: node geocode_facilities_v2.js
 */

const SUPABASE_URL = 'https://qdrbwvxqtgwjgitcambn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkcmJ3dnhxdGd3amdpdGNhbWJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4OTE4NDMsImV4cCI6MjA4NTQ2Nzg0M30.8oJPT8Nyr4FbS2SZp9j9VEsnk5oAumV2_kWNam-RZD4';

const BATCH_SIZE = 100; // postcodes.io allows max 100 per request
const DELAY_MS = 250; // Delay between requests to be polite

async function fetchFacilitiesWithoutCoords() {
    console.log('Fetching facilities that need geocoding...');

    let allFacilities = [];
    let offset = 0;
    const pageSize = 1000;

    while (true) {
        // Properly encode the query with quoted column names
        const url = `${SUPABASE_URL}/rest/v1/facilities?select=%22Location%20ID%22,%22Location%20Post%20Code%22&latitude=is.null&limit=${pageSize}&offset=${offset}`;

        const response = await fetch(url, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Failed to fetch: ${response.status} - ${text}`);
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

async function batchUpdateViaRpc(updates) {
    // Build a VALUES clause for batch update
    // updates = array of { locationId, lat, lng }

    if (updates.length === 0) return;

    // Create JSON array for the RPC call
    const updateData = updates.map(u => ({
        id: u.locationId,
        lat: u.lat,
        lng: u.lng
    }));

    // Use the Supabase RPC endpoint with a raw SQL update
    // For each locationId, update the lat/lng
    const batchSize = 100;
    for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize);

        // Update each facility individually using proper URL encoding
        const promises = batch.map(async (u) => {
            const url = `${SUPABASE_URL}/rest/v1/facilities?%22Location%20ID%22=eq.${encodeURIComponent(u.locationId)}`;

            const response = await fetch(url, {
                method: 'PATCH',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({ latitude: u.lat, longitude: u.lng })
            });

            if (!response.ok) {
                return false;
            }
            return true;
        });

        const results = await Promise.all(promises);
        return results.filter(r => r).length;
    }
}

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    console.log('=== UK Facilities Geocoding Script v2 ===\n');

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

        // Step 2: Batch geocode and update
        let geocoded = 0;
        let failed = 0;
        let updated = 0;

        const totalBatches = Math.ceil(uniquePostcodes.length / BATCH_SIZE);

        for (let i = 0; i < uniquePostcodes.length; i += BATCH_SIZE) {
            const batch = uniquePostcodes.slice(i, i + BATCH_SIZE);
            const batchNum = Math.floor(i / BATCH_SIZE) + 1;

            process.stdout.write(`\rGeocoding batch ${batchNum}/${totalBatches}...`);

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

                // Update database
                if (updates.length > 0) {
                    const count = await batchUpdateViaRpc(updates);
                    updated += updates.length;
                }

            } catch (err) {
                console.error(`\nBatch ${batchNum} error: ${err.message}`);
            }

            // Rate limiting
            await delay(DELAY_MS);
        }

        console.log(`\n\n=== Geocoding Complete ===`);
        console.log(`Postcodes geocoded: ${geocoded}`);
        console.log(`Postcodes failed: ${failed}`);
        console.log(`Facilities queued for update: ${updated}`);

    } catch (error) {
        console.error('Error:', error);
    }
}

main();
