const { pool } = require('../config/database');

// Get all roles
const getRoles = async (req, res) => {
  try {
    const [roles] = await pool.execute(`
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
        COUNT(DISTINCT rp.permission_id) as permission_count,
        COUNT(DISTINCT u.id) as user_count
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN users u ON r.id = u.role_id AND u.is_active = 1
      GROUP BY r.id
      ORDER BY r.level DESC, r.name ASC
    `);

    res.json({
      success: true,
      message: 'Roles retrieved successfully',
      data: roles
    });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve roles'
    });
  }
};

// Get all permissions
const getPermissions = async (req, res) => {
  try {
    const [permissions] = await pool.execute(`
      SELECT 
        p.id,
        p.name,
        p.display_name,
        p.description,
        p.category,
        p.is_active,
        p.created_at,
        COUNT(DISTINCT rp.role_id) as assigned_roles_count
      FROM permissions p
      LEFT JOIN role_permissions rp ON p.id = rp.permission_id
      GROUP BY p.id
      ORDER BY p.category, p.display_name
    `);

    // Group permissions by category
    const groupedPermissions = permissions.reduce((acc, perm) => {
      if (!acc[perm.category]) {
        acc[perm.category] = [];
      }
      acc[perm.category].push(perm);
      return acc;
    }, {});

    res.json({
      success: true,
      message: 'Permissions retrieved successfully',
      data: {
        permissions,
        groupedPermissions
      }
    });
  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve permissions'
    });
  }
};

// Get role with permissions
const getRoleWithPermissions = async (req, res) => {
  try {
    const { roleId } = req.params;

    // Get role details
    const [roles] = await pool.execute(`
      SELECT * FROM roles WHERE id = ?
    `, [roleId]);

    if (roles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Get role permissions
    const [permissions] = await pool.execute(`
      SELECT 
        p.id,
        p.name,
        p.display_name,
        p.description,
        p.category
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ? AND p.is_active = 1
      ORDER BY p.category, p.display_name
    `, [roleId]);

    const role = {
      ...roles[0],
      permissions,
      permissionCount: permissions.length
    };

    res.json({
      success: true,
      message: 'Role retrieved successfully',
      data: role
    });
  } catch (error) {
    console.error('Get role with permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve role'
    });
  }
};

// Create new role
const createRole = async (req, res) => {
  try {
    const { name, displayName, description, level, permissions } = req.body;

    // Validate required fields
    if (!name || !displayName) {
      return res.status(400).json({
        success: false,
        message: 'Name and display name are required'
      });
    }

    // Check if role name already exists
    const [existingRoles] = await pool.execute(
      'SELECT id FROM roles WHERE name = ?',
      [name]
    );

    if (existingRoles.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Role name already exists'
      });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Insert new role
      const [result] = await connection.execute(`
        INSERT INTO roles (name, display_name, description, level, is_system_role)
        VALUES (?, ?, ?, ?, 0)
      `, [name, displayName, description || null, level || 1]);

      const roleId = result.insertId;

      // Assign permissions if provided
      if (permissions && Array.isArray(permissions) && permissions.length > 0) {
        const permissionValues = permissions.map(permissionId => [roleId, permissionId]);
        await connection.query(
          'INSERT INTO role_permissions (role_id, permission_id) VALUES ?',
          [permissionValues]
        );
      }

      // Log audit trail
      await connection.execute(`
        INSERT INTO permission_audit (user_id, action, role_id, details)
        VALUES (?, 'ROLE_CREATED', ?, ?)
      `, [
        req.user.id,
        roleId,
        JSON.stringify({
          roleName: name,
          displayName,
          permissionsAssigned: permissions?.length || 0
        })
      ]);

      await connection.commit();

      res.status(201).json({
        success: true,
        message: 'Role created successfully',
        data: { id: roleId, name, displayName }
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create role'
    });
  }
};

// Update role
const updateRole = async (req, res) => {
  try {
    const { roleId } = req.params;
    const { displayName, description, level, permissions } = req.body;

    // Check if role exists and is not system role for certain updates
    const [roles] = await pool.execute(
      'SELECT * FROM roles WHERE id = ?',
      [roleId]
    );

    if (roles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    const role = roles[0];

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Update role details
      await connection.execute(`
        UPDATE roles 
        SET display_name = ?, description = ?, level = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [displayName, description, level || role.level, roleId]);

      // Update permissions if provided
      if (permissions && Array.isArray(permissions)) {
        // Remove existing permissions
        await connection.execute(
          'DELETE FROM role_permissions WHERE role_id = ?',
          [roleId]
        );

        // Add new permissions
        if (permissions.length > 0) {
          const permissionValues = permissions.map(permissionId => [roleId, permissionId]);
          await connection.query(
            'INSERT INTO role_permissions (role_id, permission_id) VALUES ?',
            [permissionValues]
          );
        }
      }

      // Log audit trail
      await connection.execute(`
        INSERT INTO permission_audit (user_id, action, role_id, details)
        VALUES (?, 'ROLE_UPDATED', ?, ?)
      `, [
        req.user.id,
        roleId,
        JSON.stringify({
          roleName: role.name,
          updates: { displayName, description, level },
          permissionsUpdated: permissions ? permissions.length : null
        })
      ]);

      await connection.commit();

      res.json({
        success: true,
        message: 'Role updated successfully'
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update role'
    });
  }
};

// Delete role
const deleteRole = async (req, res) => {
  try {
    const { roleId } = req.params;

    // Check if role exists
    const [roles] = await pool.execute(
      'SELECT * FROM roles WHERE id = ?',
      [roleId]
    );

    if (roles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    const role = roles[0];

    // Prevent deletion of system roles
    if (role.is_system_role) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete system roles'
      });
    }

    // Check if role is assigned to users
    const [users] = await pool.execute(
      'SELECT COUNT(*) as user_count FROM users WHERE role_id = ?',
      [roleId]
    );

    if (users[0].user_count > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete role. It is assigned to ${users[0].user_count} user(s)`
      });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Log audit trail before deletion
      await connection.execute(`
        INSERT INTO permission_audit (user_id, action, role_id, details)
        VALUES (?, 'ROLE_DELETED', ?, ?)
      `, [
        req.user.id,
        roleId,
        JSON.stringify({
          roleName: role.name,
          displayName: role.display_name
        })
      ]);

      // Delete role (permissions will be deleted by CASCADE)
      await connection.execute('DELETE FROM roles WHERE id = ?', [roleId]);

      await connection.commit();

      res.json({
        success: true,
        message: 'Role deleted successfully'
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete role'
    });
  }
};

// Assign role to user
const assignRole = async (req, res) => {
  try {
    const { userId, roleId } = req.body;

    if (!userId || !roleId) {
      return res.status(400).json({
        success: false,
        message: 'User ID and Role ID are required'
      });
    }

    // Check if user exists
    const [users] = await pool.execute(
      'SELECT id, username FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if role exists
    const [roles] = await pool.execute(
      'SELECT id, name, display_name FROM roles WHERE id = ?',
      [roleId]
    );

    if (roles.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Update user's role
      await connection.execute(
        'UPDATE users SET role_id = ? WHERE id = ?',
        [roleId, userId]
      );

      // Log audit trail
      await connection.execute(`
        INSERT INTO permission_audit (user_id, action, target_user_id, role_id, details)
        VALUES (?, 'ROLE_ASSIGNED', ?, ?, ?)
      `, [
        req.user.id,
        userId,
        roleId,
        JSON.stringify({
          targetUsername: users[0].username,
          roleName: roles[0].name,
          roleDisplayName: roles[0].display_name
        })
      ]);

      await connection.commit();

      res.json({
        success: true,
        message: 'Role assigned successfully'
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Assign role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign role'
    });
  }
};

// Get users with their roles
const getUsersWithRoles = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    let searchCondition = '';
    let searchParams = [];

    if (search) {
      searchCondition = 'WHERE u.username LIKE ? OR r.display_name LIKE ?';
      searchParams = [`%${search}%`, `%${search}%`];
    }

    // Get total count
    const [countResult] = await pool.execute(`
      SELECT COUNT(*) as total
      FROM users u
      JOIN roles r ON u.role_id = r.id
      ${searchCondition}
    `, searchParams);

    const totalUsers = countResult[0].total;

    // Get users with pagination
    const [users] = await pool.execute(`
      SELECT 
        u.id,
        u.username,
        u.is_active,
        u.last_login,
        u.created_at,
        r.id as role_id,
        r.name as role_name,
        r.display_name as role_display_name,
        r.level as role_level
      FROM users u
      JOIN roles r ON u.role_id = r.id
      ${searchCondition}
      ORDER BY u.username ASC
      LIMIT ? OFFSET ?
    `, [...searchParams, limit, offset]);

    res.json({
      success: true,
      message: 'Users retrieved successfully',
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalUsers / limit),
          totalUsers,
          hasNext: page * limit < totalUsers,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get users with roles error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users'
    });
  }
};

// Get user permissions for frontend
const getUserPermissions = async (req, res) => {
  try {
    const { userId } = req.params;

    const [permissions] = await pool.execute(`
      SELECT 
        p.name,
        p.display_name,
        p.category,
        p.description
      FROM users u
      JOIN roles r ON u.role_id = r.id
      JOIN role_permissions rp ON r.id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE u.id = ? AND u.is_active = 1 AND r.is_active = 1 AND p.is_active = 1
      ORDER BY p.category, p.display_name
    `, [userId]);

    // Group permissions by category
    const groupedPermissions = permissions.reduce((acc, perm) => {
      if (!acc[perm.category]) {
        acc[perm.category] = [];
      }
      acc[perm.category].push({
        name: perm.name,
        displayName: perm.display_name,
        description: perm.description
      });
      return acc;
    }, {});

    res.json({
      success: true,
      message: 'User permissions retrieved successfully',
      data: {
        permissions: permissions.map(p => p.name),
        groupedPermissions
      }
    });

  } catch (error) {
    console.error('Get user permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user permissions'
    });
  }
};

// Get current user's permissions (from JWT token)
const getMyPermissions = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Use the user permissions from the middleware (already attached)
    res.json({
      success: true,
      message: 'User permissions retrieved successfully',
      data: {
        permissions: req.user.permissions,
        groupedPermissions: req.user.permissionsDetailed,
        role: req.user.role
      }
    });

  } catch (error) {
    console.error('Get my permissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user permissions'
    });
  }
};

// Get current user's roles (from JWT token)
const getMyRoles = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Use the user role from the middleware (already attached)
    res.json({
      success: true,
      message: 'User roles retrieved successfully',
      data: {
        role: req.user.role,
        roles: [req.user.role] // Return as array for consistency with frontend expectations
      }
    });

  } catch (error) {
    console.error('Get my roles error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user roles'
    });
  }
};

// Get audit log
const getAuditLog = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const [logs] = await pool.execute(`
      SELECT 
        pa.id,
        pa.action,
        pa.details,
        pa.ip_address,
        pa.created_at,
        u.username as performed_by_username,
        tu.username as target_username,
        r.name as role_name,
        p.name as permission_name
      FROM permission_audit pa
      LEFT JOIN users u ON pa.user_id = u.id
      LEFT JOIN users tu ON pa.target_user_id = tu.id
      LEFT JOIN roles r ON pa.role_id = r.id
      LEFT JOIN permissions p ON pa.permission_id = p.id
      ORDER BY pa.created_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    // Get total count
    const [countResult] = await pool.execute('SELECT COUNT(*) as total FROM permission_audit');

    res.json({
      success: true,
      message: 'Audit log retrieved successfully',
      data: {
        logs,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(countResult[0].total / limit),
          totalEntries: countResult[0].total
        }
      }
    });

  } catch (error) {
    console.error('Get audit log error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve audit log'
    });
  }
};

module.exports = {
  getRoles,
  getPermissions,
  getRoleWithPermissions,
  createRole,
  updateRole,
  deleteRole,
  assignRole,
  getUsersWithRoles,
  getUserPermissions,
  getMyPermissions,
  getMyRoles,
  getAuditLog
};
