require('dotenv').config();
const { pool } = require('./config/database');

const testQuery = async () => {
  try {
    console.log('🔍 Testing database connection and query...');
    
    // Test the exact query from the controller
    const reportSql = `
      SELECT
        cd.id,
        cd.data_date as report_date,
        DATE_FORMAT(cd.data_date, '%Y-%m') as report_month,
        cd.campaign_id,
        c.name as campaign_name,
        ct.type_name as campaign_type,
        COALESCE(b.name, 'Unknown Brand') as brand,
        c.brand as brand_id,
        cd.facebook_result,
        cd.xoho_result as zoho_result,
        (cd.facebook_result + cd.xoho_result) as leads,
        cd.spent,
        cd.card_id,
        cd.card_name,
        CASE 
          WHEN (cd.facebook_result + cd.xoho_result) > 0 
          THEN cd.spent / (cd.facebook_result + cd.xoho_result)
          ELSE NULL 
        END as cost_per_lead,
        CASE 
          WHEN cd.facebook_result > 0 
          THEN cd.spent / cd.facebook_result
          ELSE NULL 
        END as facebook_cost_per_lead,
        CASE 
          WHEN cd.xoho_result > 0 
          THEN cd.spent / cd.xoho_result
          ELSE NULL 
        END as zoho_cost_per_lead,
        cd.created_at,
        cd.updated_at
      FROM campaign_data cd
      LEFT JOIN campaigns c ON cd.campaign_id = c.id
      LEFT JOIN campaign_types ct ON c.campaign_type_id = ct.id
      LEFT JOIN brands b ON c.brand = b.id
      WHERE cd.data_date >= '2025-08-19' AND cd.data_date <= '2025-09-18'
      ORDER BY cd.data_date DESC, cd.id DESC
    `;
    
    const [results] = await pool.query(reportSql);
    
    console.log('\n📊 Query Results:');
    console.log('Total records found:', results.length);
    
    if (results.length > 0) {
      console.log('\n🔍 First record details:');
      const first = results[0];
      console.log({
        campaign_name: first.campaign_name,
        brand: first.brand,
        facebook_result: first.facebook_result,
        zoho_result: first.zoho_result,
        spent: first.spent,
        facebook_cost_per_lead: first.facebook_cost_per_lead,
        zoho_cost_per_lead: first.zoho_cost_per_lead,
        cost_per_lead: first.cost_per_lead
      });
      
      // Manual calculation verification
      const manualFbCost = first.facebook_result > 0 ? first.spent / first.facebook_result : null;
      const manualZohoCost = first.zoho_result > 0 ? first.spent / first.zoho_result : null;
      
      console.log('\n✅ Manual calculation verification:');
      console.log(`Facebook: ${first.spent} ÷ ${first.facebook_result} = ${manualFbCost}`);
      console.log(`Zoho: ${first.spent} ÷ ${first.zoho_result} = ${manualZohoCost}`);
    }
    
    console.log('\n✅ Database test completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    process.exit(1);
  }
};

testQuery();
