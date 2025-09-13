const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permissionController');
const { authenticateToken, requirePermission, requireRoleLevel } = require('../middleware/authMiddleware');

// Routes that require authentication
router.use(authenticateToken);

// Get current user's permissions
router.get('/my-permissions', permissionController.getMyPermissions);

// Get current user's roles
router.get('/my-roles', permissionController.getMyRoles);

// Get specific user's permissions
router.get('/user/:userId/permissions', permissionController.getUserPermissions);

// Get all roles (admin only)
router.get('/roles', requireRoleLevel(8), permissionController.getRoles);

// Get all permissions (admin only)
router.get('/permissions', requireRoleLevel(8), permissionController.getPermissions);

// Get role with permissions (admin only)
router.get('/roles/:roleId', requireRoleLevel(8), permissionController.getRoleWithPermissions);

// Create new role (super admin only)
router.post('/roles', requireRoleLevel(10), permissionController.createRole);

// Update role (super admin only)
router.put('/roles/:roleId', requireRoleLevel(10), permissionController.updateRole);

// Delete role (super admin only)
router.delete('/roles/:roleId', requireRoleLevel(10), permissionController.deleteRole);

// Assign role to user (admin only)
router.post('/assign-role', requireRoleLevel(8), permissionController.assignRole);

// Get users with roles (admin only)
router.get('/users', requireRoleLevel(8), permissionController.getUsersWithRoles);

// Get audit log (super admin only)
router.get('/audit', requireRoleLevel(10), permissionController.getAuditLog);

module.exports = router;
