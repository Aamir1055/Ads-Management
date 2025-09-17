const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ads reporting'
};

async function addRolePermissions() {
  let connection;
  
  try {
    console.log('🔧 Adding missing role management permissions...');
    connection = await mysql.createConnection(dbConfig);
    
    // Get the roles module ID
    const [rolesModule] = await connection.execute(`
      SELECT id FROM modules WHERE name = 'roles'
    `);
    
    const moduleId = rolesModule.length > 0 ? rolesModule[0].id : 2;
    
    // Define the missing role permissions
    const rolePermissions = [
      ['roles_create', 'Create Roles', 'Create new roles in the system'],
      ['roles_read', 'View Roles', 'View roles and their details'],
      ['roles_update', 'Update Roles', 'Edit existing roles'],
      ['roles_delete', 'Delete Roles', 'Remove roles from the system'],
      ['permissions_assign', 'Assign Permissions', 'Assign permissions to roles'],
      ['permissions_revoke', 'Revoke Permissions', 'Remove permissions from roles'],
      ['users_assign_roles', 'Assign User Roles', 'Assign roles to users'],
      ['users_revoke_roles', 'Revoke User Roles', 'Remove roles from users']
    ];
    
    console.log('📋 Adding individual role permissions...');
    
    for (const [name, displayName, description] of rolePermissions) {
      try {
        await connection.execute(`
          INSERT IGNORE INTO permissions (name, display_name, description, category, is_active, module_id) 
          VALUES (?, ?, ?, 'roles', 1, ?)
        `, [name, displayName, description, moduleId]);
        
        console.log(`  ✓ ${displayName}`);
      } catch (error) {
        console.log(`  ! ${displayName} (already exists)`);
      }
    }
    
    // Get super admin role ID
    const [superAdminRole] = await connection.execute(`
      SELECT id FROM roles WHERE name = 'super_admin'
    `);
    
    if (superAdminRole.length > 0) {
      const superAdminId = superAdminRole[0].id;
      
      // Grant all new permissions to super admin
      console.log('\n🔑 Granting new permissions to super admin...');
      
      const [newPerms] = await connection.execute(`
        SELECT id, display_name FROM permissions 
        WHERE name IN ('roles_create', 'roles_read', 'roles_update', 'roles_delete', 
                      'permissions_assign', 'permissions_revoke', 'users_assign_roles', 'users_revoke_roles')
      `);
      
      for (const perm of newPerms) {
        try {
          await connection.execute(`
            INSERT IGNORE INTO role_permissions (role_id, permission_id) 
            VALUES (?, ?)
          `, [superAdminId, perm.id]);
          
          console.log(`  ✓ ${perm.display_name}`);
        } catch (error) {
          // Ignore duplicates
        }
      }
    }
    
    // Show final permission count
    const [finalCount] = await connection.execute(`
      SELECT COUNT(*) as count FROM permissions WHERE category = 'roles' AND is_active = 1
    `);
    
    console.log(`\n✅ Total role management permissions: ${finalCount[0].count}`);
    
    // Show all role permissions
    const [allRolePerms] = await connection.execute(`
      SELECT name, display_name FROM permissions 
      WHERE category = 'roles' AND is_active = 1
      ORDER BY name
    `);
    
    console.log('\n📋 Available role management permissions:');
    allRolePerms.forEach(perm => {
      console.log(`  • ${perm.display_name} (${perm.name})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

addRolePermissions();
