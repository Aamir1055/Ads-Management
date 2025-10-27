const mysql = require('mysql2/promise');

async function checkData() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root', 
    password: '',
    database: 'ads reporting',
    port: 3306
  });

  try {
    // Check campaign_data table
    const [campaignData] = await pool.query('SELECT COUNT(*) as count, MIN(data_date) as earliest, MAX(data_date) as latest FROM campaign_data');
    console.log('📊 Campaign Data:', campaignData[0]);

    const [sampleCampaignData] = await pool.query('SELECT * FROM campaign_data ORDER BY data_date DESC LIMIT 3');
    console.log('📋 Sample campaign_data records:');
    sampleCampaignData.forEach((record, i) => {
      console.log(`${i+1}.`, {
        id: record.id,
        campaign_id: record.campaign_id,
        data_date: record.data_date,
        facebook_result: record.facebook_result,
        xoho_result: record.xoho_result,
        spent: record.spent
      });
    });

    // Check reports table
    const [reportsData] = await pool.query('SELECT COUNT(*) as count, MIN(report_date) as earliest, MAX(report_date) as latest FROM reports');
    console.log('\n📈 Reports Table:', reportsData[0]);

    if (reportsData[0].count > 0) {
      const [sampleReports] = await pool.query('SELECT * FROM reports ORDER BY report_date DESC LIMIT 3');
      console.log('📋 Sample reports records:');
      sampleReports.forEach((record, i) => {
        console.log(`${i+1}.`, {
          id: record.id,
          campaign_id: record.campaign_id,
          report_date: record.report_date,
          leads: record.leads,
          spent: record.spent
        });
      });
    } else {
      console.log('❌ Reports table is empty!');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkData();
