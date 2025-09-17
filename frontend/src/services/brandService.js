import api from '../utils/api';
import { toast } from 'react-hot-toast';

const brandService = {
  // Get all brands
  async getAllBrands(filters = {}) {
    try {
      console.log('🏷️ Fetching all brands with filters:', filters);
      
      // Build URL params more safely
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' && value !== 'all') {
          params.append(key, String(value));
        }
      });
      
      const queryString = params.toString();
      const url = queryString ? `/brands?${queryString}` : '/brands';
      
      console.log('🏷️ Making request to:', url);
      const response = await api.get(url);
      
      console.log('🏷️ Raw API response:', response.data);
      
      if (response.data && response.data.success) {
        console.log('✅ Brands fetched successfully:', response.data.data?.length, 'brands');
        return {
          success: true,
          data: response.data.data || [],
          message: response.data.message
        };
      } else {
        throw new Error(response.data?.message || 'Failed to fetch brands');
      }
    } catch (error) {
      console.error('❌ Error fetching brands:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      
      // Handle specific error cases
      if (error.response?.status === 401) {
        const message = 'Authentication failed. Please login again.';
        toast.error(message);
        // Optionally redirect to login
        // window.location.href = '/login';
        return {
          success: false,
          data: [],
          message: message,
          needsAuth: true
        };
      }
      
      if (error.response?.status === 403) {
        const message = 'You don\'t have permission to view brands.';
        toast.error(message);
        return {
          success: false,
          data: [],
          message: message,
          needsPermission: true
        };
      }
      
      const message = error.response?.data?.message || error.message || 'Failed to fetch brands';
      toast.error(message);
      
      return {
        success: false,
        data: [],
        message: message
      };
    }
  },

  // Get brand by ID
  async getBrandById(id) {
    try {
      console.log('🏷️ Fetching brand by ID:', id);
      
      if (!id) {
        throw new Error('Brand ID is required');
      }
      
      const response = await api.get(`/brands/${id}`);
      console.log('🏷️ Brand by ID response:', response.data);
      
      if (response.data && response.data.success) {
        console.log('✅ Brand fetched successfully:', response.data.data);
        return {
          success: true,
          data: response.data.data,
          message: response.data.message
        };
      } else {
        throw new Error(response.data?.message || 'Failed to fetch brand');
      }
    } catch (error) {
      console.error('❌ Error fetching brand:', error);
      console.error('❌ Error response:', error.response?.data);
      
      const message = error.response?.data?.message || error.message || 'Failed to fetch brand';
      toast.error(message);
      
      return {
        success: false,
        data: null,
        message: message
      };
    }
  },

  // Create new brand
  async createBrand(brandData) {
    try {
      console.log('🏷️ Creating brand:', brandData);
      
      if (!brandData || typeof brandData !== 'object') {
        throw new Error('Invalid brand data provided');
      }
      
      const response = await api.post('/brands', brandData);
      console.log('🏷️ Create brand response:', response.data);
      
      if (response.data && response.data.success) {
        console.log('✅ Brand created successfully:', response.data.data);
        toast.success(response.data.message || 'Brand created successfully');
        return {
          success: true,
          data: response.data.data,
          message: response.data.message
        };
      } else {
        throw new Error(response.data?.message || 'Failed to create brand');
      }
    } catch (error) {
      console.error('❌ Error creating brand:', error);
      console.error('❌ Error response:', error.response?.data);
      
      // Handle validation errors specifically
      if (error.response?.status === 422 || error.response?.status === 400) {
        const validationErrors = error.response?.data?.errors;
        if (validationErrors && typeof validationErrors === 'object') {
          const errorMessages = Object.values(validationErrors).flat();
          const message = errorMessages.join(', ');
          toast.error(message);
          return {
            success: false,
            data: null,
            message: message,
            validationErrors: validationErrors
          };
        }
      }
      
      const message = error.response?.data?.message || error.message || 'Failed to create brand';
      toast.error(message);
      
      return {
        success: false,
        data: null,
        message: message
      };
    }
  },

  // Update brand
  async updateBrand(id, brandData) {
    try {
      console.log('🏷️ Updating brand:', id, brandData);
      
      if (!id) {
        throw new Error('Brand ID is required');
      }
      
      if (!brandData || typeof brandData !== 'object') {
        throw new Error('Invalid brand data provided');
      }
      
      const response = await api.put(`/brands/${id}`, brandData);
      console.log('🏷️ Update brand response:', response.data);
      
      if (response.data && response.data.success) {
        console.log('✅ Brand updated successfully:', response.data.data);
        toast.success(response.data.message || 'Brand updated successfully');
        return {
          success: true,
          data: response.data.data,
          message: response.data.message
        };
      } else {
        throw new Error(response.data?.message || 'Failed to update brand');
      }
    } catch (error) {
      console.error('❌ Error updating brand:', error);
      console.error('❌ Error response:', error.response?.data);
      
      // Handle validation errors specifically
      if (error.response?.status === 422 || error.response?.status === 400) {
        const validationErrors = error.response?.data?.errors;
        if (validationErrors && typeof validationErrors === 'object') {
          const errorMessages = Object.values(validationErrors).flat();
          const message = errorMessages.join(', ');
          toast.error(message);
          return {
            success: false,
            data: null,
            message: message,
            validationErrors: validationErrors
          };
        }
      }
      
      const message = error.response?.data?.message || error.message || 'Failed to update brand';
      toast.error(message);
      
      return {
        success: false,
        data: null,
        message: message
      };
    }
  },

  // Delete brand
  async deleteBrand(id) {
    try {
      console.log('🏷️ Deleting brand:', id);
      
      if (!id) {
        throw new Error('Brand ID is required');
      }
      
      const response = await api.delete(`/brands/${id}`);
      console.log('🏷️ Delete brand response:', response.data);
      
      if (response.data && response.data.success) {
        console.log('✅ Brand deleted successfully');
        toast.success(response.data.message || 'Brand deleted successfully');
        return {
          success: true,
          message: response.data.message
        };
      } else {
        throw new Error(response.data?.message || 'Failed to delete brand');
      }
    } catch (error) {
      console.error('❌ Error deleting brand:', error);
      console.error('❌ Error response:', error.response?.data);
      
      const message = error.response?.data?.message || error.message || 'Failed to delete brand';
      toast.error(message);
      
      return {
        success: false,
        message: message
      };
    }
  },

  // Toggle brand status
  async toggleBrandStatus(id, isActive) {
    try {
      console.log('🏷️ Toggling brand status:', id, 'to', isActive);
      
      if (!id) {
        throw new Error('Brand ID is required');
      }
      
      if (typeof isActive !== 'boolean') {
        throw new Error('Status must be a boolean value');
      }
      
      const response = await api.patch(`/brands/${id}/status`, { is_active: isActive });
      console.log('🏷️ Toggle status response:', response.data);
      
      if (response.data && response.data.success) {
        console.log('✅ Brand status updated successfully:', response.data.data);
        toast.success(response.data.message || 'Brand status updated successfully');
        return {
          success: true,
          data: response.data.data,
          message: response.data.message
        };
      } else {
        throw new Error(response.data?.message || 'Failed to update brand status');
      }
    } catch (error) {
      console.error('❌ Error updating brand status:', error);
      console.error('❌ Error response:', error.response?.data);
      
      const message = error.response?.data?.message || error.message || 'Failed to update brand status';
      toast.error(message);
      
      return {
        success: false,
        data: null,
        message: message
      };
    }
  },

  // Get brands for dropdown (active only)
  async getBrandsForDropdown() {
    try {
      console.log('🏷️ Fetching brands for dropdown');
      
      const response = await api.get('/brands/dropdown');
      console.log('🏷️ Dropdown brands response:', response.data);
      
      if (response.data && response.data.success) {
        console.log('✅ Dropdown brands fetched successfully:', response.data.data?.length, 'brands');
        return {
          success: true,
          data: response.data.data || [],
          message: response.data.message
        };
      } else {
        throw new Error(response.data?.message || 'Failed to fetch brands for dropdown');
      }
    } catch (error) {
      console.error('❌ Error fetching dropdown brands:', error);
      console.error('❌ Error response:', error.response?.data);
      
      // Don't show toast error for dropdown failures - they're usually non-critical
      const message = error.response?.data?.message || error.message || 'Failed to fetch brands for dropdown';
      
      return {
        success: false,
        data: [],
        message: message
      };
    }
  }
};

export default brandService;
