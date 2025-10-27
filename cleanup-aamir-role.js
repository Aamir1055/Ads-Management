const mysql = require('mysql2/promise');

async function cleanupAamirRole() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ads reporting'
  });
  
  try {
    console.log('=== Cleaning Up Aamir Role Permissions ===\n');

    // Find Aamir role
    const [roles] = await connection.execute(
      'SELECT id, name FROM roles WHERE name = ?',
      ['Aamir']
    );
    
    if (roles.length === 0) {
      console.log('Aamir role not found!');
      return;
    }
    
    const aamirRoleId = roles[0].id;
    console.log(`Found Aamir role with ID: ${aamirRoleId}`);
    
    // Show current permissions
    const [currentPerms] = await connection.execute(`
      SELECT 
        p.permission_key,
        p.permission_name,
        m.module_name
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      JOIN modules m ON p.module_id = m.id
      WHERE rp.role_id = ?
      ORDER BY m.module_name, p.permission_name
    `, [aamirRoleId]);
    
    console.log(`\nCurrent permissions (${currentPerms.length} total):`);
    currentPerms.forEach(p => {
      console.log(`- ${p.module_name}.${p.permission_key} (${p.permission_name})`);
    });
    
    // Clear ALL existing permissions for Aamir role
    const [deleteResult] = await connection.execute(
      'DELETE FROM role_permissions WHERE role_id = ?',
      [aamirRoleId]
    );
    
    console.log(`\n✅ Removed ${deleteResult.affectedRows} permissions from Aamir role`);
    
    // Now assign ONLY basic auth permissions (login, logout)
    const [authPerms] = await connection.execute(`
      SELECT p.id, p.permission_key, p.permission_name
      FROM permissions p
      JOIN modules m ON p.module_id = m.id
      WHERE m.module_name = 'auth'
      AND p.permission_key IN ('auth.login', 'auth.logout')
    `);
    
    console.log(`\nFound ${authPerms.length} basic auth permissions to assign:`);
    authPerms.forEach(p => {
      console.log(`- ${p.permission_key} (${p.permission_name})`);
    });
    
    // Assign the basic auth permissions
    for (const perm of authPerms) {
      await connection.execute(
        'INSERT INTO role_permissions (role_id, permission_id, granted_by) VALUES (?, ?, ?)',
        [aamirRoleId, perm.id, null]
      );
      console.log(`✅ Assigned: ${perm.permission_key}`);
    }
    
    // Verify final permissions
    const [finalPerms] = await connection.execute(`
      SELECT 
        p.permission_key,
        p.permission_name,
        m.module_name
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      JOIN modules m ON p.module_id = m.id
      WHERE rp.role_id = ?
      ORDER BY m.module_name, p.permission_name
    `, [aamirRoleId]);
    
    console.log(`\n=== Final Aamir Role Permissions (${finalPerms.length} total) ===`);
    if (finalPerms.length === 0) {
      console.log('- No permissions assigned');
    } else {
      finalPerms.forEach(p => {
        console.log(`- ${p.module_name}.${p.permission_key} (${p.permission_name})`);
      });
    }
    
    console.log('\n🎉 Aamir role cleanup completed!');
    console.log('Users with Aamir role should now only be able to login/logout');
    
  } finally {
    await connection.end();
  }
}

cleanupAamirRole().catch(console.error);
