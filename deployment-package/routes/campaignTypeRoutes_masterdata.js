const express = require('express');
const router = express.Router();

// Authentication middleware
const { authenticateToken } = require('../middleware/authMiddleware');

// RBAC middleware
const { checkModulePermission } = require('../middleware/rbacMiddleware');

// Controller - Master Data version
const {
  getAllCampaignTypes,
  getCampaignTypeById,
  createCampaignType,
  updateCampaignType,
  deleteCampaignType
} = require('../controllers/campaignTypeController_masterdata');

// =============================================================================
// MIDDLEWARE
// =============================================================================

// Request logging with user context
const requestLogger = (req, res, next) => {
  const ts = new Date().toISOString();
  const userInfo = req.user ? `User: ${req.user.username} (ID: ${req.user.id})` : 'Unauthenticated';
  console.log(`[${ts}] ${req.method} ${req.originalUrl} - Campaign Types API - ${userInfo}`);
  
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
  }
  next();
};

router.use(requestLogger);

// =============================================================================
// AUTHENTICATION REQUIRED FOR ALL ROUTES
// =============================================================================

// Apply authentication to all routes
router.use(authenticateToken);

// =============================================================================
// MASTER DATA ROUTES (RBAC-PROTECTED)
// =============================================================================

/**
 * GET /api/campaign-types
 * Lists all campaign types (master data)
 * - All authenticated users can read (master data accessible to all)
 * - RBAC: Requires campaign_types_read permission
 */
router.get('/', 
  checkModulePermission('campaign_types', 'read'),
  getAllCampaignTypes
);

/**
 * GET /api/campaign-types/:id
 * Gets single campaign type (master data)
 * - All authenticated users can read (master data accessible to all)
 * - RBAC: Requires campaign_types_read permission
 */
router.get('/:id', 
  checkModulePermission('campaign_types', 'read'),
  getCampaignTypeById
);

/**
 * POST /api/campaign-types
 * Creates campaign type (SuperAdmin only)
 * - RBAC: Requires campaign_types_create permission
 * - Additional check: SuperAdmin only (in controller)
 */
router.post('/', 
  checkModulePermission('campaign_types', 'create'),
  createCampaignType
);

/**
 * PUT /api/campaign-types/:id
 * Updates campaign type (SuperAdmin only)
 * - RBAC: Requires campaign_types_update permission
 * - Additional check: SuperAdmin only (in controller)
 */
router.put('/:id', 
  checkModulePermission('campaign_types', 'update'),
  updateCampaignType
);

/**
 * DELETE /api/campaign-types/:id
 * Soft deletes campaign type (SuperAdmin only)
 * - RBAC: Requires campaign_types_delete permission
 * - Additional check: SuperAdmin only (in controller)
 */
router.delete('/:id', 
  checkModulePermission('campaign_types', 'delete'),
  deleteCampaignType
);

// =============================================================================
// ERROR HANDLING
// =============================================================================

// 404 for unmatched routes
router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableRoutes: {
      'GET /campaign-types': 'Get all campaign types (master data - accessible to all)',
      'POST /campaign-types': 'Create new campaign type (SuperAdmin only)',
      'GET /campaign-types/:id': 'Get campaign type by ID (master data - accessible to all)',
      'PUT /campaign-types/:id': 'Update campaign type (SuperAdmin only)',
      'DELETE /campaign-types/:id': 'Soft delete campaign type (SuperAdmin only)'
    }
  });
});

// Error handler
router.use((error, req, res, next) => {
  const ts = new Date().toISOString();
  const userInfo = req.user ? `User: ${req.user.username} (ID: ${req.user.id})` : 'Unknown user';
  
  console.error(`[${ts}] Campaign Types routes error for ${userInfo}:`, {
    error: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method
  });

  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(error.statusCode || 500).json({
    success: false,
    message: isDevelopment 
      ? error.message 
      : 'Internal server error in campaign types management',
    timestamp: ts,
    ...(isDevelopment && { 
      error: error.message, 
      stack: error.stack 
    })
  });
});

module.exports = router;
