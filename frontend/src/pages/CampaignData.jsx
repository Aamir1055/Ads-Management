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
  RefreshCw,
  Calendar,
  DollarSign
} from 'lucide-react'
import campaignDataService from '../services/campaignDataService'

const CampaignData = () => {
  const [campaignData, setCampaignData] = useState([])
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

  // Dropdown data
  const [campaigns, setCampaigns] = useState([])
  const [cards, setCards] = useState([])
  const [dropdownLoading, setDropdownLoading] = useState(false)

  // Form data
  const [formData, setFormData] = useState({
    campaign_id: '',
    facebook_result: '',
    zoho_result: '',
    spent: '',
    data_date: '',
    card_id: ''
  })

  // Get yesterday's date in YYYY-MM-DD format
  function getYesterday() {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return yesterday.toISOString().split('T')[0]
  }

  // Fetch campaign data
  const fetchCampaignData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = {
        search: searchTerm,
        page: currentPage,
        limit: itemsPerPage
      }
      
      const response = await campaignDataService.getAll(params)
      
      if (response.success) {
        setCampaignData(response.data || [])
      } else {
        setError(response.message || 'Failed to fetch campaign data')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch campaign data')
      console.error('Error fetching campaign data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch dropdown data
  const fetchDropdownData = async () => {
    try {
      setDropdownLoading(true)
      
      const [campaignsResponse, cardsResponse] = await Promise.all([
        campaignDataService.getCampaignsForDropdown(),
        campaignDataService.getCardsForDropdown()
      ])
      
      if (campaignsResponse.success) {
        setCampaigns(campaignsResponse.data || [])
      }
      
      if (cardsResponse.success) {
        setCards(cardsResponse.data || [])
      }
    } catch (err) {
      console.error('Error fetching dropdown data:', err)
      setError('Failed to load dropdown data')
    } finally {
      setDropdownLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchCampaignData()
    fetchDropdownData()
  }, [searchTerm, currentPage])

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Handle form submit
  const handleFormSubmit = async (e) => {
    e.preventDefault()
    
    try {
      setFormLoading(true)
      setError(null)
      
      // Validate required fields
      if (!formData.campaign_id || !formData.card_id || !formData.data_date) {
        setError('Campaign, Card, and Date are required fields')
        return
      }
      
      const submitData = {
        campaign_id: parseInt(formData.campaign_id),
        facebook_result: parseInt(formData.facebook_result) || 0,
        zoho_result: parseInt(formData.zoho_result) || 0,
        spent: parseFloat(formData.spent) || 0,
        data_date: formData.data_date,
        card_id: parseInt(formData.card_id)
      }
      
      let response
      if (editingItem) {
        response = await campaignDataService.update(editingItem.id, submitData)
      } else {
        response = await campaignDataService.create(submitData)
      }
      
      if (response.success || response.data) {
        setShowForm(false)
        setEditingItem(null)
        setFormData({
          campaign_id: '',
          facebook_result: '',
          zoho_result: '',
          spent: '',
          data_date: '',
          card_id: ''
        })
        fetchCampaignData() // Refresh the list
      } else {
        throw new Error(response.message || 'Operation failed')
      }
    } catch (error) {
      console.error('Form submission error:', error)
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
      const response = await campaignDataService.delete(id)
      
      if (response.success) {
        setShowDeleteConfirm(false)
        setItemToDelete(null)
        fetchCampaignData() // Refresh the list
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
    setCurrentPage(1)
  }

  // Open edit form
  const handleEdit = (item) => {
    setError(null) // Clear any previous errors
    setEditingItem(item)
    setFormData({
      campaign_id: item.campaign_id?.toString() || '',
      facebook_result: item.facebook_result?.toString() || '',
      zoho_result: item.zoho_result?.toString() || '',
      spent: item.spent?.toString() || '',
      data_date: item.data_date ? item.data_date.split('T')[0] : '',
      card_id: item.card_id?.toString() || ''
    })
    // Refresh dropdown data when opening the form
    fetchDropdownData()
    setShowForm(true)
  }

  // Open create form
  const handleCreate = () => {
    setError(null) // Clear any previous errors
    setEditingItem(null)
    setFormData({
      campaign_id: '',
      facebook_result: '',
      zoho_result: '',
      spent: '',
      data_date: '',
      card_id: ''
    })
    // Refresh dropdown data when opening the form
    fetchDropdownData()
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
      day: 'numeric'
    })
  }

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return '$0.00'
    return `$${parseFloat(amount).toFixed(2)}`
  }

  // Get campaign name by ID
  const getCampaignName = (id) => {
    const campaign = campaigns.find(c => c.id === id)
    return campaign ? campaign.name : '-'
  }

  // Get card name by ID
  const getCardName = (id) => {
    const card = cards.find(c => c.id === id)
    return card ? card.card_name : '-'
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Campaign Data</h1>
            <p className="text-gray-600 mt-1">Manage your campaign performance data</p>
          </div>
          <button
            onClick={handleCreate}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Campaign Data
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search campaign data..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2"
              />
            </div>

            {/* Refresh Button */}
            <div className="flex justify-end">
              <button
                onClick={fetchCampaignData}
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


      {/* Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
            <p className="text-gray-500 mt-2">Loading campaign data...</p>
          </div>
        ) : campaignData.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <DollarSign className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No campaign data found</h3>
            <p className="text-gray-500 mb-4">Get started by adding your first campaign data entry.</p>
            <button
              onClick={handleCreate}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Campaign Data
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campaign
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Facebook Result
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Zoho Result
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Spent
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Card
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {campaignData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{item.campaign_name || getCampaignName(item.campaign_id)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700">{item.facebook_result || 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700">{item.zoho_result || 0}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-600">{formatCurrency(item.spent)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700">{formatDate(item.data_date)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700">{item.card_display_name || item.card_name || getCardName(item.card_id)}</div>
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
          </div>
        )}
      </div>

      {/* Campaign Data Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 text-center mb-4">
                {editingItem ? 'Edit Campaign Data' : 'Add Campaign Data'}
              </h3>
              
              {/* Error Message in Form */}
              {error && showForm && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                  <div className="flex">
                    <AlertCircle className="h-4 w-4 text-red-400" />
                    <div className="ml-2">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <form onSubmit={handleFormSubmit} className="space-y-4">
                {/* Campaign Dropdown */}
                <div>
                  <label htmlFor="campaign_id" className="block text-sm font-medium text-gray-700">
                    Campaign *
                  </label>
                  <select
                    id="campaign_id"
                    name="campaign_id"
                    value={formData.campaign_id}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2 px-3"
                  >
                    <option value="">Select Campaign</option>
                    {campaigns.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Facebook Result */}
                <div>
                  <label htmlFor="facebook_result" className="block text-sm font-medium text-gray-700">
                    Facebook Result
                  </label>
                  <input
                    type="number"
                    id="facebook_result"
                    name="facebook_result"
                    value={formData.facebook_result}
                    onChange={handleInputChange}
                    min="0"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2 px-3"
                  />
                </div>

                {/* Zoho Result */}
                <div>
                  <label htmlFor="zoho_result" className="block text-sm font-medium text-gray-700">
                    Zoho Result
                  </label>
                  <input
                    type="number"
                    id="zoho_result"
                    name="zoho_result"
                    value={formData.zoho_result}
                    onChange={handleInputChange}
                    min="0"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2 px-3"
                  />
                </div>

                {/* Spent */}
                <div>
                  <label htmlFor="spent" className="block text-sm font-medium text-gray-700">
                    Spent ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    id="spent"
                    name="spent"
                    value={formData.spent}
                    onChange={handleInputChange}
                    min="0"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2 px-3"
                  />
                </div>

                {/* Data Date */}
                <div>
                  <label htmlFor="data_date" className="block text-sm font-medium text-gray-700">
                    Date *
                  </label>
                  <input
                    type="date"
                    id="data_date"
                    name="data_date"
                    value={formData.data_date}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2 px-3"
                  />
                </div>

                {/* Card Dropdown */}
                <div>
                  <label htmlFor="card_id" className="block text-sm font-medium text-gray-700">
                    Card *
                  </label>
                  <select
                    id="card_id"
                    name="card_id"
                    value={formData.card_id}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2 px-3"
                  >
                    <option value="">Select Card</option>
                    {cards.map(card => (
                      <option key={card.id} value={card.id}>{card.card_name}</option>
                    ))}
                  </select>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      setEditingItem(null)
                      setError(null)
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    disabled={formLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    disabled={formLoading || dropdownLoading}
                  >
                    {formLoading ? 'Saving...' : editingItem ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && itemToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-red-600" />
              <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Campaign Data</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this campaign data entry? This action cannot be undone.
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

export default CampaignData
