const { pool } = require('../config/database');
const PermissionManager = require('../utils/PermissionManager');

// Envelope
const createResponse = (success, message, data = null, meta = null) => {
  const out = { success, message, timestamp: new Date().toISOString() };
  if (data !== null) out.data = data;
  if (meta !== null) out.meta = meta;
  return out;
};

// Map HTTP method to permission column (kept for backward compatibility)
const methodToPerm = (method) => {
  switch (method.toUpperCase()) {
    case 'GET': return 'can_get';
    case 'POST': return 'can_post';
    case 'PUT': return 'can_put';
    case 'PATCH': return 'can_put';
    case 'DELETE': return 'can_delete';
    default: return null;
  }
};

// Utility fetchers
const getRoleById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM roles WHERE id = ?', [Number(id)]);
  return rows?.length ? rows[0] : null;
};

const getRoleByName = async (role_name) => {
  const [rows] = await pool.query('SELECT * FROM roles WHERE name = ?', [role_name]);
  return rows?.length ? rows[0] : null;
};

const getModuleByName = async (module_name) => {
  const [rows] = await pool.query('SELECT * FROM modules WHERE module_name = ?', [module_name]);
  return rows?.length ? rows[0] : null;
};

const getModuleById = async (id) => {
  const [rows] = await pool.query('SELECT * FROM modules WHERE id = ?', [Number(id)]);
  return rows?.length ? rows[0] : null;
};

// Controller
const permissionsController = {
  // Roles
  // POST /api/permissions/role (for frontend compatibility) and legacy /api/permissions/roles
  createRole: async (req, res) => {
    try {
      // Support both 'name' (frontend) and 'role_name' (legacy) fields
      const { role_name, name, description = '', is_active = true } = req.body || {};
      const roleName = (name || role_name || '').trim();
      if (!roleName) return res.status(400).json(createResponse(false, 'name or role_name is required'));

      const existing = await getRoleByName(roleName);
      if (existing) return res.status(409).json(createResponse(false, 'Role already exists'));

      const [result] = await pool.query(
        'INSERT INTO roles (name, description, is_active, created_at) VALUES (?,?,?,NOW())',
        [roleName, description, is_active ? 1 : 0]
      );
      const [rows] = await pool.query('SELECT * FROM roles WHERE id = ?', [result.insertId]);
      return res.status(201).json(createResponse(true, 'Role created', rows?.length ? rows[0] : null));
    } catch (error) {
      console.error('[Permissions] createRole error:', error);
      return res.status(500).json(createResponse(false, 'Failed to create role', null, process.env.NODE_ENV === 'development' ? { error: error.message } : null));
    }
  },

  // GET /api/permissions/roles
  listRoles: async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM roles ORDER BY created_at DESC');
      return res.status(200).json(createResponse(true, `Retrieved ${rows.length} roles`, rows || []));
    } catch (error) {
      console.error('[Permissions] listRoles error:', error);
      return res.status(500).json(createResponse(false, 'Failed to list roles', null, process.env.NODE_ENV === 'development' ? { error: error.message } : null));
    }
  },

  // DELETE /api/permissions/role/:id
  deleteRole: async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!id || id <= 0) return res.status(400).json(createResponse(false, 'Invalid role id'));
      
      const existing = await getRoleById(id);
      if (!existing) return res.status(404).json(createResponse(false, 'Role not found'));
      
      // Check if role is system role (cannot be deleted)
      if (existing.is_system_role) {
        return res.status(403).json(createResponse(false, 'Cannot delete system role'));
      }
      
      // Check if role is assigned to any users
      const [userCount] = await pool.query('SELECT COUNT(*) as count FROM user_roles WHERE role_id = ? AND is_active = 1', [id]);
      if (userCount[0].count > 0) {
        return res.status(400).json(createResponse(false, `Cannot delete role: ${userCount[0].count} user(s) are assigned to this role`));
      }
      
      // Delete role (CASCADE will handle role_permissions and other related records)
      const [result] = await pool.query('DELETE FROM roles WHERE id = ?', [id]);
      
      if (result.affectedRows === 0) {
        return res.status(404).json(createResponse(false, 'Role not found or already deleted'));
      }
      
      return res.status(200).json(createResponse(true, 'Role deleted successfully', { deleted_role_id: id }));
    } catch (error) {
      console.error('[Permissions] deleteRole error:', error);
      return res.status(500).json(createResponse(false, 'Failed to delete role', null, process.env.NODE_ENV === 'development' ? { error: error.message } : null));
    }
  },

  // PUT /api/permissions/roles/:id
  updateRole: async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!id || id <= 0) return res.status(400).json(createResponse(false, 'Invalid role id'));
      const existing = await getRoleById(id);
      if (!existing) return res.status(404).json(createResponse(false, 'Role not found'));

      const update = {};
      if (typeof req.body?.role_name === 'string') update.name = req.body.role_name.trim();
      if (typeof req.body?.description === 'string') update.description = req.body.description;
      if (typeof req.body?.is_active !== 'undefined') update.is_active = req.body.is_active ? 1 : 0;

      if (update.name && update.name !== existing.name) {
        const dup = await getRoleByName(update.name);
        if (dup) return res.status(409).json(createResponse(false, 'Role name already exists'));
      }

      if (Object.keys(update).length === 0) {
        return res.status(400).json(createResponse(false, 'No fields to update'));
      }

      update.updated_at = new Date();

      const setClause = Object.keys(update).map(k => `${k} = ?`).join(', ');
      const values = [...Object.values(update), id];
      await pool.query(`UPDATE roles SET ${setClause} WHERE id = ?`, values);

      const [rows] = await pool.query('SELECT * FROM roles WHERE id = ?', [id]);
  return res.status(200).json(createResponse(true, 'Role updated', rows?.length ? rows[0] : null));
    } catch (error) {
      console.error('[Permissions] updateRole error:', error);
      return res.status(500).json(createResponse(false, 'Failed to update role', null, process.env.NODE_ENV === 'development' ? { error: error.message } : null));
    }
  },

  // Modules
  // POST /api/permissions/modules
  createModule: async (req, res) => {
    try {
      const { module_name, module_path = null, description = '', is_active = true } = req.body || {};
      const name = (module_name || '').trim();
      if (!name) return res.status(400).json(createResponse(false, 'module_name is required'));

      const existing = await getModuleByName(name);
      if (existing) return res.status(409).json(createResponse(false, 'Module already exists'));

      const [result] = await pool.query(
        'INSERT INTO modules (module_name, module_path, description, is_active, created_at) VALUES (?,?,?,?,NOW())',
        [name, module_path, description, is_active ? 1 : 0]
      );
      const [rows] = await pool.query('SELECT * FROM modules WHERE id = ?', [result.insertId]);
  return res.status(201).json(createResponse(true, 'Module created', rows?.length ? rows[0] : null));
    } catch (error) {
      console.error('[Permissions] createModule error:', error);
      return res.status(500).json(createResponse(false, 'Failed to create module', null, process.env.NODE_ENV === 'development' ? { error: error.message } : null));
    }
  },

  // GET /api/permissions/modules
  listModules: async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM modules ORDER BY created_at DESC');
      return res.status(200).json(createResponse(true, `Retrieved ${rows.length} modules`, rows || []));
    } catch (error) {
      console.error('[Permissions] listModules error:', error);
      return res.status(500).json(createResponse(false, 'Failed to list modules', null, process.env.NODE_ENV === 'development' ? { error: error.message } : null));
    }
  },

  // PUT /api/permissions/modules/:id
  updateModule: async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!id || id <= 0) return res.status(400).json(createResponse(false, 'Invalid module id'));
      const existing = await getModuleById(id);
      if (!existing) return res.status(404).json(createResponse(false, 'Module not found'));

      const update = {};
      if (typeof req.body?.module_name === 'string') update.module_name = req.body.module_name.trim();
      if (typeof req.body?.module_path === 'string' || req.body?.module_path === null) update.module_path = req.body.module_path;
      if (typeof req.body?.description === 'string') update.description = req.body.description;
      if (typeof req.body?.is_active !== 'undefined') update.is_active = req.body.is_active ? 1 : 0;

      if (update.module_name && update.module_name !== existing.module_name) {
        const dup = await getModuleByName(update.module_name);
        if (dup) return res.status(409).json(createResponse(false, 'Module name already exists'));
      }

      if (Object.keys(update).length === 0) {
        return res.status(400).json(createResponse(false, 'No fields to update'));
      }

      update.updated_at = new Date();

      const setClause = Object.keys(update).map(k => `${k} = ?`).join(', ');
      const values = [...Object.values(update), id];
      await pool.query(`UPDATE modules SET ${setClause} WHERE id = ?`, values);

      const [rows] = await pool.query('SELECT * FROM modules WHERE id = ?', [id]);
  return res.status(200).json(createResponse(true, 'Module updated', rows?.length ? rows[0] : null));
  // No change needed, correct usage
  // No change needed, correct usage
    } catch (error) {
      console.error('[Permissions] updateModule error:', error);
      return res.status(500).json(createResponse(false, 'Failed to update module', null, process.env.NODE_ENV === 'development' ? { error: error.message } : null));
    }
  },

  // Permissions
  // POST /api/permissions/grant
  // body: { role_id or role_name, permission_ids[] } - Grant specific permissions to a role
  grantPermission: async (req, res) => {
    const { role_id, role_name, permission_ids = [] } = req.body || {};
    const grantedBy = req.user?.id || 1; // Default to user 1 if not authenticated
    
    try {
      // Resolve role
      let role = null;
      if (role_id) role = await getRoleById(role_id);
      else if (role_name) role = await getRoleByName(role_name.trim());
      if (!role) return res.status(400).json(createResponse(false, 'Valid role_id or role_name is required'));

      if (!Array.isArray(permission_ids) || permission_ids.length === 0) {
        return res.status(400).json(createResponse(false, 'permission_ids array is required'));
      }

      const results = [];
      
      // Grant each permission
      for (const permission_id of permission_ids) {
        try {
          await pool.query(
            `INSERT INTO role_permissions (role_id, permission_id, granted_by)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE granted_by = VALUES(granted_by), granted_at = CURRENT_TIMESTAMP`,
            [Number(role.id), Number(permission_id), grantedBy]
          );
          
          // Log the action
          await pool.query(
            `INSERT INTO permission_audit_log (role_id, permission_id, action, performed_by)
             VALUES (?, ?, 'GRANT', ?)`,
            [Number(role.id), Number(permission_id), grantedBy]
          );
          
          results.push({ role_id: role.id, permission_id: Number(permission_id), status: 'granted' });
        } catch (permError) {
          console.error(`Failed to grant permission ${permission_id}:`, permError);
          results.push({ role_id: role.id, permission_id: Number(permission_id), status: 'failed', error: permError.message });
        }
      }

      return res.status(200).json(createResponse(true, `Granted ${results.filter(r => r.status === 'granted').length} permissions to role`, results));
    } catch (error) {
      console.error('[Permissions] grantPermission error:', error);
      return res.status(500).json(createResponse(false, 'Failed to grant permission', null, process.env.NODE_ENV === 'development' ? { error: error.message } : null));
    }
  },

  // GET /api/permissions?role_id=..&role_name=.. - List role-permission assignments
  listPermissions: async (req, res) => {
    try {
      const { role_id, role_name } = req.query || {};
      const where = [];
      const params = [];

      if (role_id) { where.push('r.id = ?'); params.push(Number(role_id)); }
      if (role_name) { where.push('r.name = ?'); params.push(role_name.trim()); }

      let sql = `
        SELECT 
          rp.id as assignment_id,
          r.id as role_id,
          r.name as role_name,
          p.id as permission_id,
          p.permission_name,
          p.permission_key,
          p.description,
          m.module_name,
          rp.granted_by,
          rp.granted_at
        FROM role_permissions rp
        LEFT JOIN roles r ON rp.role_id = r.id
        LEFT JOIN permissions p ON rp.permission_id = p.id
        LEFT JOIN modules m ON p.module_id = m.id
      `;
      if (where.length) sql += ' WHERE ' + where.join(' AND ');
      sql += ' ORDER BY r.name ASC, m.module_name ASC, p.permission_name ASC';

      const [rows] = await pool.query(sql, params);
      return res.status(200).json(createResponse(true, `Retrieved ${rows.length} role-permission assignment(s)`, rows || []));
    } catch (error) {
      console.error('[Permissions] listPermissions error:', error);
      return res.status(500).json(createResponse(false, 'Failed to list permissions', null, process.env.NODE_ENV === 'development' ? { error: error.message } : null));
    }
  },

  // DELETE /api/permissions?role_id=..&permission_id=.. (or role_name)
  revokePermission: async (req, res) => {
    try {
      const { role_id, role_name, permission_id } = req.query || {};
      const revokedBy = req.user?.id || 1; // Default to user 1 if not authenticated
      
      // Resolve role
      let role = null;
      if (role_id) role = await getRoleById(role_id);
      else if (role_name) role = await getRoleByName(role_name.trim());
      if (!role) return res.status(400).json(createResponse(false, 'Valid role_id or role_name is required'));

      if (!permission_id) {
        return res.status(400).json(createResponse(false, 'permission_id is required'));
      }

      const [result] = await pool.query(
        'DELETE FROM role_permissions WHERE role_id = ? AND permission_id = ?', 
        [Number(role.id), Number(permission_id)]
      );
      
      if (!result || result.affectedRows === 0) {
        return res.status(404).json(createResponse(false, 'Role permission assignment not found'));
      }
      
      // Log the action
      await pool.query(
        `INSERT INTO permission_audit_log (role_id, permission_id, action, performed_by)
         VALUES (?, ?, 'REVOKE', ?)`,
        [Number(role.id), Number(permission_id), revokedBy]
      );
      
      return res.status(200).json(createResponse(true, 'Permission revoked from role', { 
        role_id: role.id, 
        permission_id: Number(permission_id) 
      }));
    } catch (error) {
      console.error('[Permissions] revokePermission error:', error);
      return res.status(500).json(createResponse(false, 'Failed to revoke permission', null, process.env.NODE_ENV === 'development' ? { error: error.message } : null));
    }
  },

  // NEW METHODS FOR ENHANCED PERMISSIONS SYSTEM
  
  // GET /api/permissions/user/:userId
  getUserPermissions: async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      if (!userId || userId <= 0) {
        return res.status(400).json(createResponse(false, 'Invalid user ID'));
      }

      const permissions = await PermissionManager.getUserPermissions(userId);
      return res.status(200).json(createResponse(true, `Retrieved ${permissions.length} permissions for user`, permissions));
    } catch (error) {
      console.error('[Permissions] getUserPermissions error:', error);
      return res.status(500).json(createResponse(false, 'Failed to get user permissions', null, process.env.NODE_ENV === 'development' ? { error: error.message } : null));
    }
  },

  // GET /api/permissions/user/:userId/grouped
  getUserPermissionsGrouped: async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      if (!userId || userId <= 0) {
        return res.status(400).json(createResponse(false, 'Invalid user ID'));
      }

      const permissions = await PermissionManager.getUserPermissionsByModule(userId);
      return res.status(200).json(createResponse(true, 'User permissions grouped by module', permissions));
    } catch (error) {
      console.error('[Permissions] getUserPermissionsGrouped error:', error);
      return res.status(500).json(createResponse(false, 'Failed to get grouped user permissions', null, process.env.NODE_ENV === 'development' ? { error: error.message } : null));
    }
  },

  // POST /api/permissions/check
  checkPermission: async (req, res) => {
    try {
      const { user_id, permission_key } = req.body;
      
      if (!user_id || !permission_key) {
        return res.status(400).json(createResponse(false, 'user_id and permission_key are required'));
      }

      const hasPermission = await PermissionManager.hasPermission(Number(user_id), permission_key.trim());
      return res.status(200).json(createResponse(true, 'Permission check completed', { 
        user_id: Number(user_id),
        permission_key: permission_key.trim(),
        has_permission: hasPermission 
      }));
    } catch (error) {
      console.error('[Permissions] checkPermission error:', error);
      return res.status(500).json(createResponse(false, 'Failed to check permission', null, process.env.NODE_ENV === 'development' ? { error: error.message } : null));
    }
  },

  // POST /api/permissions/assign-role
  assignRoleToUser: async (req, res) => {
    try {
      const { user_id, role_id, expires_at } = req.body;
      const assignedBy = req.user?.id; // Assuming user is attached to request via auth middleware
      
      if (!user_id || !role_id) {
        return res.status(400).json(createResponse(false, 'user_id and role_id are required'));
      }

      if (!assignedBy) {
        return res.status(401).json(createResponse(false, 'Authentication required'));
      }

      const success = await PermissionManager.assignRoleToUser(
        Number(user_id), 
        Number(role_id), 
        assignedBy,
        expires_at ? new Date(expires_at) : null
      );

      if (success) {
        return res.status(200).json(createResponse(true, 'Role assigned successfully', {
          user_id: Number(user_id),
          role_id: Number(role_id),
          assigned_by: assignedBy,
          expires_at
        }));
      } else {
        return res.status(500).json(createResponse(false, 'Failed to assign role'));
      }
    } catch (error) {
      console.error('[Permissions] assignRoleToUser error:', error);
      return res.status(500).json(createResponse(false, 'Failed to assign role', null, process.env.NODE_ENV === 'development' ? { error: error.message } : null));
    }
  },

  // DELETE /api/permissions/revoke-role
  revokeRoleFromUser: async (req, res) => {
    try {
      const { user_id, role_id } = req.body;
      const revokedBy = req.user?.id;
      
      if (!user_id || !role_id) {
        return res.status(400).json(createResponse(false, 'user_id and role_id are required'));
      }

      if (!revokedBy) {
        return res.status(401).json(createResponse(false, 'Authentication required'));
      }

      const success = await PermissionManager.revokeRoleFromUser(
        Number(user_id), 
        Number(role_id), 
        revokedBy
      );

      if (success) {
        return res.status(200).json(createResponse(true, 'Role revoked successfully', {
          user_id: Number(user_id),
          role_id: Number(role_id),
          revoked_by: revokedBy
        }));
      } else {
        return res.status(500).json(createResponse(false, 'Failed to revoke role'));
      }
    } catch (error) {
      console.error('[Permissions] revokeRoleFromUser error:', error);
      return res.status(500).json(createResponse(false, 'Failed to revoke role', null, process.env.NODE_ENV === 'development' ? { error: error.message } : null));
    }
  },

  // GET /api/permissions/user/:userId/roles
  getUserRoles: async (req, res) => {
    try {
      const userId = Number(req.params.userId);
      if (!userId || userId <= 0) {
        return res.status(400).json(createResponse(false, 'Invalid user ID'));
      }

      const roles = await PermissionManager.getUserRoles(userId);
      return res.status(200).json(createResponse(true, `Retrieved ${roles.length} roles for user`, roles));
    } catch (error) {
      console.error('[Permissions] getUserRoles error:', error);
      return res.status(500).json(createResponse(false, 'Failed to get user roles', null, process.env.NODE_ENV === 'development' ? { error: error.message } : null));
    }
  },

  // GET /api/permissions/roles-list
  getAllRoles: async (req, res) => {
    try {
      const roles = await PermissionManager.getAllRoles();
      return res.status(200).json(createResponse(true, `Retrieved ${roles.length} roles`, roles));
    } catch (error) {
      console.error('[Permissions] getAllRoles error:', error);
      return res.status(500).json(createResponse(false, 'Failed to get all roles', null, process.env.NODE_ENV === 'development' ? { error: error.message } : null));
    }
  },

  // GET /api/permissions/permissions-list
  getAllPermissions: async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT p.*, m.module_name 
        FROM permissions p
        LEFT JOIN modules m ON p.module_id = m.id
        WHERE p.is_active = 1
        ORDER BY m.module_name ASC, p.permission_name ASC
      `);
      return res.status(200).json(createResponse(true, `Retrieved ${rows.length} permissions`, rows));
    } catch (error) {
      console.error('[Permissions] getAllPermissions error:', error);
      return res.status(500).json(createResponse(false, 'Failed to get all permissions', null, process.env.NODE_ENV === 'development' ? { error: error.message } : null));
    }
  },

  // GET /api/permissions/modules-with-permissions
  getModulesWithPermissions: async (req, res) => {
    try {
      const [modules] = await pool.query(`
        SELECT id, module_name, description 
        FROM modules 
        WHERE is_active = 1 
        ORDER BY module_name ASC
      `);
      
      const [permissions] = await pool.query(`
        SELECT 
          p.id,
          p.module_id,
          p.permission_name,
          p.permission_key,
          p.description,
          p.http_method,
          p.api_endpoint
        FROM permissions p
        WHERE p.is_active = 1
        ORDER BY p.permission_name ASC
      `);
      
      // Group permissions by module
      const modulesWithPermissions = modules.map(module => {
        const modulePermissions = permissions.filter(p => p.module_id === module.id);
        return {
          id: module.id,
          name: module.module_name,
          description: module.description,
          permissions: modulePermissions.map(p => ({
            id: p.id,
            name: p.permission_name,
            key: p.permission_key,
            description: p.description,
            http_method: p.http_method,
            api_endpoint: p.api_endpoint
          }))
        };
      });
      
      return res.status(200).json(createResponse(true, `Retrieved ${modulesWithPermissions.length} modules with permissions`, modulesWithPermissions));
    } catch (error) {
      console.error('[Permissions] getModulesWithPermissions error:', error);
      return res.status(500).json(createResponse(false, 'Failed to get modules with permissions', null, process.env.NODE_ENV === 'development' ? { error: error.message } : null));
    }
  },

  // GET /api/permissions/role/:roleId/permissions
  getRolePermissions: async (req, res) => {
    try {
      const roleId = Number(req.params.roleId);
      if (!roleId || roleId <= 0) {
        return res.status(400).json(createResponse(false, 'Invalid role ID'));
      }

      const permissions = await PermissionManager.getRolePermissions(roleId);
      return res.status(200).json(createResponse(true, `Retrieved ${permissions.length} permissions for role`, permissions));
    } catch (error) {
      console.error('[Permissions] getRolePermissions error:', error);
      return res.status(500).json(createResponse(false, 'Failed to get role permissions', null, process.env.NODE_ENV === 'development' ? { error: error.message } : null));
    }
  },

  // POST /api/permissions/grant-role-permission
  grantRolePermission: async (req, res) => {
    try {
      const { role_id, permission_id } = req.body;
      const grantedBy = req.user?.id;

      if (!role_id || !permission_id) {
        return res.status(400).json(createResponse(false, 'role_id and permission_id are required'));
      }

      if (!grantedBy) {
        return res.status(401).json(createResponse(false, 'Authentication required'));
      }

      const [result] = await pool.query(`
        INSERT INTO role_permissions (role_id, permission_id, granted_by)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE granted_by = VALUES(granted_by), granted_at = CURRENT_TIMESTAMP
      `, [Number(role_id), Number(permission_id), grantedBy]);

      // Log the action
      await pool.query(`
        INSERT INTO permission_audit_log (role_id, permission_id, action, performed_by)
        VALUES (?, ?, 'GRANT', ?)
      `, [Number(role_id), Number(permission_id), grantedBy]);

      return res.status(200).json(createResponse(true, 'Permission granted to role', {
        role_id: Number(role_id),
        permission_id: Number(permission_id),
        granted_by: grantedBy
      }));
    } catch (error) {
      console.error('[Permissions] grantRolePermission error:', error);
      return res.status(500).json(createResponse(false, 'Failed to grant permission to role', null, process.env.NODE_ENV === 'development' ? { error: error.message } : null));
    }
  },

  // DELETE /api/permissions/revoke-role-permission
  revokeRolePermission: async (req, res) => {
    try {
      const { role_id, permission_id } = req.body;
      const revokedBy = req.user?.id;

      if (!role_id || !permission_id) {
        return res.status(400).json(createResponse(false, 'role_id and permission_id are required'));
      }

      if (!revokedBy) {
        return res.status(401).json(createResponse(false, 'Authentication required'));
      }

      const [result] = await pool.query(`
        DELETE FROM role_permissions 
        WHERE role_id = ? AND permission_id = ?
      `, [Number(role_id), Number(permission_id)]);

      if (result.affectedRows === 0) {
        return res.status(404).json(createResponse(false, 'Role permission not found'));
      }

      // Log the action
      await pool.query(`
        INSERT INTO permission_audit_log (role_id, permission_id, action, performed_by)
        VALUES (?, ?, 'REVOKE', ?)
      `, [Number(role_id), Number(permission_id), revokedBy]);

      return res.status(200).json(createResponse(true, 'Permission revoked from role', {
        role_id: Number(role_id),
        permission_id: Number(permission_id),
        revoked_by: revokedBy
      }));
    } catch (error) {
      console.error('[Permissions] revokeRolePermission error:', error);
      return res.status(500).json(createResponse(false, 'Failed to revoke permission from role', null, process.env.NODE_ENV === 'development' ? { error: error.message } : null));
    }
  },

  // GET /api/permissions/audit
  getAuditLog: async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
      const offset = (page - 1) * limit;

      const [rows] = await pool.query(`
        SELECT 
          pal.*,
          u.username as user_name,
          r.name as role_name,
          p.permission_key,
          pb.username as performed_by_name
        FROM permission_audit_log pal
        LEFT JOIN users u ON pal.user_id = u.id
        LEFT JOIN roles r ON pal.role_id = r.id
        LEFT JOIN permissions p ON pal.permission_id = p.id
        LEFT JOIN users pb ON pal.performed_by = pb.id
        ORDER BY pal.created_at DESC
        LIMIT ? OFFSET ?
      `, [limit, offset]);

      // Get total count
      const [countRows] = await pool.query('SELECT COUNT(*) as total FROM permission_audit_log');
      const total = countRows[0].total;
      const totalPages = Math.ceil(total / limit);

      return res.status(200).json(createResponse(true, `Retrieved ${rows.length} audit log entries`, rows, {
        pagination: {
          currentPage: page,
          totalPages,
          totalCount: total,
          limit,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }));
    } catch (error) {
      console.error('[Permissions] getAuditLog error:', error);
      return res.status(500).json(createResponse(false, 'Failed to get audit log', null, process.env.NODE_ENV === 'development' ? { error: error.message } : null));
    }
  },

  // POST /api/permissions/role/assign - Frontend compatible endpoint for assigning permissions to a role
  assignPermissionsToRole: async (req, res) => {
    try {
      const { roleId, permissions } = req.body;
      // Check if user 1 exists, otherwise use null
      const [userCheck] = await pool.query('SELECT id FROM users WHERE id = 1 LIMIT 1');
      const assignedBy = userCheck.length > 0 ? 1 : null;

      if (!roleId) {
        return res.status(400).json(createResponse(false, 'roleId is required'));
      }

      if (!permissions || !Array.isArray(permissions) || permissions.length === 0) {
        return res.status(400).json(createResponse(false, 'permissions array is required'));
      }

      // Verify role exists
      const [roleRows] = await pool.query('SELECT * FROM roles WHERE id = ?', [Number(roleId)]);
      if (roleRows.length === 0) {
        return res.status(404).json(createResponse(false, 'Role not found'));
      }

      // Get permission IDs from permission keys/names
      const permissionIds = [];
      for (const permissionKey of permissions) {
        const [permRows] = await pool.query(
          'SELECT id FROM permissions WHERE permission_key = ? OR permission_key = ?', 
          [permissionKey, permissionKey.toLowerCase()]
        );
        if (permRows.length > 0) {
          permissionIds.push(permRows[0].id);
        } else {
          console.warn(`Permission not found: ${permissionKey}`);
        }
      }

      if (permissionIds.length === 0) {
        return res.status(400).json(createResponse(false, 'No valid permissions found'));
      }

      // Clear existing permissions for this role
      await pool.query('DELETE FROM role_permissions WHERE role_id = ?', [Number(roleId)]);

      // Insert new permissions
      const insertPromises = permissionIds.map(permissionId => 
        pool.query(
          'INSERT INTO role_permissions (role_id, permission_id, granted_by) VALUES (?, ?, ?)',
          [Number(roleId), permissionId, assignedBy]
        )
      );

      await Promise.all(insertPromises);

      // Log the action
      const auditPromises = permissionIds.map(permissionId => 
        pool.query(
          'INSERT INTO permission_audit_log (role_id, permission_id, action, performed_by) VALUES (?, ?, "ASSIGN", ?)',
          [Number(roleId), permissionId, assignedBy]
        )
      );
      await Promise.all(auditPromises);

      return res.status(200).json(createResponse(true, `Successfully assigned ${permissionIds.length} permissions to role`, {
        roleId: Number(roleId),
        assignedPermissions: permissionIds.length,
        assignedBy
      }));
    } catch (error) {
      console.error('[Permissions] assignPermissionsToRole error:', error);
      return res.status(500).json(createResponse(false, 'Failed to assign permissions to role', null, process.env.NODE_ENV === 'development' ? { error: error.message } : null));
    }
  }
};

module.exports = { permissionsController, methodToPerm };
