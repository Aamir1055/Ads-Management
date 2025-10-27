/**
 * Check Users and Authentication Info
 */

const { pool } = require('./config/database');

async function checkUsers() {
  console.log('👤 Checking Users in Database...\\n');
  
  try {
    const [users] = await pool.query(`
      SELECT 
        u.id, 
        u.username, 
        u.is_active,
        r.name as role_name,
        r.level as role_level,
        u.created_at
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY u.id
    `);
    
    console.log('📋 All Users:');
    users.forEach(user => {
      console.log(`\\n🔹 ${user.username} (ID: ${user.id})`);
      console.log(`   Role: ${user.role_name} (Level: ${user.role_level})`);
      console.log(`   Active: ${user.is_active ? '✅ Yes' : '❌ No'}`);
      console.log(`   Created: ${user.created_at}`);
    });
    
    console.log('\\n💡 To test the API, you need to:');
    console.log('1. Use one of these usernames');
    console.log('2. Know their password (usually set when user was created)');
    console.log('3. Make sure they are active');
    
    console.log('\\n🔑 Common default passwords to try:');
    console.log('- admin123, password123, password, admin, 123456');
    console.log('- Or check your frontend login to see what password works');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkUsers();
