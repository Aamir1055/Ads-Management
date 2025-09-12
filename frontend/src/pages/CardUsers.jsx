import React, { useEffect, useMemo, useState } from 'react'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Calendar,
  Users,
  CreditCard,
  User,
  UserCheck
} from 'lucide-react'
import cardUsersService from '../services/cardUsersService'
import CardUsersForm from '../components/CardUsersForm'

const CardUsers = () => {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
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

  // Fetch assignments
  const fetchAssignments = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = {
        search: searchTerm,
        page: currentPage,
        limit: itemsPerPage
      }
      
      const response = await cardUsersService.getAll(params)
      
      if (response.success) {
        setAssignments(response.data?.assignments || response.data?.cardUsers || response.data || [])
      } else {
        setError(response.message || 'Failed to fetch card assignments')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch card assignments')
      console.error('Error fetching assignments:', err)
    } finally {
      setLoading(false)
    }
  }

  // Search handling with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1)
      fetchAssignments()
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  useEffect(() => {
    fetchAssignments()
  }, [currentPage])

  useEffect(() => {
    fetchAssignments()
  }, [])

  // Form handlers
  const handleOpenForm = (item = null) => {
    setEditingItem(item)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingItem(null)
  }

  const handleFormSubmit = async (formData) => {
    try {
      setFormLoading(true)
      
      if (editingItem) {
        const response = await cardUsersService.update(editingItem.id || editingItem._id, formData)
        if (!response.success) {
          throw new Error(response.message || 'Update failed')
        }
      } else {
        const response = await cardUsersService.create(formData)
        if (!response.success) {
          throw new Error(response.message || 'Creation failed')
        }
      }
      
      handleCloseForm()
      await fetchAssignments()
    } catch (err) {
      console.error('Form submission error:', err)
      throw err // Re-throw to let the form handle the error
    } finally {
      setFormLoading(false)
    }
  }

  // Delete handlers
  const handleDeleteClick = (item) => {
    setItemToDelete(item)
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return
    
    try {
      setDeleteLoading(true)
      const response = await cardUsersService.delete(itemToDelete.id || itemToDelete._id)
      
      if (!response.success) {
        throw new Error(response.message || 'Delete failed')
      }
      
      setShowDeleteConfirm(false)
      setItemToDelete(null)
      await fetchAssignments()
    } catch (err) {
      console.error('Delete error:', err)
      alert(err.response?.data?.message || 'Failed to delete assignment')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false)
    setItemToDelete(null)
  }

  // Filter assignments based on search term
  const filteredAssignments = useMemo(() => {
    if (!searchTerm.trim()) return assignments
    
    return assignments.filter(assignment =>
      assignment.card_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.card_number_last4?.includes(searchTerm)
    )
  }, [assignments, searchTerm])

  // Pagination calculations
  const totalItems = filteredAssignments.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = filteredAssignments.slice(startIndex, endIndex)

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <UserCheck className="h-7 w-7 text-blue-600" />
          Card User Assignments
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchAssignments()}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => handleOpenForm()}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Assign Card
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search assignments..."
          />
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 rounded-md bg-red-50 border border-red-200 p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Assignments Table */}
      {loading ? (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-4 py-5 sm:p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : currentItems.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm ? 'Try adjusting your search terms.' : 'Get started by assigning a card to a user.'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => handleOpenForm()}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Assign Card
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <CreditCard className="h-4 w-4 mr-1" />
                      Card
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      User
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      Assigned Date
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Primary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentItems.map((assignment) => (
                  <tr key={assignment.id || assignment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <CreditCard className="h-4 w-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {assignment.card_name || 'Unknown Card'}
                          </div>
                          <div className="text-sm text-gray-500">
                            ••••{assignment.card_number_last4 || '****'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="h-4 w-4 text-gray-400 mr-2" />
                        <div className="text-sm font-medium text-gray-900">
                          {assignment.username || 'Unknown User'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {assignment.assigned_date ? 
                        new Date(assignment.assigned_date).toLocaleDateString() : 'N/A'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        assignment.is_primary 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {assignment.is_primary ? (
                          <><CheckCircle className="w-3 h-3 mr-1" /> Primary</>
                        ) : (
                          <><XCircle className="w-3 h-3 mr-1" /> Secondary</>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenForm(assignment)}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(assignment)}
                          className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white px-4 py-3 border border-gray-200 rounded-lg mt-6">
              <div className="flex items-center text-sm text-gray-700">
                Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} results
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage <= 1}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage >= totalPages}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Assignment Form Modal */}
      <CardUsersForm
        isOpen={showForm}
        onClose={handleCloseForm}
        onSubmit={handleFormSubmit}
        editData={editingItem}
        isLoading={formLoading}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && itemToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Delete Assignment</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete the assignment of "{itemToDelete.card_name}" to "{itemToDelete.username}"? This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleteLoading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                >
                  {deleteLoading ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  onClick={handleDeleteCancel}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CardUsers
