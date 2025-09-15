import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Shield,
  QrCode,
  X,
  Save,
  AlertCircle,
  CheckCircle,
  Clock,
  Search
} from 'lucide-react';
import { formatDate } from '../utils/dateUtils';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Modal Component
const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className={`relative bg-white shadow-xl rounded-lg w-full ${sizeClasses[size]}`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

// QR Code Modal
const QRCodeModal = ({ isOpen, onClose, qrCode, secret, message }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Setup Two-Factor Authentication">
    <div className="text-center">
      {qrCode && (
        <div className="mb-6">
          <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg shadow-sm">
            <img src={qrCode} alt="QR Code" className="mx-auto" />
          </div>
          <p className="text-sm text-gray-600 mt-4">{message}</p>
        </div>
      )}
      {secret && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600 mb-2">Secret Key (save this securely):</p>
          <div className="bg-white border rounded-md p-3">
            <code className="text-sm font-mono text-gray-800 break-all">{secret}</code>
          </div>
        </div>
      )}
      <button
        onClick={onClose}
        className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        Got it!
      </button>
    </div>
  </Modal>
);

// Create/Edit User Modal
const UserFormModal = ({ isOpen, onClose, user, roles, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirm_password: '',
    role_id: '',
    enable_2fa: false
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        password: '',
        confirm_password: '',
        role_id: user.role_id || '',
        enable_2fa: user.is_2fa_enabled || false
      });
    } else {
      setFormData({
        username: '',
        password: '',
        confirm_password: '',
        role_id: '',
        enable_2fa: false
      });
    }
    setErrors({});
  }, [user, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors = {};
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    if (!user && !formData.password) {
      newErrors.password = 'Password is required';
    }
    if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }
    if (!formData.role_id) {
      newErrors.role_id = 'Role is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={user ? 'Edit User' : 'Create New User'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Username */}
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username *
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.username ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter username"
            />
            {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
          </div>

          {/* Role */}
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role *
            </label>
            <select
              value={formData.role_id}
              onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.role_id ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select a role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.display_name || role.name}
                </option>
              ))}
            </select>
            {errors.role_id && <p className="mt-1 text-sm text-red-600">{errors.role_id}</p>}
          </div>

          {/* Password */}
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {user ? 'New Password (leave empty to keep current)' : 'Password *'}
            </label>
            <div className="relative">
              <input
                type={showPasswords ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPasswords(!showPasswords)}
              >
                {showPasswords ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
          </div>

          {/* Confirm Password */}
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password {!user && '*'}
            </label>
            <div className="relative">
              <input
                type={showPasswords ? "text" : "password"}
                value={formData.confirm_password}
                onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.confirm_password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Confirm password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPasswords(!showPasswords)}
              >
                {showPasswords ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
              </button>
            </div>
            {errors.confirm_password && <p className="mt-1 text-sm text-red-600">{errors.confirm_password}</p>}
          </div>
        </div>

        {/* 2FA Toggle */}
        <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
          <input
            type="checkbox"
            id="enable_2fa"
            checked={formData.enable_2fa}
            onChange={(e) => setFormData({ ...formData, enable_2fa: e.target.checked })}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="enable_2fa" className="text-sm font-medium text-gray-900">
            Enable Two-Factor Authentication (Google Authenticator)
          </label>
          <Shield className="h-4 w-4 text-blue-500" />
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
          >
            {isLoading ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                {user ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {user ? 'Update User' : 'Create User'}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// Main UserManagement Component
const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  
  // Modals
  const [showUserModal, setShowUserModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [qrData, setQrData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', content: '' });

  // API functions
  const getAuthHeader = () => {
    const token = localStorage.getItem('access_token') || localStorage.getItem('authToken');
    console.log('🔍 Debug Auth Header:', {
      access_token: localStorage.getItem('access_token'),
      authToken: localStorage.getItem('authToken'),
      finalToken: token,
      hasToken: !!token
    });
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const headers = getAuthHeader();
      console.log('🚀 Making API request to:', `${API_BASE_URL}/user-management`);
      console.log('📜 Headers:', headers);
      
      const response = await fetch(`${API_BASE_URL}/user-management`, {
        headers
      });

      console.log('📊 Response status:', response.status);
      
      if (!response.ok) {
        if (response.status === 403) {
          setMessage({ 
            type: 'error', 
            content: 'Authentication required. Please login first.' 
          });
          // Optionally redirect to login
          // window.location.href = '/login';
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setUsers(data.data.users || []);
        setRoles(data.data.roles || []);
        setFilteredUsers(data.data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage({ type: 'error', content: 'Failed to load users' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (userData) => {
    try {
      setIsSubmitting(true);
      const response = await fetch(`${API_BASE_URL}/user-management`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', content: 'User created successfully! If 2FA is enabled, the user will set it up during their first login.' });
        setShowUserModal(false);
        await fetchUsers();
      } else {
        setMessage({ type: 'error', content: data.message || 'Failed to create user' });
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setMessage({ type: 'error', content: 'Failed to create user' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async (userData) => {
    try {
      setIsSubmitting(true);
      const response = await fetch(`${API_BASE_URL}/user-management/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', content: 'User updated successfully!' });
        setShowUserModal(false);
        setSelectedUser(null);
        await fetchUsers();
      } else {
        setMessage({ type: 'error', content: data.message || 'Failed to update user' });
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setMessage({ type: 'error', content: 'Failed to update user' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/user-management/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });

      const data = await response.json();
      
      if (data.success) {
        setMessage({ type: 'success', content: 'User deleted successfully!' });
        await fetchUsers();
      } else {
        setMessage({ type: 'error', content: data.message || 'Failed to delete user' });
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      setMessage({ type: 'error', content: 'Failed to delete user' });
    }
  };

  const handleGenerate2FA = async (userId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user-management/${userId}/generate-2fa`, {
        method: 'POST',
        headers: getAuthHeader()
      });

      const data = await response.json();
      
      if (data.success) {
        setQrData(data.data);
        setShowQRModal(true);
      } else {
        setMessage({ type: 'error', content: data.message || 'Failed to generate 2FA QR code' });
      }
    } catch (error) {
      console.error('Error generating 2FA:', error);
      setMessage({ type: 'error', content: 'Failed to generate 2FA QR code' });
    }
  };

  // Search functionality
  useEffect(() => {
    const filtered = users.filter(user =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  // Effects
  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (message.content) {
      const timer = setTimeout(() => {
        setMessage({ type: '', content: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Clock className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Users className="h-7 w-7 mr-3 text-blue-600" />
              User Management
            </h1>
            <p className="mt-1 text-gray-600">Manage users and their authentication settings</p>
          </div>
          <button
            onClick={() => {
              setSelectedUser(null);
              setShowUserModal(true);
            }}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create User
          </button>
        </div>
      </div>

      {/* Message Display */}
      {message.content && (
        <div className={`mb-4 p-4 rounded-lg flex items-center ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-5 w-5 mr-2" />
          ) : (
            <AlertCircle className="h-5 w-5 mr-2" />
          )}
          {message.content}
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                2FA
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Login
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {user.username[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{user.username}</div>
                      <div className="text-sm text-gray-500">ID: {user.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                    {user.role_name}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.is_2fa_enabled ? (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      <Shield className="w-3 h-3 mr-1" />
                      Enabled
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500">Disabled</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.last_login 
                    ? formatDate(user.last_login)
                    : 'Never'
                  }
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatDate(user.created_at)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => handleGenerate2FA(user.id)}
                      className="text-green-600 hover:text-green-900 p-1"
                      title="Generate 2FA QR Code"
                    >
                      <QrCode className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowUserModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 p-1"
                      title="Edit User"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-900 p-1"
                      title="Delete User"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No users found' : 'No users yet'}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm 
                ? 'Try adjusting your search terms'
                : 'Get started by creating your first user'
              }
            </p>
            {!searchTerm && (
              <button
                onClick={() => {
                  setSelectedUser(null);
                  setShowUserModal(true);
                }}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create User
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <UserFormModal
        isOpen={showUserModal}
        onClose={() => {
          setShowUserModal(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        roles={roles}
        onSubmit={selectedUser ? handleUpdateUser : handleCreateUser}
        isLoading={isSubmitting}
      />

      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => {
          setShowQRModal(false);
          setQrData({});
        }}
        qrCode={qrData.qrCode}
        secret={qrData.secret}
        message={qrData.message}
      />
    </div>
  );
};

export default UserManagement;
