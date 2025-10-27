const Campaign = require('../models/Campaign');

class CampaignController {
  // GET /api/campaigns - Get all campaigns
  static async getAllCampaigns(req, res) {
    try {
      console.log('🚀 CampaignController.getAllCampaigns - User:', req.user?.id);
      
      const { 
        search, 
        status, 
        enabled, 
        brand_id, 
        campaign_type_id, 
        creatives,
        page = 1,
        limit = 10
      } = req.query;
      
      const filters = {};
      
      // Parse status filter
      if (status && ['active', 'inactive'].includes(status)) {
        filters.status = status;
      }
      
      // Parse enabled filter
      if (enabled === 'true') {
        filters.isEnabled = 1;
      } else if (enabled === 'false') {
        filters.isEnabled = 0;
      }
      
      // Parse brand filter
      if (brand_id && !isNaN(parseInt(brand_id))) {
        filters.brandId = parseInt(brand_id);
      }
      
      // Parse campaign type filter
      if (campaign_type_id && !isNaN(parseInt(campaign_type_id))) {
        filters.campaignTypeId = parseInt(campaign_type_id);
      }
      
      // Parse creatives filter
      if (creatives && ['video', 'image', 'carousel', 'collection'].includes(creatives)) {
        filters.creatives = creatives;
      }
      
      // Add search filter
      if (search && search.trim()) {
        filters.search = search.trim();
      }

      console.log('🚀 Applied filters:', filters);

      const campaigns = await Campaign.findAll(filters);

      // Simple pagination (if needed)
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.max(1, Math.min(100, parseInt(limit)));
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      const paginatedCampaigns = campaigns.slice(startIndex, endIndex);

      console.log(`🚀 Found ${campaigns.length} campaigns (showing ${paginatedCampaigns.length})`);

      return res.status(200).json({
        success: true,
        data: paginatedCampaigns,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: campaigns.length,
          totalPages: Math.ceil(campaigns.length / limitNum)
        },
        message: campaigns.length === 0 ? 'No campaigns found' : `Found ${campaigns.length} campaigns`
      });
    } catch (error) {
      console.error('❌ Error in CampaignController.getAllCampaigns:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch campaigns',
        error: error.message
      });
    }
  }

  // GET /api/campaigns/:id - Get single campaign
  static async getCampaignById(req, res) {
    try {
      console.log('🚀 CampaignController.getCampaignById - User:', req.user?.id);
      
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid campaign ID'
        });
      }

      const campaign = await Campaign.findById(parseInt(id));

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found'
        });
      }

      console.log(`🚀 Found campaign: ${campaign.name}`);

      return res.status(200).json({
        success: true,
        data: campaign,
        message: 'Campaign retrieved successfully'
      });
    } catch (error) {
      console.error('❌ Error in CampaignController.getCampaignById:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch campaign',
        error: error.message
      });
    }
  }

  // POST /api/campaigns - Create new campaign
  static async createCampaign(req, res) {
    try {
      console.log('🚀 CampaignController.createCampaign - User:', req.user?.id);
      
      const {
        name,
        persona,
        gender,
        min_age,
        max_age,
        location,
        creatives,
        campaign_type_id,
        brand
      } = req.body;
      
      const userId = req.user?.id;

      // Basic validation
      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Campaign name is required'
        });
      }

      // Validate input data
      const campaignData = {
        name: name.trim(),
        persona: persona || null,
        gender: gender || null,
        min_age: min_age || null,
        max_age: max_age || null,
        location: location || null,
        creatives: creatives || 'image',
        campaign_type_id: campaign_type_id || null,
        brand: brand || null,
        created_by: userId
      };

      // Server-side validation
      const validationErrors = Campaign.validate(campaignData);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors
        });
      }

      // Check if name already exists
      const nameValid = await Campaign.validateName(campaignData.name);
      if (!nameValid) {
        return res.status(400).json({
          success: false,
          message: 'A campaign with this name already exists'
        });
      }

      console.log('🚀 Creating campaign with data:', campaignData);

      const campaign = await Campaign.create(campaignData);

      console.log(`✅ Created campaign: ${campaign.name}`);

      return res.status(201).json({
        success: true,
        data: campaign,
        message: 'Campaign created successfully'
      });
    } catch (error) {
      console.error('❌ Error in CampaignController.createCampaign:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create campaign',
        error: error.message
      });
    }
  }

  // PUT /api/campaigns/:id - Update campaign
  static async updateCampaign(req, res) {
    try {
      console.log('🚀 CampaignController.updateCampaign - User:', req.user?.id);
      
      const { id } = req.params;
      const {
        name,
        persona,
        gender,
        min_age,
        max_age,
        location,
        creatives,
        is_enabled,
        status,
        campaign_type_id,
        brand
      } = req.body;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid campaign ID'
        });
      }

      // Check if campaign exists
      const existingCampaign = await Campaign.findById(parseInt(id));
      if (!existingCampaign) {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found'
        });
      }

      // Basic validation
      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Campaign name is required'
        });
      }

      // Prepare update data
      const campaignData = {
        name: name.trim(),
        persona: persona !== undefined ? persona : existingCampaign.persona,
        gender: gender !== undefined ? gender : existingCampaign.gender,
        min_age: min_age !== undefined ? min_age : existingCampaign.min_age,
        max_age: max_age !== undefined ? max_age : existingCampaign.max_age,
        location: location !== undefined ? location : existingCampaign.location,
        creatives: creatives || existingCampaign.creatives,
        is_enabled: is_enabled !== undefined ? is_enabled : existingCampaign.is_enabled,
        status: status || existingCampaign.status,
        campaign_type_id: campaign_type_id !== undefined ? campaign_type_id : existingCampaign.campaign_type_id,
        brand: brand !== undefined ? brand : existingCampaign.brand
      };

      // Server-side validation
      const validationErrors = Campaign.validate(campaignData, true);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors
        });
      }

      // Check if name already exists (excluding current campaign)
      const nameValid = await Campaign.validateName(campaignData.name, parseInt(id));
      if (!nameValid) {
        return res.status(400).json({
          success: false,
          message: 'A campaign with this name already exists'
        });
      }

      console.log('🚀 Updating campaign with data:', campaignData);

      const campaign = await Campaign.update(parseInt(id), campaignData);

      console.log(`✅ Updated campaign: ${campaign.name}`);

      return res.status(200).json({
        success: true,
        data: campaign,
        message: 'Campaign updated successfully'
      });
    } catch (error) {
      console.error('❌ Error in CampaignController.updateCampaign:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update campaign',
        error: error.message
      });
    }
  }

  // DELETE /api/campaigns/:id - Delete campaign
  static async deleteCampaign(req, res) {
    try {
      console.log('🚀 CampaignController.deleteCampaign - User:', req.user?.id);
      
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid campaign ID'
        });
      }

      // Check if campaign exists
      const existingCampaign = await Campaign.findById(parseInt(id));
      if (!existingCampaign) {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found'
        });
      }

      console.log(`🚀 Deleting campaign: ${existingCampaign.name}`);

      await Campaign.delete(parseInt(id));

      console.log(`✅ Deleted campaign: ${existingCampaign.name}`);

      return res.status(200).json({
        success: true,
        message: 'Campaign deleted successfully'
      });
    } catch (error) {
      console.error('❌ Error in CampaignController.deleteCampaign:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete campaign',
        error: error.message
      });
    }
  }

  // PUT /api/campaigns/:id/toggle-status - Toggle campaign active/inactive status
  static async toggleCampaignStatus(req, res) {
    try {
      console.log('🚀 CampaignController.toggleCampaignStatus - User:', req.user?.id);
      
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid campaign ID'
        });
      }

      console.log(`🚀 Toggling status for campaign ID: ${id}`);

      const campaign = await Campaign.toggleActive(parseInt(id));

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found'
        });
      }

      console.log(`✅ Toggled campaign status: ${campaign.name} -> ${campaign.status}`);

      return res.status(200).json({
        success: true,
        data: campaign,
        message: `Campaign ${campaign.status === 'active' ? 'activated' : 'deactivated'} successfully`
      });
    } catch (error) {
      console.error('❌ Error in CampaignController.toggleCampaignStatus:', error);

      if (error.message === 'Campaign not found') {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to toggle campaign status',
        error: error.message
      });
    }
  }

  // PUT /api/campaigns/:id/toggle-enabled - Toggle campaign enabled/disabled status
  static async toggleCampaignEnabled(req, res) {
    try {
      console.log('🚀 CampaignController.toggleCampaignEnabled - User:', req.user?.id);
      
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid campaign ID'
        });
      }

      console.log(`🚀 Toggling enabled status for campaign ID: ${id}`);

      const campaign = await Campaign.toggleEnabled(parseInt(id));

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found'
        });
      }

      console.log(`✅ Toggled campaign enabled status: ${campaign.name} -> ${campaign.is_enabled ? 'Enabled' : 'Disabled'}`);

      return res.status(200).json({
        success: true,
        data: campaign,
        message: `Campaign ${campaign.is_enabled ? 'enabled' : 'disabled'} successfully`
      });
    } catch (error) {
      console.error('❌ Error in CampaignController.toggleCampaignEnabled:', error);

      if (error.message === 'Campaign not found') {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found'
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to toggle campaign enabled status',
        error: error.message
      });
    }
  }

  // PUT /api/campaigns/:id/activate - Activate campaign
  static async activateCampaign(req, res) {
    try {
      console.log('🚀 CampaignController.activateCampaign - User:', req.user?.id);
      
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid campaign ID'
        });
      }

      // Check if campaign exists
      const existingCampaign = await Campaign.findById(parseInt(id));
      if (!existingCampaign) {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found'
        });
      }

      if (existingCampaign.status === 'active') {
        return res.status(400).json({
          success: false,
          message: 'Campaign is already active'
        });
      }

      const campaign = await Campaign.update(parseInt(id), { status: 'active' });

      console.log(`✅ Activated campaign: ${campaign.name}`);

      return res.status(200).json({
        success: true,
        data: campaign,
        message: 'Campaign activated successfully'
      });
    } catch (error) {
      console.error('❌ Error in CampaignController.activateCampaign:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to activate campaign',
        error: error.message
      });
    }
  }

  // PUT /api/campaigns/:id/deactivate - Deactivate campaign
  static async deactivateCampaign(req, res) {
    try {
      console.log('🚀 CampaignController.deactivateCampaign - User:', req.user?.id);
      
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid campaign ID'
        });
      }

      // Check if campaign exists
      const existingCampaign = await Campaign.findById(parseInt(id));
      if (!existingCampaign) {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found'
        });
      }

      if (existingCampaign.status === 'inactive') {
        return res.status(400).json({
          success: false,
          message: 'Campaign is already inactive'
        });
      }

      const campaign = await Campaign.update(parseInt(id), { status: 'inactive' });

      console.log(`✅ Deactivated campaign: ${campaign.name}`);

      return res.status(200).json({
        success: true,
        data: campaign,
        message: 'Campaign deactivated successfully'
      });
    } catch (error) {
      console.error('❌ Error in CampaignController.deactivateCampaign:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to deactivate campaign',
        error: error.message
      });
    }
  }

  // GET /api/campaigns/stats - Get campaign statistics
  static async getCampaignStats(req, res) {
    try {
      console.log('🚀 CampaignController.getCampaignStats - User:', req.user?.id);

      const stats = await Campaign.getStats();

      console.log('🚀 Campaign stats:', stats);

      return res.status(200).json({
        success: true,
        data: stats,
        message: 'Campaign statistics retrieved successfully'
      });
    } catch (error) {
      console.error('❌ Error in CampaignController.getCampaignStats:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch campaign statistics',
        error: error.message
      });
    }
  }

  // GET /api/campaigns/by-brand/:brandId - Get campaigns by brand
  static async getCampaignsByBrand(req, res) {
    try {
      console.log('🚀 CampaignController.getCampaignsByBrand - User:', req.user?.id);
      
      const { brandId } = req.params;
      const { search, status, enabled } = req.query;

      if (!brandId || isNaN(parseInt(brandId))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid brand ID'
        });
      }

      const filters = {};
      
      // Apply additional filters
      if (status && ['active', 'inactive'].includes(status)) {
        filters.status = status;
      }
      
      if (enabled === 'true') {
        filters.isEnabled = 1;
      } else if (enabled === 'false') {
        filters.isEnabled = 0;
      }
      
      if (search && search.trim()) {
        filters.search = search.trim();
      }

      const campaigns = await Campaign.findByBrand(parseInt(brandId), filters);

      console.log(`🚀 Found ${campaigns.length} campaigns for brand ${brandId}`);

      return res.status(200).json({
        success: true,
        data: campaigns,
        message: campaigns.length === 0 ? 'No campaigns found for this brand' : `Found ${campaigns.length} campaigns`
      });
    } catch (error) {
      console.error('❌ Error in CampaignController.getCampaignsByBrand:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch campaigns by brand',
        error: error.message
      });
    }
  }
}

module.exports = CampaignController;
