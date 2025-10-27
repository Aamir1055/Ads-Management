const express = require('express');
const router = express.Router();
const { login, loginWith2FA, logout, getMe, validateCredentials } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authenticateToken, refreshAccessToken } = require('../middleware/authMiddleware');

// Public routes
router.post('/login', login);
router.post('/login-2fa', loginWith2FA);
router.post('/refresh', refreshAccessToken);
router.post('/logout', logout);

// Protected routes
router.get('/me', protect, getMe);
router.post('/validate-credentials', protect, validateCredentials);

// User access route (alias for frontend compatibility)
router.get('/user-access', authenticateToken, async (req, res, next) => {
  try {
    // Forward to the user access modules endpoint
    const userAccessRoutes = require('./userAccessRoutes');
    req.url = '/modules';
    userAccessRoutes(req, res, next);
  } catch (error) {
    console.error('Error in user-access alias:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get user access',
      error: error.message 
    });
  }
});

module.exports = router;
