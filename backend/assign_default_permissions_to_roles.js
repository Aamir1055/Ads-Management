// assign_default_permissions_to_roles.js - Add default permissions to all existing roles
require('dotenv').config();
const { pool } = require('./config/database');

const assignDefaultPermissionsToRoles = async () => {
  try {
    console.log('🔧 Assigning default permissions to all roles...');
    
    // Define modules that should be given to everyone by default
    const defaultModules = ['ads', 'modules', 'two-factor-auth'];
    
    // Get all permissions from default modules
    console.log('\n📋 Getting default permissions...');
    const [defaultPermissions] = await pool.query(`
      SELECT p.id, p.permission_key, m.module_name
      FROM permissions p
      INNER JOIN modules m ON p.module_id = m.id
      WHERE m.module_name IN (?, ?, ?)
      ORDER BY m.module_name, p.permission_key
    `, defaultModules);
    
    console.log(`Found ${defaultPermissions.length} default permissions:`);
    defaultPermissions.forEach(perm => {
      console.log(`   - ${perm.module_name}: ${perm.permission_key}`);
    });
    
    // Get all roles (including existing ones)
    const [allRoles] = await pool.query(`
      SELECT id, name as role_name
      FROM roles
      WHERE is_active = 1
      ORDER BY name
    `);
    
    console.log(`\n👥 Found ${allRoles.length} active roles:`);
    allRoles.forEach(role => {
      console.log(`   - ${role.role_name} (ID: ${role.id})`);
    });
    
    let totalAssignments = 0;
    
    for (const role of allRoles) {
      console.log(`\n🔧 Processing role: ${role.role_name}`);
      
      let assignmentsForRole = 0;
      
      for (const permission of defaultPermissions) {
        // Check if role already has this permission
        const [existing] = await pool.query(`
          SELECT id FROM role_permissions
          WHERE role_id = ? AND permission_id = ?
        `, [role.id, permission.id]);
        
        if (existing.length === 0) {
          // Assign permission to role
          await pool.query(`
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES (?, ?)
          `, [role.id, permission.id]);
          
          assignmentsForRole++;
          totalAssignments++;
        }
      }
      
      console.log(`   ✅ Added ${assignmentsForRole} default permissions to ${role.role_name}`);
    }
    
    // Show results
    console.log('\n📊 Final Results:');
    console.log(`✨ Total default permission assignments added: ${totalAssignments}`);
    
    // Verify assignments
    const [verifyResults] = await pool.query(`
      SELECT 
        r.name as role_name,
        COUNT(rp.id) as total_permissions,
        COUNT(CASE WHEN m.module_name IN ('ads', 'modules', 'two-factor-auth') THEN 1 END) as default_permissions
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      LEFT JOIN modules m ON p.module_id = m.id
      WHERE r.is_active = 1
      GROUP BY r.id, r.name
      ORDER BY r.name
    `);
    
    console.log('\n📈 Permission summary by role:');
    console.table(verifyResults);
    
    console.log('\n✅ Default permissions assignment completed successfully!');
    console.log('All users with these roles now have access to ads, modules, and two-factor-auth functionality.');
    
  } catch (error) {
    console.error('❌ Error during permission assignment:', error);
    throw error;
  } finally {
    process.exit(0);
  }
};

// Run the assignment
assignDefaultPermissionsToRoles();
