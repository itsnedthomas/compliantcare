/**
 * Execute geocoding SQL updates via direct SQL calls
 * Run with: node apply_geocode_updates.js
 */

const fs = require('fs');
const path = require('path');

const BATCH_SIZE = 200; // Update 200 records at a time

async function executeSql(sql) {
    // This will just log the SQL for manual execution
    // In production, you'd call the Supabase admin API
    return true;
}

async function main() {
    console.log('=== Applying Geocoding Updates ===\n');

    const sqlFile = path.join(__dirname, 'geocode_updates.sql');
    const content = fs.readFileSync(sqlFile, 'utf8');

    // Parse each UPDATE statement
    const lines = content.split('\n')
        .filter(line => line.startsWith('UPDATE'))
        .map(line => {
            // Extract: UPDATE facilities SET latitude = X, longitude = Y WHERE "Location ID" = 'Z';
            const match = line.match(/latitude = ([\d.-]+), longitude = ([\d.-]+) WHERE "Location ID" = '([^']+)'/);
            if (match) {
                return {
                    lat: parseFloat(match[1]),
                    lng: parseFloat(match[2]),
                    id: match[3]
                };
            }
            return null;
        })
        .filter(Boolean);

    console.log(`Parsed ${lines.length} update statements\n`);

    // Create batched CASE statements for efficiency
    const sqlBatches = [];

    for (let i = 0; i < lines.length; i += BATCH_SIZE) {
        const batch = lines.slice(i, i + BATCH_SIZE);

        const cases = batch.map(u =>
            `WHEN '${u.id}' THEN ${u.lat}`
        ).join('\n        ');

        const lngCases = batch.map(u =>
            `WHEN '${u.id}' THEN ${u.lng}`
        ).join('\n        ');

        const ids = batch.map(u => `'${u.id}'`).join(', ');

        const sql = `UPDATE facilities 
SET latitude = CASE "Location ID"
        ${cases}
        ELSE latitude
    END,
    longitude = CASE "Location ID"
        ${lngCases}
        ELSE longitude
    END
WHERE "Location ID" IN (${ids});`;

        sqlBatches.push(sql);
    }

    console.log(`Generated ${sqlBatches.length} batch SQL statements\n`);

    // Write batches to files for execution
    const outputDir = path.join(__dirname, 'sql_batches');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    for (let i = 0; i < sqlBatches.length; i++) {
        const filename = path.join(outputDir, `batch_${String(i).padStart(3, '0')}.sql`);
        fs.writeFileSync(filename, sqlBatches[i]);
    }

    console.log(`Written batch files to: ${outputDir}`);
    console.log(`Total batches: ${sqlBatches.length}`);

    // Also create a master script that combines smaller batches
    console.log('\nCreating combined batches for manual execution...');

    const combinedSize = 10; // Combine 10 batches into one file
    for (let i = 0; i < sqlBatches.length; i += combinedSize) {
        const combined = sqlBatches.slice(i, i + combinedSize).join('\n\n');
        const filename = path.join(outputDir, `combined_${String(Math.floor(i / combinedSize)).padStart(2, '0')}.sql`);
        fs.writeFileSync(filename, combined);
    }

    console.log(`Created ${Math.ceil(sqlBatches.length / combinedSize)} combined batch files`);
    console.log('\nDone! Execute the combined_*.sql files via Supabase SQL editor.');
}

main();
