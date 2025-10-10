import React, { useState, useRef } from 'react';
import { 
  X, 
  Save, 
  Mail, 
  Lock, 
  Phone, 
  User, 
  Upload, 
  Eye, 
  EyeOff, 
  AlertCircle,
  CheckCircle,
  Shield
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { handleAccessDenied, isAccessDeniedError } from '../utils/accessDeniedHandler';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const FacebookAccountForm = ({ account, onClose, onSave, setMessage }) => {
  const [formData, setFormData] = useState({
    email: account?.email || '',
    password: '',
    authenticator: account?.authenticator || '',
    phone_number: account?.phone_number || '',
    status: account?.status || 'enabled'
  });

  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(
    account?.id_image_path ? `${API_BASE_URL.replace('/api', '')}${account.id_image_path}` : null
  );
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  const isEditing = Boolean(account);

  // Get auth token
  const getAuthToken = () => {
    const authToken = localStorage.getItem('authToken');
    const accessToken = localStorage.getItem('access_token');
    const token = authToken || accessToken;
    
    console.log('🔐 [FacebookAccountForm] Token check:', {
      authToken: authToken ? 'Present' : 'Missing',
      accessToken: accessToken ? 'Present' : 'Missing',
      finalToken: token ? 'Present' : 'Missing'
    });
    
    return token;
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove selected image
  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(account?.id_image_path ? `${API_BASE_URL.replace('/api', '')}${account.id_image_path}` : null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation (required for new accounts, optional for updates)
    if (!isEditing && !formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    } else if (formData.password && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    // Phone number validation (if provided)
    if (formData.phone_number && !/^\+?[\d\s\-\(\)]+$/.test(formData.phone_number)) {
      newErrors.phone_number = 'Please enter a valid phone number';
    }

    // Authenticator validation (if provided)
    if (formData.authenticator && formData.authenticator.length > 500) {
      newErrors.authenticator = 'Authenticator text cannot exceed 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    try {
      e.preventDefault();
      
      console.log('🚀 [FacebookAccountForm] Form submission started');
      console.log('📝 [FacebookAccountForm] Form data:', formData);
      console.log('🖼️ [FacebookAccountForm] Selected image:', selectedImage ? selectedImage.name : 'None');
      
      if (!validateForm()) {
        console.log('❌ [FacebookAccountForm] Validation failed');
        toast.error('Please fix the errors before submitting');
        return;
      }

      console.log('✅ [FacebookAccountForm] Validation passed, starting API call');
      setLoading(true);

      try {
        console.log('📝 [FacebookAccountForm] Starting FormData creation...');
        
        // Create FormData for multipart/form-data
        const submitData = new FormData();
        
        // Add text fields
        console.log('📝 [FacebookAccountForm] Adding email:', formData.email);
        submitData.append('email', formData.email);
        
        if (formData.password) {
          console.log('📝 [FacebookAccountForm] Adding password: [HIDDEN]');
          submitData.append('password', formData.password);
        } else {
          console.log('📝 [FacebookAccountForm] No password provided');
        }
        
        if (formData.authenticator) {
          console.log('📝 [FacebookAccountForm] Adding authenticator');
          submitData.append('authenticator', formData.authenticator);
        }
        
        if (formData.phone_number) {
          console.log('📝 [FacebookAccountForm] Adding phone_number:', formData.phone_number);
          submitData.append('phone_number', formData.phone_number);
        }
        
        console.log('📝 [FacebookAccountForm] Adding status:', formData.status);
        submitData.append('status', formData.status);

        // Add image file if selected
        if (selectedImage) {
          console.log('📝 [FacebookAccountForm] Adding image file:', selectedImage.name);
          submitData.append('id_image', selectedImage);
        } else {
          console.log('📝 [FacebookAccountForm] No image file selected');
        }
        
        console.log('✅ [FacebookAccountForm] FormData creation completed');

      // Make API request
      const url = isEditing 
        ? `/facebook-accounts/${account.id}`
        : '/facebook-accounts';
      
      const method = isEditing ? 'put' : 'post';
      const fullUrl = `${API_BASE_URL}${url}`;
      const token = getAuthToken();
      
      console.log('🌍 [FacebookAccountForm] API Details:');
      console.log('   Method:', method);
      console.log('   URL:', fullUrl);
      console.log('   Token:', token ? 'Present' : 'Missing');
      console.log('   FormData contents:');
      for (let [key, value] of submitData.entries()) {
        console.log(`     ${key}:`, value instanceof File ? `File(${value.name})` : value);
      }
      
      const response = await axios({
        method,
        url: fullUrl,
        data: submitData,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('✅ [FacebookAccountForm] API Response received:', response.data);

      if (response.data.success) {
        toast.success(response.data.message);
        onSave();
      } else {
        toast.error(response.data.message || 'Failed to save account');
      }
    } catch (error) {
      console.error('❌ [FacebookAccountForm] Error saving account:', error);
      console.log('❌ [FacebookAccountForm] Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      // Handle access denied errors first
      if (isAccessDeniedError(error)) {
        handleAccessDenied({
          closeForm: () => {
            onClose();
          },
          setMessage,
          error,
          context: 'saving Facebook account'
        });
      } else if (error.response?.data?.errors) {
        // Handle validation errors
        const backendErrors = {};
        error.response.data.errors.forEach(err => {
          backendErrors[err.path || err.param || err.field] = err.msg || err.message;
        });
        setErrors(backendErrors);
        toast.error('Please fix the validation errors');
      } else {
        // Handle other types of errors
        toast.error(error.response?.data?.message || 'Failed to save account');
      }
    } finally {
      console.log('🔄 [FacebookAccountForm] Setting loading to false');
      setLoading(false);
    }
    } catch (outerError) {
      console.error('🚫 [FacebookAccountForm] Outer error caught:', outerError);
      toast.error('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-8 mx-auto p-5 border max-w-2xl shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            {isEditing ? 'Edit Facebook Account' : 'Add Facebook Account'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form 
          onSubmit={(e) => {
            console.log('📝 [FacebookAccountForm] Form onSubmit triggered');
            handleSubmit(e);
          }} 
          className="space-y-6"
        >
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              <Mail className="w-4 h-4 inline mr-1" />
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${
                errors.email 
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                  : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
              }`}
              placeholder="Enter Facebook email address"
              required
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              <Lock className="w-4 h-4 inline mr-1" />
              Password {!isEditing && '*'}
              {isEditing && (
                <span className="text-xs text-gray-500 ml-2">(leave empty to keep current password)</span>
              )}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`block w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${
                  errors.password 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
                }`}
                placeholder="Enter Facebook password"
                required={!isEditing}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.password}
              </p>
            )}
            {!errors.password && formData.password && (
              <p className="mt-1 text-xs text-gray-500">
                Use a strong password with uppercase, lowercase, and numbers
              </p>
            )}
          </div>

          {/* Phone Number Field */}
          <div>
            <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-1">
              <Phone className="w-4 h-4 inline mr-1" />
              Phone Number
              <span className="text-xs text-gray-500 ml-2">(optional)</span>
            </label>
            <input
              type="tel"
              id="phone_number"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleInputChange}
              className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${
                errors.phone_number 
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                  : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
              }`}
              placeholder="+1234567890"
            />
            {errors.phone_number && (
              <p className="mt-1 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.phone_number}
              </p>
            )}
          </div>

          {/* Authenticator Field */}
          <div>
            <label htmlFor="authenticator" className="block text-sm font-medium text-gray-700 mb-1">
              <Shield className="w-4 h-4 inline mr-1" />
              2FA Authenticator Details
              <span className="text-xs text-gray-500 ml-2">(optional)</span>
            </label>
            <textarea
              id="authenticator"
              name="authenticator"
              value={formData.authenticator}
              onChange={handleInputChange}
              rows={3}
              className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 ${
                errors.authenticator 
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                  : 'border-gray-300 focus:ring-primary-500 focus:border-primary-500'
              }`}
              placeholder="2FA backup codes, secret key, or other authenticator details..."
              maxLength={500}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.authenticator ? (
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.authenticator}
                </p>
              ) : (
                <p className="text-xs text-gray-500">
                  Store 2FA backup codes or secret keys securely
                </p>
              )}
              <span className="text-xs text-gray-400">
                {formData.authenticator.length}/500
              </span>
            </div>
          </div>

          {/* ID Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Upload className="w-4 h-4 inline mr-1" />
              ID Image
              <span className="text-xs text-gray-500 ml-2">(optional)</span>
            </label>
            
            {imagePreview ? (
              <div className="flex items-start space-x-4">
                <div className="relative">
                  <img 
                    src={imagePreview} 
                    alt="ID Preview" 
                    className="w-24 h-24 object-cover rounded-lg border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">
                    {selectedImage ? 'New image selected' : 'Current ID image'}
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 text-sm text-primary-600 hover:text-primary-700"
                  >
                    Change Image
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-gray-300 border-dashed rounded-lg p-6">
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Click to upload
                    </button>
                    <span className="text-gray-500"> or drag and drop</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    PNG, JPG, JPEG up to 5MB
                  </p>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          {/* Status Field */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
              <option value="suspended_temporarily">Suspended Temporarily</option>
            </select>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              onClick={(e) => {
                console.log('👆 [FacebookAccountForm] Submit button clicked');
                // Don't preventDefault here, let form handle it
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isEditing ? 'Update Account' : 'Create Account'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FacebookAccountForm;