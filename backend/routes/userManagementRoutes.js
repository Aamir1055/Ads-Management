const express = require('express');
const router = express.Router();
const userManagementController = require('../controllers/userManagementController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Routes for user management
// GET /api/user-management - Get all users with pagination and filtering
router.get('/', userManagementController.getAllUsers);

// GET /api/user-management/roles - Get all available roles
router.get('/roles', userManagementController.getRoles);

// GET /api/user-management/:id - Get specific user by ID
router.get('/:id', userManagementController.getUserById);

// POST /api/user-management - Create a new user
router.post('/', userManagementController.createUser);

// PUT /api/user-management/:id - Update existing user
router.put('/:id', userManagementController.updateUser);

// DELETE /api/user-management/:id - Delete user (soft delete)
router.delete('/:id', userManagementController.deleteUser);

// PATCH /api/user-management/:id/toggle-status - Toggle user active status
router.patch('/:id/toggle-status', userManagementController.toggleUserStatus);

// POST /api/user-management/:id/generate-2fa - Generate 2FA QR code for user
router.post('/:id/generate-2fa', userManagementController.generate2FAQRCode);

module.exports = router;
