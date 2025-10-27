const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost', 
    user: 'root', 
    password: '', 
    database: 'ads reporting'
  });
  
  console.log('=== USERS WITH COMPLETE MODULE ACCESS ===\n');
  
  // Find users with Super Admin or Admin level access
  console.log('1. Users with Super Admin/Admin roles:');
  const [adminUsers] = await conn.execute(`
    SELECT 
      u.id, 
      u.username, 
      u.is_active, 
      u.last_login,
      r.name as role_name, 
      r.level,
      r.display_name
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE r.level >= 8 AND u.is_active = 1
    ORDER BY r.level DESC, u.last_login DESC
  `);
  
  adminUsers.forEach(user => {
    console.log(`  - Username: ${user.username}`);
    console.log(`    Role: ${user.role_name} (${user.display_name}) - Level ${user.level}`);
    console.log(`    Status: ${user.is_active ? 'Active' : 'Inactive'}`);
    console.log(`    Last Login: ${user.last_login || 'Never'}`);
    console.log('    ------------------');
  });
  
  // Check permissions for these admin users
  console.log('\n2. Permissions summary for admin users:');
  for (const user of adminUsers) {
    const [permissions] = await conn.execute(`
      SELECT COUNT(DISTINCT p.id) as permission_count
      FROM users u
      JOIN roles r ON u.role_id = r.id
      JOIN role_permissions rp ON r.id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE u.id = ? AND p.is_active = 1
    `, [user.id]);
    
    console.log(`  ${user.username}: ${permissions[0].permission_count} permissions`);
  }
  
  // Get some test credentials that definitely work
  console.log('\n3. RECOMMENDED LOGIN CREDENTIALS:');
  
  if (adminUsers.length > 0) {
    const superAdmins = adminUsers.filter(u => u.level >= 10);
    const admins = adminUsers.filter(u => u.level >= 8 && u.level < 10);
    
    if (superAdmins.length > 0) {
      console.log('\n   🔑 SUPER ADMIN ACCESS (Level 10 - Full System Access):');
      superAdmins.forEach(user => {
        console.log(`      Username: ${user.username}`);
        console.log(`      Password: [You need to check with system admin or reset]`);
        console.log(`      Role: ${user.role_name} (Level ${user.level})`);
        console.log('      ------------------');
      });
    }
    
    if (admins.length > 0) {
      console.log('\n   🔑 ADMIN ACCESS (Level 8+ - Most System Access):');
      admins.forEach(user => {
        console.log(`      Username: ${user.username}`);
        console.log(`      Password: [You need to check with system admin or reset]`);
        console.log(`      Role: ${user.role_name} (Level ${user.level})`);
        console.log('      ------------------');
      });
    }
  }
  
  // Check if there are any default/test accounts
  console.log('\n4. Checking for common test accounts:');
  const commonTestUsers = ['admin', 'testadmin', 'superadmin', 'test', 'administrator'];
  
  for (const testUsername of commonTestUsers) {
    const [testUser] = await conn.execute(`
      SELECT 
        u.id, 
        u.username, 
        u.is_active,
        r.name as role_name,
        r.level
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.username = ?
    `, [testUsername]);
    
    if (testUser.length > 0) {
      const user = testUser[0];
      console.log(`  ✅ Found: ${user.username}`);
      console.log(`     Role: ${user.role_name} (Level ${user.level})`);
      console.log(`     Status: ${user.is_active ? 'Active' : 'Inactive'}`);
      
      // For common test accounts, suggest possible passwords
      if (testUsername === 'admin') {
        console.log('     🔐 Try passwords: admin, password, 123456, admin123');
      } else if (testUsername === 'testadmin') {
        console.log('     🔐 Try passwords: testadmin, password, 123456, test123');
      }
      console.log('     ------------------');
    }
  }
  
  console.log('\n💡 NOTES:');
  console.log('   - Passwords are hashed in the database, so they cannot be retrieved directly');
  console.log('   - For production systems, contact the system administrator');
  console.log('   - For development/testing, try common passwords listed above');
  console.log('   - If needed, I can help create a password reset script');
  
  await conn.end();
})().catch(console.error);
