/**
 * Add debug logging to see what's happening in RBAC middleware on the server
 */

const fs = require('fs');
const path = require('path');

function addDebugLogging() {
  console.log('🔧 Adding debug logging to RBAC middleware...');
  
  const middlewarePath = path.join(__dirname, 'middleware', 'rbacMiddleware.js');
  
  if (!fs.existsSync(middlewarePath)) {
    console.log('❌ RBAC middleware file not found!');
    return;
  }
  
  let content = fs.readFileSync(middlewarePath, 'utf8');
  
  // Add debug logging at the start of checkModulePermission
  if (!content.includes('🐛 RBAC DEBUG START')) {
    content = content.replace(
      'const checkModulePermission = (module, action, options = {}) => {',
      `const checkModulePermission = (module, action, options = {}) => {
  console.log('🐛 RBAC DEBUG START: checkModulePermission called', { module, action, options });`
    );
    
    // Add debug logging for the permission query
    content = content.replace(
      'const [permissions] = await pool.query(`',
      `console.log('🐛 RBAC DEBUG: About to check permission', { roleId, permissionName });
      const [permissions] = await pool.query(`
    );
    
    // Add debug logging for the error case
    content = content.replace(
      'if (permissions.length === 0) {',
      `console.log('🐛 RBAC DEBUG: Permission check result', { permissionName, found: permissions.length });
      if (permissions.length === 0) {`
    );
    
    fs.writeFileSync(middlewarePath, content);
    console.log('✅ Debug logging added to RBAC middleware');
    console.log('📝 Now restart your server and check the console output');
    console.log('📝 You should see debug messages starting with 🐛 RBAC DEBUG');
  } else {
    console.log('✅ Debug logging already exists in RBAC middleware');
  }
}

function removeDebugLogging() {
  console.log('🧹 Removing debug logging from RBAC middleware...');
  
  const middlewarePath = path.join(__dirname, 'middleware', 'rbacMiddleware.js');
  
  if (!fs.existsSync(middlewarePath)) {
    console.log('❌ RBAC middleware file not found!');
    return;
  }
  
  let content = fs.readFileSync(middlewarePath, 'utf8');
  
  // Remove debug logging
  content = content.replace(/console\.log\('🐛 RBAC DEBUG[^']*'[^;]*\);?\n?/g, '');
  
  fs.writeFileSync(middlewarePath, content);
  console.log('✅ Debug logging removed from RBAC middleware');
}

// Check command line arguments
const action = process.argv[2];

if (action === 'remove') {
  removeDebugLogging();
} else if (action === 'add') {
  addDebugLogging();
} else {
  console.log('Usage:');
  console.log('  node debug-middleware-live.js add    - Add debug logging');
  console.log('  node debug-middleware-live.js remove - Remove debug logging');
  console.log('');
  console.log('This will help us see exactly what the server is doing with permissions.');
}
