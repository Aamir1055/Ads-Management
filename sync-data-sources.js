const mysql = require('mysql2/promise');

async function syncDataSources() {
  let connection;
  
  try {
    console.log('🔍 Checking Data Source Consistency...\n');
    
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'ads reporting'
    });
    
    console.log('✅ Connected to database\n');
    
    // 1. Check campaign_data table (used by Reports page)
    console.log('📊 CAMPAIGN_DATA table (Reports page source):');
    const [campaignData] = await connection.execute(`
      SELECT 
        cd.*,
        c.name as campaign_name,
        b.name as brand_name,
        (cd.facebook_result + cd.xoho_result) as total_leads
      FROM campaign_data cd
      LEFT JOIN campaigns c ON cd.campaign_id = c.id
      LEFT JOIN brands b ON c.brand = b.id
      ORDER BY cd.data_date DESC
    `);
    
    console.log(`Found ${campaignData.length} records:`);
    campaignData.forEach((row, index) => {
      console.log(`\n${index + 1}. ID: ${row.id}`);
      console.log(`   Date: ${row.data_date}`);
      console.log(`   Campaign: ${row.campaign_name} (ID: ${row.campaign_id})`);
      console.log(`   Brand: ${row.brand_name}`);
      console.log(`   Facebook Results: ${row.facebook_result || 0}`);
      console.log(`   Zoho Results: ${row.xoho_result || 0}`);
      console.log(`   Total Leads: ${row.total_leads}`);
      console.log(`   Spent: ₹${row.spent}`);
      console.log(`   Card: ${row.card_name}`);
    });
    
    // 2. Check reports table (used by Dashboard)
    console.log('\n\n📊 REPORTS table (Dashboard source):');
    const [reportsData] = await connection.execute(`
      SELECT 
        id,
        report_date,
        campaign_name,
        leads,
        facebook_result,
        zoho_result,
        spent,
        cost_per_lead
      FROM reports
      ORDER BY report_date DESC
    `);
    
    console.log(`Found ${reportsData.length} records:`);
    reportsData.forEach((row, index) => {
      console.log(`\n${index + 1}. ID: ${row.id}`);
      console.log(`   Date: ${row.report_date}`);
      console.log(`   Campaign: ${row.campaign_name}`);
      console.log(`   Leads: ${row.leads}`);
      console.log(`   Facebook Results: ${row.facebook_result || 0}`);
      console.log(`   Zoho Results: ${row.zoho_result || 0}`);
      console.log(`   Spent: ₹${row.spent}`);
    });
    
    // 3. Recommendation
    console.log('\n\n🎯 ANALYSIS:');
    
    if (campaignData.length > 0 && reportsData.length > 0) {
      console.log('❌ INCONSISTENCY DETECTED!');
      console.log(`• campaign_data has ${campaignData.length} records`);
      console.log(`• reports has ${reportsData.length} records`);
      console.log('• These are different data sources showing different data');
      
      // Calculate totals from both sources
      const campaignDataTotal = {
        leads: campaignData.reduce((sum, row) => sum + (row.total_leads || 0), 0),
        spent: campaignData.reduce((sum, row) => sum + (row.spent || 0), 0)
      };
      
      const reportsTotal = {
        leads: reportsData.reduce((sum, row) => sum + (row.leads || 0), 0),
        spent: reportsData.reduce((sum, row) => sum + (row.spent || 0), 0)
      };
      
      console.log('\n📊 TOTALS COMPARISON:');
      console.log(`• campaign_data: ${campaignDataTotal.leads} leads, ₹${campaignDataTotal.spent}`);
      console.log(`• reports: ${reportsTotal.leads} leads, ₹${reportsTotal.spent}`);
      
    } else if (campaignData.length > 0) {
      console.log('✅ campaign_data has data, reports is empty or test data');
    } else if (reportsData.length > 0) {
      console.log('✅ reports has data, campaign_data is empty');
    } else {
      console.log('⚠️  Both tables are empty');
    }
    
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('1. OPTION A: Make Dashboard use campaign_data (like Reports page)');
    console.log('2. OPTION B: Sync campaign_data → reports table');
    console.log('3. OPTION C: Make Reports page use reports table (like Dashboard)');
    
    console.log('\n🔧 RECOMMENDED SOLUTION:');
    if (campaignData.length > reportsData.length) {
      console.log('Use campaign_data as the single source of truth');
      console.log('→ Modify Dashboard to read from campaign_data');
    } else {
      console.log('Use reports as the single source of truth');
      console.log('→ Modify Reports page to read from reports table');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

syncDataSources().catch(console.error);
