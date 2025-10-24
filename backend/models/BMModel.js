const { pool } = require('../config/database');

class BMModel {
    // Get Facebook account by email (helper)
    static async getFacebookAccountByEmail(email) {
        try {
            const [rows] = await pool.query('SELECT id, email FROM facebook_accounts WHERE email = ?', [email]);
            return rows[0] || null;
        } catch (error) {
            console.error('Error in BMModel.getFacebookAccountByEmail:', error);
            throw error;
        }
    }

    // Get all BMs with pagination, filtering, and search (filtered by user)
    static async getAll({ page = 1, limit = 10, search = '', status = '', sortBy = 'created_at', sortOrder = 'DESC', userId = null, userRole = null } = {}) {
        try {
            const offset = (page - 1) * limit;
            let whereConditions = [];
            let queryParams = [];

            // Filter by user - only show BMs created by the current user (unless super admin)
            if (userRole !== 'super_admin' && userId) {
                whereConditions.push('bm.created_by = ?');
                queryParams.push(userId);
            }

            // Search functionality
            if (search) {
                whereConditions.push('(bm.bm_name LIKE ? OR bm.email LIKE ? OR bm.phone_number LIKE ?)');
                queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
            }

            // Status filter
            if (status) {
                whereConditions.push('bm.status = ?');
                queryParams.push(status);
            }

            const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

            // Count total records
            const countQuery = `SELECT COUNT(*) as total FROM bm ${whereClause}`;
            const [countResult] = await pool.query(countQuery, queryParams);
            const total = countResult[0].total;

            // Validate sortBy to avoid injection
            const validSortColumns = ['created_at', 'bm_name', 'email', 'status'];
            if (!validSortColumns.includes(sortBy)) sortBy = 'created_at';
            sortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase()) ? sortOrder.toUpperCase() : 'DESC';

            // Get records with pagination
            const dataQuery = `
                SELECT 
                    bm.id,
                    bm.bm_name,
                    bm.email,
                    bm.phone_number,
                    bm.status,
                    bm.created_by,
                    bm.created_at,
                    bm.updated_at,
                    (
                        SELECT COUNT(*) FROM ads_managers am WHERE am.bm_id = bm.id
                    ) as ads_managers_count
                FROM bm
                ${whereClause}
                ORDER BY bm.${sortBy} ${sortOrder}
                LIMIT ? OFFSET ?
            `;

            const [rows] = await pool.query(dataQuery, [...queryParams, limit, offset]);

            return {
                data: rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            console.error('Error in BMModel.getAll:', error);
            throw new Error('Failed to fetch BMs: ' + error.message);
        }
    }

    // Get BM by ID (with optional user filtering)
    static async getById(id, userId = null, userRole = null) {
        try {
            let query = `
                SELECT 
                    bm.id,
                    bm.bm_name,
                    bm.email,
                    bm.phone_number,
                    bm.status,
                    bm.created_by,
                    bm.created_at,
                    bm.updated_at
                FROM bm
                WHERE bm.id = ?
            `;

            const params = [id];
            if (userRole !== 'super_admin' && userId) {
                query += ' AND bm.created_by = ?';
                params.push(userId);
            }

            const [rows] = await pool.query(query, params);
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Error in BMModel.getById:', error);
            throw new Error('Failed to fetch BM: ' + error.message);
        }
    }

    // Create new BM (does NOT enforce email uniqueness)
    static async create({ bm_name, email, phone_number, status = 'enabled', created_by }) {
        try {
            const query = `INSERT INTO bm (bm_name, email, phone_number, status, created_by) VALUES (?, ?, ?, ?, ?)`;
            const [result] = await pool.query(query, [bm_name, email, phone_number || null, status, created_by || null]);
            return await this.getById(result.insertId);
        } catch (error) {
            // Preserve the original DB error (including .code) so callers can inspect it
            console.error('Error in BMModel.create:', error);
            throw error;
        }
    }

    // Update BM
    static async update(id, { bm_name, email, phone_number, status }) {
        try {
            const existing = await this.getById(id);
            if (!existing) throw new Error('BM not found');

            const query = `UPDATE bm SET bm_name = ?, email = ?, phone_number = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
            await pool.query(query, [bm_name, email, phone_number, status, id]);
            return await this.getById(id);
        } catch (error) {
            console.error('Error in BMModel.update:', error);
            throw new Error('Failed to update BM: ' + error.message);
        }
    }

    // Delete BM
    static async delete(id) {
        try {
            const existing = await this.getById(id);
            if (!existing) throw new Error('BM not found');
            const query = 'DELETE FROM bm WHERE id = ?';
            const [result] = await pool.query(query, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error in BMModel.delete:', error);
            throw new Error('Failed to delete BM: ' + error.message);
        }
    }

    // Toggle BM status
    static async toggleStatus(id) {
        try {
            const bm = await this.getById(id);
            if (!bm) throw new Error('BM not found');

            let newStatus;
            switch (bm.status) {
                case 'enabled': newStatus = 'disabled'; break;
                case 'disabled': newStatus = 'enabled'; break;
                case 'suspended_temporarily': newStatus = 'enabled'; break;
                default: newStatus = 'enabled';
            }

            const query = 'UPDATE bm SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
            await pool.query(query, [newStatus, id]);
            return await this.getById(id);
        } catch (error) {
            console.error('Error in BMModel.toggleStatus:', error);
            throw new Error('Failed to toggle BM status: ' + error.message);
        }
    }

    // Get BM stats
    static async getStats(userId = null, userRole = null) {
        try {
            let query = `SELECT COUNT(*) as total, COUNT(CASE WHEN status = 'enabled' THEN 1 END) as enabled, COUNT(CASE WHEN status = 'disabled' THEN 1 END) as disabled, COUNT(CASE WHEN status = 'suspended_temporarily' THEN 1 END) as suspended FROM bm`;
            const params = [];
            if (userRole !== 'super_admin' && userId) {
                query += ' WHERE created_by = ?';
                params.push(userId);
            }
            const [rows] = await pool.query(query, params);
            return rows[0];
        } catch (error) {
            console.error('Error in BMModel.getStats:', error);
            throw new Error('Failed to get BM stats: ' + error.message);
        }
    }

    // Check if email exists
    static async emailExists(email, excludeId = null) {
        try {
            let query = 'SELECT id FROM bm WHERE email = ?';
            const params = [email];
            if (excludeId) { query += ' AND id != ?'; params.push(excludeId); }
            const [rows] = await pool.query(query, params);
            return rows.length > 0;
        } catch (error) {
            console.error('Error in BMModel.emailExists:', error);
            throw new Error('Failed to check email existence: ' + error.message);
        }
    }

    // Get BMs for dropdown (enabled only, filtered by user)
    static async getForDropdown(userId = null, userRole = null) {
        try {
            let query = `SELECT id, bm_name, email FROM bm WHERE status = 'enabled'`;
            const params = [];
            if (userRole !== 'super_admin' && userId) { query += ' AND created_by = ?'; params.push(userId); }
            query += ' ORDER BY bm_name ASC';
            const [rows] = await pool.query(query, params);
            return rows;
        } catch (error) {
            console.error('Error in BMModel.getForDropdown:', error);
            throw new Error('Failed to get BMs for dropdown: ' + error.message);
        }
    }
}

module.exports = BMModel;