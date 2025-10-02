import React, { useEffect, useState, useMemo } from 'react'
import { roleService } from '../services/roleService'
import usersService from '../services/usersService'
import { User, Shield, Clock, Loader2, Plus, X, Search, ChevronDown } from 'lucide-react'

const UserRoleCard = ({ user, onManageRoles, loading }) => (
  <div className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <span className="text-white font-medium text-sm">{user.username?.[0]?.toUpperCase() || 'U'}</span>
        </div>
        <div className="ml-3">
          <div className="font-medium text-gray-900">{user.username}</div>
          <div className="text-sm text-gray-500">ID: {user.id}</div>
        </div>
      </div>
      <button 
        onClick={() => onManageRoles(user)}
        disabled={loading}
        className="btn-secondary text-sm"
      >
        <Shield className="h-4 w-4 mr-1" />
        Manage Roles
      </button>
    </div>
    <div className="mt-3">
      <div className="text-xs text-gray-500 mb-1">Current Roles:</div>
      <div className="flex flex-wrap gap-1">
        {user.roles?.length > 0 ? (
          user.roles.map(role => (
            <span 
              key={role.id} 
              className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
            >
              {role.name} <span className="ml-1 text-xs">L{role.level}</span>
            </span>
          ))
        ) : (
          <span className="text-xs text-gray-400">No roles assigned</span>
        )}
      </div>
    </div>
  </div>
)

const UserRoleModal = ({ user, isOpen, onClose, onSave, allRoles, loading }) => {
  const [selectedRoles, setSelectedRoles] = useState([])
  const [userCurrentRoles, setUserCurrentRoles] = useState([])
  const [modalLoading, setModalLoading] = useState(false)

  useEffect(() => {
    if (user && isOpen) {
      fetchUserRoles()
    }
  }, [user, isOpen])

  const fetchUserRoles = async () => {
    if (!user?.id) return
    try {
      setModalLoading(true)
      const response = await roleService.getUserRoles(user.id)
      const roles = response.data || []
      setUserCurrentRoles(roles)
      setSelectedRoles(roles.map(r => r.id))
    } catch (error) {
      console.error('Error fetching user roles:', error)
    } finally {
      setModalLoading(false)
    }
  }

  const handleRoleToggle = (roleId) => {
    setSelectedRoles(prev => 
      prev.includes(roleId) 
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    )
  }

  const handleSave = async () => {
    if (!user?.id) return
    try {
      setModalLoading(true)
      
      const currentRoleIds = userCurrentRoles.map(r => r.id)
      const rolesToAdd = selectedRoles.filter(id => !currentRoleIds.includes(id))
      const rolesToRemove = currentRoleIds.filter(id => !selectedRoles.includes(id))

      // Add new roles
      for (const roleId of rolesToAdd) {
        await roleService.assignUserToRole(user.id, roleId)
      }

      // Remove old roles
      for (const roleId of rolesToRemove) {
        await roleService.removeUserFromRole(user.id, roleId)
      }

      onSave()
    } catch (error) {
      console.error('Error updating user roles:', error)
    } finally {
      setModalLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Manage Roles for {user?.username}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {modalLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-gray-600 mb-3">Select roles for this user:</div>
            {allRoles.map(role => (
              <label key={role.id} className="flex items-center p-3 border rounded-md hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedRoles.includes(role.id)}
                  onChange={() => handleRoleToggle(role.id)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <div className="ml-3 flex-1">
                  <div className="font-medium text-gray-900">{role.name}</div>
                  <div className="text-sm text-gray-500">Level {role.level || 1}</div>
                  {role.description && (
                    <div className="text-xs text-gray-400 mt-1">{role.description}</div>
                  )}
                </div>
              </label>
            ))}
          </div>
        )}

        <div className="flex justify-end space-x-3 mt-6">
          <button onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button onClick={handleSave} disabled={modalLoading} className="btn-primary">
            {modalLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

const UserRoleManagement = () => {
  const [users, setUsers] = useState([])
  const [allRoles, setAllRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Load roles first
      const rolesResponse = await roleService.getAllRoles()
      const roles = rolesResponse.data || rolesResponse || []
      setAllRoles(roles)

      // Load actual users from the users service
      let actualUsers = []
      
      try {
        const usersResponse = await usersService.getAll({ limit: 100 })
        if (usersResponse.success && usersResponse.data?.users) {
          actualUsers = usersResponse.data.users
        } else if (usersResponse.data && Array.isArray(usersResponse.data)) {
          actualUsers = usersResponse.data
        } else {
          console.warn('Users response format unexpected:', usersResponse)
          actualUsers = []
        }
      } catch (userError) {
        console.warn('Failed to load users:', userError)
        // Don't use fallback data in production, show empty state instead
        actualUsers = []
      }
      
      // Load actual role data for each user
      const usersWithRoles = await Promise.all(
        actualUsers.map(async (user) => {
          try {
            const userRolesResponse = await roleService.getUserRoles(user.id)
            return {
              ...user,
              roles: userRolesResponse.data || []
            }
          } catch (error) {
            console.warn(`Error loading roles for user ${user.id}:`, error)
            return { ...user, roles: [] }
          }
        })
      )
      
      setUsers(usersWithRoles)
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to load data')
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = useMemo(() => {
    return users.filter(user =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [users, searchTerm])

  const handleManageRoles = (user) => {
    setSelectedUser(user)
    setModalOpen(true)
  }

  const handleModalSave = () => {
    setModalOpen(false)
    setSelectedUser(null)
    loadData() // Refresh data
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <User className="h-7 w-7 text-primary-500 mr-2" />
          <h1 className="text-2xl font-bold">User Role Management</h1>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Users & Their Roles</h2>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
            </div>
            <div className="text-sm text-gray-500">
              {filteredUsers.length} users
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-3 text-gray-600">Loading users...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.length === 0 ? (
              <div className="col-span-full text-center py-8 text-gray-500">
                {searchTerm ? 'No users found matching your search.' : 'No users available.'}
              </div>
            ) : (
              filteredUsers.map(user => (
                <UserRoleCard
                  key={user.id}
                  user={user}
                  onManageRoles={handleManageRoles}
                  loading={loading}
                />
              ))
            )}
          </div>
        )}
      </div>

      <UserRoleModal
        user={selectedUser}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleModalSave}
        allRoles={allRoles}
        loading={loading}
      />
    </div>
  )
}

export default UserRoleManagement
