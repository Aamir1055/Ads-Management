const mysql = require('mysql2/promise');
require('dotenv').config();

async function resetPermissionSystem() {
  console.log('🔄 COMPLETELY RESETTING PERMISSION SYSTEM');
  console.log('=========================================');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ads reporting'
  });

  try {
    // Disable foreign key checks to allow dropping tables
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    console.log('   🔧 Disabled foreign key checks');
    
    // 1. Drop all existing permission-related tables
    console.log('\n1. 🗑️  Dropping old permission tables...');
    
    const tablesToDrop = [
      'user_roles',
      'role_permissions', 
      'permissions',
      'modules',
      'roles'
    ];

    for (const table of tablesToDrop) {
      try {
        await connection.execute(`DROP TABLE IF EXISTS ${table}`);
        console.log(`   ✅ Dropped table: ${table}`);
      } catch (err) {
        console.log(`   ⚠️  Could not drop ${table}: ${err.message}`);
      }
    }

    // 2. Create new simplified tables
    console.log('\n2. 🏗️  Creating new simplified tables...');

    // Create roles table - simple role definitions
    await connection.execute(`
      CREATE TABLE roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL COLLATE utf8mb4_general_ci,
        display_name VARCHAR(100) NOT NULL COLLATE utf8mb4_general_ci,
        permissions TEXT NOT NULL COMMENT 'JSON array of permission strings',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci
    `);
    console.log('   ✅ Created roles table');

    // Add role_name column to users table if it doesn't exist
    try {
      await connection.execute(`ALTER TABLE users ADD COLUMN role_name VARCHAR(100) DEFAULT 'user'`);
      console.log('   ✅ Added role_name to users table');
    } catch (err) {
      if (!err.message.includes('Duplicate column')) {
        console.log(`   ⚠️  Could not add role_name column: ${err.message}`);
      } else {
        console.log('   ✅ role_name column already exists');
      }
    }
    
    // Update role_name column collation to match roles table
    try {
      await connection.execute(`ALTER TABLE users MODIFY role_name VARCHAR(100) COLLATE utf8mb4_general_ci DEFAULT 'user'`);
      console.log('   ✅ Updated role_name column collation');
    } catch (err) {
      console.log(`   ⚠️  Could not update role_name collation: ${err.message}`);
    }

    // 3. Insert predefined roles with permissions
    console.log('\n3. 📝 Creating predefined roles...');

    const roles = [
      {
        name: 'super_admin',
        display_name: 'Super Admin',
        permissions: [
          'dashboard.view',
          'users.read', 'users.create', 'users.update', 'users.delete',
          'roles.read', 'roles.create', 'roles.update', 'roles.delete',
          'campaigns.read', 'campaigns.create', 'campaigns.update', 'campaigns.delete',
          'campaign-types.read', 'campaign-types.create', 'campaign-types.update', 'campaign-types.delete',
          'campaign-data.read', 'campaign-data.create', 'campaign-data.update', 'campaign-data.delete',
          'ads.read', 'ads.create', 'ads.update', 'ads.delete',
          'cards.read', 'cards.create', 'cards.update', 'cards.delete',
          'card-users.read', 'card-users.create', 'card-users.update', 'card-users.delete',
          'reports.read', 'reports.create', 'reports.update', 'reports.delete',
          'analytics.view',
          'modules.read',
          'settings.update'
        ]
      },
      {
        name: 'admin',
        display_name: 'Admin',
        permissions: [
          'dashboard.view',
          'users.read', 'users.create', 'users.update',
          'campaigns.read', 'campaigns.create', 'campaigns.update',
          'campaign-types.read', 'campaign-types.create', 'campaign-types.update',
          'campaign-data.read', 'campaign-data.create', 'campaign-data.update',
          'ads.read', 'ads.create', 'ads.update',
          'cards.read', 'cards.create', 'cards.update',
          'card-users.read', 'card-users.create', 'card-users.update',
          'reports.read', 'reports.create',
          'analytics.view'
        ]
      },
      {
        name: 'manager',
        display_name: 'Manager',
        permissions: [
          'dashboard.view',
          'campaigns.read', 'campaigns.update',
          'campaign-types.read', 'campaign-types.update',
          'campaign-data.read', 'campaign-data.update',
          'ads.read', 'ads.update',
          'reports.read', 'reports.create',
          'analytics.view'
        ]
      },
      {
        name: 'user',
        display_name: 'User',
        permissions: [
          'dashboard.view',
          'campaigns.read',
          'reports.read',
          'analytics.view'
        ]
      },
      {
        name: 'aamir_role',
        display_name: 'Aamir Role',
        permissions: [
          'dashboard.view',
          'campaign-types.read', 'campaign-types.create', 'campaign-types.update', 'campaign-types.delete',
          'campaign-data.read', 'campaign-data.create', 'campaign-data.update', 'campaign-data.delete'
        ]
      },
      {
        name: 'limited_access',
        display_name: 'Limited Access',
        permissions: [
          'dashboard.view',
          'campaign-data.read',
          'campaign-types.read',
          'card-users.read'
        ]
      }
    ];

    for (const role of roles) {
      await connection.execute(
        'INSERT INTO roles (name, display_name, permissions) VALUES (?, ?, ?)',
        [role.name, role.display_name, JSON.stringify(role.permissions)]
      );
      console.log(`   ✅ Created role: ${role.display_name} (${role.permissions.length} permissions)`);
    }

    // 4. Update existing users with appropriate roles
    console.log('\n4. 👥 Assigning roles to existing users...');

    // Reset all users to 'user' role first
    await connection.execute('UPDATE users SET role_name = "user"');

    // Assign specific roles
    const userRoleAssignments = [
      { username: 'admin', role: 'super_admin' },
      { username: 'aamir', role: 'admin' },
      { username: 'ahmed', role: 'admin' },
      { username: 'saad', role: 'super_admin' },
      { username: 'aamir_test', role: 'super_admin' },
      { username: 'Aamir105', role: 'aamir_role' },
      { username: 'nice', role: 'limited_access' }
    ];

    for (const assignment of userRoleAssignments) {
      const [result] = await connection.execute(
        'UPDATE users SET role_name = ? WHERE username = ?',
        [assignment.role, assignment.username]
      );
      
      if (result.affectedRows > 0) {
        console.log(`   ✅ ${assignment.username} → ${assignment.role}`);
      } else {
        console.log(`   ⚠️  User '${assignment.username}' not found`);
      }
    }

    // 5. Show final user-role assignments
    console.log('\n5. 📊 Final user-role assignments:');
    const [users] = await connection.execute(`
      SELECT u.username, u.role_name, r.display_name, r.permissions
      FROM users u 
      LEFT JOIN roles r ON u.role_name = r.name 
      ORDER BY u.username
    `);

    users.forEach(user => {
      const permCount = user.permissions ? JSON.parse(user.permissions).length : 0;
      console.log(`   👤 ${user.username} → ${user.display_name || 'Unknown Role'} (${permCount} permissions)`);
    });

    // Re-enable foreign key checks
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('   🔧 Re-enabled foreign key checks');
    
    console.log('\n🎉 PERMISSION SYSTEM RESET COMPLETE!');
    console.log('====================================');
    console.log('✅ All old tables dropped and recreated');
    console.log('✅ 6 predefined roles created');
    console.log('✅ Users assigned to appropriate roles');
    console.log('✅ System is ready for testing');

  } catch (error) {
    console.error('❌ Error resetting permission system:', error);
  } finally {
    await connection.end();
  }
}

// Run the reset
resetPermissionSystem().catch(console.error);
