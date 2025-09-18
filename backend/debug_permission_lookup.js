const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'ads reporting'
});

(async () => {
  try {
    console.log('🔍 Debugging permission lookup for priyankjp...\n');
    
    // Get user details
    const [users] = await pool.execute('SELECT * FROM users WHERE username = ?', ['priyankjp']);
    if (!users.length) {
      console.log('❌ User not found');
      process.exit(1);
    }
    
    const user = users[0];
    console.log('👤 User Details:', {
      id: user.id,
      username: user.username,
      role_id: user.role_id
    });
    
    // Get role details
    const [roles] = await pool.execute('SELECT * FROM roles WHERE id = ?', [user.role_id]);
    const role = roles[0];
    console.log('🎭 Role Details:', {
      id: role.id,
      name: role.name,
      level: role.level
    });
    
    // Check what permissions the user has (all permissions)
    const [allPermissions] = await pool.execute(`
      SELECT p.id, p.name, p.display_name, p.category
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ? AND p.is_active = 1
      ORDER BY p.name
    `, [user.role_id]);
    
    console.log(`\n📋 All Permissions for ${role.name} role (${allPermissions.length} total):`);
    allPermissions.forEach(p => {
      console.log(`   ✓ ${p.name} (${p.display_name})`);
    });
    
    // Specifically check for cards_read permission
    console.log('\n🎯 Checking for cards_read permission...');
    const [cardsReadPermission] = await pool.execute(`
      SELECT p.name, r.name as role_name, r.level as role_level, p.category as module_name
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      JOIN roles r ON rp.role_id = r.id
      WHERE rp.role_id = ? AND p.name = ?
      AND p.is_active = 1
      LIMIT 1
    `, [user.role_id, 'cards_read']);
    
    if (cardsReadPermission.length > 0) {
      console.log('   ✅ cards_read permission FOUND');
      console.log('   Permission details:', cardsReadPermission[0]);
    } else {
      console.log('   ❌ cards_read permission NOT FOUND');
      
      // Check for similar permissions
      const [similarPermissions] = await pool.execute(`
        SELECT p.name, p.display_name
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = ? AND (p.name LIKE '%card%' OR p.category = 'cards')
        AND p.is_active = 1
      `, [user.role_id]);
      
      console.log('   🔍 Similar card-related permissions:');
      similarPermissions.forEach(p => {
        console.log(`      - ${p.name} (${p.display_name})`);
      });
    }
    
    // Test the exact query that RBAC middleware uses
    console.log('\n🧪 Testing RBAC middleware query...');
    const rbacQuery = `
      SELECT p.name, r.name as role_name, r.level as role_level, p.category as module_name
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      JOIN roles r ON rp.role_id = r.id
      WHERE rp.role_id = ? AND p.name = ?
      AND p.is_active = 1
      LIMIT 1
    `;
    
    const [rbacResult] = await pool.execute(rbacQuery, [user.role_id, 'cards_read']);
    
    if (rbacResult.length > 0) {
      console.log('   ✅ RBAC middleware query would PASS');
      console.log('   Result:', rbacResult[0]);
    } else {
      console.log('   ❌ RBAC middleware query would FAIL');
      console.log('   This explains why the API returns 403 Forbidden');
    }
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();
