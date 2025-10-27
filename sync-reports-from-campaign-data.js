const { pool } = require('./config/database');

/**
 * Sync campaign_data entries to the reports table
 * This ensures the reports table stays up to date with campaign performance data
 */
async function syncReportsFromCampaignData() {
  console.log('🔄 Starting campaign_data to reports sync...\n');

  try {
    // Get campaign_data entries that need to be synced to reports
    const [campaignData] = await pool.query(`
      SELECT
        cd.id as campaign_data_id,
        DATE(cd.data_date) AS report_date,
        CONCAT(YEAR(cd.data_date), '-', LPAD(MONTH(cd.data_date), 2, '0')) AS report_month,
        cd.campaign_id,
        c.name AS campaign_name,
        ct.type_name AS campaign_type,
        c.brand AS brand,
        b.name AS brand_name,
        cd.facebook_result,
        cd.xoho_result,
        (cd.facebook_result + cd.xoho_result) AS leads,
        cd.spent,
        cd.created_by,
        cd.updated_at as campaign_data_updated
      FROM campaign_data cd
      LEFT JOIN campaigns c ON cd.campaign_id = c.id
      LEFT JOIN campaign_types ct ON c.campaign_type_id = ct.id
      LEFT JOIN brands b ON c.brand = b.id
      LEFT JOIN reports r ON (
        r.campaign_id = cd.campaign_id AND 
        DATE(r.report_date) = DATE(cd.data_date)
      )
      WHERE cd.data_date IS NOT NULL 
        AND (r.id IS NULL OR r.updated_at < cd.updated_at)
      ORDER BY cd.data_date DESC, cd.id DESC
    `);

    console.log(`📊 Found ${campaignData.length} campaign_data entries to sync:`);

    if (campaignData.length === 0) {
      console.log('✅ All campaign data is already synced to reports table.');
      return;
    }

    let inserted = 0;
    let updated = 0;
    let errors = 0;

    for (const data of campaignData) {
      const logPrefix = `   ${data.campaign_name || 'Unknown'} (${data.report_date}):`;
      console.log(`${logPrefix} Syncing...`);

      // Calculate cost per lead
      const costPerLead = data.leads > 0 ? parseFloat(data.spent) / parseInt(data.leads) : 0;
      const facebookCostPerLead = data.facebook_result > 0 ? parseFloat(data.spent) / parseInt(data.facebook_result) : 0;
      const zohoCostPerLead = data.xoho_result > 0 ? parseFloat(data.spent) / parseInt(data.xoho_result) : 0;

      try {
        // Use INSERT ... ON DUPLICATE KEY UPDATE for upsert functionality
        const [result] = await pool.query(`
          INSERT INTO reports (
            report_date, 
            report_month, 
            campaign_id, 
            campaign_name, 
            campaign_type, 
            brand, 
            brand_name,
            leads, 
            facebook_result, 
            zoho_result, 
            spent, 
            cost_per_lead,
            facebook_cost_per_lead,
            zoho_cost_per_lead,
            created_by, 
            created_at, 
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
          ON DUPLICATE KEY UPDATE
            report_month = VALUES(report_month),
            campaign_name = VALUES(campaign_name),
            campaign_type = VALUES(campaign_type),
            brand = VALUES(brand),
            brand_name = VALUES(brand_name),
            leads = VALUES(leads),
            facebook_result = VALUES(facebook_result),
            zoho_result = VALUES(zoho_result),
            spent = VALUES(spent),
            cost_per_lead = VALUES(cost_per_lead),
            facebook_cost_per_lead = VALUES(facebook_cost_per_lead),
            zoho_cost_per_lead = VALUES(zoho_cost_per_lead),
            updated_at = NOW()
        `, [
          data.report_date,
          data.report_month,
          data.campaign_id,
          data.campaign_name || 'Unknown Campaign',
          data.campaign_type || 'Unknown Type',
          data.brand || null,
          data.brand_name || 'Unknown Brand',
          parseInt(data.leads) || 0,
          parseInt(data.facebook_result) || 0,
          parseInt(data.xoho_result) || 0,
          parseFloat(data.spent) || 0,
          costPerLead,
          facebookCostPerLead,
          zohoCostPerLead,
          data.created_by || 1
        ]);

        if (result.affectedRows === 1) {
          inserted++;
          console.log(`${logPrefix} ✅ Inserted new report`);
        } else if (result.affectedRows === 2) {
          updated++;
          console.log(`${logPrefix} 🔄 Updated existing report`);
        } else {
          console.log(`${logPrefix} ℹ️ No changes needed`);
        }

      } catch (error) {
        errors++;
        console.log(`${logPrefix} ❌ Error: ${error.message}`);
      }
    }

    console.log(`\n🎉 Sync completed!`);
    console.log(`   📊 Inserted: ${inserted} new reports`);
    console.log(`   🔄 Updated: ${updated} existing reports`);
    if (errors > 0) {
      console.log(`   ❌ Errors: ${errors} failed syncs`);
    }

    // Show latest reports for verification
    const [verification] = await pool.query(`
      SELECT 
        r.campaign_name, 
        r.report_date, 
        r.brand_name,
        r.spent, 
        r.facebook_result, 
        r.zoho_result, 
        r.leads, 
        ROUND(r.cost_per_lead, 2) as cost_per_lead
      FROM reports r
      ORDER BY r.report_date DESC, r.id DESC
      LIMIT 5
    `);

    console.log('\n📊 Latest reports in database:');
    verification.forEach((report, i) => {
      console.log(`   ${i+1}. ${report.campaign_name} (${report.brand_name}): $${report.spent} spent, ${report.leads} leads, $${report.cost_per_lead}/lead`);
    });

  } catch (error) {
    console.error('❌ Failed to sync reports:', error);
    throw error;
  }
}

// Export for use by other modules
module.exports = { syncReportsFromCampaignData };

// Run directly if called as script
if (require.main === module) {
  syncReportsFromCampaignData()
    .then(() => {
      console.log('\n✅ Sync process completed successfully.');
      console.log('💡 You can now refresh the Reports page in your browser to see the updated data.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Sync process failed:', error.message);
      process.exit(1);
    });
}
