const { pool } = require('./config/database');

async function buildReportsManually() {
  console.log('🔧 Building Reports from Campaign Data...\n');

  try {
    // Get all campaign data that doesn't have corresponding reports
    const [campaignData] = await pool.query(`
      SELECT
        DATE(cd.data_date) AS report_date,
        CONCAT(YEAR(cd.data_date), '-', LPAD(MONTH(cd.data_date), 2, '0')) AS report_month,
        cd.campaign_id,
        c.name AS campaign_name,
        ct.type_name AS campaign_type,
        c.brand AS brand,
        SUM(cd.facebook_result + cd.xoho_result) AS leads,
        SUM(cd.facebook_result) AS facebook_result,
        SUM(cd.xoho_result) AS zoho_result,
        SUM(cd.spent) AS spent,
        cd.created_by
      FROM campaign_data cd
      LEFT JOIN campaigns c ON cd.campaign_id = c.id
      LEFT JOIN campaign_types ct ON c.campaign_type_id = ct.id
      WHERE cd.data_date IS NOT NULL
      GROUP BY report_date, report_month, cd.campaign_id, c.name, ct.type_name, c.brand, cd.created_by
      ORDER BY report_date DESC
    `);

    console.log(`📊 Found ${campaignData.length} campaign data entries to build reports from:`);
    
    let inserted = 0;
    let updated = 0;

    for (const data of campaignData) {
      console.log(`   Processing: ${data.campaign_name} for ${data.report_date} (Spent: $${data.spent})`);
      
      // Calculate cost per lead
      const costPerLead = data.leads > 0 ? (parseFloat(data.spent) / parseInt(data.leads)).toFixed(2) : 0;
      
      try {
        // Upsert into reports table
        const [result] = await pool.query(`
          INSERT INTO reports
            (report_date, report_month, campaign_id, campaign_name, campaign_type, brand, leads, facebook_result, zoho_result, spent, cost_per_lead, created_by, created_at, updated_at)
          VALUES
            (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
          ON DUPLICATE KEY UPDATE
            report_month = VALUES(report_month),
            campaign_name = VALUES(campaign_name),
            campaign_type = VALUES(campaign_type),
            brand = VALUES(brand),
            leads = VALUES(leads),
            facebook_result = VALUES(facebook_result),
            zoho_result = VALUES(zoho_result),
            spent = VALUES(spent),
            cost_per_lead = VALUES(cost_per_lead),
            updated_at = NOW()
        `, [
          data.report_date,
          data.report_month,
          data.campaign_id,
          data.campaign_name || null,
          data.campaign_type || null,
          data.brand || null,
          parseInt(data.leads) || 0,
          parseInt(data.facebook_result) || 0,
          parseInt(data.zoho_result) || 0,
          parseFloat(data.spent) || 0,
          parseFloat(costPerLead) || 0,
          data.created_by
        ]);

        if (result.affectedRows === 1) {
          inserted++;
          console.log(`     ✅ Inserted new report`);
        } else if (result.affectedRows === 2) {
          updated++;
          console.log(`     🔄 Updated existing report`);
        }
        
      } catch (error) {
        console.log(`     ❌ Error: ${error.message}`);
      }
    }

    console.log(`\n🎉 Reports building complete!`);
    console.log(`   📊 Inserted: ${inserted} new reports`);
    console.log(`   🔄 Updated: ${updated} existing reports`);
    
    // Verify the reports were created
    console.log('\n✅ Verification - Checking reports table...');
    const [verification] = await pool.query(`
      SELECT r.campaign_name, r.report_date, r.spent, r.facebook_result, r.zoho_result, r.leads, r.cost_per_lead
      FROM reports r
      ORDER BY r.report_date DESC
      LIMIT 5
    `);
    
    console.log('📊 Latest reports:');
    verification.forEach(report => {
      console.log(`   - ${report.campaign_name}: $${report.spent} spent, ${report.leads} leads, $${report.cost_per_lead}/lead (${report.report_date})`);
    });

  } catch (error) {
    console.error('❌ Failed to build reports:', error);
  } finally {
    console.log('\n🚀 Next Steps:');
    console.log('1. Refresh the Reports page in your browser');
    console.log('2. The Amount Spent column should now show the correct values');
    console.log('3. Saad should see his $90.00 spent amount');
    
    process.exit(0);
  }
}

buildReportsManually();
