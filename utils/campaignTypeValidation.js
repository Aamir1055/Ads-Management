const Joi = require('joi');

// =============================================================================
// CAMPAIGN TYPE VALIDATION SCHEMAS
// =============================================================================

// Base campaign type schema
const campaignTypeBaseSchema = {
  type_name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .pattern(/^[a-zA-Z0-9\s\-_&]+$/)
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
    .messages({
      'string.max': 'Description must not exceed 1000 characters'
    }),
    
  is_active: Joi.boolean()
    .messages({
      'boolean.base': 'Active status must be true or false'
    })
};

// Create campaign type schema
const createCampaignTypeSchema = Joi.object({
  type_name: campaignTypeBaseSchema.type_name.required(),
  description: campaignTypeBaseSchema.description.optional(),
  is_active: campaignTypeBaseSchema.is_active.optional().default(true)
});

// Update campaign type schema
const updateCampaignTypeSchema = Joi.object({
  type_name: campaignTypeBaseSchema.type_name.optional(),
  description: campaignTypeBaseSchema.description.optional(),
  is_active: campaignTypeBaseSchema.is_active.optional()
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

// ID parameter schema
const idParamSchema = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .messages({
      'number.base': 'ID must be a number',
      'number.integer': 'ID must be an integer',
      'number.positive': 'ID must be a positive number'
    })
});

// Query parameters schema for listing
const queryParamsSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1'
    }),
    
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit must not exceed 100'
    }),
    
  search: Joi.string()
    .trim()
    .max(100)
    .allow('')
    .messages({
      'string.max': 'Search term must not exceed 100 characters'
    }),
    
  status: Joi.string()
    .valid('all', 'active', 'inactive')
    .default('all')
    .messages({
      'any.only': 'Status must be "all", "active", or "inactive"'
    })
});

// =============================================================================
// VALIDATION HELPER FUNCTIONS
// =============================================================================

/**
 * Validate request data against schema
 */
const validateData = (data, schema) => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });
  
  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      value: detail.context?.value
    }));
    
    return {
      isValid: false,
      errors,
      data: null
    };
  }
  
  return {
    isValid: true,
    errors: null,
    data: value
  };
};

/**
 * Create standardized validation error response
 */
const createValidationError = (errors) => {
  const formattedErrors = errors.reduce((acc, error) => {
    acc[error.field] = error.message;
    return acc;
  }, {});
  
  return {
    success: false,
    message: 'Validation failed',
    errors: formattedErrors,
    errorCount: errors.length
  };
};

/**
 * Middleware for validating campaign type creation
 */
const validateCreateCampaignType = (req, res, next) => {
  const validation = validateData(req.body, createCampaignTypeSchema);
  
  if (!validation.isValid) {
    return res.status(400).json(createValidationError(validation.errors));
  }
  
  req.validatedData = validation.data;
  next();
};

/**
 * Middleware for validating campaign type updates
 */
const validateUpdateCampaignType = (req, res, next) => {
  const validation = validateData(req.body, updateCampaignTypeSchema);
  
  if (!validation.isValid) {
    return res.status(400).json(createValidationError(validation.errors));
  }
  
  req.validatedData = validation.data;
  next();
};

/**
 * Middleware for validating ID parameters
 */
const validateIdParam = (req, res, next) => {
  const validation = validateData(req.params, idParamSchema);
  
  if (!validation.isValid) {
    return res.status(400).json(createValidationError(validation.errors));
  }
  
  req.validatedParams = validation.data;
  next();
};

/**
 * Middleware for validating query parameters
 */
const validateQueryParams = (req, res, next) => {
  const validation = validateData(req.query, queryParamsSchema);
  
  if (!validation.isValid) {
    return res.status(400).json(createValidationError(validation.errors));
  }
  
  req.validatedQuery = validation.data;
  next();
};

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  schemas: {
    createCampaignTypeSchema,
    updateCampaignTypeSchema,
    idParamSchema,
    queryParamsSchema
  },
  validators: {
    validateCreateCampaignType,
    validateUpdateCampaignType,
    validateIdParam,
    validateQueryParams
  },
  helpers: {
    validateData,
    createValidationError
  }
};
