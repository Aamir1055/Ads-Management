const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost', 
    user: 'root', 
    password: '', 
    database: 'ads reporting'
  });
  
  const [users] = await conn.execute(`
    SELECT 
      u.id, 
      u.username, 
      u.is_active,
      r.name as role_name,
      r.display_name as role_display_name,
      r.level as role_level
    FROM users u 
    LEFT JOIN roles r ON u.role_id = r.id 
    ORDER BY u.id
  `);
  
  console.log('Users in database:');
  users.forEach(user => {
    console.log(`ID: ${user.id}, Username: ${user.username}, Active: ${user.is_active}, Role: ${user.role_name} (${user.role_display_name}), Level: ${user.role_level}`);
  });
  
  await conn.end();
})().catch(console.error);
