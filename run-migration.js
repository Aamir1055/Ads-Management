const mysql = require('mysql2/promise');

async function runMigration() {
  let connection;
  
  try {
    console.log('🔄 Connecting to database...');
    
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'ads reporting'
    });
    
    console.log('✅ Connected to database');
    
    // Step 1: Add columns
    console.log('\n📝 Adding missing columns...');
    
    try {
      await connection.execute(`
        ALTER TABLE reports
        ADD COLUMN brand_name varchar(255) NULL COMMENT 'Denormalized brand name for reporting' AFTER brand
      `);
      console.log('✅ Added brand_name column');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  brand_name column already exists');
      } else {
        throw error;
      }
    }
    
    try {
      await connection.execute(`
        ALTER TABLE reports
        ADD COLUMN facebook_cost_per_lead decimal(10,2) GENERATED ALWAYS AS (CASE WHEN facebook_result > 0 THEN spent / facebook_result ELSE NULL END) STORED AFTER spent
      `);
      console.log('✅ Added facebook_cost_per_lead column');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  facebook_cost_per_lead column already exists');
      } else {
        throw error;
      }
    }
    
    try {
      await connection.execute(`
        ALTER TABLE reports
        ADD COLUMN zoho_cost_per_lead decimal(10,2) GENERATED ALWAYS AS (CASE WHEN zoho_result > 0 THEN spent / zoho_result ELSE NULL END) STORED AFTER facebook_cost_per_lead
      `);
      console.log('✅ Added zoho_cost_per_lead column');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('⚠️  zoho_cost_per_lead column already exists');
      } else {
        throw error;
      }
    }
    
    // Step 2: Add indexes
    console.log('\n📊 Adding performance indexes...');
    
    const indexes = [
      { name: 'idx_reports_report_date', column: 'report_date' },
      { name: 'idx_reports_report_month', column: 'report_month' },
      { name: 'idx_reports_campaign', column: 'campaign_id' }
    ];
    
    for (const index of indexes) {
      try {
        await connection.execute(`CREATE INDEX ${index.name} ON reports(${index.column})`);
        console.log(`✅ Added index: ${index.name}`);
      } catch (error) {
        if (error.code === 'ER_DUP_KEYNAME') {
          console.log(`⚠️  Index ${index.name} already exists`);
        } else {
          console.log(`❌ Failed to add index ${index.name}:`, error.message);
        }
      }
    }
    
    // Step 3: Backfill brand names
    console.log('\n🔄 Backfilling brand names...');
    
    const [result] = await connection.execute(`
      UPDATE reports r
      LEFT JOIN brands b ON r.brand = b.id
      SET r.brand_name = b.name
      WHERE r.brand_name IS NULL
    `);
    
    console.log(`✅ Updated ${result.affectedRows} reports with brand names`);
    
    // Step 4: Verify the results
    console.log('\n📋 Verifying results...');
    
    const [testData] = await connection.execute(`
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
    
    if (testData.length > 0) {
      console.log('\n📋 Sample reports with new columns:');
      testData.forEach((report, index) => {
        console.log(`\nReport ${index + 1}:`);
        console.log(`• Campaign: ${report.campaign_name}`);
        console.log(`• Brand: ${report.brand_name || 'N/A'}`);
        console.log(`• Leads: ${report.leads}`);
        console.log(`• Facebook: ${report.facebook_result} leads, ₹${report.facebook_cost_per_lead?.toFixed(2) || '0.00'} cost/lead`);
        console.log(`• Zoho: ${report.zoho_result} leads, ₹${report.zoho_cost_per_lead?.toFixed(2) || '0.00'} cost/lead`);
        console.log(`• Total Spent: ₹${report.spent}`);
      });
    }
    
    // Final table structure
    console.log('\n📊 Final table structure:');
    const [columns] = await connection.execute('DESCRIBE reports');
    columns.forEach(col => {
      if (['brand_name', 'facebook_cost_per_lead', 'zoho_cost_per_lead'].includes(col.Field)) {
        console.log(`✅ ${col.Field}: ${col.Type} ${col.Extra}`);
      }
    });
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('🔄 Your Dashboard and Reports should now show consistent data with proper cost calculations.');
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

runMigration().catch(console.error);
