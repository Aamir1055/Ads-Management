const express = require('express');
const router = express.Router();
const accountsController = require('../controllers/accountsController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { createPermissionMiddleware } = require('../config/rbacRouteMapping');

// Simple request logger
router.use((req, res, next) => {
  console.log(`[Accounts] ${req.method} ${req.originalUrl}`);
  next();
});

// Protect routes
router.use(authenticateToken);

// RBAC-protected routes
router.post('/', createPermissionMiddleware.accounts.create(), accountsController.createAccount);
router.get('/', createPermissionMiddleware.accounts.read(), accountsController.getAllAccounts);
router.post('/:id/add-amount', createPermissionMiddleware.accounts.update(), accountsController.addAmount);

module.exports = router;
