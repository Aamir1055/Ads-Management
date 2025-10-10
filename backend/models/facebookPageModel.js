const { pool } = require('../config/database');

class FacebookPageModel {
    
    // Get all Facebook pages with pagination, filtering, and account info (filtered by user)
    static async getAll(page = 1, limit = 10, status = null, search = null, accountId = null, userId = null, userRole = null) {
        try {
            const offset = (page - 1) * limit;
            let query = `
                SELECT 
                    fp.id, 
                    fp.facebook_account_id, 
                    fp.page_name, 
                    fp.page_description, 
                    fp.status, 
                    fp.created_by, 
                    fp.created_at, 
                    fp.updated_at,
                    fa.email as facebook_account_email,
                    fa.status as facebook_account_status
                FROM facebook_pages fp
                INNER JOIN facebook_accounts fa ON fp.facebook_account_id = fa.id
            `;
            
            const conditions = [];
            const params = [];
            
            // Filter by user - only show pages created by the current user (unless super admin)
            if (userRole !== 'super_admin' && userId) {
                conditions.push('fp.created_by = ?');
                params.push(userId);
            }
            
            if (status) {
                conditions.push('fp.status = ?');
                params.push(status);
            }
            
            if (accountId) {
                conditions.push('fp.facebook_account_id = ?');
                params.push(accountId);
            }
            
            if (search) {
                conditions.push('(fp.page_name LIKE ? OR fp.page_description LIKE ? OR fa.email LIKE ?)');
                params.push(`%${search}%`, `%${search}%`, `%${search}%`);
            }
            
            if (conditions.length > 0) {
                query += ' WHERE ' + conditions.join(' AND ');
            }
            
            query += ' ORDER BY fp.created_at DESC LIMIT ? OFFSET ?';
            params.push(limit, offset);
            
            const [pages] = await pool.query(query, params);
            
            // Get total count for pagination
            let countQuery = 'SELECT COUNT(*) as total FROM facebook_pages fp INNER JOIN facebook_accounts fa ON fp.facebook_account_id = fa.id';
            const countConditions = [];
            const countParams = [];
            
            // Apply same user filtering to count query
            if (userRole !== 'super_admin' && userId) {
                countConditions.push('fp.created_by = ?');
                countParams.push(userId);
            }
            
            if (status) {
                countConditions.push('fp.status = ?');
                countParams.push(status);
            }
            
            if (accountId) {
                countConditions.push('fp.facebook_account_id = ?');
                countParams.push(accountId);
            }
            
            if (search) {
                countConditions.push('(fp.page_name LIKE ? OR fp.page_description LIKE ? OR fa.email LIKE ?)');
                countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
            }
            
            if (countConditions.length > 0) {
                countQuery += ' WHERE ' + countConditions.join(' AND ');
            }
            
            const [countResult] = await pool.query(countQuery, countParams);
            const total = countResult[0].total;
            
            return {
                pages,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            console.error('Error in FacebookPageModel.getAll:', error);
            throw new Error('Failed to fetch Facebook pages');
        }
    }
    
    // Get Facebook page by ID
    static async getById(id, userId = null, userRole = null) {
        try {
            let query = `
                SELECT 
                    fp.id, 
                    fp.facebook_account_id, 
                    fp.page_name, 
                    fp.page_description, 
                    fp.status, 
                    fp.created_by, 
                    fp.created_at, 
                    fp.updated_at,
                    fa.email as facebook_account_email,
                    fa.status as facebook_account_status
                FROM facebook_pages fp
                INNER JOIN facebook_accounts fa ON fp.facebook_account_id = fa.id
                WHERE fp.id = ?
            `;
            
            const params = [id];
            
            // Add user filtering for non-super-admin users
            if (userRole !== 'super_admin' && userId) {
                query += ' AND fp.created_by = ?';
                params.push(userId);
            }
            
            const [rows] = await pool.query(query, params);
            
            if (rows.length === 0) {
                return null;
            }
            
            return rows[0];
        } catch (error) {
            console.error('Error in FacebookPageModel.getById:', error);
            throw new Error('Failed to fetch Facebook page');
        }
    }
    
    // Create new Facebook page
    static async create(pageData, createdBy) {
        try {
            const { facebook_account_id, page_name, page_description, status = 'enabled' } = pageData;
            
            // Check if Facebook account exists and get its status
            const [accountCheck] = await pool.query('SELECT id, status FROM facebook_accounts WHERE id = ?', [facebook_account_id]);
            if (accountCheck.length === 0) {
                throw new Error('Facebook account not found');
            }
            
            const query = `
                INSERT INTO facebook_pages 
                (facebook_account_id, page_name, page_description, status, created_by)
                VALUES (?, ?, ?, ?, ?)
            `;
            
            const [result] = await pool.query(query, [
                facebook_account_id,
                page_name,
                page_description || null,
                status,
                createdBy
            ]);
            
            // Return the created page
            return await this.getById(result.insertId);
        } catch (error) {
            console.error('Error in FacebookPageModel.create:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Page name already exists for this Facebook account');
            }
            throw error;
        }
    }
    
    // Update Facebook page
    static async update(id, pageData, updatedBy) {
        try {
            const { facebook_account_id, page_name, page_description, status } = pageData;
            
            // If facebook_account_id is being updated, check if it exists
            if (facebook_account_id) {
                const [accountCheck] = await pool.query('SELECT id, status FROM facebook_accounts WHERE id = ?', [facebook_account_id]);
                if (accountCheck.length === 0) {
                    throw new Error('Facebook account not found');
                }
            }
            
            // Build dynamic update query
            const updates = [];
            const params = [];
            
            if (facebook_account_id) {
                updates.push('facebook_account_id = ?');
                params.push(facebook_account_id);
            }
            
            if (page_name) {
                updates.push('page_name = ?');
                params.push(page_name);
            }
            
            if (page_description !== undefined) {
                updates.push('page_description = ?');
                params.push(page_description || null);
            }
            
            if (status) {
                updates.push('status = ?');
                params.push(status);
            }
            
            if (updates.length === 0) {
                throw new Error('No fields to update');
            }
            
            updates.push('updated_at = CURRENT_TIMESTAMP');
            params.push(id);
            
            const query = `UPDATE facebook_pages SET ${updates.join(', ')} WHERE id = ?`;
            
            const [result] = await pool.query(query, params);
            
            if (result.affectedRows === 0) {
                return null;
            }
            
            return await this.getById(id);
        } catch (error) {
            console.error('Error in FacebookPageModel.update:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Page name already exists for this Facebook account');
            }
            throw error;
        }
    }
    
    // Delete Facebook page
    static async delete(id) {
        try {
            const query = 'DELETE FROM facebook_pages WHERE id = ?';
            const [result] = await pool.query(query, [id]);
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error in FacebookPageModel.delete:', error);
            throw new Error('Failed to delete Facebook page');
        }
    }
    
    // Get pages by status (filtered by user)
    static async getByStatus(status, userId = null, userRole = null) {
        try {
            let query = `
                SELECT 
                    fp.id, 
                    fp.facebook_account_id, 
                    fp.page_name, 
                    fp.page_description, 
                    fp.status, 
                    fp.created_by, 
                    fp.created_at, 
                    fp.updated_at,
                    fa.email as facebook_account_email,
                    fa.status as facebook_account_status
                FROM facebook_pages fp
                INNER JOIN facebook_accounts fa ON fp.facebook_account_id = fa.id
                WHERE fp.status = ?
            `;
            
            const params = [status];
            
            // Add user filtering for non-super-admin users
            if (userRole !== 'super_admin' && userId) {
                query += ' AND fp.created_by = ?';
                params.push(userId);
            }
            
            query += ' ORDER BY fp.created_at DESC';
            
            const [pages] = await pool.query(query, params);
            return pages;
        } catch (error) {
            console.error('Error in FacebookPageModel.getByStatus:', error);
            throw new Error('Failed to fetch Facebook pages by status');
        }
    }
    
    // Get pages by Facebook account ID
    static async getByAccountId(accountId, userId = null, userRole = null) {
        try {
            let query = `
                SELECT 
                    fp.id, 
                    fp.facebook_account_id, 
                    fp.page_name, 
                    fp.page_description, 
                    fp.status, 
                    fp.created_by, 
                    fp.created_at, 
                    fp.updated_at,
                    fa.email as facebook_account_email,
                    fa.status as facebook_account_status
                FROM facebook_pages fp
                INNER JOIN facebook_accounts fa ON fp.facebook_account_id = fa.id
                WHERE fp.facebook_account_id = ?
            `;
            
            const params = [accountId];
            
            // Add user filtering for non-super-admin users
            if (userRole !== 'super_admin' && userId) {
                query += ' AND fp.created_by = ?';
                params.push(userId);
            }
            
            query += ' ORDER BY fp.created_at DESC';
            
            const [pages] = await pool.query(query, params);
            return pages;
        } catch (error) {
            console.error('Error in FacebookPageModel.getByAccountId:', error);
            throw new Error('Failed to fetch Facebook pages by account ID');
        }
    }
    
    // Auto-disable pages when Facebook account is disabled
    static async autoDisableByAccountId(accountId) {
        try {
            const query = `
                UPDATE facebook_pages 
                SET status = 'disabled', updated_at = CURRENT_TIMESTAMP 
                WHERE facebook_account_id = ? AND status != 'disabled'
            `;
            
            const [result] = await pool.query(query, [accountId]);
            return result.affectedRows;
        } catch (error) {
            console.error('Error in FacebookPageModel.autoDisableByAccountId:', error);
            throw new Error('Failed to auto-disable Facebook pages');
        }
    }
    
    // Check if page name exists for a specific account
    static async pageNameExists(accountId, pageName, excludeId = null) {
        try {
            let query = 'SELECT id FROM facebook_pages WHERE facebook_account_id = ? AND page_name = ?';
            const params = [accountId, pageName];
            
            if (excludeId) {
                query += ' AND id != ?';
                params.push(excludeId);
            }
            
            const [rows] = await pool.query(query, params);
            return rows.length > 0;
        } catch (error) {
            console.error('Error in FacebookPageModel.pageNameExists:', error);
            throw new Error('Failed to check page name existence');
        }
    }
    
    // Get page statistics
    static async getStats() {
        try {
            const [enabledPages] = await pool.query('SELECT COUNT(*) as count FROM facebook_pages WHERE status = "enabled"');
            const [disabledPages] = await pool.query('SELECT COUNT(*) as count FROM facebook_pages WHERE status = "disabled"');
            const [suspendedPages] = await pool.query('SELECT COUNT(*) as count FROM facebook_pages WHERE status = "suspended_temporarily"');
            const [totalPages] = await pool.query('SELECT COUNT(*) as count FROM facebook_pages');
            
            return {
                total: totalPages[0].count,
                enabled: enabledPages[0].count,
                disabled: disabledPages[0].count,
                suspended_temporarily: suspendedPages[0].count,
                enabledPercentage: totalPages[0].count > 0 ? Math.round((enabledPages[0].count / totalPages[0].count) * 100) : 0
            };
        } catch (error) {
            console.error('Error in FacebookPageModel.getStats:', error);
            throw new Error('Failed to fetch Facebook page statistics');
        }
    }
}

module.exports = FacebookPageModel;