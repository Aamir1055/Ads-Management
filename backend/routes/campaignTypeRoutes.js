const express = require('express');
const router = express.Router();

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
// PUBLIC ROUTES
// =============================================================================

// List campaign types
router.get('/', listLimiter, validateQueryParams, getAllCampaignTypes);

// Get one campaign type
router.get('/:id', getOneLimiter, validateIdParam, getCampaignTypeById);

// =============================================================================
// PROTECTED ROUTES (Uncomment auth/authorize when ready)
// =============================================================================
// router.use(authenticate);

// Create
router.post('/', createLimiter, validateCreateCampaignType, /* authorize(['admin','manager']), */ createCampaignType);

// Update
router.put('/:id', updateLimiter, validateIdParam, /* validateUpdateCampaignType, */ /* authorize(['admin','manager']), */ updateCampaignType);

// Delete (soft)
router.delete('/:id', deleteLimiter, validateIdParam, /* authorize(['admin']), */ deleteCampaignType);

// =============================================================================
// ERROR HANDLING (order matters)
// =============================================================================

// 404 for unmatched routes within this router
router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableRoutes: {
      'GET /api/campaign-types': 'Get all campaign types (with pagination and search)',
      'POST /api/campaign-types': 'Create new campaign type',
      'GET /api/campaign-types/:id': 'Get campaign type by ID',
      'PUT /api/campaign-types/:id': 'Update campaign type',
      'DELETE /api/campaign-types/:id': 'Delete campaign type (soft delete)'
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
