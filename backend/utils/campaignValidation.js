const { body, param, query, validationResult } = require('express-validator');

// Helper function to return validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// Validation rules for creating a campaign
const validateCreateCampaign = [
  body('name')
    .notEmpty()
    .withMessage('Campaign name is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Campaign name must be between 1 and 255 characters')
    .trim(),
  
  body('persona')
    .optional()
    .custom((value) => {
      if (value && typeof value === 'string') {
        try {
          JSON.parse(value);
        } catch (e) {
          throw new Error('Persona must be valid JSON');
        }
      }
      return true;
    }),
  
  body('gender')
    .optional()
    .custom((value) => {
      if (value && typeof value === 'string') {
        try {
          JSON.parse(value);
        } catch (e) {
          throw new Error('Gender must be valid JSON');
        }
      }
      return true;
    }),
  
  body('min_age')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Minimum age must be a number between 0 and 100'),
  
  body('max_age')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Maximum age must be a number between 0 and 100'),
  
  body('location')
    .optional()
    .custom((value) => {
      if (value && typeof value === 'string') {
        try {
          JSON.parse(value);
        } catch (e) {
          throw new Error('Location must be valid JSON');
        }
      }
      return true;
    }),
  
  body('creatives')
    .optional()
    .isIn(['video', 'image', 'carousel', 'collection'])
    .withMessage('Creatives must be one of: video, image, carousel, collection'),
  
  body('campaign_type_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Campaign type ID must be a positive integer'),
  
  body('brand')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Brand ID must be a positive integer'),
  
  body('is_enabled')
    .optional()
    .isBoolean()
    .withMessage('is_enabled must be a boolean value'),
  
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive'),
  
  // Custom validation for age range
  body().custom((value, { req }) => {
    const { min_age, max_age } = req.body;
    if (min_age && max_age && parseInt(min_age) > parseInt(max_age)) {
      throw new Error('Minimum age cannot be greater than maximum age');
    }
    return true;
  }),
  
  handleValidationErrors
];

// Validation rules for updating a campaign
const validateUpdateCampaign = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Campaign ID must be a positive integer'),
  
  body('name')
    .optional()
    .notEmpty()
    .withMessage('Campaign name cannot be empty')
    .isLength({ min: 1, max: 255 })
    .withMessage('Campaign name must be between 1 and 255 characters')
    .trim(),
  
  body('persona')
    .optional()
    .custom((value) => {
      if (value && typeof value === 'string') {
        try {
          JSON.parse(value);
        } catch (e) {
          throw new Error('Persona must be valid JSON');
        }
      }
      return true;
    }),
  
  body('gender')
    .optional()
    .custom((value) => {
      if (value && typeof value === 'string') {
        try {
          JSON.parse(value);
        } catch (e) {
          throw new Error('Gender must be valid JSON');
        }
      }
      return true;
    }),
  
  body('min_age')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Minimum age must be a number between 0 and 100'),
  
  body('max_age')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Maximum age must be a number between 0 and 100'),
  
  body('location')
    .optional()
    .custom((value) => {
      if (value && typeof value === 'string') {
        try {
          JSON.parse(value);
        } catch (e) {
          throw new Error('Location must be valid JSON');
        }
      }
      return true;
    }),
  
  body('creatives')
    .optional()
    .isIn(['video', 'image', 'carousel', 'collection'])
    .withMessage('Creatives must be one of: video, image, carousel, collection'),
  
  body('campaign_type_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Campaign type ID must be a positive integer'),
  
  body('brand')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Brand ID must be a positive integer'),
  
  body('is_enabled')
    .optional()
    .isBoolean()
    .withMessage('is_enabled must be a boolean value'),
  
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive'),
  
  // Custom validation for age range
  body().custom((value, { req }) => {
    const { min_age, max_age } = req.body;
    if (min_age && max_age && parseInt(min_age) > parseInt(max_age)) {
      throw new Error('Minimum age cannot be greater than maximum age');
    }
    return true;
  }),
  
  handleValidationErrors
];

// Validation rules for campaign ID parameter
const validateCampaignId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Campaign ID must be a positive integer'),
  
  handleValidationErrors
];

// Validation rules for brand ID parameter
const validateBrandId = [
  param('brandId')
    .isInt({ min: 1 })
    .withMessage('Brand ID must be a positive integer'),
  
  handleValidationErrors
];

// Validation rules for query parameters
const validateCampaignQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive'),
  
  query('enabled')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Enabled must be true or false'),
  
  query('brand_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Brand ID must be a positive integer'),
  
  query('campaign_type_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Campaign type ID must be a positive integer'),
  
  query('creatives')
    .optional()
    .isIn(['video', 'image', 'carousel', 'collection'])
    .withMessage('Creatives must be one of: video, image, carousel, collection'),
  
  query('search')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Search term must be less than 255 characters')
    .trim(),
  
  handleValidationErrors
];

// Helper function to validate JSON fields
const validateJsonField = (value, fieldName) => {
  if (value === null || value === undefined) {
    return null;
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  if (typeof value === 'string') {
    try {
      JSON.parse(value);
      return value;
    } catch (e) {
      throw new Error(`${fieldName} must be valid JSON`);
    }
  }
  
  throw new Error(`${fieldName} must be a valid JSON string or object`);
};

// Helper function to sanitize campaign data
const sanitizeCampaignData = (data) => {
  const sanitized = {};
  
  // Basic string fields
  if (data.name !== undefined) {
    sanitized.name = data.name.trim();
  }
  
  // JSON fields
  const jsonFields = ['persona', 'gender', 'location'];
  jsonFields.forEach(field => {
    if (data[field] !== undefined) {
      try {
        sanitized[field] = validateJsonField(data[field], field);
      } catch (error) {
        throw new Error(error.message);
      }
    }
  });
  
  // Age fields
  if (data.min_age !== undefined) {
    sanitized.min_age = data.min_age ? parseInt(data.min_age) : null;
  }
  
  if (data.max_age !== undefined) {
    sanitized.max_age = data.max_age ? parseInt(data.max_age) : null;
  }
  
  // Enum fields
  if (data.creatives !== undefined) {
    sanitized.creatives = data.creatives || 'image';
  }
  
  if (data.status !== undefined) {
    sanitized.status = data.status || 'active';
  }
  
  // Integer fields
  if (data.campaign_type_id !== undefined) {
    sanitized.campaign_type_id = data.campaign_type_id ? parseInt(data.campaign_type_id) : null;
  }
  
  if (data.brand !== undefined) {
    sanitized.brand = data.brand ? parseInt(data.brand) : null;
  }
  
  // Boolean fields
  if (data.is_enabled !== undefined) {
    sanitized.is_enabled = Boolean(data.is_enabled);
  }
  
  return sanitized;
};

module.exports = {
  validateCreateCampaign,
  validateUpdateCampaign,
  validateCampaignId,
  validateBrandId,
  validateCampaignQuery,
  handleValidationErrors,
  validateJsonField,
  sanitizeCampaignData
};
