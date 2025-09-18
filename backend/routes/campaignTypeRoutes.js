const express = require('express');
const router = express.Router();

// Authentication and RBAC middleware
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireSuperAdmin, attachUserPermissions, checkModulePermission } = require('../middleware/rbacMiddleware');

// Controller
const {
  createCampaignType,
  getAllCampaignTypes,
  getCampaignTypeById,
  updateCampaignType,
  deleteCampaignType
} = require('../controllers/campaignTypeController');

// Validation middleware
const {
  validators: {
    validateCreateCampaignType,
    validateUpdateCampaignType,
    validateIdParam,
    validateQueryParams
  }
} = require('../utils/campaignTypeValidation');

// =============================================================================
// MIDDLEWARE
// =============================================================================

// Request logging (sanitized)
const requestLogger = (req, res, next) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${req.method} ${req.originalUrl} - Campaign Types API`);
  
  // Debug user authentication for POST requests
  if (req.method === 'POST') {
    console.log('📝 [Campaign Types POST] User auth debug:', {
      hasUser: !!req.user,
      userId: req.user?.id,
      username: req.user?.username,
      roleId: req.user?.role_id,
      roleName: req.user?.role?.name,
      authHeader: req.headers.authorization ? `${req.headers.authorization.substring(0, 20)}...` : 'No auth header'
    });
  }
  
  next();
};

router.use(requestLogger);

// In-memory rate limiter with cleanup (single instances per use)
const createRateLimit = (windowMs = 15 * 60 * 1000, max = 100) => {
  const requests = new Map();

  const cleanup = () => {
    const now = Date.now();
    for (const [key, val] of requests.entries()) {
      if (now > val.resetTime) requests.delete(key);
    }
  };

  // Periodic cleanup of expired entries
  const interval = setInterval(cleanup, Math.min(windowMs, 5 * 60 * 1000));
  interval.unref?.(); // allow process to exit if this is the only active timer

  const clearAll = () => clearInterval(interval);
  if (typeof process !== 'undefined') {
    process.on('exit', clearAll);
    process.on('SIGINT', () => { clearAll(); process.exit(0); });
    process.on('SIGTERM', () => { clearAll(); process.exit(0); });
  }

  return (req, res, next) => {
    // Note: ensure app.set('trust proxy', 1) (or appropriate) in app.js if behind a proxy
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

// Build single limiter instances to avoid multiple timers/maps per route
const listLimiter = createRateLimit(5 * 60 * 1000, 100);
const getOneLimiter = createRateLimit(5 * 60 * 1000, 200);
const createLimiter = createRateLimit(15 * 60 * 1000, 10);
const updateLimiter = createRateLimit(15 * 60 * 1000, 20);
const deleteLimiter = createRateLimit(60 * 60 * 1000, 5);

// =============================================================================
// MASTER DATA ROUTES (Campaign Types are master data - no data privacy filtering)
// =============================================================================

// Apply authentication to all routes
router.use(authenticateToken);
router.use(attachUserPermissions);

// List campaign types (Requires campaign_types view permission, but shows ALL campaign types)
// Campaign types are master data - users with view permission can see all of them
router.get('/', 
  listLimiter, 
  checkModulePermission('campaign_types', 'read'), 
  validateQueryParams, 
  getAllCampaignTypes
);

// Get one campaign type (Requires campaign_types view permission, but shows ALL campaign types)
router.get('/:id', 
  getOneLimiter, 
  checkModulePermission('campaign_types', 'read'), 
  validateIdParam, 
  getCampaignTypeById
);


// =============================================================================
// SUPERADMIN ONLY ROUTES (Master Data Management)
// =============================================================================

// Create campaign type (SuperAdmin only)
router.post('/', createLimiter, requireSuperAdmin, validateCreateCampaignType, createCampaignType);

// Update campaign type (SuperAdmin only)
router.put('/:id', updateLimiter, requireSuperAdmin, validateIdParam, validateUpdateCampaignType, updateCampaignType);

// Delete campaign type (SuperAdmin only)
router.delete('/:id', deleteLimiter, requireSuperAdmin, validateIdParam, deleteCampaignType);

// =============================================================================
// ERROR HANDLING (order matters)
// =============================================================================

// 404 for unmatched routes within this router
router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableRoutes: {
      'GET /api/campaign-types': 'Get all campaign types (requires campaign_types read permission)',
      'GET /api/campaign-types/:id': 'Get campaign type by ID (requires campaign_types read permission)',
      'POST /api/campaign-types': 'Create new campaign type (SuperAdmin only)',
      'PUT /api/campaign-types/:id': 'Update campaign type (SuperAdmin only)',
      'DELETE /api/campaign-types/:id': 'Delete campaign type (SuperAdmin only)'
    }
  });
});

// Error handler must be last
// eslint-disable-next-line no-unused-vars
router.use((error, req, res, next) => {
  const ts = new Date().toISOString();
  console.error(`[${ts}] Campaign Types routes error:`, error);

  res.status(500).json({
    success: false,
    message: 'Internal server error in campaign types management',
    timestamp: ts,
    ...(process.env.NODE_ENV === 'development' && {
      error: error.message,
      stack: error.stack
    })
  });
});

module.exports = router;
