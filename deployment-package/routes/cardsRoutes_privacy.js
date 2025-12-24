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

// Controller (we'll create privacy-enabled version)
const {
  createCard,
  getAllCards,
  getActiveCards,
  getCardById,
  updateCard,
  deleteCard,
  addBalance
} = require('../controllers/cardsController_privacy');

// =============================================================================
// MIDDLEWARE
// =============================================================================

// Request logging with user context
const requestLogger = (req, res, next) => {
  const ts = new Date().toISOString();
  const userInfo = req.user ? `User: ${req.user.username} (ID: ${req.user.id})` : 'Unauthenticated';
  console.log(`[${ts}] ${req.method} ${req.originalUrl} - Cards API - ${userInfo}`);
  
  // Sanitize body logging for security (don't log card details)
  if (req.body && Object.keys(req.body).length > 0) {
    const sanitizedBody = { ...req.body };
    // Remove sensitive card information from logs
    if (sanitizedBody.card_number) sanitizedBody.card_number = '****';
    if (sanitizedBody.cvv) sanitizedBody.cvv = '***';
    if (sanitizedBody.pin) sanitizedBody.pin = '****';
    console.log('Request Body (sanitized):', JSON.stringify(sanitizedBody, null, 2));
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
const createLimiter = createRateLimit(15 * 60 * 1000, 10);
const listLimiter = createRateLimit(5 * 60 * 1000, 50);
const getOneLimiter = createRateLimit(5 * 60 * 1000, 100);
const updateLimiter = createRateLimit(15 * 60 * 1000, 20);
const deleteLimiter = createRateLimit(60 * 60 * 1000, 5);
const addBalanceLimiter = createRateLimit(15 * 60 * 1000, 30);

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
 * GET /api/cards
 * Lists cards with user-based filtering
 * - Admins see all cards
 * - Regular users see only their own cards
 * - RBAC: Requires cards_read permission
 */
router.get('/', 
  listLimiter,
  createPermissionMiddleware.cards.read(), // 🔒 RBAC: cards_read required
  getAllCards
);

/**
 * GET /api/cards/active
 * Lists only active cards for assignment dropdowns
 * - Admins see all active cards
 * - Regular users see only their own active cards
 * - Cards with zero balance are now included (no balance restrictions)
 * - RBAC: Requires cards_read permission
 */
router.get('/active', 
  listLimiter,
  createPermissionMiddleware.cards.read(), // 🔒 RBAC: cards_read required
  getActiveCards
);

// Get cards by account ID
router.get('/by-account/:accountId',
  getOneLimiter,
  createPermissionMiddleware.cards.read(),
  require('../controllers/cardsController_privacy').getCardsByAccount
);

/**
 * GET /api/cards/:id
 * Gets single card with ownership validation
 * - RBAC: Requires cards_read permission
 */
router.get('/:id', 
  getOneLimiter,
  createPermissionMiddleware.cards.read(), // 🔒 RBAC: cards_read required
  getCardById
);

/**
 * POST /api/cards
 * Creates card with automatic user ownership
 * Note: Cards table doesn't have created_by column yet, needs to be added
 * - RBAC: Requires cards_create permission
 */
router.post('/', 
  createLimiter,
  createPermissionMiddleware.cards.create(), // 🔒 RBAC: cards_create required
  ensureOwnership, // Will add created_by if column exists
  createCard
);

/**
 * PUT /api/cards/:id
 * Updates card with ownership validation
 * - RBAC: Requires cards_update permission
 */
router.put('/:id', 
  updateLimiter,
  createPermissionMiddleware.cards.update(), // 🔒 RBAC: cards_update required
  validateOwnership('cards', 'created_by', 'id'), 
  updateCard
);

/**
 * POST /api/cards/:id/add-balance
 * Adds balance to card with ownership validation
 * - RBAC: Requires cards_create permission (balance addition treated as creation action)
 */
router.post('/:id/add-balance', 
  addBalanceLimiter,
  createPermissionMiddleware.cards.create(), // 🔒 RBAC: cards_create required (balance addition)
  validateOwnership('cards', 'created_by', 'id'), 
  addBalance
);

/**
 * DELETE /api/cards/:id
 * Deletes card with ownership validation
 * - RBAC: Requires cards_delete permission
 */
router.delete('/:id', 
  deleteLimiter,
  createPermissionMiddleware.cards.delete(), // 🔒 RBAC: cards_delete required
  validateOwnership('cards', 'created_by', 'id'), 
  deleteCard
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
      'GET /cards': 'Get all cards (filtered by user)',
      'GET /cards/active': 'Get only active cards for assignment dropdowns (filtered by user)',
      'POST /cards': 'Create new card (auto-assigned to user)',
      'GET /cards/:id': 'Get card by ID (ownership validated)',
      'PUT /cards/:id': 'Update card (ownership validated)',
      'POST /cards/:id/add-balance': 'Add balance to card (ownership validated)',
      'DELETE /cards/:id': 'Delete card (ownership validated)'
    }
  });
});

// Error handler
router.use((error, req, res, next) => {
  const ts = new Date().toISOString();
  const userInfo = req.user ? `User: ${req.user.username} (ID: ${req.user.id})` : 'Unknown user';
  
  console.error(`[${ts}] Cards routes error for ${userInfo}:`, {
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
      : 'Internal server error in cards management',
    timestamp: ts,
    ...(isDevelopment && { 
      error: error.message, 
      stack: error.stack 
    })
  });
});

module.exports = router;
