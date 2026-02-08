/**
 * Execute all geocoding SQL batches using Supabase Management API
 * Run with: node run_sql_batches.js
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_PROJECT_ID = 'qdrbwvxqtgwjgitcambn';
const SUPABASE_URL = 'https://qdrbwvxqtgwjgitcambn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkcmJ3dnhxdGd3amdpdGNhbWJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4OTE4NDMsImV4cCI6MjA4NTQ2Nzg0M30.8oJPT8Nyr4FbS2SZp9j9VEsnk5oAumV2_kWNam-RZD4';

// We'll use the Supabase Management API token if available
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function executeSqlViaManagementApi(sql, projectId) {
    if (!SUPABASE_ACCESS_TOKEN) {
        throw new Error('SUPABASE_ACCESS_TOKEN environment variable not set');
    }

    const response = await fetch(`https://api.supabase.com/v1/projects/${projectId}/database/query`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`API error ${response.status}: ${text}`);
    }

    return response.json();
}

async function main() {
    console.log('=== Execute SQL Batches ===\n');

    const batchDir = path.join(__dirname, 'sql_batches');
    const files = fs.readdirSync(batchDir)
        .filter(f => f.startsWith('batch_') && f.endsWith('.sql'))
        .sort();

    console.log(`Found ${files.length} batch files\n`);

    if (!SUPABASE_ACCESS_TOKEN) {
        console.log('WARNING: SUPABASE_ACCESS_TOKEN not set.');
        console.log('The batches cannot be executed programmatically without it.');
        console.log('\nAlternative: Run each batch via Supabase SQL Editor or MCP tool.');
        console.log('Generating output file with all batches...\n');

        // Output all batches to a single file for manual execution
        let allSql = '';
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const sql = fs.readFileSync(path.join(batchDir, file), 'utf8');
            allSql += `-- Batch ${i + 1}/${files.length}: ${file}\n${sql}\n\n`;
        }

        const outputFile = path.join(__dirname, 'all_geocode_batches.sql');
        fs.writeFileSync(outputFile, allSql);
        console.log(`All batches written to: ${outputFile}`);
        console.log(`Total size: ${(fs.statSync(outputFile).size / 1024 / 1024).toFixed(2)} MB`);
        return;
    }

    // Execute batches with the access token
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const sql = fs.readFileSync(path.join(batchDir, file), 'utf8');

        process.stdout.write(`Executing batch ${i + 1}/${files.length} (${file})...`);

        try {
            await executeSqlViaManagementApi(sql, SUPABASE_PROJECT_ID);
            successCount++;
            console.log(' ✓');
        } catch (err) {
            failCount++;
            console.log(` ✗ Error: ${err.message}`);
        }

        // Small delay between batches
        await delay(100);
    }

    console.log(`\n=== Complete ===`);
    console.log(`Success: ${successCount}`);
    console.log(`Failed: ${failCount}`);
}

main();
