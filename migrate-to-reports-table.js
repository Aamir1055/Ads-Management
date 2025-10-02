const mysql = require('mysql2/promise');

async function migrateCampaignDataToReports() {
  let connection;
  
  try {
    console.log('🔄 Migrating campaign_data to reports table...\n');
    
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'ads reporting'
    });
    
    console.log('✅ Connected to database\n');
    
    // 1. Clear existing reports (since we're rebuilding from campaign_data)
    console.log('🧹 Clearing existing reports table...');
    await connection.execute('DELETE FROM reports');
    console.log('✅ Reports table cleared\n');
    
    // 2. Get all campaign_data records
    console.log('📊 Fetching campaign_data records...');
    const [campaignDataRecords] = await connection.execute(`
      SELECT 
        cd.*,
        c.name as campaign_name,
        c.campaign_type_id,
        ct.type_name as campaign_type,
        c.brand as brand_id,
        b.name as brand_name
      FROM campaign_data cd
      LEFT JOIN campaigns c ON cd.campaign_id = c.id
      LEFT JOIN campaign_types ct ON c.campaign_type_id = ct.id
      LEFT JOIN brands b ON c.brand = b.id
      ORDER BY cd.data_date DESC
    `);
    
    console.log(`Found ${campaignDataRecords.length} records to migrate\n`);
    
    if (campaignDataRecords.length === 0) {
      console.log('⚠️  No campaign_data records found. Nothing to migrate.');
      return;
    }
    
    // 3. Convert and insert into reports table
    console.log('🔄 Converting to reports format...');
    
    let insertedCount = 0;
    
    for (const record of campaignDataRecords) {
      try {
        // Calculate values to match the expected format
        const facebookResult = record.facebook_result || 0;
        const zohoResult = record.xoho_result || 0; // Note: xoho_result in campaign_data
        const totalLeads = facebookResult + zohoResult;
        const spent = record.spent || 0;
        const reportDate = record.data_date;
        const reportMonth = reportDate.toISOString().slice(0, 7); // YYYY-MM format
        
        // Insert into reports table
        await connection.execute(`
          INSERT INTO reports (
            report_date,
            report_month, 
            campaign_id,
            campaign_name,
            campaign_type,
            brand,
            leads,
            facebook_result,
            zoho_result,
            spent,
            created_by,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
          reportDate,
          reportMonth,
          record.campaign_id,
          record.campaign_name,
          record.campaign_type,
          record.brand_id,
          totalLeads,
          facebookResult,
          zohoResult,
          spent,
          35 // admin user ID from our previous check
        ]);
        
        insertedCount++;
        console.log(`✅ Migrated: ${record.campaign_name} - ${reportDate.toDateString()} - ${totalLeads} leads, ₹${spent}`);
        
      } catch (insertError) {
        console.log(`❌ Error migrating record ${record.id}:`, insertError.message);
      }
    }
    
    console.log(`\n🎉 Migration completed! Inserted ${insertedCount} records\n`);
    
    // 4. Verify the migration
    console.log('✅ Verifying migration...');
    const [reportsCheck] = await connection.execute(`
      SELECT 
        COUNT(*) as total_records,
        SUM(leads) as total_leads,
        SUM(facebook_result) as total_facebook,
        SUM(zoho_result) as total_zoho,
        SUM(spent) as total_spent,
        MIN(report_date) as earliest_date,
        MAX(report_date) as latest_date
      FROM reports
    `);
    
    const stats = reportsCheck[0];
    console.log('📊 Migration Summary:');
    console.log(`• Total Records: ${stats.total_records}`);
    console.log(`• Total Leads: ${stats.total_leads}`);
    console.log(`• Facebook Results: ${stats.total_facebook}`);
    console.log(`• Zoho Results: ${stats.total_zoho}`);
    console.log(`• Total Spent: ₹${stats.total_spent}`);
    console.log(`• Date Range: ${stats.earliest_date?.toDateString()} to ${stats.latest_date?.toDateString()}`);
    
    // 5. Show sample data in Reports table format
    console.log('\n📋 Sample data in Reports format:');
    const [sampleReports] = await connection.execute(`
      SELECT 
        r.campaign_name,
        b.name as brand_name,
        r.report_date,
        r.facebook_result,
        r.zoho_result,
        r.spent,
        CASE WHEN r.facebook_result > 0 THEN r.spent / r.facebook_result ELSE 0 END as facebook_cost_per_lead,
        CASE WHEN r.zoho_result > 0 THEN r.spent / r.zoho_result ELSE 0 END as zoho_cost_per_lead
      FROM reports r
      LEFT JOIN brands b ON r.brand = b.id
      ORDER BY r.report_date DESC
      LIMIT 3
    `);
    
    sampleReports.forEach((report, index) => {
      console.log(`\n${index + 1}. ${report.campaign_name}`);
      console.log(`   Brand: ${report.brand_name}`);
      console.log(`   Date: ${report.report_date.toLocaleDateString('en-GB')}`);
      console.log(`   Facebook: ${report.facebook_result} leads, ₹${report.facebook_cost_per_lead?.toFixed(2) || '0.00'} cost/lead`);
      console.log(`   Zoho: ${report.zoho_result} leads, ₹${report.zoho_cost_per_lead?.toFixed(2) || '0.00'} cost/lead`);
      console.log(`   Total Spent: ₹${report.spent}`);
    });
    
    console.log('\n✨ Migration complete! Both Dashboard and Reports will now use the same reports table.');
    console.log('🔄 Refresh your Dashboard and Reports page to see consistent data.');
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

migrateCampaignDataToReports().catch(console.error);
