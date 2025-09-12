const { pool } = require('../config/database');

const checkTables = async () => {
  try {
    console.log('🔍 Checking existing tables...');
    
    // Show all tables
    const [tables] = await pool.execute('SHOW TABLES');
    console.log('📋 Existing tables:', tables);
    
    // Check specific tables
    const tablesToCheck = ['campaign_types', 'campaigns', 'cards', 'campaign_data'];
    
    for (const tableName of tablesToCheck) {
      try {
        const [result] = await pool.execute(`DESCRIBE ${tableName}`);
        console.log(`\n✅ ${tableName} table structure:`);
        result.forEach(col => {
          console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}${col.Key ? ` (${col.Key})` : ''}${col.Default ? ` DEFAULT ${col.Default}` : ''}`);
        });
      } catch (error) {
        console.log(`❌ ${tableName} table does not exist:`, error.message);
      }
    }
    
    console.log('\n🎉 Table check completed!');
    
  } catch (error) {
    console.error('❌ Error checking tables:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
};

// Run check
checkTables();
