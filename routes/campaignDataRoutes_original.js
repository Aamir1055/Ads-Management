const express = require('express');
const router = express.Router();

// Controllers
const {
  createCampaignData,
  getAllCampaignData,
  getCampaignDataById,
  updateCampaignData,
  deleteCampaignData,
  getCampaignsForDropdown, // now returns campaign_types (master)
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

// Request logging
const requestLogger = (req, res, next) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${req.method} ${req.originalUrl} - Campaign Data API`);
  next();
};
router.use(requestLogger);

// Basic in-memory rate limiter with cleanup (single instances, not per-call)
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
    // If behind proxies, configure app.set('trust proxy', 1) so req.ip is accurate
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

// Reusable limiter instances
const listLimiter = createRateLimit(5 * 60 * 1000, 100);
const getOneLimiter = createRateLimit(5 * 60 * 1000, 200);
const createLimiter = createRateLimit(15 * 60 * 1000, 30);
const updateLimiter = createRateLimit(15 * 60 * 1000, 50);
const deleteLimiter = createRateLimit(60 * 60 * 1000, 10);
const helperLimiter = createRateLimit(5 * 60 * 1000, 200);

// =============================================================================
// HELPER ROUTES (placed before :id to avoid conflicts)
// =============================================================================

// Returns active campaign types (master) for dropdowns
router.get('/campaigns', helperLimiter, getCampaignsForDropdown);

// Returns active cards for dropdowns
router.get('/cards', helperLimiter, getCardsForDropdown);

// =============================================================================
// MAIN CRUD ROUTES
// =============================================================================

router.get('/', listLimiter, validateQueryParams, getAllCampaignData);
router.get('/:id', getOneLimiter, validateIdParam, getCampaignDataById);

// =============================================================================
// PROTECTED ROUTES (enable auth when ready)
// =============================================================================
// router.use(authenticate);

router.post('/', createLimiter, /* validateCreateCampaignData, */ /* authorize([...]) */ createCampaignData);
router.put('/:id', updateLimiter, validateIdParam, validateUpdateCampaignData, /* authorize([...]) */ updateCampaignData);
router.delete('/:id', deleteLimiter, validateIdParam, /* authorize([...]) */ deleteCampaignData);

// =============================================================================
// ERROR HANDLING
// =============================================================================

// 404 for unmatched routes in this router
router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableRoutes: {
      'GET /campaign-data': 'Get all campaign data (with pagination and filtering)',
      'POST /campaign-data': 'Create new campaign data entry',
      'GET /campaign-data/:id': 'Get campaign data by ID',
      'PUT /campaign-data/:id': 'Update campaign data',
      'DELETE /campaign-data/:id': 'Delete campaign data',
      'GET /campaign-data/campaigns': 'Get campaign types for dropdown',
      'GET /campaign-data/cards': 'Get cards for dropdown'
    }
  });
});

// Final error handler (keep last)
router.use((error, req, res, next) => {
  const ts = new Date().toISOString();
  console.error(`[${ts}] Campaign Data routes error:`, error);
  res.status(500).json({
    success: false,
    message: 'Internal server error in campaign data management',
    timestamp: ts,
    ...(process.env.NODE_ENV === 'development' && { error: error.message, stack: error.stack })
  });
});

module.exports = router;
