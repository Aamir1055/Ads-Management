const express = require('express');
const router = express.Router();
const { login, loginWith2FA, logout, getMe, validateCredentials } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authenticateToken } = require('../middleware/authMiddleware');
const { refreshAccessToken } = require('../middleware/authMiddleware');

// Public routes
router.post('/login', login);
router.post('/login-2fa', loginWith2FA);
router.post('/refresh', refreshAccessToken);
router.post('/logout', logout);

// Protected routes
router.get('/me', protect, getMe);
router.post('/validate-credentials', protect, validateCredentials);

// User access route (alias for frontend compatibility)\nrouter.get('/user-access', authenticateToken, async (req, res) => {\n  try {\n    const userAccessController = require('../routes/userAccessRoutes');\n    req.url = '/modules';\n    userAccessController(req, res);\n  } catch (error) {\n    res.status(500).json({ success: false, message: 'Failed to get user access' });\n  }\n});

module.exports = router;
