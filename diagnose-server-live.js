/**
 * Diagnose if the server is running the fixed middleware
 */

const fs = require('fs');
const path = require('path');

function checkServerStatus() {
  console.log('🔍 Diagnosing Server and Middleware Status...\n');
  
  // Check if RBAC middleware has the debug logging
  const middlewarePath = path.join(__dirname, 'middleware', 'rbacMiddleware.js');
  
  if (!fs.existsSync(middlewarePath)) {
    console.log('❌ RBAC middleware file not found!');
    return;
  }
  
  const content = fs.readFileSync(middlewarePath, 'utf8');
  
  // Check for the debug logging we added
  const hasDebugLogging = content.includes('🐛 RBAC DEBUG START');
  const hasSQLFix = content.includes('const [permissions] = await pool.query(`');
  const hasCampaignTypesModule = content.includes('campaign_types: {');
  
  console.log('📋 Middleware Status Check:');
  console.log(`   Debug Logging Added: ${hasDebugLogging ? '✅ YES' : '❌ NO'}`);
  console.log(`   SQL Syntax Fixed: ${hasSQLFix ? '✅ YES' : '❌ NO'}`);
  console.log(`   Campaign Types Module: ${hasCampaignTypesModule ? '✅ YES' : '❌ NO'}`);
  
  if (!hasDebugLogging || !hasSQLFix || !hasCampaignTypesModule) {
    console.log('\n❌ MIDDLEWARE NOT PROPERLY FIXED!');
    console.log('   The fixes may not have been applied correctly.');
    return false;
  }
  
  console.log('\n✅ Middleware appears to have all fixes applied.');
  
  // Check for common route files
  const routeFiles = [
    'routes/privacy/userManagement.js',
    'routes/privacy/campaignTypes.js',
    'routes/privacy/campaigns.js',
    'routes/privacy/cards.js',
    'routes/privacy/reports.js'
  ];
  
  console.log('\n📁 Route Files Check:');
  routeFiles.forEach(routeFile => {
    const fullPath = path.join(__dirname, routeFile);
    const exists = fs.existsSync(fullPath);
    console.log(`   ${routeFile}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
    
    if (exists) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const hasRBAC = content.includes('rbacMiddleware') || content.includes('checkModulePermission');
      console.log(`     RBAC Integration: ${hasRBAC ? '✅ YES' : '❌ NO'}`);
    }
  });
  
  return true;
}

function checkProcesses() {
  console.log('\n🔍 Checking for running Node processes...');
  
  const { exec } = require('child_process');
  
  // Check for Node.js processes on Windows
  exec('tasklist /FI "IMAGENAME eq node.exe" /FO CSV', (error, stdout, stderr) => {
    if (error) {
      console.log('❌ Could not check running processes');
      return;
    }
    
    const lines = stdout.split('\n').filter(line => line.trim());
    if (lines.length > 1) {
      console.log(`✅ Found ${lines.length - 1} Node.js processes running`);
      console.log('   If your server is running, it needs a RESTART to load fixes!');
    } else {
      console.log('❌ No Node.js processes found - server might not be running');
    }
  });
}

function showNextSteps() {
  console.log('\n🚀 IMMEDIATE NEXT STEPS:\n');
  
  console.log('1. 🛑 STOP YOUR SERVER COMPLETELY');
  console.log('   Press Ctrl+C in your server terminal');
  console.log('   Or close the terminal window\n');
  
  console.log('2. ⚡ START FRESH SERVER');
  console.log('   cd "C:\\Users\\bazaa\\Desktop\\Ads Reporting Software\\backend"');
  console.log('   npm start');
  console.log('   # or');
  console.log('   node app.js\n');
  
  console.log('3. 📊 WATCH FOR DEBUG LOGS');
  console.log('   You should see messages like:');
  console.log('   "🐛 RBAC DEBUG START: checkModulePermission called"');
  console.log('   "🐛 RBAC DEBUG: About to check permission"\n');
  
  console.log('4. 🧪 TEST ONE ENDPOINT');
  console.log('   Try accessing /api/campaign-types first');
  console.log('   Check browser console and server logs\n');
  
  console.log('❗ IMPORTANT: If you still get 403 errors AFTER restart,');
  console.log('   then we need to check JWT token and authentication flow.');
}

// Run diagnostics
const middlewareOK = checkServerStatus();
checkProcesses();

if (middlewareOK) {
  showNextSteps();
} else {
  console.log('\n❌ MIDDLEWARE FIXES NOT APPLIED PROPERLY');
  console.log('   Re-running the SQL fix...');
  
  // Re-apply the SQL fix
  const middlewarePath = path.join(__dirname, 'middleware', 'rbacMiddleware.js');
  let content = fs.readFileSync(middlewarePath, 'utf8');
  
  // Fix the SQL query if it's broken
  content = content.replace(
    /const \[permissions\] = await pool\.query\(\s*SELECT/,
    'const [permissions] = await pool.query(`\n      SELECT'
  );
  
  fs.writeFileSync(middlewarePath, content);
  console.log('✅ Re-applied SQL syntax fix');
  showNextSteps();
}
