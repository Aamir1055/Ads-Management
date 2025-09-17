const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'ads reporting'
};

async function debugUserBrandPermissions() {
  let connection;
  
  try {
    console.log('🔍 DEBUG: Checking user brand permissions...\n');
    
    connection = await mysql.createConnection(dbConfig);
    
    // 1. Check all users and their roles
    console.log('👥 STEP 1: All users and roles');
    console.log('═══════════════════════════════════');
    const [users] = await connection.execute(`
      SELECT 
        u.id, u.username, u.is_active,
        r.id as role_id, r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      ORDER BY u.id
    `);
    
    users.forEach(user => {
      console.log(`User ID ${user.id}: ${user.username} | Role: ${user.role_name} (ID: ${user.role_id}) | Active: ${user.is_active}`);
    });
    
    // 2. Check brand permissions in database
    console.log('\n🏷️ STEP 2: Brand permissions in database');
    console.log('═══════════════════════════════════════');
    const [brandPerms] = await connection.execute(`
      SELECT id, name, display_name, category, module_id, is_active
      FROM permissions
      WHERE name LIKE 'brands_%' OR category = 'brands'
      ORDER BY id
    `);
    
    brandPerms.forEach(perm => {
      console.log(`Permission ID ${perm.id}: ${perm.name} | ${perm.display_name} | Module: ${perm.module_id} | Active: ${perm.is_active}`);
    });
    
    // 3. Check role-permission assignments for brand permissions
    console.log('\n🔗 STEP 3: Role-Permission assignments for brands');
    console.log('════════════════════════════════════════════');
    const [rolePermissions] = await connection.execute(`
      SELECT 
        rp.id as assignment_id,
        r.name as role_name,
        p.name as permission_name,
        p.display_name as permission_display_name
      FROM role_permissions rp
      JOIN roles r ON rp.role_id = r.id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE p.name LIKE 'brands_%' OR p.category = 'brands'
      ORDER BY r.name, p.name
    `);
    
    if (rolePermissions.length === 0) {
      console.log('❌ NO role-permission assignments found for brand permissions!');
      console.log('   This is the problem - admin roles need to be assigned brand permissions.');
    } else {
      rolePermissions.forEach(assignment => {
        console.log(`${assignment.role_name} -> ${assignment.permission_display_name} (${assignment.permission_name})`);
      });
    }
    
    // 4. Check what permissions each admin user actually has
    console.log('\n🔑 STEP 4: Actual permissions for admin users');
    console.log('═══════════════════════════════════════════');
    
    const adminUsers = users.filter(u => 
      u.role_name && (
        u.role_name.toLowerCase().includes('admin') || 
        u.role_name.toLowerCase().includes('super')
      )
    );
    
    for (const user of adminUsers) {
      console.log(`\nUser: ${user.username} (${user.role_name})`);
      
      const [userPerms] = await connection.execute(`
        SELECT p.name, p.display_name
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = ? AND (p.name LIKE 'brands_%' OR p.category = 'brands')
        ORDER BY p.name
      `, [user.role_id]);
      
      if (userPerms.length === 0) {
        console.log(`  ❌ NO brand permissions found for ${user.username}!`);
      } else {
        console.log(`  ✅ Brand permissions: ${userPerms.map(p => p.display_name).join(', ')}`);
      }
    }
    
    // 5. Check role_permissions table structure
    console.log('\n📋 STEP 5: role_permissions table check');
    console.log('══════════════════════════════════════');
    const [rolePermCount] = await connection.execute(`
      SELECT COUNT(*) as total FROM role_permissions
    `);
    console.log(`Total role-permission assignments: ${rolePermCount[0].total}`);
    
    // Check if there are any assignments for admin roles
    const [adminRoleIds] = await connection.execute(`
      SELECT id, name FROM roles WHERE name LIKE '%admin%' OR name LIKE '%Admin%'
    `);
    
    for (const role of adminRoleIds) {
      const [roleAssignments] = await connection.execute(`
        SELECT COUNT(*) as count FROM role_permissions WHERE role_id = ?
      `, [role.id]);
      console.log(`${role.name} (ID: ${role.id}): ${roleAssignments[0].count} total permissions assigned`);
    }
    
    // 6. Suggest fix
    console.log('\n💡 DIAGNOSIS & RECOMMENDED FIX');
    console.log('══════════════════════════════════');
    
    if (rolePermissions.length === 0) {
      console.log('🚨 ISSUE: No brand permissions assigned to any roles!');
      console.log('');
      console.log('🔧 SOLUTION: Run the brand permissions fix script again:');
      console.log('   node fix_brand_role_permissions.js');
      console.log('');
      console.log('🔧 MANUAL FIX: Add brand permissions to admin roles:');
      adminUsers.forEach(user => {
        brandPerms.forEach(perm => {
          console.log(`   INSERT INTO role_permissions (role_id, permission_id) VALUES (${user.role_id}, ${perm.id});`);
        });
      });
    } else {
      console.log('✅ Brand permissions are assigned to roles.');
      console.log('🔍 The issue might be:');
      console.log('   1. User is not in the expected role');
      console.log('   2. Token/session doesn\'t have updated role info');
      console.log('   3. Frontend is not sending the correct token');
      console.log('   4. Middleware is not recognizing the permissions');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

debugUserBrandPermissions();
