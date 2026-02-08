/**
 * Apply geocode updates using the PostgreSQL bulk update function
 * Uses the geocode_data.json file and calls the bulk_update_facility_coords RPC
 * Run: node apply_geocodes_rpc.js
 */

const fs = require('fs');

const SUPABASE_URL = 'https://qdrbwvxqtgwjgitcambn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkcmJ3dnhxdGd3amdpdGNhbWJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4OTE4NDMsImV4cCI6MjA4NTQ2Nzg0M30.8oJPT8Nyr4FbS2SZp9j9VEsnk5oAumV2_kWNam-RZD4';

const BATCH_SIZE = 500;  // Process 500 facilities per RPC call
const DELAY_MS = 300;    // Delay between RPC calls

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function callBulkUpdate(updates) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/bulk_update_facility_coords`, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ updates })
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`RPC call failed: ${response.status} - ${text}`);
    }

    return await response.json();
}

async function main() {
    console.log('=== Applying Geocode Updates via RPC ===\n');

    // Load the geocode data
    const data = JSON.parse(fs.readFileSync('geocode_data.json', 'utf8'));

    console.log(`Loaded ${Object.keys(data.postcodeCoords).length} postcodes`);

    // Build list of all updates in the format the RPC expects
    const allUpdates = [];

    for (const [postcode, locationIds] of Object.entries(data.postcodeToLocationIds)) {
        const coords = data.postcodeCoords[postcode];
        if (coords) {
            for (const locId of locationIds) {
                allUpdates.push({
                    id: locId,
                    lat: coords.lat,
                    lng: coords.lng
                });
            }
        }
    }

    console.log(`Total updates to apply: ${allUpdates.length}\n`);

    // Process in batches
    let processed = 0;
    let updated = 0;

    for (let i = 0; i < allUpdates.length; i += BATCH_SIZE) {
        const batch = allUpdates.slice(i, i + BATCH_SIZE);
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(allUpdates.length / BATCH_SIZE);

        process.stdout.write(`\rProcessing batch ${batchNum}/${totalBatches} (${processed}/${allUpdates.length} done)...`);

        try {
            const count = await callBulkUpdate(batch);
            updated += count || batch.length;
        } catch (err) {
            console.error(`\nBatch ${batchNum} error: ${err.message}`);
        }

        processed += batch.length;

        // Rate limit protection
        await delay(DELAY_MS);
    }

    console.log(`\n\n=== Update Complete ===`);
    console.log(`Processed ${processed} facility updates`);
    console.log(`Updated ${updated} facilities`);
}

main().catch(console.error);
