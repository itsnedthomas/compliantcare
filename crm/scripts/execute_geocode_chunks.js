/**
 * Execute all geocoding insert chunks via Supabase REST API
 * Then apply the final UPDATE to copy coords to facilities table
 * Run with: node execute_geocode_chunks.js
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://qdrbwvxqtgwjgitcambn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkcmJ3dnhxdGd3amdpdGNhbWJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4OTE4NDMsImV4cCI6MjA4NTQ2Nzg0M30.8oJPT8Nyr4FbS2SZp9j9VEsnk5oAumV2_kWNam-RZD4';

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function executeSqlViaRpc(sql) {
    // Direct database query isn't available via anon key
    // We'll need to use the migrations or SQL insert approach
    // For REST API, we'll use individual inserts

    // Parse VALUES from SQL
    const match = sql.match(/VALUES\n([\s\S]+)\nON CONFLICT/);
    if (!match) {
        console.log('Could not parse SQL');
        return false;
    }

    const valuesStr = match[1];
    const rows = [];

    // Parse each row
    const regex = /\('([^']*)', ([\d.-]+), ([\d.-]+)\)/g;
    let rowMatch;
    while ((rowMatch = regex.exec(valuesStr)) !== null) {
        rows.push({
            location_id: rowMatch[1],
            latitude: parseFloat(rowMatch[2]),
            longitude: parseFloat(rowMatch[3])
        });
    }

    // Batch insert via REST API
    const batchSize = 100;
    let inserted = 0;

    for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);

        const response = await fetch(`${SUPABASE_URL}/rest/v1/geocode_lookup`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify(batch)
        });

        if (response.ok) {
            inserted += batch.length;
        } else {
            const text = await response.text();
            console.log(`Insert error: ${text}`);
        }
    }

    return inserted;
}

async function main() {
    console.log('=== Execute Geocode Chunks ===\n');

    const chunkDir = path.join(__dirname, 'insert_chunks');
    const files = fs.readdirSync(chunkDir)
        .filter(f => f.startsWith('chunk_') && f.endsWith('.sql'))
        .sort();

    console.log(`Found ${files.length} chunk files\n`);

    let totalInserted = 0;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const sql = fs.readFileSync(path.join(chunkDir, file), 'utf8');

        process.stdout.write(`[${i + 1}/${files.length}] ${file}...`);

        try {
            const inserted = await executeSqlViaRpc(sql);
            totalInserted += inserted;
            console.log(` inserted ${inserted}`);
        } catch (err) {
            console.log(` error: ${err.message}`);
        }

        // Small delay between chunks
        await delay(200);
    }

    console.log(`\n=== Complete ===`);
    console.log(`Total records inserted: ${totalInserted}`);

    console.log('\nNow run the final update SQL in Supabase:');
    console.log(`
UPDATE facilities f
SET 
    latitude = g.latitude,
    longitude = g.longitude
FROM geocode_lookup g
WHERE f."Location ID" = g.location_id
AND (f.latitude IS NULL);

SELECT COUNT(*) as geocoded FROM facilities WHERE latitude IS NOT NULL;
`);
}

main();
