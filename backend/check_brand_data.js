const { pool } = require('./config/database');

async function checkBrandData() {
  try {
    console.log('🔍 Testing API response for brand_name field...\n');
    
    // Test what the API returns - simulate the reports controller query
    const dataSql = `
      SELECT
        r.id,
        r.campaign_name,
        r.brand as brand_id,
        r.brand_name as raw_brand_name,
        COALESCE(r.brand_name, b.name, 'Unknown Brand') as final_brand_name
      FROM reports r
      LEFT JOIN brands b ON r.brand = b.id
      WHERE r.campaign_name LIKE '%Aamir%' OR r.campaign_name LIKE '%Shaikh%'
      ORDER BY r.report_date DESC, r.id DESC 
      LIMIT 3
    `;
    
    const [rows] = await pool.query(dataSql);
    console.log('📋 API Response Data (as returned by /api/reports):');
    rows.forEach((row, index) => {
      console.log(`Record ${index + 1}:`);
      console.log(`  - Campaign: "${row.campaign_name}"`);
      console.log(`  - Brand ID: ${row.brand_id}`);
      console.log(`  - Raw Brand Name: "${row.raw_brand_name}"`);
      console.log(`  - Final Brand Name: "${row.final_brand_name}"`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await pool.end();
  }
}

checkBrandData();