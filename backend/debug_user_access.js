const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ads reporting'
};

async function debugUserAccess() {
  let connection;
  
  try {
    console.log('🔍 Debugging User Access System...');
    connection = await mysql.createConnection(dbConfig);
    
    const userId = 35; // Admin user
    
    // Check what the middleware query would return
    console.log('\n📋 Checking user permissions and modules...');
    
    const [userDetails] = await connection.execute(`
      SELECT 
        u.id,
        u.username,
        u.role_name,
        r.id as role_id,
        r.name as role_name_from_table,
        r.display_name as role_display_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = ?
    `, [userId]);
    
    console.log('👤 User Details:', userDetails[0]);
    
    // Check permissions detailed (what middleware loads)
    const [permissionsDetailed] = await connection.execute(`
      SELECT 
        p.id,
        p.name,
        p.display_name,
        p.category,
        m.id as module_id,
        m.name as module_name,
        m.display_name as module_display_name,
        m.route as module_route,
        m.is_active as module_active
      FROM users u
      INNER JOIN role_permissions rp ON u.role_id = rp.role_id
      INNER JOIN permissions p ON rp.permission_id = p.id
      LEFT JOIN modules m ON p.module_id = m.id
      WHERE u.id = ? AND p.is_active = 1
      ORDER BY m.order_index, p.name
    `, [userId]);
    
    console.log(`\n🔑 User has ${permissionsDetailed.length} active permissions`);
    
    // Group by module
    const moduleGroups = {};
    permissionsDetailed.forEach(perm => {
      const moduleName = perm.module_name || 'system';
      if (!moduleGroups[moduleName]) {
        moduleGroups[moduleName] = {
          module_id: perm.module_id,
          module_display_name: perm.module_display_name,
          module_route: perm.module_route,
          module_active: perm.module_active,
          permissions: []
        };
      }
      moduleGroups[moduleName].permissions.push({
        name: perm.name,
        display_name: perm.display_name,
        category: perm.category
      });
    });
    
    console.log('\n📦 Modules and their permissions:');
    Object.keys(moduleGroups).forEach(moduleName => {
      const module = moduleGroups[moduleName];
      console.log(`\n  📁 ${module.module_display_name || moduleName} (${moduleName}):`);
      console.log(`     Route: ${module.module_route || 'N/A'}`);
      console.log(`     Active: ${module.module_active ? 'Yes' : 'No'}`);
      console.log(`     Permissions (${module.permissions.length}):`);
      module.permissions.forEach(perm => {
        console.log(`       • ${perm.display_name} (${perm.name})`);
      });
    });
    
    // Check what the frontend route mapping would produce
    const moduleRouteMap = {
      'users': '/user-management',
      'brands': '/brands',
      'campaign_types': '/campaign-types',
      'campaigns': '/campaigns',
      'cards': '/cards',
      'card_users': '/card-users',
      'reports': '/reports-table',
      'analytics': '/analytics',
      'permissions': '/role-management',
      'settings': '/settings'
    };
    
    console.log('\n🗺️ Route mapping for detected modules:');
    const allowedModules = Object.keys(moduleGroups);
    const allowedRoutes = ['/dashboard'];
    
    allowedModules.forEach(module => {
      const route = moduleRouteMap[module];
      console.log(`  ${module} → ${route || 'NO ROUTE MAPPED'}`);
      if (route) {
        allowedRoutes.push(route);
      }
    });
    
    console.log('\n🛣️ Final allowed routes:');
    allowedRoutes.forEach(route => {
      console.log(`  ✓ ${route}`);
    });
    
    // Check which navigation items would be shown
    console.log('\n🧭 Navigation items that would be visible:');
    const navigationItems = [
      { name: 'Dashboard', href: '/dashboard', icon: 'Home', module: null },
      { name: 'User Management', href: '/user-management', icon: 'Users', module: 'users' },
      { name: 'Role Management', href: '/role-management', icon: 'Key', module: 'permissions' },
      { name: 'Brand', href: '/brands', icon: 'Bookmark', module: 'brands' },
      { name: 'Campaign Types', href: '/campaign-types', icon: 'Tags', module: 'campaign_types' },
      { name: 'Campaigns', href: '/campaigns', icon: 'Target', module: 'campaigns' },
      { name: 'Cards', href: '/cards', icon: 'CreditCard', module: 'cards' },
      { name: 'Card Users', href: '/card-users', icon: 'UserCheck', module: 'card_users' },
      { name: 'Reports', href: '/reports-table', icon: 'FileText', module: 'reports' },
      { name: 'Analytics', href: '/analytics', icon: 'BarChart3', module: 'analytics' }
    ];
    
    navigationItems.forEach(item => {
      const allowed = !item.module || allowedModules.includes(item.module);
      console.log(`  ${allowed ? '✅' : '❌'} ${item.name} (${item.href})`);
      if (!allowed && item.module) {
        console.log(`      Missing module: ${item.module}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

debugUserAccess();
