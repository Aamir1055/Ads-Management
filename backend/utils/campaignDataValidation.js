const Joi = require('joi');

// =============================================================================
// CAMPAIGN DATA VALIDATION SCHEMAS
// =============================================================================

// Base campaign data schema
const campaignDataBaseSchema = {
  campaign_id: Joi.number()
    .integer()
    .positive()
    .messages({
      'number.base': 'Campaign ID must be a number',
      'number.integer': 'Campaign ID must be an integer',
      'number.positive': 'Campaign ID must be a positive number'
    }),
    
  facebook_result: Joi.number()
    .integer()
    .min(0)
    .max(999999999)
    .messages({
      'number.base': 'Facebook result must be a number',
      'number.integer': 'Facebook result must be an integer',
      'number.min': 'Facebook result must be 0 or greater',
      'number.max': 'Facebook result must be less than 1 billion'
    }),
    
  zoho_result: Joi.number()
    .integer()
    .min(0)
    .max(999999999)
    .messages({
      'number.base': 'Zoho result must be a number',
      'number.integer': 'Zoho result must be an integer',
      'number.min': 'Zoho result must be 0 or greater',
      'number.max': 'Zoho result must be less than 1 billion'
    }),
    
  spent: Joi.number()
    .precision(2)
    .min(0)
    .max(9999999999999.99)
    .messages({
      'number.base': 'Spent amount must be a number',
      'number.min': 'Spent amount must be 0 or greater',
      'number.max': 'Spent amount exceeds maximum allowed value',
      'number.precision': 'Spent amount can have at most 2 decimal places'
    }),
    
  data_date: Joi.date()
    .messages({
      'date.base': 'Data date must be a valid date'
    }),
    
  card_id: Joi.number()
    .integer()
    .positive()
    .allow(null)
    .messages({
      'number.base': 'Card ID must be a number',
      'number.integer': 'Card ID must be an integer',
      'number.positive': 'Card ID must be a positive number'
    }),
    
  card_name: Joi.string()
    .trim()
    .max(255)
    .allow('')
    .messages({
      'string.max': 'Card name must not exceed 255 characters'
    }),
    
  created_by: Joi.number()
    .integer()
    .positive()
    .messages({
      'number.base': 'Created by must be a number',
      'number.integer': 'Created by must be an integer',
      'number.positive': 'Created by must be a positive number'
    })
};

// Create campaign data schema
const createCampaignDataSchema = Joi.object({
  campaign_id: campaignDataBaseSchema.campaign_id.required(),
  facebook_result: campaignDataBaseSchema.facebook_result.optional().default(0),
  zoho_result: campaignDataBaseSchema.zoho_result.optional().default(0),
  spent: campaignDataBaseSchema.spent.optional().default(0.00),
  data_date: campaignDataBaseSchema.data_date.optional(),
  card_id: campaignDataBaseSchema.card_id.optional(),
  card_name: campaignDataBaseSchema.card_name.optional(),
  created_by: campaignDataBaseSchema.created_by.optional()
});

// Update campaign data schema
const updateCampaignDataSchema = Joi.object({
  campaign_id: campaignDataBaseSchema.campaign_id.optional(),
  facebook_result: campaignDataBaseSchema.facebook_result.optional(),
  zoho_result: campaignDataBaseSchema.zoho_result.optional(),
  spent: campaignDataBaseSchema.spent.optional(),
  data_date: campaignDataBaseSchema.data_date.optional(),
  card_id: campaignDataBaseSchema.card_id.optional(),
  card_name: campaignDataBaseSchema.card_name.optional()
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
    
  campaign_id: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'Campaign ID must be a number',
      'number.integer': 'Campaign ID must be an integer',
      'number.positive': 'Campaign ID must be a positive number'
    }),
    
  card_id: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'Card ID must be a number',
      'number.integer': 'Card ID must be an integer',
      'number.positive': 'Card ID must be a positive number'
    }),
    
  date_from: Joi.date()
    .optional()
    .messages({
      'date.base': 'From date must be a valid date'
    }),
    
  date_to: Joi.date()
    .optional()
    .min(Joi.ref('date_from'))
    .messages({
      'date.base': 'To date must be a valid date',
      'date.min': 'To date must be after from date'
    }),
    
  search: Joi.string()
    .trim()
    .max(100)
    .allow('')
    .messages({
      'string.max': 'Search term must not exceed 100 characters'
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
 * Middleware for validating campaign data creation
 */
const validateCreateCampaignData = (req, res, next) => {
  const validation = validateData(req.body, createCampaignDataSchema);
  
  if (!validation.isValid) {
    return res.status(400).json(createValidationError(validation.errors));
  }
  
  req.validatedData = validation.data;
  next();
};

/**
 * Middleware for validating campaign data updates
 */
const validateUpdateCampaignData = (req, res, next) => {
  const validation = validateData(req.body, updateCampaignDataSchema);
  
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
    createCampaignDataSchema,
    updateCampaignDataSchema,
    idParamSchema,
    queryParamsSchema
  },
  validators: {
    validateCreateCampaignData,
    validateUpdateCampaignData,
    validateIdParam,
    validateQueryParams
  },
  helpers: {
    validateData,
    createValidationError
  }
};
