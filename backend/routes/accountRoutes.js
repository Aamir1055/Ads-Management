const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const auth = require('../middleware/auth');

// Get all accounts (filtered by user role)
router.get('/', auth, accountController.getAllAccounts);

// Create new account (authenticated users) - created_by will be set automatically
router.post('/', auth, accountController.createAccount);

// Get account by ID
router.get('/:id', auth, accountController.getAccountById);

module.exports = router;