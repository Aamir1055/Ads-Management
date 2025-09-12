const express = require('express');
const router = express.Router();

const modulesController = require('../controllers/modulesController');
// const { authenticate } = require('../middleware/auth');
// const { enforcePermission } = require('../middleware/enforcePermission'); // optional guard

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

// router.use(authenticate);
// Optionally enforce RBAC against a registered "Modules" resource
// router.use(enforcePermission('Modules'));

// ----------------------------------------------------------------------------
// CRUD
// ----------------------------------------------------------------------------

// Create a module
router.post('/', rlWrite, modulesController.create);

// List modules (search, pagination, active filter)
// Query: page, limit, search, active=true|false
router.get('/', rlRead, modulesController.list);

// Get a module by id
router.get('/:id', rlRead, modulesController.getById);

// Update a module by id
router.put('/:id', rlWrite, modulesController.update);

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
