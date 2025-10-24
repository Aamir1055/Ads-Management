import React, { useState, useEffect } from 'react';
import { X, FileText, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { handleAccessDenied, isAccessDeniedError } from '../utils/accessDeniedHandler';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const FacebookPageForm = ({ page, onClose, onSave, setMessage }) => {
  const [formData, setFormData] = useState({
    facebook_account_id: '',
    page_name: '',
    page_description: '',
    status: 'enabled'
  });
  const [facebookAccounts, setFacebookAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [validationErrors, setValidationErrors] = useState({});

  // Get auth token
  const getAuthToken = () => {
    return localStorage.getItem('authToken') || localStorage.getItem('access_token');
  };

  // Axios instance with auth headers
  const apiRequest = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`,
      'Content-Type': 'application/json'
    }
  });

  // Fetch Facebook accounts for dropdown
  const fetchFacebookAccounts = async () => {
    try {
      const response = await apiRequest.get('/facebook-accounts?limit=1000');
      if (response.data.success) {
        const accounts = response.data.data || [];
        console.log('🗺 Fetched Facebook accounts:', accounts);
        accounts.forEach(account => {
          console.log('🗺 Account ID:', account.id, 'type:', typeof account.id, 'email:', account.email);
        });
        setFacebookAccounts(accounts);
      }
    } catch (error) {
      console.error('Error fetching Facebook accounts:', error);
      toast.error('Failed to load Facebook accounts');
    }
  };

  // Initialize form data when component mounts or page changes
  useEffect(() => {
    fetchFacebookAccounts();
    
    if (page) {
      console.log('🔧 Editing page data:', page);
      console.log('🔧 facebook_account_id value:', page.facebook_account_id, 'type:', typeof page.facebook_account_id);
      setFormData({
        facebook_account_id: page.facebook_account_id ? String(page.facebook_account_id) : '',
        page_name: page.page_name || '',
        page_description: page.page_description || '',
        status: page.status || 'enabled'
      });
    } else {
      setFormData({
        facebook_account_id: '',
        page_name: '',
        page_description: '',
        status: 'enabled'
      });
    }
    setErrors({});
    setValidationErrors({});
  }, [page]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field-specific errors when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!formData.facebook_account_id) {
      newErrors.facebook_account_id = 'Facebook account is required';
    }

    if (!formData.page_name.trim()) {
      newErrors.page_name = 'Page name is required';
    } else if (formData.page_name.trim().length < 2) {
      newErrors.page_name = 'Page name must be at least 2 characters';
    } else if (formData.page_name.trim().length > 255) {
      newErrors.page_name = 'Page name must be less than 255 characters';
    }

    if (formData.page_description && formData.page_description.trim().length > 1000) {
      newErrors.page_description = 'Description must be less than 1000 characters';
    }

    if (!formData.status) {
      newErrors.status = 'Status is required';
    }

    setValidationErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🔄 Form submit triggered');
    console.log('📝 Form data:', formData);

    if (!validateForm()) {
      console.log('❌ Form validation failed:', validationErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const token = getAuthToken();
      console.log('🔑 Auth token present:', !!token);
      
      const submitData = {
        facebook_account_id: parseInt(formData.facebook_account_id),
        page_name: formData.page_name.trim(),
        page_description: formData.page_description.trim() || null,
        status: formData.status
      };

      console.log('📤 Submitting data:', submitData);

      let response;
      if (page) {
        // Update existing page
        console.log('✏️ Updating page with ID:', page.id);
        response = await apiRequest.put(`/facebook-pages/${page.id}`, submitData);
      } else {
        // Create new page
        console.log('➕ Creating new page');
        response = await apiRequest.post('/facebook-pages', submitData);
      }

      console.log('✅ API Response:', response.data);

      if (response.data.success) {
        toast.success(page ? 'Page updated successfully!' : 'Page created successfully!');
        onSave();
      } else {
        console.log('❌ API returned failure:', response.data);
        toast.error(response.data.message || 'Failed to save page');
      }
    } catch (error) {
      console.error('❌ Error saving page:', error);
      
      // Handle access denied errors first
      if (isAccessDeniedError(error)) {
        handleAccessDenied({
          closeForm: () => {
            onClose();
          },
          setMessage,
          error,
          context: 'saving Facebook page'
        });
      } else if (error.response) {
        console.log('📋 Error response data:', error.response.data);
        console.log('📋 Error status:', error.response.status);
        
        if (error.response.status === 400 && error.response.data.errors) {
          setErrors(error.response.data.errors);
          toast.error('Please fix the validation errors');
        } else if (error.response.status === 409) {
          toast.error('A page with this name already exists for the selected Facebook account');
          setErrors({ page_name: 'Page name already exists for this account' });
        } else {
          toast.error(error.response.data.message || 'Failed to save page');
        }
      } else if (error.request) {
        console.log('📡 No response received:', error.request);
        toast.error('Network error. Please check your connection.');
      } else {
        console.log('⚙️ Request setup error:', error.message);
        toast.error('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  {page ? 'Edit Facebook Page' : 'Add Facebook Page'}
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* Facebook Account */}
            <div>
              <label htmlFor="facebook_account_id" className="block text-sm font-medium text-gray-700">
                Facebook Account *
              </label>
              <select
                id="facebook_account_id"
                name="facebook_account_id"
                value={formData.facebook_account_id}
                onChange={handleInputChange}
                disabled={loading}
                className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
                  (errors.facebook_account_id || validationErrors.facebook_account_id) ? 'border-red-500' : ''
                }`}
                required
              >
                <option value="">Select Facebook Account</option>
                {facebookAccounts.map((account) => {
                  const isSelected = String(account.id) === formData.facebook_account_id;
                  console.log(`🔍 Option ${account.id} (${typeof account.id}) vs formData ${formData.facebook_account_id} (${typeof formData.facebook_account_id}) = ${isSelected}`);
                  const statusLabel = account.status === 'enabled' ? '' : ` (${account.status.charAt(0).toUpperCase() + account.status.slice(1)})`;
                  return (
                    <option key={account.id} value={account.id} disabled={account.status !== 'enabled'}>
                      {account.email}{statusLabel}
                    </option>
                  );
                })}
              </select>
              {(errors.facebook_account_id || validationErrors.facebook_account_id) && (
                <div className="mt-1 flex items-center text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.facebook_account_id || validationErrors.facebook_account_id}
                </div>
              )}
            </div>

            {/* Page Name */}
            <div>
              <label htmlFor="page_name" className="block text-sm font-medium text-gray-700">
                Page Name *
              </label>
              <input
                type="text"
                id="page_name"
                name="page_name"
                value={formData.page_name}
                onChange={handleInputChange}
                disabled={loading}
                placeholder="Enter page name"
                className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
                  (errors.page_name || validationErrors.page_name) ? 'border-red-500' : ''
                }`}
                required
                maxLength={255}
              />
              {(errors.page_name || validationErrors.page_name) && (
                <div className="mt-1 flex items-center text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.page_name || validationErrors.page_name}
                </div>
              )}
            </div>

            {/* Page Description */}
            <div>
              <label htmlFor="page_description" className="block text-sm font-medium text-gray-700">
                Page Description
              </label>
              <textarea
                id="page_description"
                name="page_description"
                value={formData.page_description}
                onChange={handleInputChange}
                disabled={loading}
                placeholder="Enter page description (optional)"
                rows={3}
                className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
                  (errors.page_description || validationErrors.page_description) ? 'border-red-500' : ''
                }`}
                maxLength={1000}
              />
              <div className="mt-1 text-xs text-gray-500">
                {formData.page_description.length}/1000 characters
              </div>
              {(errors.page_description || validationErrors.page_description) && (
                <div className="mt-1 flex items-center text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.page_description || validationErrors.page_description}
                </div>
              )}
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status *
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                disabled={loading}
                className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 ${
                  (errors.status || validationErrors.status) ? 'border-red-500' : ''
                }`}
                required
              >
                <option value="enabled">Enabled</option>
                <option value="disabled">Disabled</option>
                <option value="suspended_temporarily">Suspended Temporarily</option>
              </select>
              {(errors.status || validationErrors.status) && (
                <div className="mt-1 flex items-center text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.status || validationErrors.status}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {page ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {page ? 'Update Page' : 'Create Page'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FacebookPageForm;