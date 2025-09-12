const { pool } = require('../config/database')

// Helper function to create standard API response
const createResponse = (success, message, data = null, errors = null) => ({
  success,
  message,
  timestamp: new Date().toISOString(),
  ...(data && { data }),
  ...(errors && { errors })
})

// Helper to parse JSON fields safely
const parseJsonField = (value) => {
  if (!value) return null
  if (typeof value === 'string') {
    try {
      return JSON.parse(value)
    } catch {
      return null
    }
  }
  return value
}

// Helper to format campaign data for response
const formatCampaignData = (campaign) => {
  if (!campaign) return null
  
  return {
    ...campaign,
    persona: campaign.persona || null, // Keep persona as text
    gender: parseJsonField(campaign.gender),
    is_enabled: Boolean(campaign.is_enabled)
  }
}

const campaignController = {
  // Get all campaigns
  getAllCampaigns: async (req, res) => {
    try {
      const { page = 1, limit = 50, search = '', campaign_type_id = null, is_enabled = null } = req.query

      let whereClause = 'WHERE 1=1'
      const params = []

      if (search) {
        whereClause += ' AND (c.name LIKE ? OR c.brand LIKE ?)'
        params.push(`%${search}%`, `%${search}%`)
      }

      if (campaign_type_id) {
        whereClause += ' AND c.campaign_type_id = ?'
        params.push(campaign_type_id)
      }

      if (is_enabled !== null) {
        whereClause += ' AND c.is_enabled = ?'
        params.push(is_enabled === 'true' ? 1 : 0)
      }

      const offset = (page - 1) * limit

      const query = `
        SELECT c.*, ct.type_name as campaign_type_name
        FROM campaigns c
        LEFT JOIN campaign_types ct ON c.campaign_type_id = ct.id
        ${whereClause}
        ORDER BY c.created_at DESC
        LIMIT ? OFFSET ?
      `

      params.push(parseInt(limit), parseInt(offset))

      const [campaigns] = await pool.execute(query, params)

      // Format the data
      const formattedCampaigns = campaigns.map(formatCampaignData)

      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) as total
        FROM campaigns c
        LEFT JOIN campaign_types ct ON c.campaign_type_id = ct.id
        ${whereClause}
      `
      
      const [countResult] = await pool.execute(countQuery, params.slice(0, -2)) // Remove limit and offset params
      const total = countResult[0].total

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
      )
    } catch (error) {
      console.error('Get campaigns error:', error)
      res.status(500).json(
        createResponse(false, 'Failed to retrieve campaigns', null, ['Internal server error'])
      )
    }
  },

  // Get campaign by ID
  getCampaignById: async (req, res) => {
    try {
      const { id } = req.params

      if (!id || isNaN(id)) {
        return res.status(400).json(
          createResponse(false, 'Invalid campaign ID')
        )
      }

      const query = `
        SELECT c.*, ct.type_name as campaign_type_name
        FROM campaigns c
        LEFT JOIN campaign_types ct ON c.campaign_type_id = ct.id
        WHERE c.id = ?
      `

      const [campaigns] = await pool.execute(query, [id])

      if (campaigns.length === 0) {
        return res.status(404).json(
          createResponse(false, 'Campaign not found')
        )
      }

      const formattedCampaign = formatCampaignData(campaigns[0])

      res.status(200).json(
        createResponse(true, 'Campaign retrieved successfully', formattedCampaign)
      )
    } catch (error) {
      console.error('Get campaign by ID error:', error)
      res.status(500).json(
        createResponse(false, 'Failed to retrieve campaign', null, ['Internal server error'])
      )
    }
  },

  // Create new campaign
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
      } = req.body

      // Validation
      if (!name || !name.trim()) {
        return res.status(400).json(
          createResponse(false, 'Campaign name is required')
        )
      }

      if (!campaign_type_id) {
        return res.status(400).json(
          createResponse(false, 'Campaign type is required')
        )
      }

      // Check if campaign type exists
      const [typeCheck] = await pool.execute(
        'SELECT id FROM campaign_types WHERE id = ? AND is_active = 1',
        [campaign_type_id]
      )

      if (typeCheck.length === 0) {
        return res.status(400).json(
          createResponse(false, 'Invalid campaign type')
        )
      }

      // Get current user ID from auth (you may need to implement this based on your auth system)
      const created_by = req.user?.id

      let query, params
      
      if (created_by) {
        query = `
          INSERT INTO campaigns (
            name, persona, gender, age, location, creatives,
            campaign_type_id, brand, is_enabled, created_by,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `
        params = [
          name.trim(),
          persona?.trim() || null, // Store persona as plain text
          gender ? JSON.stringify(gender) : null,
          age ? parseInt(age) : null,
          location?.trim() || null,
          creatives || 'image',
          parseInt(campaign_type_id),
          brand?.trim() || null,
          Boolean(is_enabled),
          created_by
        ]
      } else {
        query = `
          INSERT INTO campaigns (
            name, persona, gender, age, location, creatives,
            campaign_type_id, brand, is_enabled,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `
        params = [
          name.trim(),
          persona?.trim() || null, // Store persona as plain text
          gender ? JSON.stringify(gender) : null,
          age ? parseInt(age) : null,
          location?.trim() || null,
          creatives || 'image',
          parseInt(campaign_type_id),
          brand?.trim() || null,
          Boolean(is_enabled)
        ]
      }

      const [result] = await pool.execute(query, params)

      // Get the created campaign
      const [newCampaign] = await pool.execute(`
        SELECT c.*, ct.type_name as campaign_type_name
        FROM campaigns c
        LEFT JOIN campaign_types ct ON c.campaign_type_id = ct.id
        WHERE c.id = ?
      `, [result.insertId])

      const formattedCampaign = formatCampaignData(newCampaign[0])

      res.status(201).json(
        createResponse(true, 'Campaign created successfully', formattedCampaign)
      )
    } catch (error) {
      console.error('Create campaign error:', error)
      
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json(
          createResponse(false, 'Campaign name already exists')
        )
      }

      res.status(500).json(
        createResponse(false, 'Failed to create campaign', null, ['Internal server error'])
      )
    }
  },

  // Update campaign
  updateCampaign: async (req, res) => {
    try {
      const { id } = req.params
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
      } = req.body

      if (!id || isNaN(id)) {
        return res.status(400).json(
          createResponse(false, 'Invalid campaign ID')
        )
      }

      // Check if campaign exists
      const [existingCampaign] = await pool.execute(
        'SELECT id FROM campaigns WHERE id = ?',
        [id]
      )

      if (existingCampaign.length === 0) {
        return res.status(404).json(
          createResponse(false, 'Campaign not found')
        )
      }

      // Build update query dynamically
      const updateFields = []
      const params = []

      if (name !== undefined) {
        if (!name.trim()) {
          return res.status(400).json(
            createResponse(false, 'Campaign name cannot be empty')
          )
        }
        updateFields.push('name = ?')
        params.push(name.trim())
      }

      if (persona !== undefined) {
        updateFields.push('persona = ?')
        params.push(persona?.trim() || null) // Store persona as plain text
      }

      if (gender !== undefined) {
        updateFields.push('gender = ?')
        params.push(gender ? JSON.stringify(gender) : null)
      }

      if (age !== undefined) {
        updateFields.push('age = ?')
        params.push(age ? parseInt(age) : null)
      }

      if (location !== undefined) {
        updateFields.push('location = ?')
        params.push(location?.trim() || null)
      }

      if (creatives !== undefined) {
        updateFields.push('creatives = ?')
        params.push(creatives || 'image')
      }

      if (campaign_type_id !== undefined) {
        // Check if campaign type exists
        const [typeCheck] = await pool.execute(
          'SELECT id FROM campaign_types WHERE id = ? AND is_active = 1',
          [campaign_type_id]
        )

        if (typeCheck.length === 0) {
          return res.status(400).json(
            createResponse(false, 'Invalid campaign type')
          )
        }

        updateFields.push('campaign_type_id = ?')
        params.push(parseInt(campaign_type_id))
      }

      if (brand !== undefined) {
        updateFields.push('brand = ?')
        params.push(brand?.trim() || null)
      }

      if (is_enabled !== undefined) {
        updateFields.push('is_enabled = ?')
        params.push(Boolean(is_enabled))
      }

      if (updateFields.length === 0) {
        return res.status(400).json(
          createResponse(false, 'No fields to update')
        )
      }

      updateFields.push('updated_at = NOW()')
      params.push(id)

      const query = `UPDATE campaigns SET ${updateFields.join(', ')} WHERE id = ?`
      await pool.execute(query, params)

      // Get the updated campaign
      const [updatedCampaign] = await pool.execute(`
        SELECT c.*, ct.type_name as campaign_type_name
        FROM campaigns c
        LEFT JOIN campaign_types ct ON c.campaign_type_id = ct.id
        WHERE c.id = ?
      `, [id])

      const formattedCampaign = formatCampaignData(updatedCampaign[0])

      res.status(200).json(
        createResponse(true, 'Campaign updated successfully', formattedCampaign)
      )
    } catch (error) {
      console.error('Update campaign error:', error)

      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json(
          createResponse(false, 'Campaign name already exists')
        )
      }

      res.status(500).json(
        createResponse(false, 'Failed to update campaign', null, ['Internal server error'])
      )
    }
  },

  // Delete campaign
  deleteCampaign: async (req, res) => {
    try {
      const { id } = req.params

      if (!id || isNaN(id)) {
        return res.status(400).json(
          createResponse(false, 'Invalid campaign ID')
        )
      }

      // Check if campaign exists
      const [existingCampaign] = await pool.execute(
        'SELECT id, name FROM campaigns WHERE id = ?',
        [id]
      )

      if (existingCampaign.length === 0) {
        return res.status(404).json(
          createResponse(false, 'Campaign not found')
        )
      }

      // Delete the campaign
      await pool.execute('DELETE FROM campaigns WHERE id = ?', [id])

      res.status(200).json(
        createResponse(true, 'Campaign deleted successfully')
      )
    } catch (error) {
      console.error('Delete campaign error:', error)

      if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(400).json(
          createResponse(false, 'Cannot delete campaign. It is referenced by other records.')
        )
      }

      res.status(500).json(
        createResponse(false, 'Failed to delete campaign', null, ['Internal server error'])
      )
    }
  },

  // Toggle campaign status
  toggleCampaignStatus: async (req, res) => {
    try {
      const { id } = req.params

      if (!id || isNaN(id)) {
        return res.status(400).json(
          createResponse(false, 'Invalid campaign ID')
        )
      }

      // Get current status
      const [campaign] = await pool.execute(
        'SELECT id, is_enabled FROM campaigns WHERE id = ?',
        [id]
      )

      if (campaign.length === 0) {
        return res.status(404).json(
          createResponse(false, 'Campaign not found')
        )
      }

      const newStatus = !Boolean(campaign[0].is_enabled)

      // Update status
      await pool.execute(
        'UPDATE campaigns SET is_enabled = ?, updated_at = NOW() WHERE id = ?',
        [newStatus, id]
      )

      res.status(200).json(
        createResponse(true, `Campaign ${newStatus ? 'enabled' : 'disabled'} successfully`, {
          id: parseInt(id),
          is_enabled: newStatus
        })
      )
    } catch (error) {
      console.error('Toggle campaign status error:', error)
      res.status(500).json(
        createResponse(false, 'Failed to toggle campaign status', null, ['Internal server error'])
      )
    }
  }
}

module.exports = campaignController
