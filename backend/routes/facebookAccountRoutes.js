const express = require('express');
const { body, query } = require('express-validator');
const FacebookAccountController = require('../controllers/facebookAccountController');
const { uploadIdImage, handleUploadError } = require('../middleware/uploadMiddleware');
const { authenticateToken, requirePermission } = require('../middleware/authMiddleware');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiting for Facebook account operations
const facebookAccountsRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many Facebook account requests from this IP, please try again later.'
    }
});

// Apply rate limiting and authentication to all routes
router.use(facebookAccountsRateLimit);
router.use(authenticateToken);

// Validation rules for creating Facebook account
const createAccountValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('authenticator')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Authenticator text cannot exceed 500 characters'),
    body('phone_number')
        .optional()
        .isMobilePhone()
        .withMessage('Please provide a valid phone number'),
    body('status')
        .optional()
        .isIn(['enabled', 'disabled', 'suspended_temporarily'])
        .withMessage('Status must be "enabled", "disabled", or "suspended_temporarily"')
];

// Validation rules for updating Facebook account
const updateAccountValidation = [
    body('email')
        .optional()
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    body('password')
        .optional()
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('authenticator')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Authenticator text cannot exceed 500 characters'),
    body('phone_number')
        .optional()
        .isMobilePhone()
        .withMessage('Please provide a valid phone number'),
    body('status')
        .optional()
        .isIn(['enabled', 'disabled', 'suspended_temporarily'])
        .withMessage('Status must be "enabled", "disabled", or "suspended_temporarily"')
];

// Validation for query parameters
const paginationValidation = [
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
        .isIn(['enabled', 'disabled', 'suspended_temporarily'])
        .withMessage('Status must be "enabled", "disabled", or "suspended_temporarily"'),
    query('search')
        .optional()
        .isLength({ min: 2, max: 100 })
        .withMessage('Search term must be between 2 and 100 characters')
];

// Routes

/**
 * @route   GET /api/facebook-accounts
 * @desc    Get all Facebook accounts with pagination and filtering
 * @access  Private (requires Facebook Accounts Read permission)
 */
router.get('/', 
    paginationValidation,
    requirePermission('facebook_accounts_read'),
    FacebookAccountController.getAllAccounts
);

/**
 * @route   GET /api/facebook-accounts/stats
 * @desc    Get Facebook accounts statistics
 * @access  Private (requires Facebook Accounts Read permission)
 */
router.get('/stats',
    requirePermission('facebook_accounts_read'),
    FacebookAccountController.getAccountStats
);

/**
 * @route   GET /api/facebook-accounts/status/:status
 * @desc    Get Facebook accounts by status
 * @access  Private (requires Facebook Accounts Read permission)
 */
router.get('/status/:status',
    requirePermission('facebook_accounts_read'),
    FacebookAccountController.getAccountsByStatus
);

/**
 * @route   GET /api/facebook-accounts/:id
 * @desc    Get Facebook account by ID
 * @access  Private (requires Facebook Accounts Read permission)
 */
router.get('/:id',
    requirePermission('facebook_accounts_read'),
    FacebookAccountController.getAccountById
);

/**
 * @route   POST /api/facebook-accounts
 * @desc    Create new Facebook account
 * @access  Private (requires Facebook Accounts Create permission)
 */
router.post('/',
    requirePermission('facebook_accounts_create'),
    uploadIdImage,
    handleUploadError,
    createAccountValidation,
    FacebookAccountController.createAccount
);

/**
 * @route   PUT /api/facebook-accounts/:id
 * @desc    Update Facebook account
 * @access  Private (requires Facebook Accounts Update permission)
 */
router.put('/:id',
    requirePermission('facebook_accounts_update'),
    uploadIdImage,
    handleUploadError,
    updateAccountValidation,
    FacebookAccountController.updateAccount
);

/**
 * @route   PATCH /api/facebook-accounts/:id/toggle-status
 * @desc    Toggle Facebook account status (enable/disable)
 * @access  Private (requires Facebook Accounts Update permission)
 */
router.patch('/:id/toggle-status',
    requirePermission('facebook_accounts_update'),
    FacebookAccountController.toggleAccountStatus
);

/**
 * @route   DELETE /api/facebook-accounts/:id
 * @desc    Delete Facebook account
 * @access  Private (requires Facebook Accounts Delete permission)
 */
router.delete('/:id',
    requirePermission('facebook_accounts_delete'),
    FacebookAccountController.deleteAccount
);

module.exports = router;