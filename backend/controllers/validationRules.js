const BMModel = require('../models/BMModel');
const { body, param, validationResult } = require('express-validator');

class BMController {
    // Validation rules for create and update operations
    static getValidationRules() {
        return [
            body('bm_name')
                .trim()
                .notEmpty()
                .withMessage('Business Manager name is required')
                .isLength({ min: 2, max: 255 })
                .withMessage('Business Manager name must be between 2 and 255 characters'),
            body('email')
                .trim()
                .notEmpty()
                .withMessage('Email is required')
                .isEmail()
                .withMessage('Please provide a valid email address')
                .normalizeEmail(),
            body('phone_number')
                .optional({ nullable: true, checkFalsy: true })  // Allow null, undefined, or empty string
                .trim()
                .custom((value) => {
                    // Skip validation if phone_number is empty/null/undefined
                    if (!value) return true;
                    // Only validate format if a phone number is provided
                    return /^\+?[1-9]\d{1,14}$/.test(value) || 
                           Promise.reject('Please provide a valid phone number');
                }),
            body('status')
                .optional()
                .isIn(['enabled', 'disabled', 'suspended_temporarily'])
                .withMessage('Status must be either enabled, disabled, or suspended_temporarily')
        ];
    }
}

module.exports = BMController;