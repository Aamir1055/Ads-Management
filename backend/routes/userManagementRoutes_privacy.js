const express = require('express');
const router = express.Router();
const userManagementController = require('../controllers/userManagementController_privacy');
const { authenticateToken } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Routes for user management with privacy filtering

// GET /api/user-management/roles - Get all available roles (accessible to all authenticated users)
router.get('/roles', userManagementController.getRoles);

// GET /api/user-management - Get all users with privacy filtering
// - Admins see all users
// - Regular users see only themselves
router.get('/', userManagementController.getAllUsers);

// GET /api/user-management/:id - Get specific user by ID with privacy validation
// - Admins can view any user
// - Regular users can only view themselves
router.get('/:id', userManagementController.getUserById);

// POST /api/user-management - Create a new user (Admin only)
router.post('/', userManagementController.createUser);

// PUT /api/user-management/:id - Update existing user with privacy validation
// - Admins can update any user (including role changes, status changes)
// - Regular users can only update their own basic info (username, password, 2FA)
router.put('/:id', userManagementController.updateUser);

// DELETE /api/user-management/:id - Delete user (Admin only)
router.delete('/:id', userManagementController.deleteUser);

// PATCH /api/user-management/:id/toggle-status - Toggle user active status (Admin only)
router.patch('/:id/toggle-status', userManagementController.toggleUserStatus);

// POST /api/user-management/:id/generate-2fa - Generate 2FA QR code for user
// - Admins can generate for any user
// - Regular users can only generate for themselves
router.post('/:id/generate-2fa', userManagementController.generate2FAQRCode);

module.exports = router;
