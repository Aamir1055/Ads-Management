const { pool } = require('../config/database');

// Helper function to create standard API response
const createResponse = (success, message, data = null, errors = null) => ({
  success,
  message,
  timestamp: new Date().toISOString(),
  ...(data && { data }),
  ...(errors && { errors })
});

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

// Helper to parse JSON fields safely
const parseJsonField = (value) => {
  if (!value) return null;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return value;
};

// Helper to format campaign data for response
const formatCampaignData = (campaign) => {
  if (!campaign) return null;
  
  return {
    ...campaign,
    persona: campaign.persona || null, // Keep persona as text
    gender: parseJsonField(campaign.gender),
    is_enabled: Boolean(campaign.is_enabled)
  };
};

const campaignController = {
  // Get all campaigns with privacy filtering
  getAllCampaigns: async (req, res) => {
    try {
      const { page = 1, limit = 50, search = '', campaign_type_id = null, is_enabled = null } = req.query;

      // DEBUG: Log user information
      console.log('🔍 [CAMPAIGNS DEBUG] User making request:', {
        id: req.user?.id,
        username: req.user?.username,
        role: req.user?.role,
        roleLevel: req.user?.role?.level,
        roleName: req.user?.role?.name
      });

      let whereClause = 'WHERE 1=1';
      const params = [];

      // Add privacy filtering for non-admins
      const isAdmin = req.user.role && (req.user.role.level >= 8 || req.user.role.name === 'super_admin' || req.user.role.name === 'admin');
      
      console.log('🔍 [CAMPAIGNS DEBUG] Admin check result:', isAdmin);
      
      if (!isAdmin) {
        whereClause += ' AND c.created_by = ?';
        params.push(req.user.id);
        console.log('🔍 [CAMPAIGNS DEBUG] Applied privacy filter for user ID:', req.user.id);
      } else {
        console.log('🔍 [CAMPAIGNS DEBUG] Admin user - no privacy filter applied');
      }

      if (search) {
        whereClause += ' AND (c.name LIKE ? OR c.brand LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      if (campaign_type_id) {
        whereClause += ' AND c.campaign_type_id = ?';
        params.push(campaign_type_id);
      }

      if (is_enabled !== null) {
        whereClause += ' AND c.is_enabled = ?';
        params.push(is_enabled === 'true' ? 1 : 0);
      }

      const offset = (page - 1) * limit;

      const query = `
        SELECT c.*, ct.type_name as campaign_type_name
        FROM campaigns c
        LEFT JOIN campaign_types ct ON c.campaign_type_id = ct.id
        ${whereClause}
        ORDER BY c.created_at DESC
        LIMIT ? OFFSET ?
      `;

      params.push(parseInt(limit), parseInt(offset));

      console.log('🔍 [CAMPAIGNS DEBUG] Final query:', query);
      console.log('🔍 [CAMPAIGNS DEBUG] Query parameters:', params);

      const [campaigns] = await pool.execute(query, params);

      console.log('🔍 [CAMPAIGNS DEBUG] Raw campaigns returned:', campaigns.length);
      campaigns.forEach((camp, index) => {
        console.log(`  ${index + 1}. "${camp.name}" (ID: ${camp.id}, created_by: ${camp.created_by})`);
      });

      // Format the data
      const formattedCampaigns = campaigns.map(formatCampaignData);
      
      console.log('🔍 [CAMPAIGNS DEBUG] Sending response with', formattedCampaigns.length, 'campaigns');

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) as total
        FROM campaigns c
        LEFT JOIN campaign_types ct ON c.campaign_type_id = ct.id
        ${whereClause}
      `;
      
      const [countResult] = await pool.execute(countQuery, params.slice(0, -2)); // Remove limit and offset params
      const total = countResult[0].total;

      res.status(200).json(
        createResponse(true, 'Campaigns retrieved successfully', {
          campaigns: formattedCampaigns,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit)
          }
        })
      );
    } catch (error) {
      console.error('Get campaigns error:', error);
      res.status(500).json(
        createResponse(false, 'Failed to retrieve campaigns', null, ['Internal server error'])
      );
    }
  },

  // Get campaign by ID with ownership validation
  getCampaignById: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json(
          createResponse(false, 'Invalid campaign ID')
        );
      }

      const query = `
        SELECT c.*, ct.type_name as campaign_type_name
        FROM campaigns c
        LEFT JOIN campaign_types ct ON c.campaign_type_id = ct.id
        WHERE c.id = ?
      `;

      const [campaigns] = await pool.execute(query, [id]);

      if (campaigns.length === 0) {
        return res.status(404).json(
          createResponse(false, 'Campaign not found')
        );
      }

      const campaign = campaigns[0];

      // Privacy check - only owner or admin can access
      if (!isAdminOrOwner(req, campaign.created_by)) {
        return res.status(403).json(
          createResponse(false, 'Access denied. You can only access campaigns you created.')
        );
      }

      const formattedCampaign = formatCampaignData(campaign);

      res.status(200).json(
        createResponse(true, 'Campaign retrieved successfully', formattedCampaign)
      );
    } catch (error) {
      console.error('Get campaign by ID error:', error);
      res.status(500).json(
        createResponse(false, 'Failed to retrieve campaign', null, ['Internal server error'])
      );
    }
  },

  // Create new campaign with automatic user ownership
  createCampaign: async (req, res) => {
    try {
      const {
        name,
        persona,
        gender,
        age,
        location,
        creatives,
        campaign_type_id,
        brand,
        is_enabled = true
      } = req.body;

      // Validation
      if (!name || !name.trim()) {
        return res.status(400).json(
          createResponse(false, 'Campaign name is required')
        );
      }

      if (!campaign_type_id) {
        return res.status(400).json(
          createResponse(false, 'Campaign type is required')
        );
      }

      // Check if campaign type exists and user has access to it (for non-admins)
      let typeCheckQuery = 'SELECT id FROM campaign_types WHERE id = ? AND is_active = 1';
      let typeCheckParams = [campaign_type_id];
      
      const isAdminForType = req.user.role && (req.user.role.level >= 8 || req.user.role.name === 'super_admin' || req.user.role.name === 'admin');
      if (!isAdminForType) {
        typeCheckQuery += ' AND created_by = ?';
        typeCheckParams.push(req.user.id);
      }
      
      const [typeCheck] = await pool.execute(typeCheckQuery, typeCheckParams);

      if (typeCheck.length === 0) {
        return res.status(400).json(
          createResponse(false, 'Invalid campaign type or you do not have access to it')
        );
      }

      // Check for duplicate names in user's own campaigns (for non-admins)
      let duplicateQuery = 'SELECT id FROM campaigns WHERE name = ?';
      let duplicateParams = [name.trim()];
      
      const isAdminForDupe = req.user.role && (req.user.role.level >= 8 || req.user.role.name === 'super_admin' || req.user.role.name === 'admin');
      if (!isAdminForDupe) {
        duplicateQuery += ' AND created_by = ?';
        duplicateParams.push(req.user.id);
      }
      
      const [existingCampaigns] = await pool.execute(duplicateQuery, duplicateParams);
      if (existingCampaigns && existingCampaigns.length > 0) {
        return res.status(409).json(
          createResponse(false, 'Campaign name already exists in your campaigns')
        );
      }

      const query = `
        INSERT INTO campaigns (
          name, persona, gender, age, location, creatives,
          campaign_type_id, brand, is_enabled, created_by,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;
      
      const params = [
        name.trim(),
        persona?.trim() || null, // Store persona as plain text
        gender ? JSON.stringify(gender) : null,
        age ? parseInt(age) : null,
        location?.trim() || null,
        creatives || 'image',
        parseInt(campaign_type_id),
        brand?.trim() || null,
        Boolean(is_enabled),
        req.user.id // Assign to current user
      ];

      const [result] = await pool.execute(query, params);

      // Get the created campaign
      const [newCampaign] = await pool.execute(`
        SELECT c.*, ct.type_name as campaign_type_name
        FROM campaigns c
        LEFT JOIN campaign_types ct ON c.campaign_type_id = ct.id
        WHERE c.id = ?
      `, [result.insertId]);

      const formattedCampaign = formatCampaignData(newCampaign[0]);

      res.status(201).json(
        createResponse(true, 'Campaign created successfully', formattedCampaign)
      );
    } catch (error) {
      console.error('Create campaign error:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json(
          createResponse(false, 'Campaign name already exists')
        );
      }

      res.status(500).json(
        createResponse(false, 'Failed to create campaign', null, ['Internal server error'])
      );
    }
  },

  // Update campaign with ownership validation
  updateCampaign: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        name,
        persona,
        gender,
        age,
        location,
        creatives,
        campaign_type_id,
        brand,
        is_enabled
      } = req.body;

      if (!id || isNaN(id)) {
        return res.status(400).json(
          createResponse(false, 'Invalid campaign ID')
        );
      }

      // Check if campaign exists and user has access
      const [existingCampaign] = await pool.execute(
        'SELECT id, name, created_by FROM campaigns WHERE id = ?',
        [id]
      );

      if (existingCampaign.length === 0) {
        return res.status(404).json(
          createResponse(false, 'Campaign not found')
        );
      }

      const campaign = existingCampaign[0];

      // Privacy check - only owner or admin can update
      if (!isAdminOrOwner(req, campaign.created_by)) {
        return res.status(403).json(
          createResponse(false, 'Access denied. You can only update campaigns you created.')
        );
      }

      // Build update query dynamically
      const updateFields = [];
      const params = [];

      if (name !== undefined) {
        if (!name.trim()) {
          return res.status(400).json(
            createResponse(false, 'Campaign name cannot be empty')
          );
        }
        
        // Check for duplicate names - scoped to user for non-admins
        if (name.trim() !== campaign.name) {
          let duplicateQuery = 'SELECT id FROM campaigns WHERE name = ? AND id != ?';
          let duplicateParams = [name.trim(), id];
          
          const isAdminForDupeUpdate = req.user.role && (req.user.role.level >= 8 || req.user.role.name === 'super_admin' || req.user.role.name === 'admin');
          if (!isAdminForDupeUpdate) {
            duplicateQuery += ' AND created_by = ?';
            duplicateParams.push(req.user.id);
          }
          
          const [duplicates] = await pool.execute(duplicateQuery, duplicateParams);
          if (duplicates && duplicates.length > 0) {
            return res.status(409).json(
              createResponse(false, 'Campaign name already exists')
            );
          }
        }
        
        updateFields.push('name = ?');
        params.push(name.trim());
      }

      if (persona !== undefined) {
        updateFields.push('persona = ?');
        params.push(persona?.trim() || null); // Store persona as plain text
      }

      if (gender !== undefined) {
        updateFields.push('gender = ?');
        params.push(gender ? JSON.stringify(gender) : null);
      }

      if (age !== undefined) {
        updateFields.push('age = ?');
        params.push(age ? parseInt(age) : null);
      }

      if (location !== undefined) {
        updateFields.push('location = ?');
        params.push(location?.trim() || null);
      }

      if (creatives !== undefined) {
        updateFields.push('creatives = ?');
        params.push(creatives || 'image');
      }

      if (campaign_type_id !== undefined) {
        // Check if campaign type exists and user has access
        let typeCheckQuery = 'SELECT id FROM campaign_types WHERE id = ? AND is_active = 1';
        let typeCheckParams = [campaign_type_id];
        
        const isAdminForTypeUpdate = req.user.role && (req.user.role.level >= 8 || req.user.role.name === 'super_admin' || req.user.role.name === 'admin');
        if (!isAdminForTypeUpdate) {
          typeCheckQuery += ' AND created_by = ?';
          typeCheckParams.push(req.user.id);
        }
        
        const [typeCheck] = await pool.execute(typeCheckQuery, typeCheckParams);

        if (typeCheck.length === 0) {
          return res.status(400).json(
            createResponse(false, 'Invalid campaign type or you do not have access to it')
          );
        }

        updateFields.push('campaign_type_id = ?');
        params.push(parseInt(campaign_type_id));
      }

      if (brand !== undefined) {
        updateFields.push('brand = ?');
        params.push(brand?.trim() || null);
      }

      if (is_enabled !== undefined) {
        updateFields.push('is_enabled = ?');
        params.push(Boolean(is_enabled));
      }

      if (updateFields.length === 0) {
        return res.status(400).json(
          createResponse(false, 'No fields to update')
        );
      }

      updateFields.push('updated_at = NOW()');
      params.push(id);

      const query = `UPDATE campaigns SET ${updateFields.join(', ')} WHERE id = ?`;
      await pool.execute(query, params);

      // Get the updated campaign
      const [updatedCampaign] = await pool.execute(`
        SELECT c.*, ct.type_name as campaign_type_name
        FROM campaigns c
        LEFT JOIN campaign_types ct ON c.campaign_type_id = ct.id
        WHERE c.id = ?
      `, [id]);

      const formattedCampaign = formatCampaignData(updatedCampaign[0]);

      res.status(200).json(
        createResponse(true, 'Campaign updated successfully', formattedCampaign)
      );
    } catch (error) {
      console.error('Update campaign error:', error);

      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json(
          createResponse(false, 'Campaign name already exists')
        );
      }

      res.status(500).json(
        createResponse(false, 'Failed to update campaign', null, ['Internal server error'])
      );
    }
  },

  // Delete campaign with ownership validation
  deleteCampaign: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json(
          createResponse(false, 'Invalid campaign ID')
        );
      }

      // Check if campaign exists and user has access
      const [existingCampaign] = await pool.execute(
        'SELECT id, name, created_by FROM campaigns WHERE id = ?',
        [id]
      );

      if (existingCampaign.length === 0) {
        return res.status(404).json(
          createResponse(false, 'Campaign not found')
        );
      }

      const campaign = existingCampaign[0];

      // Privacy check - only owner or admin can delete
      if (!isAdminOrOwner(req, campaign.created_by)) {
        return res.status(403).json(
          createResponse(false, 'Access denied. You can only delete campaigns you created.')
        );
      }

      // Delete the campaign
      await pool.execute('DELETE FROM campaigns WHERE id = ?', [id]);

      res.status(200).json(
        createResponse(true, 'Campaign deleted successfully')
      );
    } catch (error) {
      console.error('Delete campaign error:', error);

      if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(400).json(
          createResponse(false, 'Cannot delete campaign. It is referenced by other records.')
        );
      }

      res.status(500).json(
        createResponse(false, 'Failed to delete campaign', null, ['Internal server error'])
      );
    }
  },

  // Toggle campaign status with ownership validation
  toggleCampaignStatus: async (req, res) => {
    try {
      const { id } = req.params;

      if (!id || isNaN(id)) {
        return res.status(400).json(
          createResponse(false, 'Invalid campaign ID')
        );
      }

      // Get current status and check ownership
      const [campaign] = await pool.execute(
        'SELECT id, is_enabled, created_by FROM campaigns WHERE id = ?',
        [id]
      );

      if (campaign.length === 0) {
        return res.status(404).json(
          createResponse(false, 'Campaign not found')
        );
      }

      const campaignData = campaign[0];

      // Privacy check - only owner or admin can toggle status
      if (!isAdminOrOwner(req, campaignData.created_by)) {
        return res.status(403).json(
          createResponse(false, 'Access denied. You can only modify campaigns you created.')
        );
      }

      const newStatus = !Boolean(campaignData.is_enabled);

      // Update status
      await pool.execute(
        'UPDATE campaigns SET is_enabled = ?, updated_at = NOW() WHERE id = ?',
        [newStatus, id]
      );

      res.status(200).json(
        createResponse(true, `Campaign ${newStatus ? 'enabled' : 'disabled'} successfully`, {
          id: parseInt(id),
          is_enabled: newStatus
        })
      );
    } catch (error) {
      console.error('Toggle campaign status error:', error);
      res.status(500).json(
        createResponse(false, 'Failed to toggle campaign status', null, ['Internal server error'])
      );
    }
  }
};

module.exports = campaignController;
