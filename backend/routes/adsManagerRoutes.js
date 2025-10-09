const express = require('express');
const rateLimit = require('express-rate-limit');
const AdsManagerController = require('../controllers/AdsManagerController');
const { authenticateToken } = require('../middleware/authMiddleware');

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
router.get('/', AdsManagerController.getAll);

// GET /api/ads-managers/stats - Get Ads Manager statistics
router.get('/stats', AdsManagerController.getStats);

// GET /api/ads-managers/stats-by-bm - Get Ads Manager statistics grouped by BM
router.get('/stats-by-bm', AdsManagerController.getStatsByBM);

// GET /api/ads-managers/bm/:bm_id - Get Ads Managers by BM ID
router.get('/bm/:bm_id',
    AdsManagerController.getValidationRules().getByBMId,
    AdsManagerController.getByBMId
);

// GET /api/ads-managers/:id - Get Ads Manager by ID
router.get('/:id', 
    AdsManagerController.getValidationRules().getById,
    AdsManagerController.getById
);

// POST /api/ads-managers - Create new Ads Manager
router.post('/',
    createUpdateLimiter,
    AdsManagerController.getValidationRules().create,
    AdsManagerController.create
);

// PUT /api/ads-managers/:id - Update Ads Manager
router.put('/:id',
    createUpdateLimiter,
    AdsManagerController.getValidationRules().update,
    AdsManagerController.update
);

// DELETE /api/ads-managers/:id - Delete Ads Manager
router.delete('/:id',
    createUpdateLimiter,
    AdsManagerController.getValidationRules().delete,
    AdsManagerController.delete
);

// PATCH /api/ads-managers/:id/toggle-status - Toggle Ads Manager status
router.patch('/:id/toggle-status',
    createUpdateLimiter,
    AdsManagerController.getValidationRules().toggleStatus,
    AdsManagerController.toggleStatus
);

console.log('📈 Ads Manager routes initialized with authentication middleware and RBAC');
console.log('📈 Ads Manager routes configuration complete');

module.exports = router;