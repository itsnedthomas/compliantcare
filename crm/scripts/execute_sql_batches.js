/**
 * Execute geocoding SQL batches via Supabase
 * This reads batch files and executes them sequentially
 * Run with: node execute_sql_batches.js
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://qdrbwvxqtgwjgitcambn.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

// If no service key, use the anon key and try the RPC endpoint
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkcmJ3dnhxdGd3amdpdGNhbWJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4OTE4NDMsImV4cCI6MjA4NTQ2Nzg0M30.8oJPT8Nyr4FbS2SZp9j9VEsnk5oAumV2_kWNam-RZD4';

async function executeSql(sql, batchNum) {
    try {
        // Note: This requires service role key for DDL/UPDATE operations
        // For now, we'll output the batch info for manual execution via Supabase MCP
        console.log(`Batch ${batchNum}: ${sql.split('\n').length} lines`);
        return true;
    } catch (err) {
        console.error(`Batch ${batchNum} error:`, err.message);
        return false;
    }
}

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    console.log('=== Execute SQL Batches ===\n');

    const batchDir = path.join(__dirname, 'sql_batches');
    const files = fs.readdirSync(batchDir)
        .filter(f => f.startsWith('batch_') && f.endsWith('.sql'))
        .sort();

    console.log(`Found ${files.length} batch files\n`);

    // Output combined SQL for all batches (for manual execution)
    const combinedSql = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const sql = fs.readFileSync(path.join(batchDir, file), 'utf8');
        combinedSql.push(`-- Batch ${i + 1}/${files.length}: ${file}\n${sql}`);
    }

    // Write a single combined file
    const outputFile = path.join(__dirname, 'all_batches_combined.sql');
    fs.writeFileSync(outputFile, combinedSql.join('\n\n'));

    console.log(`Written combined SQL to: ${outputFile}`);
    console.log(`Total size: ${(fs.statSync(outputFile).size / 1024 / 1024).toFixed(2)} MB`);
    console.log('\nExecute this via Supabase SQL Editor or split into smaller chunks.');

    // Also check current geocoding status
    console.log('\n=== Done ===');
}

main();
