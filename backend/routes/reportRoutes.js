const express = require('express');
const router = express.Router();

const {
  buildDaily,           // POST /build?date=YYYY-MM-DD
  buildRange,           // POST /build-range?from=YYYY-MM-DD&to=YYYY-MM-DD
  getAll,               // GET /
  getById,              // GET /:id
  createReport,         // POST /
  updateReport,         // PUT /:id
  deleteReport,         // DELETE /:id
  rebuildCampaignRange, // POST /rebuild-campaign?campaign_id=..&from=..&to=..
  generateReport,       // GET /generate
  getFilterOptions,     // GET /filters
  getDashboardStats,    // GET /dashboard
  getChartData          // GET /charts
} = require('../controllers/reportController');

// const { authenticate, authorize } = require('../middleware/auth');

// ----------------------------------------------------------------------------
// Middleware
// ----------------------------------------------------------------------------

// Request logger (sanitized)
const requestLogger = (req, res, next) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${req.method} ${req.originalUrl} - Reports API`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  next();
};

router.use(requestLogger);

// Simple in-memory rate limiter with cleanup (single instances)
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
    // If behind proxies, set app.set('trust proxy', 1) so req.ip is accurate
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

// Reusable limiters
const readLimiter = createRateLimit(5 * 60 * 1000, 200);       // GETs
const buildLimiter = createRateLimit(15 * 60 * 1000, 30);      // builds
const campaignBuildLimiter = createRateLimit(15 * 60 * 1000, 30);

// ----------------------------------------------------------------------------
// Public routes (enable auth when ready)
// ----------------------------------------------------------------------------
// router.use(authenticate);

// Build daily reports for a specific date
router.post('/build', buildLimiter, buildDaily);

// Build reports for a range of dates (inclusive)
router.post('/build-range', buildLimiter, buildRange);

// Rebuild reports for a specific campaign over a date range
router.post('/rebuild-campaign', campaignBuildLimiter, rebuildCampaignRange);

// IMPORTANT: Specific routes MUST come before parameterized routes
// Otherwise /dashboard will be matched by /:id

// Generate comprehensive report with filters
router.get('/generate', readLimiter, generateReport);

// Get available filter options
router.get('/filters', readLimiter, getFilterOptions);

// Get dashboard statistics
router.get('/dashboard', readLimiter, getDashboardStats);

// Get chart-ready datasets
router.get('/charts', readLimiter, getChartData);

// List reports (filters + pagination)
router.get('/', readLimiter, getAll);

// Create a new report (manual entry)
router.post('/', buildLimiter, createReport);

// Get a single report row by id (MUST be last among GET routes)
router.get('/:id', readLimiter, getById);

// Update an existing report by id
router.put('/:id', buildLimiter, updateReport);

// Delete a report by id
router.delete('/:id', buildLimiter, deleteReport);

// ----------------------------------------------------------------------------
// 404 and error handling (keep at bottom)
// ----------------------------------------------------------------------------

router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableRoutes: {
      'POST /api/reports/build?date=YYYY-MM-DD': 'Build reports for a single date',
      'POST /api/reports/build-range?from=YYYY-MM-DD&to=YYYY-MM-DD': 'Build reports for a date range',
      'POST /api/reports/rebuild-campaign?campaign_id=..&from=YYYY-MM-DD&to=YYYY-MM-DD': 'Rebuild reports for one campaign over a range',
      'GET /api/reports/generate?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD&brand=X': 'Generate comprehensive report with filters',
      'GET /api/reports/filters': 'Get available filter options (brands, campaigns, date ranges)',
'GET /api/reports/dashboard': 'Get dashboard statistics and overview',
      'GET /api/reports/charts?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD': 'Get normalized datasets for charts',
      'GET /api/reports': 'List reports (filters: campaign_id, date_from, date_to, month, search; pagination: page, limit)',
      'POST /api/reports': 'Create a new report (manual entry)',
      'GET /api/reports/:id': 'Get a single report row by id',
      'PUT /api/reports/:id': 'Update an existing report by id',
      'DELETE /api/reports/:id': 'Delete a report by id'
    }
  });
});

// Final error handler
router.use((err, req, res, next) => {
  const ts = new Date().toISOString();
  console.error(`[${ts}] Reports routes error:`, err);
  res.status(500).json({
    success: false,
    message: 'Internal server error in reports management',
    timestamp: ts,
    ...(process.env.NODE_ENV === 'development' && {
      error: err.message,
      stack: err.stack
    })
  });
});

module.exports = router;
