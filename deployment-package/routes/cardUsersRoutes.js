const express = require('express');
const router = express.Router();

const {
  createCardUser,
  getAllCardUsers,
  getCardUserById,
  updateCardUser,
  deleteCardUser,
  getCardsByUser,
  getUsersByCard
} = require('../controllers/cardUsersController');

const { authenticateToken } = require('../middleware/authMiddleware');
const { attachUserPermissions, modulePermissions } = require('../middleware/rbacMiddleware');
const { checkCardAssignmentOwnership } = require('../middleware/cardOwnership');

// Request logging
const requestLogger = (req, res, next) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${req.method} ${req.originalUrl}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
  }
  next();
};

router.use(requestLogger);

// Apply authentication and permission middleware to all routes
router.use(authenticateToken);
router.use(attachUserPermissions);

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
    // To get real client IPs behind proxies, set app.set('trust proxy', 1) in app.js
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
const createLimiter = createRateLimit(15 * 60 * 1000, 20);
const listLimiter = createRateLimit(5 * 60 * 1000, 100);
const getOneLimiter = createRateLimit(5 * 60 * 1000, 150);
const updateLimiter = createRateLimit(15 * 60 * 1000, 30);
const deleteLimiter = createRateLimit(60 * 60 * 1000, 10);
const helperLimiter = createRateLimit(5 * 60 * 1000, 200);

// =============================================================================
// PROTECTED ROUTES WITH RBAC AND OWNERSHIP CHECKS
// =============================================================================

// Only superadmin or card owner can create new card-user assignments
router.post('/', createLimiter, modulePermissions.cards.update, checkCardAssignmentOwnership, createCardUser);
router.get('/', listLimiter, modulePermissions.cards.read, getAllCardUsers);
router.get('/:id', getOneLimiter, modulePermissions.cards.read, getCardUserById);
// Only superadmin or card owner can modify card assignments
router.put('/:id', updateLimiter, modulePermissions.cards.update, checkCardAssignmentOwnership, updateCardUser);
router.delete('/:id', deleteLimiter, modulePermissions.cards.delete, checkCardAssignmentOwnership, deleteCardUser);

// =============================================================================
// HELPER ENDPOINTS
// =============================================================================

router.get('/user/:userId/cards', helperLimiter, getCardsByUser);
router.get('/card/:cardId/users', helperLimiter, getUsersByCard);

// =============================================================================
// ERROR HANDLING
// =============================================================================

// 404 for unmatched routes in this router
router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableRoutes: {
      'GET /card-users': 'Get all card user assignments (with pagination, search, and filters)',
      'POST /card-users': 'Create new card user assignment',
      'GET /card-users/:id': 'Get card user assignment by ID',
      'PUT /card-users/:id': 'Update card user assignment',
      'DELETE /card-users/:id': 'Delete card user assignment',
      'GET /card-users/user/:userId/cards': 'Get all cards assigned to a user',
      'GET /card-users/card/:cardId/users': 'Get all users assigned to a card'
    },
    queryParameters: {
      pagination: 'page, limit',
      search: 'search (searches card name and username)',
      filters: 'card_id, user_id, is_primary'
    }
  });
});

// Final error handler
router.use((error, req, res, next) => {
  const ts = new Date().toISOString();
  console.error(`[${ts}] Card Users routes error:`, error);

  res.status(500).json({
    success: false,
    message: 'Internal server error in card users management',
    timestamp: ts,
    ...(process.env.NODE_ENV === 'development' && {
      error: error.message,
      stack: error.stack
    })
  });
});

module.exports = router;
