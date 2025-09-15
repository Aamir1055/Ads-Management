import React, { useEffect, useMemo, useState } from 'react'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Calendar,
  IndianRupee,
  CreditCard
} from 'lucide-react'
import cardsService from '../services/cardsService'
import CardForm from './CardForm'

const Cards = () => {
  const [cards, setCards] = useState([])
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

  // Add Balance modal state
  const [showAddBalanceModal, setShowAddBalanceModal] = useState(false)
  const [addBalanceCard, setAddBalanceCard] = useState(null)
  const [addBalanceAmount, setAddBalanceAmount] = useState('')
  const [addBalanceLoading, setAddBalanceLoading] = useState(false)

  // Fetch cards
  const fetchCards = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = {
        search: searchTerm,
        page: currentPage,
        limit: itemsPerPage
      }
      
      const response = await cardsService.getAll(params)
      
      if (response.success) {
        setCards(response.data?.cards || [])
      } else {
        setError(response.message || 'Failed to fetch cards')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch cards')
      console.error('Error fetching cards:', err)
    } finally {
      setLoading(false)
    }
  }

  // Search handling with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1)
      fetchCards()
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  useEffect(() => {
    fetchCards()
  }, [currentPage])

  useEffect(() => {
    fetchCards()
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
        const response = await cardsService.update(editingItem.id || editingItem._id, formData)
        if (!response.success) {
          throw new Error(response.message || 'Update failed')
        }
      } else {
        const response = await cardsService.create(formData)
        if (!response.success) {
          throw new Error(response.message || 'Creation failed')
        }
      }
      
      handleCloseForm()
      await fetchCards()
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
      const response = await cardsService.delete(itemToDelete.id || itemToDelete._id)
      
      if (!response.success) {
        throw new Error(response.message || 'Delete failed')
      }
      
      setShowDeleteConfirm(false)
      setItemToDelete(null)
      await fetchCards()
    } catch (err) {
      console.error('Delete error:', err)
      alert(err.response?.data?.message || 'Failed to delete card')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false)
    setItemToDelete(null)
  }

  // Add Balance handlers
  const handleAddBalanceClick = (card) => {
    setAddBalanceCard(card)
    setAddBalanceAmount('')
    setShowAddBalanceModal(true)
  }

  const handleAddBalanceCancel = () => {
    setShowAddBalanceModal(false)
    setAddBalanceCard(null)
    setAddBalanceAmount('')
  }

  const handleAddBalanceSubmit = async () => {
    if (!addBalanceCard || !addBalanceAmount) return
    
    const amount = parseFloat(addBalanceAmount)
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid positive amount')
      return
    }
    
    try {
      setAddBalanceLoading(true)
      const response = await cardsService.addBalance(addBalanceCard.id || addBalanceCard._id, amount)
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to add balance')
      }
      
      setShowAddBalanceModal(false)
      setAddBalanceCard(null)
      setAddBalanceAmount('')
      await fetchCards()
    } catch (err) {
      console.error('Add balance error:', err)
      alert(err.response?.data?.message || 'Failed to add balance')
    } finally {
      setAddBalanceLoading(false)
    }
  }

  // Filter cards based on search term
  const filteredCards = useMemo(() => {
    if (!searchTerm.trim()) return cards
    
    return cards.filter(card =>
      card.card_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.card_number_last4?.includes(searchTerm) ||
      card.card_type?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [cards, searchTerm])

  // Pagination calculations
  const totalItems = filteredCards.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentItems = filteredCards.slice(startIndex, endIndex)

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CreditCard className="h-7 w-7 text-blue-600" />
          Cards Management
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchCards()}
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
            Add Card
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
            placeholder="Search cards..."
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

      {/* Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : currentItems.length === 0 ? (
        <div className="text-center py-12">
          <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No cards found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm ? 'Try adjusting your search terms.' : 'Get started by adding your first card.'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => handleOpenForm()}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Card
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentItems.map((card) => (
              <div key={card.id || card._id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{card.card_name}</h3>
                      <p className="text-sm text-gray-600">•••• •••• •••• {card.card_number_last4}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        card.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {card.is_active ? (
                          <><CheckCircle className="w-3 h-3 mr-1" /> Active</>
                        ) : (
                          <><XCircle className="w-3 h-3 mr-1" /> Inactive</>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Card Type</p>
                      <p className="text-sm font-medium text-gray-900 capitalize">{card.card_type || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Balance</p>
                      <div className="flex items-center">
                        <IndianRupee className="h-4 w-4 text-green-600 mr-1" />
                        <span className="text-sm font-semibold text-green-600">
                          {Number(card.current_balance || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="h-3 w-3 mr-1" />
                      {card.created_at ? new Date(card.created_at).toLocaleDateString() : 'N/A'}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAddBalanceClick(card)}
                        className="inline-flex items-center px-3 py-1.5 border border-green-300 shadow-sm text-xs font-medium rounded text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Balance
                      </button>
                      <button
                        onClick={() => handleOpenForm(card)}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteClick(card)}
                        className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
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

      {/* Card Form Modal */}
      <CardForm
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
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Delete Card</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete "{itemToDelete.card_name}"? This action cannot be undone.
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

      {/* Add Balance Modal */}
      {showAddBalanceModal && addBalanceCard && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                  <IndianRupee className="h-6 w-6 text-green-600" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Add Balance</h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 mb-4">
                      Add balance to "{addBalanceCard.card_name}"
                    </p>
                    <div className="mt-4">
                      <label htmlFor="balance-amount" className="block text-sm font-medium text-gray-700 mb-2">
                        Amount (₹)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <IndianRupee className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="number"
                          id="balance-amount"
                          value={addBalanceAmount}
                          onChange={(e) => setAddBalanceAmount(e.target.value)}
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleAddBalanceSubmit}
                  disabled={addBalanceLoading || !addBalanceAmount}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                >
                  {addBalanceLoading ? 'Adding...' : 'Add Balance'}
                </button>
                <button
                  onClick={handleAddBalanceCancel}
                  disabled={addBalanceLoading}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 sm:mt-0 sm:w-auto sm:text-sm transition-colors"
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

export default Cards

