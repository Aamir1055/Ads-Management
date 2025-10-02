const mysql = require('mysql2/promise');

async function verifyMigration() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'ads reporting'
    });
    
    console.log('🔄 Verifying database migration...\n');
    
    // Check the data
    const [reports] = await connection.execute(`
      SELECT 
        campaign_name,
        brand_name,
        leads,
        facebook_result,
        zoho_result,
        spent,
        facebook_cost_per_lead,
        zoho_cost_per_lead
      FROM reports 
      ORDER BY id DESC 
      LIMIT 3
    `);
    
    if (reports.length > 0) {
      console.log('📋 Sample reports with new columns:\n');
      reports.forEach((report, index) => {
        console.log(`Report ${index + 1}:`);
        console.log(`• Campaign: ${report.campaign_name}`);
        console.log(`• Brand: ${report.brand_name || 'N/A'}`);
        console.log(`• Leads: ${report.leads}`);
        console.log(`• Facebook: ${report.facebook_result} leads, ₹${parseFloat(report.facebook_cost_per_lead || 0).toFixed(2)} cost/lead`);
        console.log(`• Zoho: ${report.zoho_result} leads, ₹${parseFloat(report.zoho_cost_per_lead || 0).toFixed(2)} cost/lead`);
        console.log(`• Total Spent: ₹${report.spent}\n`);
      });
      
      const hasAllData = reports.every(r => 
        r.brand_name && 
        r.facebook_cost_per_lead !== null && 
        r.zoho_cost_per_lead !== null
      );
      
      if (hasAllData) {
        console.log('✅ SUCCESS! All columns are present and populated');
        console.log('✅ Dashboard and Reports will now show consistent calculated data\n');
      } else {
        console.log('⚠️  Some calculated fields may be null (this is normal if leads = 0)\n');
      }
    }
    
    // Test the dashboard aggregation query
    console.log('📊 Testing dashboard aggregation...');
    const [dashboardData] = await connection.execute(`
      SELECT 
        COALESCE(SUM(leads), 0) as total_leads,
        COALESCE(SUM(spent), 0) as total_spent,
        COALESCE(
          CASE 
            WHEN SUM(leads) > 0 THEN SUM(spent) / SUM(leads)
            ELSE 0
          END, 0
        ) as avg_cost_per_lead
      FROM reports 
      WHERE report_date >= CURDATE() - INTERVAL 30 DAY
    `);
    
    if (dashboardData.length > 0) {
      const data = dashboardData[0];
      console.log(`✅ Total Leads: ${data.total_leads}`);
      console.log(`✅ Total Spent: ₹${parseFloat(data.total_spent).toFixed(2)}`);
      console.log(`✅ Average Cost/Lead: ₹${parseFloat(data.avg_cost_per_lead).toFixed(2)}\n`);
    }
    
    console.log('🎉 Migration verification complete!');
    console.log('🔄 Your APIs should now return the new calculated columns');
    
  } catch (error) {
    console.error('❌ Verification error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

verifyMigration().catch(console.error);
