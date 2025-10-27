const Report = require('../models/Report');
const ReportService = require('../services/reportService');

// Response helper
const createResponse = (success, message, data = null, meta = null) => {
  const response = { success, message, timestamp: new Date().toISOString() };
  if (data !== null) response.data = data;
  if (meta !== null) response.meta = meta;
  return response;
};

// Error handler
const handleError = (error, operation, res) => {
  console.error(`[ReportController] ${operation} error:`, error);
  const statusCode = error.message.includes('not found') ? 404 : 500;
  return res.status(statusCode).json(
    createResponse(false, error.message || `Failed to ${operation}`)
  );
};

const reportController = {
  
  // ============================================================================
  // REPORT GENERATION AND SYNC - Main functionality
  // ============================================================================

  /**
   * POST /api/reports/generate
   * Generate reports from campaign_data without storing in reports table
   */
  generateReports: async (req, res) => {
    try {
      const { dateFrom, dateTo, campaignId, brandId } = req.body;

      if (!dateFrom || !dateTo) {
        return res.status(400).json(createResponse(
          false, 
          'Date range is required (dateFrom and dateTo)'
        ));
      }

      const options = {};
      if (campaignId) options.campaignId = campaignId;
      if (brandId) options.brandId = brandId;

      // Get user info from auth middleware
      const userId = req.user.id;
      const userRole = req.user.role?.name || 'user';

      console.log(`📊 Generating reports from ${dateFrom} to ${dateTo}`, options, `User: ${userId}, Role: ${userRole}`);

      const result = await ReportService.generateReportsFromCampaignData(
        dateFrom, 
        dateTo, 
        options,
        userId,
        userRole
      );

      if (result.success) {
        return res.status(200).json(createResponse(
          true,
          `Generated ${result.data.reports.length} report records`,
          result.data
        ));
      } else {
        return res.status(400).json(createResponse(false, result.message));
      }

    } catch (error) {
      return handleError(error, 'generate reports', res);
    }
  },

  /**
   * POST /api/reports/sync
   * Sync generated reports to the reports table
   */
  syncReports: async (req, res) => {
    try {
      const { dateFrom, dateTo, campaignId, brandId, updateExisting = true } = req.body;

      if (!dateFrom || !dateTo) {
        return res.status(400).json(createResponse(
          false, 
          'Date range is required (dateFrom and dateTo)'
        ));
      }

      const options = {
        userId: req.user?.id || null,
        updateExisting
      };
      if (campaignId) options.campaignId = campaignId;
      if (brandId) options.brandId = brandId;

      // Get user info from auth middleware
      const userId = req.user.id;
      const userRole = req.user.role?.name || 'user';

      console.log(`🔄 Syncing reports from ${dateFrom} to ${dateTo}`, options, `User: ${userId}, Role: ${userRole}`);

      const result = await ReportService.syncReportsToTable(
        dateFrom, 
        dateTo, 
        options,
        userId,
        userRole
      );

      if (result.success) {
        return res.status(200).json(createResponse(
          true,
          result.message,
          result.data
        ));
      } else {
        return res.status(400).json(createResponse(false, result.message));
      }

    } catch (error) {
      return handleError(error, 'sync reports', res);
    }
  },

  // ============================================================================
  // CRUD Operations for Reports Table
  // ============================================================================

  /**
   * GET /api/reports
   * Get all reports with pagination and filters
   */
  getAllReports: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      
      const filters = {};
      if (req.query.campaign_id) filters.campaign_id = req.query.campaign_id;
      if (req.query.brand_id) filters.brand_id = req.query.brand_id;
      if (req.query.campaign_name) filters.campaign_name = req.query.campaign_name;
      if (req.query.brand_name) filters.brand_name = req.query.brand_name;
      if (req.query.date_from) filters.date_from = req.query.date_from;
      if (req.query.date_to) filters.date_to = req.query.date_to;
      if (req.query.report_month) filters.report_month = req.query.report_month;

      const pagination = { page, limit };

      // Get user info from auth middleware
      const userId = req.user.id;
      const userRole = req.user.role?.name || 'user';

      console.log(`📋 Fetching reports - Page: ${page}, Limit: ${limit}, User: ${userId}, Role: ${userRole}`, filters);

      const [reports, totalCount] = await Promise.all([
        Report.findAll(filters, pagination, userId, userRole),
        Report.getCount(filters, userId, userRole)
      ]);

      const totalPages = Math.ceil(totalCount / limit);

      const meta = {
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        filters
      };

      return res.status(200).json(createResponse(
        true,
        `Retrieved ${reports.length} report(s)`,
        reports,
        meta
      ));

    } catch (error) {
      return handleError(error, 'fetch reports', res);
    }
  },

  /**
   * GET /api/reports/:id
   * Get a specific report by ID
   */
  getReportById: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json(createResponse(false, 'Invalid report ID'));
      }

      // Get user info from auth middleware
      const userId = req.user.id;
      const userRole = req.user.role?.name || 'user';

      const report = await Report.findById(id, userId, userRole);
      
      if (!report) {
        return res.status(404).json(createResponse(false, 'Report not found or you do not have permission to access it'));
      }

      return res.status(200).json(createResponse(
        true,
        'Report retrieved successfully',
        report
      ));

    } catch (error) {
      return handleError(error, 'fetch report', res);
    }
  },

  /**
   * POST /api/reports
   * Create a new report manually
   */
  createReport: async (req, res) => {
    try {
      const reportData = {
        ...req.body,
        created_by: req.user?.id || null
      };

      const report = await Report.create(reportData);

      return res.status(201).json(createResponse(
        true,
        'Report created successfully',
        report
      ));

    } catch (error) {
      return handleError(error, 'create report', res);
    }
  },

  /**
   * PUT /api/reports/:id
   * Update an existing report
   */
  updateReport: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json(createResponse(false, 'Invalid report ID'));
      }

      // Get user info from auth middleware
      const userId = req.user.id;
      const userRole = req.user.role?.name || 'user';

      // First check if the report exists and user has permission to access it
      const existingReport = await Report.findById(id, userId, userRole);
      if (!existingReport) {
        return res.status(404).json(createResponse(false, 'Report not found or you do not have permission to update it'));
      }

      const report = await Report.update(id, req.body);

      return res.status(200).json(createResponse(
        true,
        'Report updated successfully',
        report
      ));

    } catch (error) {
      return handleError(error, 'update report', res);
    }
  },

  /**
   * DELETE /api/reports/:id
   * Delete a specific report
   */
  deleteReport: async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json(createResponse(false, 'Invalid report ID'));
      }

      // Get user info from auth middleware
      const userId = req.user.id;
      const userRole = req.user.role?.name || 'user';

      // First check if the report exists and user has permission to access it
      const existingReport = await Report.findById(id, userId, userRole);
      if (!existingReport) {
        return res.status(404).json(createResponse(false, 'Report not found or you do not have permission to delete it'));
      }

      await Report.delete(id);

      return res.status(200).json(createResponse(
        true,
        'Report deleted successfully'
      ));

    } catch (error) {
      return handleError(error, 'delete report', res);
    }
  },

  /**
   * DELETE /api/reports/range
   * Delete reports in a date range
   */
  deleteReportsInRange: async (req, res) => {
    try {
      const { dateFrom, dateTo, campaignId, brandId } = req.body;

      if (!dateFrom || !dateTo) {
        return res.status(400).json(createResponse(
          false, 
          'Date range is required (dateFrom and dateTo)'
        ));
      }

      const options = {};
      if (campaignId) options.campaignId = campaignId;
      if (brandId) options.brandId = brandId;

      const result = await ReportService.deleteReportsInRange(
        dateFrom, 
        dateTo, 
        options
      );

      if (result.success) {
        return res.status(200).json(createResponse(
          true,
          result.message,
          { deletedCount: result.deletedCount }
        ));
      } else {
        return res.status(400).json(createResponse(false, result.message));
      }

    } catch (error) {
      return handleError(error, 'delete reports in range', res);
    }
  },

  // ============================================================================
  // UTILITY AND ANALYTICS
  // ============================================================================

  /**
   * GET /api/reports/filters
   * Get available filter options
   */
  getFilterOptions: async (req, res) => {
    try {
      const filterOptions = await ReportService.getFilterOptions();
      
      return res.status(200).json(createResponse(
        true,
        'Filter options retrieved successfully',
        filterOptions
      ));

    } catch (error) {
      return handleError(error, 'get filter options', res);
    }
  },

  /**
   * GET /api/reports/stats
   * Get report statistics
   */
  getReportStats: async (req, res) => {
    try {
      const filters = {};
      if (req.query.date_from) filters.date_from = req.query.date_from;
      if (req.query.date_to) filters.date_to = req.query.date_to;
      if (req.query.campaign_id) filters.campaign_id = req.query.campaign_id;
      if (req.query.brand_id) filters.brand_id = req.query.brand_id;

      const stats = await Report.getStats(filters);

      return res.status(200).json(createResponse(
        true,
        'Report statistics retrieved successfully',
        stats
      ));

    } catch (error) {
      return handleError(error, 'get report statistics', res);
    }
  },

  /**
   * GET /api/reports/dashboard
   * Get dashboard statistics
   */
  getDashboardStats: async (req, res) => {
    try {
      const filters = {};
      if (req.query.dateFrom) filters.dateFrom = req.query.dateFrom;
      if (req.query.dateTo) filters.dateTo = req.query.dateTo;

      const dashboardData = await ReportService.getDashboardStats(filters);

      return res.status(200).json(createResponse(
        true,
        'Dashboard statistics retrieved successfully',
        dashboardData
      ));

    } catch (error) {
      return handleError(error, 'get dashboard statistics', res);
    }
  }
};

module.exports = reportController;