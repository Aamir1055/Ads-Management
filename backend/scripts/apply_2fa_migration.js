const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function applyMigration() {
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

    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'migrations', 'add_2fa_fields.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Applying 2FA migration...');
    console.log('Migration content:');
    console.log(migrationSQL);

    // Split migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    // Execute each statement
    for (const statement of statements) {
      if (statement.trim().length > 0) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        await connection.execute(statement);
      }
    }

    console.log('✅ 2FA migration applied successfully!');

    // Verify the changes
    console.log('\nVerifying database schema...');
    const [columns] = await connection.execute(
      "SHOW COLUMNS FROM users LIKE 'twofa%'"
    );

    if (columns.length >= 3) {
      console.log('✅ All 2FA columns added successfully:');
      columns.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
      });
    } else {
      console.log('⚠️  Some 2FA columns may be missing. Found columns:');
      columns.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type}`);
      });
    }

    // Check for index
    const [indexes] = await connection.execute(
      "SHOW INDEXES FROM users WHERE Key_name = 'idx_users_twofa_enabled'"
    );

    if (indexes.length > 0) {
      console.log('✅ 2FA index created successfully');
    } else {
      console.log('⚠️  2FA index not found');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    
    // Check if columns already exist
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('ℹ️  2FA fields may already exist. Let me check...');
      
      try {
        const [columns] = await connection.execute(
          "SHOW COLUMNS FROM users LIKE 'twofa%'"
        );
        
        if (columns.length >= 3) {
          console.log('✅ 2FA fields already exist in database:');
          columns.forEach(col => {
            console.log(`  - ${col.Field}: ${col.Type}`);
          });
        }
      } catch (checkError) {
        console.error('Error checking existing columns:', checkError.message);
      }
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the migration
console.log('Starting 2FA database migration...');
console.log('Database:', process.env.DB_NAME);
console.log('Host:', process.env.DB_HOST);
console.log('---');

applyMigration().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
