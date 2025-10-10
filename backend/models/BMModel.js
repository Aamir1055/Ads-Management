const { pool } = require('../config/database');

class BMModel {
    // Get all BMs with pagination, filtering, and search (filtered by user)
    static async getAll({ 
        page = 1, 
        limit = 10, 
        search = '', 
        status = '', 
        sortBy = 'created_at', 
        sortOrder = 'DESC',
        userId = null,
        userRole = null
    } = {}) {
        try {
            const offset = (page - 1) * limit;
            let whereConditions = [];
            let queryParams = [];
            
            // Debug logging
            console.log('🔍 BMModel.getAll params:', { page, limit, search, status, sortBy, sortOrder, userId, userRole });
            
            // Filter by user - only show BMs created by the current user (unless super admin)
            if (userRole !== 'super_admin' && userId) {
                whereConditions.push('bm.created_by = ?');
                queryParams.push(userId);
                console.log('🔎 User filter applied:', userId);
            }
            
            // Search functionality
            if (search) {
                whereConditions.push('(bm.bm_name LIKE ? OR bm.email LIKE ? OR bm.phone_number LIKE ?)');
                queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
                console.log('🔎 Search applied:', search);
            }
            
            // Status filter
            if (status) {
                whereConditions.push('bm.status = ?');
                queryParams.push(status);
                console.log('🔎 Status filter applied:', status);
            }
            
            const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
            
            // Count total records
            const countQuery = `
                SELECT COUNT(*) as total 
                FROM bm 
                ${whereClause}
            `;
            const [countResult] = await pool.query(countQuery, queryParams);
            const total = countResult[0].total;
            
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
                        SELECT COUNT(*) 
                        FROM ads_managers am 
                        WHERE am.bm_id = bm.id
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
                    total: total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            console.error('Error in BMModel.getAll:', error);
            throw new Error('Failed to fetch BMs: ' + error.message);
        }
    }
    
    // Get BM by ID (with user filtering)
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
                    bm.updated_at,
                    (
                        SELECT COUNT(*) 
                        FROM ads_managers am 
                        WHERE am.bm_id = bm.id
                    ) as ads_managers_count
                FROM bm 
                WHERE bm.id = ?
            `;
            
            const params = [id];
            
            // Filter by user - only allow access to BMs created by the current user (unless super admin)
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
    
    // Create new BM
    static async create({ bm_name, email, phone_number, status = 'enabled', created_by }) {
        try {
            // Check if email already exists
            const existingQuery = 'SELECT id FROM bm WHERE email = ?';
            const [existing] = await pool.query(existingQuery, [email]);
            
            if (existing.length > 0) {
                throw new Error('BM with this email already exists');
            }
            
            const query = `
                INSERT INTO bm (bm_name, email, phone_number, status, created_by)
                VALUES (?, ?, ?, ?, ?)
            `;
            
            const [result] = await pool.query(query, [bm_name, email, phone_number, status, created_by]);
            
            // Return the created BM
            return await this.getById(result.insertId);
        } catch (error) {
            console.error('Error in BMModel.create:', error);
            if (error.message.includes('already exists')) {
                throw error;
            }
            throw new Error('Failed to create BM: ' + error.message);
        }
    }
    
    // Update BM
    static async update(id, { bm_name, email, phone_number, status }) {
        try {
            // Check if BM exists
            const existing = await this.getById(id);
            if (!existing) {
                throw new Error('BM not found');
            }
            
            // Check if email is being changed to an existing one
            if (email && email !== existing.email) {
                const emailCheck = 'SELECT id FROM bm WHERE email = ? AND id != ?';
                const [emailExists] = await pool.query(emailCheck, [email, id]);
                
                if (emailExists.length > 0) {
                    throw new Error('BM with this email already exists');
                }
            }
            
            const query = `
                UPDATE bm 
                SET bm_name = ?, email = ?, phone_number = ?, status = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;
            
            await pool.query(query, [bm_name, email, phone_number, status, id]);
            
            // Return the updated BM
            return await this.getById(id);
        } catch (error) {
            console.error('Error in BMModel.update:', error);
            if (error.message.includes('not found') || error.message.includes('already exists')) {
                throw error;
            }
            throw new Error('Failed to update BM: ' + error.message);
        }
    }
    
    // Delete BM
    static async delete(id) {
        try {
            // Check if BM exists
            const existing = await this.getById(id);
            if (!existing) {
                throw new Error('BM not found');
            }
            
            const query = 'DELETE FROM bm WHERE id = ?';
            const [result] = await pool.query(query, [id]);
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error in BMModel.delete:', error);
            if (error.message.includes('not found')) {
                throw error;
            }
            throw new Error('Failed to delete BM: ' + error.message);
        }
    }
    
    // Toggle BM status
    static async toggleStatus(id) {
        try {
            const bm = await this.getById(id);
            if (!bm) {
                throw new Error('BM not found');
            }
            
            let newStatus;
            switch (bm.status) {
                case 'enabled':
                    newStatus = 'disabled';
                    break;
                case 'disabled':
                    newStatus = 'enabled';
                    break;
                case 'suspended_temporarily':
                    newStatus = 'enabled';
                    break;
                default:
                    newStatus = 'enabled';
            }
            
            const query = 'UPDATE bm SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
            await pool.query(query, [newStatus, id]);
            
            return await this.getById(id);
        } catch (error) {
            console.error('Error in BMModel.toggleStatus:', error);
            if (error.message.includes('not found')) {
                throw error;
            }
            throw new Error('Failed to toggle BM status: ' + error.message);
        }
    }
    
    // Get BM stats (filtered by user)
    static async getStats(userId = null, userRole = null) {
        try {
            let query = `
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN status = 'enabled' THEN 1 END) as enabled,
                    COUNT(CASE WHEN status = 'disabled' THEN 1 END) as disabled,
                    COUNT(CASE WHEN status = 'suspended_temporarily' THEN 1 END) as suspended
                FROM bm
            `;
            
            const params = [];
            
            // Filter by user - only count BMs created by the current user (unless super admin)
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
            let params = [email];
            
            if (excludeId) {
                query += ' AND id != ?';
                params.push(excludeId);
            }
            
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
            let query = `
                SELECT id, bm_name, email 
                FROM bm 
                WHERE status = 'enabled'
            `;
            
            const params = [];
            
            // Filter by user - only show BMs created by the current user (unless super admin)
            if (userRole !== 'super_admin' && userId) {
                query += ' AND created_by = ?';
                params.push(userId);
            }
            
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