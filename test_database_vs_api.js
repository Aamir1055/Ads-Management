require('dotenv').config();
const { pool } = require('./config/database');
const axios = require('axios');

async function testDatabaseVsAPI() {
  try {
    console.log('🔍 Comprehensive Test: Database vs API Response\n');

    // 1. Get direct database query results
    console.log('1️⃣ Direct Database Query:');
    const [dbRecords] = await pool.query(`
      SELECT
        r.id,
        r.campaign_name,
        r.brand as brand_id,
        r.brand_name,
        r.report_date,
        r.leads,
        r.spent
      FROM reports r
      ORDER BY r.report_date DESC, r.id DESC
      LIMIT 5
    `);
    
    console.log(`Found ${dbRecords.length} records in database:`);
    dbRecords.forEach((record, index) => {
      console.log(`${index + 1}. ID: ${record.id} | Campaign: "${record.campaign_name}" | Brand: ${record.brand_id} | Brand Name: "${record.brand_name}"`);
    });

    // 2. Login to API
    console.log('\n2️⃣ API Login:');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'admin',
      password: 'password'
    });
    const token = loginResponse.data.data.access_token;
    const headers = { 'Authorization': `Bearer ${token}` };
    console.log('✅ Login successful');

    // 3. Get API response
    console.log('\n3️⃣ API Response:');
    const apiResponse = await axios.get('http://localhost:5000/api/reports?limit=5', { headers });
    const apiRecords = apiResponse.data.data;
    
    console.log(`Found ${apiRecords.length} records from API:`);
    apiRecords.forEach((record, index) => {
      console.log(`${index + 1}. ID: ${record.id} | Campaign: "${record.campaign_name}" | Brand: ${record.brand} | Brand Name: "${record.brand_name}" (${typeof record.brand_name})`);
    });

    // 4. Compare results
    console.log('\n4️⃣ Comparison:');
    
    if (dbRecords.length !== apiRecords.length) {
      console.log(`⚠️  Record count mismatch: DB has ${dbRecords.length}, API has ${apiRecords.length}`);
    }

    // Compare each record
    for (let i = 0; i < Math.min(dbRecords.length, apiRecords.length); i++) {
      const dbRecord = dbRecords[i];
      const apiRecord = apiRecords[i];
      
      console.log(`\nRecord ${i + 1} comparison:`);
      console.log(`  ID: DB=${dbRecord.id}, API=${apiRecord.id} ${dbRecord.id === apiRecord.id ? '✅' : '❌'}`);
      console.log(`  Campaign: DB="${dbRecord.campaign_name}", API="${apiRecord.campaign_name}" ${dbRecord.campaign_name === apiRecord.campaign_name ? '✅' : '❌'}`);
      console.log(`  Brand ID: DB=${dbRecord.brand_id}, API=${apiRecord.brand} ${dbRecord.brand_id === apiRecord.brand ? '✅' : '❌'}`);
      console.log(`  Brand Name: DB="${dbRecord.brand_name}", API="${apiRecord.brand_name}" ${dbRecord.brand_name === apiRecord.brand_name ? '✅' : '❌'}`);
      
      if (dbRecord.brand_name && apiRecord.brand_name === undefined) {
        console.log(`  🚨 ISSUE: Database has "${dbRecord.brand_name}" but API returns undefined!`);
      }
    }

    // 5. Test the exact SQL query used by the API endpoint
    console.log('\n5️⃣ Testing Exact API Query:');
    const apiQuery = `
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
      LIMIT 5 OFFSET 0
    `;
    
    const [exactQueryResults] = await pool.query(apiQuery);
    console.log(`Exact API query returned ${exactQueryResults.length} records:`);
    exactQueryResults.forEach((record, index) => {
      console.log(`${index + 1}. ID: ${record.id} | Brand Name: "${record.brand_name}" (${typeof record.brand_name})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  } finally {
    await pool.end();
  }
}

testDatabaseVsAPI();
