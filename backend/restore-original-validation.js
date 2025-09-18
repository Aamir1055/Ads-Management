// Script to restore original validation middleware after debugging
const fs = require('fs');
const path = require('path');

const routesPath = path.join(__dirname, 'routes', 'campaignTypeRoutes.js');
const backupPath = path.join(__dirname, 'routes', 'campaignTypeRoutes.js.backup');

console.log('🔧 Restoring Original Campaign Type Validation...');
console.log('===============================================');

try {
  // Check if backup exists
  if (!fs.existsSync(backupPath)) {
    console.log('❌ No backup file found. Nothing to restore.');
    console.log('The original validation is likely already in place.');
    process.exit(0);
  }

  // Restore from backup
  console.log('📄 Restoring from backup...');
  fs.copyFileSync(backupPath, routesPath);
  console.log('✅ Original validation restored!');

  // Remove backup file
  console.log('🗑️ Cleaning up backup file...');
  fs.unlinkSync(backupPath);
  console.log('✅ Backup file removed');

  console.log('\n🎉 Debug mode disabled!');
  console.log('The original campaign type validation is now active.');

} catch (error) {
  console.error('❌ Error restoring validation:', error.message);
  console.log('\n🔧 Manual restore steps:');
  console.log('1. Copy campaignTypeRoutes.js.backup to campaignTypeRoutes.js');
  console.log('2. Delete the .backup file');
  console.log('3. Restart your server');
  process.exit(1);
}

console.log('\n📋 Next Steps:');
console.log('1. Restart your backend server');
console.log('2. Normal validation logging is now restored');
