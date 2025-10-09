const { pool } = require('../config/database');
const PermissionManager = require('../utils/PermissionManager');
const DateFormatUtils = require('../utils/dateFormatUtils');

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
  const [rows] = await pool.query('SELECT * FROM modules WHERE name = ?', [module_name]);
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
      const [userCount] = await pool.query('SELECT COUNT(*) as count FROM users WHERE role_id = ? AND is_active = 1', [id]);
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
      const { name, display_name, description = '', is_active = true } = req.body || {};
      const moduleName = (name || '').trim();
      if (!moduleName) return res.status(400).json(createResponse(false, 'name is required'));

      const existing = await getModuleByName(moduleName);
      if (existing) return res.status(409).json(createResponse(false, 'Module already exists'));

      const [result] = await pool.query(
        'INSERT INTO modules (name, display_name, description, is_active, created_at) VALUES (?,?,?,?,NOW())',
        [moduleName, display_name || moduleName, description, is_active ? 1 : 0]
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
      if (typeof req.body?.name === 'string') update.name = req.body.name.trim();
      if (typeof req.body?.display_name === 'string') update.display_name = req.body.display_name.trim();
      if (typeof req.body?.description === 'string') update.description = req.body.description;
      if (typeof req.body?.is_active !== 'undefined') update.is_active = req.body.is_active ? 1 : 0;

      if (update.name && update.name !== existing.name) {
        const dup = await getModuleByName(update.name);
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
            `INSERT INTO role_permissions (role_id, permission_id)
             VALUES (?, ?)
             ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP`,
            [Number(role.id), Number(permission_id)]
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
          p.name as permission_name,
          p.name as permission_key,
          p.description,
          p.display_name,
          p.category,
          m.name as module_name,
          rp.created_at as granted_at
        FROM role_permissions rp
        LEFT JOIN roles r ON rp.role_id = r.id
        LEFT JOIN permissions p ON rp.permission_id = p.id
        LEFT JOIN modules m ON p.module_id = m.id
      `;
      if (where.length) sql += ' WHERE ' + where.join(' AND ');
      sql += ' ORDER BY r.name ASC, m.name ASC, p.name ASC';

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
      // Direct database query instead of using PermissionManager
      const [roles] = await pool.query(`
        SELECT 
          id, 
          name, 
          description,
          level,
          is_active,
          is_system_role,
          created_at,
          updated_at
        FROM roles 
        ORDER BY level DESC, name ASC
      `);
      
      // Clean up role data to ensure proper display and format dates
      const cleanRoles = roles.map(role => {
        const originalName = role.name;
        const trimmedName = role.name ? role.name.trim() : role.name;
        
        return {
          ...role,
          name: trimmedName,
          role_name: trimmedName, // Add fallback field
          created_at: role.created_at ? DateFormatUtils.formatToDDMMYYYYWithTime(role.created_at) : null,
          updated_at: role.updated_at ? DateFormatUtils.formatToDDMMYYYYWithTime(role.updated_at) : null,
        };
      });
      
      return res.status(200).json(createResponse(true, `Retrieved ${cleanRoles.length} roles`, cleanRoles));
    } catch (error) {
      console.error('[Permissions] getAllRoles error:', error);
      return res.status(500).json(createResponse(false, 'Failed to get all roles', null, process.env.NODE_ENV === 'development' ? { error: error.message } : null));
    }
  },

  // GET /api/permissions/permissions-list
  getAllPermissions: async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT p.*, m.name as module_name 
        FROM permissions p
        LEFT JOIN modules m ON p.module_id = m.id
        WHERE p.is_active = 1
        ORDER BY m.name ASC, p.name ASC
      `);
      return res.status(200).json(createResponse(true, `Retrieved ${rows.length} permissions`, rows));
    } catch (error) {
      console.error('[Permissions] getAllPermissions error:', error);
      return res.status(500).json(createResponse(false, 'Failed to get all permissions', null, process.env.NODE_ENV === 'development' ? { error: error.message } : null));
    }
  },

  // GET /api/permissions/modules-with-permissions
  // Compatibility function for existing database structure
  getModulesWithPermissions: async (req, res) => {
    try {
      // Define SuperAdmin-only permissions that should NOT appear in Role Management
      const superAdminOnlyPermissions = [
        'campaign_types_create',
        'campaign_types_update', 
        'campaign_types_delete',
        'brands_create',
        'brands_update',
        'brands_delete'
      ];

      // Define the desired module structure and order
      const moduleStructure = [
        {
          name: 'User Management',
          categories: ['users'],
          description: 'User management related permissions',
          filterPermissions: [
            'users_create',
            'users_read',
            'users_update',
            'users_delete'
          ]
        },
        {
          name: 'Role Management', 
          categories: ['permissions', 'system', 'roles'],
          description: 'Role and permission management',
          filterPermissions: [
            'roles_create',
            'roles_read', 
            'roles_update',
            'roles_delete'
          ]
        },
        {
          name: 'Brand',
          categories: ['brands'],
          description: 'Brand management permissions'
        },
        {
          name: 'Campaign Types',
          categories: ['campaign_types'],
          description: 'Campaign type management permissions'
        },
        {
          name: 'Campaigns',
          categories: ['campaigns'],
          description: 'Campaign management permissions'
        },
        {
          name: 'Campaign Data',
          categories: ['campaign_data'],
          description: 'Campaign data management permissions'
        },
        {
          name: 'Cards',
          categories: ['cards'],
          description: 'Card management permissions'
        },
        {
          name: 'Card Users',
          categories: ['card_users'],
          description: 'Card user management permissions'
        },
        {
          name: 'Report Analytics',
          categories: ['analytics', 'report_analytics'],
          description: 'Report analytics permissions'
        },
        {
          name: 'Reports',
          categories: ['reports'],
          description: 'Report management permissions'
        },
        {
          name: 'Facebook Accounts',
          categories: ['facebook_accounts'],
          description: 'Facebook advertising accounts management'
        },
        {
          name: 'Facebook Pages',
          categories: ['facebook_pages'],
          description: 'Facebook business pages management'
        },
        {
          name: 'Business Manager',
          categories: ['business_manager'],
          description: 'Business managers and organizational structure'
        },
        {
          name: 'Ads Manager',
          categories: ['ads_manager'],
          description: 'Advertising managers and campaign personnel'
        }
      ];

      // Get all permissions
      const [permissions] = await pool.query(`
        SELECT 
          id,
          name,
          display_name,
          category,
          is_active
        FROM permissions 
        WHERE is_active = 1
        ORDER BY category, display_name ASC
      `);
      
      // Create modules with permissions based on the defined structure
      const modulesWithPermissions = [];
      
      moduleStructure.forEach((moduleConfig, index) => {
        const modulePermissions = [];
        
        // Get permissions for this module
        permissions.forEach(permission => {
          // Skip SuperAdmin-only permissions from appearing in Role Management
          if (superAdminOnlyPermissions.includes(permission.name)) {
            return; // Skip this permission
          }
          
          // Check if this permission belongs to this module
          const belongsToModule = moduleConfig.categories.includes(permission.category);
          
          // For Role Management module, also check specific permission filter
          if (moduleConfig.filterPermissions) {
            const isFilteredPermission = moduleConfig.filterPermissions.includes(permission.name);
            if (belongsToModule && isFilteredPermission) {
              // Apply permission name override if specified
              const overrideName = moduleConfig.permissionNameOverrides?.[permission.name];
              const displayName = overrideName || permission.display_name || permission.name;
              
              modulePermissions.push({
                id: permission.id,
                name: displayName,
                key: permission.name,
                description: displayName,
                http_method: 'GET,POST,PUT,DELETE',
                api_endpoint: `/${permission.category}`
              });
            }
          } else if (belongsToModule) {
            modulePermissions.push({
              id: permission.id,
              name: permission.display_name || permission.name,
              key: permission.name,
              description: permission.display_name || permission.name,
              http_method: 'GET,POST,PUT,DELETE',
              api_endpoint: `/${permission.category}`
            });
          }
        });
        
        // Only add module if it has permissions
        if (modulePermissions.length > 0) {
          modulesWithPermissions.push({
            id: index + 1,
            name: moduleConfig.name,
            description: moduleConfig.description,
            permissions: modulePermissions
          });
        }
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

      // Direct database query instead of using PermissionManager
      const [permissions] = await pool.query(`
        SELECT 
          p.id,
          p.name,
          p.display_name,
          p.category,
          p.description,
          p.is_active
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = ? AND p.is_active = 1
        ORDER BY p.category ASC, p.display_name ASC
      `, [roleId]);
      
      const formattedPermissions = permissions.map(p => ({
        id: p.id,
        permission_name: p.display_name || p.name,
        permission_key: p.name,
        category: p.category,
        description: p.description
      }));

      return res.status(200).json(createResponse(true, `Retrieved ${formattedPermissions.length} permissions for role`, formattedPermissions));
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
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP
      `, [Number(role_id), Number(permission_id)]);

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
      // Audit log table doesn't exist in current database schema
      // Return empty result to prevent crashes
      return res.status(200).json(createResponse(true, 'Audit log feature not available', [], {
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalCount: 0,
          limit: 50,
          hasNext: false,
          hasPrev: false
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
          'SELECT id FROM permissions WHERE name = ?', 
          [permissionKey]
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

      // Insert new permissions (only role_id and permission_id)
      const insertPromises = permissionIds.map(permissionId => 
        pool.query(
          'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
          [Number(roleId), permissionId]
        )
      );

      await Promise.all(insertPromises);

      return res.status(200).json(createResponse(true, `Successfully assigned ${permissionIds.length} permissions to role`, {
        roleId: Number(roleId),
        assignedPermissions: permissionIds.length
      }));
    } catch (error) {
      console.error('[Permissions] assignPermissionsToRole error:', error);
      return res.status(500).json(createResponse(false, 'Failed to assign permissions to role', null, process.env.NODE_ENV === 'development' ? { error: error.message } : null));
    }
  }
};

module.exports = { permissionsController, methodToPerm };
