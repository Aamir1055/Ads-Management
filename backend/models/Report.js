const { pool } = require('../config/database');

class Report {
  constructor(data = {}) {
    this.id = data.id || null;
    this.report_date = data.report_date || null;
    this.report_month = data.report_month || null;
    this.campaign_id = data.campaign_id || null;
    this.campaign_name = data.campaign_name || null;
    this.campaign_type = data.campaign_type || null;
    this.brand = data.brand || null;
    this.brand_name = data.brand_name || null;
    this.leads = data.leads || 0;
    this.facebook_result = data.facebook_result || 0;
    this.zoho_result = data.zoho_result || 0;
    this.spent = data.spent || 0.00;
    this.facebook_cost_per_lead = data.facebook_cost_per_lead || null;
    this.zoho_cost_per_lead = data.zoho_cost_per_lead || null;
    this.cost_per_lead = data.cost_per_lead || null;
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
    this.created_by = data.created_by || null;
  }

  // Get all reports with pagination and filters (filtered by user)
  static async findAll(filters = {}, pagination = { page: 1, limit: 20 }, userId = null, userRole = null) {
    try {
      console.log(`🔍 [Report.findAll] Called with userId=${userId}, userRole=${userRole}`);
      
      const { page, limit } = pagination;
      const offset = (page - 1) * limit;

      let whereClause = 'WHERE 1=1';
      const params = [];

      // Apply user filtering for non-super-admin users - filter by campaign creator, not report creator
      if (userRole !== 'super_admin' && userId) {
        console.log(`🔍 [Report.findAll] Applying user filter: c.created_by = ${userId}`);
        whereClause += ' AND c.created_by = ?';
        params.push(userId);
      } else {
        console.log(`🔍 [Report.findAll] No user filter applied (super_admin or no userId)`);
      }

      // Apply filters
      if (filters.campaign_id) {
        whereClause += ' AND r.campaign_id = ?';
        params.push(filters.campaign_id);
      }

      if (filters.brand_id) {
        whereClause += ' AND r.brand = ?';
        params.push(filters.brand_id);
      }

      if (filters.campaign_name) {
        whereClause += ' AND r.campaign_name = ?';
        params.push(filters.campaign_name);
      }

      if (filters.brand_name) {
        whereClause += ' AND r.brand_name = ?';
        params.push(filters.brand_name);
      }

      if (filters.date_from) {
        whereClause += ' AND r.report_date >= ?';
        params.push(filters.date_from);
      }

      if (filters.date_to) {
        whereClause += ' AND r.report_date <= ?';
        params.push(filters.date_to);
      }

      if (filters.report_month) {
        whereClause += ' AND r.report_month = ?';
        params.push(filters.report_month);
      }

      const query = `
        SELECT 
          r.*,
          b.name as brand_table_name,
          c.name as campaign_table_name,
          ct.type_name as campaign_type_name
        FROM reports r
        LEFT JOIN brands b ON r.brand = b.id
        LEFT JOIN campaigns c ON r.campaign_id = c.id
        LEFT JOIN campaign_types ct ON c.campaign_type_id = ct.id
        ${whereClause}
        ORDER BY r.report_date DESC, r.id DESC
        LIMIT ? OFFSET ?
      `;

      params.push(limit, offset);
      
      console.log(`🔍 [Report.findAll] Final query:`, query);
      console.log(`🔍 [Report.findAll] Query params:`, params);
      
      const [rows] = await pool.execute(query, params);
      
      console.log(`🔍 [Report.findAll] Query returned ${rows.length} rows`);
      
      return rows.map(row => new Report(row));
    } catch (error) {
      console.error('Error in Report.findAll:', error);
      throw new Error('Failed to fetch reports: ' + error.message);
    }
  }

  // Get report count with filters (filtered by user)
  static async getCount(filters = {}, userId = null, userRole = null) {
    try {
      let whereClause = 'WHERE 1=1';
      const params = [];

      // Apply user filtering for non-super-admin users - filter by campaign creator, not report creator
      if (userRole !== 'super_admin' && userId) {
        whereClause += ' AND c.created_by = ?';
        params.push(userId);
      }

      // Apply same filters as findAll
      if (filters.campaign_id) {
        whereClause += ' AND r.campaign_id = ?';
        params.push(filters.campaign_id);
      }

      if (filters.brand_id) {
        whereClause += ' AND r.brand = ?';
        params.push(filters.brand_id);
      }

      if (filters.campaign_name) {
        whereClause += ' AND r.campaign_name = ?';
        params.push(filters.campaign_name);
      }

      if (filters.brand_name) {
        whereClause += ' AND r.brand_name = ?';
        params.push(filters.brand_name);
      }

      if (filters.date_from) {
        whereClause += ' AND r.report_date >= ?';
        params.push(filters.date_from);
      }

      if (filters.date_to) {
        whereClause += ' AND r.report_date <= ?';
        params.push(filters.date_to);
      }

      if (filters.report_month) {
        whereClause += ' AND r.report_month = ?';
        params.push(filters.report_month);
      }

      const query = `
        SELECT COUNT(*) as total 
        FROM reports r
        LEFT JOIN campaigns c ON r.campaign_id = c.id
        ${whereClause}
      `;
      const [rows] = await pool.execute(query, params);
      
      return rows[0].total;
    } catch (error) {
      console.error('Error in Report.getCount:', error);
      throw new Error('Failed to get report count: ' + error.message);
    }
  }

  // Find report by ID
  static async findById(id, userId = null, userRole = null) {
    try {
      let query = `
        SELECT 
          r.*,
          b.name as brand_table_name,
          c.name as campaign_table_name,
          ct.type_name as campaign_type_name
        FROM reports r
        LEFT JOIN brands b ON r.brand = b.id
        LEFT JOIN campaigns c ON r.campaign_id = c.id
        LEFT JOIN campaign_types ct ON c.campaign_type_id = ct.id
        WHERE r.id = ?
      `;

      const params = [id];

      // Add user filtering for non-super-admin users - filter by campaign creator, not report creator
      if (userRole !== 'super_admin' && userId) {
        query += ' AND c.created_by = ?';
        params.push(userId);
      }

      const [rows] = await pool.execute(query, params);
      
      if (rows.length === 0) {
        return null;
      }

      return new Report(rows[0]);
    } catch (error) {
      console.error('Error in Report.findById:', error);
      throw new Error('Failed to fetch report: ' + error.message);
    }
  }

  // Create new report entry
  static async create(data) {
    try {
      const reportMonth = data.report_date ? data.report_date.substring(0, 7) : null;

      const query = `
        INSERT INTO reports (
          report_date, report_month, campaign_id, campaign_name, campaign_type,
          brand, brand_name, leads, facebook_result, zoho_result, spent, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        data.report_date,
        reportMonth,
        data.campaign_id,
        data.campaign_name || null,
        data.campaign_type || null,
        data.brand || null,
        data.brand_name || null,
        parseInt(data.leads) || 0,
        parseInt(data.facebook_result) || 0,
        parseInt(data.zoho_result) || 0,
        parseFloat(data.spent) || 0.00,
        data.created_by || null
      ];

      const [result] = await pool.execute(query, params);
      
      if (result.insertId) {
        return await this.findById(result.insertId);
      }

      throw new Error('Failed to create report');
    } catch (error) {
      console.error('Error in Report.create:', error);
      throw new Error('Failed to create report: ' + error.message);
    }
  }

  // Update existing report
  static async update(id, data) {
    try {
      const updates = [];
      const params = [];

      if (data.report_date !== undefined) {
        updates.push('report_date = ?', 'report_month = ?');
        params.push(data.report_date, data.report_date.substring(0, 7));
      }

      if (data.campaign_name !== undefined) {
        updates.push('campaign_name = ?');
        params.push(data.campaign_name);
      }

      if (data.campaign_type !== undefined) {
        updates.push('campaign_type = ?');
        params.push(data.campaign_type);
      }

      if (data.brand !== undefined) {
        updates.push('brand = ?');
        params.push(data.brand);
      }

      if (data.brand_name !== undefined) {
        updates.push('brand_name = ?');
        params.push(data.brand_name);
      }

      if (data.leads !== undefined) {
        updates.push('leads = ?');
        params.push(parseInt(data.leads) || 0);
      }

      if (data.facebook_result !== undefined) {
        updates.push('facebook_result = ?');
        params.push(parseInt(data.facebook_result) || 0);
      }

      if (data.zoho_result !== undefined) {
        updates.push('zoho_result = ?');
        params.push(parseInt(data.zoho_result) || 0);
      }

      if (data.spent !== undefined) {
        updates.push('spent = ?');
        params.push(parseFloat(data.spent) || 0.00);
      }

      if (updates.length === 0) {
        throw new Error('No fields to update');
      }

      updates.push('updated_at = NOW()');
      params.push(id);

      const query = `UPDATE reports SET ${updates.join(', ')} WHERE id = ?`;
      const [result] = await pool.execute(query, params);

      if (result.affectedRows === 0) {
        throw new Error('Report not found');
      }

      return await this.findById(id);
    } catch (error) {
      console.error('Error in Report.update:', error);
      throw new Error('Failed to update report: ' + error.message);
    }
  }

  // Delete report
  static async delete(id) {
    try {
      const query = 'DELETE FROM reports WHERE id = ?';
      const [result] = await pool.execute(query, [id]);

      if (result.affectedRows === 0) {
        throw new Error('Report not found');
      }

      return true;
    } catch (error) {
      console.error('Error in Report.delete:', error);
      throw new Error('Failed to delete report: ' + error.message);
    }
  }

  // Get report statistics
  static async getStats(filters = {}) {
    try {
      let whereClause = 'WHERE 1=1';
      const params = [];

      if (filters.date_from) {
        whereClause += ' AND report_date >= ?';
        params.push(filters.date_from);
      }

      if (filters.date_to) {
        whereClause += ' AND report_date <= ?';
        params.push(filters.date_to);
      }

      if (filters.campaign_id) {
        whereClause += ' AND campaign_id = ?';
        params.push(filters.campaign_id);
      }

      if (filters.brand_id) {
        whereClause += ' AND brand = ?';
        params.push(filters.brand_id);
      }

      const query = `
        SELECT 
          COUNT(*) as total_reports,
          COUNT(DISTINCT campaign_id) as unique_campaigns,
          COUNT(DISTINCT brand) as unique_brands,
          SUM(leads) as total_leads,
          SUM(facebook_result) as total_facebook_results,
          SUM(zoho_result) as total_zoho_results,
          SUM(spent) as total_spent,
          AVG(cost_per_lead) as avg_cost_per_lead,
          AVG(facebook_cost_per_lead) as avg_facebook_cost_per_lead,
          AVG(zoho_cost_per_lead) as avg_zoho_cost_per_lead,
          MIN(report_date) as earliest_date,
          MAX(report_date) as latest_date
        FROM reports
        ${whereClause}
      `;

      const [rows] = await pool.execute(query, params);
      return rows[0];
    } catch (error) {
      console.error('Error in Report.getStats:', error);
      throw new Error('Failed to get report statistics: ' + error.message);
    }
  }
}

module.exports = Report;