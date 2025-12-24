const express = require('express');
const router = express.Router();
const CampaignController = require('../controllers/campaignController_privacy');

// Import middleware
const { authenticateToken } = require('../middleware/authMiddleware');
const { checkModulePermission } = require('../middleware/rbacMiddleware');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/campaigns - Get all campaigns
router.get('/', 
  checkModulePermission('campaigns', 'read'),
  CampaignController.getAllCampaigns
);

// GET /api/campaigns/stats - Get campaign statistics 
router.get('/stats', 
  checkModulePermission('campaigns', 'read'),
  CampaignController.getCampaignStats
);

// GET /api/campaigns/by-brand/:brandId - Get campaigns by brand
router.get('/by-brand/:brandId', 
  checkModulePermission('campaigns', 'read'),
  CampaignController.getCampaignsByBrand
);

// GET /api/campaigns/:id - Get single campaign
router.get('/:id', 
  checkModulePermission('campaigns', 'read'),
  CampaignController.getCampaignById
);

// POST /api/campaigns - Create new campaign
router.post('/', 
  checkModulePermission('campaigns', 'create'),
  CampaignController.createCampaign
);

// PUT /api/campaigns/:id - Update campaign
router.put('/:id', 
  checkModulePermission('campaigns', 'update'),
  CampaignController.updateCampaign
);

// DELETE /api/campaigns/:id - Delete campaign
router.delete('/:id', 
  checkModulePermission('campaigns', 'delete'),
  CampaignController.deleteCampaign
);

// PUT /api/campaigns/:id/toggle-status - Toggle campaign active/inactive status
router.put('/:id/toggle-status', 
  checkModulePermission('campaigns', 'update'),
  CampaignController.toggleCampaignStatus
);

// PUT /api/campaigns/:id/toggle-enabled - Toggle campaign enabled/disabled status
router.put('/:id/toggle-enabled', 
  checkModulePermission('campaigns', 'update'),
  CampaignController.toggleCampaignEnabled
);

// PUT /api/campaigns/:id/activate - Activate campaign
router.put('/:id/activate', 
  checkModulePermission('campaigns', 'update'),
  CampaignController.activateCampaign
);

// PUT /api/campaigns/:id/deactivate - Deactivate campaign
router.put('/:id/deactivate', 
  checkModulePermission('campaigns', 'update'),
  CampaignController.deactivateCampaign
);

module.exports = router;
