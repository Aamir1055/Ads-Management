import React, { useState, useEffect } from 'react';
import { X, Building2, Save, AlertCircle, Phone } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { handleAccessDenied, isAccessDeniedError } from '../utils/accessDeniedHandler';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const BMForm = ({ bm, onClose, onSave, setMessage }) => {
  const [formData, setFormData] = useState({
    bm_name: '',
    email: '',
    phone_number: '',
    status: 'enabled'
  });
  const [facebookAccounts, setFacebookAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [validationErrors, setValidationErrors] = useState({});

  // Fetch Facebook accounts
  useEffect(() => {
    const fetchFacebookAccounts = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/facebook-accounts`);
        if (Array.isArray(response.data)) {
          setFacebookAccounts(response.data);
        } else if (response.data.data && Array.isArray(response.data.data)) {
          setFacebookAccounts(response.data.data);
        } else {
          console.error('Invalid Facebook accounts response format:', response.data);
          toast.error('Failed to load Facebook accounts: Invalid data format');
          setFacebookAccounts([]);
        }
      } catch (error) {
        if (isAccessDeniedError(error)) {
          handleAccessDenied();
        } else {
          console.error('Error fetching Facebook accounts:', error);
          toast.error('Failed to load Facebook accounts');
        }
        setFacebookAccounts([]);
      }
    };

    fetchFacebookAccounts();
  }, []);

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

  // Initialize form data when component mounts or bm changes
  useEffect(() => {
    if (bm) {
      setFormData({
        bm_name: bm.bm_name || '',
        email: bm.email || '',
        phone_number: bm.phone_number || '',
        status: bm.status || 'enabled'
      });
    } else {
      setFormData({
        bm_name: '',
        email: '',
        phone_number: '',
        status: 'enabled'
      });
    }
    setErrors({});
    setValidationErrors({});
  }, [bm]);

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

    // BM name validation
    if (!formData.bm_name.trim()) {
      newErrors.bm_name = 'Business Manager name is required';
    } else if (formData.bm_name.trim().length < 2) {
      newErrors.bm_name = 'Business Manager name must be at least 2 characters';
    } else if (formData.bm_name.trim().length > 255) {
      newErrors.bm_name = 'Business Manager name must be less than 255 characters';
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Please select an email address';
    }

    // Phone validation (optional)
    if (formData.phone_number && formData.phone_number.trim().length > 50) {
      newErrors.phone_number = 'Phone number must be less than 50 characters';
    }

    // Status validation
    if (!formData.status) {
      newErrors.status = 'Status is required';
    }

    setValidationErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🔄 BM Form submit triggered');
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
        bm_name: formData.bm_name.trim(),
        email: formData.email,
        phone_number: formData.phone_number.trim() || null,
        status: formData.status
      };

      console.log('📤 Submitting BM data:', submitData);

      let response;
      if (bm) {
        // Update existing BM
        console.log('✏️ Updating BM with ID:', bm.id);
        response = await apiRequest.put(`/bm/${bm.id}`, submitData);
      } else {
        // Create new BM
        console.log('➕ Creating new BM');
        response = await apiRequest.post('/bm', submitData);
      }

      console.log('✅ API Response:', response.data);

      if (response.data.success) {
        toast.success(bm ? 'Business Manager updated successfully!' : 'Business Manager created successfully!');
        onSave();
      } else {
        console.log('❌ API returned failure:', response.data);
        toast.error(response.data.message || 'Failed to save Business Manager');
      }
    } catch (error) {
      console.error('❌ Error saving BM:', error);
      
      // Handle access denied errors first
      if (isAccessDeniedError(error)) {
        handleAccessDenied({
          closeForm: () => {
            onClose();
          },
          setMessage,
          error,
          context: 'saving Business Manager'
        });
      } else if (error.response) {
        console.log('📋 Error response data:', error.response.data);
        console.log('📋 Error status:', error.response.status);
        
        if (error.response.status === 400 && error.response.data.errors) {
          setErrors(error.response.data.errors);
          toast.error('Please fix the validation errors');
        } else if (error.response.status === 409) {
          // Previously we blocked on 409 email uniqueness. We now allow duplicate emails
          // at the DB level; show a notification and allow the user to proceed or retry.
          toast.error(error.response.data?.message || 'Conflict: resource already exists');
        } else {
          toast.error(error.response.data.message || 'Failed to save Business Manager');
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
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  {bm ? 'Edit Business Manager' : 'Add Business Manager'}
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
            {/* BM Name */}
            <div>
              <label htmlFor="bm_name" className="block text-sm font-medium text-gray-700">
                Business Manager Name *
              </label>
              <input
                type="text"
                id="bm_name"
                name="bm_name"
                value={formData.bm_name}
                onChange={handleInputChange}
                disabled={loading}
                placeholder="Enter Business Manager name"
                className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  (errors.bm_name || validationErrors.bm_name) ? 'border-red-500' : ''
                }`}
                required
                maxLength={255}
              />
              {(errors.bm_name || validationErrors.bm_name) && (
                <div className="mt-1 flex items-center text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.bm_name || validationErrors.bm_name}
                </div>
              )}
            </div>



            {/* Email Selection */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address *
              </label>
              <select
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={loading}
                className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  (errors.email || validationErrors.email) ? 'border-red-500' : ''
                }`}
                required
              >
                <option value="">Select an Email Address</option>
                {Array.isArray(facebookAccounts) && facebookAccounts.map(account => (
                  <option key={account?.id} value={account?.email}>
                    {account?.email}
                  </option>
                ))}
              </select>
              {(errors.email || validationErrors.email) && (
                <div className="mt-1 flex items-center text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.email || validationErrors.email}
                </div>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="tel"
                  id="phone_number"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  disabled={loading}
                  placeholder="Enter phone number (optional)"
                  className={`block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    (errors.phone_number || validationErrors.phone_number) ? 'border-red-500' : ''
                  }`}
                  maxLength={50}
                />
              </div>
              {(errors.phone_number || validationErrors.phone_number) && (
                <div className="mt-1 flex items-center text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.phone_number || validationErrors.phone_number}
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
                className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                  (errors.status || validationErrors.status) ? 'border-red-500' : ''
                }`}
                required
              >
                <option value="enabled">Active</option>
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

          {/* Auto-disable warning */}
          {formData.status === 'disabled' && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
                <p className="text-sm text-yellow-800">
                  <strong>Warning:</strong> Disabling this Business Manager will automatically disable all associated Ads Managers.
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {bm ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {bm ? 'Update BM' : 'Create BM'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BMForm;