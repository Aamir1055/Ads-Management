const { pool } = require('../config/database');

class Role {
  
  /**
   * Get all roles with optional filtering
   * @param {Object} filters - Filter options (search, active, etc.)
   * @returns {Array} Array of roles
   */
  static async findAll(filters = {}) {
    try {
      let query = `
        SELECT 
          r.id,
          r.name,
          r.display_name,
          r.description,
          r.level,
          r.is_active,
          r.is_system_role,
          r.created_at,
          r.updated_at,
          (SELECT COUNT(*) FROM role_permissions WHERE role_id = r.id) as permission_count,
          (SELECT COUNT(*) FROM users WHERE role_id = r.id) as user_count
        FROM roles r
        WHERE 1=1
      `;
      
      const params = [];
      
      // Apply filters
      if (filters.search && filters.search.trim()) {
        query += ` AND (r.name LIKE ? OR r.display_name LIKE ? OR r.description LIKE ?)`;
        const searchTerm = `%${filters.search.trim()}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }
      
      if (filters.isActive !== undefined) {
        query += ` AND r.is_active = ?`;
        params.push(filters.isActive ? 1 : 0);
      }
      
      if (filters.level !== undefined) {
        query += ` AND r.level = ?`;
        params.push(filters.level);
      }
      
      if (filters.isSystemRole !== undefined) {
        query += ` AND r.is_system_role = ?`;
        params.push(filters.isSystemRole ? 1 : 0);
      }
      
      // Default ordering
      query += ` ORDER BY r.level DESC, r.name ASC`;
      
      console.log('Role.findAll query:', query);
      console.log('Role.findAll params:', params);
      
      const [roles] = await pool.query(query, params);
      return roles;
    } catch (error) {
      console.error('Error in Role.findAll:', error);
      throw error;
    }
  }
  
  /**
   * Get a single role by ID
   * @param {number} id - Role ID
   * @returns {Object|null} Role object or null if not found
   */
  static async findById(id) {
    try {
      console.log('Role.findById id:', id);
      
      const query = `
        SELECT 
          r.id,
          r.name,
          r.display_name,
          r.description,
          r.level,
          r.is_active,
          r.is_system_role,
          r.created_at,
          r.updated_at,
          (SELECT COUNT(*) FROM role_permissions WHERE role_id = r.id) as permission_count,
          (SELECT COUNT(*) FROM users WHERE role_id = r.id) as user_count
        FROM roles r
        WHERE r.id = ?
      `;
      
      const [roles] = await pool.query(query, [id]);
      return roles.length > 0 ? roles[0] : null;
    } catch (error) {
      console.error('Error in Role.findById:', error);
      throw error;
    }
  }
  
  /**
   * Get a role by name
   * @param {string} name - Role name
   * @returns {Object|null} Role object or null if not found
   */
  static async findByName(name) {
    try {
      const query = `
        SELECT 
          r.id,
          r.name,
          r.display_name,
          r.description,
          r.level,
          r.is_active,
          r.is_system_role,
          r.created_at,
          r.updated_at
        FROM roles r
        WHERE r.name = ?
      `;
      
      const [roles] = await pool.query(query, [name]);
      return roles.length > 0 ? roles[0] : null;
    } catch (error) {
      console.error('Error in Role.findByName:', error);
      throw error;
    }
  }
  
  /**
   * Create a new role
   * @param {Object} roleData - Role data
   * @returns {Object} Created role
   */
  static async create(roleData) {
    try {
      console.log('Role.create data:', roleData);
      
      // Validate required fields
      if (!roleData.name || !roleData.display_name) {
        throw new Error('Role name and display_name are required');
      }
      
      // Check if role name already exists
      const existingRole = await this.findByName(roleData.name);
      if (existingRole) {
        throw new Error('A role with this name already exists');
      }
      
      const query = `
        INSERT INTO roles (name, display_name, description, level, is_system_role, is_active)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        roleData.name,
        roleData.display_name,
        roleData.description || null,
        roleData.level || 1,
        roleData.is_system_role || 0,
        roleData.is_active !== undefined ? roleData.is_active : 1
      ];
      
      console.log('Role.create query:', query);
      console.log('Role.create params:', params);
      
      const [result] = await pool.query(query, params);
      
      // Return the created role
      const createdRole = await this.findById(result.insertId);
      console.log('✅ Created role:', createdRole.name);
      
      return createdRole;
    } catch (error) {
      console.error('Error in Role.create:', error);
      throw error;
    }
  }
  
  /**
   * Update an existing role
   * @param {number} id - Role ID
   * @param {Object} roleData - Updated role data
   * @returns {Object} Updated role
   */
  static async update(id, roleData) {
    try {
      console.log('Role.update id:', id, 'data:', roleData);
      
      // Check if role exists
      const existingRole = await this.findById(id);
      if (!existingRole) {
        throw new Error('Role not found');
      }
      
      // Check if new name conflicts with existing roles (if name is being changed)
      if (roleData.name && roleData.name !== existingRole.name) {
        const nameCheck = await this.findByName(roleData.name);
        if (nameCheck && nameCheck.id !== id) {
          throw new Error('A role with this name already exists');
        }
      }
      
      const query = `
        UPDATE roles 
        SET name = ?, display_name = ?, description = ?, level = ?, is_active = ?
        WHERE id = ?
      `;
      
      const params = [
        roleData.name !== undefined ? roleData.name : existingRole.name,
        roleData.display_name !== undefined ? roleData.display_name : existingRole.display_name,
        roleData.description !== undefined ? roleData.description : existingRole.description,
        roleData.level !== undefined ? roleData.level : existingRole.level,
        roleData.is_active !== undefined ? roleData.is_active : existingRole.is_active,
        id
      ];
      
      console.log('Role.update query:', query);
      console.log('Role.update params:', params);
      
      await pool.query(query, params);
      
      // Return updated role
      const updatedRole = await this.findById(id);
      console.log('✅ Updated role:', updatedRole.name);
      
      return updatedRole;
    } catch (error) {
      console.error('Error in Role.update:', error);
      throw error;
    }
  }
  
  /**
   * Delete a role (soft delete by setting is_active = 0, or hard delete)
   * @param {number} id - Role ID
   * @param {boolean} hardDelete - Whether to permanently delete the role
   * @returns {boolean} Success status
   */
  static async delete(id, hardDelete = false) {
    try {
      console.log('Role.delete id:', id, 'hardDelete:', hardDelete);
      
      // Check if role exists
      const existingRole = await this.findById(id);
      if (!existingRole) {
        throw new Error('Role not found');
      }
      
      // Prevent deletion of system roles
      if (existingRole.is_system_role) {
        throw new Error('Cannot delete system roles');
      }
      
      // Check if role is assigned to users
      const [users] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role_id = ?', [id]);
      if (users[0].count > 0) {
        throw new Error(`Cannot delete role. It is assigned to ${users[0].count} user(s). Remove the role from all users before deleting.`);
      }
      
      if (hardDelete) {
        // Hard delete - remove from database
        // This will also remove role_permissions due to foreign key constraints
        await pool.query('DELETE FROM roles WHERE id = ?', [id]);
        console.log('✅ Hard deleted role:', existingRole.name);
      } else {
        // Soft delete - set is_active = 0
        await pool.query('UPDATE roles SET is_active = 0 WHERE id = ?', [id]);
        console.log('✅ Soft deleted role:', existingRole.name);
      }
      
      return true;
    } catch (error) {
      console.error('Error in Role.delete:', error);
      throw error;
    }
  }
  
  /**
   * Get permissions for a role
   * @param {number} roleId - Role ID
   * @returns {Array} Array of permissions
   */
  static async getPermissions(roleId) {
    try {
      const query = `
        SELECT 
          p.id,
          p.name,
          p.display_name,
          p.description,
          p.category,
          m.name as module_name,
          m.display_name as module_display_name
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        JOIN modules m ON p.module_id = m.id
        WHERE rp.role_id = ? AND p.is_active = 1
        ORDER BY m.order_index, m.name, p.name
      `;
      
      const [permissions] = await pool.query(query, [roleId]);
      return permissions;
    } catch (error) {
      console.error('Error in Role.getPermissions:', error);
      throw error;
    }
  }
  
  /**
   * Assign permission to role
   * @param {number} roleId - Role ID
   * @param {number} permissionId - Permission ID
   * @returns {boolean} Success status
   */
  static async assignPermission(roleId, permissionId) {
    try {
      // Check if assignment already exists
      const [existing] = await pool.query(`
        SELECT id FROM role_permissions WHERE role_id = ? AND permission_id = ?
      `, [roleId, permissionId]);
      
      if (existing.length > 0) {
        return true; // Already assigned
      }
      
      // Create assignment
      await pool.query(`
        INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)
      `, [roleId, permissionId]);
      
      return true;
    } catch (error) {
      console.error('Error in Role.assignPermission:', error);
      throw error;
    }
  }
  
  /**
   * Remove permission from role
   * @param {number} roleId - Role ID
   * @param {number} permissionId - Permission ID
   * @returns {boolean} Success status
   */
  static async removePermission(roleId, permissionId) {
    try {
      await pool.query(`
        DELETE FROM role_permissions WHERE role_id = ? AND permission_id = ?
      `, [roleId, permissionId]);
      
      return true;
    } catch (error) {
      console.error('Error in Role.removePermission:', error);
      throw error;
    }
  }
  
  /**
   * Get users with this role
   * @param {number} roleId - Role ID
   * @returns {Array} Array of users
   */
  static async getUsers(roleId) {
    try {
      const query = `
        SELECT u.id, u.username, u.is_active, u.last_login, u.created_at
        FROM users u
        WHERE u.role_id = ?
        ORDER BY u.username
      `;
      
      const [users] = await pool.query(query, [roleId]);
      return users;
    } catch (error) {
      console.error('Error in Role.getUsers:', error);
      throw error;
    }
  }
  
  /**
   * Get roles for dropdown/selection
   * @returns {Array} Array of active roles
   */
  static async getForDropdown() {
    try {
      const query = `
        SELECT id, name, display_name, level
        FROM roles
        WHERE is_active = 1
        ORDER BY level DESC, name ASC
      `;
      
      const [roles] = await pool.query(query);
      return roles;
    } catch (error) {
      console.error('Error in Role.getForDropdown:', error);
      throw error;
    }
  }
  
  /**
   * Validate role name uniqueness
   * @param {string} name - Role name to validate
   * @param {number} excludeId - Role ID to exclude from check (for updates)
   * @returns {boolean} True if name is available
   */
  static async validateName(name, excludeId = null) {
    try {
      let query = `SELECT COUNT(*) as count FROM roles WHERE name = ?`;
      const params = [name];
      
      if (excludeId) {
        query += ` AND id != ?`;
        params.push(excludeId);
      }
      
      console.log('Role.validateName query:', query);
      console.log('Role.validateName params:', params);
      
      const [result] = await pool.query(query, params);
      return result[0].count === 0;
    } catch (error) {
      console.error('Error in Role.validateName:', error);
      throw error;
    }
  }
  
  /**
   * Get role statistics
   * @returns {Object} Statistics about roles
   */
  static async getStats() {
    try {
      const [stats] = await pool.query(`
        SELECT 
          COUNT(*) as total_roles,
          COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_roles,
          COUNT(CASE WHEN is_system_role = 1 THEN 1 END) as system_roles,
          COUNT(CASE WHEN level >= 8 THEN 1 END) as admin_roles
        FROM roles
      `);
      
      return stats[0];
    } catch (error) {
      console.error('Error in Role.getStats:', error);
      throw error;
    }
  }
}

module.exports = Role;
