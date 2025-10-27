const fs = require('fs');
const path = require('path');

// Create a simple frontend permission checker utility
const permissionCheckerCode = `
/**
 * Frontend Permission Checker Utility
 * For testing role-based navigation in your Ads Reporting Software
 */
class FrontendPermissionChecker {
  constructor(userPermissions = []) {
    this.userPermissions = userPermissions.map(p => p.toLowerCase());
  }

  // Check if user has a specific permission
  hasPermission(permissionKey) {
    return this.userPermissions.includes(permissionKey.toLowerCase());
  }

  // Check if user has access to a module (any permission in that module)
  hasModuleAccess(moduleName) {
    const modulePrefix = moduleName.toLowerCase() + '.';
    return this.userPermissions.some(perm => perm.startsWith(modulePrefix));
  }

  // Get navigation items based on user permissions
  getNavigationItems() {
    const allNavigationItems = [
      { 
        name: 'Dashboard', 
        path: '/dashboard', 
        icon: '📊', 
        requiredPermission: 'dashboard.read',
        isDefault: true // Always show if user is authenticated
      },
      { 
        name: 'Campaign Data', 
        path: '/campaign-data', 
        icon: '📈', 
        requiredPermission: 'campaign-data.read' 
      },
      { 
        name: 'Campaign Types', 
        path: '/campaign-types', 
        icon: '📋', 
        requiredPermission: 'campaign-types.read' 
      },
      { 
        name: 'Campaigns', 
        path: '/campaigns', 
        icon: '🎯', 
        requiredPermission: 'campaigns.read' 
      },
      { 
        name: 'Ads', 
        path: '/ads', 
        icon: '📢', 
        requiredPermission: 'ads.read' 
      },
      { 
        name: 'Cards', 
        path: '/cards', 
        icon: '💳', 
        requiredPermission: 'cards.read' 
      },
      { 
        name: 'Users', 
        path: '/user-management', 
        icon: '👥', 
        requiredPermission: 'users.read' 
      },
      { 
        name: 'Role Management', 
        path: '/role-management', 
        icon: '🔑', 
        requiredPermission: 'permissions.manage_roles' 
      },
      { 
        name: 'Reports', 
        path: '/reports', 
        icon: '📊', 
        requiredPermission: 'reports.read' 
      }
    ];

    return allNavigationItems.filter(item => {
      // Always show default items (like dashboard) if user can login
      if (item.isDefault && this.hasPermission('auth.login')) {
        return true;
      }
      // Show other items based on specific permissions
      return this.hasPermission(item.requiredPermission);
    });
  }

  // Simulate user login and return navigation for testing
  static async testUserNavigation(username) {
    // This would typically be an API call to get user permissions
    const testUsers = {
      'aamir_test': [
        'auth.login', 'auth.logout', 'auth.me',
        'dashboard.read',
        'campaign-data.create', 'campaign-data.read', 'campaign-data.update', 'campaign-data.delete',
        'campaign-types.create', 'campaign-types.read', 'campaign-types.update', 'campaign-types.delete'
      ],
      'admin_test': [
        'auth.login', 'auth.logout', 'auth.me',
        'dashboard.read', 'dashboard.analytics',
        'users.read', 'users.create', 'users.update',
        'campaigns.read', 'campaigns.create', 'campaigns.update',
        'ads.read', 'ads.create', 'ads.update',
        'reports.read', 'reports.create', 'reports.export'
      ],
      'regular_user': [
        'auth.login', 'auth.logout', 'auth.me',
        'dashboard.read'
      ]
    };

    const userPermissions = testUsers[username] || ['auth.login', 'auth.logout', 'dashboard.read'];
    const checker = new FrontendPermissionChecker(userPermissions);
    
    return {
      username,
      permissions: userPermissions,
      navigation: checker.getNavigationItems(),
      hasModuleAccess: {
        dashboard: checker.hasModuleAccess('dashboard'),
        'campaign-data': checker.hasModuleAccess('campaign-data'),
        'campaign-types': checker.hasModuleAccess('campaign-types'),
        campaigns: checker.hasModuleAccess('campaigns'),
        ads: checker.hasModuleAccess('ads'),
        users: checker.hasModuleAccess('users'),
        reports: checker.hasModuleAccess('reports'),
        permissions: checker.hasModuleAccess('permissions')
      }
    };
  }
}

// Test the permission checker
async function testPermissionChecker() {
  console.log('🧪 TESTING FRONTEND PERMISSION CHECKER');
  console.log('======================================\\n');

  const testUsers = ['aamir_test', 'admin_test', 'regular_user'];
  
  for (const username of testUsers) {
    console.log(\`👤 Testing user: \${username}\`);
    const result = await FrontendPermissionChecker.testUserNavigation(username);
    
    console.log(\`   Permissions (\${result.permissions.length}): \${result.permissions.join(', ')}\`);
    console.log(\`   Navigation items (\${result.navigation.length}):\`);
    
    result.navigation.forEach(nav => {
      console.log(\`      \${nav.icon} \${nav.name} → \${nav.path}\`);
    });
    
    console.log(\`   Module access:\`);
    Object.entries(result.hasModuleAccess).forEach(([module, hasAccess]) => {
      console.log(\`      \${hasAccess ? '✅' : '❌'} \${module}\`);
    });
    
    console.log('\\n');
  }
  
  console.log('✅ Frontend permission checker test completed!');
  console.log('\\n📋 Integration Steps:');
  console.log('1. Copy this utility to your frontend src/utils/permissionChecker.js');
  console.log('2. Use it in your navigation components to show/hide menu items');
  console.log('3. Test with the aamir_test user (password: test123)');
  console.log('4. Verify only Dashboard, Campaign Data, and Campaign Types are visible');
}

// Export for frontend use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FrontendPermissionChecker;
  testPermissionChecker();
} else {
  window.FrontendPermissionChecker = FrontendPermissionChecker;
}
`;

async function createFrontendChecker() {
  try {
    console.log('🔧 Creating Frontend Permission Checker...\n');

    // Create the permission checker file
    const checkerPath = path.join(__dirname, '../frontend/src/utils/permissionChecker.js');
    
    // Ensure the directory exists
    const utilsDir = path.dirname(checkerPath);
    if (!fs.existsSync(utilsDir)) {
      fs.mkdirSync(utilsDir, { recursive: true });
      console.log('✅ Created utils directory');
    }

    // Write the permission checker
    fs.writeFileSync(checkerPath, permissionCheckerCode.trim());
    console.log('✅ Created frontend permission checker: frontend/src/utils/permissionChecker.js');

    // Run the test
    eval(permissionCheckerCode);

  } catch (error) {
    console.error('❌ Error creating frontend checker:', error);
  }
}

createFrontendChecker();
