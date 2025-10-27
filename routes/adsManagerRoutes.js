const express = require('express');
const rateLimit = require('express-rate-limit');
const AdsManagerController = require('../controllers/AdsManagerController');
const { authenticateToken, requirePermission } = require('../middleware/authMiddleware');

const router = express.Router();

// Rate limiting
const createUpdateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // limit each IP to 50 create/update requests per windowMs
    message: {
        success: false,
        message: 'Too many create/update requests from this IP, please try again later.',
        timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // limit each IP to 300 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.',
        timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply authentication to all routes
router.use(authenticateToken);

// Apply general rate limiting to all routes
router.use(generalLimiter);

// GET /api/ads-managers - Get all Ads Managers with pagination and filtering
router.get('/', 
    requirePermission('ads_manager_view'),
    AdsManagerController.getAll
);

// GET /api/ads-managers/stats - Get Ads Manager statistics
router.get('/stats', 
    requirePermission('ads_manager_view'),
    AdsManagerController.getStats
);

// GET /api/ads-managers/stats-by-bm - Get Ads Manager statistics grouped by BM
router.get('/stats-by-bm', 
    requirePermission('ads_manager_view'),
    AdsManagerController.getStatsByBM
);

// GET /api/ads-managers/bm/:bm_id - Get Ads Managers by BM ID
router.get('/bm/:bm_id',
    requirePermission('ads_manager_view'),
    AdsManagerController.getValidationRules().getByBMId,
    AdsManagerController.getByBMId
);

// GET /api/ads-managers/:id - Get Ads Manager by ID
router.get('/:id', 
    requirePermission('ads_manager_view'),
    AdsManagerController.getValidationRules().getById,
    AdsManagerController.getById
);

// POST /api/ads-managers - Create new Ads Manager
router.post('/',
    requirePermission('ads_manager_create'),
    createUpdateLimiter,
    AdsManagerController.getValidationRules().create,
    AdsManagerController.create
);

// PUT /api/ads-managers/:id - Update Ads Manager
router.put('/:id',
    requirePermission('ads_manager_update'),
    createUpdateLimiter,
    AdsManagerController.getValidationRules().update,
    AdsManagerController.update
);

// DELETE /api/ads-managers/:id - Delete Ads Manager
router.delete('/:id',
    requirePermission('ads_manager_delete'),
    createUpdateLimiter,
    AdsManagerController.getValidationRules().delete,
    AdsManagerController.delete
);

// PATCH /api/ads-managers/:id/toggle-status - Toggle Ads Manager status
router.patch('/:id/toggle-status',
    requirePermission('ads_manager_update'),
    createUpdateLimiter,
    AdsManagerController.getValidationRules().toggleStatus,
    AdsManagerController.toggleStatus
);

console.log('📈 Ads Manager routes initialized with authentication middleware and RBAC');
console.log('📈 Ads Manager routes configuration complete');

module.exports = router;