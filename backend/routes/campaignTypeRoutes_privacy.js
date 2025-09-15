const express = require('express');
const router = express.Router();

// Authentication middleware
const { authenticateToken } = require('../middleware/authMiddleware');

// Data privacy middleware
const { 
  dataPrivacyMiddleware, 
  ensureOwnership,
  validateOwnership 
} = require('../middleware/dataPrivacy');

// Controller (we'll create privacy-enabled version)
const {
  createCampaignType,
  getAllCampaignTypes,
  getCampaignTypeById,
  updateCampaignType,
  deleteCampaignType
} = require('../controllers/campaignTypeController_privacy');

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

// Request logging with user context
const requestLogger = (req, res, next) => {
  const ts = new Date().toISOString();
  const userInfo = req.user ? `User: ${req.user.username} (ID: ${req.user.id})` : 'Unauthenticated';
  console.log(`[${ts}] ${req.method} ${req.originalUrl} - Campaign Types API - ${userInfo}`);
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
const listLimiter = createRateLimit(5 * 60 * 1000, 100);
const getOneLimiter = createRateLimit(5 * 60 * 1000, 200);
const createLimiter = createRateLimit(15 * 60 * 1000, 10);
const updateLimiter = createRateLimit(15 * 60 * 1000, 20);
const deleteLimiter = createRateLimit(60 * 60 * 1000, 5);

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
 * GET /api/campaign-types
 * Lists campaign types with user-based filtering
 * - Admins see all campaign types
 * - Regular users see only their own campaign types
 */
router.get('/', 
  listLimiter, 
  validateQueryParams, 
  getAllCampaignTypes
);

/**
 * GET /api/campaign-types/:id
 * Gets single campaign type with ownership validation
 */
router.get('/:id', 
  getOneLimiter, 
  validateIdParam, 
  getCampaignTypeById
);

/**
 * POST /api/campaign-types
 * Creates campaign type with automatic user ownership
 */
router.post('/', 
  createLimiter, 
  ensureOwnership, // Automatically adds created_by
  validateCreateCampaignType, 
  createCampaignType
);

/**
 * PUT /api/campaign-types/:id
 * Updates campaign type with ownership validation
 */
router.put('/:id', 
  updateLimiter, 
  validateIdParam, 
  validateUpdateCampaignType,
  validateOwnership('campaign_types', 'created_by', 'id'), 
  updateCampaignType
);

/**
 * DELETE /api/campaign-types/:id
 * Deletes campaign type with ownership validation
 */
router.delete('/:id', 
  deleteLimiter, 
  validateIdParam, 
  validateOwnership('campaign_types', 'created_by', 'id'), 
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
      'GET /campaign-types': 'Get all campaign types (filtered by user)',
      'POST /campaign-types': 'Create new campaign type (auto-assigned to user)',
      'GET /campaign-types/:id': 'Get campaign type by ID (ownership validated)',
      'PUT /campaign-types/:id': 'Update campaign type (ownership validated)',
      'DELETE /campaign-types/:id': 'Delete campaign type (ownership validated)'
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
