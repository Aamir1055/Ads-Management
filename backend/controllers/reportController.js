const { pool } = require('../config/database');
const XLSX = require('xlsx');

// Response envelope helper
const createResponse = (success, message, data = null, meta = null) => {
  const response = { success, message, timestamp: new Date().toISOString() };
  if (data !== null) response.data = data;
  if (meta !== null) response.meta = meta;
  return response;
};

// Date helper
const toMysqlDate = (val) => {
  if (!val) return null;
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return null;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// Error handler
const handleDbError = (error, operation, res) => {
  console.error(`[ReportsController] ${operation} error:`, error);
  return res.status(500).json(
    createResponse(false, `Failed to ${operation}`, null, 
      process.env.NODE_ENV === 'development' ? { error: error.message } : null
    )
  );
};

const reportsController = {
  
  // ============================================================================
  // MAIN REPORT GENERATION - Direct from campaign_data (no grouping)
  // ============================================================================

  /**
   * GET /api/reports/generate
   * Generate comprehensive reports directly from campaign_data table
   * Shows ALL individual entries, no aggregation/grouping
   */
  generateReport: async (req, res) => {
    try {
      const dateFrom = toMysqlDate(req.query.date_from);
      const dateTo = toMysqlDate(req.query.date_to);
      const brand = (req.query.brand || '').trim();
      const campaignId = req.query.campaign_id ? Number(req.query.campaign_id) : null;

      if (!dateFrom || !dateTo) {
        return res.status(400).json(createResponse(false, 'date_from and date_to are required (YYYY-MM-DD format)'));
      }

      const where = [];
      const params = [];

      // Date range filter
      where.push('cd.data_date >= ?', 'cd.data_date <= ?');
      params.push(dateFrom, dateTo);

      // Brand filter (by brand name)
      if (brand) {
        where.push('b.name = ?');
        params.push(brand);
      }

      // Campaign filter
      if (campaignId) {
        where.push('cd.campaign_id = ?');
        params.push(campaignId);
      }

      const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

      // Main query: Get ALL campaign_data entries with joined info
      const reportSql = `
        SELECT
          cd.id,
          cd.data_date as report_date,
          DATE_FORMAT(cd.data_date, '%Y-%m') as report_month,
          cd.campaign_id,
          c.name as campaign_name,
          ct.type_name as campaign_type,
          COALESCE(b.name, 'Unknown Brand') as brand,
          c.brand as brand_id,
          cd.facebook_result,
          cd.xoho_result as zoho_result,
          (cd.facebook_result + cd.xoho_result) as leads,
          cd.spent,
          cd.card_id,
          cd.card_name,
          CASE 
            WHEN (cd.facebook_result + cd.xoho_result) > 0 
            THEN cd.spent / (cd.facebook_result + cd.xoho_result)
            ELSE NULL 
          END as cost_per_lead,
          CASE 
            WHEN cd.facebook_result > 0 
            THEN cd.spent / cd.facebook_result
            ELSE NULL 
          END as facebook_cost_per_lead,
          CASE 
            WHEN cd.xoho_result > 0 
            THEN cd.spent / cd.xoho_result
            ELSE NULL 
          END as zoho_cost_per_lead,
          cd.created_at,
          cd.updated_at
        FROM campaign_data cd
        LEFT JOIN campaigns c ON cd.campaign_id = c.id
        LEFT JOIN campaign_types ct ON c.campaign_type_id = ct.id
        LEFT JOIN brands b ON c.brand = b.id
        ${whereClause}
        ORDER BY cd.data_date DESC, cd.id DESC
      `;

      // Summary statistics
      const summarySql = `
        SELECT
          COUNT(DISTINCT cd.campaign_id) as total_campaigns,
          COUNT(*) as total_records,
          SUM(cd.facebook_result) as total_facebook_results,
          SUM(cd.xoho_result) as total_zoho_results,
          SUM(cd.facebook_result + cd.xoho_result) as total_results,
          SUM(cd.spent) as total_spent,
          AVG(CASE 
            WHEN (cd.facebook_result + cd.xoho_result) > 0 
            THEN cd.spent / (cd.facebook_result + cd.xoho_result)
            ELSE NULL 
          END) as avg_cost_per_result,
          MIN(cd.data_date) as earliest_date,
          MAX(cd.data_date) as latest_date
        FROM campaign_data cd
        LEFT JOIN campaigns c ON cd.campaign_id = c.id
        LEFT JOIN brands b ON c.brand = b.id
        ${whereClause}
      `;

      // Execute queries
      const [reportData] = await pool.query(reportSql, params);
      const [summaryData] = await pool.query(summarySql, params);
      
      // DEBUG: Log the actual data being returned
      console.log('🔍 [DEBUG] generateReport - Raw query results:');
      console.log('Query:', reportSql.substring(0, 200) + '...');
      console.log('Params:', params);
      console.log('Results count:', reportData?.length || 0);
      if (reportData && reportData.length > 0) {
        console.log('First record:', {
          id: reportData[0].id,
          campaign_name: reportData[0].campaign_name,
          brand: reportData[0].brand,
          brand_type: typeof reportData[0].brand,
          leads: reportData[0].leads,
          leads_type: typeof reportData[0].leads,
          cost_per_lead: reportData[0].cost_per_lead,
          cost_per_lead_type: typeof reportData[0].cost_per_lead,
          facebook_result: reportData[0].facebook_result,
          zoho_result: reportData[0].zoho_result,
          spent: reportData[0].spent,
          facebook_cost_per_lead: reportData[0].facebook_cost_per_lead,
          zoho_cost_per_lead: reportData[0].zoho_cost_per_lead
        });
      }

      // Handle empty results
      if (!reportData || reportData.length === 0) {
        return res.status(200).json(createResponse(true, 'No data found for the selected date range', {
          summary: {
            totalCampaigns: 0,
            totalRecords: 0,
            totalFacebookResults: 0,
            totalZohoResults: 0,
            totalResults: 0,
            totalSpent: 0,
            avgCostPerResult: 0,
            dateRange: { from: dateFrom, to: dateTo }
          },
          reports: [],
          filters: {
            dateFrom,
            dateTo,
            ...(brand && { brand }),
            ...(campaignId && { campaignId })
          }
        }));
      }

      const summary = summaryData[0] || {};
      
      const responseData = {
        summary: {
          totalCampaigns: Number(summary.total_campaigns || 0),
          totalRecords: Number(summary.total_records || 0),
          totalFacebookResults: Number(summary.total_facebook_results || 0),
          totalZohoResults: Number(summary.total_zoho_results || 0),
          totalResults: Number(summary.total_results || 0),
          totalSpent: Number(summary.total_spent || 0),
          avgCostPerResult: Number(summary.avg_cost_per_result || 0),
          dateRange: {
            from: summary.earliest_date || dateFrom,
            to: summary.latest_date || dateTo
          }
        },
        reports: reportData || [],
        filters: {
          dateFrom,
          dateTo,
          ...(brand && { brand }),
          ...(campaignId && { campaignId })
        }
      };

      return res.status(200).json(createResponse(true, `Report generated successfully with ${reportData.length} records`, responseData));
    } catch (error) {
      return handleDbError(error, 'generate report', res);
    }
  },

  // ============================================================================
  // REPORTS TABLE CRUD (stores brand IDs, shows brand names)
  // ============================================================================

  /**
   * GET /api/reports
   * Get all reports with filters and pagination from reports table
   */
  getAll: async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
      const offset = (page - 1) * limit;

      const campaignId = req.query.campaign_id ? Number(req.query.campaign_id) : null;
      const dateFrom = toMysqlDate(req.query.date_from);
      const dateTo = toMysqlDate(req.query.date_to);
      const month = (req.query.month || '').trim();
      const searchTerm = (req.query.search || '').trim();
      const search = searchTerm ? `%${searchTerm}%` : null;

      const where = [];
      const params = [];

      if (campaignId) { where.push('r.campaign_id = ?'); params.push(campaignId); }
      if (dateFrom) { where.push('r.report_date >= ?'); params.push(dateFrom); }
      if (dateTo) { where.push('r.report_date <= ?'); params.push(dateTo); }
      if (month && /^[0-9]{4}-[0-9]{2}$/.test(month)) { where.push('r.report_month = ?'); params.push(month); }
      if (search) {
        where.push('(r.campaign_name LIKE ? OR r.campaign_type LIKE ? OR r.brand_name LIKE ?)');
        params.push(search, search, search);
      }

      const whereClause = where.length ? ' WHERE ' + where.join(' AND ') : '';

      // Count query
      const countSql = `
        SELECT COUNT(*) AS total 
        FROM reports r 
        ${whereClause}
      `;

      // Data query - join with brands to show brand names
      const dataSql = `
        SELECT
          r.id,
          r.report_date,
          r.report_month,
          r.campaign_id,
          r.campaign_name,
          r.campaign_type,
          r.brand as brand_id,
          COALESCE(r.brand_name, b.name, 'Unknown Brand') as brand_name,
          r.leads,
          r.facebook_result,
          r.zoho_result,
          r.spent,
          r.cost_per_lead,
          r.created_at,
          r.updated_at
        FROM reports r
        LEFT JOIN brands b ON r.brand = b.id
        ${whereClause}
        ORDER BY r.report_date DESC, r.id DESC 
        LIMIT ? OFFSET ?
      `;

      const [countRows] = await pool.query(countSql, params);
      const totalCount = Number(countRows[0]?.total || 0);

      const [rows] = await pool.query(dataSql, [...params, limit, offset]);
      
      // DEBUG: Log the actual query results to see if brand_name is present
      console.log('[DEBUG] Reports API - Query returned', rows?.length || 0, 'rows');
      if (rows && rows.length > 0) {
        console.log('[DEBUG] First row keys:', Object.keys(rows[0]));
        console.log('[DEBUG] First row brand_name:', rows[0].brand_name, '(type:', typeof rows[0].brand_name, ')');
        console.log('[DEBUG] First row sample:', {
          id: rows[0].id,
          campaign_name: rows[0].campaign_name,
          brand: rows[0].brand,
          brand_name: rows[0].brand_name
        });
      }
      
      const totalPages = Math.max(1, Math.ceil(totalCount / limit));

      const meta = {
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        filters: {
          ...(campaignId && { campaign_id: campaignId }),
          ...(dateFrom && { date_from: dateFrom }),
          ...(dateTo && { date_to: dateTo }),
          ...(month && { month }),
          ...(searchTerm && { search: searchTerm })
        }
      };

      // DEBUG: Log what's being sent in the response
      console.log('[DEBUG] Final response data - rows length:', rows?.length || 0);
      if (rows && rows.length > 0) {
        console.log('[DEBUG] Final response - first row sample:', {
          id: rows[0].id,
          campaign_name: rows[0].campaign_name,
          brand_id: rows[0].brand_id,
          brand_name: rows[0].brand_name,
          hasOwnProperty_brand_name: rows[0].hasOwnProperty('brand_name')
        });
      }
      
      const responseData = rows || [];
      console.log('[DEBUG] Response data type:', typeof responseData);
      console.log('[DEBUG] Response is array:', Array.isArray(responseData));
      
      return res.status(200).json(createResponse(true, `Retrieved ${rows?.length || 0} report row(s)`, responseData, meta));
    } catch (error) {
      return handleDbError(error, 'retrieve reports', res);
    }
  },

  /**
   * POST /api/reports/sync
   * Sync campaign_data entries to reports table with full rebuild option
   * Note: Database triggers now automatically sync data, this is for manual rebuild
   */
  syncFromCampaignData: async (req, res) => {
    try {
      const dateFrom = toMysqlDate(req.body.date_from);
      const dateTo = toMysqlDate(req.body.date_to);
      const fullRebuild = req.body.full_rebuild === true;

      if (!dateFrom || !dateTo) {
        return res.status(400).json(createResponse(false, 'date_from and date_to are required'));
      }

      let connection;
      try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        if (fullRebuild) {
          // Full rebuild: Clear all reports and rebuild from campaign_data
          await connection.query('TRUNCATE TABLE reports');
          
          console.log('[ReportsController] Performing full rebuild of reports table...');
          
          // Rebuild entire reports table from campaign_data
          const rebuildSql = `
            INSERT INTO reports (
              report_date,
              report_month,
              campaign_id,
              campaign_name,
              campaign_type,
              brand,
              brand_name,
              leads,
              facebook_result,
              zoho_result,
              spent,
              created_by,
              created_at,
              updated_at
            )
            SELECT 
              cd.data_date,
              DATE_FORMAT(cd.data_date, '%Y-%m'),
              cd.campaign_id,
              COALESCE(c.name, 'Unknown Campaign'),
              COALESCE(ct.type_name, 'Unknown Type'),
              c.brand,
              COALESCE(b.name, 'Unknown Brand'),
              (cd.facebook_result + cd.xoho_result),
              cd.facebook_result,
              cd.xoho_result,
              cd.spent,
              cd.created_by,
              cd.created_at,
              cd.updated_at
            FROM campaign_data cd
            LEFT JOIN campaigns c ON cd.campaign_id = c.id
            LEFT JOIN campaign_types ct ON c.campaign_type_id = ct.id
            LEFT JOIN brands b ON c.brand = b.id
            ORDER BY cd.data_date DESC, cd.created_at DESC
          `;

          const [fullResult] = await connection.query(rebuildSql);
          
          await connection.commit();
          connection.release();

          return res.status(200).json(createResponse(true, 'Full reports rebuild completed successfully', {
            operation: 'full_rebuild',
            recordsCreated: fullResult.affectedRows,
            message: 'All reports have been rebuilt from campaign_data. Database triggers will now keep data in sync automatically.'
          }));
        } else {
          // Date range sync: Delete and rebuild specific date range
          await connection.query(
            'DELETE FROM reports WHERE report_date >= ? AND report_date <= ?',
            [dateFrom, dateTo]
          );

          console.log(`[ReportsController] Syncing reports for date range: ${dateFrom} to ${dateTo}`);

          // Insert campaign_data entries for the specified date range
          const insertSql = `
            INSERT INTO reports (
              report_date,
              report_month,
              campaign_id,
              campaign_name,
              campaign_type,
              brand,
              brand_name,
              leads,
              facebook_result,
              zoho_result,
              spent,
              created_by,
              created_at,
              updated_at
            )
            SELECT 
              cd.data_date,
              DATE_FORMAT(cd.data_date, '%Y-%m'),
              cd.campaign_id,
              COALESCE(c.name, 'Unknown Campaign'),
              COALESCE(ct.type_name, 'Unknown Type'),
              c.brand,
              COALESCE(b.name, 'Unknown Brand'),
              (cd.facebook_result + cd.xoho_result),
              cd.facebook_result,
              cd.xoho_result,
              cd.spent,
              cd.created_by,
              cd.created_at,
              cd.updated_at
            FROM campaign_data cd
            LEFT JOIN campaigns c ON cd.campaign_id = c.id
            LEFT JOIN campaign_types ct ON c.campaign_type_id = ct.id
            LEFT JOIN brands b ON c.brand = b.id
            WHERE cd.data_date >= ? AND cd.data_date <= ?
            ORDER BY cd.data_date DESC, cd.id DESC
          `;

          const [result] = await connection.query(insertSql, [dateFrom, dateTo]);
          
          await connection.commit();
          connection.release();

          return res.status(200).json(createResponse(true, 'Reports synced successfully', {
            operation: 'date_range_sync',
            dateFrom,
            dateTo,
            recordsCreated: result.affectedRows,
            message: 'Date range synced. Database triggers will keep future data in sync automatically.'
          }));
        }

      } catch (error) {
        if (connection) {
          try { await connection.rollback(); } catch {}
          connection.release();
        }
        throw error;
      }
    } catch (error) {
      return handleDbError(error, 'sync reports from campaign data', res);
    }
  },

  // ============================================================================
  // FILTER OPTIONS
  // ============================================================================

  /**
   * GET /api/reports/filters
   * Get available filter options
   */
  getFilterOptions: async (req, res) => {
    try {
      // Get brands
      const [brandsData] = await pool.query(`
        SELECT DISTINCT b.name as brand
        FROM campaigns c
        INNER JOIN brands b ON c.brand = b.id
        WHERE b.is_active = 1 AND c.is_enabled = 1
        ORDER BY b.name ASC
      `);

      // Get campaigns
      const [campaignsData] = await pool.query(`
        SELECT 
          c.id,
          c.name,
          b.name as brand,
          ct.type_name as campaign_type
        FROM campaigns c
        LEFT JOIN brands b ON c.brand = b.id
        LEFT JOIN campaign_types ct ON c.campaign_type_id = ct.id
        WHERE c.is_enabled = 1
        ORDER BY c.name ASC
      `);

      // Get date ranges
      const [dateRangeData] = await pool.query(`
        SELECT
          MIN(cd.data_date) as earliest_date,
          MAX(cd.data_date) as latest_date
        FROM campaign_data cd
      `);

      const dateRange = dateRangeData[0] || {};

      const filterOptions = {
        brands: brandsData.map(row => row.brand).filter(Boolean),
        campaigns: campaignsData.map(row => ({
          id: row.id,
          name: row.name,
          brand: row.brand,
          campaign_type: row.campaign_type
        })),
        dateRange: {
          earliest: dateRange.earliest_date,
          latest: dateRange.latest_date
        }
      };

      return res.status(200).json(createResponse(true, 'Filter options retrieved successfully', filterOptions));
    } catch (error) {
      return handleDbError(error, 'get filter options', res);
    }
  },

  // ============================================================================
  // INDIVIDUAL REPORT CRUD
  // ============================================================================

  /**
   * GET /api/reports/:id
   */
  getById: async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!id || id <= 0) {
        return res.status(400).json(createResponse(false, 'Invalid report id'));
      }

      const [rows] = await pool.query(`
        SELECT 
          r.*
        FROM reports r
        WHERE r.id = ?
      `, [id]);

      if (!rows || rows.length === 0) {
        return res.status(404).json(createResponse(false, 'Report not found'));
      }

      return res.status(200).json(createResponse(true, 'Report retrieved successfully', rows[0]));
    } catch (error) {
      return handleDbError(error, 'retrieve report', res);
    }
  },

  /**
   * POST /api/reports
   */
  create: async (req, res) => {
    try {
      const {
        report_date,
        campaign_id,
        campaign_name = null,
        campaign_type = null,
        brand_id = null,
        leads = 0,
        facebook_result = 0,
        zoho_result = 0,
        spent = 0
      } = req.body || {};

      if (!report_date || !campaign_id) {
        return res.status(400).json(createResponse(false, 'report_date and campaign_id are required'));
      }

      const dateStr = toMysqlDate(report_date);
      if (!dateStr) {
        return res.status(400).json(createResponse(false, 'Invalid report_date format'));
      }

      const month = dateStr.slice(0, 7); // YYYY-MM

      const [result] = await pool.query(`
        INSERT INTO reports (
          report_date, report_month, campaign_id, campaign_name, campaign_type, 
          brand, leads, facebook_result, zoho_result, spent, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        dateStr, month, campaign_id, campaign_name, campaign_type,
        brand_id, leads, facebook_result, zoho_result, spent
      ]);

      const [newReport] = await pool.query(`
        SELECT r.*, b.name as brand_name 
        FROM reports r 
        LEFT JOIN brands b ON r.brand = b.id 
        WHERE r.id = ?
      `, [result.insertId]);

      return res.status(201).json(createResponse(true, 'Report created successfully', newReport[0]));
    } catch (error) {
      return handleDbError(error, 'create report', res);
    }
  },

  /**
   * PUT /api/reports/:id
   */
  update: async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!id || id <= 0) {
        return res.status(400).json(createResponse(false, 'Invalid report id'));
      }

      const allowed = ['report_date', 'campaign_id', 'campaign_name', 'campaign_type', 'brand_id', 'leads', 'facebook_result', 'zoho_result', 'spent'];
      const updates = {};
      
      for (const key of allowed) {
        if (Object.prototype.hasOwnProperty.call(req.body, key)) {
          if (key === 'brand_id') {
            updates.brand = req.body[key]; // Map brand_id to brand column
          } else {
            updates[key] = req.body[key];
          }
        }
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json(createResponse(false, 'No valid fields provided'));
      }

      if (updates.report_date) {
        const dateStr = toMysqlDate(updates.report_date);
        if (!dateStr) {
          return res.status(400).json(createResponse(false, 'Invalid report_date format'));
        }
        updates.report_date = dateStr;
        updates.report_month = dateStr.slice(0, 7);
      }

      const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
      const params = [...Object.values(updates), id];

      const [result] = await pool.query(`
        UPDATE reports SET ${setClause}, updated_at = NOW() WHERE id = ?
      `, params);

      if (result.affectedRows === 0) {
        return res.status(404).json(createResponse(false, 'Report not found'));
      }

      const [updatedReport] = await pool.query(`
        SELECT r.*, b.name as brand_name 
        FROM reports r 
        LEFT JOIN brands b ON r.brand = b.id 
        WHERE r.id = ?
      `, [id]);

      return res.status(200).json(createResponse(true, 'Report updated successfully', updatedReport[0]));
    } catch (error) {
      return handleDbError(error, 'update report', res);
    }
  },

  /**
   * DELETE /api/reports/:id
   */
  delete: async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!id || id <= 0) {
        return res.status(400).json(createResponse(false, 'Invalid report id'));
      }

      const [result] = await pool.query('DELETE FROM reports WHERE id = ?', [id]);
      
      if (result.affectedRows === 0) {
        return res.status(404).json(createResponse(false, 'Report not found'));
      }

      return res.status(200).json(createResponse(true, 'Report deleted successfully'));
    } catch (error) {
      return handleDbError(error, 'delete report', res);
    }
  },

  /**
   * GET /api/reports/export
   * Export reports to Excel format
   */
  exportToExcel: async (req, res) => {
    try {
      const dateFrom = toMysqlDate(req.query.date_from);
      const dateTo = toMysqlDate(req.query.date_to);
      const brand = (req.query.brand || '').trim();
      const campaignId = req.query.campaign_id ? Number(req.query.campaign_id) : null;

      if (!dateFrom || !dateTo) {
        return res.status(400).json(createResponse(false, 'date_from and date_to are required (YYYY-MM-DD format)'));
      }

      const where = [];
      const params = [];

      // Date range filter
      where.push('cd.data_date >= ?', 'cd.data_date <= ?');
      params.push(dateFrom, dateTo);

      // Brand filter
      if (brand) {
        where.push('b.name = ?');
        params.push(brand);
      }

      // Campaign filter
      if (campaignId) {
        where.push('cd.campaign_id = ?');
        params.push(campaignId);
      }

      const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

      // Query for export data
      const exportSql = `
        SELECT
          DATE_FORMAT(cd.data_date, '%d/%m/%Y') as 'Date',
          c.name as 'Campaign Name',
          ct.type_name as 'Campaign Type',
          COALESCE(b.name, 'Unknown Brand') as 'Brand',
          cd.card_name as 'Card',
          cd.facebook_result as 'Facebook Results',
          cd.xoho_result as 'Zoho Results',
          (cd.facebook_result + cd.xoho_result) as 'Total Leads',
          ROUND(cd.spent, 2) as 'Amount Spent (₹)',
          ROUND(CASE 
            WHEN (cd.facebook_result + cd.xoho_result) > 0 
            THEN cd.spent / (cd.facebook_result + cd.xoho_result)
            ELSE 0 
          END, 2) as 'Cost Per Lead (₹)',
          ROUND(CASE 
            WHEN cd.facebook_result > 0 
            THEN cd.spent / cd.facebook_result
            ELSE 0 
          END, 2) as 'Facebook CPL (₹)',
          ROUND(CASE 
            WHEN cd.xoho_result > 0 
            THEN cd.spent / cd.xoho_result
            ELSE 0 
          END, 2) as 'Zoho CPL (₹)'
        FROM campaign_data cd
        LEFT JOIN campaigns c ON cd.campaign_id = c.id
        LEFT JOIN campaign_types ct ON c.campaign_type_id = ct.id
        LEFT JOIN brands b ON c.brand = b.id
        ${whereClause}
        ORDER BY cd.data_date DESC, c.name ASC
      `;

      // Execute query
      const [exportData] = await pool.query(exportSql, params);

      if (!exportData || exportData.length === 0) {
        return res.status(404).json(createResponse(false, 'No data found for the selected criteria'));
      }

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Set column widths for better readability
      const columnWidths = [
        { wch: 12 }, // Date
        { wch: 25 }, // Campaign Name
        { wch: 20 }, // Campaign Type
        { wch: 15 }, // Brand
        { wch: 20 }, // Card
        { wch: 15 }, // Facebook Results
        { wch: 12 }, // Zoho Results
        { wch: 12 }, // Total Leads
        { wch: 18 }, // Amount Spent
        { wch: 15 }, // Cost Per Lead
        { wch: 15 }, // Facebook CPL
        { wch: 12 }  // Zoho CPL
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Campaign Reports');

      // Create summary sheet
      const summaryData = [
        { 'Metric': 'Total Records', 'Value': exportData.length },
        { 'Metric': 'Total Campaigns', 'Value': [...new Set(exportData.map(row => row['Campaign Name']))].length },
        { 'Metric': 'Total Leads', 'Value': exportData.reduce((sum, row) => sum + (row['Total Leads'] || 0), 0) },
        { 'Metric': 'Total Spent (₹)', 'Value': exportData.reduce((sum, row) => sum + (row['Amount Spent (₹)'] || 0), 0).toFixed(2) },
        { 'Metric': 'Average Cost Per Lead (₹)', 'Value': (exportData.reduce((sum, row) => sum + (row['Cost Per Lead (₹)'] || 0), 0) / exportData.length).toFixed(2) },
        { 'Metric': 'Date Range', 'Value': `${dateFrom} to ${dateTo}` },
        { 'Metric': 'Export Date', 'Value': new Date().toLocaleDateString('en-IN') },
        { 'Metric': 'Export Time', 'Value': new Date().toLocaleTimeString('en-IN') }
      ];

      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      summarySheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

      // Generate Excel buffer
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      // Set response headers
      const filename = `Campaign_Reports_${dateFrom}_to_${dateTo}_${Date.now()}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', excelBuffer.length);

      // Send the Excel file
      return res.send(excelBuffer);
    } catch (error) {
      console.error('[ReportsController] exportToExcel error:', error);
      return res.status(500).json(createResponse(false, 'Failed to export data to Excel', null, 
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      ));
    }
  }
};

module.exports = reportsController;
