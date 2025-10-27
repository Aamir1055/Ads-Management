const { pool } = require('../config/database');

async function fixDatabase() {
  try {
    console.log('🔍 Checking database structure...');
    
    // Check if roles table exists
    console.log('=== Checking ROLES table ===');
    try {
      const [roleColumns] = await pool.query('DESCRIBE roles');
      console.log('✅ Roles table exists with columns:', roleColumns.map(col => col.Field));
      
      // Check if the data exists
      const [roles] = await pool.query('SELECT * FROM roles');
      console.log('📊 Current roles:', roles);
      
    } catch (error) {
      if (error.code === 'ER_NO_SUCH_TABLE') {
        console.log('❌ ROLES table does not exist. Creating it...');
        
        // Create roles table
        await pool.query(`
          CREATE TABLE IF NOT EXISTS roles (
            id INT PRIMARY KEY AUTO_INCREMENT,
            role_name VARCHAR(50) NOT NULL UNIQUE,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          )
        `);
        
        console.log('✅ ROLES table created!');
        
        // Insert default roles
        await pool.query(`
          INSERT IGNORE INTO roles (id, role_name, description) VALUES
          (1, 'Admin', 'Full system access'),
          (2, 'Manager', 'Management level access'),
          (3, 'User', 'Basic user access')
        `);
        
        console.log('✅ Default roles inserted!');
        
      } else {
        console.log('❌ Roles table error:', error.message);
      }
    }
    
    // Check users table structure
    console.log('\n=== Checking USERS table ===');
    try {
      const [userColumns] = await pool.query('DESCRIBE users');
      console.log('✅ Users table columns:');
      userColumns.forEach(col => {
        console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Key ? `KEY: ${col.Key}` : ''}`);
      });
      
      // Check if we have any users
      const [userCount] = await pool.query('SELECT COUNT(*) as count FROM users');
      console.log(`📊 Total users in database: ${userCount[0].count}`);
      
    } catch (error) {
      console.log('❌ Users table error:', error.message);
    }
    
    // Test the query that's failing
    console.log('\n=== Testing the problematic query ===');
    try {
      const [testResult] = await pool.query(`
        SELECT 
          u.id,
          u.username,
          u.role_id,
          u.is_2fa_enabled,
          u.is_active,
          u.last_login,
          u.created_at,
          u.updated_at,
          r.name as role_name,
          r.description as role_description
        FROM users u
        INNER JOIN roles r ON u.role_id = r.id
        WHERE u.is_active = true
        ORDER BY u.updated_at DESC, u.created_at DESC
        LIMIT 2
      `);
      
      console.log('✅ Query executed successfully!');
      console.log('📊 Sample results:', testResult);
      
    } catch (error) {
      console.log('❌ Query failed:', error.message);
      console.log('🔍 This is the error from the User.findAll method');
    }
    
  } catch (error) {
    console.error('💥 Database check failed:', error);
  }
  
  console.log('\n🏁 Database check completed!');
  process.exit(0);
}

fixDatabase();
