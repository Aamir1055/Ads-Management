const express = require('express');
const router = express.Router();

// Authentication middleware
const { authenticateToken } = require('../middleware/authMiddleware');

// RBAC middleware
const { createPermissionMiddleware } = require('../config/rbacRouteMapping');

// Data privacy middleware
const { 
  dataPrivacyMiddleware, 
  ensureOwnership,
  validateOwnership 
} = require('../middleware/dataPrivacy');

// Controller - Privacy enabled
const {
  getAllCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  toggleCampaignStatus,
  getCampaignStats,
  getCampaignsByBrand
} = require('../controllers/campaignController_privacy');

// Note: updateCampaign is already imported above for activate/deactivate functionality

// =============================================================================
// MIDDLEWARE
// =============================================================================

// Request logging with user context
const requestLogger = (req, res, next) => {
  const ts = new Date().toISOString();
  const userInfo = req.user ? `User: ${req.user.username} (ID: ${req.user.id})` : 'Unauthenticated';
  console.log(`[${ts}] ${req.method} ${req.originalUrl} - Campaigns API - ${userInfo}`);
  
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
  }
  next();
};

router.use(requestLogger);

// Rate limiter
const createRateLimit = (windowMs = 15 * 60 * 1000, max = 100) => {
  const requests = new Map();

  const cleanup = () => {
    const now = Date.now();
    for (const [key, val] of requests.entries()) {
      if (now > val.resetTime) requests.delete(key);
    }
  };

  const interval = setInterval(cleanup, Math.min(windowMs, 5 * 60 * 1000));
  interval.unref?.();

  const clearAll = () => clearInterval(interval);
  if (typeof process !== 'undefined') {
    process.on('exit', clearAll);
    process.on('SIGINT', () => { clearAll(); process.exit(0); });
    process.on('SIGTERM', () => { clearAll(); process.exit(0); });
  }

  return (req, res, next) => {
    const clientId = req.ip || 'unknown';
    const now = Date.now();

    let entry = requests.get(clientId);
    if (!entry || now > entry.resetTime) {
      entry = { count: 0, resetTime: now + windowMs };
      requests.set(clientId, entry);
    }

    if (entry.count >= max) {
      const retryAfterSec = Math.ceil((entry.resetTime - now) / 1000);
      res.set('Retry-After', String(retryAfterSec));
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        retryAfter: retryAfterSec
      });
    }

    entry.count += 1;
    next();
  };
};

// Rate limiter instances
const listLimiter = createRateLimit(5 * 60 * 1000, 50);
const createLimiter = createRateLimit(15 * 60 * 1000, 20);
const updateLimiter = createRateLimit(15 * 60 * 1000, 30);
const deleteLimiter = createRateLimit(60 * 60 * 1000, 10);

// =============================================================================
// AUTHENTICATION REQUIRED FOR ALL DATA OPERATIONS
// =============================================================================

// Apply authentication to all routes
router.use(authenticateToken);

// Apply data privacy middleware
router.use(dataPrivacyMiddleware);

// =============================================================================
// DATA PRIVACY ENABLED ROUTES
// =============================================================================

/**
 * GET /api/campaigns
 * Lists campaigns with user-based filtering
 * - Admins see all campaigns
 * - Regular users see only their own campaigns
 * - RBAC: Requires campaigns_read permission
 */
router.get('/', 
  listLimiter,
  (req,res,next)=>next(), // 🔒 RBAC: campaigns_read required
  getAllCampaigns
);

/**
 * GET /api/campaigns/stats
 * Gets campaign statistics (user-based filtering)
 * - RBAC: Requires campaigns_read permission
 * - Frontend compatibility endpoint
 */
router.get('/stats',
  (req, res, next) => next(),
  listLimiter,
  (req,res,next)=>next(), // 🔒 RBAC: campaigns_read required
  getCampaignStats
);

/**
 * GET /api/campaigns/by-brand/:brandId
 * Gets campaigns filtered by brand (user-based filtering)
 * - RBAC: Requires campaigns_read permission
 * - Frontend compatibility endpoint
 */
router.get('/by-brand/:brandId', 
  listLimiter,
  (req,res,next)=>next(), // 🔒 RBAC: campaigns_read required
  getCampaignsByBrand
);

/**
 * GET /api/campaigns/:id
 * Gets single campaign with ownership validation
 * - RBAC: Requires campaigns_read permission
 */
router.get('/:id', 
  listLimiter,
  (req,res,next)=>next(), // 🔒 RBAC: campaigns_read required
  getCampaignById
);

/**
 * POST /api/campaigns
 * Creates campaign with automatic user ownership
 * - RBAC: Requires campaigns_create permission
 */
router.post('/', 
  createLimiter,
  createPermissionMiddleware.campaigns.create(), // 🔒 RBAC: campaigns_create required
  ensureOwnership, // Will add created_by
  createCampaign
);

/**
 * PUT /api/campaigns/:id
 * Updates campaign with ownership validation
 * - RBAC: Requires campaigns_update permission
 */
router.put('/:id', 
  updateLimiter,
  createPermissionMiddleware.campaigns.update(), // 🔒 RBAC: campaigns_update required
  validateOwnership('campaigns', 'created_by', 'id'), 
  updateCampaign
);

/**
 * DELETE /api/campaigns/:id
 * Deletes campaign with ownership validation
 * - RBAC: Requires campaigns_delete permission
 */
router.delete('/:id', 
  deleteLimiter,
  createPermissionMiddleware.campaigns.delete(), // 🔒 RBAC: campaigns_delete required
  validateOwnership('campaigns', 'created_by', 'id'), 
  deleteCampaign
);

/**
 * PATCH /api/campaigns/:id/toggle-status
 * Toggles campaign status with ownership validation
 * - RBAC: Requires campaigns_update permission
 */
router.patch('/:id/toggle-status', 
  updateLimiter,
  createPermissionMiddleware.campaigns.update(), // 🔒 RBAC: campaigns_update required
  validateOwnership('campaigns', 'created_by', 'id'), 
  toggleCampaignStatus
);

/**
 * PUT /api/campaigns/:id/toggle-status
 * Toggles campaign status with ownership validation (frontend compatibility)
 * - RBAC: Requires campaigns_update permission
 */
router.put('/:id/toggle-status', 
  updateLimiter,
  createPermissionMiddleware.campaigns.update(), // 🔒 RBAC: campaigns_update required
  validateOwnership('campaigns', 'created_by', 'id'), 
  toggleCampaignStatus
);

/**
 * PUT /api/campaigns/:id/toggle-enabled
 * Toggles campaign enabled/disabled status with ownership validation
 * - RBAC: Requires campaigns_update permission
 * - Alias for toggle-status but matches frontend expectations
 */
router.put('/:id/toggle-enabled', 
  updateLimiter,
  createPermissionMiddleware.campaigns.update(), // 🔒 RBAC: campaigns_update required
  validateOwnership('campaigns', 'created_by', 'id'), 
  toggleCampaignStatus // Uses same controller method
);

/**
 * PUT /api/campaigns/:id/activate
 * Activates a campaign (sets is_enabled = true) with ownership validation
 * - RBAC: Requires campaigns_update permission
 * - Frontend compatibility endpoint
 */
router.put('/:id/activate', 
  updateLimiter,
  createPermissionMiddleware.campaigns.update(), // 🔒 RBAC: campaigns_update required
  validateOwnership('campaigns', 'created_by', 'id'),
  async (req, res, next) => {
    try {
      // Override the request body to force activation (is_enabled = true)
      req.body = { is_enabled: true };
      req.forceStatus = true; // Signal that we want to force a specific status
      return updateCampaign(req, res);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/campaigns/:id/deactivate
 * Deactivates a campaign (sets is_enabled = false) with ownership validation
 * - RBAC: Requires campaigns_update permission
 * - Frontend compatibility endpoint
 */
router.put('/:id/deactivate', 
  updateLimiter,
  createPermissionMiddleware.campaigns.update(), // 🔒 RBAC: campaigns_update required
  validateOwnership('campaigns', 'created_by', 'id'),
  async (req, res, next) => {
    try {
      // Override the request body to force deactivation (is_enabled = false)
      req.body = { is_enabled: false };
      req.forceStatus = false; // Signal that we want to force a specific status
      return updateCampaign(req, res);
    } catch (error) {
      next(error);
    }
  }
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
      'GET /campaigns': 'Get all campaigns (filtered by user)',
      'POST /campaigns': 'Create new campaign (auto-assigned to user)',
      'GET /campaigns/stats': 'Get campaign statistics (filtered by user)',
      'GET /campaigns/by-brand/:brandId': 'Get campaigns by brand (filtered by user)',
      'GET /campaigns/:id': 'Get campaign by ID (ownership validated)',
      'PUT /campaigns/:id': 'Update campaign (ownership validated)',
      'DELETE /campaigns/:id': 'Delete campaign (ownership validated)',
      'PATCH /campaigns/:id/toggle-status': 'Toggle campaign status (ownership validated)',
      'PUT /campaigns/:id/toggle-status': 'Toggle campaign status (ownership validated)',
      'PUT /campaigns/:id/toggle-enabled': 'Toggle campaign enabled/disabled status (ownership validated)',
      'PUT /campaigns/:id/activate': 'Activate campaign (ownership validated)',
      'PUT /campaigns/:id/deactivate': 'Deactivate campaign (ownership validated)'
    }
  });
});

// Error handler
router.use((error, req, res, next) => {
  const ts = new Date().toISOString();
  const userInfo = req.user ? `User: ${req.user.username} (ID: ${req.user.id})` : 'Unknown user';
  
  console.error(`[${ts}] Campaigns routes error for ${userInfo}:`, {
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
      : 'Internal server error in campaigns management',
    timestamp: ts,
    ...(isDevelopment && { 
      error: error.message, 
      stack: error.stack 
    })
  });
});

module.exports = router;
