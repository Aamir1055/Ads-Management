const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function updateAdminPassword() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'adsuser',
    password: 'AdsPass123!',
    database: 'ads_management'
  });

  console.log('✅ Connected to database');

  // Create hash for "Admin@123"
  const password = 'Admin@123';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  
  console.log('Password: Admin@123');
  console.log('Hash:', hash);
  
  // Update admin user
  await connection.query('UPDATE users SET hashed_password = ?, is_active = 1 WHERE username = ?', [hash, 'admin']);
  console.log('\n✅ Admin password updated successfully!');
  console.log('You can now login with:');
  console.log('  Username: admin');
  console.log('  Password: Admin@123');

  await connection.end();
}

updateAdminPassword().catch(console.error);
