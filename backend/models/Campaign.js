const { pool } = require('../config/database');

class Campaign {
  constructor(data = {}) {
    this.id = data.id || null;
    this.name = data.name || '';
    this.persona = data.persona || null;
    this.gender = data.gender || null;
    this.age = data.age || null;
    this.min_age = data.min_age || null;
    this.max_age = data.max_age || null;
    this.location = data.location || null;
    this.creatives = data.creatives || 'image';
    this.is_enabled = data.is_enabled !== undefined ? data.is_enabled : 1;
    this.status = data.status || 'active';
    this.campaign_type_id = data.campaign_type_id || null;
    this.brand = data.brand || null;
    this.created_by = data.created_by || null;
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
    this.age_backup = data.age_backup || null;
  }

  // Validate campaign data
  static validate(data, isUpdate = false) {
    const errors = [];

    // Required fields validation
    if (!data.name || data.name.trim().length === 0) {
      errors.push('Campaign name is required');
    } else if (data.name.trim().length > 255) {
      errors.push('Campaign name must be less than 255 characters');
    }

    // Required field validations
    if (!data.campaign_type_id) {
      errors.push('Campaign type is required');
    }

    if (!data.brand) {
      errors.push('Brand is required');
    }

    // Persona validation
    if (!data.persona || !Array.isArray(data.persona) || data.persona.length === 0) {
      errors.push('At least one persona is required');
    }

    // Gender validation
    if (!data.gender || !Array.isArray(data.gender) || data.gender.length === 0) {
      errors.push('At least one gender is required');
    }

    // Location validation
    if (!data.location || !Array.isArray(data.location) || data.location.length === 0) {
      errors.push('At least one location is required');
    }

    // Age validation
    if (!data.min_age && !isUpdate) {
      errors.push('Minimum age is required');
    } else if (data.min_age !== undefined && data.min_age !== null) {
      const minAge = parseInt(data.min_age);
      if (isNaN(minAge) || minAge < 0 || minAge > 100) {
        errors.push('Minimum age must be a number between 0 and 100');
      }
    }

    if (!data.max_age && !isUpdate) {
      errors.push('Maximum age is required');
    } else if (data.max_age !== undefined && data.max_age !== null) {
      const maxAge = parseInt(data.max_age);
      if (isNaN(maxAge) || maxAge < 0 || maxAge > 100) {
        errors.push('Maximum age must be a number between 0 and 100');
      }
    }

    if (data.min_age !== undefined && data.max_age !== undefined && 
        data.min_age !== null && data.max_age !== null) {
      const minAge = parseInt(data.min_age);
      const maxAge = parseInt(data.max_age);
      if (minAge > maxAge) {
        errors.push('Minimum age cannot be greater than maximum age');
      }
    }

    // Creatives validation
    const validCreatives = ['video', 'image', 'carousel', 'collection'];
    if (data.creatives && !validCreatives.includes(data.creatives)) {
      errors.push('Creatives must be one of: video, image, carousel, collection');
    }

    // Status validation
    const validStatus = ['active', 'inactive'];
    if (data.status && !validStatus.includes(data.status)) {
      errors.push('Status must be either active or inactive');
    }

    // is_enabled validation
    if (data.is_enabled !== undefined && ![0, 1, true, false].includes(data.is_enabled)) {
      errors.push('is_enabled must be 0, 1, true, or false');
    }

    // JSON fields validation (persona, gender, location)
    const jsonFields = ['persona', 'gender', 'location'];
    jsonFields.forEach(field => {
      if (data[field] && typeof data[field] === 'string') {
        try {
          JSON.parse(data[field]);
        } catch (e) {
          errors.push(`${field} must be valid JSON format`);
        }
      }
    });

    return errors;
  }

  // Helper method to parse JSON fields
  static parseJsonFields(data) {
    const parsedData = { ...data };
    const jsonFields = ['persona', 'gender', 'location'];
    
    jsonFields.forEach(field => {
      if (parsedData[field] && typeof parsedData[field] === 'string') {
        try {
          parsedData[field] = JSON.parse(parsedData[field]);
        } catch (e) {
          // Keep as string if parsing fails
        }
      }
    });
    
    return parsedData;
  }

  // Helper method to stringify JSON fields for database storage
  static stringifyJsonFields(data) {
    const stringifiedData = { ...data };
    const jsonFields = ['persona', 'gender', 'location'];
    
    jsonFields.forEach(field => {
      if (stringifiedData[field] && typeof stringifiedData[field] === 'object') {
        stringifiedData[field] = JSON.stringify(stringifiedData[field]);
      }
    });
    
    return stringifiedData;
  }

  // Get all campaigns with optional filters
  static async findAll(filters = {}) {
    try {
      let query = `
        SELECT 
          c.*,
          ct.type_name as campaign_type_name,
          b.name as brand_name,
          u1.username as created_by_username
        FROM campaigns c
        LEFT JOIN campaign_types ct ON c.campaign_type_id = ct.id
        LEFT JOIN brands b ON c.brand = b.id
        LEFT JOIN users u1 ON c.created_by = u1.id
        WHERE 1=1
      `;
      const params = [];

      // Apply filters
      if (filters.status) {
        query += ` AND c.status = ?`;
        params.push(filters.status);
      }

      if (filters.isEnabled !== null && filters.isEnabled !== undefined) {
        query += ` AND c.is_enabled = ?`;
        params.push(filters.isEnabled);
      }

      if (filters.brandId) {
        query += ` AND c.brand = ?`;
        params.push(filters.brandId);
      }

      if (filters.campaignTypeId) {
        query += ` AND c.campaign_type_id = ?`;
        params.push(filters.campaignTypeId);
      }

      if (filters.search && filters.search.trim() !== '') {
        query += ` AND (c.name LIKE ? OR ct.type_name LIKE ? OR b.name LIKE ?)`;
        const searchTerm = `%${filters.search.trim()}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      if (filters.creatives) {
        query += ` AND c.creatives = ?`;
        params.push(filters.creatives);
      }

      query += ` ORDER BY c.created_at DESC`;

      console.log('Campaign.findAll query:', query);
      console.log('Campaign.findAll params:', params);

      const [rows] = await pool.execute(query, params);
      
      return rows.map(row => {
        const campaign = new Campaign(row);
        // Parse JSON fields for response
        const parsed = this.parseJsonFields(campaign);
        return { 
          ...parsed, 
          campaignType: row.campaign_type_id ? {
            id: row.campaign_type_id,
            name: row.campaign_type_name
          } : null,
          brand: row.brand ? {
            id: row.brand,
            name: row.brand_name
          } : null,
          enabled: Boolean(row.is_enabled),
          created_by_username: row.created_by_username 
        };
      });
    } catch (error) {
      console.error('Error in Campaign.findAll:', error);
      throw new Error('Failed to fetch campaigns: ' + error.message);
    }
  }

  // Get campaign by ID
  static async findById(id) {
    try {
      const query = `
        SELECT 
          c.*,
          ct.type_name as campaign_type_name,
          b.name as brand_name,
          u1.username as created_by_username
        FROM campaigns c
        LEFT JOIN campaign_types ct ON c.campaign_type_id = ct.id
        LEFT JOIN brands b ON c.brand = b.id
        LEFT JOIN users u1 ON c.created_by = u1.id
        WHERE c.id = ?
      `;

      console.log('Campaign.findById query:', query);
      console.log('Campaign.findById id:', id);

      const [rows] = await pool.execute(query, [id]);

      if (rows.length === 0) {
        return null;
      }

      const campaign = new Campaign(rows[0]);
      const parsed = this.parseJsonFields(campaign);
      return { 
        ...parsed, 
        campaignType: rows[0].campaign_type_id ? {
          id: rows[0].campaign_type_id,
          name: rows[0].campaign_type_name
        } : null,
        brand: rows[0].brand ? {
          id: rows[0].brand,
          name: rows[0].brand_name
        } : null,
        enabled: Boolean(rows[0].is_enabled),
        created_by_username: rows[0].created_by_username 
      };
    } catch (error) {
      console.error('Error in Campaign.findById:', error);
      throw new Error('Failed to fetch campaign: ' + error.message);
    }
  }

  // Create new campaign
  static async create(data) {
    try {
      // Stringify JSON fields for storage
      const stringifiedData = this.stringifyJsonFields(data);

      const query = `
        INSERT INTO campaigns (
          name, persona, gender, min_age, max_age, location, 
          creatives, is_enabled, status, campaign_type_id, 
          brand, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        stringifiedData.name,
        stringifiedData.persona || null,
        stringifiedData.gender || null,
        stringifiedData.min_age || null,
        stringifiedData.max_age || null,
        stringifiedData.location || null,
        stringifiedData.creatives || 'image',
        stringifiedData.is_enabled !== undefined ? stringifiedData.is_enabled : 1,
        stringifiedData.status || 'active',
        stringifiedData.campaign_type_id || null,
        stringifiedData.brand || null,
        stringifiedData.created_by || null
      ];

      console.log('Campaign.create query:', query);
      console.log('Campaign.create params:', params);

      const [result] = await pool.execute(query, params);

      if (result.insertId) {
        return await this.findById(result.insertId);
      }

      throw new Error('Failed to create campaign');
    } catch (error) {
      console.error('Error in Campaign.create:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('A campaign with this name already exists');
      }
      throw new Error('Failed to create campaign: ' + error.message);
    }
  }

  // Update campaign
  static async update(id, data) {
    try {
      // Stringify JSON fields for storage
      const stringifiedData = this.stringifyJsonFields(data);

      const query = `
        UPDATE campaigns 
        SET name = ?, persona = ?, gender = ?, min_age = ?, max_age = ?, 
            location = ?, creatives = ?, is_enabled = ?, status = ?, 
            campaign_type_id = ?, brand = ?
        WHERE id = ?
      `;

      const params = [
        stringifiedData.name,
        stringifiedData.persona || null,
        stringifiedData.gender || null,
        stringifiedData.min_age || null,
        stringifiedData.max_age || null,
        stringifiedData.location || null,
        stringifiedData.creatives || 'image',
        stringifiedData.is_enabled !== undefined ? stringifiedData.is_enabled : 1,
        stringifiedData.status || 'active',
        stringifiedData.campaign_type_id || null,
        stringifiedData.brand || null,
        id
      ];

      console.log('Campaign.update query:', query);
      console.log('Campaign.update params:', params);

      const [result] = await pool.execute(query, params);

      if (result.affectedRows === 0) {
        throw new Error('Campaign not found');
      }

      return await this.findById(id);
    } catch (error) {
      console.error('Error in Campaign.update:', error);
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('A campaign with this name already exists');
      }
      throw new Error('Failed to update campaign: ' + error.message);
    }
  }

  // Delete campaign
  static async delete(id) {
    try {
      const query = `DELETE FROM campaigns WHERE id = ?`;

      console.log('Campaign.delete query:', query);
      console.log('Campaign.delete id:', id);

      const [result] = await pool.execute(query, [id]);

      if (result.affectedRows === 0) {
        throw new Error('Campaign not found');
      }

      return true;
    } catch (error) {
      console.error('Error in Campaign.delete:', error);
      throw new Error('Failed to delete campaign: ' + error.message);
    }
  }

  // Toggle campaign active status
  static async toggleActive(id) {
    try {
      // First get current status
      const campaign = await this.findById(id);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      const newStatus = campaign.status === 'active' ? 'inactive' : 'active';
      
      const query = `
        UPDATE campaigns 
        SET status = ?
        WHERE id = ?
      `;

      const params = [newStatus, id];

      console.log('Campaign.toggleActive query:', query);
      console.log('Campaign.toggleActive params:', params);

      const [result] = await pool.execute(query, params);

      if (result.affectedRows === 0) {
        throw new Error('Campaign not found');
      }

      return await this.findById(id);
    } catch (error) {
      console.error('Error in Campaign.toggleActive:', error);
      throw new Error('Failed to toggle campaign status: ' + error.message);
    }
  }

  // Toggle campaign enabled status
  static async toggleEnabled(id) {
    try {
      // First get current status
      const campaign = await this.findById(id);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      const newEnabled = !campaign.is_enabled;
      
      const query = `
        UPDATE campaigns 
        SET is_enabled = ?
        WHERE id = ?
      `;

      const params = [newEnabled, id];

      console.log('Campaign.toggleEnabled query:', query);
      console.log('Campaign.toggleEnabled params:', params);

      const [result] = await pool.execute(query, params);

      if (result.affectedRows === 0) {
        throw new Error('Campaign not found');
      }

      return await this.findById(id);
    } catch (error) {
      console.error('Error in Campaign.toggleEnabled:', error);
      throw new Error('Failed to toggle campaign enabled status: ' + error.message);
    }
  }

  // Get campaigns count by status
  static async getStatusCounts() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_campaigns,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_campaigns,
          SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive_campaigns,
          SUM(CASE WHEN is_enabled = 1 THEN 1 ELSE 0 END) as enabled_campaigns,
          SUM(CASE WHEN is_enabled = 0 THEN 1 ELSE 0 END) as disabled_campaigns
        FROM campaigns
      `;

      const [rows] = await pool.execute(query);
      return rows[0];
    } catch (error) {
      console.error('Error in Campaign.getStatusCounts:', error);
      throw new Error('Failed to get campaign status counts: ' + error.message);
    }
  }

  // Get campaign statistics
  static async getStats() {
    try {
      const [stats] = await pool.execute(`
        SELECT 
          COUNT(*) as total_campaigns,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_campaigns,
          SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive_campaigns,
          SUM(CASE WHEN is_enabled = 1 THEN 1 ELSE 0 END) as enabled_campaigns,
          SUM(CASE WHEN is_enabled = 0 THEN 1 ELSE 0 END) as disabled_campaigns,
          COUNT(DISTINCT brand) as unique_brands,
          COUNT(DISTINCT campaign_type_id) as unique_campaign_types,
          COUNT(DISTINCT created_by) as total_creators
        FROM campaigns
      `);

      // Get recent campaigns (last 30 days)
      const [recent] = await pool.execute(`
        SELECT COUNT(*) as recent_campaigns 
        FROM campaigns 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      `);

      // Get campaigns by creative type
      const [creatives] = await pool.execute(`
        SELECT 
          creatives,
          COUNT(*) as count
        FROM campaigns
        GROUP BY creatives
      `);

      const result = {
        ...stats[0],
        recent_campaigns: recent[0].recent_campaigns,
        creatives_breakdown: creatives
      };

      console.log('📊 Campaign statistics:', result);
      return result;
    } catch (error) {
      console.error('❌ Error fetching campaign statistics:', error.message);
      throw new Error('Failed to fetch campaign statistics: ' + error.message);
    }
  }

  // Validate campaign name (check if unique)
  static async validateName(name, excludeId = null) {
    try {
      let query = `SELECT COUNT(*) as count FROM campaigns WHERE name = ?`;
      let params = [name];

      if (excludeId) {
        query += ` AND id != ?`;
        params.push(excludeId);
      }

      console.log('Campaign.validateName query:', query);
      console.log('Campaign.validateName params:', params);

      const [rows] = await pool.execute(query, params);
      return rows[0].count === 0;
    } catch (error) {
      console.error('Error in Campaign.validateName:', error);
      throw new Error('Failed to validate campaign name: ' + error.message);
    }
  }

  // Get campaigns by brand
  static async findByBrand(brandId, filters = {}) {
    try {
      const updatedFilters = { ...filters, brandId };
      return await this.findAll(updatedFilters);
    } catch (error) {
      console.error('Error in Campaign.findByBrand:', error);
      throw new Error('Failed to fetch campaigns by brand: ' + error.message);
    }
  }

  // Get campaigns by campaign type
  static async findByCampaignType(campaignTypeId, filters = {}) {
    try {
      const updatedFilters = { ...filters, campaignTypeId };
      return await this.findAll(updatedFilters);
    } catch (error) {
      console.error('Error in Campaign.findByCampaignType:', error);
      throw new Error('Failed to fetch campaigns by campaign type: ' + error.message);
    }
  }
}

module.exports = Campaign;
