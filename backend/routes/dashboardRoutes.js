const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const dashboardService = require('../services/dashboardService');

/**
 * GET /api/dashboard/overview
 * Get comprehensive dashboard overview statistics
 */
router.get('/overview', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const userRole = req.user.role_name || req.user.role?.name || 'user';

    const overviewData = await dashboardService.getOverviewStats(userId, userRole);

    res.json({
      success: true,
      message: 'Dashboard overview retrieved successfully',
      timestamp: new Date().toISOString(),
      data: overviewData,
      user: {
        id: userId,
        role: userRole,
        permissions: req.user.permissions || []
      }
    });

  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard overview',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/dashboard/trends
 * Get performance trends data for charts
 * Query params: days (default: 30)
 */
router.get('/trends', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const userRole = req.user.role_name || req.user.role?.name || 'user';
    const days = parseInt(req.query.days) || 30;

    // Validate days parameter
    if (days < 1 || days > 365) {
      return res.status(400).json({
        success: false,
        message: 'Days parameter must be between 1 and 365',
        timestamp: new Date().toISOString()
      });
    }

    const trendsData = await dashboardService.getPerformanceTrends(userId, userRole, days);

    res.json({
      success: true,
      message: `Retrieved ${days}-day performance trends`,
      timestamp: new Date().toISOString(),
      data: trendsData,
      params: {
        days: days,
        user_role: userRole
      }
    });

  } catch (error) {
    console.error('Dashboard trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance trends',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/dashboard/campaigns
 * Get top performing campaigns
 * Query params: limit (default: 10)
 */
router.get('/campaigns', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const userRole = req.user.role_name || req.user.role?.name || 'user';
    const limit = parseInt(req.query.limit) || 10;

    // Validate limit parameter
    if (limit < 1 || limit > 50) {
      return res.status(400).json({
        success: false,
        message: 'Limit parameter must be between 1 and 50',
        timestamp: new Date().toISOString()
      });
    }

    const campaignsData = await dashboardService.getTopCampaigns(userId, userRole, limit);

    res.json({
      success: true,
      message: `Retrieved top ${limit} performing campaigns`,
      timestamp: new Date().toISOString(),
      data: {
        campaigns: campaignsData,
        total_returned: campaignsData.length
      },
      params: {
        limit: limit,
        user_role: userRole
      }
    });

  } catch (error) {
    console.error('Dashboard campaigns error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch campaign performance data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/dashboard/brands
 * Get brand performance analysis
 * Query params: limit (default: 8)
 */
router.get('/brands', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const userRole = req.user.role_name || req.user.role?.name || 'user';
    const limit = parseInt(req.query.limit) || 8;

    // Validate limit parameter
    if (limit < 1 || limit > 20) {
      return res.status(400).json({
        success: false,
        message: 'Limit parameter must be between 1 and 20',
        timestamp: new Date().toISOString()
      });
    }

    const brandsData = await dashboardService.getBrandPerformance(userId, userRole, limit);

    res.json({
      success: true,
      message: `Retrieved top ${limit} brand performance data`,
      timestamp: new Date().toISOString(),
      data: {
        brands: brandsData,
        total_returned: brandsData.length
      },
      params: {
        limit: limit,
        user_role: userRole
      }
    });

  } catch (error) {
    console.error('Dashboard brands error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch brand performance data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/dashboard/activities
 * Get recent system activities
 * Query params: limit (default: 20)
 */
router.get('/activities', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const userRole = req.user.role_name || req.user.role?.name || 'user';
    const limit = parseInt(req.query.limit) || 20;

    // Validate limit parameter
    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: 'Limit parameter must be between 1 and 100',
        timestamp: new Date().toISOString()
      });
    }

    const activitiesData = await dashboardService.getRecentActivities(userId, userRole, limit);

    res.json({
      success: true,
      message: `Retrieved ${limit} recent activities`,
      timestamp: new Date().toISOString(),
      data: {
        activities: activitiesData,
        total_returned: activitiesData.length
      },
      params: {
        limit: limit,
        user_role: userRole
      }
    });

  } catch (error) {
    console.error('Dashboard activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activities',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/dashboard/realtime
 * Get real-time dashboard metrics for auto-refresh
 */
router.get('/realtime', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const userRole = req.user.role_name || req.user.role?.name || 'user';

    const realTimeData = await dashboardService.getRealTimeMetrics(userId, userRole);

    res.json({
      success: true,
      message: 'Real-time dashboard metrics retrieved successfully',
      timestamp: new Date().toISOString(),
      data: realTimeData
    });

  } catch (error) {
    console.error('Dashboard real-time error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch real-time metrics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/dashboard/summary
 * Get a quick summary of all dashboard data (lightweight version)
 */
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const userRole = req.user.role_name || req.user.role?.name || 'user';

    // Get basic overview data
    const overviewData = await dashboardService.getOverviewStats(userId, userRole);
    const realTimeData = await dashboardService.getRealTimeMetrics(userId, userRole);

    // Simplified summary
    const summaryData = {
      quick_stats: {
        total_campaigns: overviewData.campaigns.total,
        active_campaigns: overviewData.campaigns.active,
        total_leads: overviewData.performance.total_leads,
        total_spent: overviewData.performance.total_spent,
        avg_cost_per_lead: overviewData.performance.avg_cost_per_lead
      },
      today: realTimeData.today,
      growth: {
        leads: overviewData.growth.leads,
        spent: overviewData.growth.spent
      },
      system_health: realTimeData.system_health,
      last_updated: new Date().toISOString()
    };

    res.json({
      success: true,
      message: 'Dashboard summary retrieved successfully',
      timestamp: new Date().toISOString(),
      data: summaryData
    });

  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard summary',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/dashboard/export
 * Export dashboard data in various formats
 * Query params: format (json, csv), type (overview, campaigns, brands)
 */
router.get('/export', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const userRole = req.user.role_name || req.user.role?.name || 'user';
    const format = req.query.format || 'json';
    const type = req.query.type || 'overview';

    if (!['json', 'csv'].includes(format)) {
      return res.status(400).json({
        success: false,
        message: 'Format must be either json or csv',
        timestamp: new Date().toISOString()
      });
    }

    if (!['overview', 'campaigns', 'brands', 'activities'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type must be one of: overview, campaigns, brands, activities',
        timestamp: new Date().toISOString()
      });
    }

    let exportData;
    let filename;

    switch (type) {
      case 'overview':
        exportData = await dashboardService.getOverviewStats(userId, userRole);
        filename = `dashboard-overview-${new Date().toISOString().split('T')[0]}`;
        break;
      case 'campaigns':
        exportData = await dashboardService.getTopCampaigns(userId, userRole, 50);
        filename = `dashboard-campaigns-${new Date().toISOString().split('T')[0]}`;
        break;
      case 'brands':
        exportData = await dashboardService.getBrandPerformance(userId, userRole, 20);
        filename = `dashboard-brands-${new Date().toISOString().split('T')[0]}`;
        break;
      case 'activities':
        exportData = await dashboardService.getRecentActivities(userId, userRole, 100);
        filename = `dashboard-activities-${new Date().toISOString().split('T')[0]}`;
        break;
    }

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
      res.json({
        exported_at: new Date().toISOString(),
        type: type,
        user_id: userId,
        user_role: userRole,
        data: exportData
      });
    } else if (format === 'csv') {
      // Simple CSV conversion for arrays
      if (Array.isArray(exportData)) {
        const csvData = convertToCSV(exportData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
        res.send(csvData);
      } else {
        // For complex objects, return JSON with CSV headers
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
        res.json({
          message: 'CSV format not available for complex data structures',
          exported_at: new Date().toISOString(),
          type: type,
          data: exportData
        });
      }
    }

  } catch (error) {
    console.error('Dashboard export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export dashboard data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Helper function to convert array of objects to CSV
 */
function convertToCSV(data) {
  if (!data || data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];

  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header];
      // Escape commas and quotes in CSV
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

module.exports = router;