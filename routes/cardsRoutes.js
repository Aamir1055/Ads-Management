const express = require('express');
const router = express.Router();

const {
  createCard,
  getAllCards,
  getCardById,
  updateCard,
  deleteCard,
  addBalance,
  toggleCardStatus,
  setCardPriority,
  getMyCards
} = require('../controllers/cardsController');
const { getCardsByAccount } = require('../controllers/cardsByAccountController');

const { authenticateToken } = require('../middleware/authMiddleware');
const { attachUserPermissions, modulePermissions } = require('../middleware/rbacMiddleware');
const { checkCardOwnership } = require('../middleware/cardOwnership');

// Request logging (sanitized)
const requestLogger = (req, res, next) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${req.method} ${req.originalUrl}`);
  if (req.body && Object.keys(req.body).length > 0) {
    // Keep body logging minimal; ensure no secrets are in body
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
  }
  next();
};

router.use(requestLogger);

// Apply authentication and permission middleware to all routes
router.use(authenticateToken);
router.use(attachUserPermissions);

// Basic in-memory rate limiter with cleanup (single instances)
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
    // For accurate IPs behind proxies, set app.set('trust proxy', 1) in app.js
    const clientId = req.ip || req.socket?.remoteAddress || 'unknown';
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
const createLimiter = createRateLimit(15 * 60 * 1000, 10);
const listLimiter = createRateLimit(5 * 60 * 1000, 50);
const getOneLimiter = createRateLimit(5 * 60 * 1000, 100);
const updateLimiter = createRateLimit(15 * 60 * 1000, 20);
const deleteLimiter = createRateLimit(60 * 60 * 1000, 5);
const addBalanceLimiter = createRateLimit(15 * 60 * 1000, 30);

// =============================================================================
// PROTECTED ROUTES WITH RBAC
// =============================================================================

router.post('/', createLimiter, modulePermissions.cards.create, createCard);
router.get('/', listLimiter, modulePermissions.cards.read, getAllCards);
router.get('/my-cards', listLimiter, modulePermissions.cards.read, getMyCards);
router.get('/:id', getOneLimiter, modulePermissions.cards.read, getCardById);
router.put('/:id', updateLimiter, modulePermissions.cards.update, checkCardOwnership, updateCard);
router.post('/:id/add-balance', addBalanceLimiter, modulePermissions.cards.update, checkCardOwnership, addBalance);
router.patch('/:id/toggle-status', updateLimiter, modulePermissions.cards.update, checkCardOwnership, toggleCardStatus);
router.patch('/:id/set-priority', updateLimiter, modulePermissions.cards.update, checkCardOwnership, setCardPriority);
router.delete('/:id', deleteLimiter, modulePermissions.cards.delete, checkCardOwnership, deleteCard);

// Get cards by account ID
router.get('/by-account/:accountId', getOneLimiter, modulePermissions.cards.read, getCardsByAccount);

// =============================================================================
// ERROR HANDLING
// =============================================================================

// 404 for unmatched routes in this router
router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableRoutes: {
      'GET /cards': 'Get all cards (with pagination and search)',
      'POST /cards': 'Create new card',
      'GET /cards/:id': 'Get card by ID',
      'PUT /cards/:id': 'Update card',
      'POST /cards/:id/add-balance': 'Add balance to card',
      'DELETE /cards/:id': 'Delete card (soft delete)'
    }
  });
});

// Final error handler
router.use((error, req, res, next) => {
  const ts = new Date().toISOString();
  console.error(`[${ts}] Cards routes error:`, error);

  res.status(500).json({
    success: false,
    message: 'Internal server error in cards management',
    timestamp: ts,
    ...(process.env.NODE_ENV === 'development' && {
      error: error.message,
      stack: error.stack
    })
  });
});

module.exports = router;
