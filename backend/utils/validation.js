const Joi = require('joi');

// Strong password regex: minimum 8 characters, at least 1 uppercase, 1 lowercase, 1 number, and 1 special character
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Custom validation messages
const customMessages = {
  username: {
    'string.alphanum': 'Username must only contain letters and numbers',
    'string.min': 'Username must be at least 3 characters',
    'string.max': 'Username cannot exceed 30 characters',
    'any.required': 'Username is required'
  },
  password: {
    'string.pattern.base': 'Password must contain at least 8 characters with uppercase, lowercase, number, and special character (@$!%*?&)',
    'any.required': 'Password is required'
  },
  confirm_password: {
    'any.only': 'Passwords do not match',
    'any.required': 'Password confirmation is required'
  },
  role_id: {
    'number.base': 'Role must be a valid number',
    'number.min': 'Invalid role selected',
    'number.max': 'Invalid role selected'
  },
  is_active: {
    'boolean.base': 'Active status must be true or false'
  },
  is_2fa_enabled: {
    'boolean.base': '2FA status must be true or false'
  },
  id: {
    'number.base': 'ID must be a number',
    'number.min': 'Invalid ID provided',
    'any.required': 'ID is required'
  }
};

const userValidation = {
  // Create user validation schema
  createUser: Joi.object({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(30)
      .required()
      .messages(customMessages.username),
    
    password: Joi.string()
      .pattern(passwordRegex)
      .required()
      .messages(customMessages.password),
    
    confirm_password: Joi.string()
      .valid(Joi.ref('password'))
      .required()
      .messages(customMessages.confirm_password),
    
    role_id: Joi.number()
      .integer()
      .min(1)
      .max(10)
      .default(3)
      .messages(customMessages.role_id),
    enable_2fa: Joi.boolean().optional()
  }),

  // Update user validation schema
  updateUser: Joi.object({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(30)
      .optional()
      .messages(customMessages.username),
    
    password: Joi.string()
      .pattern(passwordRegex)
      .optional()
      .messages(customMessages.password),
    
    confirm_password: Joi.when('password', {
      is: Joi.exist(),
      then: Joi.string()
        .valid(Joi.ref('password'))
        .required()
        .messages(customMessages.confirm_password),
      otherwise: Joi.forbidden()
    }),
    
    role_id: Joi.number()
      .integer()
      .min(1)
      .max(10)
      .optional()
      .messages(customMessages.role_id),
    
  is_active: Joi.boolean().optional().messages(customMessages.is_active),
  is_2fa_enabled: Joi.boolean().optional().messages(customMessages.is_2fa_enabled)
  }),

  // ID validation schema
  validateId: Joi.object({
    id: Joi.number()
      .integer()
      .min(1)
      .required()
      .messages(customMessages.id)
  }),

  // 2FA token validation
  validate2FAToken: Joi.object({
    token: Joi.string()
      .length(6)
      .pattern(/^[0-9]{6}$/)
      .required()
      .messages({
        'string.length': '2FA token must be 6 digits',
        'string.pattern.base': '2FA token must contain only numbers',
        'any.required': '2FA token is required'
      })
  }),

  // Login validation
  validateLogin: Joi.object({
    username: Joi.string()
      .required()
      .messages({
        'any.required': 'Username is required'
      }),
    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Password is required'
      }),
    token: Joi.string()
      .length(6)
      .pattern(/^[0-9]{6}$/)
      .optional()
      .messages({
        'string.length': '2FA token must be 6 digits',
        'string.pattern.base': '2FA token must contain only numbers'
      })
  }),

  // Helper function to format validation errors
  formatErrors: (validationResult) => {
    if (!validationResult.error) return null;
    
    return validationResult.error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
  },

  // Helper function to validate and sanitize input
  validateInput: (schema, data) => {
    const result = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false
    });

    return {
      isValid: !result.error,
      data: result.value,
      errors: result.error ? userValidation.formatErrors(result) : null
    };
  }
};

module.exports = userValidation;
