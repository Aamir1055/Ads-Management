const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function createSuperAdmin() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ads reporting'
  });
  
  try {
    console.log('🔧 CREATING SUPER ADMIN USER');
    console.log('============================\n');

    // Admin user credentials
    const adminUsername = 'admin';
    const adminPassword = 'admin123';
    const adminEmail = 'admin@adsreporter.com';

    // 1. Check if Super Admin role exists, create if not
    console.log('1. Setting up Super Admin role...');
    let [superAdminRole] = await connection.execute('SELECT id FROM roles WHERE name = ?', ['Super Admin']);
    
    if (superAdminRole.length === 0) {
      const [result] = await connection.execute(`
        INSERT INTO roles (name, description, level, is_system_role, is_active, created_at, updated_at)
        VALUES ('Super Admin', 'Full system access with all permissions', 10, 1, 1, NOW(), NOW())
      `);
      superAdminRole = [{ id: result.insertId }];
      console.log('   ✅ Super Admin role created');
    } else {
      console.log('   ✅ Super Admin role already exists');
    }
    
    const superAdminRoleId = superAdminRole[0].id;

    // 2. Assign ALL permissions to Super Admin role
    console.log('\n2. Assigning all permissions to Super Admin role...');
    
    // Get all permissions
    const [allPermissions] = await connection.execute(`
      SELECT p.id, p.name as permission_name, p.category as module_name
      FROM permissions p
      WHERE p.is_active = 1
      ORDER BY p.category, p.name
    `);
    
    console.log(`   Found ${allPermissions.length} permissions across all modules`);
    
    let assignedCount = 0;
    for (const permission of allPermissions) {
      // Check if permission is already assigned
      const [existing] = await connection.execute(
        'SELECT role_id FROM role_permissions WHERE role_id = ? AND permission_id = ?',
        [superAdminRoleId, permission.id]
      );
      
      if (existing.length === 0) {
        await connection.execute(
          'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
          [superAdminRoleId, permission.id]
        );
        assignedCount++;
      }
    }
    
    console.log(`   ✅ Assigned ${assignedCount} new permissions to Super Admin role`);
    console.log(`   📋 Total permissions: ${allPermissions.length}`);

    // 3. Create Super Admin user
    console.log('\n3. Creating Super Admin user...');
    
    // Check if user already exists
    let [existingUser] = await connection.execute('SELECT id FROM users WHERE username = ?', [adminUsername]);
    
    if (existingUser.length === 0) {
      // Hash the password
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      
      const [result] = await connection.execute(`
        INSERT INTO users (username, hashed_password, role_id, is_active, created_at, updated_at)
        VALUES (?, ?, ?, 1, NOW(), NOW())
      `, [adminUsername, hashedPassword, superAdminRoleId]);
      
      existingUser = [{ id: result.insertId }];
      console.log(`   ✅ Super Admin user created: ${adminUsername}`);
    } else {
      console.log(`   ✅ Super Admin user already exists: ${adminUsername}`);
      
      // Update password in case it was forgotten
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await connection.execute(
        'UPDATE users SET hashed_password = ?, role_id = ?, updated_at = NOW() WHERE username = ?',
        [hashedPassword, superAdminRoleId, adminUsername]
      );
      console.log('   🔄 Password updated for existing user');
    }
    
    const adminUserId = existingUser[0].id;

    // 4. Verify role assignment (already done in user creation/update)
    console.log('\n4. Verifying role assignment...');
    console.log('   ✅ Super Admin role assigned directly to user via role_id');

    // 5. Verify user permissions
    console.log('\n5. Verifying Super Admin permissions...');
    
    const [userPermissions] = await connection.execute(`
      SELECT DISTINCT
        p.category as module_name,
        COUNT(p.id) as permission_count
      FROM users u
      JOIN roles r ON u.role_id = r.id
      JOIN role_permissions rp ON r.id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE u.username = ?
      GROUP BY p.category
      ORDER BY p.category
    `, [adminUsername]);
    
    console.log(`   Super Admin has access to ${userPermissions.length} modules:`);
    let totalPermissions = 0;
    userPermissions.forEach(perm => {
      console.log(`      📁 ${perm.module_name}: ${perm.permission_count} permissions`);
      totalPermissions += perm.permission_count;
    });
    
    console.log(`   📊 Total permissions: ${totalPermissions}`);

    // 6. Display user credentials
    console.log('\n🎉 SUPER ADMIN USER CREATED SUCCESSFULLY!');
    console.log('=========================================');
    console.log('');
    console.log('📋 LOGIN CREDENTIALS:');
    console.log(`   Username: ${adminUsername}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   User ID:  ${adminUserId}`);
    console.log('');
    console.log('🔑 PERMISSIONS:');
    console.log(`   - Role: Super Admin (Level 10)`);
    console.log(`   - Access: ALL ${userPermissions.length} modules`);
    console.log(`   - Total Permissions: ${totalPermissions}`);
    console.log('');
    console.log('🌟 ACCESSIBLE MODULES:');
    userPermissions.forEach(perm => {
      console.log(`   ✅ ${perm.module_name}`);
    });
    console.log('');
    console.log('🚀 READY TO LOGIN!');
    console.log('Navigate to your app and login with the credentials above.');
    console.log('This user will see ALL navigation items and have full system access.');

  } catch (error) {
    console.error('❌ Error creating Super Admin:', error);
  } finally {
    await connection.end();
  }
}

createSuperAdmin().catch(console.error);
