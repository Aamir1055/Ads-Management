require('dotenv').config();
const { pool } = require('./config/database');

async function testControllerFixDirect() {
  try {
    console.log('🧪 Testing Controller Fix Directly...\n');
    
    // Test the exact query structure from the updated controller
    console.log('1️⃣ Testing Updated Controller Query:');
    
    const page = 1;
    const limit = 5;
    const offset = (page - 1) * limit;
    const whereClause = '';  // No filters for this test
    const params = [limit, offset];
    
    // This is the EXACT query from the updated controller
    const dataSql = `
      SELECT
        r.id,
        r.report_date,
        r.report_month,
        r.campaign_id,
        r.campaign_name,
        r.campaign_type,
        r.brand as brand_id,
        COALESCE(r.brand_name, b.name, 'Unknown Brand') as brand_name,
        r.leads,
        r.facebook_result,
        r.zoho_result,
        r.spent,
        r.cost_per_lead,
        r.created_at,
        r.updated_at
      FROM reports r
      LEFT JOIN brands b ON r.brand = b.id
      ${whereClause}
      ORDER BY r.report_date DESC, r.id DESC 
      LIMIT ? OFFSET ?
    `;
    
    console.log('Query:', dataSql);
    console.log('Params:', params);
    
    const [rows] = await pool.query(dataSql, params);
    
    console.log(`\n✅ Query returned ${rows?.length || 0} rows`);
    
    if (rows && rows.length > 0) {
      console.log('\n🔍 Results Analysis:');
      
      rows.forEach((row, index) => {
        console.log(`${index + 1}. Record ID: ${row.id}`);
        console.log(`   Campaign: "${row.campaign_name}"`);
        console.log(`   Brand ID: ${row.brand_id}`);
        console.log(`   Brand Name: "${row.brand_name}" (${typeof row.brand_name})`);
        console.log(`   Has brand_name property: ${row.hasOwnProperty('brand_name')}`);
        console.log('');
      });
      
      // Test specific campaigns
      const testCampaign = rows.find(r => r.campaign_name === 'Test');
      const aamirCampaign = rows.find(r => r.campaign_name === 'Aamir Ali');
      
      console.log('🎯 Target Verification:');
      if (testCampaign) {
        console.log(`✅ "Test" campaign: brand_name="${testCampaign.brand_name}" ${testCampaign.brand_name === 'BazaarFX' ? '✅' : '❌'}`);
      }
      
      if (aamirCampaign) {
        console.log(`✅ "Aamir Ali" campaign: brand_name="${aamirCampaign.brand_name}" ${aamirCampaign.brand_name === 'Tradekaro' ? '✅' : '❌'}`);
      }
      
      // Test JSON serialization (what gets sent via API)
      console.log('\n🔄 JSON Serialization Test:');
      const jsonString = JSON.stringify(rows[0]);
      const parsedRow = JSON.parse(jsonString);
      console.log('Original brand_name:', rows[0].brand_name, '(', typeof rows[0].brand_name, ')');
      console.log('After JSON serialization:', parsedRow.brand_name, '(', typeof parsedRow.brand_name, ')');
      console.log('Has brand_name after parsing:', parsedRow.hasOwnProperty('brand_name'));
      
    } else {
      console.log('❌ No rows returned');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

testControllerFixDirect();
