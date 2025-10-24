const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, param } = require('express-validator');
const BMController = require('../controllers/BMController');
const { authenticateToken, requirePermission } = require('../middleware/authMiddleware');

const router = express.Router();

// Rate limiting
const createUpdateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // limit each IP to 30 create/update requests per windowMs
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
    max: 200, // limit each IP to 200 requests per windowMs
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

// GET /api/bm - Get all BMs with pagination and filtering
router.get('/', 
    requirePermission('business_manager_view'),
    BMController.getAll
);

// GET /api/bm/dropdown - Get enabled BMs for dropdown (filtered by user)
router.get('/dropdown',
    requirePermission('business_manager_view'),
    BMController.getForDropdown
);

// GET /api/bm/:id - Get BM by ID
router.get('/:id', 
    requirePermission('business_manager_view'),
    param('id').isInt().withMessage('Invalid BM ID'),
    BMController.getById
);

// POST /api/bm - Create new BM
router.post('/',
    requirePermission('business_manager_create'),
    createUpdateLimiter,
    BMController.getValidationRules(),
    BMController.create
);

// PUT /api/bm/:id - Update BM
router.put('/:id',
    requirePermission('business_manager_update'),
    createUpdateLimiter,
    param('id').isInt().withMessage('Invalid BM ID'),
    BMController.getValidationRules(),
    BMController.update
);

// DELETE /api/bm/:id - Delete BM
router.delete('/:id',
    requirePermission('business_manager_delete'),
    createUpdateLimiter,
    BMController.delete
);

// PATCH /api/bm/:id/toggle-status - Toggle BM status
router.patch('/:id/toggle-status',
    requirePermission('business_manager_update'),
    createUpdateLimiter,
    param('id').isInt().withMessage('Invalid BM ID'),
    BMController.toggleStatus
);

console.log('🏢 BM routes initialized with authentication middleware and RBAC');
console.log('🏢 BM routes configuration complete');

module.exports = router;
