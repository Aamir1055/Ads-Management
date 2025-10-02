const mysql = require('mysql2/promise');
require('dotenv').config();

async function testRealtimeSync() {
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

    // Get initial counts
    console.log('\n📊 Initial counts:');
    let [campaignData] = await connection.query('SELECT COUNT(*) as count FROM campaign_data');
    let [reportsData] = await connection.query('SELECT COUNT(*) as count FROM reports');
    console.log(`Campaign Data: ${campaignData[0].count}`);
    console.log(`Reports: ${reportsData[0].count}`);

    // Test 1: INSERT operation
    console.log('\n🧪 Test 1: Testing INSERT synchronization...');
    const testDate = new Date().toISOString().split('T')[0]; // Today's date in YYYY-MM-DD
    const [insertResult] = await connection.query(`
      INSERT INTO campaign_data (campaign_id, facebook_result, xoho_result, spent, data_date, created_by)
      VALUES (22, 100, 150, 500.00, ?, 14)
    `, [testDate]);
    
    console.log(`✅ Inserted campaign data with ID: ${insertResult.insertId}`);
    
    // Check if report was automatically created
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
    [campaignData] = await connection.query('SELECT COUNT(*) as count FROM campaign_data');
    [reportsData] = await connection.query('SELECT COUNT(*) as count FROM reports');
    
    console.log(`New counts - Campaign Data: ${campaignData[0].count}, Reports: ${reportsData[0].count}`);
    
    const [newReport] = await connection.query(`
      SELECT * FROM reports 
      WHERE report_date = ? AND campaign_id = 22 
      ORDER BY id DESC LIMIT 1
    `, [testDate]);
    
    if (newReport.length > 0) {
      console.log('✅ Report automatically created:');
      console.log(`   Campaign: ${newReport[0].campaign_name}`);
      console.log(`   Brand: ${newReport[0].brand_name}`);
      console.log(`   Leads: ${newReport[0].leads} (FB: ${newReport[0].facebook_result}, Zoho: ${newReport[0].zoho_result})`);
      console.log(`   Spent: ${newReport[0].spent}`);
    } else {
      console.log('❌ Report was NOT automatically created');
    }

    // Test 2: UPDATE operation
    console.log('\n🧪 Test 2: Testing UPDATE synchronization...');
    await connection.query(`
      UPDATE campaign_data 
      SET facebook_result = 200, xoho_result = 250, spent = 750.00
      WHERE id = ?
    `, [insertResult.insertId]);
    
    console.log('✅ Updated campaign data');
    
    // Check if report was automatically updated
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
    const [updatedReport] = await connection.query(`
      SELECT * FROM reports 
      WHERE report_date = ? AND campaign_id = 22 
      ORDER BY id DESC LIMIT 1
    `, [testDate]);
    
    if (updatedReport.length > 0 && updatedReport[0].leads === 450) {
      console.log('✅ Report automatically updated:');
      console.log(`   New Leads: ${updatedReport[0].leads} (FB: ${updatedReport[0].facebook_result}, Zoho: ${updatedReport[0].zoho_result})`);
      console.log(`   New Spent: ${updatedReport[0].spent}`);
    } else {
      console.log('❌ Report was NOT automatically updated');
    }

    // Test 3: DELETE operation
    console.log('\n🧪 Test 3: Testing DELETE synchronization...');
    await connection.query(`DELETE FROM campaign_data WHERE id = ?`, [insertResult.insertId]);
    console.log('✅ Deleted campaign data');
    
    // Check if report was automatically deleted
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
    const [deletedReport] = await connection.query(`
      SELECT * FROM reports 
      WHERE report_date = ? AND campaign_id = 22
    `, [testDate]);
    
    if (deletedReport.length === 0) {
      console.log('✅ Report automatically deleted');
    } else {
      console.log('❌ Report was NOT automatically deleted');
    }

    // Final counts
    console.log('\n📊 Final counts:');
    [campaignData] = await connection.query('SELECT COUNT(*) as count FROM campaign_data');
    [reportsData] = await connection.query('SELECT COUNT(*) as count FROM reports');
    console.log(`Campaign Data: ${campaignData[0].count}`);
    console.log(`Reports: ${reportsData[0].count}`);
    console.log(`${campaignData[0].count === reportsData[0].count ? '✅' : '❌'} Tables are ${campaignData[0].count === reportsData[0].count ? 'synchronized' : 'NOT synchronized'}`);

    console.log('\n🎉 Real-time synchronization test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

testRealtimeSync();
