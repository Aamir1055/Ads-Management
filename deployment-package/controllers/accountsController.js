const { pool } = require('../config/database');

const createResponse = (success, message, data = null, errors = null) => ({
  success,
  message,
  ...(data !== null && { data }),
  ...(errors && { errors }),
});

const accountsController = {
  // Create account
  createAccount: async (req, res) => {
    try {
      const { account_name, amount = 0 } = req.body;

      if (!account_name || !String(account_name).trim()) {
        return res.status(400).json({ success: false, message: 'Account name is required' });
      }

      const acctName = String(account_name).trim();
      const amt = (amount === null || amount === undefined || amount === '') ? 0.0 : parseFloat(amount);
      if (isNaN(amt)) {
        return res.status(400).json({ success: false, message: 'Amount must be a number' });
      }

      // Check duplicate
      const [existing] = await pool.query('SELECT id FROM account WHERE account_name = ?', [acctName]);
      if (existing && existing.length > 0) {
        return res.status(409).json({ success: false, message: 'Account name already exists' });
      }

      // Insert and set created_by from authenticated user if available
      const createdBy = (req.user && req.user.id) ? req.user.id : null;
      const [result] = await pool.query('INSERT INTO account (account_name, amount, created_by) VALUES (?, ?, ?)', [acctName, amt, createdBy]);
      if (!result || !result.insertId) {
        return res.status(500).json({ success: false, message: 'Failed to create account' });
      }

      const [rows] = await pool.query('SELECT id, account_name, amount, created_by FROM account WHERE id = ?', [result.insertId]);
      const account = (rows && rows[0]) ? rows[0] : null;

      return res.status(201).json(account);
    } catch (error) {
      console.error('Error in createAccount:', error);
      if (error && error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ success: false, message: 'Account name already exists' });
      }
      return res.status(500).json({ success: false, message: 'Internal server error', errors: [error.message] });
    }
  },

  // List accounts (simple)
  getAllAccounts: async (req, res) => {
    try {
      // Determine super admin status robustly (supports multiple shapes)
      const roleObj = req.user?.role || {};
      const roleNameRaw = roleObj.name || req.user?.role_name || req.user?.role;
      const roleLevel = Number(roleObj.level || req.user?.role_level || 0);
      const roleName = String(roleNameRaw || '').toLowerCase();
      const isSuperAdmin = roleLevel >= 10 || ['super_admin', 'super admin', 'superadmin'].includes(roleName);

      let query = 'SELECT id, account_name, amount, created_by FROM account';
      const params = [];

      if (!isSuperAdmin) {
        query += ' WHERE created_by = ?';
        params.push(req.user.id);
      }

      query += ' ORDER BY account_name ASC';

      const [rows] = await pool.query(query, params);

      // Return a consistent shape, but keep backward compatibility
      return res.status(200).json(rows);
    } catch (error) {
      console.error('Error in getAllAccounts:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch accounts', errors: [error.message] });
    }
  },

  // Add amount to an account (super admin: any, others: only their own)
  addAmount: async (req, res) => {
    try {
      const accountId = parseInt(req.params.id, 10)
      const amountParam = req.body?.amount

      if (!Number.isInteger(accountId) || accountId <= 0) {
        return res.status(400).json({ success: false, message: 'Invalid account ID' })
      }

      // Validate amount as integer (can be positive only for this action)
      const addAmount = parseInt(amountParam, 10)
      if (!Number.isFinite(addAmount) || isNaN(addAmount)) {
        return res.status(400).json({ success: false, message: 'Amount must be an integer' })
      }

      // Determine access: super admin can edit any, others only their own
      const roleObj = req.user?.role || {}
      const roleNameRaw = roleObj.name || req.user?.role_name || req.user?.role
      const roleLevel = Number(roleObj.level || req.user?.role_level || 0)
      const roleName = String(roleNameRaw || '').toLowerCase()
      const isSuperAdmin = roleLevel >= 10 || ['super_admin', 'super admin', 'superadmin'].includes(roleName)

      // Ensure account exists and ownership if not super admin
      let selectQuery = 'SELECT id, amount, created_by FROM account WHERE id = ?'
      const [rows] = await pool.query(selectQuery, [accountId])
      if (!rows || rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Account not found' })
      }
      const acct = rows[0]
      if (!isSuperAdmin && acct.created_by !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Access denied' })
      }

      const [result] = await pool.query('UPDATE account SET amount = amount + ? WHERE id = ?', [addAmount, accountId])
      if (!result || result.affectedRows === 0) {
        return res.status(500).json({ success: false, message: 'Failed to update amount' })
      }

      const [updated] = await pool.query('SELECT id, account_name, amount, created_by FROM account WHERE id = ?', [accountId])
      return res.status(200).json({ success: true, message: 'Amount added successfully', data: { account: updated[0] } })
    } catch (error) {
      console.error('Error in addAmount:', error)
      return res.status(500).json({ success: false, message: 'Failed to add amount', errors: [error.message] })
    }
  }
};

module.exports = accountsController;
