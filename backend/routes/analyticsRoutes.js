const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Apply authentication to all routes
router.use(authenticateToken);

// ============================================================================
// ANALYTICS DASHBOARD ROUTES (Map to existing report functionality)
// ============================================================================

/**
 * GET /api/analytics/dashboard
 * Get dashboard overview statistics
 * Maps to reportController.getDashboardStats
 */
router.get('/dashboard', async (req, res) => {
  try {
    // Map to existing dashboard stats functionality
    await reportController.getDashboardStats(req, res);
  } catch (error) {
    console.error('Analytics dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard analytics',
      error: error.message
    });
  }
});

/**
 * GET /api/analytics/charts/campaign-performance
 * Get campaign performance data for charts
 * Query params: date_from, date_to, limit
 */
router.get('/charts/campaign-performance', async (req, res) => {
  try {
    // Use existing report stats with campaign grouping
    const { date_from, date_to, limit = 10 } = req.query;
    
    // Create modified request to get campaign stats
    const modifiedReq = {
      ...req,
      query: {
        ...req.query,
        date_from,
        date_to,
        group_by: 'campaign',
        limit: parseInt(limit)
      }
    };
    
    await reportController.getReportStats(modifiedReq, res);
  } catch (error) {
    console.error('Campaign performance analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve campaign performance analytics',
      error: error.message
    });
  }
});

/**
 * GET /api/analytics/charts/time-series
 * Get time series data for trends
 * Query params: date_from, date_to, group_by
 */
router.get('/charts/time-series', async (req, res) => {
  try {
    const { date_from, date_to, group_by = 'day' } = req.query;
    
    // Create modified request for time series
    const modifiedReq = {
      ...req,
      query: {
        ...req.query,
        date_from,
        date_to,
        group_by: group_by
      }
    };
    
    await reportController.getReportStats(modifiedReq, res);
  } catch (error) {
    console.error('Time series analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve time series analytics',
      error: error.message
    });
  }
});

/**
 * GET /api/analytics/charts/brand-analysis
 * Get brand analysis data for charts
 * Query params: date_from, date_to, limit
 */
router.get('/charts/brand-analysis', async (req, res) => {
  try {
    const { date_from, date_to, limit = 8 } = req.query;
    
    // Create modified request for brand stats
    const modifiedReq = {
      ...req,
      query: {
        ...req.query,
        date_from,
        date_to,
        group_by: 'brand',
        limit: parseInt(limit)
      }
    };
    
    await reportController.getReportStats(modifiedReq, res);
  } catch (error) {
    console.error('Brand analysis analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve brand analysis analytics',
      error: error.message
    });
  }
});

// ============================================================================
// ADDITIONAL ANALYTICS ROUTES
// ============================================================================

/**
 * GET /api/analytics/overview
 * Get analytics overview (alias for dashboard)
 */
router.get('/overview', async (req, res) => {
  try {
    await reportController.getDashboardStats(req, res);
  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve analytics overview',
      error: error.message
    });
  }
});

/**
 * GET /api/analytics/filters
 * Get available filter options for analytics
 * Maps to reportController.getFilterOptions
 */
router.get('/filters', async (req, res) => {
  try {
    await reportController.getFilterOptions(req, res);
  } catch (error) {
    console.error('Analytics filters error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve analytics filters',
      error: error.message
    });
  }
});

module.exports = router;