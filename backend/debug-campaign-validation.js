const { pool } = require('./config/database');

// Debug script to investigate campaign type validation issues
const debugCampaignTypeValidation = async () => {
  console.log('🔍 Campaign Type Validation Debug Script');
  console.log('==========================================\n');

  try {
    // 1. Check if campaign type 47 exists
    console.log('1. Checking if campaign type ID 47 exists...');
    const [rows] = await pool.execute(
      'SELECT id, type_name, description, is_active, created_at, updated_at FROM campaign_types WHERE id = ?',
      [47]
    );

    if (!rows || rows.length === 0) {
      console.log('❌ Campaign type with ID 47 NOT FOUND');
      console.log('   This could be why the update is failing.\n');
      
      // Show available IDs
      const [allRows] = await pool.execute('SELECT id, type_name FROM campaign_types ORDER BY id');
      console.log('Available campaign type IDs:');
      allRows.forEach(row => {
        console.log(`   ID: ${row.id} - "${row.type_name}"`);
      });
      return;
    }

    const campaignType = rows[0];
    console.log('✅ Found campaign type:');
    console.log('   ID:', campaignType.id);
    console.log('   Name:', JSON.stringify(campaignType.type_name));
    console.log('   Description:', JSON.stringify(campaignType.description));
    console.log('   Is Active:', campaignType.is_active);
    console.log('   Created:', campaignType.created_at);
    console.log('   Updated:', campaignType.updated_at);

    // 2. Validate the name against the regex pattern
    console.log('\n2. Validating name against regex pattern...');
    const namePattern = /^[a-zA-Z0-9\s\-_&]+$/;
    const nameValid = namePattern.test(campaignType.type_name);
    
    console.log('   Pattern:', namePattern.toString());
    console.log('   Name:', JSON.stringify(campaignType.type_name));
    console.log('   Valid:', nameValid ? '✅ YES' : '❌ NO');
    
    if (!nameValid) {
      console.log('   🚨 FOUND THE ISSUE! The name contains invalid characters.');
      console.log('   Characters in name:');
      for (let i = 0; i < campaignType.type_name.length; i++) {
        const char = campaignType.type_name[i];
        const charCode = char.charCodeAt(0);
        const isValid = /[a-zA-Z0-9\s\-_&]/.test(char);
        console.log(`      [${i}] "${char}" (${charCode}) ${isValid ? '✅' : '❌'}`);
      }
    }

    // 3. Check description length
    console.log('\n3. Validating description...');
    const descLength = campaignType.description ? campaignType.description.length : 0;
    console.log('   Length:', descLength);
    console.log('   Valid:', descLength <= 1000 ? '✅ YES' : '❌ NO (exceeds 1000 chars)');

    // 4. Test validation with Joi
    console.log('\n4. Testing with actual validation schema...');
    const Joi = require('joi');
    
    const updateCampaignTypeSchema = Joi.object({
      type_name: Joi.string()
        .trim()
        .min(2)
        .max(100)
        .pattern(/^[a-zA-Z0-9\s\-_&]+$/)
        .optional(),
      description: Joi.string()
        .trim()
        .max(1000)
        .allow('')
        .optional(),
      is_active: Joi.boolean().optional()
    }).min(1);

    // Test current data
    const testData = {
      type_name: campaignType.type_name,
      description: campaignType.description,
      is_active: campaignType.is_active === 1
    };

    const { error, value } = updateCampaignTypeSchema.validate(testData, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      console.log('❌ Validation FAILED:');
      error.details.forEach((detail, index) => {
        console.log(`   Error ${index + 1}:`);
        console.log(`     Field: ${detail.path.join('.')}`);
        console.log(`     Message: ${detail.message}`);
        console.log(`     Value: ${JSON.stringify(detail.context?.value)}`);
      });
    } else {
      console.log('✅ Validation PASSED');
      console.log('   Validated data:', JSON.stringify(value, null, 2));
    }

    // 5. Test with empty update (common issue)
    console.log('\n5. Testing empty update validation...');
    const emptyTest = updateCampaignTypeSchema.validate({}, { abortEarly: false });
    if (emptyTest.error) {
      console.log('❌ Empty update validation FAILED (this is expected):');
      emptyTest.error.details.forEach(detail => {
        console.log(`   ${detail.message}`);
      });
    }

  } catch (error) {
    console.error('❌ Script error:', error.message);
    console.error(error.stack);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
};

// Run the debug script
debugCampaignTypeValidation();
