const mysql = require('mysql2/promise');

async function checkPermissions() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ads reporting'
  });
  
  try {
    console.log('=== Checking Aamir Role Permissions ===');
    
    // Check if Aamir role exists
    const [roles] = await connection.execute(`
      SELECT id, name, description, level, is_system_role 
      FROM roles 
      WHERE name = 'Aamir'
    `);
    
    console.log('Aamir role details:', roles);
    
    if (roles.length === 0) {
      console.log('No role named "Aamir" found!');
      return;
    }
    
    const roleId = roles[0].id;
    
    // Check if there are any users with 'Aamir' role
    const [users] = await connection.execute(`
      SELECT u.id, u.username, r.name as role_name 
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = 1
      JOIN roles r ON ur.role_id = r.id
      WHERE r.name = 'Aamir'
      LIMIT 5
    `);
    
    console.log('\nUsers with Aamir role:', users);
    
    // Check what permissions the Aamir role has
    const [rolePerms] = await connection.execute(`
      SELECT 
        r.name as role_name,
        m.module_name,
        p.permission_name,
        p.permission_key
      FROM roles r
      JOIN role_permissions rp ON r.id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      JOIN modules m ON p.module_id = m.id
      WHERE r.name = 'Aamir'
      ORDER BY m.module_name, p.permission_name
    `);
    
    console.log('\nPermissions assigned to Aamir role:');
    if (rolePerms.length === 0) {
      console.log('No permissions assigned to Aamir role!');
    } else {
      const roleGrouped = {};
      rolePerms.forEach(p => {
        if (!roleGrouped[p.module_name]) roleGrouped[p.module_name] = [];
        roleGrouped[p.module_name].push(p.permission_name);
      });
      
      for (const [module, perms] of Object.entries(roleGrouped)) {
        console.log(`- ${module}: ${perms.join(', ')}`);
      }
    }
    
    // Check DEFAULT_MODULES permissions
    console.log('\n=== Checking Default Module Permissions ===');
    const DEFAULT_MODULES = ['ads', 'modules', 'two-factor-auth'];
    
    const [defaultPerms] = await connection.execute(`
      SELECT 
        m.module_name,
        p.permission_name,
        p.permission_key
      FROM permissions p
      JOIN modules m ON p.module_id = m.id
      WHERE m.module_name IN (?, ?, ?)
      AND p.is_active = 1
      AND m.is_active = 1
      ORDER BY m.module_name, p.permission_name
    `, DEFAULT_MODULES);
    
    console.log('Default module permissions that are auto-assigned:');
    const defaultGrouped = {};
    defaultPerms.forEach(p => {
      if (!defaultGrouped[p.module_name]) defaultGrouped[p.module_name] = [];
      defaultGrouped[p.module_name].push(p.permission_name);
    });
    
    for (const [module, perms] of Object.entries(defaultGrouped)) {
      console.log(`- ${module}: ${perms.join(', ')}`);
    }
    
    // If there are users with Aamir role, check their effective permissions
    if (users.length > 0) {
      const userId = users[0].id;
      const [userPermissions] = await connection.execute(`
        SELECT 
          module_name,
          permission_key,
          permission_name
        FROM user_permissions_view
        WHERE user_id = ?
        ORDER BY module_name, permission_name
      `, [userId]);
      
      console.log(`\n=== Effective Permissions for User ${users[0].username} (ID: ${userId}) ===`);
      
      if (userPermissions.length === 0) {
        console.log('No effective permissions found! This could be a view issue.');
      } else {
        // Group by module
        const grouped = {};
        userPermissions.forEach(p => {
          if (!grouped[p.module_name]) grouped[p.module_name] = [];
          grouped[p.module_name].push(p.permission_name);
        });
        
        for (const [module, perms] of Object.entries(grouped)) {
          console.log(`- ${module}: ${perms.join(', ')}`);
        }
      }
    }
    
    // Check all available modules to understand the scope
    console.log('\n=== All Available Modules ===');
    const [allModules] = await connection.execute(`
      SELECT module_name, description 
      FROM modules 
      WHERE is_active = 1 
      ORDER BY module_name
    `);
    
    allModules.forEach(m => {
      console.log(`- ${m.module_name}: ${m.description || 'No description'}`);
    });
    
  } finally {
    await connection.end();
  }
}

checkPermissions().catch(console.error);
