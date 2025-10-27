const mysql = require('mysql2/promise');

// Database connection configuration
const dbConfig = {
  host: 'localhost',
  user: 'root', 
  password: '', // Add your MySQL password here if needed
  database: 'ads reporting'
};

async function fixBrandPermissions() {
  let connection;
  
  try {
    console.log('🔍 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('✅ Connected to database successfully');
    
    // 1. Insert missing brand management module
    console.log('\n📦 Step 1: Adding brand management module...');
    
    const insertModuleQuery = `
      INSERT IGNORE INTO modules (id, module_name, module_path, description, is_active) 
      VALUES (10, 'brands', '/api/brands', 'Brand management and branding system', 1)
    `;
    
    const [moduleResult] = await connection.execute(insertModuleQuery);
    
    if (moduleResult.affectedRows > 0) {
      console.log('✅ Brand management module inserted successfully');
    } else {
      console.log('ℹ️  Brand management module already exists');
    }
    
    // 2. Verify and fix brand permissions
    console.log('\n🔑 Step 2: Verifying brand permissions...');
    
    // Update existing brand permissions to ensure consistency
    const updatePermissionsQuery = `
      UPDATE permissions SET 
        module_id = 10,
        category = 'brands',
        is_active = 1
      WHERE id IN (31, 32, 33, 34) AND name LIKE 'brands_%'
    `;
    
    const [updateResult] = await connection.execute(updatePermissionsQuery);
    console.log(`✅ Updated ${updateResult.affectedRows} brand permissions`);
    
    // 3. Ensure brand permissions exist
    const brandPermissions = [
      [31, 'brands_create', 'Create Brands', 'Create new brand entries', 'brands', 1, 10],
      [32, 'brands_read', 'View Brands', 'View brand information and details', 'brands', 1, 10],
      [33, 'brands_update', 'Update Brands', 'Edit brand information and details', 'brands', 1, 10],
      [34, 'brands_delete', 'Delete Brands', 'Delete brand entries', 'brands', 1, 10]
    ];
    
    for (const permission of brandPermissions) {
      const insertPermQuery = `
        INSERT IGNORE INTO permissions (id, name, display_name, description, category, is_active, module_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      const [permResult] = await connection.execute(insertPermQuery, permission);
      if (permResult.affectedRows > 0) {
        console.log(`✅ Created permission: ${permission[2]}`);
      }
    }
    
    // 4. Get admin role IDs
    console.log('\n👤 Step 3: Assigning brand permissions to admin roles...');
    
    const [adminRoles] = await connection.execute(`
      SELECT id, name FROM roles 
      WHERE name IN ('SuperAdmin', 'Super Admin', 'super_admin', 'Admin', 'admin')
    `);
    
    console.log(`Found ${adminRoles.length} admin roles:`, adminRoles.map(r => r.name));
    
    // 5. Assign brand permissions to admin roles
    const [brandPermIds] = await connection.execute(`
      SELECT id FROM permissions WHERE name LIKE 'brands_%' AND is_active = 1
    `);
    
    let totalAssignments = 0;
    
    for (const role of adminRoles) {
      for (const permission of brandPermIds) {
        const insertRolePermQuery = `
          INSERT IGNORE INTO role_permissions (role_id, permission_id) 
          VALUES (?, ?)
        `;
        
        const [rolePermResult] = await connection.execute(insertRolePermQuery, [role.id, permission.id]);
        totalAssignments += rolePermResult.affectedRows;
      }
    }
    
    console.log(`✅ Assigned ${totalAssignments} brand permissions to admin roles`);
    
    // 6. Verification - show current state
    console.log('\n📊 Step 4: Verification...');
    
    // Check modules
    const [modules] = await connection.execute(`
      SELECT id, module_name, module_path, is_active 
      FROM modules 
      WHERE id = 10 OR module_name = 'brands'
    `);
    console.log('Brand modules:', modules);
    
    // Check permissions
    const [permissions] = await connection.execute(`
      SELECT id, name, display_name, category, module_id, is_active 
      FROM permissions 
      WHERE module_id = 10 OR category = 'brands' OR name LIKE 'brands_%'
      ORDER BY id
    `);
    console.log('Brand permissions:', permissions);
    
    // Check role assignments
    const [rolePerms] = await connection.execute(`
      SELECT 
        r.name as role_name,
        p.name as permission_name,
        p.display_name as permission_display_name
      FROM role_permissions rp
      JOIN roles r ON rp.role_id = r.id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE p.name LIKE 'brands_%' OR p.category = 'brands'
      ORDER BY r.name, p.name
    `);
    console.log('Role-Permission assignments for brands:', rolePerms);
    
    console.log('\n🎉 Brand management permissions fix completed successfully!');
    console.log('🔑 Admin and SuperAdmin users should now have access to brand management.');
    console.log('🏷️  Try accessing the brand management module again.');
    
  } catch (error) {
    console.error('❌ Error fixing brand permissions:', error);
    
    // If it's a connection error, provide guidance
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Database connection failed. Please check:');
      console.log('   - MySQL server is running');
      console.log('   - Database credentials are correct');
      console.log('   - Database "ads reporting" exists');
    }
    
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the fix
console.log('🚀 Starting brand management permissions fix...');
fixBrandPermissions();
