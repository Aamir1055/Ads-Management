const express = require('express');
const router = express.Router();
const cardUsersController = require('../controllers/cardUsersController_privacy');
const { authenticateToken } = require('../middleware/authMiddleware');
const { checkModulePermission } = require('../middleware/rbacMiddleware');

// Apply authentication to all routes
router.use(authenticateToken);

// RBAC middleware for card users operations
const cardUsersReadAccess = checkModulePermission('card_users', 'read');
const cardUsersCreateAccess = checkModulePermission('card_users', 'create');
const cardUsersUpdateAccess = checkModulePermission('card_users', 'update');
const cardUsersDeleteAccess = checkModulePermission('card_users', 'delete');

// Base CRUD routes with RBAC protection
router.post('/', cardUsersCreateAccess, cardUsersController.createCardUser);
router.get('/', cardUsersReadAccess, cardUsersController.getAllCardUsers);
router.get('/:id', cardUsersReadAccess, cardUsersController.getCardUserById);
router.put('/:id', cardUsersUpdateAccess, cardUsersController.updateCardUser);
router.delete('/:id', cardUsersDeleteAccess, cardUsersController.deleteCardUser);

// Helper routes (require read access)
router.get('/user/:userId/cards', cardUsersReadAccess, cardUsersController.getCardsByUser);
router.get('/card/:cardId/users', cardUsersReadAccess, cardUsersController.getUsersByCard);

module.exports = router;
