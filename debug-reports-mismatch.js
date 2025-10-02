const mysql = require('mysql2/promise');

async function debugReportsMismatch() {
  let connection;
  
  try {
    console.log('🔍 Debugging Reports vs Dashboard Data Mismatch...\n');
    
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'ads reporting'
    });
    
    console.log('✅ Connected to database\n');
    
    // 1. Show all reports table data
    console.log('📋 ALL DATA in reports table:');
    const [allReports] = await connection.execute(`
      SELECT 
        id,
        report_date,
        campaign_id,
        campaign_name,
        brand,
        leads,
        facebook_result,
        zoho_result,
        spent,
        cost_per_lead,
        created_at
      FROM reports 
      ORDER BY report_date DESC
    `);
    
    console.log(`Found ${allReports.length} records:`);
    allReports.forEach((report, index) => {
      console.log(`\n${index + 1}. Record ID: ${report.id}`);
      console.log(`   Date: ${report.report_date}`);
      console.log(`   Campaign: ${report.campaign_name} (ID: ${report.campaign_id})`);
      console.log(`   Brand: ${report.brand}`);
      console.log(`   Leads: ${report.leads}`);
      console.log(`   Facebook Results: ${report.facebook_result || 0}`);
      console.log(`   Zoho Results: ${report.zoho_result || 0}`);
      console.log(`   Spent: ₹${report.spent}`);
      console.log(`   Cost/Lead: ₹${report.cost_per_lead || 'N/A'}`);
      console.log(`   Created: ${report.created_at}`);
    });
    
    // 2. Run the same query the dashboard uses
    console.log('\n\n📊 DASHBOARD QUERY RESULTS:');
    const [dashboardStats] = await connection.execute(`
      SELECT
        COUNT(DISTINCT campaign_id) as campaigns_count,
        SUM(leads) as total_leads,
        SUM(spent) as total_spent,
        AVG(cost_per_lead) as avg_cost_per_lead,
        SUM(facebook_result) as facebook_results,
        SUM(zoho_result) as zoho_results
      FROM reports
    `);
    
    const stats = dashboardStats[0];
    console.log('Dashboard calculated totals:');
    console.log(`• Campaigns Count: ${stats.campaigns_count}`);
    console.log(`• Total Leads: ${stats.total_leads}`);
    console.log(`• Total Spent: ₹${stats.total_spent}`);
    console.log(`• Avg Cost/Lead: ₹${stats.avg_cost_per_lead?.toFixed(2) || 0}`);
    console.log(`• Facebook Results: ${stats.facebook_results || 0}`);
    console.log(`• Zoho Results: ${stats.zoho_results || 0}`);
    
    // 3. Check what table the Reports page might be reading from
    console.log('\n\n🔍 CHECKING OTHER POSSIBLE TABLES:');
    
    // Check if there's data in other related tables
    const tables = ['campaign_data', 'campaigns', 'campaign', 'reports'];
    
    for (const table of tables) {
      try {
        const [tableData] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`• ${table}: ${tableData[0].count} records`);
        
        if (tableData[0].count > 0 && table !== 'reports') {
          // Show sample data from other tables
          const [sample] = await connection.execute(`SELECT * FROM ${table} LIMIT 2`);
          console.log(`  Sample data:`, sample[0]);
        }
      } catch (error) {
        console.log(`• ${table}: Error - ${error.message}`);
      }
    }
    
    // 4. Check the specific data that should match the Reports page
    console.log('\n\n🎯 CHECKING FOR THE SPECIFIC DATA SHOWN IN REPORTS PAGE:');
    console.log('Looking for TK TAMIL campaign with ₹1,000 spent...');
    
    const [specificReport] = await connection.execute(`
      SELECT * FROM reports 
      WHERE campaign_name LIKE '%TK TAMIL%' 
      AND spent = 1000
    `);
    
    if (specificReport.length > 0) {
      console.log('✅ Found matching record in reports table:');
      console.log(specificReport[0]);
    } else {
      console.log('❌ No matching record found in reports table');
      console.log('This suggests the Reports page is reading from a different source!');
    }
    
    // 5. Check if there are multiple data sources
    console.log('\n\n🔍 POSSIBLE EXPLANATIONS:');
    console.log('1. Reports page might be reading from campaign_data table');
    console.log('2. Dashboard and Reports page use different APIs/controllers');
    console.log('3. Data was inserted in wrong table');
    console.log('4. Different date filtering is applied');
    
    console.log('\n💡 RECOMMENDATION:');
    console.log('Check the Reports page frontend code to see which API it calls');
    console.log('and compare with dashboard API endpoints');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

debugReportsMismatch().catch(console.error);
