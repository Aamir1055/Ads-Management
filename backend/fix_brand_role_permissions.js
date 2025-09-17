const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '', // Add your MySQL password if needed
  database: 'ads reporting'
};

async function fixBrandRolePermissions() {
  let connection;
  
  try {
    console.log('🔍 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected successfully');
    
    // 1. Check current brand permissions assigned to roles
    console.log('\n🔍 Checking current brand permission assignments...');
    
    const [currentAssignments] = await connection.execute(`
      SELECT 
        r.id as role_id,
        r.name as role_name,
        p.id as permission_id,
        p.name as permission_name,
        p.display_name as permission_display_name
      FROM role_permissions rp
      JOIN roles r ON rp.role_id = r.id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE p.name LIKE 'brands_%' OR p.category = 'brands'
      ORDER BY r.name, p.name
    `);
    
    console.log(`Found ${currentAssignments.length} existing brand permission assignments:`);
    currentAssignments.forEach(assignment => {
      console.log(`  - ${assignment.role_name}: ${assignment.permission_display_name}`);
    });
    
    // 2. Get all admin-level roles
    console.log('\n👤 Finding admin roles...');
    
    const [adminRoles] = await connection.execute(`
      SELECT id, name, description
      FROM roles 
      WHERE name IN ('SuperAdmin', 'Super Admin', 'super_admin', 'Admin', 'admin')
      OR name LIKE '%admin%'
      ORDER BY name
    `);
    
    console.log(`Found ${adminRoles.length} admin roles:`, adminRoles.map(r => r.name));
    
    // 3. Get all brand permissions
    console.log('\n🏷️ Getting brand permissions...');
    
    const [brandPermissions] = await connection.execute(`
      SELECT id, name, display_name
      FROM permissions 
      WHERE name LIKE 'brands_%' OR category = 'brands'
      ORDER BY id
    `);
    
    console.log(`Found ${brandPermissions.length} brand permissions:`, brandPermissions.map(p => p.display_name));
    
    // 4. Check what's missing and assign
    console.log('\n🔧 Assigning missing brand permissions to admin roles...');
    
    let totalAssignments = 0;
    
    for (const role of adminRoles) {
      console.log(`\n  Processing role: ${role.name} (ID: ${role.id})`);
      
      for (const permission of brandPermissions) {
        // Check if this role-permission combo already exists
        const [existing] = await connection.execute(`
          SELECT id FROM role_permissions 
          WHERE role_id = ? AND permission_id = ?
        `, [role.id, permission.id]);
        
        if (existing.length === 0) {
          // Insert the missing assignment
          const [insertResult] = await connection.execute(`
            INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at)
            VALUES (?, ?, NOW(), NOW())
          `, [role.id, permission.id]);
          
          console.log(`    ✅ Assigned: ${permission.display_name}`);
          totalAssignments++;
        } else {
          console.log(`    ℹ️  Already has: ${permission.display_name}`);
        }
      }
    }
    
    console.log(`\n🎉 Assigned ${totalAssignments} new brand permissions to admin roles!`);
    
    // 5. Final verification
    console.log('\n📊 Final verification...');
    
    const [finalAssignments] = await connection.execute(`
      SELECT 
        r.name as role_name,
        p.name as permission_name,
        p.display_name as permission_display_name,
        rp.created_at
      FROM role_permissions rp
      JOIN roles r ON rp.role_id = r.id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE p.name LIKE 'brands_%' OR p.category = 'brands'
      ORDER BY r.name, p.name
    `);
    
    console.log(`\nTotal brand permission assignments: ${finalAssignments.length}`);
    finalAssignments.forEach(assignment => {
      console.log(`  - ${assignment.role_name}: ${assignment.permission_display_name}`);
    });
    
    // 6. Test a specific user's permissions (if we can find one)
    console.log('\n👥 Checking user permissions (sample)...');
    
    const [adminUsers] = await connection.execute(`
      SELECT u.id, u.username, r.name as role_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE r.name IN ('SuperAdmin', 'Super Admin', 'super_admin', 'Admin', 'admin')
      AND u.is_active = 1
      LIMIT 3
    `);
    
    for (const user of adminUsers) {
      console.log(`\n  User: ${user.username} (Role: ${user.role_name})`);
      
      const [userBrandPerms] = await connection.execute(`
        SELECT p.name, p.display_name
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = (SELECT role_id FROM users WHERE id = ?)
        AND (p.name LIKE 'brands_%' OR p.category = 'brands')
        ORDER BY p.name
      `, [user.id]);
      
      console.log(`    Brand permissions: ${userBrandPerms.map(p => p.display_name).join(', ')}`);
    }
    
    console.log('\n✅ Brand role permissions fix completed!');
    console.log('🔑 Admin users should now have access to all brand management features.');
    console.log('🏷️  Try logging in as an admin user and accessing the brand management module.');
    
  } catch (error) {
    console.error('❌ Error fixing brand role permissions:', error);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Database connection failed. Please ensure MySQL is running.');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

console.log('🚀 Starting brand role permissions fix...');
fixBrandRolePermissions();
