const express = require('express');
const router = express.Router();
const campaignController = require('../controllers/campaignController');

// Helper to catch async errors and forward to Express error handler
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Collection routes
router.post('/', asyncHandler(campaignController.createCampaign));     // POST   /api/campaigns
router.get('/', asyncHandler(campaignController.getAllCampaigns));     // GET    /api/campaigns

// Resource routes
router.get('/:id', asyncHandler(campaignController.getCampaignById));        // GET    /api/campaigns/:id
router.put('/:id', asyncHandler(campaignController.updateCampaign));         // PUT    /api/campaigns/:id
router.patch('/:id/toggle-status', asyncHandler(campaignController.toggleCampaignStatus)); // PATCH /api/campaigns/:id/toggle-status
router.delete('/:id', asyncHandler(campaignController.deleteCampaign));      // DELETE /api/campaigns/:id

module.exports = router;
