// Campaign Type model (for MySQL)
// FIXED: Updated to match controller implementation and database schema
const { pool } = require('../config/database');

const CampaignType = {
  // Get all campaign types with pagination and search
  getAll: async (params = {}) => {
    const { search = null, status = 'all', page = 1, limit = 10 } = params;
    const offset = (page - 1) * limit;
    
    const where = [];
    const queryParams = [];
    
    if (search) {
      where.push('(type_name LIKE ? OR description LIKE ?)');
      const term = `%${search}%`;
      queryParams.push(term, term);
    }
    
    if (status && status !== 'all') {
      where.push('is_active = ?');
      queryParams.push(status === 'active' ? 1 : 0);
    }
    
    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    
    // Get total count
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM campaign_types ${whereClause}`,
      queryParams
    );
    const total = countRows[0]?.total || 0;
    
    // Get data
    const [rows] = await pool.execute(
      `SELECT id, type_name, description, is_active, created_at, updated_at
       FROM campaign_types
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );
    
    return {
      data: rows,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalCount: total,
        limit
      }
    };
  },
  
  // Get campaign type by ID
  getById: async (id) => {
    const [rows] = await pool.execute(
      'SELECT id, type_name, description, is_active, created_at, updated_at FROM campaign_types WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },
  
  // Create new campaign type
  create: async (data) => {
    const { type_name, description = '', is_active = true } = data;
    const [result] = await pool.execute(
      'INSERT INTO campaign_types (type_name, description, is_active, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
      [type_name, description, is_active ? 1 : 0]
    );
    
    if (result.insertId) {
      return await CampaignType.getById(result.insertId);
    }
    return null;
  },
  
  // Update campaign type
  update: async (id, data) => {
    const updateFields = [];
    const values = [];
    
    if (data.type_name !== undefined) {
      updateFields.push('type_name = ?');
      values.push(data.type_name);
    }
    if (data.description !== undefined) {
      updateFields.push('description = ?');
      values.push(data.description);
    }
    if (data.is_active !== undefined) {
      updateFields.push('is_active = ?');
      values.push(data.is_active ? 1 : 0);
    }
    
    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }
    
    updateFields.push('updated_at = NOW()');
    values.push(id);
    
    const [result] = await pool.execute(
      `UPDATE campaign_types SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );
    
    if (result.affectedRows > 0) {
      return await CampaignType.getById(id);
    }
    return null;
  },
  
  // Soft delete (set is_active = false)
  delete: async (id) => {
    const [result] = await pool.execute(
      'UPDATE campaign_types SET is_active = 0, updated_at = NOW() WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  },
  
  // Check if campaign type name exists (for uniqueness validation)
  nameExists: async (typeName, excludeId = null) => {
    const query = excludeId
      ? 'SELECT id FROM campaign_types WHERE type_name = ? AND id != ?'
      : 'SELECT id FROM campaign_types WHERE type_name = ?';
    const params = excludeId ? [typeName, excludeId] : [typeName];
    
    const [rows] = await pool.execute(query, params);
    return rows.length > 0;
  }
};

module.exports = CampaignType;
