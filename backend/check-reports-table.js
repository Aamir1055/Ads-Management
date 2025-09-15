const { pool } = require('./config/database');

async function checkReportsTable() {
  console.log('🔍 Checking Reports Table Structure and Data...\n');

  try {
    // Check table structure
    console.log('📊 Reports Table Structure:');
    const [structure] = await pool.query('DESCRIBE reports');
    structure.forEach(row => {
      console.log(`  ${row.Field}: ${row.Type} ${row.Null === 'YES' ? '(nullable)' : '(required)'}`);
    });

    // Check actual data in reports table
    console.log('\n📊 Current Reports Data:');
    const [reports] = await pool.query(`
      SELECT id, campaign_name, report_date, spent, cost_per_lead, leads, created_by
      FROM reports 
      ORDER BY report_date DESC 
      LIMIT 10
    `);

    reports.forEach(report => {
      console.log(`  ID: ${report.id} | ${report.campaign_name} | ${report.report_date} | Spent: $${report.spent} | Leads: ${report.leads} | Cost/Lead: $${report.cost_per_lead} | User: ${report.created_by}`);
    });

    // Check what Saad sees specifically
    console.log('\n👤 Saads Reports Data:');
    const [saadReports] = await pool.query(`
      SELECT id, campaign_name, report_date, spent, cost_per_lead, leads, facebook_result, zoho_result
      FROM reports 
      WHERE created_by = 'Saad'
      ORDER BY report_date DESC
    `);

    if (saadReports.length === 0) {
      console.log('  ❌ No reports found for Saad!');
    } else {
      saadReports.forEach(report => {
        console.log(`  ${report.campaign_name}: $${report.spent} spent, ${report.leads} leads, FB: ${report.facebook_result}, Zoho: ${report.zoho_result}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

checkReportsTable();
