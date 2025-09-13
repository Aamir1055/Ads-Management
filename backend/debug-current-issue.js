const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost', 
    user: 'root', 
    password: '', 
    database: 'ads reporting'
  });
  
  console.log('=== DEBUGGING CURRENT AUTHENTICATION ISSUE ===\n');
  
  // Check all users that are currently active
  console.log('1. Active users in system:');
  const [activeUsers] = await conn.execute(`
    SELECT u.id, u.username, u.is_active, u.role_id, u.last_login,
           r.name as role_name, r.level, r.is_active as role_active
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.is_active = 1
    ORDER BY u.last_login DESC
  `);
  activeUsers.forEach(user => console.log(`  - ${user.username} (ID: ${user.id}, Role: ${user.role_name}, Level: ${user.level})`));
  
  // Check specific testadmin details
  console.log('\n2. testadmin user detailed info:');
  const [testadmin] = await conn.execute(`
    SELECT u.id, u.username, u.is_active, u.last_login, u.role_id,
           r.id as role_id_joined, r.name as role_name, r.level, r.is_active as role_active
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.username = 'testadmin'
  `);
  if (testadmin.length > 0) {
    console.log('  testadmin details:', testadmin[0]);
  } else {
    console.log('  testadmin user not found!');
  }
  
  // Check testadmin permissions
  console.log('\n3. testadmin permissions:');
  const [permissions] = await conn.execute(`
    SELECT p.name, p.display_name, p.category
    FROM users u
    JOIN roles r ON u.role_id = r.id
    JOIN role_permissions rp ON r.id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE u.username = 'testadmin' AND u.is_active = 1 AND r.is_active = 1 AND p.is_active = 1
    ORDER BY p.category, p.display_name
  `);
  console.log(`  Found ${permissions.length} permissions for testadmin`);
  if (permissions.length > 0) {
    console.log('  First few permissions:');
    permissions.slice(0, 5).forEach(perm => console.log(`    - ${perm.name} (${perm.category})`));
  }
  
  // Check what the authentication middleware would see
  console.log('\n4. Testing auth middleware query for testadmin (ID: 15):');
  const [authResult] = await conn.execute(`
    SELECT 
      u.id, u.username, u.is_active, u.last_login,
      r.id as role_id, r.name as role_name, r.display_name as role_display_name, 
      r.level as role_level, r.is_active as role_active
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = ? AND u.is_active = 1 AND r.is_active = 1
  `, [15]);
  
  if (authResult.length > 0) {
    console.log('  Auth middleware would see:', authResult[0]);
  } else {
    console.log('  Auth middleware would find NO USER! This explains the 403 error.');
  }
  
  await conn.end();
})().catch(console.error);
