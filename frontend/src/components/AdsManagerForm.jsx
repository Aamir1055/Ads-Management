import React, { useState, useEffect } from 'react';
import { X, UserCheck, Save, AlertCircle, Mail, Phone, Building2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AdsManagerForm = ({ adsManager, selectedBMId, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    ads_manager_name: '',
    email: '',
    phone_number: '',
    status: 'enabled',
    bm_id: selectedBMId || ''
  });
  const [bmOptions, setBmOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingBMs, setLoadingBMs] = useState(false);
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

  // Load BM dropdown options
  useEffect(() => {
    const loadBMOptions = async () => {
      setLoadingBMs(true);
      try {
        const response = await apiRequest.get('/bm/dropdown');
        if (response.data.success) {
          setBmOptions(response.data.data);
        } else {
          console.log('Failed to load BM options:', response.data.message);
          toast.error('Failed to load Business Manager options');
        }
      } catch (error) {
        console.error('Error loading BM options:', error);
        toast.error('Failed to load Business Manager options');
      } finally {
        setLoadingBMs(false);
      }
    };

    loadBMOptions();
  }, []);

  // Initialize form data when component mounts or adsManager changes
  useEffect(() => {
    if (adsManager) {
      setFormData({
        ads_manager_name: adsManager.ads_manager_name || '',
        email: adsManager.email || '',
        phone_number: adsManager.phone_number || '',
        status: adsManager.status || 'enabled',
        bm_id: adsManager.bm_id || selectedBMId || ''
      });
    } else {
      setFormData({
        ads_manager_name: '',
        email: '',
        phone_number: '',
        status: 'enabled',
        bm_id: selectedBMId || ''
      });
    }
    setErrors({});
    setValidationErrors({});
  }, [adsManager, selectedBMId]);

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

    // Ads Manager name validation
    if (!formData.ads_manager_name.trim()) {
      newErrors.ads_manager_name = 'Ads Manager name is required';
    } else if (formData.ads_manager_name.trim().length < 2) {
      newErrors.ads_manager_name = 'Ads Manager name must be at least 2 characters';
    } else if (formData.ads_manager_name.trim().length > 255) {
      newErrors.ads_manager_name = 'Ads Manager name must be less than 255 characters';
    }

    // Email validation (optional)
    if (formData.email && formData.email.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        newErrors.email = 'Please provide a valid email address';
      }
    }

    // Phone validation (optional)
    if (formData.phone_number && formData.phone_number.trim().length > 50) {
      newErrors.phone_number = 'Phone number must be less than 50 characters';
    }

    // BM ID validation
    if (!formData.bm_id) {
      newErrors.bm_id = 'Business Manager is required';
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
    
    console.log('🔄 Ads Manager Form submit triggered');
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
        ads_manager_name: formData.ads_manager_name.trim(),
        email: formData.email.trim() || null,
        phone_number: formData.phone_number.trim() || null,
        bm_id: parseInt(formData.bm_id),
        status: formData.status
      };

      console.log('📤 Submitting Ads Manager data:', submitData);

      let response;
      if (adsManager) {
        // Update existing Ads Manager
        console.log('✏️ Updating Ads Manager with ID:', adsManager.id);
        response = await apiRequest.put(`/ads-managers/${adsManager.id}`, submitData);
      } else {
        // Create new Ads Manager
        console.log('➕ Creating new Ads Manager');
        response = await apiRequest.post('/ads-managers', submitData);
      }

      console.log('✅ API Response:', response.data);

      if (response.data.success) {
        toast.success(adsManager ? 'Ads Manager updated successfully!' : 'Ads Manager created successfully!');
        onSave();
      } else {
        console.log('❌ API returned failure:', response.data);
        toast.error(response.data.message || 'Failed to save Ads Manager');
      }
    } catch (error) {
      console.error('❌ Error saving Ads Manager:', error);
      
      if (error.response) {
        console.log('📋 Error response data:', error.response.data);
        console.log('📋 Error status:', error.response.status);
        console.log('📋 Error message:', error.response.data.message);
        
        if (error.response.status === 400 && error.response.data.errors) {
          setErrors(error.response.data.errors);
          toast.error('Please fix the validation errors');
        } else if (error.response.status === 409) {
          const errorMessage = error.response.data.message || 'Conflict error occurred';
          if (errorMessage.includes('email')) {
            toast.error('An Ads Manager with this email already exists');
            setErrors({ email: 'Email already exists' });
          } else if (errorMessage.includes('name') || errorMessage.includes('already exists')) {
            toast.error('An Ads Manager with this name already exists for this Business Manager');
            setErrors({ ads_manager_name: 'This name already exists for this Business Manager' });
          } else {
            toast.error(errorMessage);
          }
        } else {
          toast.error(error.response.data.message || 'Failed to save Ads Manager');
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

  // Get selected BM info for display
  const getSelectedBMName = () => {
    const selectedBM = bmOptions.find(bm => bm.id === parseInt(formData.bm_id));
    return selectedBM ? selectedBM.bm_name : 'Unknown Business Manager';
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  {adsManager ? 'Edit Ads Manager' : 'Add Ads Manager'}
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
            {/* Ads Manager Name */}
            <div>
              <label htmlFor="ads_manager_name" className="block text-sm font-medium text-gray-700">
                Ads Manager Name *
              </label>
              <input
                type="text"
                id="ads_manager_name"
                name="ads_manager_name"
                value={formData.ads_manager_name}
                onChange={handleInputChange}
                disabled={loading}
                placeholder="Enter Ads Manager name"
                className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 ${
                  (errors.ads_manager_name || validationErrors.ads_manager_name) ? 'border-red-500' : ''
                }`}
                required
                maxLength={255}
              />
              {(errors.ads_manager_name || validationErrors.ads_manager_name) && (
                <div className="mt-1 flex items-center text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.ads_manager_name || validationErrors.ads_manager_name}
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={loading}
                  placeholder="Enter email address (optional)"
                  className={`block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 ${
                    (errors.email || validationErrors.email) ? 'border-red-500' : ''
                  }`}
                />
              </div>
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
                  className={`block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 ${
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

            {/* Business Manager Selection */}
            <div>
              <label htmlFor="bm_id" className="block text-sm font-medium text-gray-700">
                Business Manager *
              </label>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building2 className="h-4 w-4 text-gray-400" />
                </div>
                <select
                  id="bm_id"
                  name="bm_id"
                  value={formData.bm_id}
                  onChange={handleInputChange}
                  disabled={loading || loadingBMs}
                  className={`block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 ${
                    (errors.bm_id || validationErrors.bm_id) ? 'border-red-500' : ''
                  }`}
                  required
                >
                  <option value="">
                    {loadingBMs ? 'Loading Business Managers...' : 'Select Business Manager'}
                  </option>
                  {bmOptions.map(bm => (
                    <option key={bm.id} value={bm.id}>
                      {bm.bm_name}
                    </option>
                  ))}
                </select>
              </div>
              {(errors.bm_id || validationErrors.bm_id) && (
                <div className="mt-1 flex items-center text-sm text-red-600">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.bm_id || validationErrors.bm_id}
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
                className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 ${
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

          {/* BM Assignment Info */}
          {formData.bm_id && !loadingBMs && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center">
                <Building2 className="h-4 w-4 text-blue-600 mr-2" />
                <p className="text-sm text-blue-800">
                  <strong>Assigned to:</strong> {getSelectedBMName()}
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
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || loadingBMs}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {adsManager ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {adsManager ? 'Update Ads Manager' : 'Create Ads Manager'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdsManagerForm;