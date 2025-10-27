const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost', 
    user: 'root', 
    password: '', 
    database: 'ads reporting'
  });
  
  const [users] = await conn.execute(`
    SELECT u.id, u.username, r.name as role_name
    FROM users u
    JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = 1
    JOIN roles r ON ur.role_id = r.id
    WHERE r.name = 'Aamir'
  `);
  
  console.log('Users with Aamir role:');
  if (users.length === 0) {
    console.log('- No users found with Aamir role');
  } else {
    users.forEach(u => {
      console.log(`- User ID ${u.id}: ${u.username}`);
    });
  }
  
  await conn.end();
})().catch(console.error);
