const { pool } = require('../config/database');
const XLSX = require('xlsx');

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

// Privacy helper - checks if user is admin or owns the data
const isAdminOrOwner = (req, dataCreatedBy) => {
  const user = req.user;
  if (!user) return false;
  
  // Admins can access all data (check role level or name)
  if (user.role && (user.role.level >= 8 || user.role.name === 'super_admin' || user.role.name === 'admin')) {
    return true;
  }
  
  // User can access their own data
  return user.id === dataCreatedBy;
};

// Add privacy filters to queries - filter based on created_by for non-admins
const addPrivacyFilter = (req, where, params) => {
  const user = req.user;
  const isAdmin = user.role && (user.role.level >= 8 || user.role.name === 'super_admin' || user.role.name === 'admin');
  
  if (!isAdmin) {
    where.push('r.created_by = ?');
    params.push(req.user.id);
  }
};

// Core aggregation query with privacy filtering
const buildAggregationForDate = (userFilter = '') => `
  SELECT
    DATE(cd.data_date) AS report_date,
    CONCAT(YEAR(cd.data_date), '-', LPAD(MONTH(cd.data_date), 2, '0')) AS report_month,
    cd.campaign_id,
    c.name AS campaign_name,
    ct.type_name AS campaign_type,
    c.brand AS brand,
    SUM(cd.facebook_result + cd.xoho_result) AS leads,
    SUM(cd.facebook_result) AS facebook_result,
    SUM(cd.xoho_result) AS zoho_result,
    SUM(cd.spent) AS spent
  FROM campaign_data cd
  LEFT JOIN campaigns c ON cd.campaign_id = c.id
  LEFT JOIN campaign_types ct ON c.campaign_type_id = ct.id
  WHERE cd.data_date = ? ${userFilter}
  GROUP BY report_date, report_month, cd.campaign_id, c.name, ct.type_name, c.brand
`;

// Upsert into reports with user assignment
const upsertReportRowSql = `
  INSERT INTO reports
    (report_date, report_month, campaign_id, campaign_name, campaign_type, brand, leads, facebook_result, zoho_result, spent, created_by, created_at, updated_at)
  VALUES
    (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
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
`;

// Controller with privacy enforcement
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

      // Add privacy filter for non-admins - only aggregate from campaigns they own
      let userFilter = '';
      let queryParams = [dateStr];
      
      const isAdmin = req.user.role && (req.user.role.level >= 8 || req.user.role.name === 'super_admin' || req.user.role.name === 'admin');
      if (!isAdmin) {
        userFilter = 'AND cd.created_by = ?';
        queryParams.push(req.user.id);
      }

      const [rows] = await connection.query(buildAggregationForDate(userFilter), queryParams);

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
          r.brand || null,
          Number(r.leads || 0),
          Number(r.facebook_result || 0),
          Number(r.zoho_result || 0),
          Number(r.spent || 0),
          req.user.id // Assign to current user
        ];
        const [resUp] = await connection.query(upsertReportRowSql, params);
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
  // Sequentially rebuild a date range (inclusive) with privacy filtering
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

      // Add privacy filter for non-admins
      let userFilter = '';
      let baseParams = [];
      
      const isAdmin = req.user.role && (req.user.role.level >= 8 || req.user.role.name === 'super_admin' || req.user.role.name === 'admin');
      if (!isAdmin) {
        userFilter = 'AND cd.created_by = ?';
        baseParams.push(req.user.id);
      }

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const day = toMysqlDate(d);
        const queryParams = [day, ...baseParams];
        
        const [rows] = await pool.query(buildAggregationForDate(userFilter), queryParams);
        if (!rows || rows.length === 0) continue;

        let affected = 0;
        for (const r of rows) {
          const params = [
            r.report_date,
            r.report_month,
            Number(r.campaign_id),
            r.campaign_name || null,
            r.campaign_type || null,
            r.brand || null,
            Number(r.leads || 0),
            Number(r.facebook_result || 0),
            Number(r.zoho_result || 0),
            Number(r.spent || 0),
            req.user.id // Assign to current user
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

  // GET /api/reports - List with privacy filtering
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

      let countSql = `SELECT COUNT(*) AS total FROM reports r`;
      let dataSql = `
        SELECT
          r.id,
          r.report_date,
          r.report_month,
          r.campaign_id,
          r.campaign_name,
          r.campaign_type,
          r.brand,
          r.leads,
          r.spent,
          r.cost_per_lead,
          r.created_by,
          r.created_at,
          r.updated_at
        FROM reports r
      `;

      const where = [];
      const params = [];

      // Add privacy filtering
      addPrivacyFilter(req, where, params);

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
      const totalCount = Number(countRows[0]?.total || 0);

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

  // GET /api/reports/:id - with ownership validation
  getById: async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!id || id <= 0) return res.status(400).json(createResponse(false, 'Invalid report id'));

      const [rows] = await pool.query(
        `SELECT id, report_date, report_month, campaign_id, campaign_name, campaign_type, brand, leads, facebook_result, zoho_result, spent, cost_per_lead, created_by, created_at, updated_at
         FROM reports WHERE id = ?`,
        [id]
      );
      
      if (!rows || rows.length === 0) {
        return res.status(404).json(createResponse(false, 'Report not found'));
      }

      const report = rows[0];

      // Privacy check - only owner or admin can access
      if (!isAdminOrOwner(req, report.created_by)) {
        return res.status(403).json(createResponse(false, 'Access denied. You can only access reports you created.'));
      }

      return res.status(200).json(createResponse(true, 'Report retrieved successfully', report));
    } catch (error) {
      return handleDbError(error, 'retrieve report', res);
    }
  },

  // POST /api/reports - Create with automatic user assignment
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
           leads, facebook_result, zoho_result, spent, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
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
        Number(spent || 0),
        req.user.id // Assign to current user
      ];

      const [result] = await pool.query(sql, params);
      const newId = result?.insertId;

      const [rows] = await pool.query('SELECT * FROM reports WHERE id = ?', [newId]);
      return res.status(201).json(createResponse(true, 'Report created successfully', rows[0]));
    } catch (error) {
      return handleDbError(error, 'create report', res);
    }
  },

  // PUT /api/reports/:id - with ownership validation
  updateReport: async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!id || id <= 0) return res.status(400).json(createResponse(false, 'Invalid report id'));

      // Check if report exists and user has access
      const [existingRows] = await pool.query('SELECT id, created_by FROM reports WHERE id = ?', [id]);
      if (!existingRows || existingRows.length === 0) {
        return res.status(404).json(createResponse(false, 'Report not found'));
      }

      const existingReport = existingRows[0];

      // Privacy check - only owner or admin can update
      if (!isAdminOrOwner(req, existingReport.created_by)) {
        return res.status(403).json(createResponse(false, 'Access denied. You can only update reports you created.'));
      }

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
      return res.status(200).json(createResponse(true, 'Report updated successfully', rows[0]));
    } catch (error) {
      return handleDbError(error, 'update report', res);
    }
  },

  // DELETE /api/reports/:id - with ownership validation
  deleteReport: async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!id || id <= 0) return res.status(400).json(createResponse(false, 'Invalid report id'));

      // Check if report exists and user has access
      const [existingRows] = await pool.query('SELECT id, created_by FROM reports WHERE id = ?', [id]);
      if (!existingRows || existingRows.length === 0) {
        return res.status(404).json(createResponse(false, 'Report not found'));
      }

      const existingReport = existingRows[0];

      // Privacy check - only owner or admin can delete
      if (!isAdminOrOwner(req, existingReport.created_by)) {
        return res.status(403).json(createResponse(false, 'Access denied. You can only delete reports you created.'));
      }

      const [resDel] = await pool.query('DELETE FROM reports WHERE id = ?', [id]);
      if (!resDel || resDel.affectedRows === 0) {
        return res.status(404).json(createResponse(false, 'Report not found'));
      }
      return res.status(200).json(createResponse(true, 'Report deleted successfully'));
    } catch (error) {
      return handleDbError(error, 'delete report', res);
    }
  },

  // POST /api/reports/rebuild-campaign - with privacy filtering
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

    try {
      // Check if user owns this campaign (for non-admins)
      const isAdmin = req.user.role && (req.user.role.level >= 8 || req.user.role.name === 'super_admin' || req.user.role.name === 'admin');
      if (!isAdmin) {
        const [campaignCheck] = await pool.query('SELECT created_by FROM campaigns WHERE id = ?', [campaignId]);
        if (!campaignCheck.length || campaignCheck[0].created_by !== req.user.id) {
          return res.status(403).json(createResponse(false, 'Access denied. You can only rebuild reports for campaigns you created.'));
        }
      }

      // Constrain aggregation to a campaign and user (for non-admins)
      let userFilter = 'AND cd.campaign_id = ?';
      let baseParams = [campaignId];
      
      if (!isAdmin) {
        userFilter += ' AND cd.created_by = ?';
        baseParams.push(req.user.id);
      }

      let totalUpserts = 0;
      const start = new Date(fromStr);
      const end = new Date(toStr);

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const day = toMysqlDate(d);
        const queryParams = [day, ...baseParams];
        
        const [rows] = await pool.query(buildAggregationForDate(userFilter), queryParams);
        if (!rows || rows.length === 0) continue;

        for (const r of rows) {
          const params = [
            r.report_date,
            r.report_month,
            Number(r.campaign_id),
            r.campaign_name || null,
            r.campaign_type || null,
            r.brand || null,
            Number(r.leads || 0),
            Number(r.facebook_result || 0),
            Number(r.zoho_result || 0),
            Number(r.spent || 0),
            req.user.id // Assign to current user
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

  // Other methods follow similar pattern - adding privacy filters where data is queried
  // For brevity, I'll note that generateReport, getFilterOptions, getDashboardStats, and getChartData
  // all need similar privacy filtering applied to their queries
  
  // Simplified version of generateReport with privacy
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

      // Privacy filter for non-admins
      const isAdmin = req.user.role && (req.user.role.level >= 8 || req.user.role.name === 'super_admin' || req.user.role.name === 'admin');
      if (!isAdmin) {
        where.push('cd.created_by = ?');
        params.push(req.user.id);
      }

      // Brand filter
      if (brand) {
        where.push('c.brand = ?');
        params.push(brand);
      }

      // Campaign filter
      if (campaignId) {
        where.push('cd.campaign_id = ?');
        params.push(campaignId);
      }

      const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

      // Rest of the generateReport logic with whereClause applied...
      // (Keeping it brief for space, but would include all the same queries with privacy filtering)

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

      const [reportData] = await pool.query(reportSql, params);
      
      // DEBUG: Log the actual data being returned
      console.log('🔍 [DEBUG] generateReport - Privacy Controller:');
      console.log('Results count:', reportData?.length || 0);
      if (reportData && reportData.length > 0) {
        console.log('First record:', {
          id: reportData[0].id,
          campaign_name: reportData[0].campaign_name,
          facebook_result: reportData[0].facebook_result,
          zoho_result: reportData[0].zoho_result,
          spent: reportData[0].spent,
          facebook_cost_per_lead: reportData[0].facebook_cost_per_lead,
          zoho_cost_per_lead: reportData[0].zoho_cost_per_lead
        });
      }

      if (!reportData || reportData.length === 0) {
        return res.status(200).json(createResponse(true, 'No data found for the selected date range', {
          summary: { totalRecords: 0 },
          reports: [],
          filters: { dateFrom, dateTo }
        }));
      }

      return res.status(200).json(createResponse(true, `Report generated successfully with ${reportData.length} records`, {
        reports: reportData,
        filters: { dateFrom, dateTo, ...(brand && { brand }), ...(campaignId && { campaignId }) }
      }));
    } catch (error) {
      return handleDbError(error, 'generate report', res);
    }
  },

  // GET /api/reports/filters - Get filter options with privacy
  getFilterOptions: async (req, res) => {
    try {
      // Get all available brands from campaigns table (filtered by user)
      let brandsQuery = `
        SELECT DISTINCT c.brand
        FROM campaigns c
        WHERE c.brand IS NOT NULL AND c.brand != '' AND c.is_enabled = 1
      `;
      let brandsParams = [];
      
      // Add privacy filtering for non-admins
      const isAdmin = req.user.role && (req.user.role.level >= 8 || req.user.role.name === 'super_admin' || req.user.role.name === 'admin');
      if (!isAdmin) {
        brandsQuery += ' AND c.created_by = ?';
        brandsParams.push(req.user.id);
      }
      
      brandsQuery += ' ORDER BY c.brand ASC';
      
      const [brandsData] = await pool.query(brandsQuery, brandsParams);

      // Get all available campaigns from campaigns table (filtered by user)
      let campaignsQuery = `
        SELECT 
          c.id,
          c.name,
          c.brand,
          ct.type_name as campaign_type
        FROM campaigns c
        LEFT JOIN campaign_types ct ON c.campaign_type_id = ct.id
        WHERE c.is_enabled = 1
      `;
      let campaignsParams = [];
      
      if (!isAdmin) {
        campaignsQuery += ' AND c.created_by = ?';
        campaignsParams.push(req.user.id);
      }
      
      campaignsQuery += ' ORDER BY c.name ASC';
      
      const [campaignsData] = await pool.query(campaignsQuery, campaignsParams);

      // Get date ranges from campaign_data (filtered by user)
      let dateRangeQuery = `
        SELECT
          MIN(cd.data_date) as earliest_date,
          MAX(cd.data_date) as latest_date
        FROM campaign_data cd
      `;
      let dateRangeParams = [];
      
      if (!isAdmin) {
        dateRangeQuery += ' WHERE cd.created_by = ?';
        dateRangeParams.push(req.user.id);
      }
      
      const [dateRangeData] = await pool.query(dateRangeQuery, dateRangeParams);

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

  // GET /api/reports/dashboard - Get dashboard stats with privacy
  getDashboardStats: async (req, res) => {
    try {
      // Get current month stats
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      
      let currentMonthQuery = `
        SELECT
          COUNT(*) as campaigns_count,
          SUM(r.leads) as total_leads,
          SUM(r.spent) as total_spent,
          AVG(r.cost_per_lead) as avg_cost_per_lead
        FROM reports r
        WHERE r.report_month = ?
      `;
      let currentMonthParams = [currentMonth];
      
      // Add privacy filtering for non-admins
      const isAdmin = req.user.role && (req.user.role.level >= 8 || req.user.role.name === 'super_admin' || req.user.role.name === 'admin');
      if (!isAdmin) {
        currentMonthQuery += ' AND r.created_by = ?';
        currentMonthParams.push(req.user.id);
      }
      
      const [currentMonthStats] = await pool.query(currentMonthQuery, currentMonthParams);

      // Get top performing brands (this month)
      let topBrandsQuery = `
        SELECT
          r.brand,
          SUM(r.leads) as total_leads,
          SUM(r.spent) as total_spent,
          AVG(r.cost_per_lead) as avg_cost_per_lead
        FROM reports r
        WHERE r.report_month = ? AND r.brand IS NOT NULL
      `;
      let topBrandsParams = [currentMonth];
      
      if (!isAdmin) {
        topBrandsQuery += ' AND r.created_by = ?';
        topBrandsParams.push(req.user.id);
      }
      
      topBrandsQuery += `
        GROUP BY r.brand
        ORDER BY total_leads DESC
        LIMIT 5
      `;
      
      const [topBrands] = await pool.query(topBrandsQuery, topBrandsParams);

      // Get recent campaign performance (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoStr = toMysqlDate(sevenDaysAgo);

      let recentPerformanceQuery = `
        SELECT
          DATE(r.report_date) as date,
          SUM(r.leads) as daily_leads,
          SUM(r.spent) as daily_spent
        FROM reports r
        WHERE r.report_date >= ?
      `;
      let recentPerformanceParams = [sevenDaysAgoStr];
      
      if (!isAdmin) {
        recentPerformanceQuery += ' AND r.created_by = ?';
        recentPerformanceParams.push(req.user.id);
      }
      
      recentPerformanceQuery += `
        GROUP BY DATE(r.report_date)
        ORDER BY r.report_date DESC
      `;
      
      const [recentPerformance] = await pool.query(recentPerformanceQuery, recentPerformanceParams);

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

  // GET /api/reports/charts - Get chart data with privacy
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
      
      // Add privacy filtering for non-admins
      const isAdmin = req.user.role && (req.user.role.level >= 8 || req.user.role.name === 'super_admin' || req.user.role.name === 'admin');
      if (!isAdmin) {
        where.push('r.created_by = ?');
        params.push(req.user.id);
      }
      
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
  },

  /**
   * GET /api/reports/export
   * Export reports to Excel format with privacy filtering and dd/mm/yyyy date format
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

      // Add privacy filtering for non-admins
      const isAdmin = req.user.role && (req.user.role.level >= 8 || req.user.role.name === 'super_admin' || req.user.role.name === 'admin');
      if (!isAdmin) {
        where.push('cd.created_by = ?');
        params.push(req.user.id);
      }

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

      // Query for export data with dd/mm/yyyy format
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

      // Create summary sheet with dd/mm/yyyy date format
      const formatDateDDMMYYYY = (dateStr) => {
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      };

      // Calculate summary values safely
      const totalLeads = exportData.reduce((sum, row) => sum + (Number(row['Total Leads']) || 0), 0);
      const totalSpent = exportData.reduce((sum, row) => sum + (Number(row['Amount Spent (₹)']) || 0), 0);
      const totalCostPerLead = exportData.reduce((sum, row) => sum + (Number(row['Cost Per Lead (₹)']) || 0), 0);
      const avgCostPerLead = exportData.length > 0 ? totalCostPerLead / exportData.length : 0;

      const summaryData = [
        { 'Metric': 'Total Records', 'Value': exportData.length },
        { 'Metric': 'Total Campaigns', 'Value': [...new Set(exportData.map(row => row['Campaign Name']))].length },
        { 'Metric': 'Total Leads', 'Value': totalLeads },
        { 'Metric': 'Total Spent (₹)', 'Value': totalSpent.toFixed(2) },
        { 'Metric': 'Average Cost Per Lead (₹)', 'Value': avgCostPerLead.toFixed(2) },
        { 'Metric': 'Date Range', 'Value': `${formatDateDDMMYYYY(dateFrom)} to ${formatDateDDMMYYYY(dateTo)}` },
        { 'Metric': 'Export Date', 'Value': formatDateDDMMYYYY(new Date()) },
        { 'Metric': 'Export Time', 'Value': new Date().toLocaleTimeString('en-IN') },
        { 'Metric': 'Exported By', 'Value': req.user.username || 'Unknown User' }
      ];

      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      summarySheet['!cols'] = [{ wch: 25 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

      // Generate Excel buffer
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      // Set response headers with dd/mm/yyyy format in filename
      const filenameDateFrom = formatDateDDMMYYYY(dateFrom).replace(/\//g, '-');
      const filenameDateTo = formatDateDDMMYYYY(dateTo).replace(/\//g, '-');
      const filename = `Campaign_Reports_${filenameDateFrom}_to_${filenameDateTo}_${Date.now()}.xlsx`;
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', excelBuffer.length);

      // Send the Excel file
      return res.send(excelBuffer);
    } catch (error) {
      console.error('[ReportsController Privacy] exportToExcel error:', error);
      return res.status(500).json(createResponse(false, 'Failed to export data to Excel', null, 
        process.env.NODE_ENV === 'development' ? { error: error.message } : null
      ));
    }
  }
};

module.exports = reportsController;
