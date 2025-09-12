const express = require('express');
const router = express.Router();
const {
  getAllAds,
  getAd,
  createAd,
  updateAd,
  deleteAd,
  getAdStats
} = require('../controllers/adsController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// Routes accessible to all authenticated users
router.get('/', getAllAds);
router.get('/:id', getAd);
router.get('/:id/stats', getAdStats);

// Routes for admin and manager roles (role IDs: 1=admin, 2=manager)
router.use(authorize(1, 2));
router.post('/', createAd);
router.put('/:id', updateAd);
router.delete('/:id', deleteAd);

module.exports = router;
