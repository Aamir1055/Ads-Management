const mysql = require('mysql2/promise');

async function debugReportsTableFields() {
  let connection;
  
  try {
    console.log('🔍 Checking Reports Table Fields...\n');
    
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'ads reporting'
    });
    
    console.log('✅ Connected to database\n');
    
    // Check table structure
    console.log('📊 Reports Table Structure:');
    const [columns] = await connection.execute('DESCRIBE reports');
    columns.forEach(col => {
      console.log(`• ${col.Field} (${col.Type}) - ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} - Default: ${col.Default || 'None'}`);
    });
    
    // Check actual data with all fields
    console.log('\n📋 Raw Reports Table Data:');
    const [reportsData] = await connection.execute(`
      SELECT 
        id,
        report_date,
        campaign_name,
        leads,
        facebook_result,
        zoho_result,
        spent,
        brand
      FROM reports
      ORDER BY id DESC
      LIMIT 3
    `);
    
    reportsData.forEach((report, index) => {
      console.log(`\n${index + 1}. Report ID: ${report.id}`);
      console.log(`   Campaign: ${report.campaign_name}`);
      console.log(`   Date: ${report.report_date}`);
      console.log(`   Leads: ${report.leads}`);
      console.log(`   Facebook Result: ${report.facebook_result} (Type: ${typeof report.facebook_result})`);
      console.log(`   Zoho Result: ${report.zoho_result} (Type: ${typeof report.zoho_result})`);
      console.log(`   Spent: ${report.spent}`);
      console.log(`   Brand ID: ${report.brand}`);
    });
    
    // Check brand join
    console.log('\n🏷️  Testing Brand Join:');
    const [brandJoinTest] = await connection.execute(`
      SELECT 
        r.id,
        r.campaign_name,
        r.brand as brand_id,
        b.name as brand_name,
        r.facebook_result,
        r.zoho_result
      FROM reports r
      LEFT JOIN brands b ON r.brand = b.id
      ORDER BY r.id DESC
      LIMIT 2
    `);
    
    brandJoinTest.forEach((report, index) => {
      console.log(`\n${index + 1}. Report ID: ${report.id}`);
      console.log(`   Campaign: ${report.campaign_name}`);
      console.log(`   Brand ID: ${report.brand_id}`);
      console.log(`   Brand Name: ${report.brand_name} (Type: ${typeof report.brand_name})`);
      console.log(`   Facebook: ${report.facebook_result} (Type: ${typeof report.facebook_result})`);
      console.log(`   Zoho: ${report.zoho_result} (Type: ${typeof report.zoho_result})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

debugReportsTableFields().catch(console.error);
