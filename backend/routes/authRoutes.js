const express = require('express');
const router = express.Router();
const { login, loginWith2FA, logout, getMe, validateCredentials } = require('../controllers/authController');
// const { protect } = require('../middleware/auth'); // Uncomment when auth middleware is implemented

// Public routes
router.post('/login', login);
router.post('/login-2fa', loginWith2FA);
router.post('/logout', logout);

// Protected routes
// router.get('/me', protect, getMe); // Uncomment when auth middleware is ready
// router.post('/validate-credentials', protect, validateCredentials); // Uncomment when auth middleware is ready

// Temporary routes without authentication (remove when auth middleware is implemented)
router.get('/me', getMe);
router.post('/validate-credentials', validateCredentials);

module.exports = router;
