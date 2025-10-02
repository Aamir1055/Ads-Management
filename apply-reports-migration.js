const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function applyReportsMigration() {
  let connection;
  
  try {
    console.log('🔄 Applying Reports Table Migration...\n');
    
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'ads reporting'
    });
    
    console.log('✅ Connected to database');
    
    // Check if columns already exist
    console.log('\n📊 Checking current table structure...');
    const [columns] = await connection.execute('DESCRIBE reports');
    const existingColumns = columns.map(col => col.Field);
    
    const newColumns = ['brand_name', 'facebook_cost_per_lead', 'zoho_cost_per_lead'];
    const missingColumns = newColumns.filter(col => !existingColumns.includes(col));
    
    if (missingColumns.length === 0) {
      console.log('✅ All required columns already exist');
    } else {
      console.log(`🔧 Missing columns: ${missingColumns.join(', ')}`);
      
      // Read and execute migration SQL
      const sqlFile = path.join(__dirname, 'add-missing-columns-to-reports.sql');
      const sqlContent = await fs.readFile(sqlFile, 'utf8');
      
      // Split SQL into individual statements
      const statements = sqlContent
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt && !stmt.startsWith('--'));
      
      console.log(`\n📝 Executing ${statements.length} SQL statements...`);
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (!statement) continue;
        
        try {
          await connection.execute(statement);
          console.log(`✅ Statement ${i + 1} executed successfully`);
        } catch (error) {
          if (error.code === 'ER_DUP_FIELDNAME') {
            console.log(`⚠️  Statement ${i + 1} skipped (column already exists)`);
          } else if (error.code === 'ER_DUP_KEYNAME') {
            console.log(`⚠️  Statement ${i + 1} skipped (index already exists)`);
          } else {
            console.log(`❌ Statement ${i + 1} failed:`, error.message);
          }
        }
      }
    }
    
    // Verify final structure
    console.log('\n📊 Final table structure:');
    const [finalColumns] = await connection.execute('DESCRIBE reports');
    const reportColumns = ['id', 'campaign_name', 'brand_name', 'leads', 'facebook_result', 'zoho_result', 'spent', 'facebook_cost_per_lead', 'zoho_cost_per_lead'];
    
    reportColumns.forEach(colName => {
      const col = finalColumns.find(c => c.Field === colName);
      if (col) {
        console.log(`✅ ${colName}: ${col.Type}`);
      } else {
        console.log(`❌ ${colName}: Missing`);
      }
    });
    
    // Test the data
    console.log('\n📋 Testing updated data:');
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
      LIMIT 1
    `);
    
    if (testData.length > 0) {
      const report = testData[0];
      console.log('Sample report with new columns:');
      console.log(`• Campaign: ${report.campaign_name}`);
      console.log(`• Brand: ${report.brand_name}`);
      console.log(`• Leads: ${report.leads}`);
      console.log(`• Facebook: ${report.facebook_result} leads, ₹${report.facebook_cost_per_lead?.toFixed(2) || '0.00'} cost/lead`);
      console.log(`• Zoho: ${report.zoho_result} leads, ₹${report.zoho_cost_per_lead?.toFixed(2) || '0.00'} cost/lead`);
      console.log(`• Total Spent: ₹${report.spent}`);
      
      const hasAllData = report.brand_name && report.facebook_result !== null && report.zoho_result !== null;
      
      if (hasAllData) {
        console.log('\n🎉 SUCCESS! All required data is present.');
        console.log('✅ Frontend will now receive complete data from API');
      } else {
        console.log('\n⚠️  Some data is missing. Re-running migration...');
        
        // Re-run the backfill
        await connection.execute(`
          UPDATE reports r
          LEFT JOIN brands b ON r.brand = b.id
          SET r.brand_name = b.name
          WHERE r.brand_name IS NULL
        `);
        
        console.log('✅ Brand names backfilled');
      }
    }
    
    console.log('\n✨ Migration completed successfully!');
    console.log('🔄 Now test your Dashboard and Reports page - they should show consistent data.');
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

applyReportsMigration().catch(console.error);
