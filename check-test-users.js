const mysql = require('mysql2/promise');

async function checkTestUsers() {
  let pool;
  try {
    console.log('🔍 Checking existing test users...');
    
    pool = mysql.createPool({
      host: 'localhost',
      user: 'root', 
      password: '',
      database: 'ads reporting',
      port: 3306
    });

    const [users] = await pool.execute(`
      SELECT u.id, u.username, u.is_active, r.name as role_name, u.is_2fa_enabled
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id  
      WHERE u.username IN ('admin', 'testadmin', 'testuser2fa', 'advertiser', 'testuser', 'aamir', 'ahmed')
      ORDER BY u.username
    `);
    
    console.log('📋 Available test users:');
    if (users.length > 0) {
      users.forEach(user => {
        console.log(`  - ${user.username} (role: ${user.role_name || 'none'}, active: ${user.is_active}, 2FA: ${user.is_2fa_enabled})`);
      });
    } else {
      console.log('❌ No test users found');
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

checkTestUsers();
