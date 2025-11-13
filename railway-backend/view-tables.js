#!/usr/bin/env node

/**
 * Script to view all database tables and their contents
 * Usage: node view-tables.js
 */

const https = require('https');

const API_BASE = 'https://rork-study-buddy-production-eeeb.up.railway.app';

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    https.get(`${API_BASE}${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse JSON: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

async function viewTables() {
  try {
    console.log('📊 Fetching database overview...\n');
    
    // Get all tables
    const tablesResponse = await makeRequest('/db/tables');
    if (!tablesResponse.success) {
      console.error('❌ Failed to fetch tables:', tablesResponse.error);
      return;
    }
    
    const tables = tablesResponse.tables
      .filter(t => t.table_schema === 'public')
      .map(t => t.table_name)
      .sort();
    
    console.log(`Found ${tables.length} tables:\n`);
    
    // For each table, get row count and sample data
    for (const tableName of tables) {
      try {
        // Try the new overview endpoint first
        const overviewResponse = await makeRequest('/db/overview');
        if (overviewResponse.success && overviewResponse.tables[tableName]) {
          const tableInfo = overviewResponse.tables[tableName];
          console.log(`\n📋 Table: ${tableName}`);
          console.log(`   Rows: ${tableInfo.rowCount}`);
          console.log(`   Columns: ${tableInfo.columns.map(c => c.name).join(', ')}`);
          if (tableInfo.sampleData && tableInfo.sampleData.length > 0) {
            console.log(`   Sample data (first ${tableInfo.sampleData.length} rows):`);
            tableInfo.sampleData.forEach((row, i) => {
              console.log(`     Row ${i + 1}:`, JSON.stringify(row, null, 2).split('\n').slice(0, 5).join('\n'));
            });
          } else {
            console.log(`   (No data)`);
          }
          continue;
        }
      } catch (e) {
        // Fallback to individual table endpoint
      }
      
      // Fallback: use individual table endpoint
      try {
        const tableResponse = await makeRequest(`/db/table/${tableName}?limit=3`);
        if (tableResponse.success) {
          console.log(`\n📋 Table: ${tableName}`);
          console.log(`   Total Rows: ${tableResponse.totalRows}`);
          console.log(`   Columns: ${tableResponse.columns.map(c => c.column_name).join(', ')}`);
          if (tableResponse.data && tableResponse.data.length > 0) {
            console.log(`   Sample data (first ${tableResponse.data.length} rows):`);
            tableResponse.data.forEach((row, i) => {
              const rowStr = JSON.stringify(row, null, 2);
              const lines = rowStr.split('\n').slice(0, 10);
              console.log(`     Row ${i + 1}:`, lines.join('\n'));
              if (rowStr.split('\n').length > 10) {
                console.log(`     ... (truncated)`);
              }
            });
          } else {
            console.log(`   (No data)`);
          }
        }
      } catch (e) {
        console.log(`\n📋 Table: ${tableName}`);
        console.log(`   ⚠️  Could not fetch data: ${e.message}`);
      }
    }
    
    console.log('\n✅ Done!');
    console.log('\n💡 Tips:');
    console.log('   - View specific table: curl ' + API_BASE + '/db/table/TABLE_NAME');
    console.log('   - View overview: curl ' + API_BASE + '/db/overview');
    console.log('   - List tables: curl ' + API_BASE + '/db/tables');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

viewTables();

