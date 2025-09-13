const mysql = require('mysql2/promise');
require('dotenv').config();

async function testNiceUserNavigation() {
  console.log('🧪 TESTING NICE USER NAVIGATION VISIBILITY');
  console.log('==========================================');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root', 
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ads reporting'
  });

  try {
    // Get nice user's permissions
    const [permissions] = await connection.execute(`
      SELECT DISTINCT 
        p.permission_key,
        m.module_name
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id 
      JOIN role_permissions rp ON ur.role_id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      JOIN modules m ON p.module_id = m.id
      WHERE u.username = 'nice' AND ur.is_active = 1
      ORDER BY m.module_name, p.permission_key
    `);

    console.log('\n1. Nice user\'s permissions:');
    const userPermissions = {};
    permissions.forEach(perm => {
      if (!userPermissions[perm.module_name]) {
        userPermissions[perm.module_name] = [];
      }
      userPermissions[perm.module_name].push(perm.permission_key);
    });

    Object.keys(userPermissions).forEach(module => {
      console.log(`   📁 ${module}: ${userPermissions[module].join(', ')}`);
    });

    // Define navigation items from Layout.jsx
    const navigationItems = [
      { name: 'Dashboard', href: '/dashboard', permissions: [] }, // Always accessible
      { name: 'User Management', href: '/user-management', permissions: ['users.read'] },
      { name: 'Role Management', href: '/role-management', permissions: ['permissions.manage_roles'] },
      { name: 'Campaign Types', href: '/campaign-types', permissions: ['campaign-types.read'] },
      { name: 'Campaign Data', href: '/campaign-data', permissions: ['campaign-data.read'] },
      { name: 'Campaigns', href: '/campaigns', permissions: ['campaigns.read'] },
      { name: 'Ads', href: '/ads', permissions: ['ads.read'] },
      { name: 'Cards', href: '/cards', permissions: ['cards.read'] },
      { name: 'Card Users', href: '/card-users', permissions: ['card-users.read'] },
      { name: 'Reports', href: '/reports-table', permissions: ['reports.read'] },
      { name: 'Report Analytics', href: '/reports', permissions: ['reports.read'] },
      { name: 'Analytics', href: '/analytics', permissions: ['dashboard.analytics'] },
      { name: 'Two Factor Auth', href: '/2fa', permissions: ['2fa.setup'] },
      { name: 'Modules', href: '/modules', permissions: ['modules.read'] },
      { name: 'Settings', href: '/settings', permissions: ['users.update'] }
    ];

    // Flatten all user permissions
    const allUserPermissions = [];
    Object.values(userPermissions).forEach(perms => {
      allUserPermissions.push(...perms);
    });

    console.log('\n2. Navigation items "nice" user SHOULD see:');
    const visibleItems = navigationItems.filter(item => {
      if (item.href === '/dashboard') return true; // Always visible
      
      if (item.permissions.length === 0) return true; // No permissions required
      
      // Check if user has any of the required permissions
      return item.permissions.some(reqPerm => allUserPermissions.includes(reqPerm));
    });

    visibleItems.forEach(item => {
      const reqPerms = item.permissions.length > 0 ? ` (requires: ${item.permissions.join(', ')})` : ' (always visible)';
      console.log(`   ✅ ${item.name}${reqPerms}`);
    });

    console.log('\n3. Navigation items "nice" user should NOT see:');
    const hiddenItems = navigationItems.filter(item => {
      if (item.href === '/dashboard') return false; // Always visible
      if (item.permissions.length === 0) return false; // No permissions required
      
      // Check if user does NOT have any of the required permissions
      return !item.permissions.some(reqPerm => allUserPermissions.includes(reqPerm));
    });

    hiddenItems.forEach(item => {
      console.log(`   ❌ ${item.name} (requires: ${item.permissions.join(', ')})`);
    });

    console.log('\n4. Summary:');
    console.log(`   👤 User "nice" should see ${visibleItems.length} navigation items`);
    console.log(`   🚫 ${hiddenItems.length} items should be hidden due to lack of permissions`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

// Run the test
testNiceUserNavigation().catch(console.error);
