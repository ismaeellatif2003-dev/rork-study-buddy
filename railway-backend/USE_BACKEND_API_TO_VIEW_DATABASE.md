# How to Use Backend API to View Database Tables and Contents

## 🚀 Available API Endpoints

Your backend has several endpoints to view your database:

### 1. List All Tables
**Endpoint:** `GET /db/tables`

**Usage:**
```bash
curl https://rork-study-buddy-production-eeeb.up.railway.app/db/tables
```

**Response:**
```json
{
  "success": true,
  "tables": [
    {
      "table_schema": "public",
      "table_name": "users",
      "table_type": "BASE TABLE"
    },
    {
      "table_schema": "public",
      "table_name": "notes",
      "table_type": "BASE TABLE"
    }
    // ... more tables
  ]
}
```

### 2. View Specific Table Data
**Endpoint:** `GET /db/table/:tableName`

**Parameters:**
- `tableName` - Name of the table (e.g., `users`, `notes`, `flashcards`)
- `limit` (optional) - Number of rows to return (default: 10)
- `offset` (optional) - Number of rows to skip (default: 0)

**Usage Examples:**
```bash
# View users table (first 10 rows)
curl https://rork-study-buddy-production-eeeb.up.railway.app/db/table/users

# View users table (first 20 rows)
curl https://rork-study-buddy-production-eeeb.up.railway.app/db/table/users?limit=20

# View notes table
curl https://rork-study-buddy-production-eeeb.up.railway.app/db/table/notes

# View flashcards table with pagination
curl https://rork-study-buddy-production-eeeb.up.railway.app/db/table/flashcards?limit=50&offset=0
```

**Response:**
```json
{
  "success": true,
  "tableName": "users",
  "totalRows": 5,
  "showingRows": 5,
  "limit": 10,
  "offset": 0,
  "columns": [
    {
      "column_name": "id",
      "data_type": "integer",
      "is_nullable": "NO"
    },
    {
      "column_name": "email",
      "data_type": "character varying",
      "is_nullable": "NO"
    }
    // ... more columns
  ],
  "data": [
    {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe"
      // ... more fields
    }
    // ... more rows
  ]
}
```

### 3. View Overview of All Tables
**Endpoint:** `GET /db/overview`

**Usage:**
```bash
curl https://rork-study-buddy-production-eeeb.up.railway.app/db/overview
```

**Response:**
```json
{
  "success": true,
  "tables": {
    "users": {
      "rowCount": 5,
      "columns": [
        {"name": "id", "type": "integer"},
        {"name": "email", "type": "character varying"}
      ],
      "sampleData": [
        {"id": 1, "email": "user@example.com"}
      ]
    },
    "notes": {
      "rowCount": 0,
      "columns": [...],
      "sampleData": []
    }
    // ... all tables
  }
}
```

## 📋 Quick Reference: All Your Tables

You can query any of these tables:

1. `users`
2. `notes`
3. `flashcards`
4. `essays`
5. `subscriptions`
6. `subscription_plans`
7. `user_sessions`
8. `user_usage`
9. `sync_events`
10. `mobile_subscriptions`
11. `video_analyses`
12. `user_questions`
13. `user_knowledge_profiles`
14. `note_embeddings`

## 💻 Examples

### View All Tables
```bash
curl https://rork-study-buddy-production-eeeb.up.railway.app/db/tables | python3 -m json.tool
```

### View Users Table
```bash
curl https://rork-study-buddy-production-eeeb.up.railway.app/db/table/users | python3 -m json.tool
```

### View Notes Table (20 rows)
```bash
curl "https://rork-study-buddy-production-eeeb.up.railway.app/db/table/notes?limit=20" | python3 -m json.tool
```

### View Overview (All Tables with Data)
```bash
curl https://rork-study-buddy-production-eeeb.up.railway.app/db/overview | python3 -m json.tool
```

### View Specific Table with Pretty Print
```bash
curl https://rork-study-buddy-production-eeeb.up.railway.app/db/table/flashcards | python3 -m json.tool | less
```

## 🌐 Using in Browser

You can also open these URLs directly in your browser:

- **List tables:** https://rork-study-buddy-production-eeeb.up.railway.app/db/tables
- **View users:** https://rork-study-buddy-production-eeeb.up.railway.app/db/table/users
- **View notes:** https://rork-study-buddy-production-eeeb.up.railway.app/db/table/notes
- **View overview:** https://rork-study-buddy-production-eeeb.up.railway.app/db/overview

**Tip:** Install a browser extension like "JSON Formatter" to make the JSON easier to read.

## 📝 Using JavaScript/Fetch

```javascript
// List all tables
fetch('https://rork-study-buddy-production-eeeb.up.railway.app/db/tables')
  .then(res => res.json())
  .then(data => console.log(data));

// View specific table
fetch('https://rork-study-buddy-production-eeeb.up.railway.app/db/table/users?limit=10')
  .then(res => res.json())
  .then(data => {
    console.log('Total rows:', data.totalRows);
    console.log('Columns:', data.columns);
    console.log('Data:', data.data);
  });

// View overview
fetch('https://rork-study-buddy-production-eeeb.up.railway.app/db/overview')
  .then(res => res.json())
  .then(data => {
    Object.entries(data.tables).forEach(([tableName, info]) => {
      console.log(`${tableName}: ${info.rowCount} rows`);
    });
  });
```

## 🔧 Using Python

```python
import requests
import json

BASE_URL = "https://rork-study-buddy-production-eeeb.up.railway.app"

# List all tables
response = requests.get(f"{BASE_URL}/db/tables")
tables = response.json()
print(json.dumps(tables, indent=2))

# View specific table
response = requests.get(f"{BASE_URL}/db/table/users?limit=10")
data = response.json()
print(f"Total rows: {data['totalRows']}")
print(f"Columns: {[col['column_name'] for col in data['columns']]}")
for row in data['data']:
    print(row)

# View overview
response = requests.get(f"{BASE_URL}/db/overview")
overview = response.json()
for table_name, info in overview['tables'].items():
    print(f"{table_name}: {info['rowCount']} rows")
```

## 🎯 Quick Commands

### See Which Tables Have Data
```bash
curl -s https://rork-study-buddy-production-eeeb.up.railway.app/db/overview | \
  python3 -c "import sys, json; data=json.load(sys.stdin); \
  [print(f\"{name}: {info['rowCount']} rows\") for name, info in data['tables'].items()]"
```

### View All Data in Users Table
```bash
curl -s https://rork-study-buddy-production-eeeb.up.railway.app/db/table/users?limit=100 | python3 -m json.tool
```

### Export Table to File
```bash
curl -s https://rork-study-buddy-production-eeeb.up.railway.app/db/table/users > users.json
```

## ⚠️ Notes

- **Limit:** Default limit is 10 rows. Use `?limit=100` to see more
- **Pagination:** Use `?offset=10&limit=10` to get the next page
- **Empty Tables:** Tables with 0 rows will return empty `data` arrays
- **Error Handling:** If a table doesn't exist, you'll get an error response

## 🚀 Quick Start

**Easiest way to see all your data:**

```bash
# 1. See overview of all tables
curl https://rork-study-buddy-production-eeeb.up.railway.app/db/overview | python3 -m json.tool

# 2. View a specific table
curl https://rork-study-buddy-production-eeeb.up.railway.app/db/table/users | python3 -m json.tool
```

That's it! These endpoints give you full access to view your database through the API.

