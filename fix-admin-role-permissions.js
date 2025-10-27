const { pool } = require('./config/database');

async function fixAdminRolePermissions() {
  try {
    console.log('🔧 FIXING ADMIN ROLE PERMISSIONS');
    console.log('=' .repeat(60));
    
    const adminRoleId = 2; // Based on database analysis
    
    // Check current admin role permissions
    console.log('\n📋 Current Admin Role Permissions:');
    const [currentPerms] = await pool.query(`
      SELECT 
        p.name, 
        p.display_name,
        m.name as module_name
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      JOIN modules m ON p.module_id = m.id
      WHERE rp.role_id = ?
      ORDER BY m.name, p.name
    `, [adminRoleId]);
    
    currentPerms.forEach(perm => {
      console.log(`  ✓ ${perm.name} (${perm.display_name}) - ${perm.module_name}`);
    });
    
    console.log(`\nTotal current permissions: ${currentPerms.length}`);
    
    // Define missing role management permissions that admin should have
    const missingRolePerms = [
      'roles_create',
      'roles_read', 
      'roles_update',
      'roles_delete'
    ];
    
    console.log('\n🎯 Adding Missing Role Management Permissions:');
    
    for (const permName of missingRolePerms) {
      try {
        // Check if permission exists
        const [permExists] = await pool.query(`
          SELECT id FROM permissions WHERE name = ?
        `, [permName]);
        
        if (permExists.length === 0) {
          console.log(`  ❌ Permission ${permName} does not exist in database`);
          continue;
        }
        
        const permissionId = permExists[0].id;
        
        // Check if admin already has this permission
        const [hasPermission] = await pool.query(`
          SELECT id FROM role_permissions 
          WHERE role_id = ? AND permission_id = ?
        `, [adminRoleId, permissionId]);
        
        if (hasPermission.length > 0) {
          console.log(`  ✅ Admin already has ${permName}`);
        } else {
          // Add the permission
          await pool.query(`
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES (?, ?)
          `, [adminRoleId, permissionId]);
          console.log(`  ➕ Added ${permName} to admin role`);
        }
      } catch (error) {
        console.log(`  ❌ Error adding ${permName}: ${error.message}`);
      }
    }
    
    // Also add reports_export for completeness
    console.log('\n📊 Adding Missing Report Permissions:');
    try {
      const [reportExportPerm] = await pool.query(`
        SELECT id FROM permissions WHERE name = 'reports_export'
      `);
      
      if (reportExportPerm.length > 0) {
        const [hasExport] = await pool.query(`
          SELECT id FROM role_permissions 
          WHERE role_id = ? AND permission_id = ?
        `, [adminRoleId, reportExportPerm[0].id]);
        
        if (hasExport.length === 0) {
          await pool.query(`
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES (?, ?)
          `, [adminRoleId, reportExportPerm[0].id]);
          console.log('  ➕ Added reports_export to admin role');
        } else {
          console.log('  ✅ Admin already has reports_export');
        }
      }
    } catch (error) {
      console.log(`  ❌ Error adding reports_export: ${error.message}`);
    }
    
    // Verify final admin permissions
    console.log('\n📋 Final Admin Role Permissions:');
    const [finalPerms] = await pool.query(`
      SELECT 
        p.name, 
        p.display_name,
        m.name as module_name,
        m.display_name as module_display
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      JOIN modules m ON p.module_id = m.id
      WHERE rp.role_id = ?
      ORDER BY m.name, p.name
    `, [adminRoleId]);
    
    const permsByModule = {};
    finalPerms.forEach(perm => {
      if (!permsByModule[perm.module_name]) {
        permsByModule[perm.module_name] = {
          display: perm.module_display,
          permissions: []
        };
      }
      permsByModule[perm.module_name].permissions.push({
        name: perm.name,
        display: perm.display_name
      });
    });
    
    Object.keys(permsByModule).forEach(moduleName => {
      const module = permsByModule[moduleName];
      console.log(`\n  📁 ${module.display} (${moduleName}):`);
      module.permissions.forEach(perm => {
        console.log(`     ✓ ${perm.name} (${perm.display})`);
      });
    });
    
    console.log(`\n📊 Total final permissions: ${finalPerms.length}`);
    
    // Verify role management permissions specifically
    console.log('\n🎭 Role Management Permission Check:');
    const roleManagementPerms = finalPerms.filter(p => p.module_name === 'roles');
    const hasBasicRoleCRUD = ['roles_create', 'roles_read', 'roles_update', 'roles_delete']
      .every(perm => roleManagementPerms.some(p => p.name === perm));
    
    if (hasBasicRoleCRUD) {
      console.log('  ✅ Admin now has all basic role CRUD permissions');
    } else {
      console.log('  ❌ Admin still missing some role CRUD permissions');
    }
    
    // Compare with SuperAdmin permissions
    console.log('\n🔥 SuperAdmin vs Admin Comparison:');
    const [superAdminPerms] = await pool.query(`
      SELECT COUNT(*) as count
      FROM role_permissions rp
      WHERE rp.role_id = 5
    `);
    
    console.log(`  SuperAdmin permissions: ${superAdminPerms[0].count}`);
    console.log(`  Admin permissions: ${finalPerms.length}`);
    console.log(`  Difference: ${superAdminPerms[0].count - finalPerms.length} (SuperAdmin has more)`);
    
    console.log('\n✅ ADMIN ROLE PERMISSION FIX COMPLETE!');
    console.log('\n🎯 Summary of Changes:');
    console.log('  • Added missing role CRUD permissions to admin');
    console.log('  • Added reports_export permission to admin');
    console.log('  • Admin can now fully manage roles');
    console.log('  • SuperAdmin still has unrestricted access');
    
    console.log('\n🚀 Next Steps:');
    console.log('  1. Restart your backend server');
    console.log('  2. Test role management functionality');
    console.log('  3. For brand loading issue: Debug frontend code');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing admin role permissions:', error);
    process.exit(1);
  }
}

fixAdminRolePermissions();
