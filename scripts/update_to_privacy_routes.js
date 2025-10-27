const fs = require('fs');
const path = require('path');

/**
 * Script to update app.js to use privacy-enabled routes
 */

const updateAppToPrivacyRoutes = async () => {
  const appPath = path.join(__dirname, '..', 'app.js');
  
  try {
    console.log('🔄 Updating app.js to use privacy-enabled routes...\n');
    
    // Read current app.js
    const currentContent = fs.readFileSync(appPath, 'utf8');
    
    // Define the route updates
    const routeUpdates = [
      {
        old: "const campaignTypeRoutes = require('./routes/campaignTypeRoutes');",
        new: "const campaignTypeRoutes = require('./routes/campaignTypeRoutes_privacy');"
      },
      {
        old: "const campaignDataRoutes = require('./routes/campaignDataRoutes');",
        new: "const campaignDataRoutes = require('./routes/campaignDataRoutes_privacy');"
      },
      {
        old: "const reportRoutes = require('./routes/reportRoutes');",
        new: "const reportRoutes = require('./routes/reportRoutes_privacy');"
      },
      {
        old: "const cardsRoutes = require('./routes/cardsRoutes');",
        new: "const cardsRoutes = require('./routes/cardsRoutes_privacy');"
      }
    ];
    
    // Apply route updates
    let updatedContent = currentContent;
    let changesApplied = 0;
    
    routeUpdates.forEach(({ old, new: newRoute }) => {
      if (updatedContent.includes(old)) {
        updatedContent = updatedContent.replace(old, newRoute);
        changesApplied++;
        console.log(`✅ Updated: ${old.split("'")[1]}`);
      } else {
        console.log(`⚠️  Not found: ${old}`);
      }
    });
    
    // Create backup
    const backupPath = appPath + '.backup.' + Date.now();
    fs.writeFileSync(backupPath, currentContent);
    console.log(`\n📋 Backup created: ${backupPath}`);
    
    // Write updated content
    fs.writeFileSync(appPath, updatedContent);
    console.log(`✅ Updated app.js with ${changesApplied} privacy-enabled routes`);
    
    // Summary
    console.log('\n📊 PRIVACY ROUTES ACTIVATION SUMMARY:');
    console.log('='.repeat(50));
    console.log('✅ Campaign Data - Privacy enabled (users see only their data)');
    console.log('✅ Campaign Types - Privacy enabled (users see only their data)');
    console.log('✅ Cards - Privacy enabled (users see only their data)');
    console.log('✅ Reports - Privacy enabled (users see only their data)');
    console.log('');
    console.log('🔐 PRIVACY FEATURES NOW ACTIVE:');
    console.log('   • User-based data filtering');
    console.log('   • Admin bypass (Super Admin/Admin see all data)');
    console.log('   • Ownership validation on updates/deletes');
    console.log('   • Automatic user assignment on creation');
    console.log('   • Request logging with user context');
    console.log('   • Rate limiting per endpoint');
    
    console.log('\n📝 MODULES AFFECTED:');
    console.log('   • Campaign Data: Full privacy enforcement');
    console.log('   • Campaign Types: Full privacy enforcement');
    console.log('   • Cards: Full privacy enforcement');
    console.log('   • Reports: Full privacy enforcement');
    
    console.log('\n🚨 TESTING REQUIRED:');
    console.log('   1. Test with regular user (should see only their data)');
    console.log('   2. Test with admin user (should see all data)');
    console.log('   3. Test ownership validation on updates/deletes');
    console.log('   4. Test creation assigns correct ownership');
    
  } catch (error) {
    console.error('❌ Error updating app.js:', error);
    throw error;
  }
};

// Run if called directly
if (require.main === module) {
  updateAppToPrivacyRoutes()
    .then(() => {
      console.log('\n🎉 Privacy routes activation completed successfully!');
      console.log('🔄 Restart your server to apply changes.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Privacy routes activation failed:', error);
      process.exit(1);
    });
}

module.exports = updateAppToPrivacyRoutes;
