const { pool } = require('../config/database');

// Response envelope
const createResponse = (success, message, data = null, meta = null) => {
  const out = { success, message, timestamp: new Date().toISOString() };
  if (data !== null) out.data = data;
  if (meta !== null) out.meta = meta;
  return out;
};

// Helpers
const toMysqlDate = (val) => {
  if (!val) return null;
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return null;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const toMonth = (dateStr) => {
  // dateStr YYYY-MM-DD -> YYYY-MM
  if (!dateStr) return null;
  return dateStr.slice(0, 7);
};

const handleDbError = (error, operation, res) => {
  console.error(`[ReportsController] ${operation} error:`, error);
  return res.status(500).json(
    createResponse(false, `Failed to ${operation}`, null, process.env.NODE_ENV === 'development' ? { error: error.message } : null)
  );
};

// Core aggregation query
// Aggregates campaign_data per campaign_id for a given date, joins campaign denorm fields.
const buildAggregationForDate = `
  SELECT
    DATE(cd.data_date) AS report_date,
    CONCAT(YEAR(cd.data_date), '-', LPAD(MONTH(cd.data_date), 2, '0')) AS report_month,
    cd.campaign_id,
    c.name AS campaign_name,
    ct.type_name AS campaign_type,
    b.id AS brand_id,
    b.name AS brand_name,
    SUM(cd.facebook_result + cd.xoho_result) AS leads,
    SUM(cd.facebook_result) AS facebook_result,
    SUM(cd.xoho_result) AS zoho_result,
    SUM(cd.spent) AS spent
  FROM campaign_data cd
  LEFT JOIN campaigns c ON cd.campaign_id = c.id
  LEFT JOIN campaign_types ct ON c.campaign_type_id = ct.id
  LEFT JOIN brands b ON c.brand = b.id
  WHERE cd.data_date = ?
  GROUP BY report_date, report_month, cd.campaign_id, c.name, ct.type_name, b.id, b.name
`;

// Upsert into reports; relies on unique key (report_date,campaign_id)
const upsertReportRowSql = `
  INSERT INTO reports
    (report_date, report_month, campaign_id, campaign_name, campaign_type, brand, leads, facebook_result, zoho_result, spent, created_at, updated_at)
  VALUES
    (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
  ON DUPLICATE KEY UPDATE
    report_month = VALUES(report_month),
    campaign_name = VALUES(campaign_name),
    campaign_type = VALUES(campaign_type),
    brand = VALUES(brand),
    leads = VALUES(leads),
    facebook_result = VALUES(facebook_result),
    zoho_result = VALUES(zoho_result),
    spent = VALUES(spent),
    updated_at = NOW()
`; // cost_per_lead is GENERATED ALWAYS; MySQL computes it. [1][8]

// Controller
const reportsController = {
  // POST /api/reports/build?date=YYYY-MM-DD
  // Build or refresh reports for a specific date by aggregating campaign_data.
  buildDaily: async (req, res) => {
    const dateStr = toMysqlDate(req.query.date || req.body?.date);
    if (!dateStr) {
      return res.status(400).json(createResponse(false, 'Valid date (YYYY-MM-DD) is required'));
    }
    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();

      const [rows] = await connection.query(buildAggregationForDate, [dateStr]);

      if (!rows || rows.length === 0) {
        await connection.commit();
        connection.release();
        return res.status(200).json(createResponse(true, `No source data found for ${dateStr}`, { count: 0 }));
      }

      let affected = 0;
      for (const r of rows) {
        const params = [
          r.report_date,
          r.report_month,
          Number(r.campaign_id),
          r.campaign_name || null,
          r.campaign_type || null,
          r.brand_name || null,
          Number(r.leads || 0),
          Number(r.facebook_result || 0),
          Number(r.zoho_result || 0),
          Number(r.spent || 0)
        ];
        const [resUp] = await connection.query(upsertReportRowSql, params);
        // affectedRows: insert=1, update=2 (per row with ON DUPLICATE); count upserts for visibility [18]
        affected += resUp?.affectedRows ? 1 : 0;
      }

      await connection.commit();
      connection.release();

      return res.status(200).json(createResponse(true, `Built reports for ${dateStr}`, { upserts: affected, date: dateStr, month: toMonth(dateStr) }));
    } catch (error) {
      if (connection) {
        try { await connection.rollback(); } catch {}
        connection.release();
      }
      return handleDbError(error, 'build reports for date', res);
    }
  },

  // POST /api/reports/build-range?from=YYYY-MM-DD&to=YYYY-MM-DD
  // Sequentially rebuild a date range (inclusive).
  buildRange: async (req, res) => {
    const fromStr = toMysqlDate(req.query.from || req.body?.from);
    const toStr = toMysqlDate(req.query.to || req.body?.to);
    if (!fromStr || !toStr || new Date(fromStr) > new Date(toStr)) {
      return res.status(400).json(createResponse(false, 'Valid from and to dates (YYYY-MM-DD) are required, and from <= to'));
    }

    try {
      let totalUpserts = 0;
      const start = new Date(fromStr);
      const end = new Date(toStr);

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const day = toMysqlDate(d);
        // reuse build logic but inline for performance
        const [rows] = await pool.query(buildAggregationForDate, [day]);
        if (!rows || rows.length === 0) continue;

        let affected = 0;
        for (const r of rows) {
          const params = [
            r.report_date,
            r.report_month,
            Number(r.campaign_id),
            r.campaign_name || null,
            r.campaign_type || null,
            r.brand_name || null,
            Number(r.leads || 0),
            Number(r.facebook_result || 0),
            Number(r.zoho_result || 0),
            Number(r.spent || 0)
          ];
          const [resUp] = await pool.query(upsertReportRowSql, params);
          affected += resUp?.affectedRows ? 1 : 0;
        }
        totalUpserts += affected;
      }

      return res.status(200).json(createResponse(true, `Built reports for range`, { from: fromStr, to: toStr, upserts: totalUpserts }));
    } catch (error) {
      return handleDbError(error, 'build reports for range', res);
    }
  },

  // GET /api/reports
  // List with filters: campaign_id, date_from, date_to, month, search (name/brand/type). Pagination.
  getAll: async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
      const offset = (page - 1) * limit;

      const campaignId = req.query.campaign_id ? Number(req.query.campaign_id) : null;
      const dateFrom = toMysqlDate(req.query.date_from);
      const dateTo = toMysqlDate(req.query.date_to);
      const month = (req.query.month || '').trim(); // YYYY-MM
      const searchTerm = (req.query.search || '').trim();
      const search = searchTerm ? `%${searchTerm}%` : null;

      let countSql = `SELECT COUNT(*) AS total FROM reports r LEFT JOIN campaigns c ON r.campaign_id = c.id LEFT JOIN brands b ON c.brand = b.id`;
      let dataSql = `
        SELECT
          r.id,
          r.report_date,
          r.report_month,
          r.campaign_id,
          r.campaign_name,
          r.campaign_type,
          COALESCE(b.name, r.brand) as brand,
          r.leads,
          r.spent,
          r.cost_per_lead,
          r.created_at,
          r.updated_at
        FROM reports r
        LEFT JOIN campaigns c ON r.campaign_id = c.id
        LEFT JOIN brands b ON c.brand = b.id
      `;

      const where = [];
      const params = [];

      if (campaignId) { where.push('r.campaign_id = ?'); params.push(campaignId); }
      if (dateFrom) { where.push('r.report_date >= ?'); params.push(dateFrom); }
      if (dateTo) { where.push('r.report_date <= ?'); params.push(dateTo); }
      if (month && /^[0-9]{4}-[0-9]{2}$/.test(month)) { where.push('r.report_month = ?'); params.push(month); }
      if (search) {
        where.push('(r.campaign_name LIKE ? OR r.campaign_type LIKE ? OR r.brand LIKE ?)');
        params.push(search, search, search);
      }

      if (where.length) {
        const wc = ' WHERE ' + where.join(' AND ');
        countSql += wc;
        dataSql += wc;
      }

      dataSql += ' ORDER BY r.report_date DESC, r.campaign_id ASC LIMIT ? OFFSET ?';

      const [countRows] = await pool.query(countSql, params);
  const totalCount = Number(countRows?.total || 0);

      const [rows] = await pool.query(dataSql, [...params, Number(limit), Number(offset)]);
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

      return res.status(200).json(createResponse(true, `Retrieved ${rows?.length || 0} report row(s)`, rows || [], meta));
    } catch (error) {
      return handleDbError(error, 'retrieve reports', res);
    }
  },

  // GET /api/reports/:id
  getById: async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!id || id <= 0) return res.status(400).json(createResponse(false, 'Invalid report id'));

      const [rows] = await pool.query(
        `SELECT id, report_date, report_month, campaign_id, campaign_name, campaign_type, brand, leads, facebook_result, zoho_result, spent, cost_per_lead, created_at, updated_at
         FROM reports WHERE id = ?`,
        [id]
      );
      if (!rows || rows.length === 0) return res.status(404).json(createResponse(false, 'Report not found'));

      return res.status(200).json(createResponse(true, 'Report retrieved successfully', rows));
    } catch (error) {
      return handleDbError(error, 'retrieve report', res);
    }
  },

  // POST /api/reports
  // Create a report row manually (rare - mainly for corrections)
  createReport: async (req, res) => {
    try {
      const {
        report_date,
        campaign_id,
        campaign_name = null,
        campaign_type = null,
        brand = null,
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
        return res.status(400).json(createResponse(false, 'report_date must be a valid date (YYYY-MM-DD)'));
      }

      const month = toMonth(dateStr);

      const sql = `
        INSERT INTO reports
          (report_date, report_month, campaign_id, campaign_name, campaign_type, brand,
           leads, facebook_result, zoho_result, spent, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;
      const params = [
        dateStr,
        month,
        Number(campaign_id),
        campaign_name,
        campaign_type,
        brand,
        Number(leads || 0),
        Number(facebook_result || 0),
        Number(zoho_result || 0),
        Number(spent || 0)
      ];

      const [result] = await pool.query(sql, params);
      const newId = result?.insertId;

      const [rows] = await pool.query('SELECT * FROM reports WHERE id = ?', [newId]);
      return res.status(201).json(createResponse(true, 'Report created successfully', rows));
    } catch (error) {
      return handleDbError(error, 'create report', res);
    }
  },

  // PUT /api/reports/:id
  updateReport: async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!id || id <= 0) return res.status(400).json(createResponse(false, 'Invalid report id'));

      const allowed = ['report_date','campaign_id','campaign_name','campaign_type','brand','leads','facebook_result','zoho_result','spent'];
      const updates = {};
      for (const k of allowed) {
        if (Object.prototype.hasOwnProperty.call(req.body, k)) updates[k] = req.body[k];
      }
      if (Object.keys(updates).length === 0) {
        return res.status(400).json(createResponse(false, 'No valid fields provided to update'));
      }

      if (updates.report_date) {
        const dateStr = toMysqlDate(updates.report_date);
        if (!dateStr) return res.status(400).json(createResponse(false, 'report_date must be a valid date (YYYY-MM-DD)'));
        updates.report_date = dateStr;
        updates.report_month = toMonth(dateStr);
      }

      // Normalize numbers
      if (Object.prototype.hasOwnProperty.call(updates,'campaign_id')) updates.campaign_id = Number(updates.campaign_id);
      if (Object.prototype.hasOwnProperty.call(updates,'leads')) updates.leads = Number(updates.leads || 0);
      if (Object.prototype.hasOwnProperty.call(updates,'facebook_result')) updates.facebook_result = Number(updates.facebook_result || 0);
      if (Object.prototype.hasOwnProperty.call(updates,'zoho_result')) updates.zoho_result = Number(updates.zoho_result || 0);
      if (Object.prototype.hasOwnProperty.call(updates,'spent')) updates.spent = Number(updates.spent || 0);

      const setClause = Object.keys(updates).map(k => `${k} = ?`).join(', ');
      const params = [...Object.values(updates), id];

      const [resUp] = await pool.query(`UPDATE reports SET ${setClause}, updated_at = NOW() WHERE id = ?`, params);
      if (!resUp || resUp.affectedRows === 0) {
        return res.status(404).json(createResponse(false, 'Report not found or no changes'));
      }

      const [rows] = await pool.query('SELECT * FROM reports WHERE id = ?', [id]);
      return res.status(200).json(createResponse(true, 'Report updated successfully', rows));
    } catch (error) {
      return handleDbError(error, 'update report', res);
    }
  },

  // DELETE /api/reports/:id
  deleteReport: async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!id || id <= 0) return res.status(400).json(createResponse(false, 'Invalid report id'));

      const [resDel] = await pool.query('DELETE FROM reports WHERE id = ?', [id]);
      if (!resDel || resDel.affectedRows === 0) {
        return res.status(404).json(createResponse(false, 'Report not found'));
      }
      return res.status(200).json(createResponse(true, 'Report deleted successfully'));
    } catch (error) {
      return handleDbError(error, 'delete report', res);
    }
  },

  // POST /api/reports/rebuild-campaign?campaign_id=123&from=YYYY-MM-DD&to=YYYY-MM-DD
  // Rebuild only a single campaign’s rows across a date range.
  rebuildCampaignRange: async (req, res) => {
    const campaignId = Number(req.query.campaign_id || req.body?.campaign_id);
    const fromStr = toMysqlDate(req.query.from || req.body?.from);
    const toStr = toMysqlDate(req.query.to || req.body?.to);

    if (!campaignId || campaignId <= 0) {
      return res.status(400).json(createResponse(false, 'campaign_id is required and must be positive'));
    }
    if (!fromStr || !toStr || new Date(fromStr) > new Date(toStr)) {
      return res.status(400).json(createResponse(false, 'Valid from and to dates (YYYY-MM-DD) are required, and from <= to'));
    }

    // Constrain aggregation to a campaign
    const aggSql = buildAggregationForDate.replace('WHERE cd.data_date = ?', 'WHERE cd.data_date = ? AND cd.campaign_id = ?');

    try {
      let totalUpserts = 0;
      const start = new Date(fromStr);
      const end = new Date(toStr);

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const day = toMysqlDate(d);
        const [rows] = await pool.query(aggSql, [day, campaignId]);
        if (!rows || rows.length === 0) continue;

        for (const r of rows) {
          const params = [
            r.report_date,
            r.report_month,
            Number(r.campaign_id),
            r.campaign_name || null,
            r.campaign_type || null,
            r.brand_name || null,
            Number(r.leads || 0),
            Number(r.facebook_result || 0),
            Number(r.zoho_result || 0),
            Number(r.spent || 0)
          ];
          const [resUp] = await pool.query(upsertReportRowSql, params);
          totalUpserts += resUp?.affectedRows ? 1 : 0;
        }
      }

      return res.status(200).json(createResponse(true, 'Campaign reports rebuilt', { campaign_id: campaignId, from: fromStr, to: toStr, upserts: totalUpserts }));
    } catch (error) {
      return handleDbError(error, 'rebuild campaign reports', res);
    }
  },

  // GET /api/reports/generate
  // Generate comprehensive reports with filters (from campaign_data table)
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

      // Get detailed report data from campaign_data with campaign info
      const reportSql = `
        SELECT
          cd.id,
          cd.data_date as report_date,
          DATE_FORMAT(cd.data_date, '%Y-%m') as report_month,
          cd.campaign_id,
          c.name as campaign_name,
          ct.type_name as campaign_type,
          b.name as brand,
          cd.facebook_result,
          cd.xoho_result as zoho_result,
          cd.spent,
          cd.card_name,
          (cd.facebook_result + cd.xoho_result) as leads,
          CASE 
            WHEN (cd.facebook_result + cd.xoho_result) > 0 
            THEN cd.spent / (cd.facebook_result + cd.xoho_result)
            ELSE NULL 
          END as cost_per_lead,
          (
            SELECT SUM(cd2.spent) 
            FROM campaign_data cd2 
            WHERE cd2.campaign_id = cd.campaign_id
            AND cd2.data_date >= ?
            AND cd2.data_date <= ?
          ) as total_campaign_spent
        FROM campaign_data cd
        LEFT JOIN campaigns c ON cd.campaign_id = c.id
        LEFT JOIN campaign_types ct ON c.campaign_type_id = ct.id
        LEFT JOIN brands b ON c.brand = b.id
        ${whereClause}
        ORDER BY cd.data_date DESC, c.name ASC
      `;

      // Get summary statistics
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
          MIN(cd.data_date) as date_from,
          MAX(cd.data_date) as date_to
        FROM campaign_data cd
        LEFT JOIN campaigns c ON cd.campaign_id = c.id
        LEFT JOIN brands b ON c.brand = b.id
        ${whereClause}
      `;

      // Get brand breakdown
      const brandBreakdownSql = `
        SELECT
          b.name as brand,
          COUNT(DISTINCT cd.campaign_id) as campaigns_count,
          COUNT(*) as total_records,
          SUM(cd.facebook_result + cd.xoho_result) as total_results,
          SUM(cd.spent) as total_spent,
          AVG(CASE 
            WHEN (cd.facebook_result + cd.xoho_result) > 0 
            THEN cd.spent / (cd.facebook_result + cd.xoho_result)
            ELSE NULL 
          END) as avg_cost_per_result
        FROM campaign_data cd
        LEFT JOIN campaigns c ON cd.campaign_id = c.id
        LEFT JOIN brands b ON c.brand = b.id
        ${whereClause}
        GROUP BY b.name
        ORDER BY total_spent DESC
      `;

      // Get campaign breakdown
      const campaignBreakdownSql = `
        SELECT
          cd.campaign_id,
          c.name as campaign_name,
          b.name as brand,
          COUNT(*) as total_records,
          SUM(cd.facebook_result) as total_facebook_results,
          SUM(cd.xoho_result) as total_zoho_results,
          SUM(cd.facebook_result + cd.xoho_result) as total_results,
          SUM(cd.spent) as total_spent,
          AVG(CASE 
            WHEN (cd.facebook_result + cd.xoho_result) > 0 
            THEN cd.spent / (cd.facebook_result + cd.xoho_result)
            ELSE NULL 
          END) as avg_cost_per_result
        FROM campaign_data cd
        LEFT JOIN campaigns c ON cd.campaign_id = c.id
        LEFT JOIN brands b ON c.brand = b.id
        ${whereClause}
        GROUP BY cd.campaign_id, c.name, b.name
        ORDER BY total_spent DESC
      `;

      // Add dateFrom and dateTo again for the subquery in total_campaign_spent
      const reportParams = [...params, dateFrom, dateTo];
      const [reportData] = await pool.query(reportSql, reportParams);
      const [summaryData] = await pool.query(summarySql, params);
      const [brandBreakdown] = await pool.query(brandBreakdownSql, params);
      const [campaignBreakdown] = await pool.query(campaignBreakdownSql, params);

      // Check if we have any data
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
            dateRange: {
              from: dateFrom,
              to: dateTo
            }
          },
          brandBreakdown: [],
          campaignBreakdown: [],
          reports: [],
          filters: {
            dateFrom,
            dateTo,
            ...(brand && { brand }),
            ...(campaignId && { campaignId })
          },
          message: 'No data found for the selected date range'
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
            from: summary.date_from || dateFrom,
            to: summary.date_to || dateTo
          }
        },
        brandBreakdown: brandBreakdown || [],
        campaignBreakdown: campaignBreakdown || [],
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

  // GET /api/reports/filters
  // Get available filter options for the Reports module (from campaigns table)
  getFilterOptions: async (req, res) => {
    try {
      // Get all available brands from campaigns table
      const [brandsData] = await pool.query(`
        SELECT DISTINCT b.name as brand
        FROM campaigns c
        LEFT JOIN brands b ON c.brand = b.id
        WHERE b.name IS NOT NULL AND b.name != '' AND c.is_enabled = 1 AND b.is_active = 1
        ORDER BY b.name ASC
      `);

      // Get all available campaigns from campaigns table
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

      // Get date ranges from campaign_data (earliest and latest dates with actual data)
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

  // GET /api/reports/dashboard
  // Get dashboard statistics for overview
  getDashboardStats: async (req, res) => {
    try {
      // Get current month stats
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      
      const [currentMonthStats] = await pool.query(`
        SELECT
          COUNT(*) as campaigns_count,
          SUM(r.leads) as total_leads,
          SUM(r.spent) as total_spent,
          AVG(r.cost_per_lead) as avg_cost_per_lead
        FROM reports r
        WHERE r.report_month = ?
      `, [currentMonth]);

      // Get top performing brands (this month)
      const [topBrands] = await pool.query(`
        SELECT
          r.brand,
          SUM(r.leads) as total_leads,
          SUM(r.spent) as total_spent,
          AVG(r.cost_per_lead) as avg_cost_per_lead
        FROM reports r
        WHERE r.report_month = ? AND r.brand IS NOT NULL
        GROUP BY r.brand
        ORDER BY total_leads DESC
        LIMIT 5
      `, [currentMonth]);

      // Get recent campaign performance (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoStr = toMysqlDate(sevenDaysAgo);

      const [recentPerformance] = await pool.query(`
        SELECT
          DATE(r.report_date) as date,
          SUM(r.leads) as daily_leads,
          SUM(r.spent) as daily_spent
        FROM reports r
        WHERE r.report_date >= ?
        GROUP BY DATE(r.report_date)
        ORDER BY r.report_date DESC
      `, [sevenDaysAgoStr]);

      const currentStats = currentMonthStats[0] || {};
      
      const dashboardData = {
        currentMonth: {
          month: currentMonth,
          campaignsCount: Number(currentStats.campaigns_count || 0),
          totalLeads: Number(currentStats.total_leads || 0),
          totalSpent: Number(currentStats.total_spent || 0),
          avgCostPerLead: Number(currentStats.avg_cost_per_lead || 0)
        },
        topBrands: topBrands || [],
        recentPerformance: recentPerformance || []
      };

      return res.status(200).json(createResponse(true, 'Dashboard statistics retrieved successfully', dashboardData));
    } catch (error) {
      return handleDbError(error, 'get dashboard statistics', res);
    }
  },

  // GET /api/reports/charts
  // Returns normalized datasets for charts between date_from and date_to
  getChartData: async (req, res) => {
    try {
      const dateFrom = toMysqlDate(req.query.date_from);
      const dateTo = toMysqlDate(req.query.date_to);
      const brand = (req.query.brand || '').trim();
      const campaignId = req.query.campaign_id ? Number(req.query.campaign_id) : null;

      if (!dateFrom || !dateTo) {
        return res.status(400).json(createResponse(false, 'date_from and date_to are required (YYYY-MM-DD)'));
      }

      const where = [];
      const params = [];
      where.push('r.report_date >= ?', 'r.report_date <= ?');
      params.push(dateFrom, dateTo);
      if (brand) { where.push('r.brand = ?'); params.push(brand); }
      if (campaignId) { where.push('r.campaign_id = ?'); params.push(campaignId); }
      const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

      // Time series by day
      const [seriesRows] = await pool.query(`
        SELECT DATE(r.report_date) as date,
               SUM(r.leads) as leads,
               SUM(r.spent) as spent
        FROM reports r
        ${whereClause}
        GROUP BY DATE(r.report_date)
        ORDER BY DATE(r.report_date) ASC
      `, params);

      // Brand breakdown
      const [brandRows] = await pool.query(`
        SELECT COALESCE(r.brand, 'Unknown') as brand,
               SUM(r.leads) as leads,
               SUM(r.spent) as spent
        FROM reports r
        ${whereClause}
        GROUP BY r.brand
        ORDER BY SUM(r.leads) DESC
      `, params);

      // Campaign top 10
      const [campaignRows] = await pool.query(`
        SELECT r.campaign_id, r.campaign_name,
               SUM(r.leads) as leads,
               SUM(r.spent) as spent,
               AVG(r.cost_per_lead) as cpl
        FROM reports r
        ${whereClause}
        GROUP BY r.campaign_id, r.campaign_name
        ORDER BY SUM(r.leads) DESC
        LIMIT 10
      `, params);

      return res.status(200).json(createResponse(true, 'Chart data', {
        dateRange: { from: dateFrom, to: dateTo },
        series: seriesRows || [],
        byBrand: brandRows || [],
        topCampaigns: campaignRows || []
      }));
    } catch (error) {
      return handleDbError(error, 'get chart data', res);
    }
  }
};

module.exports = reportsController;
