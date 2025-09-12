const { pool } = require('../config/database');

/**
 * Permission Manager Utility Class
 * Provides methods for checking and managing user permissions
 */
class PermissionManager {
    /**
     * Check if a user has a specific permission
     * @param {number} userId - The user ID
     * @param {string} permissionKey - The permission key (e.g., 'users.create')
     * @returns {Promise<boolean>}
     */
    static async hasPermission(userId, permissionKey) {
        try {
            const [rows] = await pool.query(`
                SELECT COUNT(*) as count
                FROM user_permissions_view
                WHERE user_id = ? AND permission_key = ?
            `, [userId, permissionKey]);
            
            return rows[0].count > 0;
        } catch (error) {
            console.error('Error checking permission:', error);
            return false;
        }
    }

    /**
     * Check if user has permission for specific HTTP method and endpoint
     * @param {number} userId - The user ID
     * @param {string} httpMethod - HTTP method (GET, POST, PUT, DELETE)
     * @param {string} endpoint - API endpoint
     * @returns {Promise<boolean>}
     */
    static async hasEndpointPermission(userId, httpMethod, endpoint) {
        try {
            const [rows] = await pool.query(`
                SELECT COUNT(*) as count
                FROM user_permissions_view
                WHERE user_id = ? 
                AND (http_method = ? OR http_method = '*')
                AND (api_endpoint = ? OR api_endpoint IS NULL)
            `, [userId, httpMethod.toUpperCase(), endpoint]);
            
            return rows[0].count > 0;
        } catch (error) {
            console.error('Error checking endpoint permission:', error);
            return false;
        }
    }

    /**
     * Get all permissions for a user
     * @param {number} userId - The user ID
     * @returns {Promise<Array>}
     */
    static async getUserPermissions(userId) {
        try {
            const [rows] = await pool.query(`
                SELECT DISTINCT
                    module_name,
                    permission_key,
                    permission_name,
                    http_method,
                    api_endpoint
                FROM user_permissions_view
                WHERE user_id = ?
                ORDER BY module_name, permission_name
            `, [userId]);
            
            return rows;
        } catch (error) {
            console.error('Error getting user permissions:', error);
            return [];
        }
    }

    /**
     * Get user permissions grouped by module
     * @param {number} userId - The user ID
     * @returns {Promise<Object>}
     */
    static async getUserPermissionsByModule(userId) {
        try {
            const permissions = await this.getUserPermissions(userId);
            const groupedPermissions = {};
            
            permissions.forEach(permission => {
                if (!groupedPermissions[permission.module_name]) {
                    groupedPermissions[permission.module_name] = [];
                }
                groupedPermissions[permission.module_name].push(permission);
            });
            
            return groupedPermissions;
        } catch (error) {
            console.error('Error getting grouped user permissions:', error);
            return {};
        }
    }

    /**
     * Check if user has any permission within a module
     * @param {number} userId - The user ID
     * @param {string} moduleName - The module name
     * @returns {Promise<boolean>}
     */
    static async hasModuleAccess(userId, moduleName) {
        try {
            const [rows] = await pool.query(`
                SELECT COUNT(*) as count
                FROM user_permissions_view
                WHERE user_id = ? AND module_name = ?
            `, [userId, moduleName]);
            
            return rows[0].count > 0;
        } catch (error) {
            console.error('Error checking module access:', error);
            return false;
        }
    }

    /**
     * Get user's roles
     * @param {number} userId - The user ID
     * @returns {Promise<Array>}
     */
    static async getUserRoles(userId) {
        try {
            const [rows] = await pool.query(`
                SELECT 
                    r.id,
                    r.name,
                    r.description,
                    r.level,
                    ur.assigned_at,
                    ur.expires_at
                FROM user_roles ur
                JOIN roles r ON ur.role_id = r.id
                WHERE ur.user_id = ? 
                AND ur.is_active = 1 
                AND r.is_active = 1
                AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
                ORDER BY r.level DESC
            `, [userId]);
            
            return rows;
        } catch (error) {
            console.error('Error getting user roles:', error);
            return [];
        }
    }

    /**
     * Assign role to user
     * @param {number} userId - The user ID
     * @param {number} roleId - The role ID
     * @param {number} assignedBy - ID of user assigning the role
     * @param {Date|null} expiresAt - Optional expiration date
     * @returns {Promise<boolean>}
     */
    static async assignRoleToUser(userId, roleId, assignedBy, expiresAt = null) {
        try {
            await pool.query(`
                INSERT INTO user_roles (user_id, role_id, assigned_by, expires_at)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    is_active = 1,
                    assigned_by = VALUES(assigned_by),
                    assigned_at = CURRENT_TIMESTAMP,
                    expires_at = VALUES(expires_at)
            `, [userId, roleId, assignedBy, expiresAt]);

            // Log the action
            await pool.query(`
                INSERT INTO permission_audit_log (user_id, role_id, action, performed_by)
                VALUES (?, ?, 'ROLE_ASSIGN', ?)
            `, [userId, roleId, assignedBy]);

            return true;
        } catch (error) {
            console.error('Error assigning role to user:', error);
            return false;
        }
    }

    /**
     * Revoke role from user
     * @param {number} userId - The user ID
     * @param {number} roleId - The role ID
     * @param {number} revokedBy - ID of user revoking the role
     * @returns {Promise<boolean>}
     */
    static async revokeRoleFromUser(userId, roleId, revokedBy) {
        try {
            await pool.query(`
                UPDATE user_roles 
                SET is_active = 0 
                WHERE user_id = ? AND role_id = ?
            `, [userId, roleId]);

            // Log the action
            await pool.query(`
                INSERT INTO permission_audit_log (user_id, role_id, action, performed_by)
                VALUES (?, ?, 'ROLE_REVOKE', ?)
            `, [userId, roleId, revokedBy]);

            return true;
        } catch (error) {
            console.error('Error revoking role from user:', error);
            return false;
        }
    }

    /**
     * Get all available roles
     * @returns {Promise<Array>}
     */
    static async getAllRoles() {
        try {
            const [rows] = await pool.query(`
                SELECT id, name, description, level, is_system_role, is_active
                FROM roles
                WHERE is_active = 1
                ORDER BY level DESC, name
            `);
            
            return rows;
        } catch (error) {
            console.error('Error getting all roles:', error);
            return [];
        }
    }

    /**
     * Get all permissions for a role
     * @param {number} roleId - The role ID
     * @returns {Promise<Array>}
     */
    static async getRolePermissions(roleId) {
        try {
            const [rows] = await pool.query(`
                SELECT 
                    m.module_name,
                    p.permission_key,
                    p.permission_name,
                    p.description,
                    p.http_method,
                    p.api_endpoint
                FROM role_permissions rp
                JOIN permissions p ON rp.permission_id = p.id
                JOIN modules m ON p.module_id = m.id
                WHERE rp.role_id = ? 
                AND p.is_active = 1 
                AND m.is_active = 1
                ORDER BY m.module_name, p.permission_name
            `, [roleId]);
            
            return rows;
        } catch (error) {
            console.error('Error getting role permissions:', error);
            return [];
        }
    }

    /**
     * Check if user has higher or equal role level than target user
     * @param {number} userId - The user ID
     * @param {number} targetUserId - The target user ID
     * @returns {Promise<boolean>}
     */
    static async canManageUser(userId, targetUserId) {
        try {
            // Get the highest role level for both users
            const [userRoles] = await pool.query(`
                SELECT MAX(r.level) as max_level
                FROM user_roles ur
                JOIN roles r ON ur.role_id = r.id
                WHERE ur.user_id = ? AND ur.is_active = 1 AND r.is_active = 1
            `, [userId]);

            const [targetRoles] = await pool.query(`
                SELECT MAX(r.level) as max_level
                FROM user_roles ur
                JOIN roles r ON ur.role_id = r.id
                WHERE ur.user_id = ? AND ur.is_active = 1 AND r.is_active = 1
            `, [targetUserId]);

            const userLevel = userRoles[0]?.max_level || 0;
            const targetLevel = targetRoles[0]?.max_level || 0;

            return userLevel >= targetLevel;
        } catch (error) {
            console.error('Error checking user management permission:', error);
            return false;
        }
    }

    /**
     * Get permission hierarchy - which permissions require which other permissions
     * @returns {Object}
     */
    static getPermissionHierarchy() {
        return {
            // Delete permission requires update permission
            'delete': ['update', 'read'],
            // Update permission requires read permission
            'update': ['read'],
            // Export permission requires read permission
            'export': ['read'],
            // Manage permissions require read permissions
            'manage_2fa': ['read'],
            'toggle_status': ['read', 'update'],
            'view_stats': ['read']
        };
    }

    /**
     * Create a permission checking middleware
     * @param {string} permissionKey - Required permission key
     * @returns {Function} Express middleware function
     */
    static requirePermission(permissionKey) {
        return async (req, res, next) => {
            try {
                // Assuming user ID is available in req.user
                const userId = req.user?.id;
                
                if (!userId) {
                    return res.status(401).json({
                        success: false,
                        message: 'Authentication required',
                        timestamp: new Date().toISOString()
                    });
                }

                const hasPermission = await this.hasPermission(userId, permissionKey);
                
                if (!hasPermission) {
                    return res.status(403).json({
                        success: false,
                        message: `Permission denied. Required permission: ${permissionKey}`,
                        timestamp: new Date().toISOString()
                    });
                }

                next();
            } catch (error) {
                console.error('Permission middleware error:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Permission check failed',
                    timestamp: new Date().toISOString()
                });
            }
        };
    }

    /**
     * Create a role checking middleware
     * @param {string|Array} roles - Required role name(s)
     * @returns {Function} Express middleware function
     */
    static requireRole(roles) {
        const roleArray = Array.isArray(roles) ? roles : [roles];
        
        return async (req, res, next) => {
            try {
                const userId = req.user?.id;
                
                if (!userId) {
                    return res.status(401).json({
                        success: false,
                        message: 'Authentication required',
                        timestamp: new Date().toISOString()
                    });
                }

                const userRoles = await this.getUserRoles(userId);
                const userRoleNames = userRoles.map(role => role.name);
                
                const hasRequiredRole = roleArray.some(role => userRoleNames.includes(role));
                
                if (!hasRequiredRole) {
                    return res.status(403).json({
                        success: false,
                        message: `Access denied. Required role(s): ${roleArray.join(', ')}`,
                        timestamp: new Date().toISOString()
                    });
                }

                next();
            } catch (error) {
                console.error('Role middleware error:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Role check failed',
                    timestamp: new Date().toISOString()
                });
            }
        };
    }

    /**
     * Cleanup expired role assignments
     * @returns {Promise<number>} Number of expired assignments cleaned up
     */
    static async cleanupExpiredRoles() {
        try {
            const [result] = await pool.query(`
                UPDATE user_roles 
                SET is_active = 0 
                WHERE expires_at IS NOT NULL 
                AND expires_at <= NOW() 
                AND is_active = 1
            `);
            
            return result.affectedRows;
        } catch (error) {
            console.error('Error cleaning up expired roles:', error);
            return 0;
        }
    }
}

module.exports = PermissionManager;
