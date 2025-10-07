require('dotenv').config();
const { pool } = require('./config/database');

async function testExactAPIQuery() {
  try {
    console.log('🔍 Testing Exact API Query Execution\n');

    // This is the EXACT query from the getAll function in reportController.js
    const dataSql = `
      SELECT
        r.id,
        r.report_date,
        r.report_month,
        r.campaign_id,
        r.campaign_name,
        r.campaign_type,
        r.brand as brand_id,
        r.brand_name as brand_name,
        r.leads,
        r.facebook_result,
        r.zoho_result,
        r.spent,
        r.cost_per_lead,
        r.created_at,
        r.updated_at
      FROM reports r
      ORDER BY r.report_date DESC, r.id DESC 
      LIMIT ? OFFSET ?
    `;
    
    const limit = 5;
    const offset = 0;
    const params = [limit, offset];
    
    console.log('🔧 Executing query with params:', params);
    console.log('📝 Query:', dataSql);
    
    const [rows] = await pool.query(dataSql, params);
    
    console.log(`\n✅ Query returned ${rows?.length || 0} rows`);
    
    if (rows && rows.length > 0) {
      console.log('\n🔍 First row analysis:');
      console.log('All fields:', Object.keys(rows[0]));
      console.log('\nSpecific fields:');
      console.log('  - id:', rows[0].id, '(', typeof rows[0].id, ')');
      console.log('  - campaign_name:', rows[0].campaign_name, '(', typeof rows[0].campaign_name, ')');
      console.log('  - brand (brand_id):', rows[0].brand_id, '(', typeof rows[0].brand_id, ')');
      console.log('  - brand_name:', rows[0].brand_name, '(', typeof rows[0].brand_name, ')');
      console.log('  - hasOwnProperty brand_name:', rows[0].hasOwnProperty('brand_name'));
      
      console.log('\n🔍 All rows brand_name check:');
      rows.forEach((row, index) => {
        console.log(`${index + 1}. ID: ${row.id} | Campaign: "${row.campaign_name}" | brand_name: "${row.brand_name}" (${typeof row.brand_name})`);
      });
      
      // Check if there's a different field name
      console.log('\n🔍 Looking for alternative brand field names:');
      const firstRow = rows[0];
      Object.keys(firstRow).forEach(key => {
        if (key.toLowerCase().includes('brand')) {
          console.log(`  - ${key}: ${firstRow[key]} (${typeof firstRow[key]})`);
        }
      });
    }

    // Also test with JSON serialization to see if that affects it
    console.log('\n🔍 JSON Serialization Test:');
    const jsonString = JSON.stringify(rows);
    const parsedRows = JSON.parse(jsonString);
    
    if (parsedRows && parsedRows.length > 0) {
      console.log('After JSON serialization:');
      console.log('  - brand_name:', parsedRows[0].brand_name, '(', typeof parsedRows[0].brand_name, ')');
      console.log('  - hasOwnProperty brand_name:', parsedRows[0].hasOwnProperty('brand_name'));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

testExactAPIQuery();
