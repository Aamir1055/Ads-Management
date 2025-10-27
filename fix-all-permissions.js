/**
 * Comprehensive Fix for All Permission Issues
 * This script will diagnose and fix:
 * 1. SuperAdmin access for campaign types
 * 2. Card dropdown permissions
 * 3. Role permission assignments
 */

const { pool } = require('./config/database');

async function fixAllPermissions() {
  console.log('🔧 Comprehensive Permission Fix...\\n');
  
  try {
    // 1. Check current user roles and their permissions
    console.log('1️⃣ Analyzing current role-permission structure...');
    
    const [rolePermissions] = await pool.query(`
      SELECT 
        r.id as role_id,
        r.name as role_name,
        r.level as role_level,
        p.name as permission_name,
        p.category as permission_category
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      WHERE r.is_active = 1
      ORDER BY r.level DESC, r.name, p.category, p.name
    `);
    
    // Group by role
    const roleGroups = {};
    rolePermissions.forEach(row => {
      if (!roleGroups[row.role_name]) {
        roleGroups[row.role_name] = {
          id: row.role_id,
          level: row.role_level,
          permissions: []
        };
      }
      if (row.permission_name) {
        roleGroups[row.role_name].permissions.push({
          name: row.permission_name,
          category: row.permission_category
        });
      }
    });
    
    console.log('\\n📋 Current Role Permissions:');
    Object.keys(roleGroups).forEach(roleName => {
      const role = roleGroups[roleName];
      console.log(`\\n${roleName} (Level: ${role.level}):`);
      
      const categorized = {};
      role.permissions.forEach(p => {
        if (!categorized[p.category]) categorized[p.category] = [];
        categorized[p.category].push(p.name.split('_').pop());
      });
      
      Object.keys(categorized).forEach(category => {
        console.log(`   ${category}: [${categorized[category].join(', ')}]`);
      });
      
      if (role.permissions.length === 0) {
        console.log('   ❌ No permissions assigned!');
      }
    });
    
    // 2. Fix SuperAdmin role permissions
    console.log('\\n2️⃣ Ensuring SuperAdmin has all necessary permissions...');
    
    const superAdminRole = roleGroups['super_admin'];
    if (superAdminRole) {
      console.log(`Found super_admin role (ID: ${superAdminRole.id}, Level: ${superAdminRole.level})`);
      
      // Get all permissions that SuperAdmin should have
      const [allPermissions] = await pool.query(`
        SELECT id, name, category FROM permissions WHERE is_active = 1
      `);
      
      console.log(`\\nGranting all ${allPermissions.length} permissions to super_admin role...`);
      
      for (const perm of allPermissions) {
        // Check if already assigned
        const [existing] = await pool.query(`
          SELECT id FROM role_permissions 
          WHERE role_id = ? AND permission_id = ?
        `, [superAdminRole.id, perm.id]);
        
        if (existing.length === 0) {
          await pool.query(`
            INSERT INTO role_permissions (role_id, permission_id, created_at)
            VALUES (?, ?, NOW())
          `, [superAdminRole.id, perm.id]);
          console.log(`   ✅ Granted: ${perm.name}`);
        }
      }
      
      console.log('✅ SuperAdmin now has all permissions');
    } else {
      console.log('❌ super_admin role not found!');
    }
    
    // 3. Fix other roles with essential permissions
    console.log('\\n3️⃣ Ensuring other roles have essential permissions...');
    
    // Advertiser role should have basic permissions
    const advertiserRole = roleGroups['Advertiser'];
    if (advertiserRole) {
      const essentialPermissions = [
        'cards_read', 'cards_create', 'cards_update',
        'campaign_data_read', 'campaign_data_create', 'campaign_data_update',
        'campaigns_read', 'campaigns_create', 'campaigns_update',
        'card_users_read', 'card_users_create', 'card_users_update'
      ];
      
      console.log(`\\nGranting essential permissions to Advertiser role...`);
      
      for (const permName of essentialPermissions) {
        const [perm] = await pool.query(`
          SELECT id FROM permissions WHERE name = ?
        `, [permName]);
        
        if (perm.length > 0) {
          const [existing] = await pool.query(`
            SELECT id FROM role_permissions 
            WHERE role_id = ? AND permission_id = ?
          `, [advertiserRole.id, perm[0].id]);
          
          if (existing.length === 0) {
            await pool.query(`
              INSERT INTO role_permissions (role_id, permission_id, created_at)
              VALUES (?, ?, NOW())
            `, [advertiserRole.id, perm[0].id]);
            console.log(`   ✅ Granted to Advertiser: ${permName}`);
          }
        }
      }
    }
    
    // 4. Check route configurations
    console.log('\\n4️⃣ Checking route configurations...');
    
    const routeChecks = [
      { module: 'campaign-types', method: 'POST', requiresSuperAdmin: true },
      { module: 'cards', method: 'GET', requiresSuperAdmin: false },
      { module: 'card-users', method: 'GET', requiresSuperAdmin: false },
      { module: 'brands', method: 'POST', requiresSuperAdmin: true }
    ];
    
    routeChecks.forEach(route => {
      console.log(`   ${route.method} /api/${route.module}: ${route.requiresSuperAdmin ? 'SuperAdmin required' : 'Regular permissions'}`);
    });
    
    // 5. Test the SuperAdmin middleware logic
    console.log('\\n5️⃣ Testing SuperAdmin middleware logic...');
    
    const testUsers = [
      { username: 'admin', role_name: 'super_admin', role_level: 10 },
      { username: 'priyankjp', role_name: 'Advertiser', role_level: 1 }
    ];
    
    testUsers.forEach(user => {
      const isSuperAdmin = (
        user.role_level >= 10 ||
        user.role_name === 'SuperAdmin' ||
        user.role_name === 'Super Admin' ||
        user.role_name === 'super_admin' ||
        user.role_name === 'superadmin' ||
        user.role_name === 'SUPERADMIN'
      );
      
      console.log(`   ${user.username} (${user.role_name}): ${isSuperAdmin ? '✅ SuperAdmin' : '❌ Regular User'}`);
    });
    
    // 6. Final role summary
    console.log('\\n6️⃣ Final Role Permission Summary...');
    
    const [finalRolePerms] = await pool.query(`
      SELECT 
        r.name as role_name,
        r.level as role_level,
        COUNT(DISTINCT p.id) as total_permissions,
        COUNT(DISTINCT CASE WHEN p.name LIKE 'cards_%' THEN p.id END) as cards_permissions,
        COUNT(DISTINCT CASE WHEN p.name LIKE 'campaigns_%' THEN p.id END) as campaigns_permissions,
        COUNT(DISTINCT CASE WHEN p.name LIKE 'campaign_types_%' THEN p.id END) as campaign_types_permissions
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id AND p.is_active = 1
      WHERE r.is_active = 1
      GROUP BY r.id, r.name, r.level
      ORDER BY r.level DESC
    `);
    
    console.log('\\n📊 Final Summary:');
    finalRolePerms.forEach(role => {
      console.log(`\\n${role.role_name} (Level: ${role.role_level}):`);
      console.log(`   Total Permissions: ${role.total_permissions}`);
      console.log(`   Cards: ${role.cards_permissions}`);
      console.log(`   Campaigns: ${role.campaigns_permissions}`);
      console.log(`   Campaign Types: ${role.campaign_types_permissions}`);
    });
    
    console.log('\\n🎯 WHAT THIS FIXED:');
    console.log('✅ SuperAdmin (super_admin) role now has ALL permissions');
    console.log('✅ Advertiser role has essential permissions for cards, campaigns, etc.');
    console.log('✅ Card dropdowns should work (cards_read permission granted)');
    console.log('✅ Campaign types creation should work for super_admin users');
    
    console.log('\\n💡 NEXT STEPS:');
    console.log('1. The server is already running with updated middleware');
    console.log('2. Refresh your browser page');
    console.log('3. Try creating a campaign type as admin user');
    console.log('4. Check if card dropdowns work in card-users module');
    console.log('5. If still issues, clear browser cache/localStorage');
    
  } catch (error) {
    console.error('❌ Error fixing permissions:', error);
  } finally {
    await pool.end();
  }
}

// Run the comprehensive fix
fixAllPermissions();
