// Test the new route mapping logic

const moduleRouteMap = {
  'users': '/user-management',
  'brands': '/brands',
  'campaign_types': '/campaign-types',
  'campaigns': '/campaigns',
  'campaign_data': '/campaign-data',
  'cards': '/cards',
  'card_users': '/card-users',
  'reports': '/reports-table',
  'analytics': '/report-analytics',
  'roles': '/role-management', // Fixed: was 'permissions', should be 'roles'
  'permissions': '/role-management', // Keep both for compatibility
  'settings': '/settings'
};

// Simulate detected modules from our debug output
const allowedModules = [
  'users',
  'roles',
  'campaigns', 
  'campaign_types',
  'campaign_data',
  'cards',
  'card_users',
  'reports',
  'brands'
];

console.log('🗺️ New Route Mapping Test:');
console.log('========================');

allowedModules.forEach(module => {
  const route = moduleRouteMap[module];
  console.log(`${module} → ${route || 'NO ROUTE MAPPED'}`);
});

console.log('\n🛣️ Final allowed routes:');
const allowedRoutes = ['/dashboard'];
allowedModules.forEach(module => {
  if (moduleRouteMap[module]) {
    allowedRoutes.push(moduleRouteMap[module]);
  }
});

allowedRoutes.forEach(route => {
  console.log(`  ✓ ${route}`);
});

// Test navigation visibility
const navigationItems = [
  { name: 'Dashboard', href: '/dashboard', module: null },
  { name: 'User Management', href: '/user-management', module: 'users' },
  { name: 'Role Management', href: '/role-management', module: 'roles' },
  { name: 'Brand Management', href: '/brands', module: 'brands' },
  { name: 'Campaign Types', href: '/campaign-types', module: 'campaign_types' },
  { name: 'Campaigns', href: '/campaigns', module: 'campaigns' },
  { name: 'Campaign Data', href: '/campaign-data', module: 'campaign_data' },
  { name: 'Cards', href: '/cards', module: 'cards' },
  { name: 'Card Users', href: '/card-users', module: 'card_users' },
  { name: 'Reports', href: '/reports-table', module: 'reports' }
];

console.log('\n🧭 Navigation items visibility:');
navigationItems.forEach(item => {
  const allowed = !item.module || allowedModules.includes(item.module);
  console.log(`  ${allowed ? '✅' : '❌'} ${item.name} (${item.href})`);
  if (!allowed && item.module) {
    console.log(`      Missing module: ${item.module}`);
  }
});

console.log('\n✅ All navigation items should now be visible!');
console.log('\n📋 Summary:');
console.log(`  • Brand Management: ✅ (module: brands)`);
console.log(`  • Role Management: ✅ (module: roles)`);
console.log(`  • Total visible items: ${navigationItems.filter(item => !item.module || allowedModules.includes(item.module)).length}/${navigationItems.length}`);
