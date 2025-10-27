// Script to add detailed debugging to existing validation middleware
const fs = require('fs');
const path = require('path');

const validationPath = path.join(__dirname, 'utils', 'campaignTypeValidation.js');
const backupPath = path.join(__dirname, 'utils', 'campaignTypeValidation.js.backup');

console.log('🔧 Adding Debug Logging to Campaign Type Validation...');
console.log('=====================================================');

try {
  // 1. Create backup
  console.log('📄 Creating backup...');
  fs.copyFileSync(validationPath, backupPath);
  console.log('✅ Backup created');

  // 2. Read current file
  const originalContent = fs.readFileSync(validationPath, 'utf8');

  // 3. Add enhanced logging to validateUpdateCampaignType
  const enhancedContent = originalContent.replace(
    `const validateUpdateCampaignType = (req, res, next) => {
  const validation = validateData(req.body, updateCampaignTypeSchema);
  
  if (!validation.isValid) {
    return res.status(400).json(createValidationError(validation.errors));
  }
  
  req.validatedData = validation.data;
  next();
};`,
    `const validateUpdateCampaignType = (req, res, next) => {
  // Enhanced debugging
  const timestamp = new Date().toISOString();
  console.log('\\n🚀 CAMPAIGN TYPE UPDATE VALIDATION DEBUG');
  console.log('=======================================');
  console.log('⏰ Timestamp:', timestamp);
  console.log('🌐 URL:', req.method, req.originalUrl);
  console.log('👤 User:', req.user?.username || 'Unknown');
  console.log('📍 Params:', JSON.stringify(req.params));
  console.log('📥 Request Body:');
  console.log('   Type:', typeof req.body);
  console.log('   Value:', JSON.stringify(req.body, null, 2));
  console.log('   Keys:', Object.keys(req.body || {}));
  console.log('   Empty?:', Object.keys(req.body || {}).length === 0);
  
  // Log individual field analysis
  if (req.body) {
    if (req.body.type_name !== undefined) {
      console.log('\\n📝 type_name field analysis:');
      console.log('   Value:', JSON.stringify(req.body.type_name));
      console.log('   Type:', typeof req.body.type_name);
      console.log('   Length:', req.body.type_name?.length || 0);
      
      if (typeof req.body.type_name === 'string') {
        const pattern = /^[a-zA-Z0-9\\\\s\\\\-_&]+$/;
        const isValid = pattern.test(req.body.type_name);
        console.log('   Pattern valid:', isValid);
        
        if (!isValid) {
          console.log('   🚨 INVALID CHARACTERS:');
          for (let i = 0; i < req.body.type_name.length; i++) {
            const char = req.body.type_name[i];
            const code = char.charCodeAt(0);
            const valid = /[a-zA-Z0-9\\\\s\\\\-_&]/.test(char);
            console.log('     [' + i + '] "' + char + '" (' + code + ') ' + (valid ? '✅' : '❌'));
          }
        }
      }
    }
    
    if (req.body.description !== undefined) {
      console.log('\\n📝 description field analysis:');
      console.log('   Value:', JSON.stringify(req.body.description));
      console.log('   Type:', typeof req.body.description);
      console.log('   Length:', req.body.description?.length || 0);
    }
    
    if (req.body.is_active !== undefined) {
      console.log('\\n📝 is_active field analysis:');
      console.log('   Value:', req.body.is_active);
      console.log('   Type:', typeof req.body.is_active);
      console.log('   Is Boolean:', typeof req.body.is_active === 'boolean');
    }
  }
  
  console.log('\\n🔍 Running Joi validation...');
  const validation = validateData(req.body, updateCampaignTypeSchema);
  
  if (!validation.isValid) {
    console.log('❌ VALIDATION FAILED:');
    validation.errors.forEach((error, index) => {
      console.log('   Error ' + (index + 1) + ':');
      console.log('     Field:', error.field);
      console.log('     Message:', error.message);
      console.log('     Value:', JSON.stringify(error.value));
    });
    
    const errorResponse = createValidationError(validation.errors);
    console.log('\\n📤 Sending error response:', JSON.stringify(errorResponse, null, 2));
    return res.status(400).json(errorResponse);
  }
  
  console.log('✅ VALIDATION PASSED');
  console.log('   Validated data:', JSON.stringify(validation.data, null, 2));
  console.log('=======================================\\n');
  
  req.validatedData = validation.data;
  next();
};`
  );

  // 4. Write enhanced file
  console.log('📝 Writing enhanced validation file...');
  fs.writeFileSync(validationPath, enhancedContent);
  console.log('✅ Enhanced validation logging enabled!');

  console.log('\n🚀 Debug mode active!');
  console.log('When you try to update campaign type ID 47, you will see:');
  console.log('  • Complete request analysis');
  console.log('  • Field-by-field validation');
  console.log('  • Character analysis for invalid patterns');
  console.log('  • Detailed error reporting');

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

console.log('\n📋 Next steps:');
console.log('1. Your server should restart automatically (nodemon)');
console.log('2. Try updating campaign type ID 47');
console.log('3. Watch the backend console for detailed logs');
console.log('4. Run restore-validation-debug.js when done');
