const { pool } = require('./config/database');

async function checkUsers() {
  try {
    const [users] = await pool.query(`
      SELECT u.id, u.username, u.is_active, r.name as role_name, r.level as role_level
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.is_active = 1
      ORDER BY r.level DESC, u.username ASC
    `);
    
    console.log('Active users in database:');
    users.forEach(user => {
      console.log(`  - ${user.username} (ID: ${user.id}, Role: ${user.role_name || 'No Role'}, Level: ${user.role_level || 'N/A'})`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkUsers();
