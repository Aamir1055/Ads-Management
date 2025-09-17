import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  Snackbar,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Home as HomeIcon,
  Storefront as StorefrontIcon
} from '@mui/icons-material';

// Import components
import BrandTable from '../components/brands/BrandTable';
import BrandForm from '../components/brands/BrandForm';
import BrandFilters from '../components/brands/BrandFilters';

// Import services and hooks
import brandService from '../services/brandService';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';

const Brands = () => {
  // Auth and permissions
  const { user, isAuthenticated } = useAuth();
  const { permissions, loading: permissionsLoading } = usePermissions();

  // Data state
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI state
  const [formOpen, setFormOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [brandToDelete, setBrandToDelete] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
    search: '',
    status: 'all'
  });

  // Success/Error notifications
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  // Check permissions with multiple fallbacks - FIXED LOGIC
  const getPermissions = useCallback(() => {
    // Wait for authentication and permissions to load
    if (!user || permissionsLoading) {
      return {
        canCreate: false,
        canView: false,
        canEdit: false,
        canDelete: false
      };
    }

    // Check if user is authenticated first
    const isAuth = typeof isAuthenticated === 'function' ? isAuthenticated() : !!user;
    
    if (!isAuth) {
      return {
        canCreate: false,
        canView: false,
        canEdit: false,
        canDelete: false
      };
    }

    // Check if user is super admin
    const isSuperAdmin = user?.role_name === 'super_admin' || 
                        user?.role?.name === 'super_admin' ||
                        user?.role === 'super_admin';

    // If super admin, grant all permissions
    if (isSuperAdmin) {
      return {
        canCreate: true,
        canView: true,
        canEdit: true,
        canDelete: true
      };
    }

    // Check permissions through multiple methods
    const hasPermissionInArray = (permission) => {
      return Array.isArray(user?.permissions) && user.permissions.includes(permission);
    };

    const hasPermissionInObject = (permission) => {
      return permissions && permissions[permission] === true;
    };

    // Check each permission
    const canCreate = hasPermissionInObject('brands_create') || 
                     hasPermissionInArray('brands_create');
    
    const canView = hasPermissionInObject('brands_read') || 
                   hasPermissionInObject('brands_create') || 
                   hasPermissionInObject('brands_update') ||
                   hasPermissionInArray('brands_read') || 
                   hasPermissionInArray('brands_create') || 
                   hasPermissionInArray('brands_update');
    
    const canEdit = hasPermissionInObject('brands_update') || 
                   hasPermissionInObject('brands_create') ||
                   hasPermissionInArray('brands_update') || 
                   hasPermissionInArray('brands_create');
    
    const canDelete = hasPermissionInObject('brands_delete') || 
                     hasPermissionInArray('brands_delete');

    return { canCreate, canView, canEdit, canDelete };
  }, [user, permissions, permissionsLoading, isAuthenticated]);

  // Get current permissions
  const { canCreate, canView, canEdit, canDelete } = getPermissions();

  // Load brands data
  const loadBrands = useCallback(async (currentFilters = filters) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🏷️ Loading brands with filters:', currentFilters);
      
      // Prepare API filters
      const apiFilters = {};
      
      if (currentFilters.search?.trim()) {
        apiFilters.search = currentFilters.search.trim();
      }
      
      if (currentFilters.status && currentFilters.status !== 'all') {
        apiFilters.is_active = currentFilters.status === 'active';
      }

      const response = await brandService.getAllBrands(apiFilters);
      
      if (response.success) {
        setBrands(response.data || []);
        console.log('✅ Brands loaded successfully:', response.data?.length, 'brands');
      } else {
        throw new Error(response.message || 'Failed to load brands');
      }
    } catch (err) {
      console.error('❌ Error loading brands:', err);
      setError(err.message || 'Failed to load brands');
      setBrands([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Initial load - FIXED: Don't load until permissions are ready
  useEffect(() => {
    console.log('🏷️ Brand Management - Component mounted');
    console.log('👤 Current user:', user);
    console.log('🔑 User permissions object:', permissions);
    console.log('🔑 Permissions loading:', permissionsLoading);
    console.log('🔑 Is authenticated:', typeof isAuthenticated === 'function' ? isAuthenticated() : !!user);
    console.log('🔑 Permission check results:', { canCreate, canView, canEdit, canDelete });
    
    // Debug: Check if user is super admin
    const isSuperAdmin = user?.role_name === 'super_admin' || 
                        user?.role?.name === 'super_admin' ||
                        user?.role === 'super_admin';
    console.log('🔑 Is Super Admin:', isSuperAdmin);
    
    // Only load brands if user is authenticated and permissions are loaded
    if (user && !permissionsLoading) {
      loadBrands();
    }
  }, [user, permissionsLoading, loadBrands, canCreate, canView, canEdit, canDelete]);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters) => {
    console.log('🔍 Filters changed:', newFilters);
    setFilters(newFilters);
    loadBrands(newFilters);
  }, [loadBrands]);

  // Handle filter reset
  const handleFiltersReset = useCallback((resetFilters) => {
    console.log('🔄 Filters reset:', resetFilters);
    setFilters(resetFilters);
    loadBrands(resetFilters);
  }, [loadBrands]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    console.log('🔄 Refreshing brands...');
    loadBrands();
  }, [loadBrands]);

  // Handle create new brand
  const handleCreateNew = () => {
    console.log('➕ Creating new brand');
    setSelectedBrand(null);
    setFormOpen(true);
  };

  // Handle edit brand
  const handleEdit = (brand) => {
    console.log('✏️ Editing brand:', brand);
    setSelectedBrand(brand);
    setFormOpen(true);
  };

  // Handle view brand (same as edit for now)
  const handleView = (brand) => {
    console.log('👁️ Viewing brand:', brand);
    // For now, viewing is the same as editing
    // In the future, this could open a read-only dialog
    handleEdit(brand);
  };

  // Handle form save
  const handleFormSave = async (brandData) => {
    try {
      setFormLoading(true);
      
      let response;
      if (selectedBrand?.id) {
        // Update existing brand
        console.log('📝 Updating brand:', selectedBrand.id, brandData);
        response = await brandService.updateBrand(selectedBrand.id, brandData);
      } else {
        // Create new brand
        console.log('➕ Creating new brand:', brandData);
        response = await brandService.createBrand(brandData);
      }

      if (response.success) {
        setFormOpen(false);
        setSelectedBrand(null);
        
        // Show success message
        setNotification({
          open: true,
          message: response.message || `Brand ${selectedBrand ? 'updated' : 'created'} successfully`,
          severity: 'success'
        });
        
        // Reload brands
        loadBrands();
      } else {
        // Error is already shown via toast in service
        console.error('❌ Form save failed:', response.message);
      }
    } catch (error) {
      console.error('❌ Form save error:', error);
    } finally {
      setFormLoading(false);
    }
  };

  // Handle delete confirmation
  const handleDeleteClick = (brand) => {
    console.log('🗑️ Delete clicked for brand:', brand);
    setBrandToDelete(brand);
    setDeleteDialogOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!brandToDelete) return;

    try {
      console.log('🗑️ Deleting brand:', brandToDelete.id);
      const response = await brandService.deleteBrand(brandToDelete.id);
      
      if (response.success) {
        setNotification({
          open: true,
          message: response.message || 'Brand deleted successfully',
          severity: 'success'
        });
        
        // Reload brands
        loadBrands();
      }
    } catch (error) {
      console.error('❌ Delete error:', error);
    } finally {
      setDeleteDialogOpen(false);
      setBrandToDelete(null);
    }
  };

  // Handle toggle status
  const handleToggleStatus = async (brandId, newStatus) => {
    try {
      console.log('🔄 Toggling brand status:', brandId, 'to', newStatus);
      const response = await brandService.toggleBrandStatus(brandId, newStatus);
      
      if (response.success) {
        setNotification({
          open: true,
          message: response.message || 'Brand status updated successfully',
          severity: 'success'
        });
        
        // Reload brands
        loadBrands();
      }
    } catch (error) {
      console.error('❌ Toggle status error:', error);
    }
  };

  // Close notification
  const handleNotificationClose = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  // Show loading state while permissions are loading
  if (permissionsLoading || !user) {
    return (
      <Box sx={{ p: 3 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Loading permissions...</Typography>
        </Box>
      </Box>
    );
  }

  console.log('🔑 Final Brand permissions:', { canCreate, canView, canEdit, canDelete });

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          <Link color="inherit" href="/dashboard" sx={{ display: 'flex', alignItems: 'center' }}>
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Dashboard
          </Link>
          <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
            <StorefrontIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Brand Management
          </Typography>
        </Breadcrumbs>

        {/* Page Title and Actions */}
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Brand Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your brand portfolio and brand information
            </Typography>
          </Box>
          
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={loading}
            >
              Refresh
            </Button>
            
            {canCreate && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateNew}
                disabled={loading}
              >
                Add Brand
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      {/* Permission Check */}
      {!canView && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          You don't have permission to view brands. Contact your administrator for access.
        </Alert>
      )}

      {canView && (
        <>
          {/* Filters */}
          <BrandFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onReset={handleFiltersReset}
            loading={loading}
          />

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Main Content */}
          <Paper elevation={1}>
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" p={4}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Loading brands...</Typography>
              </Box>
            ) : (
              <BrandTable
                brands={brands}
                loading={loading}
                onEdit={canEdit ? handleEdit : undefined}
                onDelete={canDelete ? handleDeleteClick : undefined}
                onToggleStatus={canEdit ? handleToggleStatus : undefined}
                onView={handleView}
                permissions={permissions}
              />
            )}
          </Paper>

          {/* Brands Count */}
          {!loading && brands.length > 0 && (
            <Box mt={2}>
              <Typography variant="body2" color="text.secondary">
                Showing {brands.length} brand{brands.length !== 1 ? 's' : ''}
              </Typography>
            </Box>
          )}
        </>
      )}

      {/* Brand Form Dialog */}
      <BrandForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setSelectedBrand(null);
        }}
        onSave={handleFormSave}
        brand={selectedBrand}
        loading={formLoading}
        permissions={permissions}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">
          <Box display="flex" alignItems="center" gap={1}>
            <DeleteIcon color="error" />
            Confirm Delete
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the brand "{brandToDelete?.name}"?
          </DialogContentText>
          <DialogContentText color="error" sx={{ mt: 2 }}>
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            startIcon={<DeleteIcon />}
          >
            Delete Brand
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Notification */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleNotificationClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleNotificationClose}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Brands;
