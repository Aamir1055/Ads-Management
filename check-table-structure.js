const mysql = require('mysql2/promise');

async function checkTableStructure() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '', 
      database: 'ads reporting'
    });
    
    console.log('✅ Connected to database');
    
    // Show all tables
    console.log('\n📋 Available Tables:');
    const [tables] = await connection.execute('SHOW TABLES');
    
    if (tables.length === 0) {
      console.log('❌ No tables found in database');
      return;
    }
    
    tables.forEach(table => {
      console.log(`• ${Object.values(table)[0]}`);
    });
    
    // Check if reports table exists
    const [reportsTables] = await connection.execute(
      "SHOW TABLES LIKE 'reports'"
    );
    
    if (reportsTables.length === 0) {
      console.log('\n❌ "reports" table does not exist');
      
      // Check for similar table names
      console.log('\n🔍 Looking for similar tables...');
      tables.forEach(table => {
        const tableName = Object.values(table)[0];
        if (tableName.toLowerCase().includes('report') || 
            tableName.toLowerCase().includes('campaign') || 
            tableName.toLowerCase().includes('lead')) {
          console.log(`📊 Found related table: ${tableName}`);
        }
      });
      
      return;
    }
    
    console.log('\n✅ Found "reports" table');
    
    // Describe the reports table structure
    console.log('\n📊 Reports Table Structure:');
    const [columns] = await connection.execute('DESCRIBE reports');
    
    console.log('┌─────────────────────┬─────────────────────┬──────┬─────┬─────────┬───────────────┐');
    console.log('│ Field               │ Type                │ Null │ Key │ Default │ Extra         │');
    console.log('├─────────────────────┼─────────────────────┼──────┼─────┼─────────┼───────────────┤');
    
    columns.forEach(column => {
      const field = column.Field.padEnd(19);
      const type = column.Type.padEnd(19);
      const nullValue = column.Null.padEnd(4);
      const key = (column.Key || '').padEnd(3);
      const defaultValue = (column.Default || 'NULL').padEnd(7);
      const extra = column.Extra.padEnd(13);
      
      console.log(`│ ${field} │ ${type} │ ${nullValue} │ ${key} │ ${defaultValue} │ ${extra} │`);
    });
    
    console.log('└─────────────────────┴─────────────────────┴──────┴─────┴─────────┴───────────────┘');
    
    // Count existing records
    const [countResult] = await connection.execute('SELECT COUNT(*) as count FROM reports');
    const recordCount = countResult[0].count;
    
    console.log(`\n📊 Records in reports table: ${recordCount}`);
    
    if (recordCount > 0) {
      console.log('\n📋 Sample records:');
      const [sampleRecords] = await connection.execute('SELECT * FROM reports LIMIT 3');
      
      sampleRecords.forEach((record, index) => {
        console.log(`\nRecord ${index + 1}:`);
        Object.entries(record).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
      });
    } else {
      console.log('\n⚠️  Table is empty - this is why your dashboard shows zeros');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

checkTableStructure().catch(console.error);
