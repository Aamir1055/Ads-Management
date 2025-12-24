const { pool } = require('../config/database');

class RoleController {
  // GET /api/roles - Get all roles (requires roles_read permission)
  static async getAllRoles(req, res) {
    try {
      console.log('🎭 RoleController.getAllRoles - User:', req.user?.id);
      
      const { search, active, include_permissions } = req.query;
      
      let query = `
        SELECT r.*, 
        (SELECT COUNT(*) FROM role_permissions WHERE role_id = r.id) as permission_count,
        (SELECT COUNT(*) FROM users WHERE role_id = r.id) as user_count
        FROM roles r
      `;
      
      const params = [];
      const conditions = [];
      
      // Apply filters
      if (active === 'true') {
        conditions.push('r.is_active = 1');
      } else if (active === 'false') {
        conditions.push('r.is_active = 0');
      }
      
      if (search && search.trim()) {
        conditions.push('(r.name LIKE ? OR r.display_name LIKE ? OR r.description LIKE ?)');
        const searchTerm = `%${search.trim()}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      query += ' ORDER BY r.level DESC, r.name ASC';
      
      const [roles] = await pool.query(query, params);
      
      // If include_permissions is requested, fetch permissions for each role
      if (include_permissions === 'true') {
        for (let role of roles) {
          const [permissions] = await pool.query(`
            SELECT p.id, p.name, p.display_name, p.category, m.name as module_name
            FROM role_permissions rp
            JOIN permissions p ON rp.permission_id = p.id
            JOIN modules m ON p.module_id = m.id
            WHERE rp.role_id = ?
            ORDER BY m.name, p.name
          `, [role.id]);
          role.permissions = permissions;
        }
      }
      
      console.log(`🎭 Found ${roles.length} roles`);
      
      return res.status(200).json({
        success: true,
        data: roles,
        message: roles.length === 0 ? 'No roles found' : `Found ${roles.length} roles`
      });
    } catch (error) {
      console.error('❌ Error in RoleController.getAllRoles:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch roles',
        error: error.message
      });
    }
  }

  // GET /api/roles/:id - Get single role (requires roles_read permission)
  static async getRoleById(req, res) {
    try {
      console.log('🎭 RoleController.getRoleById - User:', req.user?.id);
      
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role ID'
        });
      }

      const [roles] = await pool.query(`
        SELECT r.*, 
        (SELECT COUNT(*) FROM role_permissions WHERE role_id = r.id) as permission_count,
        (SELECT COUNT(*) FROM users WHERE role_id = r.id) as user_count
        FROM roles r 
        WHERE r.id = ?
      `, [parseInt(id)]);

      if (roles.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      const role = roles[0];

      // Fetch role permissions
      const [permissions] = await pool.query(`
        SELECT p.id, p.name, p.display_name, p.category, m.name as module_name
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        JOIN modules m ON p.module_id = m.id
        WHERE rp.role_id = ?
        ORDER BY m.name, p.name
      `, [role.id]);
      role.permissions = permissions;

      // Fetch users with this role
      const [users] = await pool.query(`
        SELECT u.id, u.username 
        FROM users u 
        WHERE u.role_id = ?
        AND u.is_active = 1
      `, [role.id]);
      role.users = users;

      console.log(`🎭 Found role: ${role.name}`);

      return res.status(200).json({
        success: true,
        data: role,
        message: 'Role retrieved successfully'
      });
    } catch (error) {
      console.error('❌ Error in RoleController.getRoleById:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch role',
        error: error.message
      });
    }
  }

  // POST /api/roles - Create new role (requires roles_create permission)
  static async createRole(req, res) {
    try {
      console.log('🎭 RoleController.createRole - User:', req.user?.id);
      
      const { name, display_name, description, level, is_system_role } = req.body;

      // Enhanced validation
      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Role name is required'
        });
      }

      if (!display_name || !display_name.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Display name is required'
        });
      }

      // Validate role name format and length
      if (name.trim().length < 3 || name.trim().length > 50) {
        return res.status(400).json({
          success: false,
          message: 'Role name must be between 3 and 50 characters'
        });
      }

      if (!/^[a-zA-Z0-9\s\-_]+$/.test(name.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Role name can only contain letters, numbers, spaces, hyphens, and underscores'
        });
      }

      // Validate description length if provided
      if (description && description.trim().length > 255) {
        return res.status(400).json({
          success: false,
          message: 'Description cannot exceed 255 characters'
        });
      }

      // Check if role name already exists
      const [existing] = await pool.query('SELECT id FROM roles WHERE name = ?', [name.trim()]);
      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'A role with this name already exists'
        });
      }

      // Validate level
      const roleLevel = level !== undefined ? parseInt(level) : 1;
      if (isNaN(roleLevel) || roleLevel < 1 || roleLevel > 10) {
        return res.status(400).json({
          success: false,
          message: 'Role level must be between 1 and 10'
        });
      }

      const roleData = {
        name: name.trim(),
        display_name: display_name.trim(),
        description: description?.trim() || null,
        level: roleLevel,
        is_system_role: is_system_role === true ? 1 : 0,
        is_active: 1
      };

      console.log('🎭 Creating role with data:', roleData);

      const [result] = await pool.query(`
        INSERT INTO roles (name, display_name, description, level, is_system_role, is_active) 
        VALUES (?, ?, ?, ?, ?, ?)
      `, [roleData.name, roleData.display_name, roleData.description, roleData.level, roleData.is_system_role, roleData.is_active]);

      const newRole = {
        id: result.insertId,
        ...roleData,
        permission_count: 0,
        user_count: 0
      };

      console.log(`✅ Created role: ${newRole.name}`);

      return res.status(201).json({
        success: true,
        data: newRole,
        message: 'Role created successfully'
      });
    } catch (error) {
      console.error('❌ Error in RoleController.createRole:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create role',
        error: error.message
      });
    }
  }

  // PUT /api/roles/:id - Update role (requires roles_update permission)
  static async updateRole(req, res) {
    try {
      console.log('🎭 RoleController.updateRole - User:', req.user?.id);
      
      const { id } = req.params;
      const { name, display_name, description, level, is_active } = req.body;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role ID'
        });
      }

      // Check if role exists
      const [existing] = await pool.query('SELECT * FROM roles WHERE id = ?', [parseInt(id)]);
      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      const existingRole = existing[0];

      // Prevent editing system roles
      if (existingRole.is_system_role && req.user?.role?.level < 10) {
        return res.status(403).json({
          success: false,
          message: 'Cannot modify system roles'
        });
      }

      // Validation
      if (name && name.trim() !== existingRole.name) {
        const [nameCheck] = await pool.query('SELECT id FROM roles WHERE name = ? AND id != ?', [name.trim(), parseInt(id)]);
        if (nameCheck.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'A role with this name already exists'
          });
        }
      }

      // Validate level
      let roleLevel = existingRole.level;
      if (level !== undefined) {
        roleLevel = parseInt(level);
        if (isNaN(roleLevel) || roleLevel < 1 || roleLevel > 10) {
          return res.status(400).json({
            success: false,
            message: 'Role level must be between 1 and 10'
          });
        }
      }

      const updateData = {
        name: name?.trim() || existingRole.name,
        display_name: display_name?.trim() || existingRole.display_name,
        description: description?.trim() || existingRole.description,
        level: roleLevel,
        is_active: is_active !== undefined ? (is_active ? 1 : 0) : existingRole.is_active
      };

      console.log('🎭 Updating role with data:', updateData);

      await pool.query(`
        UPDATE roles 
        SET name = ?, display_name = ?, description = ?, level = ?, is_active = ?
        WHERE id = ?
      `, [updateData.name, updateData.display_name, updateData.description, updateData.level, updateData.is_active, parseInt(id)]);

      // Fetch updated role
      const [updated] = await pool.query(`
        SELECT r.*, 
        (SELECT COUNT(*) FROM role_permissions WHERE role_id = r.id) as permission_count,
        (SELECT COUNT(*) FROM users WHERE role_id = r.id) as user_count
        FROM roles r 
        WHERE r.id = ?
      `, [parseInt(id)]);

      console.log(`✅ Updated role: ${updated[0].name}`);

      return res.status(200).json({
        success: true,
        data: updated[0],
        message: 'Role updated successfully'
      });
    } catch (error) {
      console.error('❌ Error in RoleController.updateRole:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update role',
        error: error.message
      });
    }
  }

  // DELETE /api/roles/:id - Delete role (requires roles_delete permission)
  static async deleteRole(req, res) {
    try {
      console.log('🎭 RoleController.deleteRole - User:', req.user?.id);
      
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role ID'
        });
      }

      // Check if role exists
      const [existing] = await pool.query('SELECT * FROM roles WHERE id = ?', [parseInt(id)]);
      if (existing.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      const existingRole = existing[0];

      // Prevent deleting system roles
      if (existingRole.is_system_role) {
        return res.status(403).json({
          success: false,
          message: 'Cannot delete system roles'
        });
      }

      // Check if role is assigned to users
      const [users] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role_id = ?', [parseInt(id)]);
      if (users[0].count > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete role. It is assigned to ${users[0].count} user(s)`,
          details: 'Remove this role from all users before deleting it.'
        });
      }

      console.log(`🎭 Deleting role: ${existingRole.name}`);

      // Delete role (role_permissions will be deleted by foreign key cascade)
      await pool.query('DELETE FROM roles WHERE id = ?', [parseInt(id)]);

      console.log(`✅ Deleted role: ${existingRole.name}`);

      return res.status(200).json({
        success: true,
        message: 'Role deleted successfully'
      });
    } catch (error) {
      console.error('❌ Error in RoleController.deleteRole:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete role',
        error: error.message
      });
    }
  }

  // GET /api/roles/:id/permissions - Get role permissions (requires roles_read permission)
  static async getRolePermissions(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role ID'
        });
      }

      const [permissions] = await pool.query(`
        SELECT p.id, p.name, p.display_name, p.category, m.name as module_name, m.display_name as module_display_name
        FROM role_permissions rp
        JOIN permissions p ON rp.permission_id = p.id
        JOIN modules m ON p.module_id = m.id
        WHERE rp.role_id = ? AND p.is_active = 1
        ORDER BY m.order_index, m.name, p.name
      `, [parseInt(id)]);

      // Group permissions by module
      const groupedPermissions = {};
      permissions.forEach(perm => {
        if (!groupedPermissions[perm.module_name]) {
          groupedPermissions[perm.module_name] = {
            module_name: perm.module_name,
            module_display_name: perm.module_display_name,
            permissions: []
          };
        }
        groupedPermissions[perm.module_name].permissions.push({
          id: perm.id,
          name: perm.name,
          display_name: perm.display_name,
          category: perm.category
        });
      });

      return res.status(200).json({
        success: true,
        data: {
          permissions: permissions,
          grouped_permissions: groupedPermissions
        },
        message: 'Role permissions retrieved successfully'
      });
    } catch (error) {
      console.error('❌ Error in RoleController.getRolePermissions:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch role permissions',
        error: error.message
      });
    }
  }
}

module.exports = RoleController;
