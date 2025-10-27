const { pool } = require('./config/database');

async function checkActiveUsers() {
  try {
    console.log('👥 ACTIVE USERS:');
    console.log('===============');
    
    const [users] = await pool.query(`
      SELECT u.id, u.username, u.role_id, r.name as role_name, r.level 
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.is_active = 1 
      ORDER BY u.id
    `);
    
    users.forEach(u => {
      console.log(`ID ${u.id}: "${u.username}" - ${u.role_name} (Level ${u.level})`);
    });
    
    console.log(`\nTotal: ${users.length} active users`);
    console.log('\nCredentials to test:');
    console.log('- admin/admin123 (if admin user exists)');
    console.log('- testuser/testpass123 (just created)');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkActiveUsers();
