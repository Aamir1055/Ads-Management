const db = require('../config/database');

// Get all accounts
// Super admins see all accounts; regular users see only accounts they created
exports.getAllAccounts = async (req, res) => {
    try {
        const isSuperAdmin = req.user && req.user.role === 'super_admin';

        let query = 'SELECT * FROM account';
        const params = [];

        if (!isSuperAdmin) {
            query = 'SELECT * FROM account WHERE created_by = ?';
            params.push(req.user.id);
        }

        const [accounts] = await db.query(query, params);
        res.json(accounts);
    } catch (error) {
        console.error('Error getting accounts:', error);
        res.status(500).json({ message: 'Error retrieving accounts' });
    }
};

// Create a new account
exports.createAccount = async (req, res) => {
    try {
        const { account_name, amount } = req.body;

        // Validate required fields
        if (!account_name) {
            return res.status(400).json({ message: 'Account name is required' });
        }

        // Check for duplicate account name
        const [existing] = await db.query('SELECT id FROM account WHERE account_name = ?', [account_name]);
        if (existing.length > 0) {
            return res.status(400).json({ message: 'Account name already exists' });
        }

        // Insert new account and set created_by automatically
        const createdBy = req.user && req.user.id ? req.user.id : null;

        const [result] = await db.query(
            'INSERT INTO account (account_name, amount, created_by) VALUES (?, ?, ?)',
            [account_name, amount || 0, createdBy]
        );

        res.status(201).json({
            id: result.insertId,
            account_name,
            amount: amount || 0,
            created_by: createdBy
        });
    } catch (error) {
        console.error('Error creating account:', error);
        res.status(500).json({ message: 'Error creating account' });
    }
};

// Get account by ID
exports.getAccountById = async (req, res) => {
    try {
        const accountId = req.params.id;
        const isSuperAdmin = req.user && req.user.role === 'super_admin';

        let query = 'SELECT * FROM account WHERE id = ?';
        const params = [accountId];

        if (!isSuperAdmin) {
            // Regular users can only fetch accounts they created
            query += ' AND created_by = ?';
            params.push(req.user.id);
        }

        const [account] = await db.query(query, params);

        if (account.length === 0) {
            return res.status(404).json({ message: 'Account not found or access denied' });
        }

        res.json(account[0]);
    } catch (error) {
        console.error('Error getting account:', error);
        res.status(500).json({ message: 'Error retrieving account' });
    }
};