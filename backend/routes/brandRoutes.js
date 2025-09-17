const express = require('express');
const router = express.Router();
const BrandController = require('../controllers/brandController');
const { protect } = require('../middleware/auth');
const { checkModulePermission } = require('../middleware/rbacMiddleware');

// Apply authentication middleware to all brand routes
router.use(protect);

console.log('🏷️ Brand routes initialized with authentication middleware and RBAC');

// Brand module permissions - using the enhanced RBAC system
// GET /api/brands - Get all brands (requires read permission)
router.get('/', checkModulePermission('brands', 'read'), (req, res, next) => {
  console.log('🏷️ Route: GET /api/brands - User:', req.user?.id, 'Permission:', req.currentPermission);
  next();
}, BrandController.getAllBrands);

// GET /api/brands/active - Get only active brands (requires read permission)
router.get('/active', checkModulePermission('brands', 'read'), (req, res, next) => {
  console.log('🏷️ Route: GET /api/brands/active - User:', req.user?.id, 'Permission:', req.currentPermission);
  next();
}, BrandController.getActiveBrands);

// GET /api/brands/:id - Get single brand (requires read permission)
router.get('/:id', checkModulePermission('brands', 'read'), (req, res, next) => {
  console.log('🏷️ Route: GET /api/brands/:id - User:', req.user?.id, 'ID:', req.params.id, 'Permission:', req.currentPermission);
  next();
}, BrandController.getBrandById);

// GET /api/brands/admin/stats - Get brand statistics (requires read permission + admin level)
router.get('/admin/stats', checkModulePermission('brands', 'read'), (req, res, next) => {
  console.log('🏷️ Route: GET /api/brands/admin/stats - User:', req.user?.id, 'Permission:', req.currentPermission);
  next();
}, BrandController.getBrandStats);

// POST /api/brands - Create new brand (requires create permission)
router.post('/', checkModulePermission('brands', 'create'), (req, res, next) => {
  console.log('🏷️ Route: POST /api/brands - User:', req.user?.id, 'Body:', req.body, 'Permission:', req.currentPermission);
  next();
}, BrandController.createBrand);

// PUT /api/brands/:id - Update brand (requires update permission)
router.put('/:id', checkModulePermission('brands', 'update'), (req, res, next) => {
  console.log('🏷️ Route: PUT /api/brands/:id - User:', req.user?.id, 'ID:', req.params.id, 'Body:', req.body, 'Permission:', req.currentPermission);
  next();
}, BrandController.updateBrand);

// PUT /api/brands/:id/toggle - Toggle brand active status (requires update permission)
router.put('/:id/toggle', checkModulePermission('brands', 'update'), (req, res, next) => {
  console.log('🏷️ Route: PUT /api/brands/:id/toggle - User:', req.user?.id, 'ID:', req.params.id, 'Permission:', req.currentPermission);
  next();
}, BrandController.toggleBrandStatus);

// DELETE /api/brands/:id - Delete brand (requires delete permission)
router.delete('/:id', checkModulePermission('brands', 'delete'), (req, res, next) => {
  console.log('🏷️ Route: DELETE /api/brands/:id - User:', req.user?.id, 'ID:', req.params.id, 'Permission:', req.currentPermission);
  next();
}, BrandController.deleteBrand);

console.log('🏷️ Brand routes configuration complete');

module.exports = router;
