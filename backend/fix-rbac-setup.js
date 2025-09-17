const { pool } = require('./config/database');

async function fixRBACSetup() {
  try {
    console.log('🔧 Fixing RBAC setup for proper brand and role access...\n');
    
    // Step 1: Ensure regular admin users only get VIEW access to brands
    // (Create/Update/Delete should be SuperAdmin only as per your requirements)
    
    console.log('📋 Current brand access for admin role:');
    const [adminBrandPerms] = await pool.query(`
      SELECT p.name, p.display_name
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id = (SELECT id FROM roles WHERE name = 'admin')
      AND p.name LIKE 'brands_%'
    `);
    
    adminBrandPerms.forEach(perm => {
      console.log(`  - ${perm.name}: ${perm.display_name}`);
    });
    
    // Step 2: Remove create/update/delete brand permissions from admin role
    // Keep only brands_read for regular admin users
    console.log('\n🚫 Removing create/update/delete brand permissions from admin role...');
    
    const restrictedBrandPermissions = ['brands_create', 'brands_update', 'brands_delete'];
    const adminRoleId = 2; // Based on your database
    
    for (const permName of restrictedBrandPermissions) {
      const [result] = await pool.query(`
        DELETE rp FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        WHERE rp.role_id = ? AND p.name = ?
      `, [adminRoleId, permName]);
      
      if (result.affectedRows > 0) {
        console.log(`  ✅ Removed ${permName} from admin role`);
      }
    }
    
    // Step 3: Ensure admin role has brands_read permission
    console.log('\n✅ Ensuring admin role has brands_read permission...');
    const [brandReadPerm] = await pool.query(`
      SELECT id FROM permissions WHERE name = 'brands_read'
    `);
    
    if (brandReadPerm.length > 0) {
      const [existingPerm] = await pool.query(`
        SELECT id FROM role_permissions 
        WHERE role_id = ? AND permission_id = ?
      `, [adminRoleId, brandReadPerm[0].id]);
      
      if (existingPerm.length === 0) {
        await pool.query(`
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES (?, ?)
        `, [adminRoleId, brandReadPerm[0].id]);
        console.log('  ✅ Added brands_read permission to admin role');
      } else {
        console.log('  ✅ Admin role already has brands_read permission');
      }
    }
    
    // Step 4: Add role management permissions for admin
    console.log('\n🎭 Ensuring admin role has basic role management permissions...');
    const basicRolePermissions = ['roles_read', 'roles_create', 'roles_update', 'roles_delete'];
    
    for (const permName of basicRolePermissions) {
      const [perm] = await pool.query(`
        SELECT id FROM permissions WHERE name = ?
      `, [permName]);
      
      if (perm.length > 0) {
        const [existingPerm] = await pool.query(`
          SELECT id FROM role_permissions 
          WHERE role_id = ? AND permission_id = ?
        `, [adminRoleId, perm[0].id]);
        
        if (existingPerm.length === 0) {
          await pool.query(`
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES (?, ?)
          `, [adminRoleId, perm[0].id]);
          console.log(`  ✅ Added ${permName} permission to admin role`);
        } else {
          console.log(`  ✅ Admin role already has ${permName} permission`);
        }
      }
    }
    
    // Step 5: Verify SuperAdmin has all permissions (should already be the case)
    console.log('\n🔥 Verifying SuperAdmin permissions...');
    const superAdminRoleId = 5; // Based on your database
    
    const [superAdminPerms] = await pool.query(`
      SELECT COUNT(*) as count
      FROM role_permissions rp
      WHERE rp.role_id = ?
    `, [superAdminRoleId]);
    
    console.log(`  📊 SuperAdmin has ${superAdminPerms[0].count} permissions`);
    
    // Step 6: Final verification
    console.log('\n📊 Final Permission Summary:');
    
    const roles = [
      { name: 'admin', id: adminRoleId },
      { name: 'super_admin', id: superAdminRoleId }
    ];
    
    for (const role of roles) {
      console.log(`\n  🎭 ${role.name.toUpperCase()}:`);
      
      // Brand permissions
      const [brandPerms] = await pool.query(`
        SELECT p.name
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        WHERE rp.role_id = ? AND p.name LIKE 'brands_%'
        ORDER BY p.name
      `, [role.id]);
      
      const brandPermNames = brandPerms.map(p => p.name);
      console.log(`    🏷️ Brands: ${brandPermNames.length > 0 ? brandPermNames.join(', ') : 'NONE'}`);
      
      // Role permissions
      const [rolePerms] = await pool.query(`
        SELECT p.name
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        WHERE rp.role_id = ? AND p.name LIKE 'roles_%'
        ORDER BY p.name
      `, [role.id]);
      
      const rolePermNames = rolePerms.map(p => p.name);
      console.log(`    🎭 Roles: ${rolePermNames.length > 0 ? rolePermNames.join(', ') : 'NONE'}`);
    }
    
    console.log('\n✅ RBAC setup fixed successfully!');
    console.log('\n📝 Summary of changes:');
    console.log('  • Admin users can only VIEW brands (brands_read)');
    console.log('  • SuperAdmin can CREATE/UPDATE/DELETE brands');
    console.log('  • Admin users can manage roles (full CRUD)');
    console.log('  • SuperAdmin has unrestricted access to everything');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing RBAC setup:', error);
    process.exit(1);
  }
}

fixRBACSetup();
