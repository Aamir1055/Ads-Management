const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkSchema() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306
    });

    console.log('Connected to database successfully');
    console.log('Checking users table structure...\n');

    // Get full table structure
    const [columns] = await connection.execute("DESCRIBE users");
    
    console.log('Current users table structure:');
    console.log('┌─────────────────────────┬──────────────────┬──────┬─────┬─────────┬────────────────┐');
    console.log('│ Field                   │ Type             │ Null │ Key │ Default │ Extra          │');
    console.log('├─────────────────────────┼──────────────────┼──────┼─────┼─────────┼────────────────┤');
    
    columns.forEach(col => {
      const field = col.Field.padEnd(23);
      const type = col.Type.padEnd(16);
      const nullVal = col.Null.padEnd(4);
      const key = col.Key.padEnd(3);
      const defaultVal = (col.Default || '').toString().padEnd(7);
      const extra = (col.Extra || '').padEnd(14);
      
      console.log(`│ ${field} │ ${type} │ ${nullVal} │ ${key} │ ${defaultVal} │ ${extra} │`);
    });
    
    console.log('└─────────────────────────┴──────────────────┴──────┴─────┴─────────┴────────────────┘');

    // Check specifically for 2FA fields
    const twofaColumns = columns.filter(col => col.Field.startsWith('twofa'));
    
    console.log('\n2FA Fields Status:');
    if (twofaColumns.length === 0) {
      console.log('❌ No 2FA fields found in users table');
    } else {
      console.log('✅ 2FA fields found:');
      twofaColumns.forEach(col => {
        console.log(`  • ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}) - Default: ${col.Default || 'NULL'}`);
      });
    }

    // Check indexes
    console.log('\nChecking indexes...');
    const [indexes] = await connection.execute("SHOW INDEXES FROM users");
    
    const twofaIndexes = indexes.filter(idx => idx.Key_name.includes('twofa'));
    
    if (twofaIndexes.length === 0) {
      console.log('❌ No 2FA indexes found');
    } else {
      console.log('✅ 2FA indexes found:');
      twofaIndexes.forEach(idx => {
        console.log(`  • ${idx.Key_name}: ${idx.Column_name} (${idx.Non_unique ? 'Non-unique' : 'Unique'})`);
      });
    }

    // Check table comment
    console.log('\nChecking table comment...');
    const [tableInfo] = await connection.execute(
      "SELECT TABLE_COMMENT FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'",
      [process.env.DB_NAME]
    );

    if (tableInfo.length > 0) {
      console.log(`Table comment: "${tableInfo[0].TABLE_COMMENT}"`);
    }

  } catch (error) {
    console.error('❌ Error checking schema:', error.message);
    console.error('Error code:', error.code);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed');
    }
  }
}

// Run the check
console.log('Checking 2FA database schema...');
console.log('Database:', process.env.DB_NAME);
console.log('Host:', process.env.DB_HOST);
console.log('---');

checkSchema().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
