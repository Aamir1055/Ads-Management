const express = require('express');
const router = express.Router();

const modulesController = require('../controllers/modulesController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { attachUserPermissions, modulePermissions } = require('../middleware/rbacMiddleware');

// ----------------------------------------------------------------------------
// Middleware
// ----------------------------------------------------------------------------

const requestLogger = (req, res, next) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${req.method} ${req.originalUrl} - Modules API`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  next();
};

router.use(requestLogger);

// Apply authentication and permission middleware to all routes
router.use(authenticateToken);
router.use(attachUserPermissions);

// Simple in-memory rate limiter (single instances)
const createRateLimit = (windowMs = 15 * 60 * 1000, max = 200) => {
  const requests = new Map();
  const cleanup = () => {
    const now = Date.now();
    for (const [k, v] of requests.entries()) if (now > v.resetTime) requests.delete(k);
  };
  const interval = setInterval(cleanup, Math.min(windowMs, 5 * 60 * 1000));
  interval.unref?.();
  return (req, res, next) => {
    // If behind proxies, configure app.set('trust proxy', 1)
    const id = req.ip || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();
    let e = requests.get(id);
    if (!e || now > e.resetTime) { e = { count: 0, resetTime: now + windowMs }; requests.set(id, e); }
    if (e.count >= max) {
      const retry = Math.ceil((e.resetTime - now) / 1000);
      res.set('Retry-After', String(retry));
      return res.status(429).json({ success: false, message: 'Rate limit exceeded', retryAfter: retry });
    }
    e.count++; next();
  };
};

const rlRead = createRateLimit(5 * 60 * 1000, 300);
const rlWrite = createRateLimit(15 * 60 * 1000, 120);

// ----------------------------------------------------------------------------
// CRUD with RBAC permissions
// ----------------------------------------------------------------------------

// Create a module (requires create permission)
router.post('/', rlWrite, modulePermissions.modules.create, modulesController.create);

// List modules (requires read permission)
router.get('/', rlRead, modulePermissions.modules.read, modulesController.list);

// Get a module by id (requires read permission)
router.get('/:id', rlRead, modulePermissions.modules.read, modulesController.getById);

// Update a module by id (requires update permission)
router.put('/:id', rlWrite, modulePermissions.modules.update, modulesController.update);

// ----------------------------------------------------------------------------
// 404 and error handling (keep last)
// ----------------------------------------------------------------------------

router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableRoutes: {
      'POST /api/modules': 'Create module',
      'GET /api/modules': 'List modules (filters: search, active; pagination: page, limit)',
      'GET /api/modules/:id': 'Get module by id',
      'PUT /api/modules/:id': 'Update module'
    }
  });
});

router.use((err, req, res, next) => {
  const ts = new Date().toISOString();
  console.error(`[${ts}] Modules routes error:`, err);
  res.status(500).json({
    success: false,
    message: 'Internal server error in modules management',
    timestamp: ts,
    ...(process.env.NODE_ENV === 'development' && { error: err.message, stack: err.stack })
  });
});

module.exports = router;
