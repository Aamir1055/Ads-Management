const { pool } = require('./config/database');

(async () => {
  try {
    console.log('🔧 Adding temporary permissions to test the theory...\n');
    
    // Get Advertiser role ID
    const [roles] = await pool.query('SELECT * FROM roles WHERE name = ?', ['Advertiser']);
    if (!roles.length) {
      console.log('❌ Advertiser role not found');
      process.exit(1);
    }
    
    const advertiserRole = roles[0];
    console.log(`📋 Advertiser role ID: ${advertiserRole.id}`);
    
    // Get permission IDs for users_read and roles_read
    const [permissions] = await pool.query('SELECT * FROM permissions WHERE name IN (?, ?)', ['users_read', 'roles_read']);
    console.log(`\n🔍 Found permissions:`, permissions.map(p => ({ id: p.id, name: p.name })));
    
    // Check if permissions already exist
    const [existing] = await pool.query(
      'SELECT permission_id FROM role_permissions WHERE role_id = ? AND permission_id IN (?, ?)',
      [advertiserRole.id, permissions[0]?.id, permissions[1]?.id]
    );
    
    console.log(`\n📊 Existing permissions: ${existing.length}`);
    
    // Add missing permissions
    for (const permission of permissions) {
      const hasPermission = existing.some(e => e.permission_id === permission.id);
      
      if (!hasPermission) {
        console.log(`➕ Adding permission: ${permission.name}`);
        await pool.query(
          'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
          [advertiserRole.id, permission.id]
        );
      } else {
        console.log(`✅ Already has permission: ${permission.name}`);
      }
    }
    
    // Verify the permissions were added
    console.log('\n🔍 Verifying current permissions for Advertiser role:');
    const [currentPermissions] = await pool.query(`
      SELECT p.name, p.display_name
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ? AND p.name LIKE '%read'
      ORDER BY p.name
    `, [advertiserRole.id]);
    
    console.log('Current "read" permissions:');
    currentPermissions.forEach(p => {
      console.log(`   ✓ ${p.name} (${p.display_name})`);
    });
    
    console.log('\n✅ Done! Now test the card dropdown in the frontend.');
    console.log('💡 If it works now, we know the issue is a hidden dependency on these permissions.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();
