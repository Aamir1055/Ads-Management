require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkAhmedPermissions() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    // Check ahmed user details
    const [userRows] = await connection.execute(`
      SELECT u.id, u.username, r.name as role_name, u.is_2fa_enabled, r.id as role_id
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.username = 'ahmed'
    `);
    
    console.log('Ahmed user details:', userRows);

    if (userRows.length > 0) {
      const user = userRows[0];
      
      // Check role permissions
      const [permissionRows] = await connection.execute(`
        SELECT p.permission_name, p.permission_key, p.description
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        WHERE rp.role_id = ?
      `, [user.role_id]);
      
      console.log('Ahmed role permissions:', permissionRows);
      
      // Check if ahmed has users.read permission
      const hasUsersRead = permissionRows.some(p => p.permission_key === 'users.read');
      console.log('Has users.read permission:', hasUsersRead);
    }

    // Also show all users for comparison
    const [allUsers] = await connection.execute(`
      SELECT u.id, u.username, r.name as role_name, u.is_active
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      ORDER BY u.id
    `);
    
    console.log('All users in database:', allUsers);

  } finally {
    await connection.end();
  }
}

checkAhmedPermissions().catch(console.error);
