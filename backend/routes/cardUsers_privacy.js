const express = require('express');
const router = express.Router();
const cardUsersController = require('../controllers/cardUsersController_privacy');
const { authenticateToken } = require('../middleware/authMiddleware');

// Apply authentication to all routes
router.use(authenticateToken);

// Base CRUD routes
router.post('/', cardUsersController.createCardUser);
router.get('/', cardUsersController.getAllCardUsers);
router.get('/:id', cardUsersController.getCardUserById);
router.put('/:id', cardUsersController.updateCardUser);
router.delete('/:id', cardUsersController.deleteCardUser);

// Helper routes
router.get('/user/:userId/cards', cardUsersController.getCardsByUser);
router.get('/card/:cardId/users', cardUsersController.getUsersByCard);

module.exports = router;
