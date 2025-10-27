/**
 * Debug SuperAdmin Role and Campaign Types Access
 * This script will check the SuperAdmin role and simulate the permission check
 */

const { pool } = require('./config/database');

async function debugSuperAdmin() {
  console.log('🔍 Debugging SuperAdmin Role and Campaign Types Access...\\n');
  
  try {
    // Check all users and their roles
    console.log('1️⃣ Checking all users and their roles...');
    const [users] = await pool.query(`
      SELECT u.id, u.username, u.role_id, r.name as role_name, r.level as role_level, r.description
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.is_active = 1
      ORDER BY u.id
    `);
    
    console.log('\\n📋 All Users:');
    users.forEach(user => {
      console.log(`   - ${user.username} (ID: ${user.id}, Role ID: ${user.role_id})`);
      console.log(`     → Role: ${user.role_name} (Level: ${user.role_level})`);
      console.log(`     → Description: ${user.description || 'No description'}`);
      console.log('');
    });
    
    // Test SuperAdmin check logic for each user
    console.log('2️⃣ Testing SuperAdmin check logic for each user...');
    
    for (const user of users) {
      console.log(`\\n🔧 Testing ${user.username} (${user.role_name}):`);
      
      const roleName = user.role_name || '';
      const roleLevel = Number(user.role_level) || 0;
      
      const isSuperAdmin = (
        roleLevel >= 10 ||
        roleName === 'SuperAdmin' ||
        roleName === 'Super Admin' ||
        roleName === 'super_admin' ||
        roleName === 'superadmin' ||
        roleName === 'SUPERADMIN'
      );
      
      console.log(`   Role Name: "${roleName}"`);
      console.log(`   Role Level: ${roleLevel}`);
      console.log(`   Is SuperAdmin: ${isSuperAdmin ? '✅ YES' : '❌ NO'}`);
      
      if (isSuperAdmin) {
        console.log(`   🔥 This user should have SuperAdmin access!`);
      } else {
        console.log(`   ⚠️  This user will be denied SuperAdmin access`);
      }
    }
    
    // Check what roles exist in the system
    console.log('\\n3️⃣ Checking all roles in the system...');
    const [roles] = await pool.query(`
      SELECT id, name, level, description, is_active
      FROM roles
      ORDER BY level DESC, name
    `);
    
    console.log('\\n📋 All Roles:');
    roles.forEach(role => {
      console.log(`   - ${role.name} (ID: ${role.id}, Level: ${role.level})`);
      console.log(`     → Description: ${role.description || 'No description'}`);
      console.log(`     → Active: ${role.is_active ? '✅ Yes' : '❌ No'}`);
      console.log('');
    });
    
    // Check campaign_types permissions in the database
    console.log('4️⃣ Checking campaign_types permissions...');
    const [permissions] = await pool.query(`
      SELECT p.*, COUNT(rp.role_id) as roles_with_permission
      FROM permissions p
      LEFT JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE p.name LIKE 'campaign_types_%' AND p.is_active = 1
      GROUP BY p.id
      ORDER BY p.name
    `);
    
    console.log('\\n📋 Campaign Types Permissions:');
    if (permissions.length > 0) {
      permissions.forEach(perm => {
        console.log(`   - ${perm.name} (${perm.display_name})`);
        console.log(`     → Description: ${perm.description || 'No description'}`);
        console.log(`     → Roles with this permission: ${perm.roles_with_permission}`);
        console.log('');
      });
    } else {
      console.log('   ⚠️  No campaign_types permissions found in database');
    }
    
    // Check which routes use requireSuperAdmin
    console.log('5️⃣ Campaign Types Routes Information...');
    console.log('\\n📋 Campaign Types API Routes:');
    console.log('   - GET /api/campaign-types → No SuperAdmin check (all authenticated users)');
    console.log('   - GET /api/campaign-types/:id → No SuperAdmin check (all authenticated users)');
    console.log('   - POST /api/campaign-types → requireSuperAdmin ⚠️  (SuperAdmin only)');
    console.log('   - PUT /api/campaign-types/:id → requireSuperAdmin ⚠️  (SuperAdmin only)');
    console.log('   - DELETE /api/campaign-types/:id → requireSuperAdmin ⚠️  (SuperAdmin only)');
    
    // Simulate the exact check that happens in the middleware
    console.log('\\n6️⃣ Simulating exact middleware check...');
    
    // Find the user who's likely logging in (highest level or admin-like name)
    const superUser = users.find(u => 
      u.role_name === 'super_admin' || 
      u.role_name === 'SuperAdmin' || 
      u.role_level >= 10 ||
      u.username === 'admin'
    );
    
    if (superUser) {
      console.log(`\\n🎯 Testing middleware for user: ${superUser.username}`);
      
      // Simulate the exact database query from requireSuperAdmin
      const [roleInfo] = await pool.query(`
        SELECT name, level FROM roles 
        WHERE id = ?
        LIMIT 1
      `, [superUser.role_id]);
      
      if (roleInfo.length > 0) {
        const roleName = roleInfo[0].name || '';
        const roleLevel = Number(roleInfo[0].level) || 0;
        
        const isSuperAdmin = (
          roleLevel >= 10 ||
          roleName === 'SuperAdmin' ||
          roleName === 'Super Admin' ||
          roleName === 'super_admin' ||
          roleName === 'superadmin' ||
          roleName === 'SUPERADMIN'
        );
        
        console.log(`   Database returned: name="${roleName}", level=${roleLevel}`);
        console.log(`   SuperAdmin check result: ${isSuperAdmin ? '✅ PASS' : '❌ FAIL'}`);
        
        if (isSuperAdmin) {
          console.log('   🎉 This user should be able to create campaign types!');
        } else {
          console.log('   ❌ This user will get 403 Forbidden when trying to create campaign types');
          console.log('   💡 Possible solutions:');
          console.log('      - Set role level to 10 or higher');
          console.log('      - Rename role to one of: SuperAdmin, Super Admin, super_admin');
        }
      }
    } else {
      console.log('\\n⚠️  No SuperAdmin-like user found to test');
    }
    
    console.log('\\n🎯 SUMMARY:');
    console.log('✅ SuperAdmin check has been updated to accept multiple role naming conventions');
    console.log('✅ Users with role level >= 10 will be granted SuperAdmin access');
    console.log('✅ Users with roles named: SuperAdmin, Super Admin, super_admin, superadmin, SUPERADMIN will be granted access');
    console.log('\\n💡 NEXT STEPS:');
    console.log('1. Restart your backend server to apply the middleware changes');
    console.log('2. Log in with your SuperAdmin account');
    console.log('3. Try creating a campaign type - it should work now!');
    
  } catch (error) {
    console.error('❌ Error debugging SuperAdmin:', error);
  } finally {
    await pool.end();
  }
}

// Run the debug
debugSuperAdmin();
