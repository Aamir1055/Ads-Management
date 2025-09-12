import React, { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2, Shield, ShieldCheck, QrCode } from 'lucide-react'
import usersService from '../services/usersService'
import TwoFactorAuth from '../components/TwoFactorAuth'

const UserManagement = () => {
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role_id: '',
    is_2fa_enabled: false,
    is_active: true
  })

  // Load data on component mount
  useEffect(() => {
    loadUsers()
    loadRoles()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await usersService.getAll({
        search: searchTerm,
        limit: 100,
        page: 1
      })
      
      if (response.success && response.data?.users) {
        setUsers(response.data.users)
      } else {
        console.error('Failed to load users:', response.message)
        setUsers([])
      }
    } catch (error) {
      console.error('Error loading users:', error)
      // Could show user-friendly error message here
      alert('Failed to load users: ' + (error.userMessage || 'Please try again later.'))
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const loadRoles = async () => {
    try {
      const response = await usersService.getRoles()
      
      console.log('Roles API response:', response) // Debug log
      
      if (response.success && response.data?.roles) {
        console.log('Setting roles:', response.data.roles) // Debug log
        setRoles(response.data.roles)
      } else {
        console.error('Failed to load roles:', response.message)
        setRoles([])
      }
    } catch (error) {
      console.error('Error loading roles:', error)
      alert('Failed to load roles: ' + (error.userMessage || 'Please try again later.'))
      setRoles([])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      if (editingUser) {
        // Update existing user - only include password if it's not empty
        const updateData = { ...formData }
        if (!formData.password.trim()) {
          delete updateData.password // Don't send empty password
        } else {
          updateData.confirm_password = formData.password // Add confirm password for updates
        }
        const response = await usersService.update(editingUser.id, updateData)
        
        if (response.success) {
          loadUsers() // Reload users to get updated data
          alert('User updated successfully!')
        } else {
          alert('Failed to update user: ' + (response.message || 'Unknown error'))
        }
      } else {
        // Create new user
        const userData = {
          ...formData,
          confirm_password: formData.password, // Add confirm password
          enable_2fa: formData.is_2fa_enabled
        }
        
        const response = await usersService.create(userData)
        
        if (response.success) {
          loadUsers() // Reload users to get updated data
          alert('User created successfully!')
        } else {
          alert('Failed to create user: ' + (response.message || 'Unknown error'))
        }
      }
      
      // Reset form
      setFormData({
        username: '',
        password: '',
        role_id: roles[0]?.id || '',
        is_2fa_enabled: false,
        is_active: true
      })
      setEditingUser(null)
      setIsModalOpen(false)
    } catch (error) {
      console.error('Error saving user:', error)
      alert('Error saving user: ' + (error.userMessage || error.message || 'Please try again later.'))
    }
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    setFormData({
      username: user.username,
      password: '', // Empty password field for editing
      role_id: user.role_id,
      is_2fa_enabled: user.is_2fa_enabled || user.twofa_enabled,
      is_active: user.is_active
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await usersService.delete(userId)
        
        if (response.success) {
          loadUsers() // Reload users to get updated data
          alert('User deleted successfully!')
        } else {
          alert('Failed to delete user: ' + (response.message || 'Unknown error'))
        }
      } catch (error) {
        console.error('Error deleting user:', error)
        alert('Error deleting user: ' + (error.userMessage || error.message || 'Please try again later.'))
      }
    }
  }

  const toggleUserStatus = async (userId) => {
    try {
      const response = await usersService.toggleStatus(userId)
      
      if (response.success) {
        loadUsers() // Reload users to get updated data
      } else {
        alert('Failed to toggle user status: ' + (response.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error toggling user status:', error)
      alert('Error toggling user status: ' + (error.userMessage || error.message || 'Please try again later.'))
    }
  }

  const handle2FAVerified = (verificationData) => {
    console.log('2FA verification data received:', verificationData)
    
    // Update form data with 2FA information
    const updatedFormData = {
      ...formData,
      is_2fa_enabled: true,
      twofa_secret: verificationData.secret
    }
    
    // If this is a temporary setup for a new user, store the temp key
    if (verificationData.isTemporary && verificationData.tempKey) {
      updatedFormData.temp_2fa_key = verificationData.tempKey
    }
    
    setFormData(updatedFormData)
    setIs2FAModalOpen(false)
    alert(verificationData.message || '2FA has been verified successfully!')
  }

const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.role_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="mt-1 text-sm text-gray-600">Manage users, roles, and permissions</p>
        </div>
<button
          onClick={() => {
            setEditingUser(null)
            setFormData({
              username: '',
              password: '',
              role_id: roles[0]?.id || '',
              is_2fa_enabled: false,
              is_active: true,
            })
            setIsModalOpen(true)
          }}
          className="mt-4 sm:mt-0 btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New User
        </button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="input-field pl-10"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

{/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Username
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  2FA
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
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
                      <div className="h-10 w-10 flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.username}</div>
                        <div className="text-xs text-gray-500">ID: {user.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.role_name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.is_2fa_enabled || user.twofa_enabled ? (
                      <span className="inline-flex items-center text-green-700 bg-green-100 px-2 py-1 rounded-md text-xs">
                        <ShieldCheck className="h-4 w-4 mr-1" /> Enabled
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-gray-700 bg-gray-100 px-2 py-1 rounded-md text-xs">
                        <Shield className="h-4 w-4 mr-1" /> Disabled
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleUserStatus(user.id)}
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full cursor-pointer ${
                        user.is_active 
                          ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {user.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.last_login || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-primary-600 hover:text-primary-900 p-1"
                        title="Edit user"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Delete user"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

{/* User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {editingUser ? 'Edit User' : 'Create User'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {editingUser ? 'New Password (leave blank to keep current)' : 'Password'}
                </label>
                <input
                  type="password"
                  required={!editingUser} // Only required when creating new user
                  className="input-field"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingUser ? 'Enter new password or leave blank' : 'Enter password'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  className="input-field"
                  required
                  value={formData.role_id}
                  onChange={(e) => setFormData({ ...formData, role_id: Number(e.target.value) })}
                >
                  <option value="" disabled>Select role</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name || r.role_name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                <div className="flex items-center">
                  {formData.is_2fa_enabled ? (
                    <ShieldCheck className="h-5 w-5 text-green-600 mr-2" />
                  ) : (
                    <Shield className="h-5 w-5 text-gray-600 mr-2" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">Enable Two-Factor Authentication</p>
                    <p className="text-xs text-gray-600">Increase account security with a TOTP app</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!formData.username) {
                      alert('Enter a username first to generate 2FA QR')
                      return
                    }
                    setIs2FAModalOpen(true)
                  }}
                  className="btn-secondary flex items-center"
                >
                  <QrCode className="h-4 w-4 mr-2" /> Setup
                </button>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  id="is_active"
                  type="checkbox"
                  checked={!!formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">Active</label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">{editingUser ? 'Update User' : 'Create User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2FA Setup Modal */}
      {is2FAModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Setup Two-Factor Authentication
              </h3>
            </div>
            
            <div className="p-6">
              <TwoFactorAuth
                userId={editingUser?.id || 'new'}
                username={formData.username}
                isNewUser={!editingUser}
                onVerified={handle2FAVerified}
                onCancel={() => setIs2FAModalOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagement
