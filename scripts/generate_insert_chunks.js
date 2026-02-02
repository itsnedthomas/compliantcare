/**
 * Generate chunked insert SQL files for geocoding data
 * These can be executed via Supabase MCP
 */

const fs = require('fs');
const path = require('path');

function main() {
    console.log('=== Generate Chunked Insert SQL ===\n');

    const jsonFile = path.join(__dirname, 'geocode_data.json');
    const data = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));

    console.log(`Total records: ${data.length}\n`);

    // Generate insert chunks of 500 records each
    const chunkSize = 500;
    const outputDir = path.join(__dirname, 'insert_chunks');

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    let chunkNum = 0;
    for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize);

        const values = chunk.map(d =>
            `('${d.location_id.replace(/'/g, "''")}', ${d.latitude}, ${d.longitude})`
        ).join(',\n');

        const sql = `INSERT INTO geocode_lookup (location_id, latitude, longitude) VALUES
${values}
ON CONFLICT (location_id) DO UPDATE SET latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude;`;

        const filename = path.join(outputDir, `chunk_${String(chunkNum).padStart(3, '0')}.sql`);
        fs.writeFileSync(filename, sql);
        chunkNum++;
    }

    console.log(`Generated ${chunkNum} chunk files in: ${outputDir}`);

    // After all chunks are inserted, we run the final update
    const updateSql = `
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
`;

    fs.writeFileSync(path.join(outputDir, 'final_update.sql'), updateSql);
    console.log('Generated final_update.sql');
}

main();
