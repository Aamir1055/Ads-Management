const mysql = require('mysql2/promise');
require('dotenv').config();

async function testSync() {
  let connection;
  
  try {
    console.log('🔄 Connecting to database...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT
    });
    console.log('✅ Connected successfully');

    console.log('\n🔍 Checking current synchronization status...');
    
    // Check counts
    const [campaignData] = await connection.query('SELECT COUNT(*) as count FROM campaign_data');
    const [reportsData] = await connection.query('SELECT COUNT(*) as count FROM reports');
    
    console.log(`📊 Campaign Data records: ${campaignData[0].count}`);
    console.log(`📊 Reports records: ${reportsData[0].count}`);
    console.log(`${campaignData[0].count === reportsData[0].count ? '✅' : '❌'} Records are ${campaignData[0].count === reportsData[0].count ? 'synchronized' : 'NOT synchronized'}`);

    // Check sample data
    console.log('\n📋 Sample synchronized data:');
    const [sampleData] = await connection.query(`
      SELECT 
        cd.id as campaign_data_id,
        cd.campaign_id,
        cd.data_date,
        cd.facebook_result,
        cd.xoho_result,
        cd.spent,
        r.id as report_id,
        r.report_date,
        r.campaign_name,
        r.brand_name,
        r.leads,
        r.facebook_result as r_facebook_result,
        r.zoho_result as r_zoho_result,
        r.spent as r_spent
      FROM campaign_data cd
      LEFT JOIN reports r ON cd.campaign_id = r.campaign_id AND cd.data_date = r.report_date
      ORDER BY cd.data_date DESC
      LIMIT 3
    `);

    if (sampleData.length > 0) {
      sampleData.forEach((row, index) => {
        console.log(`\n📝 Record ${index + 1}:`);
        console.log(`   Campaign Data: ID=${row.campaign_data_id}, Date=${row.data_date}, FB=${row.facebook_result}, Zoho=${row.xoho_result}, Spent=${row.spent}`);
        console.log(`   Report Data:   ID=${row.report_id}, Date=${row.report_date}, FB=${row.r_facebook_result}, Zoho=${row.r_zoho_result}, Spent=${row.r_spent}`);
        console.log(`   Campaign: ${row.campaign_name}, Brand: ${row.brand_name}`);
        
        const syncStatus = (row.campaign_data_id && row.report_id && 
                           row.facebook_result == row.r_facebook_result && 
                           row.xoho_result == row.r_zoho_result && 
                           row.spent == row.r_spent) ? '✅ Synced' : '❌ Not synced';
        console.log(`   Status: ${syncStatus}`);
      });
    }

    // Check triggers
    console.log('\n🔧 Checking database triggers:');
    const [triggers] = await connection.query("SHOW TRIGGERS LIKE 'campaign_data'");
    console.log(`✅ Found ${triggers.length} triggers:`);
    triggers.forEach(trigger => {
      console.log(`   - ${trigger.Trigger} (${trigger.Event} ${trigger.Timing})`);
    });

    console.log('\n🎉 Synchronization test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

testSync();
