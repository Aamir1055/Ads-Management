const { pool } = require('./config/database');

async function debugReportsSpent() {
  console.log('🔍 Debugging Reports Amount Spent Issue...\n');

  try {
    // 1. Check campaign_data table for Saad's data
    console.log('1️⃣ Checking campaign_data table...');
    const [campaignData] = await pool.query(`
      SELECT cd.id, cd.campaign_id, c.name as campaign_name, cd.spent, cd.data_date, cd.created_by
      FROM campaign_data cd
      LEFT JOIN campaigns c ON cd.campaign_id = c.id
      WHERE c.name LIKE '%Saad%'
      ORDER BY cd.data_date DESC
    `);
    
    console.log('📊 Campaign Data records:');
    campaignData.forEach(record => {
      console.log(`   - Campaign: "${record.campaign_name}", Spent: $${record.spent}, Date: ${record.data_date}, Created by: ${record.created_by}`);
    });
    
    // 2. Check reports table for Saad's data
    console.log('\n2️⃣ Checking reports table...');
    const [reportsData] = await pool.query(`
      SELECT r.id, r.campaign_name, r.spent, r.report_date, r.facebook_result, r.zoho_result, r.leads, r.created_by
      FROM reports r
      WHERE r.campaign_name LIKE '%Saad%'
      ORDER BY r.report_date DESC
    `);
    
    console.log('📊 Reports table records:');
    if (reportsData.length > 0) {
      reportsData.forEach(record => {
        console.log(`   - Campaign: "${record.campaign_name}", Spent: $${record.spent}, Date: ${record.report_date}`);
        console.log(`     Facebook: ${record.facebook_result}, Zoho: ${record.zoho_result}, Leads: ${record.leads}, Created by: ${record.created_by}`);
      });
    } else {
      console.log('   ❌ No reports found for Saad campaigns');
    }
    
    // 3. Check if reports need to be built/rebuilt
    console.log('\n3️⃣ Checking if reports need to be built...');
    
    if (campaignData.length > 0 && reportsData.length === 0) {
      console.log('   🔧 Reports table is empty but campaign_data has data');
      console.log('   💡 SOLUTION: Reports need to be built from campaign_data');
    } else if (campaignData.length > 0 && reportsData.length > 0) {
      // Compare spent amounts
      const campaignSpent = parseFloat(campaignData[0].spent || 0);
      const reportSpent = parseFloat(reportsData[0].spent || 0);
      
      if (campaignSpent !== reportSpent) {
        console.log(`   ❌ MISMATCH: Campaign data shows $${campaignSpent} but report shows $${reportSpent}`);
        console.log('   💡 SOLUTION: Reports need to be rebuilt to sync with campaign_data');
      } else {
        console.log(`   ✅ Data matches: Both show $${campaignSpent} spent`);
      }
    }
    
    // 4. Test the aggregation query that builds reports
    console.log('\n4️⃣ Testing report aggregation query...');
    const testDate = campaignData.length > 0 ? campaignData[0].data_date : '2025-09-13';
    
    const [aggregatedData] = await pool.query(`
      SELECT
        DATE(cd.data_date) AS report_date,
        cd.campaign_id,
        c.name AS campaign_name,
        ct.type_name AS campaign_type,
        c.brand AS brand,
        SUM(cd.facebook_result + cd.xoho_result) AS leads,
        SUM(cd.facebook_result) AS facebook_result,
        SUM(cd.xoho_result) AS zoho_result,
        SUM(cd.spent) AS spent
      FROM campaign_data cd
      LEFT JOIN campaigns c ON cd.campaign_id = c.id
      LEFT JOIN campaign_types ct ON c.campaign_type_id = ct.id
      WHERE cd.data_date = ? AND c.name LIKE '%Saad%'
      GROUP BY report_date, cd.campaign_id, c.name, ct.type_name, c.brand
    `, [testDate]);
    
    console.log(`📊 Aggregated data for ${testDate}:`);
    aggregatedData.forEach(record => {
      console.log(`   - Campaign: "${record.campaign_name}", Spent: $${record.spent}, Leads: ${record.leads}`);
      console.log(`     Facebook: ${record.facebook_result}, Zoho: ${record.zoho_result}`);
    });
    
    // 5. Check the frontend query that gets reports
    console.log('\n5️⃣ Testing the API query that frontend calls...');
    const [frontendData] = await pool.query(`
      SELECT
        r.id,
        r.report_date,
        r.campaign_name as campaign,
        r.brand,
        r.spent,
        r.facebook_result as facebook_results,
        r.zoho_result,
        r.leads as total_results,
        r.spent as amount_spent,
        (r.spent / NULLIF(r.leads, 0)) as cost_per_lead
      FROM reports r
      WHERE r.campaign_name LIKE '%Saad%'
      ORDER BY r.report_date DESC
      LIMIT 10
    `);
    
    console.log('📊 Frontend API result (what Reports page should show):');
    frontendData.forEach(record => {
      console.log(`   - Campaign: "${record.campaign}", Date: ${record.report_date}`);
      console.log(`     Spent: $${record.spent}, Amount Spent: $${record.amount_spent}`);
      console.log(`     Facebook: ${record.facebook_results}, Zoho: ${record.zoho_result}, Total: ${record.total_results}`);
      console.log(`     Cost per Lead: $${record.cost_per_lead}`);
    });

  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    console.log('\n🎯 DIAGNOSIS:');
    console.log('If campaign_data has spent=$90 but reports shows $0:');
    console.log('1. Reports table might be empty (needs building)');
    console.log('2. Reports table has stale data (needs rebuilding)');
    console.log('3. Frontend might be looking at wrong field');
    console.log('\n💡 SOLUTIONS:');
    console.log('1. Build/rebuild reports using POST /api/reports/build');
    console.log('2. Check frontend Reports component for field mapping');
    process.exit(0);
  }
}

debugReportsSpent();
