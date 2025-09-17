const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '', // Add your MySQL password if needed
  database: 'ads reporting'
};

async function checkSchema() {
  let connection;
  
  try {
    console.log('🔍 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected successfully');
    
    // Check modules table structure
    console.log('\n📋 Checking modules table structure...');
    try {
      const [moduleColumns] = await connection.execute('DESCRIBE modules');
      console.log('Modules table columns:');
      moduleColumns.forEach(col => {
        console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Key ? col.Key : ''}`);
      });
    } catch (error) {
      console.log('❌ Modules table does not exist or error:', error.message);
    }
    
    // Check if modules table has any data
    console.log('\n📊 Checking modules table data...');
    try {
      const [moduleData] = await connection.execute('SELECT * FROM modules LIMIT 10');
      console.log(`Found ${moduleData.length} modules:`, moduleData);
    } catch (error) {
      console.log('❌ Error querying modules:', error.message);
    }
    
    // Check permissions table structure  
    console.log('\n📋 Checking permissions table structure...');
    try {
      const [permColumns] = await connection.execute('DESCRIBE permissions');
      console.log('Permissions table columns:');
      permColumns.forEach(col => {
        console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Key ? col.Key : ''}`);
      });
    } catch (error) {
      console.log('❌ Permissions table error:', error.message);
    }
    
    // Check brand permissions
    console.log('\n🏷️ Checking brand permissions...');
    try {
      const [brandPerms] = await connection.execute(`
        SELECT * FROM permissions WHERE name LIKE 'brands_%' OR id IN (31, 32, 33, 34)
        ORDER BY id
      `);
      console.log('Brand permissions found:', brandPerms);
    } catch (error) {
      console.log('❌ Error querying brand permissions:', error.message);
    }
    
    // Check role_permissions table
    console.log('\n🔑 Checking role_permissions structure...');
    try {
      const [rolePermColumns] = await connection.execute('DESCRIBE role_permissions');
      console.log('role_permissions table columns:');
      rolePermColumns.forEach(col => {
        console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Key ? col.Key : ''}`);
      });
    } catch (error) {
      console.log('❌ role_permissions table error:', error.message);
    }
    
    console.log('\n🎯 Schema check completed!');
    
  } catch (error) {
    console.error('❌ Error checking schema:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkSchema();
