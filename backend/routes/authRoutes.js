const express = require('express');
const router = express.Router();
const { login, loginWith2FA, logout, getMe, validateCredentials } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/login', login);
router.post('/login-2fa', loginWith2FA);
router.post('/logout', logout);

// Protected routes
router.get('/me', protect, getMe);
router.post('/validate-credentials', protect, validateCredentials);

module.exports = router;
