const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class FacebookAccountModel {
    
    // Get all Facebook accounts with pagination and filtering (filtered by user)
    static async getAll(page = 1, limit = 10, status = null, search = null, userId = null, userRole = null) {
        try {
            const offset = (page - 1) * limit;
            let query = `
                SELECT 
                    fa.id, 
                    fa.email, 
                    fa.authenticator, 
                    fa.phone_number, 
                    fa.id_image_path, 
                    fa.status, 
                    fa.created_by, 
                    fa.created_at, 
                    fa.updated_at
                FROM facebook_accounts fa
            `;
            
            const conditions = [];
            const params = [];
            
            // Filter by user - only show accounts created by the current user (unless super admin)
            if (userRole !== 'super_admin' && userId) {
                conditions.push('fa.created_by = ?');
                params.push(userId);
            }
            
            if (status) {
                conditions.push('fa.status = ?');
                params.push(status);
            }
            
            if (search) {
                conditions.push('(fa.email LIKE ? OR fa.phone_number LIKE ?)');
                params.push(`%${search}%`, `%${search}%`);
            }
            
            if (conditions.length > 0) {
                query += ' WHERE ' + conditions.join(' AND ');
            }
            
            query += ' ORDER BY fa.created_at DESC LIMIT ? OFFSET ?';
            params.push(limit, offset);
            
            const [accounts] = await pool.query(query, params);
            
            // Get total count for pagination
            let countQuery = 'SELECT COUNT(*) as total FROM facebook_accounts fa';
            const countParams = [];
            const countConditions = [];
            
            // Filter by user - only count accounts created by the current user (unless super admin)
            if (userRole !== 'super_admin' && userId) {
                countConditions.push('fa.created_by = ?');
                countParams.push(userId);
            }
            
            if (status) {
                countConditions.push('fa.status = ?');
                countParams.push(status);
            }
            
            if (search) {
                countConditions.push('(fa.email LIKE ? OR fa.phone_number LIKE ?)');
                countParams.push(`%${search}%`, `%${search}%`);
            }
            
            if (countConditions.length > 0) {
                countQuery += ' WHERE ' + countConditions.join(' AND ');
            }
            
            const [countResult] = await pool.query(countQuery, countParams);
            const total = countResult[0].total;
            
            return {
                accounts: accounts.map(account => ({
                    ...account,
                    password: undefined // Never return password
                })),
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: total,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            console.error('Error in FacebookAccountModel.getAll:', error);
            throw new Error('Failed to fetch Facebook accounts');
        }
    }
    
    // Get Facebook account by ID (with user filtering)
    static async getById(id, userId = null, userRole = null) {
        try {
            let query = `
                SELECT 
                    fa.id, 
                    fa.email, 
                    fa.authenticator, 
                    fa.phone_number, 
                    fa.id_image_path, 
                    fa.status, 
                    fa.created_by, 
                    fa.created_at, 
                    fa.updated_at
                FROM facebook_accounts fa
                WHERE fa.id = ?
            `;
            
            const params = [id];
            
            // Filter by user - only allow access to accounts created by the current user (unless super admin)
            if (userRole !== 'super_admin' && userId) {
                query += ' AND fa.created_by = ?';
                params.push(userId);
            }
            
            const [rows] = await pool.query(query, params);
            
            if (rows.length === 0) {
                return null;
            }
            
            const account = rows[0];
            delete account.password; // Never return password
            
            return account;
        } catch (error) {
            console.error('Error in FacebookAccountModel.getById:', error);
            throw new Error('Failed to fetch Facebook account');
        }
    }
    
    // Create new Facebook account
    static async create(accountData, createdBy) {
        try {
            const { email, password, authenticator, phone_number, id_image_path, status = 'enabled' } = accountData;
            
            // Hash the password
            const hashedPassword = await bcrypt.hash(password, 12);
            
            const query = `
                INSERT INTO facebook_accounts 
                (email, password, authenticator, phone_number, id_image_path, status, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            
            const [result] = await pool.query(query, [
                email, 
                hashedPassword, 
                authenticator || null, 
                phone_number || null, 
                id_image_path || null, 
                status, 
                createdBy
            ]);
            
            // Return the created account (without password)
            return await this.getById(result.insertId);
        } catch (error) {
            console.error('Error in FacebookAccountModel.create:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Email already exists');
            }
            throw new Error('Failed to create Facebook account');
        }
    }
    
    // Update Facebook account
    static async update(id, accountData, updatedBy) {
        try {
            const { email, password, authenticator, phone_number, id_image_path, status } = accountData;
            
            // Build dynamic update query
            const updates = [];
            const params = [];
            
            if (email) {
                updates.push('email = ?');
                params.push(email);
            }
            
            if (password) {
                const hashedPassword = await bcrypt.hash(password, 12);
                updates.push('password = ?');
                params.push(hashedPassword);
            }
            
            if (authenticator !== undefined) {
                updates.push('authenticator = ?');
                params.push(authenticator || null);
            }
            
            if (phone_number !== undefined) {
                updates.push('phone_number = ?');
                params.push(phone_number || null);
            }
            
            if (id_image_path !== undefined) {
                updates.push('id_image_path = ?');
                params.push(id_image_path || null);
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
            
            const query = `UPDATE facebook_accounts SET ${updates.join(', ')} WHERE id = ?`;
            
            const [result] = await pool.query(query, params);
            
            if (result.affectedRows === 0) {
                return null;
            }
            
            return await this.getById(id);
        } catch (error) {
            console.error('Error in FacebookAccountModel.update:', error);
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Email already exists');
            }
            throw new Error('Failed to update Facebook account');
        }
    }
    
    // Delete Facebook account
    static async delete(id) {
        try {
            const query = 'DELETE FROM facebook_accounts WHERE id = ?';
            const [result] = await pool.query(query, [id]);
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error in FacebookAccountModel.delete:', error);
            throw new Error('Failed to delete Facebook account');
        }
    }
    
    // Check if email exists
    static async emailExists(email, excludeId = null) {
        try {
            let query = 'SELECT id FROM facebook_accounts WHERE email = ?';
            const params = [email];
            
            if (excludeId) {
                query += ' AND id != ?';
                params.push(excludeId);
            }
            
            const [rows] = await pool.query(query, params);
            return rows.length > 0;
        } catch (error) {
            console.error('Error in FacebookAccountModel.emailExists:', error);
            throw new Error('Failed to check email existence');
        }
    }
    
    // Get accounts by status (filtered by user)
    static async getByStatus(status, userId = null, userRole = null) {
        try {
            let query = `
                SELECT 
                    fa.id, 
                    fa.email, 
                    fa.authenticator, 
                    fa.phone_number, 
                    fa.id_image_path, 
                    fa.status, 
                    fa.created_by, 
                    fa.created_at, 
                    fa.updated_at
                FROM facebook_accounts fa
                WHERE fa.status = ?
            `;
            
            const params = [status];
            
            // Filter by user - only show accounts created by the current user (unless super admin)
            if (userRole !== 'super_admin' && userId) {
                query += ' AND fa.created_by = ?';
                params.push(userId);
            }
            
            query += ' ORDER BY fa.created_at DESC';
            
            const [accounts] = await pool.query(query, params);
            
            return accounts.map(account => ({
                ...account,
                password: undefined
            }));
        } catch (error) {
            console.error('Error in FacebookAccountModel.getByStatus:', error);
            throw new Error('Failed to fetch Facebook accounts by status');
        }
    }
}

module.exports = FacebookAccountModel;