// Enhanced validation middleware for debugging
// This file temporarily replaces the validation functions to provide detailed logging

const Joi = require('joi');

// Enhanced validation helper with detailed logging
const validateDataWithLogging = (data, schema, operation = 'validation') => {
  const timestamp = new Date().toISOString();
  
  console.log(`\n🔍 [${timestamp}] Enhanced Validation Debug - ${operation}`);
  console.log('================================================');
  
  // Log raw input data
  console.log('📥 Raw Input Data:');
  console.log('   Type:', typeof data);
  console.log('   Value:', JSON.stringify(data, null, 2));
  console.log('   Keys:', Object.keys(data || {}));
  
  // Perform validation
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });
  
  // Log validation results
  if (error) {
    console.log('❌ VALIDATION FAILED:');
    console.log(`   Error count: ${error.details.length}`);
    
    error.details.forEach((detail, index) => {
      console.log(`   \n   Error ${index + 1}:`);
      console.log(`     Field: "${detail.path.join('.')}"`);
      console.log(`     Message: "${detail.message}"`);
      console.log(`     Value: ${JSON.stringify(detail.context?.value)}`);
      console.log(`     Type: ${typeof detail.context?.value}`);
      console.log(`     Rule: ${detail.type}`);
      
      // Special handling for pattern errors
      if (detail.type === 'string.pattern.base' && detail.context?.value) {
        console.log(`     \n     🔍 Pattern Analysis for "${detail.context.value}":`);
        const pattern = /^[a-zA-Z0-9\s\-_&]+$/;
        for (let i = 0; i < detail.context.value.length; i++) {
          const char = detail.context.value[i];
          const code = char.charCodeAt(0);
          const valid = /[a-zA-Z0-9\s\-_&]/.test(char);
          console.log(`       [${i}] "${char}" (code: ${code}) ${valid ? '✅' : '❌ INVALID'}`);
        }
      }
    });
    
    // Create error response
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      value: detail.context?.value
    }));
    
    const formattedErrors = errors.reduce((acc, error) => {
      acc[error.field] = error.message;
      return acc;
    }, {});
    
    console.log('   \n   Formatted Errors:', JSON.stringify(formattedErrors, null, 2));
    
    return {
      isValid: false,
      errors,
      formattedErrors,
      data: null
    };
  } else {
    console.log('✅ VALIDATION PASSED:');
    console.log('   Validated data:', JSON.stringify(value, null, 2));
    
    return {
      isValid: true,
      errors: null,
      formattedErrors: null,
      data: value
    };
  }
};

// Enhanced validation middleware for campaign type updates
const enhancedValidateUpdateCampaignType = (req, res, next) => {
  console.log('\n🚀 Enhanced Update Campaign Type Validation Middleware');
  console.log('=====================================================');
  
  // Log request details
  const timestamp = new Date().toISOString();
  console.log(`⏰ Timestamp: ${timestamp}`);
  console.log(`🌐 URL: ${req.method} ${req.originalUrl}`);
  console.log(`👤 User: ${req.user?.username || 'Unknown'} (ID: ${req.user?.id || 'N/A'})`);
  console.log(`📍 Route Params:`, req.params);
  
  // Log headers (sanitized)
  console.log('📋 Headers:');
  console.log(`   Content-Type: ${req.headers['content-type']}`);
  console.log(`   Authorization: ${req.headers.authorization ? req.headers.authorization.substring(0, 30) + '...' : 'None'}`);
  console.log(`   User-Agent: ${req.headers['user-agent']?.substring(0, 50)}...`);
  
  // Create the schema
  const updateCampaignTypeSchema = Joi.object({
    type_name: Joi.string()
      .trim()
      .min(2)
      .max(100)
      .pattern(/^[a-zA-Z0-9\s\-_&]+$/)
      .optional()
      .messages({
        'string.empty': 'Campaign type name is required',
        'string.min': 'Campaign type name must be at least 2 characters long',
        'string.max': 'Campaign type name must not exceed 100 characters',
        'string.pattern.base': 'Campaign type name can only contain letters, numbers, spaces, hyphens, underscores, and ampersands'
      }),
    description: Joi.string()
      .trim()
      .max(1000)
      .allow('')
      .optional()
      .messages({
        'string.max': 'Description must not exceed 1000 characters'
      }),
    is_active: Joi.boolean()
      .optional()
      .messages({
        'boolean.base': 'Active status must be true or false'
      })
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update'
  });
  
  // Perform validation with enhanced logging
  const validation = validateDataWithLogging(req.body, updateCampaignTypeSchema, 'Campaign Type Update');
  
  if (!validation.isValid) {
    const errorResponse = {
      success: false,
      message: 'Validation failed',
      errors: validation.formattedErrors,
      errorCount: validation.errors.length,
      timestamp: new Date().toISOString(),
      debug: {
        rawBody: req.body,
        validationErrors: validation.errors
      }
    };
    
    console.log('❌ Sending validation error response:', JSON.stringify(errorResponse, null, 2));
    return res.status(400).json(errorResponse);
  }
  
  req.validatedData = validation.data;
  console.log('✅ Validation passed, proceeding to controller...\n');
  next();
};

module.exports = {
  enhancedValidateUpdateCampaignType,
  validateDataWithLogging
};
