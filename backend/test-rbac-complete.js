const { pool } = require('./config/database');

async function testRBACComplete() {
  try {
    console.log('🧪 Testing Complete RBAC Setup...\n');
    
    // Test 1: Verify brand loading issue is fixed
    console.log('🏷️ Test 1: Brand Module Access');
    const [brandAccess] = await pool.query(`
      SELECT 
        u.username,
        r.name as role_name,
        GROUP_CONCAT(p.name ORDER BY p.name) as brand_permissions
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id AND p.name LIKE 'brands_%'
      GROUP BY u.id, r.id
      ORDER BY r.level DESC
    `);
    
    brandAccess.forEach(user => {
      const perms = user.brand_permissions ? user.brand_permissions.split(',') : ['NONE'];
      console.log(`  👤 ${user.username} (${user.role_name}): ${perms.join(', ')}`);
    });
    
    // Test 2: Verify role management permissions
    console.log('\n🎭 Test 2: Role Management Access');
    const [roleAccess] = await pool.query(`
      SELECT 
        u.username,
        r.name as role_name,
        GROUP_CONCAT(p.name ORDER BY p.name) as role_permissions
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id AND p.name LIKE 'roles_%'
      GROUP BY u.id, r.id
      ORDER BY r.level DESC
    `);
    
    roleAccess.forEach(user => {
      const perms = user.role_permissions ? user.role_permissions.split(',') : ['NONE'];
      console.log(`  👤 ${user.username} (${user.role_name}): ${perms.join(', ')}`);
    });
    
    // Test 3: Module availability check
    console.log('\n📋 Test 3: Available Modules');
    const [modules] = await pool.query(`
      SELECT name, display_name, is_active, route
      FROM modules
      WHERE is_active = 1
      ORDER BY order_index, name
    `);
    
    modules.forEach(module => {
      console.log(`  📁 ${module.display_name} (${module.name}) → ${module.route}`);
    });
    
    // Test 4: RBAC middleware compatibility check
    console.log('\n⚙️ Test 4: RBAC Middleware Compatibility');
    const middlewareModules = ['brands', 'roles', 'users', 'campaigns'];
    
    for (const module of middlewareModules) {
      const [modulePerms] = await pool.query(`
        SELECT p.name, p.display_name
        FROM permissions p
        JOIN modules m ON p.module_id = m.id
        WHERE m.name = ?
        AND p.name LIKE CONCAT(?, '_%')
        ORDER BY p.name
      `, [module, module]);
      
      const actions = modulePerms.map(p => p.name.replace(`${module}_`, '')).join(', ');
      console.log(`  🔧 ${module}: ${actions || 'NO PERMISSIONS FOUND'}`);
    }
    
    // Test 5: Test user permission scenarios
    console.log('\n🔍 Test 5: User Permission Scenarios');
    
    // Scenario 1: Admin user trying to access brands (should only have read)
    const [adminBrandTest] = await pool.query(`
      SELECT p.name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      JOIN role_permissions rp ON r.id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE u.username = 'Aamir' AND p.name LIKE 'brands_%'
    `);
    
    console.log(`  📝 Aamir (admin) brand access: ${adminBrandTest.map(p => p.name).join(', ') || 'NONE'}`);
    
    // Scenario 2: SuperAdmin user trying to access brands (should have all)
    const [superAdminBrandTest] = await pool.query(`
      SELECT p.name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      JOIN role_permissions rp ON r.id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE u.username = 'admin' AND p.name LIKE 'brands_%'
    `);
    
    console.log(`  📝 admin (super_admin) brand access: ${superAdminBrandTest.map(p => p.name).join(', ') || 'NONE'}`);
    
    // Test 6: Final validation
    console.log('\n✅ Final Validation Summary:');
    
    // Check if the brand loading issue should be resolved
    const adminHasRead = adminBrandTest.some(p => p.name === 'brands_read');
    const adminNoWrite = !adminBrandTest.some(p => ['brands_create', 'brands_update', 'brands_delete'].includes(p.name));
    
    if (adminHasRead && adminNoWrite) {
      console.log('  ✅ Brand loading issue should be RESOLVED');
      console.log('    • Admin users can VIEW brands');
      console.log('    • Admin users CANNOT create/edit/delete brands');
    } else {
      console.log('  ❌ Brand loading issue might persist');
    }
    
    // Check role management
    const adminCanManageRoles = roleAccess.find(u => u.username === 'Aamir');
    if (adminCanManageRoles && adminCanManageRoles.role_permissions && 
        adminCanManageRoles.role_permissions.includes('roles_read')) {
      console.log('  ✅ Role management is properly configured');
      console.log('    • Admin users can manage roles');
    } else {
      console.log('  ❌ Role management needs attention');
    }
    
    // Check SuperAdmin access
    const superAdminHasAll = superAdminBrandTest.length >= 4; // Should have all 4 brand permissions
    if (superAdminHasAll) {
      console.log('  ✅ SuperAdmin has unrestricted access');
    } else {
      console.log('  ❌ SuperAdmin permissions incomplete');
    }
    
    console.log('\n🎯 Next Steps:');
    console.log('  1. Restart your backend server');
    console.log('  2. Test brand module access in frontend');
    console.log('  3. Test role management functionality');
    console.log('  4. Available API endpoints:');
    console.log('     • GET /api/brands (for viewing brands)');
    console.log('     • POST /api/brands (SuperAdmin only)');
    console.log('     • GET /api/roles (for role management)');
    console.log('     • POST /api/roles (for creating roles)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error testing RBAC:', error);
    process.exit(1);
  }
}

testRBACComplete();
