import React, { useState, useEffect } from 'react';
import { roleService } from '../services/roleService';

const RoleManagementInterface = () => {
  // State management
  const [roles, setRoles] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  
  // Create role form state
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState({});
  
  // Edit role form state
  const [editRoleName, setEditRoleName] = useState('');
  const [editRoleDescription, setEditRoleDescription] = useState('');
  const [editSelectedPermissions, setEditSelectedPermissions] = useState({});

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  // Re-populate edit form when modules data changes and we have an editing role
  useEffect(() => {
    if (editingRole && modules.length > 0 && showEditModal) {
      populateEditForm(editingRole);
    }
  }, [modules, editingRole, showEditModal]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [rolesData, modulesData] = await Promise.all([
        roleService.getAllRolesWithPermissions(),
        roleService.getModulesWithPermissions()
      ]);
      
      setRoles(rolesData.data || rolesData);
      setModules(modulesData.data || modulesData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle role creation
  const handleCreateRole = async () => {
    try {
      if (!newRoleName.trim()) {
        alert('Please enter a role name');
        return;
      }

      // Collect selected permissions
      const permissionsToAssign = [];
      Object.entries(selectedPermissions).forEach(([moduleId, permissions]) => {
        permissions.forEach(permissionName => {
          permissionsToAssign.push(permissionName);
        });
      });

      // Create role with permissions
      await roleService.createRoleWithPermissions(newRoleName, newRoleDescription, permissionsToAssign);

      // Reset form and close modal
      setNewRoleName('');
      setNewRoleDescription('');
      setSelectedPermissions({});
      setShowCreateModal(false);
      
      // Reload data
      await loadData();
      
      alert('Role created successfully!');
      
    } catch (err) {
      console.error('Error creating role:', err);
      
      // Handle specific error cases
      if (err.response?.status === 409) {
        alert('A role with this name already exists. Please choose a different name.');
      } else if (err.response?.status === 400) {
        alert('Invalid role data. Please check your inputs.');
      } else {
        alert(`Error creating role: ${err.response?.data?.message || err.message}`);
      }
    }
  };

  // Handle permission selection for role creation
  const handlePermissionToggle = (moduleId, permissionKey, isChecked) => {
    setSelectedPermissions(prev => {
      const modulePermissions = prev[moduleId] || [];
      
      if (isChecked) {
        // Add permission
        return {
          ...prev,
          [moduleId]: [...modulePermissions, permissionKey]
        };
      } else {
        // Remove permission
        return {
          ...prev,
          [moduleId]: modulePermissions.filter(p => p !== permissionKey)
        };
      }
    });
  };

  // Handle select all permissions for a module (role creation)
  const handleSelectAllModulePermissions = (moduleId, permissions, selectAll) => {
    setSelectedPermissions(prev => {
      if (selectAll) {
        // Select all permissions for this module
        return {
          ...prev,
          [moduleId]: permissions.map(p => p.key)
        };
      } else {
        // Deselect all permissions for this module
        return {
          ...prev,
          [moduleId]: []
        };
      }
    });
  };

  // Handle permission selection for role editing
  const handleEditPermissionToggle = (moduleId, permissionKey, isChecked) => {
    setEditSelectedPermissions(prev => {
      const modulePermissions = prev[moduleId] || [];
      
      if (isChecked) {
        // Add permission
        return {
          ...prev,
          [moduleId]: [...modulePermissions, permissionKey]
        };
      } else {
        // Remove permission
        return {
          ...prev,
          [moduleId]: modulePermissions.filter(p => p !== permissionKey)
        };
      }
    });
  };

  // Handle select all permissions for a module (role editing)
  const handleEditSelectAllModulePermissions = (moduleId, permissions, selectAll) => {
    setEditSelectedPermissions(prev => {
      if (selectAll) {
        // Select all permissions for this module
        return {
          ...prev,
          [moduleId]: permissions.map(p => p.key)
        };
      } else {
        // Deselect all permissions for this module
        return {
          ...prev,
          [moduleId]: []
        };
      }
    });
  };

  // Populate edit form with role data
  const populateEditForm = (role) => {
    setEditRoleName(role.name || role.role_name || '');
    setEditRoleDescription(role.description || '');
    
    // Debug logging
    console.log('Populating edit form for role:', role);
    console.log('Role permissions:', role.permissions);
    console.log('Available modules:', modules);
    
    // Organize current permissions by module for the form
    const permissionsByModule = {};
    if (role.permissions && role.permissions.length > 0) {
      role.permissions.forEach(permission => {
        // Role permissions have permission_key field, module permissions have key field
        const rolePermissionKey = permission.permission_key || permission.key;
        
        console.log('Processing permission:', { rolePermissionKey, permission });
        
        // Find which module this permission belongs to
        modules.forEach(module => {
          if (module.permissions && module.permissions.length > 0) {
            const matchedPermission = module.permissions.find(p => {
              // Match by the permission key
              return p.key === rolePermissionKey;
            });
            
            if (matchedPermission) {
              console.log(`Found permission "${rolePermissionKey}" in module "${module.name}"`);
              if (!permissionsByModule[module.id]) {
                permissionsByModule[module.id] = [];
              }
              // Use the matched permission's key to ensure consistency
              if (!permissionsByModule[module.id].includes(matchedPermission.key)) {
                permissionsByModule[module.id].push(matchedPermission.key);
              }
            }
          }
        });
      });
    }
    
    console.log('Final permissions by module:', permissionsByModule);
    setEditSelectedPermissions(permissionsByModule);
  };

  // Handle role update
  const handleUpdateRole = async () => {
    try {
      if (!editRoleName.trim()) {
        alert('Please enter a role name');
        return;
      }

      // Collect selected permissions
      const permissionsToAssign = [];
      Object.entries(editSelectedPermissions).forEach(([moduleId, permissions]) => {
        permissions.forEach(permissionKey => {
          permissionsToAssign.push(permissionKey);
        });
      });

      // Update role with permissions
      await roleService.updateRoleWithPermissions(
        editingRole.id || editingRole.role_id, 
        editRoleName, 
        editRoleDescription, 
        permissionsToAssign
      );

      // Reset form and close modal
      setEditRoleName('');
      setEditRoleDescription('');
      setEditSelectedPermissions({});
      setShowEditModal(false);
      setEditingRole(null);
      
      // Reload data
      await loadData();
      
      alert('Role updated successfully!');
      
    } catch (err) {
      console.error('Error updating role:', err);
      
      // Handle specific error cases
      if (err.response?.status === 409) {
        alert('A role with this name already exists. Please choose a different name.');
      } else if (err.response?.status === 400) {
        alert('Invalid role data. Please check your inputs.');
      } else if (err.response?.status === 403) {
        alert('Cannot update this role: It is a system role.');
      } else {
        alert(`Error updating role: ${err.response?.data?.message || err.message}`);
      }
    }
  };

  // Handle role deletion
  const handleDeleteRole = async (roleId, roleName, isSystemRole) => {
    // Check if it's a system role
    if (isSystemRole) {
      alert(`Cannot delete "${roleName}" because it is a system role.`);
      return;
    }

    if (window.confirm(`Are you sure you want to delete the role "${roleName}"?`)) {
      try {
        await roleService.deleteRole(roleId);
        await loadData();
        alert('Role deleted successfully!');
      } catch (err) {
        console.error('Error deleting role:', err);
        
        // Handle specific error cases
        if (err.response?.status === 403) {
          alert('Cannot delete this role: It is a system role or has restrictions.');
        } else if (err.response?.status === 400) {
          alert('Cannot delete this role: It may be assigned to active users.');
        } else {
          alert(`Error deleting role: ${err.response?.data?.message || err.message}`);
        }
      }
    }
  };

  // Format permissions for display
  const formatPermissions = (rolePermissions) => {
    if (!rolePermissions || rolePermissions.length === 0) {
      return 'No permissions assigned';
    }
    
    return rolePermissions.map(p => p.permission_name || p.name || p).join(', ');
  };

  if (loading) {
    return <div className="p-6 text-center">Loading role management interface...</div>;
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600 mb-4">Error: {error}</p>
        <button className="btn-primary" onClick={loadData}>Retry</button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Role Management</h2>
        <button 
          className="btn-primary" 
          onClick={() => setShowCreateModal(true)}
        >
          Create Role
        </button>
      </div>

      {/* Roles Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Permissions</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {roles.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">No roles found</td>
              </tr>
            ) : (
              roles.map((role) => (
                <tr key={role.id || role.role_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">{role.name || role.role_name}</span>
                      {role.is_system_role && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          System
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{role.description || 'No description'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="max-w-xs truncate">
                      {formatPermissions(role.permissions)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button 
                      className="btn-secondary text-xs px-3 py-1"
                      onClick={() => {
                        setEditingRole(role);
                        populateEditForm(role);
                        setShowEditModal(true);
                      }}
                    >
                      Edit
                    </button>
                    <button 
                      className={`text-xs px-3 py-1 ${
                        role.is_system_role 
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                          : 'btn-danger'
                      }`}
                      onClick={() => handleDeleteRole(role.id || role.role_id, role.name || role.role_name, role.is_system_role)}
                      disabled={role.is_system_role}
                      title={role.is_system_role ? 'System roles cannot be deleted' : 'Delete this role'}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Role Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Create New Role</h3>
              <button 
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Role Name *</label>
                <input
                  type="text"
                  className="input-field"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="Enter role name"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  className="input-field"
                  value={newRoleDescription}
                  onChange={(e) => setNewRoleDescription(e.target.value)}
                  placeholder="Enter role description"
                  rows="3"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-md p-4">
                  {modules.map((module) => {
                    const modulePermissions = selectedPermissions[module.id] || [];
                    const allModulePermissionKeys = module.permissions ? module.permissions.map(p => p.key) : [];
                    const allSelected = allModulePermissionKeys.length > 0 && allModulePermissionKeys.every(key => modulePermissions.includes(key));
                    const someSelected = modulePermissions.length > 0 && !allSelected;
                    
                    return (
                      <div key={module.id} className="mb-6 last:mb-0">
                        <div className="flex items-center justify-between mb-3 pb-2 border-b">
                          <h4 className="font-medium text-gray-900 text-base">{module.name}</h4>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">
                              {modulePermissions.length} of {allModulePermissionKeys.length} selected
                            </span>
                            <button
                              type="button"
                              className={`text-xs px-3 py-1 rounded border transition-colors ${
                                allSelected 
                                  ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                                  : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
                              }`}
                              onClick={() => handleSelectAllModulePermissions(module.id, module.permissions, !allSelected)}
                            >
                              {allSelected ? 'Deselect All' : 'Select All'}
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {module.permissions && module.permissions.map((permission) => (
                            <label key={`${module.id}-${permission.key}`} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded">
                              <input
                                type="checkbox"
                                className="mt-0.5 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                checked={selectedPermissions[module.id]?.includes(permission.key) || false}
                                onChange={(e) => handlePermissionToggle(module.id, permission.key, e.target.checked)}
                              />
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium text-gray-900">{permission.name}</span>
                                {permission.description && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    {permission.description}
                                  </p>
                                )}
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end p-4 border-t space-x-2">
              <button 
                className="btn-secondary"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={handleCreateRole}
              >
                Create Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {showEditModal && editingRole && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Edit Role: {editingRole.name || editingRole.role_name}
                {editingRole.is_system_role && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    System Role
                  </span>
                )}
              </h3>
              <button 
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingRole(null);
                  setEditRoleName('');
                  setEditRoleDescription('');
                  setEditSelectedPermissions({});
                }}
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              {editingRole.is_system_role && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                  <p className="text-blue-800 text-sm">
                    <strong>System Role:</strong> This role cannot be modified as it is required for system functionality.
                    You can view the role details but cannot make changes.
                  </p>
                </div>
              )}
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Role Name *</label>
                <input
                  type="text"
                  className={`input-field ${editingRole.is_system_role ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  value={editRoleName}
                  onChange={(e) => setEditRoleName(e.target.value)}
                  placeholder="Enter role name"
                  disabled={editingRole.is_system_role}
                  readOnly={editingRole.is_system_role}
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  className={`input-field ${editingRole.is_system_role ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  value={editRoleDescription}
                  onChange={(e) => setEditRoleDescription(e.target.value)}
                  placeholder="Enter role description"
                  rows="3"
                  disabled={editingRole.is_system_role}
                  readOnly={editingRole.is_system_role}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-md p-4">
                  {modules.map((module) => {
                    const modulePermissions = editSelectedPermissions[module.id] || [];
                    const allModulePermissionKeys = module.permissions ? module.permissions.map(p => p.key) : [];
                    const allSelected = allModulePermissionKeys.length > 0 && allModulePermissionKeys.every(key => modulePermissions.includes(key));
                    const someSelected = modulePermissions.length > 0 && !allSelected;
                    
                    return (
                      <div key={module.id} className="mb-6 last:mb-0">
                        <div className={`flex items-center justify-between mb-3 pb-2 border-b ${editingRole.is_system_role ? 'opacity-50' : ''}`}>
                          <h4 className="font-medium text-gray-900 text-base">{module.name}</h4>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">
                              {modulePermissions.length} of {allModulePermissionKeys.length} selected
                            </span>
                            {!editingRole.is_system_role && (
                              <button
                                type="button"
                                className={`text-xs px-3 py-1 rounded border transition-colors ${
                                  allSelected 
                                    ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                                    : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
                                }`}
                                onClick={() => handleEditSelectAllModulePermissions(module.id, module.permissions, !allSelected)}
                              >
                                {allSelected ? 'Deselect All' : 'Select All'}
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {module.permissions && module.permissions.map((permission) => (
                            <label key={`edit-${module.id}-${permission.key}`} className={`flex items-start space-x-3 p-2 hover:bg-gray-50 rounded ${editingRole.is_system_role ? 'opacity-50 cursor-not-allowed' : ''}`}>
                              <input
                                type="checkbox"
                                className="mt-0.5 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                checked={editSelectedPermissions[module.id]?.includes(permission.key) || false}
                                onChange={(e) => handleEditPermissionToggle(module.id, permission.key, e.target.checked)}
                                disabled={editingRole.is_system_role}
                              />
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium text-gray-900">{permission.name}</span>
                                {permission.description && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    {permission.description}
                                  </p>
                                )}
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end p-4 border-t space-x-2">
              <button 
                className="btn-secondary"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingRole(null);
                  setEditRoleName('');
                  setEditRoleDescription('');
                  setEditSelectedPermissions({});
                }}
              >
                Cancel
              </button>
              {!editingRole.is_system_role && (
                <button 
                  className="btn-primary"
                  onClick={handleUpdateRole}
                >
                  Update Role
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleManagementInterface;
