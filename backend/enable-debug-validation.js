// Script to temporarily replace validation middleware with enhanced logging
const fs = require('fs');
const path = require('path');

const routesPath = path.join(__dirname, 'routes', 'campaignTypeRoutes.js');
const backupPath = path.join(__dirname, 'routes', 'campaignTypeRoutes.js.backup');

console.log('🔧 Enabling Enhanced Campaign Type Validation Debug...');
console.log('====================================================');

try {
  // 1. Create backup of original routes file
  console.log('📄 Creating backup of campaignTypeRoutes.js...');
  fs.copyFileSync(routesPath, backupPath);
  console.log('✅ Backup created at:', backupPath);

  // 2. Read current routes file
  const originalContent = fs.readFileSync(routesPath, 'utf8');

  // 3. Create modified content with enhanced validation
  const modifiedContent = originalContent.replace(
    // Replace the validation import
    `const {
  validators: {
    validateCreateCampaignType,
    validateUpdateCampaignType,
    validateIdParam,
    validateQueryParams
  }
} = require('../utils/campaignTypeValidation');`,
    `const {
  validators: {
    validateCreateCampaignType,
    validateUpdateCampaignType,
    validateIdParam,
    validateQueryParams
  }
} = require('../utils/campaignTypeValidation');

// Enhanced debugging validation
const { enhancedValidateUpdateCampaignType } = require('../enhanced-validation-debug');`
  ).replace(
    // Replace the PUT route validation middleware
    `router.put('/:id', updateLimiter, requireSuperAdmin, validateIdParam, validateUpdateCampaignType, updateCampaignType);`,
    `router.put('/:id', updateLimiter, requireSuperAdmin, validateIdParam, enhancedValidateUpdateCampaignType, updateCampaignType);`
  );

  // 4. Write modified file
  console.log('📝 Writing enhanced routes file...');
  fs.writeFileSync(routesPath, modifiedContent);
  console.log('✅ Enhanced validation enabled!');

  console.log('\n🚀 Debug mode is now active!');
  console.log('When you make a PUT request to /api/campaign-types/:id, you will see:');
  console.log('  • Detailed request logging');
  console.log('  • Field-by-field validation analysis');
  console.log('  • Character-by-character pattern validation');
  console.log('  • Enhanced error messages');

  console.log('\n⚠️  IMPORTANT: This is for debugging only!');
  console.log('Run the restore script when finished debugging.');

} catch (error) {
  console.error('❌ Error enabling debug mode:', error.message);
  process.exit(1);
}

console.log('\n📋 Next Steps:');
console.log('1. Restart your backend server');
console.log('2. Try updating campaign type ID 47');
console.log('3. Check the backend console for detailed logs');
console.log('4. Run restore-original-validation.js when done debugging');
