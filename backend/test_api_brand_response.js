const { pool } = require('./config/database');

async function testApiBrandResponse() {
  try {
    console.log('🔍 Testing what the backend API returns for brand_name...\n');
    
    // Test the exact same query that the reports controller uses
    const dataSql = `
      SELECT
        r.id,
        r.campaign_name,
        r.brand as brand_id,
        r.brand_name as stored_brand_name,
        b.name as joined_brand_name,
        COALESCE(r.brand_name, b.name, 'Unknown Brand') as final_brand_name
      FROM reports r
      LEFT JOIN brands b ON r.brand = b.id
      ORDER BY r.report_date DESC, r.id DESC 
      LIMIT 5
    `;
    
    const [rows] = await pool.query(dataSql);
    console.log('📋 What the backend API should return:');
    rows.forEach((row, index) => {
      console.log(`\nRecord ${index + 1}:`);
      console.log(`  - Campaign: "${row.campaign_name}"`);
      console.log(`  - Brand ID: ${row.brand_id}`);
      console.log(`  - Stored Brand Name (r.brand_name): "${row.stored_brand_name}"`);
      console.log(`  - Joined Brand Name (b.name): "${row.joined_brand_name}"`);
      console.log(`  - Final Brand Name (COALESCE): "${row.final_brand_name}"`);
    });
    
    console.log('\n🔍 The issue: The reports table brand_name column might be NULL');
    console.log('   This means the API relies on the LEFT JOIN to brands table');
    console.log('   But the frontend might not be getting this data correctly\n');
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await pool.end();
  }
}

testApiBrandResponse();