const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Apply authentication to all routes
router.use(authenticateToken);

// ============================================================================
// REPORT GENERATION AND SYNC ROUTES
// ============================================================================

/**
 * POST /api/reports/generate
 * Generate reports from campaign_data without storing them
 * Body: { dateFrom, dateTo, campaignId?, brandId? }
 */
router.post('/generate', reportController.generateReports);

/**
 * POST /api/reports/sync
 * Sync generated reports to the reports table
 * Body: { dateFrom, dateTo, campaignId?, brandId?, updateExisting? }
 */
router.post('/sync', reportController.syncReports);

// ============================================================================
// CRUD ROUTES FOR REPORTS
// ============================================================================

/**
 * GET /api/reports
 * Get all reports with pagination and filters
 * Query params: page, limit, campaign_id, brand_id, date_from, date_to, report_month
 */
router.get('/', reportController.getAllReports);

/**
 * POST /api/reports
 * Create a new report manually
 * Body: report data object
 */
router.post('/', reportController.createReport);

/**
 * GET /api/reports/:id
 * Get a specific report by ID
 */
router.get('/:id', reportController.getReportById);

/**
 * PUT /api/reports/:id
 * Update an existing report
 * Body: updated report data
 */
router.put('/:id', reportController.updateReport);

/**
 * DELETE /api/reports/:id
 * Delete a specific report
 */
router.delete('/:id', reportController.deleteReport);

/**
 * DELETE /api/reports/range
 * Delete reports in a date range
 * Body: { dateFrom, dateTo, campaignId?, brandId? }
 */
router.delete('/range', reportController.deleteReportsInRange);

// ============================================================================
// ANALYTICS AND UTILITY ROUTES
// ============================================================================

/**
 * GET /api/reports/filters
 * Get available filter options (brands, campaigns, etc.)
 */
router.get('/filters', reportController.getFilterOptions);

/**
 * GET /api/reports/stats
 * Get report statistics with filters
 * Query params: date_from, date_to, campaign_id, brand_id
 */
router.get('/stats', reportController.getReportStats);

/**
 * GET /api/reports/dashboard
 * Get dashboard statistics
 * Query params: dateFrom, dateTo
 */
router.get('/dashboard', reportController.getDashboardStats);

module.exports = router;