const express = require('express');
const router = express.Router();

const {
  getDashboardOverview,
  getTimeSeriesData,
  getCampaignPerformanceData,
  getBrandAnalysisData,
  getTrendsAndInsights,
  exportAnalyticsData
} = require('../controllers/reportAnalyticsController');

const { authenticateToken } = require('../middleware/authMiddleware');

// ----------------------------------------------------------------------------
// Middleware
// ----------------------------------------------------------------------------

// Request logger for analytics
const analyticsLogger = (req, res, next) => {
  const ts = new Date().toISOString();
  const userInfo = req.user ? `User: ${req.user.username}` : 'Unauthenticated';
  console.log(`[${ts}] ${req.method} ${req.originalUrl} - Report Analytics API (${userInfo})`);
  if (req.query && Object.keys(req.query).length > 0) {
    console.log('Query Params:', JSON.stringify(req.query, null, 2));
  }
  next();
};

// Rate limiting for analytics endpoints
const createRateLimit = (windowMs = 5 * 60 * 1000, max = 100) => {
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
        message: 'Too many analytics requests. Please try again later.',
        retryAfter: retryAfterSec
      });
    }

    entry.count += 1;
    next();
  };
};

// Different rate limits for different types of requests
const dashboardLimiter = createRateLimit(1 * 60 * 1000, 30);      // 30 requests per minute for dashboard
const chartLimiter = createRateLimit(2 * 60 * 1000, 60);         // 60 requests per 2 minutes for charts
const exportLimiter = createRateLimit(10 * 60 * 1000, 10);       // 10 exports per 10 minutes
const insightsLimiter = createRateLimit(5 * 60 * 1000, 20);      // 20 insights requests per 5 minutes

// Enhanced user context middleware for analytics
const enhanceUserContext = async (req, res, next) => {
  if (req.user) {
    try {
      // Get user role information for better access control
      const { pool } = require('../config/database');
      const [userRows] = await pool.query(`
        SELECT u.id, u.username, r.name as role_name, r.level as role_level
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.id = ? AND u.is_active = 1
      `, [req.user.id]);

      if (userRows.length > 0) {
        const userInfo = userRows[0];
        req.user.role_name = userInfo.role_name;
        req.user.role_level = userInfo.role_level;
        
        // Add analytics-specific context
        req.analytics = {
          canViewAllData: userInfo.role_level >= 10, // Super admin can see all data
          userId: userInfo.id,
          userRole: userInfo.role_name,
          roleLevel: userInfo.role_level
        };
      }
    } catch (error) {
      console.error('[Analytics] Error enhancing user context:', error);
      // Continue with basic user info if database query fails
      req.analytics = {
        canViewAllData: false,
        userId: req.user.id,
        userRole: 'unknown',
        roleLevel: 1
      };
    }
  }
  next();
};

// Apply middleware to all routes
router.use(analyticsLogger);
router.use(authenticateToken); // Require authentication for all analytics routes
router.use(enhanceUserContext);

// ----------------------------------------------------------------------------
// Analytics Routes
// ----------------------------------------------------------------------------

// Dashboard Overview
// GET /api/analytics/dashboard
router.get('/dashboard', dashboardLimiter, getDashboardOverview);

// Chart Data Endpoints
// GET /api/analytics/charts/time-series
router.get('/charts/time-series', chartLimiter, getTimeSeriesData);

// GET /api/analytics/charts/campaign-performance
router.get('/charts/campaign-performance', chartLimiter, getCampaignPerformanceData);

// GET /api/analytics/charts/brand-analysis
router.get('/charts/brand-analysis', chartLimiter, getBrandAnalysisData);

// Insights and Trends
// GET /api/analytics/insights/trends
router.get('/insights/trends', insightsLimiter, getTrendsAndInsights);

// Data Export
// GET /api/analytics/export
router.get('/export', exportLimiter, exportAnalyticsData);

// ----------------------------------------------------------------------------
// Debug endpoint
// ----------------------------------------------------------------------------
router.get('/debug', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Debug user information',
    timestamp: new Date().toISOString(),
    user: req.user ? {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role,
      permissions: req.user.permissions,
      fullUserObject: req.user
    } : null,
    analytics: req.analytics || null
  });
});

// Health check endpoint
// ----------------------------------------------------------------------------
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Report Analytics API is healthy',
    timestamp: new Date().toISOString(),
    user: req.user ? {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role?.name || req.user.role_name,
      canViewAllData: req.analytics?.canViewAllData || false
    } : null
  });
});

// ----------------------------------------------------------------------------
// 404 handler for analytics routes
// ----------------------------------------------------------------------------
router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Analytics route ${req.method} ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
    availableRoutes: {
      'GET /api/analytics/dashboard': 'Get dashboard overview with key metrics',
      'GET /api/analytics/charts/time-series': 'Get time series data for charts (params: date_from, date_to, group_by)',
      'GET /api/analytics/charts/campaign-performance': 'Get campaign performance data (params: date_from, date_to, limit)',
      'GET /api/analytics/charts/brand-analysis': 'Get brand analysis data (params: date_from, date_to)',
      'GET /api/analytics/insights/trends': 'Get AI-like insights and trends (params: days)',
      'GET /api/analytics/export': 'Export analytics data (params: date_from, date_to, format, type)',
      'GET /api/analytics/health': 'Health check endpoint'
    },
    dataPrivacyNote: {
      regularUsers: 'Can only access their own report data',
      superAdmins: 'Can access all users\' report data',
      currentUserRole: req.user?.role_name || 'unknown',
      currentUserLevel: req.user?.role_level || 1
    }
  });
});

// ----------------------------------------------------------------------------
// Error handler for analytics routes
// ----------------------------------------------------------------------------
router.use((err, req, res, next) => {
  const ts = new Date().toISOString();
  console.error(`[${ts}] Analytics routes error:`, err);
  
  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error in analytics module',
    timestamp: ts,
    ...(isDevelopment && {
      error: err.message,
      stack: err.stack
    })
  });
});

module.exports = router;
