const axios = require('axios');
require('dotenv').config();
const { pool } = require('./config/database');

async function testBrandNameFix() {
  try {
    console.log('🧪 Testing Brand Name Fix...\n');

    // 1. Test the backend API directly with the new query
    console.log('1️⃣ Testing Backend API Query (with COALESCE and LEFT JOIN):');
    
    const dataSql = `
      SELECT
        r.id,
        r.campaign_id,
        r.campaign_name,
        r.brand as brand_id,
        COALESCE(r.brand_name, b.name, 'Unknown Brand') as brand_name,
        r.leads,
        r.spent
      FROM reports r
      LEFT JOIN brands b ON r.brand = b.id
      ORDER BY r.report_date DESC, r.id DESC 
      LIMIT 5 OFFSET 0
    `;
    
    const [dbResults] = await pool.query(dataSql);
    
    console.log(`Found ${dbResults.length} records from database:`);
    dbResults.forEach((record, index) => {
      console.log(`${index + 1}. ID: ${record.id} | Campaign: "${record.campaign_name}"`);
      console.log(`   Brand ID: ${record.brand_id} | Brand Name: "${record.brand_name}"`);
      console.log('');
    });

    // 2. Test the API endpoint
    console.log('2️⃣ Testing API Endpoint Response:');
    
    // Login first
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'admin',
      password: 'password'
    });

    const token = loginResponse.data.data.access_token;
    const headers = { 'Authorization': `Bearer ${token}` };

    // Get API response
    const apiResponse = await axios.get('http://localhost:5000/api/reports?limit=5', { headers });
    const apiRecords = apiResponse.data.data;
    
    console.log(`Found ${apiRecords.length} records from API:`);
    apiRecords.forEach((record, index) => {
      console.log(`${index + 1}. ID: ${record.id} | Campaign: "${record.campaign_name}"`);
      console.log(`   Brand ID: ${record.brand} | Brand Name: "${record.brand_name}" (${typeof record.brand_name})`);
      console.log('');
    });

    // 3. Verify expected results
    console.log('3️⃣ Verification:');
    
    const testCampaign = apiRecords.find(r => r.campaign_name === 'Test');
    const aamirCampaign = apiRecords.find(r => r.campaign_name === 'Aamir Ali');
    
    if (testCampaign) {
      const isCorrect = testCampaign.brand_name === 'BazaarFX';
      console.log(`✅ "Test" campaign brand: "${testCampaign.brand_name}" ${isCorrect ? '✅ CORRECT' : '❌ WRONG'}`);
      if (!isCorrect) console.log(`   Expected: "BazaarFX"`);
    } else {
      console.log('❌ "Test" campaign not found');
    }
    
    if (aamirCampaign) {
      const isCorrect = aamirCampaign.brand_name === 'Tradekaro';
      console.log(`✅ "Aamir Ali" campaign brand: "${aamirCampaign.brand_name}" ${isCorrect ? '✅ CORRECT' : '❌ WRONG'}`);
      if (!isCorrect) console.log(`   Expected: "Tradekaro"`);
    } else {
      console.log('❌ "Aamir Ali" campaign not found');
    }

    // 4. Check for numeric brand IDs in response (should be none)
    console.log('\n4️⃣ Checking for Numeric Brand IDs in Response:');
    const numericBrands = apiRecords.filter(r => !isNaN(r.brand_name) && !isNaN(parseFloat(r.brand_name)));
    if (numericBrands.length === 0) {
      console.log('✅ No numeric brand IDs found in brand_name field');
    } else {
      console.log(`❌ Found ${numericBrands.length} records with numeric brand IDs:`);
      numericBrands.forEach(r => {
        console.log(`   Record ${r.id}: brand_name="${r.brand_name}"`);
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  } finally {
    await pool.end();
  }
}

testBrandNameFix();
