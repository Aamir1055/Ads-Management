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
    const reportController = require('../controllers/reportController');
    
    // Create a custom response wrapper to format analytics data properly
    const originalJson = res.json;
    res.json = function(data) {
      if (data && data.success && data.data) {
        // Transform the data to match analytics dashboard expectations
        const analyticsData = {
          success: data.success,
          message: data.message,
          timestamp: data.timestamp,
          data: {
            overview: {
              totalAmountSpend: data.data.campaignData?.total_amount_spend || 0,
              totalLeads: (
                (data.data.campaignData?.total_facebook_leads || 0) + 
                (data.data.campaignData?.total_zoho_leads || 0)
              ),
              totalFacebookLeads: data.data.campaignData?.total_facebook_leads || 0,
              totalZohoLeads: data.data.campaignData?.total_zoho_leads || 0,
              facebookCostPerLead: data.data.campaignData?.overall_facebook_cost_per_lead || null,
              zohoCostPerLead: data.data.campaignData?.overall_zoho_cost_per_lead || null,
              totalCampaigns: data.data.campaignData?.unique_campaigns_in_data || 0,
              totalRecords: data.data.campaignData?.total_campaign_data_records || 0
            },
            // Include original data for detailed analysis
            raw: data.data
          }
        };
        return originalJson.call(this, analyticsData);
      }
      return originalJson.call(this, data);
    };
    
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
    const { date_from, date_to, limit = 10 } = req.query;
    
    // Generate campaign performance data using ReportService
    const ReportService = require('../services/reportService');
    const reportData = await ReportService.generateReportsFromCampaignData(
      date_from, date_to, {}
    );
    
    if (!reportData.success) {
      return res.status(500).json({
        success: false,
        message: reportData.message
      });
    }
    
    // Group by campaign and calculate metrics
    const campaignMetrics = {};
    reportData.data.reports.forEach(report => {
      const campaignKey = `${report.campaign_id}-${report.campaign_name}`;
      
      if (!campaignMetrics[campaignKey]) {
        campaignMetrics[campaignKey] = {
          campaign_id: report.campaign_id,
          campaign_name: report.campaign_name || `Campaign ${report.campaign_id}`,
          total_amount_spend: 0,
          total_facebook_leads: 0,
          total_zoho_leads: 0,
          total_leads: 0,
          facebook_cost_per_lead: null,
          zoho_cost_per_lead: null
        };
      }
      
      const metrics = campaignMetrics[campaignKey];
      metrics.total_amount_spend += report.amount_spend;
      metrics.total_facebook_leads += report.facebook_leads;
      metrics.total_zoho_leads += report.zoho_leads;
      metrics.total_leads += report.total_leads;
    });
    
    // Calculate cost per lead for each campaign
    Object.values(campaignMetrics).forEach(campaign => {
      if (campaign.total_facebook_leads > 0) {
        campaign.facebook_cost_per_lead = Math.round((campaign.total_amount_spend / campaign.total_facebook_leads) * 100) / 100;
      }
      if (campaign.total_zoho_leads > 0) {
        campaign.zoho_cost_per_lead = Math.round((campaign.total_amount_spend / campaign.total_zoho_leads) * 100) / 100;
      }
    });
    
    // Sort by total spend and limit results
    const sortedCampaigns = Object.values(campaignMetrics)
      .sort((a, b) => b.total_amount_spend - a.total_amount_spend)
      .slice(0, parseInt(limit));
    
    res.status(200).json({
      success: true,
      message: 'Campaign performance data retrieved successfully',
      timestamp: new Date().toISOString(),
      data: {
        campaigns: sortedCampaigns,
        meta: {
          total_campaigns: Object.keys(campaignMetrics).length,
          displayed: sortedCampaigns.length,
          date_range: { from: date_from, to: date_to }
        }
      }
    });
    
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
    
    // Generate time series data using ReportService
    const ReportService = require('../services/reportService');
    const reportData = await ReportService.generateReportsFromCampaignData(
      date_from, date_to, {}
    );
    
    if (!reportData.success) {
      return res.status(500).json({
        success: false,
        message: reportData.message
      });
    }
    
    // Group by date for time series
    const timeSeriesData = {};
    reportData.data.reports.forEach(report => {
      const dateKey = report.report_date;
      
      if (!timeSeriesData[dateKey]) {
        timeSeriesData[dateKey] = {
          date: dateKey,
          total_amount_spend: 0,
          total_facebook_leads: 0,
          total_zoho_leads: 0,
          total_leads: 0,
          campaigns_count: 0
        };
      }
      
      const dayData = timeSeriesData[dateKey];
      dayData.total_amount_spend += report.amount_spend;
      dayData.total_facebook_leads += report.facebook_leads;
      dayData.total_zoho_leads += report.zoho_leads;
      dayData.total_leads += report.total_leads;
      dayData.campaigns_count += 1;
    });
    
    // Sort by date and add cost per lead calculations
    const sortedTimeSeries = Object.values(timeSeriesData)
      .map(day => ({
        ...day,
        facebook_cost_per_lead: day.total_facebook_leads > 0 ? 
          Math.round((day.total_amount_spend / day.total_facebook_leads) * 100) / 100 : null,
        zoho_cost_per_lead: day.total_zoho_leads > 0 ? 
          Math.round((day.total_amount_spend / day.total_zoho_leads) * 100) / 100 : null,
        overall_cost_per_lead: day.total_leads > 0 ? 
          Math.round((day.total_amount_spend / day.total_leads) * 100) / 100 : null
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    res.status(200).json({
      success: true,
      message: 'Time series data retrieved successfully',
      timestamp: new Date().toISOString(),
      data: {
        timeSeries: sortedTimeSeries,
        meta: {
          total_days: sortedTimeSeries.length,
          group_by: group_by,
          date_range: { from: date_from, to: date_to }
        }
      }
    });
    
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