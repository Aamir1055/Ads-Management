const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost', 
    user: 'root', 
    password: '', 
    database: 'ads reporting'
  });
  
  console.log('=== Current testadmin user status ===');
  const [users] = await conn.execute('SELECT id, username, is_active, role_id FROM users WHERE username = "testadmin"');
  console.log('testadmin user:', users[0]);
  
  if (users.length > 0 && users[0].is_active === 0) {
    console.log('\n=== Activating testadmin user ===');
    await conn.execute('UPDATE users SET is_active = 1 WHERE username = "testadmin"');
    console.log('testadmin user activated!');
    
    // Verify the change
    const [updatedUsers] = await conn.execute('SELECT id, username, is_active, role_id FROM users WHERE username = "testadmin"');
    console.log('Updated testadmin user:', updatedUsers[0]);
  }
  
  // Also check the role
  console.log('\n=== testadmin role details ===');
  const [roleInfo] = await conn.execute(`
    SELECT r.id, r.name, r.level, r.is_active 
    FROM roles r 
    JOIN users u ON r.id = u.role_id 
    WHERE u.username = "testadmin"
  `);
  console.log('testadmin role:', roleInfo[0]);
  
  await conn.end();
})().catch(console.error);
