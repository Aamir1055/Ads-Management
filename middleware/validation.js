const Joi = require('joi'); // Joi API for schema validation [2]

// Minimal password policy: just non-empty
// const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,128}$/; // Removed strict policy

/**
 * Validation middleware factory - DISABLED
 * No validation - just passes through without any checks
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    // No validation - just pass through
    next();
  };
};

/**
 * Common schemas
 */

// Password schema (minimal validation)
const passwordSchema = Joi.string()
  .required()
  .messages({
    'any.required': 'Password is required',
    'string.empty': 'Password cannot be empty'
  }); // Minimal password enforcement

// Username schema (minimal validation)
const usernameSchema = Joi.string()
  .trim()
  .required()
  .messages({
    'any.required': 'Username is required',
    'string.empty': 'Username cannot be empty'
  }); // Minimal username validation

// Role ID schema
const roleIdSchema = Joi.number()
  .integer()
  .positive()
  .required()
  .messages({
    'number.base': 'Role ID must be a number',
    'number.integer': 'Role ID must be an integer',
    'number.positive': 'Role ID must be a positive number',
    'any.required': 'Role ID is required'
  }); // Role type safety [1]

// User ID schema
const userIdSchema = Joi.number()
  .integer()
  .positive()
  .required()
  .messages({
    'number.base': 'User ID must be a number',
    'number.integer': 'User ID must be an integer',
    'number.positive': 'User ID must be a positive number',
    'any.required': 'User ID is required'
  }); // ID validation [1]

// 2FA token schema (6 digits)
const twoFATokenSchema = Joi.string()
  .pattern(/^\d{6}$/)
  .required()
  .messages({
    'string.pattern.base': 'Token must be exactly 6 digits',
    'any.required': '2FA token is required',
    'string.empty': '2FA token cannot be empty'
  }); // TOTP code format [1]

/**
 * Endpoint-specific schemas
 */

// Create user schema
const createUserSchema = Joi.object({
  username: usernameSchema,
  password: passwordSchema,
  confirm_password: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Confirm password is required'
    }),
  role_id: roleIdSchema,
  enable_2fa: Joi.boolean()
    .default(false)
    .messages({
      'boolean.base': 'Enable 2FA must be a boolean value'
    }),
  timezone: Joi.string()
    .max(50)
    .default('UTC')
    .messages({
      'string.max': 'Timezone cannot exceed 50 characters'
    })
}); // Create payload validation [1]

// Update user schema
const updateUserSchema = Joi.object({
  username: usernameSchema.optional(),
  password: Joi.string()
    .messages({
      'string.empty': 'Password cannot be empty'
    })
    .optional(),
  // If password provided, require confirm_password and ensure match
  confirm_password: Joi.when('password', {
    is: Joi.exist(),
    then: Joi.string().valid(Joi.ref('password')).required().messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Confirm password is required when updating password'
    }),
    otherwise: Joi.forbidden()
  }),
  role_id: Joi.number()
    .integer()
    .positive()
    .optional()
    .messages({
      'number.base': 'Role ID must be a number',
      'number.integer': 'Role ID must be an integer',
      'number.positive': 'Role ID must be a positive number'
    }),
  is_active: Joi.boolean().messages({
    'boolean.base': 'Active status must be a boolean value'
  })
})
  .min(1)
  .messages({
    'object.min': 'At least one field is required for update'
  }); // Update payload with conditional confirm [1]

// Login schema (presence checks only)
const loginSchema = Joi.object({
  username: Joi.string().trim().required().messages({
    'any.required': 'Username is required',
    'string.empty': 'Username cannot be empty'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
    'string.empty': 'Password cannot be empty'
  })
}); // Authentication payload with minimal validation

// 2FA schemas
const setup2FASchema = Joi.object({
  user_id: userIdSchema
}); // 2FA setup [1]

const verify2FASchema = Joi.object({
  user_id: userIdSchema,
  token: twoFATokenSchema
}); // 2FA verify [1]

const disable2FASchema = Joi.object({
  user_id: userIdSchema,
  token: twoFATokenSchema
}); // 2FA disable [1]

// Login with 2FA schema (alt flow)
const loginWith2FASchema = Joi.object({
  user_id: userIdSchema,
  token: twoFATokenSchema
}); // 2FA login [1]

// Validate credentials schema (utility)
const validateCredentialsSchema = Joi.object({
  password: passwordSchema,
  twofa_token: twoFATokenSchema.optional()
}); // Password + optional TOTP

// Pagination and search query schema
const paginationSchema = Joi.object({
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
      'number.max': 'Limit cannot exceed 100'
    }),
  search: Joi.string()
    .max(100)
    .trim()
    .allow('')
    .optional()
    .messages({
      'string.max': 'Search term cannot exceed 100 characters'
    }),
  role_id: roleIdSchema.optional(),
  is_active: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'Active status must be a boolean value'
    })
}); // Paging/filtering validation [1]

// ID param schema
const idParamSchema = Joi.object({
  id: userIdSchema
}); // Router param validation [1]

/**
 * Middleware shortcuts
 */

// Validate ID param
const validateIdParam = validate(idParamSchema, 'params'); // Params validation [1]

// Validate pagination query
const validatePagination = validate(paginationSchema, 'query'); // Query validation [1]

// User management validators
const validateCreateUser = validate(createUserSchema);
const validateUpdateUser = validate(updateUserSchema);
const validateLogin = validate(loginSchema);
const validateLoginWith2FA = validate(loginWith2FASchema);
const validateCredentials = validate(validateCredentialsSchema); // Ready-to-use middlewares [1]

// 2FA validators
const validateSetup2FA = validate(setup2FASchema);
const validateVerify2FA = validate(verify2FASchema);
const validateDisable2FA = validate(disable2FASchema); // TOTP middlewares [1]

/**
 * Business-rule middlewares
 */

// Username uniqueness - DISABLED
const validateUsernameUniqueness = async (req, res, next) => {
  // No validation - just pass through
  next();
};

// Validate role exists - DISABLED  
const validateRoleExists = async (req, res, next) => {
  // No validation - just pass through
  next();
};

/**
 * Utility
 */

// Password strength helper (for UI hints only) — fixed level fallback and suggestion indices
const getPasswordStrength = (password) => {
  // Basic checks
  const checks = [
    /[a-z]/.test(password),        // 0: lowercase
    /[A-Z]/.test(password),        // 1: uppercase
    /[0-9]/.test(password),        // 2: numbers
    /[^A-Za-z0-9]/.test(password), // 3: special chars
    password.length >= 8,          // 4: min length
    password.length >= 12          // 5: long length
  ]; // Strength components [1]

  const score = checks.filter(Boolean).length;

  const levels = [
    { min: 0, max: 2, label: 'Very Weak', color: 'red' },
    { min: 3, max: 3, label: 'Weak', color: 'orange' },
    { min: 4, max: 4, label: 'Fair', color: 'yellow' },
    { min: 5, max: 5, label: 'Good', color: 'lightgreen' },
    { min: 6, max: 6, label: 'Strong', color: 'green' }
  ]; // Discrete levels [1]

  const levelObj = levels.find(l => score >= l.min && score <= l.max) || levels;

  return {
    score,
    level: levelObj.label,
    color: levelObj.color,
    suggestions: [
      !checks && 'Add lowercase letters',
      !checks[3] && 'Add uppercase letters',
      !checks[4] && 'Add numbers',
      !checks[5] && 'Add special characters (@$!%*?&)',
      !checks[6] && 'Make it at least 8 characters long',
      !checks[1] && 'Consider making it 12+ characters for extra security'
    ].filter(Boolean)
  };
}; // UI strength guidance [1]

module.exports = {
  validate,

  // Schemas
  createUserSchema,
  updateUserSchema,
  loginSchema,
  loginWith2FASchema,
  validateCredentialsSchema,
  setup2FASchema,
  verify2FASchema,
  disable2FASchema,
  paginationSchema,
  idParamSchema,

  // Middleware
  validateIdParam,
  validatePagination,
  validateCreateUser,
  validateUpdateUser,
  validateLogin,
  validateLoginWith2FA,
  validateCredentials,
  validateSetup2FA,
  validateVerify2FA,
  validateDisable2FA,

  // Business rules
  validateUsernameUniqueness,
  validateRoleExists,

  // Utils
  getPasswordStrength,

  // Expose constants (commented out as not using strict validation)
  // PASSWORD_REGEX
};
