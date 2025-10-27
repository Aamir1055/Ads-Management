const { pool } = require('../config/database');

class Brand {
  constructor(data = {}) {
    this.id = data.id || null;
    this.name = data.name || '';
    this.description = data.description || null;
    this.is_active = data.is_active !== undefined ? data.is_active : 1;
    this.created_by = data.created_by || null;
    this.updated_by = data.updated_by || null;
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
  }

  // Validate brand data
  static validate(data, isUpdate = false) {
    const errors = [];

    // Name is required and must be unique
    if (!isUpdate && (!data.name || data.name.trim().length === 0)) {
      errors.push('Brand name is required');
    }
    
    if (data.name && data.name.trim().length > 255) {
      errors.push('Brand name must be less than 255 characters');
    }

    // Description is optional but has length limit
    if (data.description && data.description.length > 1000) {
      errors.push('Description must be less than 1000 characters');
    }

    // is_active must be boolean/number
    if (data.is_active !== undefined && ![0, 1, true, false].includes(data.is_active)) {
      errors.push('is_active must be 0, 1, true, or false');
    }

    return errors;
  }

  // Get all brands with optional filters
  static async findAll(filters = {}) {
    try {
      let query = `
        SELECT 
          b.*,
          u1.username as created_by_username,
          u2.username as updated_by_username
        FROM brands b
        LEFT JOIN users u1 ON b.created_by = u1.id
        LEFT JOIN users u2 ON b.updated_by = u2.id
        WHERE 1=1
      `;
      const params = [];

      // Apply filters
      if (filters.isActive !== null && filters.isActive !== undefined) {
        query += ` AND b.is_active = ?`;
        params.push(filters.isActive);
      }

      if (filters.search && filters.search.trim() !== '') {
        query += ` AND (b.name LIKE ? OR b.description LIKE ?)`;
        const searchTerm = `%${filters.search.trim()}%`;
        params.push(searchTerm, searchTerm);
      }

      query += ` ORDER BY b.name ASC`;

      console.log('Brand.findAll query:', query);
      console.log('Brand.findAll params:', params);

      const [rows] = await pool.execute(query, params);
      
      return rows.map(row => new Brand(row));
    } catch (error) {
      console.error('Error in Brand.findAll:', error);
      throw new Error('Failed to fetch brands: ' + error.message);
    }
  }

  // Get brand by ID
  static async findById(id) {
    try {
      const query = `
        SELECT 
          b.*,
          u1.username as created_by_username,
          u2.username as updated_by_username
        FROM brands b
        LEFT JOIN users u1 ON b.created_by = u1.id
        LEFT JOIN users u2 ON b.updated_by = u2.id
        WHERE b.id = ?
      `;

      console.log('Brand.findById query:', query);
      console.log('Brand.findById id:', id);

      const [rows] = await pool.execute(query, [id]);

      if (rows.length === 0) {
        return null;
      }

      return new Brand(rows[0]);
    } catch (error) {
      console.error('Error in Brand.findById:', error);
      throw new Error('Failed to fetch brand: ' + error.message);
    }
  }

  // Create new brand
  static async create(data) {
    try {
      const query = `
        INSERT INTO brands (name, description, is_active, created_by)
        VALUES (?, ?, ?, ?)
      `;

      const params = [
        data.name,
        data.description || null,
        data.is_active !== undefined ? data.is_active : true,
        data.created_by || null
      ];

      console.log('Brand.create query:', query);
      console.log('Brand.create params:', params);

      const [result] = await pool.execute(query, params);

      if (result.insertId) {
        return await this.findById(result.insertId);
      }

      throw new Error('Failed to create brand');
    } catch (error) {
      console.error('Error in Brand.create:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('A brand with this name already exists');
      }
      throw new Error('Failed to create brand: ' + error.message);
    }
  }

  // Update brand
  static async update(id, data) {
    try {
      const query = `
        UPDATE brands 
        SET name = ?, description = ?, is_active = ?, updated_by = ?
        WHERE id = ?
      `;

      const params = [
        data.name,
        data.description || null,
        data.is_active !== undefined ? data.is_active : true,
        data.updated_by || null,
        id
      ];

      console.log('Brand.update query:', query);
      console.log('Brand.update params:', params);

      const [result] = await pool.execute(query, params);

      if (result.affectedRows === 0) {
        throw new Error('Brand not found');
      }

      return await this.findById(id);
    } catch (error) {
      console.error('Error in Brand.update:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('A brand with this name already exists');
      }
      throw new Error('Failed to update brand: ' + error.message);
    }
  }

  // Delete brand
  static async delete(id) {
    try {
      // First check if brand is being used in campaigns
      const checkQuery = `
        SELECT COUNT(*) as count 
        FROM campaigns 
        WHERE brand_id = ? AND is_active = 1
      `;

      let [checkResult] = [];
      try {
        [checkResult] = await pool.execute(checkQuery, [id]);
        if (checkResult[0].count > 0) {
          throw new Error('Cannot delete brand that is being used in active campaigns');
        }
      } catch (checkError) {
        // If campaigns table doesn't exist, ignore this check
        console.log('Campaigns table check skipped:', checkError.message);
      }

      const query = `DELETE FROM brands WHERE id = ?`;

      console.log('Brand.delete query:', query);
      console.log('Brand.delete id:', id);

      const [result] = await pool.execute(query, [id]);

      if (result.affectedRows === 0) {
        throw new Error('Brand not found');
      }

      return true;
    } catch (error) {
      console.error('Error in Brand.delete:', error);
      throw new Error('Failed to delete brand: ' + error.message);
    }
  }

  // Toggle brand active status
  static async toggleActive(id, updatedBy = null) {
    try {
      // First get current status
      const brand = await this.findById(id);
      if (!brand) {
        throw new Error('Brand not found');
      }

      const newStatus = !brand.is_active;
      
      const query = `
        UPDATE brands 
        SET is_active = ?, updated_by = ?
        WHERE id = ?
      `;

      const params = [newStatus, updatedBy, id];

      console.log('Brand.toggleActive query:', query);
      console.log('Brand.toggleActive params:', params);

      const [result] = await pool.execute(query, params);

      if (result.affectedRows === 0) {
        throw new Error('Brand not found');
      }

      return await this.findById(id);
    } catch (error) {
      console.error('Error in Brand.toggleActive:', error);
      throw new Error('Failed to toggle brand status: ' + error.message);
    }
  }

  // Get active brands count
  static async getActiveCount() {
    try {
      const query = `SELECT COUNT(*) as count FROM brands WHERE is_active = 1`;
      const [rows] = await pool.execute(query);
      return rows[0].count;
    } catch (error) {
      console.error('Error in Brand.getActiveCount:', error);
      throw new Error('Failed to get active brands count: ' + error.message);
    }
  }

  // Validate brand name (check if unique)
  static async validateName(name, excludeId = null) {
    try {
      let query = `SELECT COUNT(*) as count FROM brands WHERE name = ?`;
      let params = [name];

      if (excludeId) {
        query += ` AND id != ?`;
        params.push(excludeId);
      }

      console.log('Brand.validateName query:', query);
      console.log('Brand.validateName params:', params);

      const [rows] = await pool.execute(query, params);
      return rows[0].count === 0;
    } catch (error) {
      console.error('Error in Brand.validateName:', error);
      throw new Error('Failed to validate brand name: ' + error.message);
    }
  }

  // Get brands for dropdown (active only)
  static async getForDropdown() {
    try {
      const query = `
        SELECT id, name, description
        FROM brands
        WHERE is_active = 1
        ORDER BY name ASC
      `;

      console.log('Brand.getForDropdown query:', query);

      const [rows] = await pool.execute(query);
      return rows;
    } catch (error) {
      console.error('Error in Brand.getForDropdown:', error);
      throw new Error('Failed to fetch dropdown brands: ' + error.message);
    }
  }

  // Get brand statistics
  static async getStats() {
    try {
      const [stats] = await pool.execute(`
        SELECT 
          COUNT(*) as total_brands,
          SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_brands,
          SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive_brands,
          COUNT(DISTINCT created_by) as total_creators
        FROM brands
      `);

      // Get recent brands (last 30 days)
      const [recent] = await pool.execute(`
        SELECT COUNT(*) as recent_brands 
        FROM brands 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      `);

      const result = {
        ...stats[0],
        recent_brands: recent[0].recent_brands
      };

      console.log('🏷️ Brand statistics:', result);
      return result;
    } catch (error) {
      console.error('❌ Error fetching brand statistics:', error.message);
      throw new Error('Failed to fetch brand statistics: ' + error.message);
    }
  }
}

module.exports = Brand;
