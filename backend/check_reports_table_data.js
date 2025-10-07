require('dotenv').config();
const { pool } = require('./config/database');

const checkReportsTableData = async () => {
  try {
    console.log('🔍 Checking Reports Table Data...\n');
    
    // Get all records to see actual content
    const [allRecords] = await pool.query('SELECT * FROM reports ORDER BY id LIMIT 10');
    
    console.log(`📊 Found ${allRecords.length} records in reports table:`);
    
    allRecords.forEach((record, index) => {
      console.log(`\n${index + 1}. Record ID: ${record.id}`);
      console.log(`   Campaign: "${record.campaign_name}"`);
      console.log(`   Brand ID: ${record.brand}`);
      console.log(`   Brand Name: "${record.brand_name}" (${record.brand_name === null ? 'NULL' : typeof record.brand_name})`);
      console.log(`   Report Date: ${record.report_date}`);
      console.log(`   Leads: ${record.leads}`);
      console.log(`   Spent: ${record.spent}`);
    });
    
    // Check if brand_name is NULL for all records
    const [nullCheck] = await pool.query('SELECT COUNT(*) as total_records, COUNT(brand_name) as records_with_brand_name FROM reports');
    
    console.log(`\n📈 Brand Name Statistics:`);
    console.log(`   Total records: ${nullCheck[0].total_records}`);
    console.log(`   Records with brand_name: ${nullCheck[0].records_with_brand_name}`);
    console.log(`   Records with NULL brand_name: ${nullCheck[0].total_records - nullCheck[0].records_with_brand_name}`);
    
    if (nullCheck[0].records_with_brand_name === 0) {
      console.log('\n⚠️  All brand_name fields are NULL! This explains why the API returns undefined.');
      console.log('✅ Solution: Need to sync/rebuild the reports table to populate brand_name from brands table.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
};

checkReportsTableData();
