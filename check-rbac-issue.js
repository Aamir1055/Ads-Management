const mysql = require('mysql2/promise');

async function checkRBACIssue() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ads reporting'
  });
  
  try {
    console.log('🔍 RBAC ISSUE DIAGNOSIS');
    console.log('========================\n');

    // 1. Check if tables exist
    console.log('1. Database Structure:');
    const [tables] = await connection.execute("SHOW TABLES");
    const tableNames = tables.map(t => Object.values(t)[0]);
    console.log('   Available tables:', tableNames.join(', '));
    
    const requiredTables = ['users', 'roles', 'permissions', 'role_permissions', 'user_roles'];
    const missingTables = requiredTables.filter(t => !tableNames.includes(t));
    if (missingTables.length > 0) {
      console.log('   ❌ Missing tables:', missingTables.join(', '));
    } else {
      console.log('   ✅ All required tables exist');
    }

    // 2. Check Pakistan role
    console.log('\n2. Pakistan Role Analysis:');
    const [pakistanRoles] = await connection.execute('SELECT * FROM roles WHERE name = ?', ['pakistan']);
    
    if (pakistanRoles.length === 0) {
      console.log('   ❌ Pakistan role not found');
      return;
    }
    
    const pakistanRole = pakistanRoles[0];
    console.log(`   ✅ Pakistan role found (ID: ${pakistanRole.id})`);
    console.log(`   Description: ${pakistanRole.description || 'No description'}`);
    console.log(`   Level: ${pakistanRole.level || 'Not set'}`);
    console.log(`   Active: ${pakistanRole.is_active ? 'Yes' : 'No'}`);

    // 3. Check Pakistan role permissions
    console.log('\n3. Pakistan Role Permissions:');
    const [rolePermissions] = await connection.execute(`
      SELECT 
        p.id,
        p.name as permission_name,
        p.display_name,
        p.category,
        p.description
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ? AND p.is_active = 1
      ORDER BY p.category, p.display_name
    `, [pakistanRole.id]);
    
    if (rolePermissions.length === 0) {
      console.log('   ❌ No permissions assigned to Pakistan role');
    } else {
      console.log(`   ✅ Pakistan role has ${rolePermissions.length} permissions:`);
      const permsByCategory = {};
      rolePermissions.forEach(p => {
        if (!permsByCategory[p.category]) {
          permsByCategory[p.category] = [];
        }
        permsByCategory[p.category].push(p);
      });
      
      Object.entries(permsByCategory).forEach(([category, perms]) => {
        console.log(`      📁 ${category}:`);
        perms.forEach(p => {
          console.log(`         - ${p.permission_name}: ${p.display_name || 'No display name'}`);
        });
      });
    }

    // 4. Check India user
    console.log('\n4. India User Analysis:');
    const [indiaUsers] = await connection.execute('SELECT * FROM users WHERE username = ?', ['India']);
    
    if (indiaUsers.length === 0) {
      console.log('   ❌ India user not found');
      return;
    }
    
    const indiaUser = indiaUsers[0];
    console.log(`   ✅ India user found (ID: ${indiaUser.id})`);
    console.log(`   Active: ${indiaUser.is_active ? 'Yes' : 'No'}`);
    console.log(`   Primary Role ID: ${indiaUser.role_id || 'None'}`);

    // 5. Check India user role assignments
    console.log('\n5. India User Role Assignments:');
    
    // Check if using user_roles table or role_id column in users table
    const [userRoleExists] = await connection.execute("SHOW COLUMNS FROM users LIKE 'role_id'");
    const [userRolesTableExists] = await connection.execute("SHOW TABLES LIKE 'user_roles'");
    
    if (userRoleExists.length > 0) {
      console.log('   📝 Using users.role_id column for role assignment');
      if (indiaUser.role_id) {
        const [roleDetails] = await connection.execute('SELECT * FROM roles WHERE id = ?', [indiaUser.role_id]);
        if (roleDetails.length > 0) {
          console.log(`   Current role: ${roleDetails[0].name} (ID: ${roleDetails[0].id})`);
          if (roleDetails[0].name !== 'pakistan') {
            console.log('   ⚠️  WARNING: India user is NOT assigned to Pakistan role!');
            console.log(`   India user has role: ${roleDetails[0].name}`);
          }
        }
      } else {
        console.log('   ❌ India user has no role assigned');
      }
    }
    
    if (userRolesTableExists.length > 0) {
      console.log('   📝 Checking user_roles table for additional role assignments');
      const [userRoles] = await connection.execute(`
        SELECT 
          ur.id as assignment_id,
          ur.role_id,
          r.name as role_name,
          ur.is_active,
          ur.assigned_at
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = ?
        ORDER BY ur.assigned_at DESC
      `, [indiaUser.id]);
      
      if (userRoles.length === 0) {
        console.log('   No additional roles in user_roles table');
      } else {
        console.log(`   Found ${userRoles.length} role assignment(s):`);
        userRoles.forEach(ur => {
          const status = ur.is_active ? '✅ Active' : '❌ Inactive';
          console.log(`      - ${ur.role_name} (ID: ${ur.role_id}) - ${status}`);
        });
      }
    }

    // 6. Check what permissions India user actually has
    console.log('\n6. India User Effective Permissions:');
    
    let effectivePermissions = [];
    
    // From primary role
    if (indiaUser.role_id) {
      const [primaryRolePerms] = await connection.execute(`
        SELECT 
          p.name as permission_name,
          p.display_name,
          p.category,
          'Primary Role' as source
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = ? AND p.is_active = 1
      `, [indiaUser.role_id]);
      
      effectivePermissions = [...effectivePermissions, ...primaryRolePerms];
    }
    
    // From user_roles table
    if (userRolesTableExists.length > 0) {
      const [additionalPerms] = await connection.execute(`
        SELECT 
          p.name as permission_name,
          p.display_name,
          p.category,
          CONCAT('Role: ', r.name) as source
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        JOIN user_roles ur ON rp.role_id = ur.role_id
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = ? AND ur.is_active = 1 AND p.is_active = 1
      `, [indiaUser.id]);
      
      effectivePermissions = [...effectivePermissions, ...additionalPerms];
    }
    
    if (effectivePermissions.length === 0) {
      console.log('   ❌ India user has NO effective permissions');
    } else {
      console.log(`   India user has ${effectivePermissions.length} effective permissions:`);
      const permsByCategory = {};
      effectivePermissions.forEach(p => {
        if (!permsByCategory[p.category]) {
          permsByCategory[p.category] = [];
        }
        permsByCategory[p.category].push(p);
      });
      
      Object.entries(permsByCategory).forEach(([category, perms]) => {
        console.log(`      📁 ${category}:`);
        perms.forEach(p => {
          console.log(`         - ${p.permission_name} (${p.source})`);
        });
      });
    }

    // 7. Check authentication middleware usage
    console.log('\n7. Authentication Issues Identified:');
    console.log('   🔍 Based on code analysis:');
    console.log('   - Permission routes have authentication DISABLED (line 5 & 45 commented out)');
    console.log('   - Auth routes have authentication DISABLED (lines 12-13 commented out)');
    console.log('   - This means API endpoints are not protected by authentication');
    console.log('   - Users can access any endpoint without proper authorization');
    
    // 8. Summary and recommendations
    console.log('\n🎯 ISSUE SUMMARY:');
    console.log('================');
    
    if (indiaUser.role_id && indiaUser.role_id !== pakistanRole.id) {
      console.log('❌ CRITICAL: India user is NOT assigned to Pakistan role');
      console.log(`   - India user has role_id: ${indiaUser.role_id}`);
      console.log(`   - Pakistan role id: ${pakistanRole.id}`);
    }
    
    if (rolePermissions.length === 0) {
      console.log('❌ CRITICAL: Pakistan role has no permissions');
    }
    
    console.log('❌ CRITICAL: Authentication middleware is disabled on API routes');
    console.log('❌ CRITICAL: Permission checks are not enforced');
    
    console.log('\n📋 RECOMMENDED FIXES:');
    console.log('====================');
    console.log('1. Fix user role assignment:');
    console.log(`   UPDATE users SET role_id = ${pakistanRole.id} WHERE username = 'India';`);
    
    if (rolePermissions.length === 0) {
      console.log('2. Assign permissions to Pakistan role (run permission assignment script)');
    }
    
    console.log('3. Enable authentication middleware:');
    console.log('   - Uncomment authentication lines in permissionsRoutes.js');
    console.log('   - Uncomment authentication lines in authRoutes.js');
    console.log('   - Add permission checks to other route files');
    
    console.log('4. Test the fixes by trying to access restricted endpoints');

  } finally {
    await connection.end();
  }
}

checkRBACIssue().catch(console.error);
