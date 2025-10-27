const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { pool } = require('../config/database');


// Get cards by account ID
exports.getCardsByAccount = async (req, res) => {
    try {
        const accountId = req.params.accountId;
    const userId = req.user.id;
    const isSuperAdmin = req.user.role && req.user.role.name === 'super_admin';

        // Build the query based on user role
        let query = 'SELECT * FROM cards WHERE account_id = ?';
        const queryParams = [accountId];

        // If not super admin, only show cards created by the user
        if (!isSuperAdmin) {
            query += ' AND created_by = ?';
            queryParams.push(userId);
        }

    const [cards] = await pool.query(query, queryParams);

    res.json(cards);
    } catch (error) {
        console.error('Error getting cards by account:', error);
        res.status(500).json({ message: 'Error retrieving cards' });
    }
};