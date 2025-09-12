import React, { useState, useEffect } from 'react'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react'
import { campaignTypesAPI } from '../services/campaignTypesService'
import CampaignTypeForm from '../components/CampaignTypeForm'

const CampaignTypes = () => {
  const [campaignTypes, setCampaignTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all') // 'all', 'active', 'inactive'
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Form states
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formLoading, setFormLoading] = useState(false)

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Fetch campaign types
  const fetchCampaignTypes = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = {
        search: searchTerm,
        active: filterStatus === 'all' ? undefined : filterStatus === 'active',
        sort: sortBy,
        order: sortOrder,
        page: currentPage,
        limit: itemsPerPage
      }
      
      const response = await campaignTypesAPI.getAll(params)
      
      if (response.success) {
        setCampaignTypes(response.data || [])
      } else {
        setError(response.message || 'Failed to fetch campaign types')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch campaign types')
      console.error('Error fetching campaign types:', err)
    } finally {
      setLoading(false)
    }
  }

  // Initial load and refresh when filters change
  useEffect(() => {
    fetchCampaignTypes()
  }, [searchTerm, filterStatus, sortBy, sortOrder, currentPage])

  // Handle create/update
  const handleFormSubmit = async (formData) => {
    try {
      setFormLoading(true)
      setError(null) // Clear any previous errors
      
      console.log('Submitting form data:', formData)
      console.log('Editing item:', editingItem)
      
      let response
      if (editingItem) {
        console.log('Updating campaign type with ID:', editingItem.id)
        response = await campaignTypesAPI.update(editingItem.id, formData)
      } else {
        console.log('Creating new campaign type')
        response = await campaignTypesAPI.create(formData)
      }

      console.log('API Response:', response)
      
      // Handle both success response patterns
      if (response.success || response.data) {
        setShowForm(false)
        setEditingItem(null)
        fetchCampaignTypes() // Refresh the list
        
        // Show success message (you can implement a toast notification here)
        console.log(editingItem ? 'Campaign type updated successfully' : 'Campaign type created successfully')
      } else {
        throw new Error(response.message || 'Operation failed')
      }
    } catch (error) {
      console.error('Form submission error:', error)
      console.error('Error response data:', error.response?.data)
      console.error('Error status:', error.response?.status)
      
      // Set error message from API response or fallback
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Operation failed'
      setError(errorMessage)
    } finally {
      setFormLoading(false)
    }
  }

  // Handle delete
  const handleDelete = async (id) => {
    try {
      setDeleteLoading(true)
      const response = await campaignTypesAPI.delete(id)
      
      if (response.success) {
        setShowDeleteConfirm(false)
        setItemToDelete(null)
        fetchCampaignTypes() // Refresh the list
        console.log('Campaign type deleted successfully')
      } else {
        throw new Error(response.message || 'Delete failed')
      }
    } catch (error) {
      console.error('Delete error:', error)
      setError(error.response?.data?.message || 'Delete failed')
    } finally {
      setDeleteLoading(false)
    }
  }

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1) // Reset to first page when searching
  }

  // Handle filter change
  const handleFilterChange = (filter) => {
    setFilterStatus(filter)
    setCurrentPage(1) // Reset to first page when filtering
  }

  // Handle sort
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
    setCurrentPage(1)
  }

  // Open edit form
  const handleEdit = (item) => {
    setEditingItem(item)
    setShowForm(true)
  }

  // Open create form
  const handleCreate = () => {
    setEditingItem(null)
    setShowForm(true)
  }

  // Open delete confirmation
  const handleDeleteClick = (item) => {
    setItemToDelete(item)
    setShowDeleteConfirm(true)
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Campaign Types</h1>
            <p className="text-gray-600 mt-1">Manage your campaign types</p>
          </div>
          <button
            onClick={handleCreate}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Campaign Type
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search campaign types..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={filterStatus}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>

            {/* Refresh Button */}
            <div className="flex justify-end">
              <button
                onClick={fetchCampaignTypes}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
            <p className="text-gray-500 mt-2">Loading campaign types...</p>
          </div>
        ) : campaignTypes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Plus className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No campaign types found</h3>
            <p className="text-gray-500 mb-4">Get started by creating your first campaign type.</p>
            <button
              onClick={handleCreate}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Campaign Type
            </button>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('type_name')}
                >
                  Name
                  {sortBy === 'type_name' && (
                    <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('is_active')}
                >
                  Status
                  {sortBy === 'is_active' && (
                    <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('created_at')}
                >
                  Created
                  {sortBy === 'created_at' && (
                    <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {campaignTypes.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.type_name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-700 max-w-xs truncate">
                      {item.description || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {item.is_active ? (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactive
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {formatDate(item.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(item)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Campaign Type Form Modal */}
      <CampaignTypeForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false)
          setEditingItem(null)
          setError(null)
        }}
        onSubmit={handleFormSubmit}
        editData={editingItem}
        isLoading={formLoading}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && itemToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-red-600" />
              <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Campaign Type</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete "{itemToDelete.type_name}"? This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-center space-x-3 mt-4">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setItemToDelete(null)
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(itemToDelete.id)}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  disabled={deleteLoading}
                >
                  {deleteLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CampaignTypes
