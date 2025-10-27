const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function applyForeignKeyFix() {
  let connection;
  
  try {
    console.log('🔄 Applying foreign key fix migration...');
    
    connection = await pool.getConnection();
    await connection.beginTransaction();
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../migrations/fix_campaign_data_foreign_key.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by semicolon and filter out empty statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--') && !stmt.toUpperCase().startsWith('SHOW'));
    
    // Execute each statement
    for (const statement of statements) {
      if (statement) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        await connection.execute(statement);
      }
    }
    
    await connection.commit();
    console.log('✅ Foreign key migration applied successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    if (connection) {
      await connection.rollback();
    }
    process.exit(1);
  } finally {
    if (connection) {
      connection.release();
    }
    process.exit(0);
  }
}

applyForeignKeyFix();
