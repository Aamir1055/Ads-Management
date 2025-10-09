const { pool } = require('../config/database');

class AdsManagerModel {
    // Get all Ads Managers with pagination, filtering, and search
    static async getAll({ 
        page = 1, 
        limit = 10, 
        search = '', 
        status = '', 
        bm_id = '',
        sortBy = 'created_at', 
        sortOrder = 'DESC' 
    } = {}) {
        try {
            const offset = (page - 1) * limit;
            let whereConditions = [];
            let queryParams = [];
            
            // Search functionality
            if (search) {
                whereConditions.push('(am.ads_manager_name LIKE ? OR am.email LIKE ? OR bm.bm_name LIKE ? OR bm.email LIKE ?)');
                queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
            }
            
            // Status filter
            if (status) {
                whereConditions.push('am.status = ?');
                queryParams.push(status);
            }
            
            // BM filter
            if (bm_id) {
                whereConditions.push('am.bm_id = ?');
                queryParams.push(bm_id);
            }
            
            const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
            
            // Count total records
            const countQuery = `
                SELECT COUNT(*) as total 
                FROM ads_managers am
                LEFT JOIN bm ON am.bm_id = bm.id
                ${whereClause}
            `;
            const [countResult] = await pool.query(countQuery, queryParams);
            const total = countResult[0].total;
            
            // Get records with pagination
            const dataQuery = `
                SELECT 
                    am.id,
                    am.bm_id,
                    am.ads_manager_name,
                    am.email,
                    am.phone_number,
                    am.status,
                    am.created_by,
                    am.created_at,
                    am.updated_at,
                    bm.bm_name,
                    bm.email as bm_email,
                    bm.status as bm_status
                FROM ads_managers am
                LEFT JOIN bm ON am.bm_id = bm.id
                ${whereClause}
                ORDER BY am.${sortBy} ${sortOrder}
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
            console.error('Error in AdsManagerModel.getAll:', error);
            throw new Error('Failed to fetch Ads Managers: ' + error.message);
        }
    }
    
    // Get Ads Manager by ID
    static async getById(id) {
        try {
            const query = `
                SELECT 
                    am.id,
                    am.bm_id,
                    am.ads_manager_name,
                    am.email,
                    am.phone_number,
                    am.status,
                    am.created_by,
                    am.created_at,
                    am.updated_at,
                    bm.bm_name,
                    bm.email as bm_email,
                    bm.status as bm_status
                FROM ads_managers am
                LEFT JOIN bm ON am.bm_id = bm.id
                WHERE am.id = ?
            `;
            
            const [rows] = await pool.query(query, [id]);
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Error in AdsManagerModel.getById:', error);
            throw new Error('Failed to fetch Ads Manager: ' + error.message);
        }
    }
    
    // Get Ads Managers by BM ID
    static async getByBMId(bm_id) {
        try {
            const query = `
                SELECT 
                    am.id,
                    am.bm_id,
                    am.ads_manager_name,
                    am.email,
                    am.phone_number,
                    am.status,
                    am.created_by,
                    am.created_at,
                    am.updated_at,
                    bm.bm_name,
                    bm.email as bm_email,
                    bm.status as bm_status
                FROM ads_managers am
                LEFT JOIN bm ON am.bm_id = bm.id
                WHERE am.bm_id = ?
                ORDER BY am.ads_manager_name ASC
            `;
            
            const [rows] = await pool.query(query, [bm_id]);
            return rows;
        } catch (error) {
            console.error('Error in AdsManagerModel.getByBMId:', error);
            throw new Error('Failed to fetch Ads Managers for BM: ' + error.message);
        }
    }
    
    // Create new Ads Manager
    static async create({ bm_id, ads_manager_name, email = null, phone_number = null, status = 'enabled', created_by }) {
        try {
            // Check if BM exists
            const bmQuery = 'SELECT id, status FROM bm WHERE id = ?';
            const [bmRows] = await pool.query(bmQuery, [bm_id]);
            
            if (bmRows.length === 0) {
                throw new Error('Business Manager not found');
            }
            
            // Check if ads manager name already exists for this BM
            const existingQuery = 'SELECT id FROM ads_managers WHERE bm_id = ? AND ads_manager_name = ?';
            const [existing] = await pool.query(existingQuery, [bm_id, ads_manager_name]);
            
            if (existing.length > 0) {
                throw new Error('Ads Manager with this name already exists for this Business Manager');
            }
            
            const query = `
                INSERT INTO ads_managers (bm_id, ads_manager_name, email, phone_number, status, created_by)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            
            const [result] = await pool.query(query, [bm_id, ads_manager_name, email, phone_number, status, created_by]);
            
            // Return the created Ads Manager
            return await this.getById(result.insertId);
        } catch (error) {
            console.error('Error in AdsManagerModel.create:', error);
            if (error.message.includes('not found') || error.message.includes('already exists')) {
                throw error;
            }
            throw new Error('Failed to create Ads Manager: ' + error.message);
        }
    }
    
    // Update Ads Manager
    static async update(id, { bm_id, ads_manager_name, email = null, phone_number = null, status }) {
        try {
            // Check if Ads Manager exists
            const existing = await this.getById(id);
            if (!existing) {
                throw new Error('Ads Manager not found');
            }
            
            // Check if BM exists (if bm_id is being updated)
            if (bm_id && bm_id !== existing.bm_id) {
                const bmQuery = 'SELECT id FROM bm WHERE id = ?';
                const [bmRows] = await pool.query(bmQuery, [bm_id]);
                
                if (bmRows.length === 0) {
                    throw new Error('Business Manager not found');
                }
            }
            
            // Check if ads manager name already exists for the BM (if name or BM is being changed)
            if ((ads_manager_name && ads_manager_name !== existing.ads_manager_name) || 
                (bm_id && bm_id !== existing.bm_id)) {
                
                const checkBMId = bm_id || existing.bm_id;
                const checkName = ads_manager_name || existing.ads_manager_name;
                
                const nameCheck = 'SELECT id FROM ads_managers WHERE bm_id = ? AND ads_manager_name = ? AND id != ?';
                const [nameExists] = await pool.query(nameCheck, [checkBMId, checkName, id]);
                
                if (nameExists.length > 0) {
                    throw new Error('Ads Manager with this name already exists for this Business Manager');
                }
            }
            
            const query = `
                UPDATE ads_managers 
                SET bm_id = ?, ads_manager_name = ?, email = ?, phone_number = ?, status = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;
            
            await pool.query(query, [bm_id, ads_manager_name, email, phone_number, status, id]);
            
            // Return the updated Ads Manager
            return await this.getById(id);
        } catch (error) {
            console.error('Error in AdsManagerModel.update:', error);
            if (error.message.includes('not found') || error.message.includes('already exists')) {
                throw error;
            }
            throw new Error('Failed to update Ads Manager: ' + error.message);
        }
    }
    
    // Delete Ads Manager
    static async delete(id) {
        try {
            // Check if Ads Manager exists
            const existing = await this.getById(id);
            if (!existing) {
                throw new Error('Ads Manager not found');
            }
            
            const query = 'DELETE FROM ads_managers WHERE id = ?';
            const [result] = await pool.query(query, [id]);
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error in AdsManagerModel.delete:', error);
            if (error.message.includes('not found')) {
                throw error;
            }
            throw new Error('Failed to delete Ads Manager: ' + error.message);
        }
    }
    
    // Toggle Ads Manager status
    static async toggleStatus(id) {
        try {
            const adsManager = await this.getById(id);
            if (!adsManager) {
                throw new Error('Ads Manager not found');
            }
            
            let newStatus;
            switch (adsManager.status) {
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
            
            const query = 'UPDATE ads_managers SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
            await pool.query(query, [newStatus, id]);
            
            return await this.getById(id);
        } catch (error) {
            console.error('Error in AdsManagerModel.toggleStatus:', error);
            if (error.message.includes('not found')) {
                throw error;
            }
            throw new Error('Failed to toggle Ads Manager status: ' + error.message);
        }
    }
    
    // Get Ads Manager stats
    static async getStats() {
        try {
            const query = `
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN status = 'enabled' THEN 1 END) as enabled,
                    COUNT(CASE WHEN status = 'disabled' THEN 1 END) as disabled,
                    COUNT(CASE WHEN status = 'suspended_temporarily' THEN 1 END) as suspended
                FROM ads_managers
            `;
            
            const [rows] = await pool.query(query);
            return rows[0];
        } catch (error) {
            console.error('Error in AdsManagerModel.getStats:', error);
            throw new Error('Failed to get Ads Manager stats: ' + error.message);
        }
    }
    
    // Check if ads manager name exists for a BM
    static async nameExistsForBM(bm_id, ads_manager_name, excludeId = null) {
        try {
            let query = 'SELECT id FROM ads_managers WHERE bm_id = ? AND ads_manager_name = ?';
            let params = [bm_id, ads_manager_name];
            
            if (excludeId) {
                query += ' AND id != ?';
                params.push(excludeId);
            }
            
            const [rows] = await pool.query(query, params);
            return rows.length > 0;
        } catch (error) {
            console.error('Error in AdsManagerModel.nameExistsForBM:', error);
            throw new Error('Failed to check ads manager name existence: ' + error.message);
        }
    }
    
    // Get stats by BM
    static async getStatsByBM() {
        try {
            const query = `
                SELECT 
                    bm.id as bm_id,
                    bm.bm_name,
                    bm.email as bm_email,
                    COUNT(am.id) as total_ads_managers,
                    COUNT(CASE WHEN am.status = 'enabled' THEN 1 END) as enabled,
                    COUNT(CASE WHEN am.status = 'disabled' THEN 1 END) as disabled,
                    COUNT(CASE WHEN am.status = 'suspended_temporarily' THEN 1 END) as suspended
                FROM bm 
                LEFT JOIN ads_managers am ON bm.id = am.bm_id
                GROUP BY bm.id, bm.bm_name, bm.email
                ORDER BY total_ads_managers DESC
            `;
            
            const [rows] = await pool.query(query);
            return rows;
        } catch (error) {
            console.error('Error in AdsManagerModel.getStatsByBM:', error);
            throw new Error('Failed to get Ads Manager stats by BM: ' + error.message);
        }
    }
}

module.exports = AdsManagerModel;