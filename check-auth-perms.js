const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost', 
    user: 'root', 
    password: '', 
    database: 'ads reporting'
  });
  
  const [authPerms] = await conn.execute(`
    SELECT p.id, p.permission_key, p.permission_name, m.module_name
    FROM permissions p
    JOIN modules m ON p.module_id = m.id
    WHERE m.module_name = 'auth'
    ORDER BY p.permission_key
  `);
  
  console.log('Available auth permissions:');
  if (authPerms.length === 0) {
    console.log('- No auth permissions found');
  } else {
    authPerms.forEach(p => {
      console.log(`- ${p.permission_key}: ${p.permission_name}`);
    });
  }
  
  await conn.end();
})().catch(console.error);
