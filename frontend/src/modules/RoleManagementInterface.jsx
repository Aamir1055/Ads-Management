import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { roleService } from '../services/roleService';
import '../components/RoleNameDisplay.css';

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

  // Error and success states for better UX
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [rbacError, setRbacError] = useState(null); // Special state for RBAC/permission errors

  // Sort modules in the same order as the sidebar (only manageable modules)
  const sortModulesBySidebarOrder = useCallback((modules) => {
    // Only include modules that have actual permissions to manage
    const manageableModulesOrder = [
      'User Management',
      'Role Management', 
      'Brand',
      'Campaign Types',
      'Campaigns',
      'Campaign Data',
      'Cards',
      'Card Users',
      'Report Analytics',
      'Reports',
      'Facebook Accounts',
      'Facebook Pages', 
      'Business Manager',
      'Ads Manager'
    ];
    
    // Map different possible module names to standard names
    const getStandardName = (name) => {
      const nameMap = {
        'users': 'User Management',
        'user management': 'User Management',
        'campaigns': 'Campaigns',
        'campaign': 'Campaigns',
        'campaign_data': 'Campaign Data',
        'campaign-data': 'Campaign Data',
        'campaign_types': 'Campaign Types',
        'campaign-types': 'Campaign Types',
        'campaign types': 'Campaign Types',
        'brand': 'Brand',
        'brands': 'Brand',
        'cards': 'Cards',
        'card_users': 'Card Users',
        'card-users': 'Card Users',
        'card users': 'Card Users',
        'cards users': 'Card Users',
        'reports': 'Reports',
        'report': 'Reports',
        'report analytics': 'Report Analytics',
        'analytics': 'Report Analytics',
        'permissions': 'Role Management',
        'role management': 'Role Management',
        'system': 'Role Management',
        'facebook accounts': 'Facebook Accounts',
        'facebook_accounts': 'Facebook Accounts',
        'facebook pages': 'Facebook Pages', 
        'facebook_pages': 'Facebook Pages',
        'business manager': 'Business Manager',
        'business_manager': 'Business Manager',
        'ads manager': 'Ads Manager',
        'ads_manager': 'Ads Manager',
        'ads managers': 'Ads Manager',
        'ads_managers': 'Ads Manager'
      };
      
      return nameMap[name.toLowerCase()] || name;
    };
    
    const getOrderIndex = (moduleName) => {
      const standardName = getStandardName(moduleName);
      const index = manageableModulesOrder.indexOf(standardName);
      return index !== -1 ? index : 999; // Put unknown modules at the end
    };
    
    return modules.sort((a, b) => {
      const aIndex = getOrderIndex(a.name);
      const bIndex = getOrderIndex(b.name);
      
      if (aIndex !== bIndex) {
        return aIndex - bIndex;
      }
      
      // If same order index, sort alphabetically
      return (a.name || '').localeCompare(b.name || '');
    });
  }, []);

  // Memoize filtered and sorted modules
  const filteredSortedModules = useMemo(() => 
    sortModulesBySidebarOrder(
      modules.filter(module => module.name && module.name.toLowerCase() !== 'system')
    ), 
    [modules, sortModulesBySidebarOrder]
  );

  // Load initial data with cache busting
  const loadData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      setErrorMessage('');
      
      // Add cache busting parameter
      const cacheBuster = forceRefresh ? `?_t=${Date.now()}` : '';
      
      const [rolesData, modulesData] = await Promise.all([
        roleService.getAllRolesWithPermissions(cacheBuster),
        roleService.getModulesWithPermissions(cacheBuster)
      ]);
      
      const finalRoles = rolesData.data || rolesData;
      
      // Clean up roles data to ensure proper display and normalize structure
      const cleanRoles = finalRoles.map(role => ({
        ...role,
        id: role.id || role.role_id,
        name: String(role.name || role.role_name || '').trim(),
        role_name: String(role.role_name || role.name || '').trim(),
        is_system_role: Boolean(role.is_system_role === 1 || role.is_system_role === true)
      }));
      
      setRoles(cleanRoles);
      setModules(modulesData.data || modulesData);
      
      if (forceRefresh) {
        setSuccessMessage('Data refreshed successfully!');
        console.log('🔄 Data force refreshed at', new Date().toLocaleTimeString());
        console.log('📦 Loaded modules:', modulesData.data?.length || 0);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to load data';
      setError(errorMsg);
      setErrorMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Populate edit form with role data - now properly memoized
  const populateEditForm = useCallback((role) => {
    const roleName = String(role.name || role.role_name || '');
    setEditRoleName(roleName);
    setEditRoleDescription(role.description || '');
    
    // Organize current permissions by module for the form
    const permissionsByModule = {};
    if (role.permissions && role.permissions.length > 0) {
      role.permissions.forEach(permission => {
        // Role permissions have permission_key field, module permissions have key field
        const rolePermissionKey = permission.permission_key || permission.key;
        
        // Find which module this permission belongs to
        modules.forEach(module => {
          if (module.permissions && module.permissions.length > 0) {
            const matchedPermission = module.permissions.find(p => {
              // Match by the permission key
              return p.key === rolePermissionKey;
            });
            
            if (matchedPermission) {
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
    
    setEditSelectedPermissions(permissionsByModule);
  }, [modules]);

  // Re-populate edit form when modules data changes and we have an editing role
  useEffect(() => {
    if (editingRole && modules.length > 0 && showEditModal) {
      populateEditForm(editingRole);
    }
  }, [modules, editingRole, showEditModal, populateEditForm]);

  // Enhanced input validation - EXACTLY match backend validation
  const validateRoleName = useCallback((name) => {
    const errors = [];
    if (!name || !name.trim()) {
      errors.push('Role name is required');
    } else {
      if (name.trim().length < 3 || name.trim().length > 50) {
        errors.push('Role name must be between 3 and 50 characters');
      }
      if (!/^[a-zA-Z0-9\s\-_]+$/.test(name.trim())) {
        errors.push('Role name can only contain letters, numbers, spaces, hyphens, and underscores');
      }
    }
    return errors;
  }, []);

  // Validate description to match backend
  const validateDescription = useCallback((description) => {
    if (description && description.trim().length > 255) {
      return ['Description cannot exceed 255 characters'];
    }
    return [];
  }, []);

  // Handle RBAC/Permission errors - close modals and show prominent error
  const handleRbacError = useCallback((error) => {
    console.error('RBAC Error:', error);
    
    // Close any open modals immediately
    setShowCreateModal(false);
    setShowEditModal(false);
    setEditingRole(null);
    
    // Clear form states
    setNewRoleName('');
    setNewRoleDescription('');
    setSelectedPermissions({});
    setEditRoleName('');
    setEditRoleDescription('');
    setEditSelectedPermissions({});
    
    // Set the RBAC error for prominent display
    const errorData = error.response?.data;
    setRbacError({
      message: errorData?.message || error.message,
      details: errorData?.details,
      userRole: errorData?.details?.userRole,
      requiredPermission: errorData?.details?.requiredPermission,
      availableActions: errorData?.details?.availableActions,
      suggestion: errorData?.details?.suggestion
    });
    
    // Also set regular error message as fallback
    setErrorMessage(errorData?.message || error.message);
  }, []);

  // Clear RBAC error after timeout
  useEffect(() => {
    if (rbacError) {
      const timer = setTimeout(() => setRbacError(null), 12000); // Longer timeout for RBAC errors
      return () => clearTimeout(timer);
    }
  }, [rbacError]);

  // Clear messages after timeout
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(''), 8000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // Handle role creation
  const handleCreateRole = useCallback(async () => {
    try {
      setErrorMessage('');
      setSuccessMessage('');
      
      const nameErrors = validateRoleName(newRoleName);
      const descErrors = validateDescription(newRoleDescription);
      const validationErrors = [...nameErrors, ...descErrors];
      if (validationErrors.length > 0) {
        setErrorMessage(validationErrors.join('. '));
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
      await roleService.createRoleWithPermissions(
        newRoleName.trim(), 
        newRoleDescription.trim(), 
        permissionsToAssign
      );

      // Reset form and close modal
      setNewRoleName('');
      setNewRoleDescription('');
      setSelectedPermissions({});
      setShowCreateModal(false);
      
      // Reload data
      await loadData();
      
      setSuccessMessage('Role created successfully!');
      
    } catch (err) {
      console.error('Error creating role:', err);
      
      // Handle specific error cases
      if (err.response?.status === 403) {
        // RBAC/Permission error - close modal and show prominent error
        handleRbacError(err);
      } else if (err.response?.status === 409) {
        setErrorMessage('A role with this name already exists. Please choose a different name.');
      } else if (err.response?.status === 400) {
        setErrorMessage('Invalid role data. Please check your inputs.');
      } else {
        setErrorMessage(`Error creating role: ${err.response?.data?.message || err.message}`);
      }
    }
  }, [newRoleName, newRoleDescription, selectedPermissions, validateRoleName, validateDescription, loadData, handleRbacError]);

  // Handle role update
  const handleUpdateRole = useCallback(async () => {
    try {
      setErrorMessage('');
      setSuccessMessage('');
      
      const nameErrors = validateRoleName(editRoleName);
      const descErrors = validateDescription(editRoleDescription);
      const validationErrors = [...nameErrors, ...descErrors];
      if (validationErrors.length > 0) {
        setErrorMessage(validationErrors.join('. '));
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
        editingRole.id, 
        editRoleName.trim(), 
        editRoleDescription.trim(), 
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
      
      setSuccessMessage('Role updated successfully!');
      
    } catch (err) {
      console.error('Error updating role:', err);
      
      // Handle specific error cases
      if (err.response?.status === 403) {
        // Check if this is an RBAC permission error or a system role error
        const errorData = err.response?.data;
        if (errorData?.details?.requiredPermission || errorData?.message?.includes('permission')) {
          // RBAC/Permission error - close modal and show prominent error
          handleRbacError(err);
        } else {
          // System role error - keep in modal
          setErrorMessage('Cannot update this role: It is a system role.');
        }
      } else if (err.response?.status === 409) {
        setErrorMessage('A role with this name already exists. Please choose a different name.');
      } else if (err.response?.status === 400) {
        setErrorMessage('Invalid role data. Please check your inputs.');
      } else {
        setErrorMessage(`Error updating role: ${err.response?.data?.message || err.message}`);
      }
    }
  }, [editRoleName, editRoleDescription, editSelectedPermissions, editingRole, validateRoleName, validateDescription, loadData, handleRbacError]);

  // Handle role deletion
  const handleDeleteRole = useCallback(async (roleId, roleName, isSystemRole) => {
    // Check if it's a system role
    if (isSystemRole) {
      setErrorMessage(`Cannot delete "${roleName}" because it is a system role.`);
      return;
    }

    if (window.confirm(`Are you sure you want to delete the role "${roleName}"?`)) {
      try {
        setErrorMessage('');
        await roleService.deleteRole(roleId);
        await loadData();
        setSuccessMessage('Role deleted successfully!');
      } catch (err) {
        console.error('Error deleting role:', err);
        
        // Handle specific error cases
        if (err.response?.status === 403) {
          // Check if this is an RBAC permission error or a system role/restriction error
          const errorData = err.response?.data;
          if (errorData?.details?.requiredPermission || errorData?.message?.includes('permission')) {
            // RBAC/Permission error - show prominent error
            handleRbacError(err);
          } else {
            // System role or other restriction error
            setErrorMessage('Cannot delete this role: It is a system role or has restrictions.');
          }
        } else if (err.response?.status === 400) {
          setErrorMessage('Cannot delete this role: It may be assigned to active users.');
        } else {
          setErrorMessage(`Error deleting role: ${err.response?.data?.message || err.message}`);
        }
      }
    }
  }, [loadData, handleRbacError]);

  // Handle permission selection for role creation
  const handlePermissionToggle = useCallback((moduleId, permissionKey, isChecked) => {
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
  }, []);

  // Handle select all permissions for a module (role creation)
  const handleSelectAllModulePermissions = useCallback((moduleId, permissions, selectAll) => {
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
  }, []);

  // Handle permission selection for role editing
  const handleEditPermissionToggle = useCallback((moduleId, permissionKey, isChecked) => {
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
  }, []);

  // Handle select all permissions for a module (role editing)
  const handleEditSelectAllModulePermissions = useCallback((moduleId, permissions, selectAll) => {
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
  }, []);

  // Format permissions for display
  const formatPermissions = useCallback((rolePermissions) => {
    if (!rolePermissions || rolePermissions.length === 0) {
      return 'No permissions assigned';
    }
    
    return rolePermissions.map(p => p.permission_name || p.name || p).join(', ');
  }, []);

  // Close modal handlers with cleanup
  const handleCloseCreateModal = useCallback(() => {
    setShowCreateModal(false);
    setNewRoleName('');
    setNewRoleDescription('');
    setSelectedPermissions({});
    setErrorMessage('');
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setShowEditModal(false);
    setEditingRole(null);
    setEditRoleName('');
    setEditRoleDescription('');
    setEditSelectedPermissions({});
    setErrorMessage('');
  }, []);

  // Keyboard event handler for modals
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      if (showCreateModal) {
        handleCloseCreateModal();
      } else if (showEditModal) {
        handleCloseEditModal();
      }
    }
  }, [showCreateModal, showEditModal, handleCloseCreateModal, handleCloseEditModal]);

  // Add keyboard event listener
  useEffect(() => {
    if (showCreateModal || showEditModal) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'unset';
      };
    }
  }, [showCreateModal, showEditModal, handleKeyDown]);

  if (loading) {
    return (
      <div className="p-6 text-center" role="status" aria-live="polite">
        <div className="inline-flex items-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
          Loading role management interface...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <p className="text-red-600 mb-4">Error: {error}</p>
        </div>
        <button className="btn-primary" onClick={loadData}>Retry</button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* RBAC/Permission Error Message - Most Prominent */}
      {rbacError && (
        <div className="mb-6 bg-red-100 border-2 border-red-300 rounded-lg p-6 shadow-lg">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.94-.833-2.31 0L4.504 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-800 mb-2">Access Denied</h3>
              <p className="text-red-700 font-medium text-base mb-3">{rbacError.message}</p>
              
              {rbacError.details && (
                <div className="bg-red-50 rounded-md p-4 border border-red-200 space-y-2">
                  {rbacError.userRole && (
                    <div className="text-sm">
                      <span className="font-medium text-red-800">Current Role:</span>
                      <span className="text-red-700 ml-2">{rbacError.userRole}</span>
                    </div>
                  )}
                  
                  {rbacError.requiredPermission && (
                    <div className="text-sm">
                      <span className="font-medium text-red-800">Required Permission:</span>
                      <span className="text-red-700 ml-2">{rbacError.requiredPermission}</span>
                    </div>
                  )}
                  
                  {rbacError.suggestion && (
                    <div className="text-sm">
                      <span className="font-medium text-red-800">Suggestion:</span>
                      <span className="text-red-700 ml-2">{rbacError.suggestion}</span>
                    </div>
                  )}
                  
                  {rbacError.availableActions && rbacError.availableActions.length > 0 && (
                    <div className="text-sm">
                      <span className="font-medium text-red-800">Available Actions:</span>
                      <span className="text-red-700 ml-2">{rbacError.availableActions.join(', ')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex-shrink-0">
              <button
                className="text-red-400 hover:text-red-600 transition-colors"
                onClick={() => setRbacError(null)}
                aria-label="Dismiss error message"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-4">
          <p className="text-green-600">{successMessage}</p>
        </div>
      )}
      
      {errorMessage && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{errorMessage}</p>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Role Management</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage user roles and permissions for all system modules
          </p>
        </div>
        <div className="flex space-x-3">
          <button 
            className="btn-secondary flex items-center space-x-2" 
            onClick={() => loadData(true)}
            disabled={loading}
            aria-label="Refresh data"
            title="Refresh modules and permissions data"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
          <button 
            className="btn-primary" 
            onClick={() => setShowCreateModal(true)}
            aria-label="Create new role"
          >
            Create Role
          </button>
        </div>
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
                <tr key={role.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900 role-name-display">
                        {role.name}
                      </span>
                      {role.is_system_role && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          System
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {role.description || 'No description'}
                  </td>
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
                        setShowEditModal(true);
                      }}
                      aria-label={`Edit role ${role.name}`}
                    >
                      Edit
                    </button>
                    <button 
                      className={`text-xs px-3 py-1 ${
                        role.is_system_role 
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                          : 'btn-danger'
                      }`}
                      onClick={() => handleDeleteRole(role.id, role.name, role.is_system_role)}
                      disabled={role.is_system_role}
                      title={role.is_system_role ? 'System roles cannot be deleted' : 'Delete this role'}
                      aria-label={`Delete role ${role.name}`}
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
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-modal-title"
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div>
                <h3 id="create-modal-title" className="text-xl font-bold text-gray-900">Create New Role</h3>
                <p className="text-sm text-gray-600 mt-1">Define role permissions and access levels</p>
              </div>
              <button 
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-all"
                onClick={handleCloseCreateModal}
                aria-label="Close modal"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 overflow-hidden flex">
              {/* Left Panel - Role Details */}
              <div className="w-80 border-r border-gray-200 bg-gray-50 p-6 flex-shrink-0">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="new-role-name" className="block text-sm font-semibold text-gray-700 mb-2">
                      Role Name *
                    </label>
                    <input
                      id="new-role-name"
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      placeholder="Enter role name"
                      maxLength={50}
                      aria-required="true"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="new-role-description" className="block text-sm font-semibold text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      id="new-role-description"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      value={newRoleDescription}
                      onChange={(e) => setNewRoleDescription(e.target.value)}
                      placeholder="Enter role description"
                      rows="4"
                      maxLength={255}
                    />
                  </div>

                  {/* Permission Summary */}
                  <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3">Permission Summary</h4>
                    <div className="space-y-2">
                      {filteredSortedModules.map((module) => {
                        const modulePermissions = selectedPermissions[module.id] || [];
                        const totalPermissions = module.permissions ? module.permissions.length : 0;
                        return (
                          <div key={module.id} className="flex justify-between text-xs">
                            <span className="text-gray-600">{module.name}</span>
                            <span className={`font-medium ${modulePermissions.length > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                              {modulePermissions.length}/{totalPermissions}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Panel - Permissions */}
              <div className="flex-1 flex flex-col">
                <div className="p-6 border-b border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900">Module Permissions</h4>
                  <p className="text-sm text-gray-600 mt-1">Select the permissions for each module</p>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-6">
                    {filteredSortedModules.map((module) => {
                      const modulePermissions = selectedPermissions[module.id] || [];
                      const allModulePermissionKeys = module.permissions ? module.permissions.map(p => p.key) : [];
                      const allSelected = allModulePermissionKeys.length > 0 && allModulePermissionKeys.every(key => modulePermissions.includes(key));
                      
                      // Sort permissions in standard order: View/Get → Create → Update → Delete
                      const sortedPermissions = module.permissions ? [...module.permissions].sort((a, b) => {
                        const getOrder = (permission) => {
                          const name = permission.name.toLowerCase();
                          const key = permission.key.toLowerCase();
                          
                          if (name.includes('view') || name.includes('get') || name.includes('read') || key.includes('view') || key.includes('get')) return 1;
                          if (name.includes('add') || name.includes('create') || key.includes('add') || key.includes('create')) return 2;
                          if (name.includes('update') || name.includes('edit') || name.includes('modify') || key.includes('update') || key.includes('edit')) return 3;
                          if (name.includes('delete') || name.includes('remove') || key.includes('delete') || key.includes('remove')) return 4;
                          return 5; // Other permissions at the end
                        };
                        
                        return getOrder(a) - getOrder(b);
                      }) : [];
                      
                      return (
                        <div key={module.id} className="bg-white rounded-lg border border-gray-200 shadow-sm">
                          {/* Module Header */}
                          <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50 rounded-t-lg">
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${modulePermissions.length > 0 ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                              <h5 className="font-semibold text-gray-900">{module.name}</h5>
                              <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                                {modulePermissions.length}/{allModulePermissionKeys.length}
                              </span>
                            </div>
                            <button
                              type="button"
                              className={`text-xs px-4 py-2 rounded-full border transition-all font-medium ${
                                allSelected 
                                  ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100 hover:border-red-300'
                                  : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 hover:border-blue-300'
                              }`}
                              onClick={() => handleSelectAllModulePermissions(module.id, module.permissions, !allSelected)}
                              aria-label={`${allSelected ? 'Deselect' : 'Select'} all permissions for ${module.name}`}
                            >
                              {allSelected ? 'Deselect All' : 'Select All'}
                            </button>
                          </div>
                          
                          {/* Permissions Grid */}
                          <div className="p-4">
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                              {sortedPermissions.map((permission) => (
                                <label 
                                  key={`${module.id}-${permission.key}`} 
                                  className="flex items-start space-x-3 p-3 hover:bg-blue-50 rounded-lg border border-transparent hover:border-blue-200 transition-all cursor-pointer group"
                                >
                                  <input
                                    type="checkbox"
                                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors"
                                    checked={selectedPermissions[module.id]?.includes(permission.key) || false}
                                    onChange={(e) => handlePermissionToggle(module.id, permission.key, e.target.checked)}
                                    aria-describedby={permission.description ? `${module.id}-${permission.key}-desc` : undefined}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <span className="text-sm font-medium text-gray-900 group-hover:text-blue-900">
                                      {permission.name}
                                    </span>
                                    {permission.description && (
                                      <p 
                                        id={`${module.id}-${permission.key}-desc`}
                                        className="text-xs text-gray-500 mt-1"
                                      >
                                        {permission.description}
                                      </p>
                                    )}
                                  </div>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="flex items-center justify-end p-6 border-t border-gray-200 bg-gray-50 space-x-3">
              <button 
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium"
                onClick={handleCloseCreateModal}
              >
                Cancel
              </button>
              <button 
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm disabled:opacity-50"
                onClick={handleCreateRole}
                disabled={!newRoleName.trim()}
              >
                Create Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {showEditModal && editingRole && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-modal-title"
        >
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-2">
                <h3 id="edit-modal-title" className="text-lg font-semibold text-gray-900">
                  Edit Role: {editingRole.name}
                </h3>
                {editingRole.is_system_role && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    System Role
                  </span>
                )}
              </div>
              <button 
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                onClick={handleCloseEditModal}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              {editingRole.is_system_role && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4" role="alert">
                  <p className="text-blue-800 text-sm">
                    <strong>System Role:</strong> This role cannot be modified as it is required for system functionality.
                    You can view the role details but cannot make changes.
                  </p>
                </div>
              )}
              
              <div className="mb-4">
                <label htmlFor="edit-role-name" className="block text-sm font-medium text-gray-700 mb-2">
                  Role Name *
                </label>
                <input
                  id="edit-role-name"
                  type="text"
                  className={`input-field w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${editingRole.is_system_role ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  value={editRoleName}
                  onChange={(e) => setEditRoleName(e.target.value)}
                  placeholder="Enter role name"
                  disabled={editingRole.is_system_role}
                  readOnly={editingRole.is_system_role}
                  maxLength={50}
                  aria-required="true"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="edit-role-description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="edit-role-description"
                  className={`input-field w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${editingRole.is_system_role ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  value={editRoleDescription}
                  onChange={(e) => setEditRoleDescription(e.target.value)}
                  placeholder="Enter role description"
                  rows="3"
                  disabled={editingRole.is_system_role}
                  readOnly={editingRole.is_system_role}
                  maxLength={255}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                <div className="h-96 overflow-y-auto border border-gray-200 rounded-md p-4 bg-gray-50">
                  {filteredSortedModules.map((module) => {
                    const modulePermissions = editSelectedPermissions[module.id] || [];
                    const allModulePermissionKeys = module.permissions ? module.permissions.map(p => p.key) : [];
                    const allSelected = allModulePermissionKeys.length > 0 && allModulePermissionKeys.every(key => modulePermissions.includes(key));
                    
                    // Sort permissions in standard order: View/Get → Create → Update → Delete
                    const sortedPermissions = module.permissions ? [...module.permissions].sort((a, b) => {
                      const getOrder = (permission) => {
                        const name = permission.name.toLowerCase();
                        const key = permission.key.toLowerCase();
                        
                        if (name.includes('view') || name.includes('get') || name.includes('read') || key.includes('view') || key.includes('get')) return 1;
                        if (name.includes('add') || name.includes('create') || key.includes('add') || key.includes('create')) return 2;
                        if (name.includes('update') || name.includes('edit') || name.includes('modify') || key.includes('update') || key.includes('edit')) return 3;
                        if (name.includes('delete') || name.includes('remove') || key.includes('delete') || key.includes('remove')) return 4;
                        return 5; // Other permissions at the end
                      };
                      
                      return getOrder(a) - getOrder(b);
                    }) : [];
                    
                    return (
                      <div key={module.id} className={`mb-6 last:mb-0 bg-white rounded-lg border border-gray-200 p-4 ${editingRole.is_system_role ? 'opacity-75' : ''}`}>
                        <div className={`flex items-center justify-between mb-3 pb-2 border-b border-gray-200`}>
                          <h4 className="font-semibold text-gray-900 text-base">{module.name}</h4>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">
                              {modulePermissions.length} of {allModulePermissionKeys.length} selected
                            </span>
                            {!editingRole.is_system_role && (
                              <button
                                type="button"
                                className={`text-xs px-3 py-1 rounded border transition-colors font-medium ${
                                  allSelected 
                                    ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                                    : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
                                }`}
                                onClick={() => handleEditSelectAllModulePermissions(module.id, module.permissions, !allSelected)}
                                aria-label={`${allSelected ? 'Deselect' : 'Select'} all permissions for ${module.name}`}
                              >
                                {allSelected ? 'Deselect All' : 'Select All'}
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {sortedPermissions.map((permission) => (
                            <label 
                              key={`edit-${module.id}-${permission.key}`} 
                              className={`flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-md border border-transparent hover:border-gray-200 transition-colors ${editingRole.is_system_role ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              <input
                                type="checkbox"
                                className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                checked={editSelectedPermissions[module.id]?.includes(permission.key) || false}
                                onChange={(e) => handleEditPermissionToggle(module.id, permission.key, e.target.checked)}
                                disabled={editingRole.is_system_role}
                                aria-describedby={permission.description ? `edit-${module.id}-${permission.key}-desc` : undefined}
                              />
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-medium text-gray-900">{permission.name}</span>
                                {permission.description && (
                                  <p 
                                    id={`edit-${module.id}-${permission.key}-desc`}
                                    className="text-xs text-gray-500 mt-1"
                                  >
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
                className="btn-secondary px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors font-medium"
                onClick={handleCloseEditModal}
              >
                Cancel
              </button>
              {!editingRole.is_system_role && (
                <button 
                  className="btn-primary px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm disabled:opacity-50"
                  onClick={handleUpdateRole}
                  disabled={!editRoleName.trim()}
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
