const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ads reporting'
};

async function testPermissions() {
  let connection;
  
  try {
    console.log('🧪 Testing Permission System...');
    connection = await mysql.createConnection(dbConfig);
    
    // Test admin user permissions (ID 35)
    const [userPerms] = await connection.execute(`
      SELECT 
        u.id,
        u.username,
        u.role_name,
        r.display_name as role_display_name,
        p.name as permission_name,
        p.display_name as permission_display_name,
        m.name as module_name,
        m.display_name as module_display_name
      FROM users u
      INNER JOIN roles r ON u.role_id = r.id
      INNER JOIN role_permissions rp ON r.id = rp.role_id  
      INNER JOIN permissions p ON rp.permission_id = p.id
      LEFT JOIN modules m ON p.module_id = m.id
      WHERE u.id = 35 AND p.is_active = 1
      ORDER BY m.order_index, p.name
    `);
    
    console.log(`\n👤 User: ${userPerms[0]?.username} (${userPerms[0]?.role_display_name})`);
    console.log(`📊 Total Permissions: ${userPerms.length}`);
    
    // Group permissions by module
    const modulePerms = {};
    userPerms.forEach(perm => {
      const module = perm.module_display_name || 'System';
      if (!modulePerms[module]) {
        modulePerms[module] = [];
      }
      modulePerms[module].push(perm.permission_display_name);
    });
    
    console.log('\n📋 Permissions by Module:');
    Object.keys(modulePerms).forEach(module => {
      console.log(`\n  ${module}:`);
      modulePerms[module].forEach(perm => {
        console.log(`    ✓ ${perm}`);
      });
    });
    
    // Test specific permissions that should exist for Brand and Role Management
    const criticalPerms = [
      'brands_read', 'brands_create', 'brands_update', 'brands_delete',
      'role_management', 'system_settings'
    ];
    
    console.log('\n🔍 Critical Permission Check:');
    for (const permName of criticalPerms) {
      const hasPermission = userPerms.some(p => p.permission_name === permName);
      console.log(`  ${hasPermission ? '✅' : '❌'} ${permName}`);
    }
    
    // Check if user can access Brand module
    const canAccessBrands = userPerms.some(p => p.module_name === 'brands');
    console.log(`\n🏷️  Can access Brand Management: ${canAccessBrands ? '✅ YES' : '❌ NO'}`);
    
    // Check if user can access Role Management 
    const canAccessRoles = userPerms.some(p => p.permission_name === 'role_management');
    console.log(`🔐 Can access Role Management: ${canAccessRoles ? '✅ YES' : '❌ NO'}`);
    
    // Test the query that the frontend permissions endpoint would use
    const [frontendPerms] = await connection.execute(`
      SELECT 
        p.name,
        p.display_name,
        p.category,
        m.name as module_name
      FROM users u
      INNER JOIN role_permissions rp ON u.role_id = rp.role_id
      INNER JOIN permissions p ON rp.permission_id = p.id
      LEFT JOIN modules m ON p.module_id = m.id
      WHERE u.id = 35 AND p.is_active = 1
      ORDER BY p.category, p.name
    `);
    
    console.log(`\n🌐 Frontend API would return ${frontendPerms.length} permissions`);
    
    // Group by category for frontend
    const categoryPerms = {};
    frontendPerms.forEach(perm => {
      const category = perm.category || 'general';
      if (!categoryPerms[category]) {
        categoryPerms[category] = [];
      }
      categoryPerms[category].push(perm.name);
    });
    
    console.log('\n📂 Permissions by Category (for frontend):');
    Object.keys(categoryPerms).forEach(category => {
      console.log(`  ${category}: ${categoryPerms[category].join(', ')}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testPermissions();
