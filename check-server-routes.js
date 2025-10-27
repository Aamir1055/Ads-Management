/**
 * Check if server is using the updated route files with RBAC
 */

const fs = require('fs');
const path = require('path');

function checkRouteFiles() {
  console.log('🔍 Checking if route files have RBAC middleware...');
  console.log('=' .repeat(50));
  
  const routeFiles = [
    'routes/userManagementRoutes_privacy.js',
    'routes/campaignTypeRoutes_privacy.js',
    'routes/cardsRoutes_privacy.js',
    'routes/campaignRoutes_privacy.js',
    'routes/reportRoutes_privacy.js',
    'routes/campaignDataRoutes_privacy.js'
  ];
  
  for (const routeFile of routeFiles) {
    const filePath = path.join(__dirname, routeFile);
    
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      const hasRBACImport = content.includes('createPermissionMiddleware') || content.includes('rbacRouteMapping');
      const hasRBACUsage = content.includes('🔒 RBAC:') || content.includes('createPermissionMiddleware.');
      
      console.log(`📁 ${routeFile}:`);
      console.log(`  ${hasRBACImport ? '✅' : '❌'} RBAC import: ${hasRBACImport}`);
      console.log(`  ${hasRBACUsage ? '✅' : '❌'} RBAC usage: ${hasRBACUsage}`);
      
      if (!hasRBACImport || !hasRBACUsage) {
        console.log(`  ⚠️  File may not have RBAC middleware properly integrated!`);
      }
    } else {
      console.log(`❌ ${routeFile}: File not found`);
    }
  }
  
  // Check app.js to see what routes are being used
  const appJsPath = path.join(__dirname, 'app.js');
  if (fs.existsSync(appJsPath)) {
    const appContent = fs.readFileSync(appJsPath, 'utf8');
    
    console.log(`\n📋 Routes used in app.js:`);
    
    const routeMatches = [
      { pattern: /user-management.*privacy/gi, name: 'User Management (Privacy)' },
      { pattern: /campaign-types.*privacy/gi, name: 'Campaign Types (Privacy)' },
      { pattern: /cards.*privacy/gi, name: 'Cards (Privacy)' },
      { pattern: /campaigns.*privacy/gi, name: 'Campaigns (Privacy)' },
      { pattern: /reports.*privacy/gi, name: 'Reports (Privacy)' },
      { pattern: /campaign-data.*privacy/gi, name: 'Campaign Data (Privacy)' }
    ];
    
    for (const route of routeMatches) {
      const matches = appContent.match(route.pattern);
      if (matches) {
        console.log(`  ✅ ${route.name}: Found (${matches.length} matches)`);
      } else {
        console.log(`  ❌ ${route.name}: Not found - may be using non-privacy routes`);
      }
    }
  }
  
  console.log(`\n💡 Recommendations:`);
  console.log(`  1. Make sure your server is restarted after updating route files`);
  console.log(`  2. Verify app.js is using the *_privacy.js route files`);
  console.log(`  3. Check that all route files have RBAC middleware integrated`);
  console.log(`  4. Test API endpoints manually with Postman or curl`);
}

checkRouteFiles();
