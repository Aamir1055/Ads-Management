const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixTwoFactorSchema() {
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
    console.log('Fixing 2FA schema step by step...\n');

    // Step 1: Rename is_2fa_enabled to twofa_enabled
    try {
      console.log('Step 1: Renaming is_2fa_enabled to twofa_enabled...');
      await connection.execute(
        'ALTER TABLE users CHANGE COLUMN is_2fa_enabled twofa_enabled BOOLEAN DEFAULT FALSE'
      );
      console.log('✅ Successfully renamed is_2fa_enabled to twofa_enabled');
    } catch (error) {
      if (error.code === 'ER_BAD_FIELD_ERROR') {
        console.log('ℹ️  Field is_2fa_enabled does not exist, checking if twofa_enabled exists...');
        
        // Check if twofa_enabled already exists
        const [columns] = await connection.execute("SHOW COLUMNS FROM users LIKE 'twofa_enabled'");
        if (columns.length > 0) {
          console.log('✅ twofa_enabled field already exists');
        } else {
          console.log('Creating twofa_enabled field...');
          await connection.execute(
            'ALTER TABLE users ADD COLUMN twofa_enabled BOOLEAN DEFAULT FALSE AFTER is_active'
          );
          console.log('✅ Created twofa_enabled field');
        }
      } else {
        console.log('❌ Error in step 1:', error.message);
      }
    }

    // Step 2: Add twofa_secret column
    try {
      console.log('\nStep 2: Adding twofa_secret column...');
      await connection.execute(
        'ALTER TABLE users ADD COLUMN twofa_secret VARCHAR(255) NULL AFTER twofa_enabled'
      );
      console.log('✅ Successfully added twofa_secret column');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  twofa_secret column already exists');
      } else {
        console.log('❌ Error in step 2:', error.message);
      }
    }

    // Step 3: Add twofa_verified_at column
    try {
      console.log('\nStep 3: Adding twofa_verified_at column...');
      await connection.execute(
        'ALTER TABLE users ADD COLUMN twofa_verified_at TIMESTAMP NULL AFTER twofa_secret'
      );
      console.log('✅ Successfully added twofa_verified_at column');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  twofa_verified_at column already exists');
      } else {
        console.log('❌ Error in step 3:', error.message);
      }
    }

    // Step 4: Create index
    try {
      console.log('\nStep 4: Creating index on twofa_enabled...');
      await connection.execute(
        'CREATE INDEX idx_users_twofa_enabled ON users(twofa_enabled)'
      );
      console.log('✅ Successfully created index idx_users_twofa_enabled');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('ℹ️  Index idx_users_twofa_enabled already exists');
      } else {
        console.log('❌ Error in step 4:', error.message);
      }
    }

    // Step 5: Update table comment
    try {
      console.log('\nStep 5: Updating table comment...');
      await connection.execute(
        "ALTER TABLE users COMMENT = 'User accounts with Two-Factor Authentication support'"
      );
      console.log('✅ Successfully updated table comment');
    } catch (error) {
      console.log('❌ Error in step 5:', error.message);
    }

    // Final verification
    console.log('\n' + '='.repeat(50));
    console.log('FINAL VERIFICATION');
    console.log('='.repeat(50));

    const [finalColumns] = await connection.execute("DESCRIBE users");
    console.log('\nUpdated users table structure:');
    
    const relevantColumns = finalColumns.filter(col => 
      ['id', 'username', 'twofa_enabled', 'twofa_secret', 'twofa_verified_at', 'is_active', 'created_at', 'updated_at'].includes(col.Field)
    );
    
    relevantColumns.forEach(col => {
      const marker = col.Field.startsWith('twofa') ? '🔐' : '  ';
      console.log(`${marker} ${col.Field.padEnd(20)} - ${col.Type.padEnd(15)} - ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} - Default: ${col.Default || 'NULL'}`);
    });

    // Check 2FA specific fields
    const twofaColumns = finalColumns.filter(col => col.Field.startsWith('twofa'));
    console.log('\n🔐 2FA Fields Summary:');
    if (twofaColumns.length >= 3) {
      console.log('✅ All 2FA fields are present:');
      twofaColumns.forEach(col => {
        console.log(`  • ${col.Field}: ${col.Type}`);
      });
    } else {
      console.log('❌ Missing some 2FA fields. Found:');
      twofaColumns.forEach(col => {
        console.log(`  • ${col.Field}: ${col.Type}`);
      });
    }

    // Check index
    const [indexes] = await connection.execute("SHOW INDEXES FROM users WHERE Key_name LIKE '%twofa%'");
    console.log('\n🔑 2FA Indexes:');
    if (indexes.length > 0) {
      console.log('✅ Found 2FA indexes:');
      indexes.forEach(idx => {
        console.log(`  • ${idx.Key_name}: ${idx.Column_name}`);
      });
    } else {
      console.log('❌ No 2FA indexes found');
    }

    console.log('\n🎉 2FA database setup complete!');

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    console.error('Error code:', error.code);
    console.error('SQL State:', error.sqlState);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed');
    }
  }
}

// Run the fix
console.log('🛠️  Manual 2FA Database Schema Fix');
console.log('Database:', process.env.DB_NAME);
console.log('Host:', process.env.DB_HOST);
console.log('=' .repeat(50));

fixTwoFactorSchema().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
