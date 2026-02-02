#!/bin/bash
# Execute all geocoding SQL batches via psql
# This script requires the Supabase database connection string

BATCH_DIR="/Users/nedthomas/Desktop/AFO/CompliantCareCRM/scripts/sql_batches"
DATABASE_URL="${SUPABASE_DB_URL:-postgresql://postgres:postgres@db.qdrbwvxqtgwjgitcambn.supabase.co:5432/postgres}"

echo "=== Executing Geocoding SQL Batches ==="
echo "Batch directory: $BATCH_DIR"
echo ""

# Count batch files
TOTAL_FILES=$(ls -1 $BATCH_DIR/batch_*.sql 2>/dev/null | wc -l)
echo "Total batch files: $TOTAL_FILES"
echo ""

if [ "$TOTAL_FILES" -eq 0 ]; then
    echo "No batch files found!"
    exit 1
fi

# Execute each batch file
COUNT=0
for file in "$BATCH_DIR"/batch_*.sql; do
    COUNT=$((COUNT + 1))
    echo -n "[$COUNT/$TOTAL_FILES] Executing $(basename $file)..."
    
    if psql "$DATABASE_URL" -f "$file" > /dev/null 2>&1; then
        echo " ✓"
    else
        echo " ✗"
    fi
done

echo ""
echo "=== Complete ==="

# Check final count
echo "Verifying geocoded count..."
psql "$DATABASE_URL" -c "SELECT COUNT(*) as geocoded FROM facilities WHERE latitude IS NOT NULL;"
