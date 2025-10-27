const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ads reporting',
  port: process.env.DB_PORT || 3306,
  multipleStatements: true // Allow multiple SQL statements
};

async function runMigration() {
  let connection;
  
  try {
    console.log('🔄 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database successfully');

    console.log('🧹 Step 1: Cleaning up existing triggers...');
    await connection.query('DROP TRIGGER IF EXISTS campaign_data_insert_trigger');
    await connection.query('DROP TRIGGER IF EXISTS campaign_data_update_trigger');
    await connection.query('DROP TRIGGER IF EXISTS campaign_data_delete_trigger');
    console.log('✅ Existing triggers removed');

    console.log('🗑️ Step 2: Clearing reports table and constraints...');
    // Drop unique constraint temporarily if it exists
    try {
      await connection.query('ALTER TABLE reports DROP INDEX uniq_report_day_campaign');
      console.log('✅ Dropped unique constraint');
    } catch (error) {
      console.log('⚠️ Unique constraint may not exist:', error.message);
    }
    
    await connection.query('TRUNCATE TABLE reports');
    console.log('✅ Reports table cleared');

    console.log('🔧 Step 3: Creating INSERT trigger...');
    await connection.query(`
      CREATE TRIGGER campaign_data_insert_trigger
      AFTER INSERT ON campaign_data
      FOR EACH ROW
      BEGIN
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
              created_by,
              created_at,
              updated_at
          )
          SELECT 
              NEW.data_date,
              DATE_FORMAT(NEW.data_date, '%Y-%m'),
              NEW.campaign_id,
              COALESCE(c.name, 'Unknown Campaign'),
              COALESCE(ct.type_name, 'Unknown Type'),
              c.brand,
              COALESCE(b.name, 'Unknown Brand'),
              (NEW.facebook_result + NEW.xoho_result),
              NEW.facebook_result,
              NEW.xoho_result,
              NEW.spent,
              NEW.created_by,
              NOW(),
              NOW()
          FROM campaigns c
          LEFT JOIN campaign_types ct ON c.campaign_type_id = ct.id
          LEFT JOIN brands b ON c.brand = b.id
          WHERE c.id = NEW.campaign_id;
      END
    `);
    console.log('✅ INSERT trigger created');

    console.log('🔧 Step 4: Creating UPDATE trigger...');
    await connection.query(`
      CREATE TRIGGER campaign_data_update_trigger
      AFTER UPDATE ON campaign_data
      FOR EACH ROW
      BEGIN
          UPDATE reports r
          SET 
              r.report_date = NEW.data_date,
              r.report_month = DATE_FORMAT(NEW.data_date, '%Y-%m'),
              r.campaign_id = NEW.campaign_id,
              r.campaign_name = (SELECT COALESCE(c.name, 'Unknown Campaign') FROM campaigns c WHERE c.id = NEW.campaign_id),
              r.campaign_type = (SELECT COALESCE(ct.type_name, 'Unknown Type') FROM campaigns c 
                                LEFT JOIN campaign_types ct ON c.campaign_type_id = ct.id 
                                WHERE c.id = NEW.campaign_id),
              r.brand = (SELECT c.brand FROM campaigns c WHERE c.id = NEW.campaign_id),
              r.brand_name = (SELECT COALESCE(b.name, 'Unknown Brand') FROM campaigns c 
                             LEFT JOIN brands b ON c.brand = b.id 
                             WHERE c.id = NEW.campaign_id),
              r.leads = (NEW.facebook_result + NEW.xoho_result),
              r.facebook_result = NEW.facebook_result,
              r.zoho_result = NEW.xoho_result,
              r.spent = NEW.spent,
              r.updated_at = NOW()
          WHERE r.campaign_id = OLD.campaign_id 
            AND r.report_date = OLD.data_date;
      END
    `);
    console.log('✅ UPDATE trigger created');

    console.log('🔧 Step 5: Creating DELETE trigger...');
    await connection.query(`
      CREATE TRIGGER campaign_data_delete_trigger
      AFTER DELETE ON campaign_data
      FOR EACH ROW
      BEGIN
          DELETE FROM reports 
          WHERE campaign_id = OLD.campaign_id 
            AND report_date = OLD.data_date;
      END
    `);
    console.log('✅ DELETE trigger created');

    console.log('📊 Step 6: Rebuilding reports from campaign_data...');
    const [rebuildResult] = await connection.query(`
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
          created_by,
          created_at,
          updated_at
      )
      SELECT 
          cd.data_date,
          DATE_FORMAT(cd.data_date, '%Y-%m'),
          cd.campaign_id,
          COALESCE(c.name, 'Unknown Campaign'),
          COALESCE(ct.type_name, 'Unknown Type'),
          c.brand,
          COALESCE(b.name, 'Unknown Brand'),
          (cd.facebook_result + cd.xoho_result),
          cd.facebook_result,
          cd.xoho_result,
          cd.spent,
          cd.created_by,
          cd.created_at,
          cd.updated_at
      FROM campaign_data cd
      LEFT JOIN campaigns c ON cd.campaign_id = c.id
      LEFT JOIN campaign_types ct ON c.campaign_type_id = ct.id
      LEFT JOIN brands b ON c.brand = b.id
      ORDER BY cd.data_date DESC, cd.created_at DESC
    `);
    console.log(`✅ Rebuilt ${rebuildResult.affectedRows} report records`);

    console.log('🔗 Step 7: Creating indexes for better performance...');
    try {
      await connection.query('CREATE INDEX IF NOT EXISTS idx_reports_campaign_date ON reports(campaign_id, report_date)');
      await connection.query('CREATE INDEX IF NOT EXISTS idx_reports_date ON reports(report_date)');
      await connection.query('CREATE INDEX IF NOT EXISTS idx_reports_brand ON reports(brand)');
      console.log('✅ Indexes created successfully');
    } catch (indexError) {
      console.log('⚠️ Some indexes may already exist:', indexError.message);
    }

    // Get final status
    console.log('\n🔍 Checking migration results...');
    const [results] = await connection.query('SELECT COUNT(*) as total_reports FROM reports');
    console.log(`✅ Total reports in table: ${results[0].total_reports}`);

    // Check if triggers were created
    const [triggers] = await connection.query(`
      SHOW TRIGGERS LIKE 'campaign_data'
    `);
    console.log(`✅ Database triggers created: ${triggers.length}`);
    
    triggers.forEach(trigger => {
      console.log(`   - ${trigger.Trigger} (${trigger.Event} ${trigger.Timing})`);
    });

    console.log('\n🎉 Migration completed successfully!');
    console.log('📊 The reports table is now automatically synced with campaign_data');
    console.log('🔄 All future INSERT/UPDATE/DELETE operations will be synchronized');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Handle special delimiter-based trigger creation
async function executeWithDelimiter(connection, sql) {
  // Split by DELIMITER commands
  const parts = sql.split(/DELIMITER\s+(\S+)/i);
  let currentDelimiter = ';';
  
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 1) {
      // This is a delimiter definition
      currentDelimiter = parts[i].trim();
      continue;
    }
    
    const statements = parts[i]
      .split(new RegExp(currentDelimiter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'))
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.execute(statement);
      }
    }
  }
}

// Run the migration
if (require.main === module) {
  console.log('🚀 Starting reports synchronization migration...');
  runMigration();
} else {
  module.exports = { runMigration };
}
