const express = require('express');
const { body, query } = require('express-validator');
const FacebookPageController = require('../controllers/facebookPageController');
const { authenticateToken, requirePermission } = require('../middleware/authMiddleware');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiting for Facebook page operations
const facebookPagesRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Limit each IP to 200 requests per windowMs (higher than accounts since pages are more frequently accessed)
    message: {
        success: false,
        message: 'Too many Facebook page requests from this IP, please try again later.'
    }
});

// Apply rate limiting and authentication to all routes
router.use(facebookPagesRateLimit);
router.use(authenticateToken);

// Validation rules for creating Facebook page
const createPageValidation = [
    body('facebook_account_id')
        .isInt({ min: 1 })
        .withMessage('Valid Facebook account ID is required'),
    body('page_name')
        .trim()
        .isLength({ min: 1, max: 255 })
        .withMessage('Page name is required and must be between 1 and 255 characters')
        .matches(/^[a-zA-Z0-9\s\-_&.,!@#$%^*()+=[\]{};:'"<>?/\\|`~]+$/)
        .withMessage('Page name contains invalid characters'),
    body('page_description')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Page description cannot exceed 1000 characters'),
    body('status')
        .optional()
        .isIn(['enabled', 'disabled', 'suspended_temporarily'])
        .withMessage('Status must be "enabled", "disabled", or "suspended_temporarily"')
];

// Validation rules for updating Facebook page
const updatePageValidation = [
    body('facebook_account_id')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Valid Facebook account ID is required'),
    body('page_name')
        .optional()
        .trim()
        .isLength({ min: 1, max: 255 })
        .withMessage('Page name must be between 1 and 255 characters')
        .matches(/^[a-zA-Z0-9\s\-_&.,!@#$%^*()+=[\]{};:'"<>?/\\|`~]+$/)
        .withMessage('Page name contains invalid characters'),
    body('page_description')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Page description cannot exceed 1000 characters'),
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
        .withMessage('Search term must be between 2 and 100 characters'),
    query('accountId')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Account ID must be a positive integer')
];

// Routes

/**
 * @route   GET /api/facebook-pages
 * @desc    Get all Facebook pages with pagination and filtering
 * @access  Private (requires Facebook Pages Read permission)
 */
router.get('/', 
    paginationValidation,
    requirePermission('facebook_pages_view'),
    FacebookPageController.getAllPages
);

/**
 * @route   GET /api/facebook-pages/stats
 * @desc    Get Facebook pages statistics
 * @access  Private (requires Facebook Pages Read permission)
 */
router.get('/stats',
    requirePermission('facebook_pages_view'),
    FacebookPageController.getPageStats
);

/**
 * @route   GET /api/facebook-pages/facebook-accounts
 * @desc    Get Facebook accounts for dropdown (only enabled accounts)
 * @access  Private (requires Facebook Pages Read permission)
 */
router.get('/facebook-accounts',
    requirePermission('facebook_pages_view'),
    FacebookPageController.getFacebookAccountsForDropdown
);

/**
 * @route   GET /api/facebook-pages/status/:status
 * @desc    Get Facebook pages by status
 * @access  Private (requires Facebook Pages Read permission)
 */
router.get('/status/:status',
    requirePermission('facebook_pages_view'),
    FacebookPageController.getPagesByStatus
);

/**
 * @route   GET /api/facebook-pages/account/:accountId
 * @desc    Get Facebook pages by account ID
 * @access  Private (requires Facebook Pages Read permission)
 */
router.get('/account/:accountId',
    requirePermission('facebook_pages_view'),
    FacebookPageController.getPagesByAccountId
);

/**
 * @route   GET /api/facebook-pages/:id
 * @desc    Get Facebook page by ID
 * @access  Private (requires Facebook Pages Read permission)
 */
router.get('/:id',
    requirePermission('facebook_pages_view'),
    FacebookPageController.getPageById
);

/**
 * @route   POST /api/facebook-pages
 * @desc    Create new Facebook page
 * @access  Private (requires Facebook Pages Create permission)
 */
router.post('/',
    requirePermission('facebook_pages_create'),
    createPageValidation,
    FacebookPageController.createPage
);

/**
 * @route   PUT /api/facebook-pages/:id
 * @desc    Update Facebook page
 * @access  Private (requires Facebook Pages Update permission)
 */
router.put('/:id',
    requirePermission('facebook_pages_update'),
    updatePageValidation,
    FacebookPageController.updatePage
);

/**
 * @route   PATCH /api/facebook-pages/:id/toggle-status
 * @desc    Toggle Facebook page status (enable/disable)
 * @access  Private (requires Facebook Pages Update permission)
 */
router.patch('/:id/toggle-status',
    requirePermission('facebook_pages_update'),
    FacebookPageController.togglePageStatus
);

/**
 * @route   DELETE /api/facebook-pages/:id
 * @desc    Delete Facebook page
 * @access  Private (requires Facebook Pages Delete permission)
 */
router.delete('/:id',
    requirePermission('facebook_pages_delete'),
    FacebookPageController.deletePage
);

module.exports = router;