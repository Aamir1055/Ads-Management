// Script to restore original validation after debugging
const fs = require('fs');
const path = require('path');

const validationPath = path.join(__dirname, 'utils', 'campaignTypeValidation.js');
const backupPath = path.join(__dirname, 'utils', 'campaignTypeValidation.js.backup');

console.log('🔧 Restoring Original Validation...');
console.log('===================================');

try {
  // Check if backup exists
  if (!fs.existsSync(backupPath)) {
    console.log('❌ No backup found. Original validation is likely already active.');
    process.exit(0);
  }

  // Restore from backup
  console.log('📄 Restoring from backup...');
  fs.copyFileSync(backupPath, validationPath);
  console.log('✅ Original validation restored!');

  // Remove backup
  console.log('🗑️ Cleaning up backup...');
  fs.unlinkSync(backupPath);
  console.log('✅ Backup removed');

  console.log('\n🎉 Debug mode disabled!');
  console.log('Normal validation is now active.');

} catch (error) {
  console.error('❌ Error restoring validation:', error.message);
  process.exit(1);
}

console.log('\n📋 Server should restart automatically with normal validation.');
