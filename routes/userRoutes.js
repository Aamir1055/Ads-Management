const express = require('express');
const router = express.Router();
const {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  toggleUserStatus,
  getRoles,
  enable2FA,
  disable2FA,
  getUserStats,
  checkUsernameAvailability
} = require('../controllers/userController');

// Utility: robust client IP considering proxies
const getClientIp = (req) => {
  // Prefer Express' computed IP (honors trust proxy)
  if (req.ip) return req.ip;
  // Parse X-Forwarded-For and take the left-most value
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.length) {
    const first = xff.split(',').trim();
    if (first) return first;
  } else if (Array.isArray(xff) && xff.length) {
    return xff;
  }
  // Fallback to socket address
  return req.socket?.remoteAddress || 'unknown';
}; // [17][6]

// Input validation middleware
const validateIdParam = (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user ID - must be a positive integer',
      timestamp: new Date().toISOString()
    });
  }
  req.params.id = id;
  next();
};

// Enhanced request logging middleware with better sanitization
const requestLogger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const clientIp = getClientIp(req);
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl} - IP: ${clientIp}`); // [11]
  if (req.body && Object.keys(req.body).length > 0) {
    const sanitizedBody = { ...req.body };
    const sensitiveFields = [
      'password',
      'confirm_password',
      'token',
      'hashed_password',
      'auth_token',
      'twofa_secret',
      'two_factor_secret',
      'two_factor_backup_codes'
    ];
    Object.keys(sanitizedBody).forEach(field => {
      if (sensitiveFields.includes(field)) sanitizedBody[field] = '[HIDDEN]';
    });
    console.log('Request Body:', JSON.stringify(sanitizedBody, null, 2)); // [11]
  }
  if (req.query && Object.keys(req.query).length > 0) {
    console.log('Query Parameters:', JSON.stringify(req.query, null, 2)); // [11]
  }
  next();
};

// Enhanced rate limiting with memory-safe registry and single cleanup interval
const RateLimitRegistry = (() => {
  const registries = new Map(); // key: windowMs|max, value: Map(clientId -> {count, resetTime})
  let cleanupTimer = null;

  const getKey = (windowMs, max) => `${windowMs}:${max}`;

  const ensureCleanup = () => {
    if (cleanupTimer) return;
    cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [, requests] of registries.entries()) {
        for (const [key, value] of requests.entries()) {
          if (now > value.resetTime) {
            requests.delete(key);
          }
        }
      }
    }, 5 * 60 * 1000);
    cleanupTimer.unref?.(); // do not keep process alive [13]
  };

  const getLimiter = (windowMs, max, message) => {
    ensureCleanup();
    const regKey = getKey(windowMs, max);
    if (!registries.has(regKey)) registries.set(regKey, new Map());
    const requests = registries.get(regKey);

    return (req, res, next) => {
      const clientId = getClientIp(req); // stable client id [17]
      const now = Date.now();

      const entry = requests.get(clientId);
      if (!entry) {
        requests.set(clientId, { count: 1, resetTime: now + windowMs });
        return next();
      }

      if (now > entry.resetTime) {
        entry.count = 1;
        entry.resetTime = now + windowMs;
        return next();
      }

      if (entry.count >= max) {
        return res.status(429).json({
          success: false,
          message,
          retryAfter: Math.ceil((entry.resetTime - now) / 1000),
          timestamp: new Date().toISOString()
        });
      }

      entry.count++;
      next();
    };
  };

  return { getLimiter };
})();

const createRateLimit = (
  windowMs = 15 * 60 * 1000,
  max = 100,
  message = 'Too many requests'
) => RateLimitRegistry.getLimiter(windowMs, max, message);

// Request body size validation middleware
const validateRequestSize = (req, res, next) => {
  const contentLength = req.get('content-length');
  if (contentLength && Number(contentLength) > 1024 * 1024) {
    return res.status(413).json({
      success: false,
      message: 'Request body too large',
      timestamp: new Date().toISOString()
    });
  }
  next();
};

// Apply global middleware
router.use(requestLogger);
router.use(validateRequestSize);

// =============================================================================
// PUBLIC ROUTES (No authentication required)
// =============================================================================

/**
 * @route   POST /users
 * @desc    Create a new user
 * @access  Public (will be protected later)
 * @body    { username, password, confirm_password, role_id, enable_2fa }
 */
router.post(
  '/',
  createRateLimit(15 * 60 * 1000, 5, 'Too many user creation attempts. Please try again later.'),
  createUser
);

/**
 * @route   GET /users/check/username/:username
 * @desc    Check if username is available
 * @access  Public
 */
router.get(
  '/check/username/:username',
  createRateLimit(5 * 60 * 1000, 50, 'Too many username availability checks'),
  checkUsernameAvailability
);

/**
 * @route   GET /users/roles
 * @desc    Get all available roles
 * @access  Protected
 */
router.get(
  '/roles',
  createRateLimit(5 * 60 * 1000, 50, 'Too many roles requests'),
  getRoles
);

/**
 * @route   GET /users/stats
 * @desc    Get user statistics
 * @access  Protected (Admin/Manager)
 */
router.get(
  '/stats',
  createRateLimit(5 * 60 * 1000, 20, 'Too many stats requests'),
  getUserStats
);

// =============================================================================
// PROTECTED ROUTES (Authentication required)
// =============================================================================
// router.use(authenticate); // Require valid JWT token

/**
 * @route   GET /users
 * @desc    Get all users
 * @access  Protected
 */
router.get(
  '/',
  createRateLimit(5 * 60 * 1000, 100, 'Too many requests to fetch users'),
  getAllUsers
);

/**
 * @route   POST /users/:id/enable-2fa
 * @desc    Enable 2FA for user
 * @access  Protected (Admin or self)
 */
router.post(
  '/:id/enable-2fa',
  validateIdParam,
  createRateLimit(60 * 60 * 1000, 5, 'Too many 2FA enable attempts'),
  enable2FA
);

/**
 * @route   POST /users/:id/disable-2fa
 * @desc    Disable 2FA for user
 * @access  Protected (Admin or self)
 */
router.post(
  '/:id/disable-2fa',
  validateIdParam,
  createRateLimit(60 * 60 * 1000, 5, 'Too many 2FA disable attempts'),
  disable2FA
);

/**
 * @route   PATCH /users/:id/toggle-status
 * @desc    Toggle user active status
 * @access  Protected (Admin only)
 */
router.patch(
  '/:id/toggle-status',
  validateIdParam,
  createRateLimit(15 * 60 * 1000, 20, 'Too many status toggle attempts'),
  toggleUserStatus
);

/**
 * @route   PUT /users/:id
 * @desc    Update user information
 * @access  Protected (Admin/Manager)
 */
router.put(
  '/:id',
  validateIdParam,
  createRateLimit(15 * 60 * 1000, 30, 'Too many user update attempts'),
  updateUser
);

/**
 * @route   GET /users/:id
 * @desc    Get specific user by ID
 * @access  Protected
 */
router.get(
  '/:id',
  validateIdParam,
  createRateLimit(5 * 60 * 1000, 200, 'Too many requests to fetch user details'),
  getUserById
);

/**
 * @route   DELETE /users/:id
 * @desc    Soft delete user (set is_active = false)
 * @access  Protected (Admin only)
 */
router.delete(
  '/:id',
  validateIdParam,
  createRateLimit(60 * 60 * 1000, 10, 'Too many user deletion attempts'),
  deleteUser
);

// =============================================================================
// ERROR HANDLING
// =============================================================================

// Handle invalid routes
router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableRoutes: {
      'POST /users': 'Create new user',
      'GET /users': 'Get all users (with pagination, search, filtering)',
      'GET /users/:id': 'Get user by ID',
      'PUT /users/:id': 'Update user',
      'DELETE /users/:id': 'Soft delete user',
      'PATCH /users/:id/toggle-status': 'Toggle user active status',
      'GET /users/check/username/:username': 'Check username availability',
      'GET /users/roles': 'Get all available roles',
      'GET /users/stats': 'Get user statistics',
      'POST /users/:id/enable-2fa': 'Enable 2FA for user',
      'POST /users/:id/disable-2fa': 'Disable 2FA for user'
    },
    timestamp: new Date().toISOString()
  });
});

// Enhanced global error handler
router.use((error, req, res, next) => {
  const timestamp = new Date().toISOString();
  const clientIp = getClientIp(req);
  console.error(`[${timestamp}] User routes error:`, {
    url: req.originalUrl,
    method: req.method,
    ip: clientIp,
    error: error.message,
    stack: error.stack
  }); // [11]

  if (error.name === 'ValidationError' || error.isJoi) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details || [error.message],
      timestamp
    });
  }
  if (error.code === 'ETIMEDOUT') {
    return res.status(408).json({
      success: false,
      message: 'Request timeout',
      timestamp
    });
  }
  res.status(500).json({
    success: false,
    message: 'Internal server error in user management',
    timestamp,
    ...(process.env.NODE_ENV === 'development' && {
      error: error.message,
      stack: error.stack
    })
  });
});

module.exports = router;
