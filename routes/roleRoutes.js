const express = require('express');
const router = express.Router();
const RoleController = require('../controllers/roleController');
const { protect } = require('../middleware/auth');
const { checkModulePermission } = require('../middleware/rbacMiddleware');

// Apply authentication middleware to all role routes
router.use(protect);

console.log('🎭 Role routes initialized with authentication middleware and RBAC');

// Role management routes with proper RBAC permissions

// GET /api/roles - Get all roles (requires roles_read permission)
router.get('/', checkModulePermission('roles', 'read'), (req, res, next) => {
  console.log('🎭 Route: GET /api/roles - User:', req.user?.id, 'Permission:', req.currentPermission);
  next();
}, RoleController.getAllRoles);

// GET /api/roles/:id - Get single role (requires roles_read permission)
router.get('/:id', checkModulePermission('roles', 'read'), (req, res, next) => {
  console.log('🎭 Route: GET /api/roles/:id - User:', req.user?.id, 'ID:', req.params.id, 'Permission:', req.currentPermission);
  next();
}, RoleController.getRoleById);

// GET /api/roles/:id/permissions - Get role permissions (requires roles_read permission)
router.get('/:id/permissions', checkModulePermission('roles', 'read'), (req, res, next) => {
  console.log('🎭 Route: GET /api/roles/:id/permissions - User:', req.user?.id, 'ID:', req.params.id, 'Permission:', req.currentPermission);
  next();
}, RoleController.getRolePermissions);

// POST /api/roles - Create new role (requires roles_create permission)
router.post('/', checkModulePermission('roles', 'create'), (req, res, next) => {
  console.log('🎭 Route: POST /api/roles - User:', req.user?.id, 'Body:', req.body, 'Permission:', req.currentPermission);
  next();
}, RoleController.createRole);

// PUT /api/roles/:id - Update role (requires roles_update permission)
router.put('/:id', checkModulePermission('roles', 'update'), (req, res, next) => {
  console.log('🎭 Route: PUT /api/roles/:id - User:', req.user?.id, 'ID:', req.params.id, 'Body:', req.body, 'Permission:', req.currentPermission);
  next();
}, RoleController.updateRole);

// DELETE /api/roles/:id - Delete role (requires roles_delete permission)
router.delete('/:id', checkModulePermission('roles', 'delete'), (req, res, next) => {
  console.log('🎭 Route: DELETE /api/roles/:id - User:', req.user?.id, 'ID:', req.params.id, 'Permission:', req.currentPermission);
  next();
}, RoleController.deleteRole);

console.log('🎭 Role routes configuration complete');

module.exports = router;
