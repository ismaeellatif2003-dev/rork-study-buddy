#!/bin/bash

# Script to view database contents
# Usage: ./view-database-contents.sh

API_BASE="https://rork-study-buddy-production-eeeb.up.railway.app"

echo "📊 Study Buddy Database Contents"
echo "=================================="
echo ""

# Get all tables
echo "📋 Fetching tables..."
TABLES=$(curl -s "${API_BASE}/db/tables" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if data.get('success'):
    tables = [t['table_name'] for t in data['tables'] if t['table_schema'] == 'public']
    print('\n'.join(tables))
else:
    print('Error:', data.get('error', 'Unknown error'))
    sys.exit(1)
")

if [ $? -ne 0 ]; then
    echo "❌ Failed to fetch tables. Make sure the backend is deployed."
    exit 1
fi

echo ""
echo "Found tables:"
echo "$TABLES" | while read table; do
    echo "  - $table"
done

echo ""
echo "=================================="
echo ""
echo "💡 To view data in Railway:"
echo "   1. Go to Railway Dashboard → PostgreSQL Service → Query tab"
echo "   2. Run: SELECT * FROM users LIMIT 10;"
echo ""
echo "💡 Or use the API endpoints:"
echo "   curl ${API_BASE}/db/overview"
echo "   curl ${API_BASE}/db/table/users"

