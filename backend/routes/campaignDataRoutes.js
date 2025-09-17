const express = require('express');
const router = express.Router();

// Authentication middleware
const { authenticateToken } = require('../middleware/authMiddleware');
const { attachUserPermissions, modulePermissions } = require('../middleware/rbacMiddleware');

// Data privacy middleware
const { 
  dataPrivacyMiddleware, 
  campaignDataPrivacy, 
  ensureOwnership,
  validateOwnership 
} = require('../middleware/dataPrivacy');

// Controllers (privacy-enabled - now the main controller with all functions)
const {
  createCampaignData,
  getAllCampaignData,
  getCampaignDataById,
  updateCampaignData,
  deleteCampaignData,
  getCampaignsForDropdown,
  getCardsForDropdown
} = require('../controllers/campaignDataController');

// Validation
const {
  validators: {
    validateCreateCampaignData,
    validateUpdateCampaignData,
    validateIdParam,
    validateQueryParams
  }
} = require('../utils/campaignDataValidation');

// =============================================================================
// MIDDLEWARE
// =============================================================================

// Request logging with user context
const requestLogger = (req, res, next) => {
  const ts = new Date().toISOString();
  const userInfo = req.user ? `User: ${req.user.username} (ID: ${req.user.id})` : 'Unauthenticated';
  console.log(`[${ts}] ${req.method} ${req.originalUrl} - Campaign Data API - ${userInfo}`);
  next();
};
router.use(requestLogger);

// Basic in-memory rate limiter
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
const createLimiter = createRateLimit(15 * 60 * 1000, 30);
const updateLimiter = createRateLimit(15 * 60 * 1000, 50);
const deleteLimiter = createRateLimit(60 * 60 * 1000, 10);
const helperLimiter = createRateLimit(5 * 60 * 1000, 200);

// =============================================================================
// PUBLIC HELPER ROUTES (no authentication needed for dropdowns)
// =============================================================================

// Returns active campaigns for dropdowns (helper routes before auth)
router.get('/campaigns', helperLimiter, getCampaignsForDropdown);

// Returns active cards for dropdowns  
router.get('/cards', helperLimiter, getCardsForDropdown);

// =============================================================================
// AUTHENTICATION REQUIRED FOR ALL DATA OPERATIONS
// =============================================================================

// Apply authentication to all routes below this point
router.use(authenticateToken);

// Apply permission middleware
router.use(attachUserPermissions);

// Apply data privacy middleware
router.use(dataPrivacyMiddleware);
router.use(campaignDataPrivacy);

// =============================================================================
// DATA PRIVACY ENABLED ROUTES
// =============================================================================

/**
 * GET /api/campaign-data
 * Lists campaign data with user-based filtering
 * - Admins see all data
 * - Regular users see only their own data
 */
router.get('/', 
  listLimiter,
  modulePermissions.campaign_data.read,
  validateQueryParams, 
  getAllCampaignData
);

/**
 * GET /api/campaign-data/:id
 * Gets single campaign data with ownership validation
 */
router.get('/:id', 
  getOneLimiter,
  modulePermissions.campaign_data.read,
  validateIdParam, 
  getCampaignDataById
);

/**
 * POST /api/campaign-data
 * Creates campaign data with automatic user ownership
 * - Automatically sets created_by to current user
 */
router.post('/', 
  createLimiter,
  modulePermissions.campaign_data.create,
  ensureOwnership, // Automatically adds created_by
  validateCreateCampaignData, 
  createCampaignData
);

/**
 * PUT /api/campaign-data/:id
 * Updates campaign data with ownership validation
 * - Users can only update their own data
 * - Admins can update any data
 */
router.put('/:id', 
  updateLimiter,
  modulePermissions.campaign_data.update,
  validateIdParam, 
  validateUpdateCampaignData, 
  validateOwnership('campaign_data', 'created_by', 'id'), // Validates ownership before update
  updateCampaignData
);

/**
 * DELETE /api/campaign-data/:id
 * Deletes campaign data with ownership validation
 * - Users can only delete their own data
 * - Admins can delete any data
 */
router.delete('/:id', 
  deleteLimiter,
  modulePermissions.campaign_data.delete,
  validateIdParam, 
  validateOwnership('campaign_data', 'created_by', 'id'), // Validates ownership before delete
  deleteCampaignData
);

// =============================================================================
// DATA PRIVACY INFO ENDPOINT
// =============================================================================

/**
 * GET /api/campaign-data/privacy/info
 * Returns information about current user's data privacy context
 */
router.get('/privacy/info', (req, res) => {
  const userContext = {
    userId: req.user?.id,
    username: req.user?.username,
    isAdmin: req.userContext?.isAdmin || false,
    canSeeAllData: req.userContext?.isAdmin || false,
    dataFiltering: {
      enabled: !req.userContext?.isAdmin,
      filterBy: 'created_by',
      description: req.userContext?.isAdmin 
        ? 'Admin user - can see all campaign data'
        : 'Regular user - can only see own created data'
    }
  };

  res.json({
    success: true,
    message: 'Data privacy context retrieved',
    data: userContext
  });
});

// =============================================================================
// ERROR HANDLING
// =============================================================================

// 404 for unmatched routes
router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableRoutes: {
      'GET /campaign-data': 'Get all campaign data (filtered by user)',
      'POST /campaign-data': 'Create new campaign data entry (auto-assigned to user)',
      'GET /campaign-data/:id': 'Get campaign data by ID (ownership validated)',
      'PUT /campaign-data/:id': 'Update campaign data (ownership validated)',
      'DELETE /campaign-data/:id': 'Delete campaign data (ownership validated)',
      'GET /campaign-data/campaigns': 'Get campaigns for dropdown (public)',
      'GET /campaign-data/cards': 'Get cards for dropdown (public)',
      'GET /campaign-data/privacy/info': 'Get user privacy context'
    }
  });
});

// Final error handler
router.use((error, req, res, next) => {
  const ts = new Date().toISOString();
  const userInfo = req.user ? `User: ${req.user.username} (ID: ${req.user.id})` : 'Unknown user';
  
  console.error(`[${ts}] Campaign Data routes error for ${userInfo}:`, {
    error: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method
  });

  // Don't expose sensitive error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(error.statusCode || 500).json({
    success: false,
    message: isDevelopment 
      ? error.message 
      : 'Internal server error in campaign data management',
    timestamp: ts,
    ...(isDevelopment && { 
      error: error.message, 
      stack: error.stack 
    })
  });
});

module.exports = router;
