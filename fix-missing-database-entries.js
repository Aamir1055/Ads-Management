const { pool } = require('./config/database');

async function fixMissingDatabaseEntries() {
  try {
    console.log('🔧 FIXING MISSING DATABASE ENTRIES');
    console.log('=' .repeat(60));
    
    // 1. Add missing brands module to modules table
    console.log('\n🏷️ Checking Brands Module:');
    const [brandsModule] = await pool.query(`
      SELECT * FROM modules WHERE name = 'brands'
    `);
    
    if (brandsModule.length === 0) {
      await pool.query(`
        INSERT INTO modules (name, display_name, description, icon, route, order_index, is_active)
        VALUES ('brands', 'Brand Management', 'Manage brand information and details', 'tag', '/brands', 10, 1)
      `);
      console.log('  ✅ Added brands module to modules table');
    } else {
      console.log('  ✅ Brands module already exists');
    }
    
    // Get brands module ID
    const [brandModuleResult] = await pool.query(`
      SELECT id FROM modules WHERE name = 'brands'
    `);
    const brandModuleId = brandModuleResult[0].id;
    
    // 2. Add missing brand permissions
    console.log('\n🏷️ Checking Brand Permissions:');
    const brandPermissions = [
      { name: 'brands_create', display: 'Create Brands', desc: 'Create new brand entries' },
      { name: 'brands_read', display: 'View Brands', desc: 'View brand information and details' },
      { name: 'brands_update', display: 'Update Brands', desc: 'Edit brand information and details' },
      { name: 'brands_delete', display: 'Delete Brands', desc: 'Delete brand entries' }
    ];
    
    for (const perm of brandPermissions) {
      const [exists] = await pool.query(`
        SELECT id FROM permissions WHERE name = ?
      `, [perm.name]);
      
      if (exists.length === 0) {
        await pool.query(`
          INSERT INTO permissions (name, display_name, description, category, module_id)
          VALUES (?, ?, ?, 'brands', ?)
        `, [perm.name, perm.display, perm.desc, brandModuleId]);
        console.log(`  ✅ Added permission: ${perm.name}`);
      } else {
        console.log(`  ✅ Permission exists: ${perm.name}`);
      }
    }
    
    // 3. Add missing role management permissions for CRUD display
    console.log('\n🎭 Checking Role Management Permissions:');
    const rolePermissions = [
      { name: 'roles_create', display: 'Create Roles', desc: 'Create new roles in the system' },
      { name: 'roles_read', display: 'View Roles', desc: 'View roles and their details' },
      { name: 'roles_update', display: 'Update Roles', desc: 'Edit existing roles' },
      { name: 'roles_delete', display: 'Delete Roles', desc: 'Remove roles from the system' },
      { name: 'permissions_assign', display: 'Assign Permissions', desc: 'Assign permissions to roles' },
      { name: 'permissions_revoke', display: 'Revoke Permissions', desc: 'Remove permissions from roles' },
      { name: 'users_assign_roles', display: 'Assign User Roles', desc: 'Assign roles to users' },
      { name: 'users_revoke_roles', display: 'Revoke User Roles', desc: 'Remove roles from users' }
    ];
    
    // Get roles module ID
    const [roleModuleResult] = await pool.query(`
      SELECT id FROM modules WHERE name = 'roles'
    `);
    const roleModuleId = roleModuleResult[0].id;
    
    for (const perm of rolePermissions) {
      const [exists] = await pool.query(`
        SELECT id FROM permissions WHERE name = ?
      `, [perm.name]);
      
      if (exists.length === 0) {
        await pool.query(`
          INSERT INTO permissions (name, display_name, description, category, module_id)
          VALUES (?, ?, ?, 'roles', ?)
        `, [perm.name, perm.display, perm.desc, roleModuleId]);
        console.log(`  ✅ Added permission: ${perm.name}`);
      } else {
        console.log(`  ✅ Permission exists: ${perm.name}`);
      }
    }
    
    // 4. Create missing super_admin role
    console.log('\n🔥 Checking SuperAdmin Role:');
    const [superAdminRole] = await pool.query(`
      SELECT * FROM roles WHERE name = 'super_admin' OR name = 'SuperAdmin'
    `);
    
    if (superAdminRole.length === 0) {
      await pool.query(`
        INSERT INTO roles (name, display_name, description, level, is_system_role, is_active)
        VALUES ('super_admin', 'Super Administrator', 'Full system access with all permissions', 10, 1, 1)
      `);
      console.log('  ✅ Created super_admin role');
    } else {
      console.log('  ✅ SuperAdmin role already exists');
    }
    
    // Get super_admin role ID
    const [superAdminResult] = await pool.query(`
      SELECT id FROM roles WHERE name = 'super_admin' OR name = 'SuperAdmin' ORDER BY level DESC LIMIT 1
    `);
    const superAdminRoleId = superAdminResult[0].id;
    
    // 5. Assign ALL permissions to super_admin
    console.log('\n🔥 Assigning ALL permissions to SuperAdmin:');
    const [allPermissions] = await pool.query(`
      SELECT id, name FROM permissions WHERE is_active = 1
    `);
    
    let addedCount = 0;
    for (const permission of allPermissions) {
      const [hasPermission] = await pool.query(`
        SELECT id FROM role_permissions WHERE role_id = ? AND permission_id = ?
      `, [superAdminRoleId, permission.id]);
      
      if (hasPermission.length === 0) {
        await pool.query(`
          INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)
        `, [superAdminRoleId, permission.id]);
        addedCount++;
      }
    }
    console.log(`  ✅ Assigned ${addedCount} permissions to SuperAdmin`);
    
    // 6. Update user role assignments
    console.log('\n👥 Fixing User Role Assignments:');
    
    // Update admin user to super_admin role
    await pool.query(`
      UPDATE users SET role_id = ?, role_name = 'super_admin' WHERE username = 'admin'
    `, [superAdminRoleId]);
    console.log('  ✅ Updated admin user to super_admin role');
    
    // Get admin role ID (regular admin)
    const [adminRoleResult] = await pool.query(`
      SELECT id FROM roles WHERE name = 'admin'
    `);
    const adminRoleId = adminRoleResult[0].id;
    
    // Update Aamir user to admin role
    await pool.query(`
      UPDATE users SET role_id = ?, role_name = 'admin' WHERE username = 'Aamir'
    `, [adminRoleId]);
    console.log('  ✅ Updated Aamir user to admin role');
    
    // 7. Assign appropriate permissions to admin role
    console.log('\n👤 Assigning permissions to Admin role:');
    const adminPermissions = [
      'users_read', 'users_create', 'users_update', 'users_delete',
      'roles_read', 'roles_create', 'roles_update', 'roles_delete',
      'campaigns_read', 'campaigns_create', 'campaigns_update', 'campaigns_delete',
      'campaign_types_read', 'campaign_data_read', 'campaign_data_create',
      'cards_read', 'cards_create', 'card_users_read', 'card_users_create',
      'reports_read', 'reports_create', 'reports_export',
      'brands_read' // Only read permission for brands
    ];
    
    let adminAddedCount = 0;
    for (const permName of adminPermissions) {
      const [permId] = await pool.query(`
        SELECT id FROM permissions WHERE name = ?
      `, [permName]);
      
      if (permId.length > 0) {
        const [hasPermission] = await pool.query(`
          SELECT id FROM role_permissions WHERE role_id = ? AND permission_id = ?
        `, [adminRoleId, permId[0].id]);
        
        if (hasPermission.length === 0) {
          await pool.query(`
            INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)
          `, [adminRoleId, permId[0].id]);
          adminAddedCount++;
        }
      }
    }
    console.log(`  ✅ Assigned ${adminAddedCount} permissions to Admin role`);
    
    // 8. Final verification
    console.log('\n📊 Final Verification:');
    
    // Check modules
    const [moduleCount] = await pool.query(`
      SELECT COUNT(*) as count FROM modules WHERE is_active = 1
    `);
    console.log(`  📁 Active modules: ${moduleCount[0].count}`);
    
    // Check permissions
    const [permCount] = await pool.query(`
      SELECT COUNT(*) as count FROM permissions WHERE is_active = 1
    `);
    console.log(`  🔑 Active permissions: ${permCount[0].count}`);
    
    // Check roles
    const [roleCount] = await pool.query(`
      SELECT COUNT(*) as count FROM roles WHERE is_active = 1
    `);
    console.log(`  🎭 Active roles: ${roleCount[0].count}`);
    
    // Check role permissions
    const [superAdminPermCount] = await pool.query(`
      SELECT COUNT(*) as count FROM role_permissions WHERE role_id = ?
    `, [superAdminRoleId]);
    console.log(`  🔥 SuperAdmin permissions: ${superAdminPermCount[0].count}`);
    
    const [adminPermCount] = await pool.query(`
      SELECT COUNT(*) as count FROM role_permissions WHERE role_id = ?
    `, [adminRoleId]);
    console.log(`  👤 Admin permissions: ${adminPermCount[0].count}`);
    
    console.log('\n✅ DATABASE ENTRIES FIXED SUCCESSFULLY!');
    console.log('\n🎯 Summary:');
    console.log('  • Added brands module and permissions');
    console.log('  • Added complete role management permissions');
    console.log('  • Created/updated super_admin role');
    console.log('  • Fixed user role assignments');
    console.log('  • SuperAdmin has all permissions');
    console.log('  • Admin has appropriate limited permissions');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing database entries:', error);
    process.exit(1);
  }
}

fixMissingDatabaseEntries();
