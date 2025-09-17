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

// Controller
const {
  buildDaily,
  buildRange,
  getAll,
  getById,
  createReport,
  updateReport,
  deleteReport,
  rebuildCampaignRange,
  generateReport,
  getFilterOptions,
  getDashboardStats,
  getChartData
} = require('../controllers/reportController_privacy');

// =============================================================================
// MIDDLEWARE
// =============================================================================

// Request logging with user context
const requestLogger = (req, res, next) => {
  const ts = new Date().toISOString();
  const userInfo = req.user ? `User: ${req.user.username} (ID: ${req.user.id})` : 'Unauthenticated';
  console.log(`[${ts}] ${req.method} ${req.originalUrl} - Reports API - ${userInfo}`);
  
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
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
  // Only add listeners once per module, not per rate limiter instance
  if (typeof process !== 'undefined' && !process.reportRoutesCleanupRegistered) {
    process.reportRoutesCleanupRegistered = true;
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

// Rate limiter instances - more generous limits for development
const isDevelopment = process.env.NODE_ENV === 'development';

const listLimiter = createRateLimit(5 * 60 * 1000, isDevelopment ? 500 : 50);
const createLimiter = createRateLimit(15 * 60 * 1000, isDevelopment ? 200 : 20);
const updateLimiter = createRateLimit(15 * 60 * 1000, isDevelopment ? 300 : 30);
const deleteLimiter = createRateLimit(60 * 60 * 1000, isDevelopment ? 100 : 10);
const buildLimiter = createRateLimit(30 * 60 * 1000, isDevelopment ? 50 : 5); // Reports building is expensive
const generateLimiter = createRateLimit(isDevelopment ? 1 * 60 * 1000 : 10 * 60 * 1000, isDevelopment ? 100 : 10);

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
 * GET /api/reports/filters
 * Gets filter options with privacy filtering
 * - RBAC: Requires reports_read permission
 */
router.get('/filters', 
  listLimiter,
  createPermissionMiddleware.reports.read(), // 🔒 RBAC: reports_read required
  getFilterOptions
);

/**
 * GET /api/reports/generate
 * Generates comprehensive reports with privacy filtering
 * - RBAC: Requires reports_export permission
 */
router.get('/generate', 
  generateLimiter,
  createPermissionMiddleware.reports.export(), // 🔒 RBAC: reports_export required
  generateReport
);

/**
 * GET /api/reports/dashboard
 * Gets dashboard statistics with privacy filtering
 * - RBAC: Requires reports_read permission
 */
router.get('/dashboard', 
  listLimiter,
  createPermissionMiddleware.reports.read(), // 🔒 RBAC: reports_read required
  getDashboardStats
);

/**
 * GET /api/reports/charts
 * Gets chart data with privacy filtering
 * - RBAC: Requires reports_read permission
 */
router.get('/charts', 
  generateLimiter,
  createPermissionMiddleware.reports.read(), // 🔒 RBAC: reports_read required
  getChartData
);

/**
 * POST /api/reports/build
 * Builds daily reports with privacy filtering
 * Non-admins can only build reports from their campaign data
 * - RBAC: Requires reports_create permission
 */
router.post('/build', 
  buildLimiter,
  createPermissionMiddleware.reports.create(), // 🔒 RBAC: reports_create required
  buildDaily
);

/**
 * POST /api/reports/build-range
 * Builds reports for date range with privacy filtering
 * - RBAC: Requires reports_create permission
 */
router.post('/build-range', 
  buildLimiter,
  createPermissionMiddleware.reports.create(), // 🔒 RBAC: reports_create required
  buildRange
);

/**
 * POST /api/reports/rebuild-campaign
 * Rebuilds reports for specific campaign with ownership validation
 * - RBAC: Requires reports_create permission
 */
router.post('/rebuild-campaign', 
  buildLimiter,
  createPermissionMiddleware.reports.create(), // 🔒 RBAC: reports_create required
  rebuildCampaignRange
);

/**
 * GET /api/reports
 * Lists reports with user-based filtering
 * - Admins see all reports
 * - Regular users see only their own reports
 * - RBAC: Requires reports_read permission
 */
router.get('/', 
  listLimiter,
  createPermissionMiddleware.reports.read(), // 🔒 RBAC: reports_read required
  getAll
);

/**
 * POST /api/reports
 * Creates report with automatic user ownership
 * - RBAC: Requires reports_create permission
 */
router.post('/', 
  createLimiter,
  createPermissionMiddleware.reports.create(), // 🔒 RBAC: reports_create required
  ensureOwnership, // Will add created_by
  createReport
);

/**
 * GET /api/reports/:id
 * Gets single report with ownership validation
 * NOTE: This MUST come after all specific paths like /filters, /generate, etc.
 * - RBAC: Requires reports_read permission
 */
router.get('/:id', 
  listLimiter,
  createPermissionMiddleware.reports.read(), // 🔒 RBAC: reports_read required
  getById
);

/**
 * PUT /api/reports/:id
 * Updates report with ownership validation
 * - RBAC: Requires reports_update permission
 */
router.put('/:id', 
  updateLimiter,
  createPermissionMiddleware.reports.update(), // 🔒 RBAC: reports_update required
  validateOwnership('reports', 'created_by', 'id'), 
  updateReport
);

/**
 * DELETE /api/reports/:id
 * Deletes report with ownership validation
 * - RBAC: Requires reports_delete permission
 */
router.delete('/:id', 
  deleteLimiter,
  createPermissionMiddleware.reports.delete(), // 🔒 RBAC: reports_delete required
  validateOwnership('reports', 'created_by', 'id'), 
  deleteReport
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
      'GET /reports': 'Get all reports (filtered by user)',
      'POST /reports': 'Create new report (auto-assigned to user)',
      'GET /reports/:id': 'Get report by ID (ownership validated)',
      'PUT /reports/:id': 'Update report (ownership validated)',
      'DELETE /reports/:id': 'Delete report (ownership validated)',
      'POST /reports/build': 'Build daily reports (privacy filtered)',
      'POST /reports/build-range': 'Build reports for date range (privacy filtered)',
      'POST /reports/rebuild-campaign': 'Rebuild campaign reports (ownership validated)',
      'GET /reports/generate': 'Generate comprehensive reports (privacy filtered)'
    }
  });
});

// Error handler
router.use((error, req, res, next) => {
  const ts = new Date().toISOString();
  const userInfo = req.user ? `User: ${req.user.username} (ID: ${req.user.id})` : 'Unknown user';
  
  console.error(`[${ts}] Reports routes error for ${userInfo}:`, {
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
      : 'Internal server error in reports management',
    timestamp: ts,
    ...(isDevelopment && { 
      error: error.message, 
      stack: error.stack 
    })
  });
});

module.exports = router;
