import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  AlertCircle,
  RefreshCw,
  Calendar,
  IndianRupee,
  BarChart3,
  TrendingUp,
  DollarSign
} from 'lucide-react'
import campaignDataService from '../services/campaignDataService'
import campaignService from '../services/campaignService'
import { formatDate, formatDateForInput, formatDateTime } from '../utils/dateUtils'

const CampaignDetail = () => {
  const { id: campaignId } = useParams()
  const navigate = useNavigate()
  
  // Campaign Details State
  const [campaign, setCampaign] = useState(null)
  const [campaignLoading, setCampaignLoading] = useState(true)
  
  // Campaign Data State
  const [campaignData, setCampaignData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Form states (for adding/editing campaign data)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formLoading, setFormLoading] = useState(false)

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Dropdown data for form
  const [cards, setCards] = useState([])
  const [dropdownLoading, setDropdownLoading] = useState(false)

  // Date filtering state (store in dd/mm/yyyy format for display)
  const [dateFilter, setDateFilter] = useState({
    from: '',
    to: ''
  })

  // Form data
  const [formData, setFormData] = useState({
    facebook_result: '',
    zoho_result: '',
    spent: '',
    data_date: '',
    card_id: ''
  })

  // Get yesterday's date in YYYY-MM-DD format for HTML date input
  function getYesterdayForInput() {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    // Format date as yyyy-mm-dd for HTML date input
    const year = yesterday.getFullYear()
    const month = String(yesterday.getMonth() + 1).padStart(2, '0')
    const day = String(yesterday.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Get current month date range
  const getCurrentMonthRange = () => {
    const now = new Date()
    
    // Get first day of current month
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    
    // Get last day of current month
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    // Format dates without timezone conversion
    const formatLocalDate = (date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    
    const range = {
      from: formatLocalDate(firstDay),
      to: formatLocalDate(lastDay)
    }
    
    console.log('Current month range:', range) // Debug log
    return range
  }

  // Fetch campaign details
  const fetchCampaign = async () => {
    try {
      setCampaignLoading(true)
      const response = await campaignService.getCampaign(campaignId)
      if (response.success && response.data) {
        setCampaign(response.data)
      } else {
        setError('Campaign not found')
      }
    } catch (err) {
      console.error('Error fetching campaign:', err)
      setError('Failed to load campaign details')
    } finally {
      setCampaignLoading(false)
    }
  }

  // Helper function to parse JSON arrays
  const parseJsonArray = (value) => {
    if (!value) return []
    if (Array.isArray(value)) return value
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  // Fetch campaign data for this specific campaign
  const fetchCampaignData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = {
        search: searchTerm,
        page: currentPage,
        limit: itemsPerPage,
        date_from: formatToAPIDate(dateFilter.from),
        date_to: formatToAPIDate(dateFilter.to)
      }
      
      const response = await campaignDataService.getByCampaignId(campaignId, params)
      
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

  // Fetch cards for dropdown
  const fetchCards = async () => {
    try {
      setDropdownLoading(true)
      const response = await campaignDataService.getCardsForDropdown()
      if (response.success) {
        setCards(response.data || [])
      }
    } catch (err) {
      console.error('Error fetching cards:', err)
    } finally {
      setDropdownLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    if (campaignId) {
      fetchCampaign()
      fetchCards()
    }
  }, [campaignId])

  // Fetch data when filters change
  useEffect(() => {
    if (campaignId && 
        isValidDate(dateFilter.from) && 
        isValidDate(dateFilter.to)) {
      fetchCampaignData()
    }
  }, [campaignId, searchTerm, currentPage, dateFilter])

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
      if (!formData.card_id || !formData.data_date) {
        setError('Card and Date are required fields')
        return
      }
      
      const submitData = {
        campaign_id: parseInt(campaignId),
        facebook_result: parseInt(formData.facebook_result) || 0,
        zoho_result: parseInt(formData.zoho_result) || 0,
        spent: parseFloat(formData.spent) || 0,
        data_date: formData.data_date, // data_date is already in yyyy-mm-dd format from HTML date input
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
    setError(null)
    setEditingItem(item)
    setFormData({
      facebook_result: item.facebook_result?.toString() || '',
      zoho_result: item.zoho_result?.toString() || '',
      spent: item.spent?.toString() || '',
      data_date: item.data_date || '', // data_date is already in YYYY-MM-DD format from API
      card_id: item.card_id?.toString() || ''
    })
    setShowForm(true)
  }

  // Open create form
  const handleCreate = () => {
    setError(null)
    setEditingItem(null)
    setFormData({
      facebook_result: '',
      zoho_result: '',
      spent: '',
      data_date: getYesterdayForInput(),
      card_id: ''
    })
    setShowForm(true)
  }

  // Open delete confirmation
  const handleDeleteClick = (item) => {
    setItemToDelete(item)
    setShowDeleteConfirm(true)
  }

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return '₹0.00'
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(parseFloat(amount))
  }

  // Get card name by ID
  const getCardName = (id) => {
    const card = cards.find(c => c.id === id)
    return card ? card.card_name : '-'
  }

  // Convert various date formats to dd/mm/yyyy
  const formatToDisplayDate = (dateStr) => {
    if (!dateStr) return ''
    
    // Handle ISO date strings (2025-09-17T18:30:00.000Z or 2025-09-17)
    if (dateStr.includes('T') || dateStr.includes('-')) {
      try {
        const date = new Date(dateStr)
        if (!isNaN(date.getTime())) {
          const day = String(date.getDate()).padStart(2, '0')
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const year = date.getFullYear()
          return `${day}/${month}/${year}`
        }
      } catch (e) {
        console.error('Error parsing date:', dateStr, e)
      }
    }
    
    // Handle YYYY-MM-DD format
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateStr.split('-')
      return `${day}/${month}/${year}`
    }
    
    // If already in DD/MM/YYYY format or partial format, return as is
    return dateStr
  }

  // Convert dd/mm/yyyy to yyyy-mm-dd for API
  const formatToAPIDate = (dateStr) => {
    if (!dateStr) return ''
    const [day, month, year] = dateStr.split('/')
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  // Validate date format dd/mm/yyyy
  const isValidDate = (dateStr) => {
    if (!dateStr) return false
    const parts = dateStr.split('/')
    if (parts.length !== 3) return false
    const [day, month, year] = parts
    const dayNum = parseInt(day, 10)
    const monthNum = parseInt(month, 10)
    const yearNum = parseInt(year, 10)
    
    if (isNaN(dayNum) || isNaN(monthNum) || isNaN(yearNum)) return false
    if (dayNum < 1 || dayNum > 31) return false
    if (monthNum < 1 || monthNum > 12) return false
    if (yearNum < 1900 || yearNum > 2100) return false
    
    // Check if date is valid
    const date = new Date(yearNum, monthNum - 1, dayNum)
    return date.getFullYear() === yearNum && 
           date.getMonth() === monthNum - 1 && 
           date.getDate() === dayNum
  }

  // Set default date filter to current month
  useEffect(() => {
    const currentMonthRange = getCurrentMonthRange()
    setDateFilter({
      from: formatToDisplayDate(currentMonthRange.from),
      to: formatToDisplayDate(currentMonthRange.to)
    })
  }, [])

  // Handle date input change with formatting
  const handleDateChange = (field, value) => {
    // Remove any non-numeric characters except /
    let cleaned = value.replace(/[^0-9/]/g, '')
    
    // Auto-format as user types
    if (cleaned.length >= 2 && cleaned.charAt(2) !== '/') {
      if (cleaned.length === 2) {
        cleaned = cleaned + '/'
      } else if (cleaned.length > 2 && cleaned.length <= 4) {
        cleaned = cleaned.substring(0, 2) + '/' + cleaned.substring(2)
      }
    }
    
    if (cleaned.length >= 5 && cleaned.charAt(5) !== '/') {
      if (cleaned.length === 5) {
        cleaned = cleaned + '/'
      } else if (cleaned.length > 5) {
        const parts = cleaned.split('/')
        if (parts.length === 2) {
          cleaned = parts[0] + '/' + parts[1].substring(0, 2) + '/' + parts[1].substring(2)
        }
      }
    }
    
    // Limit to dd/mm/yyyy format (10 characters)
    if (cleaned.length <= 10) {
      setDateFilter(prev => ({ ...prev, [field]: cleaned }))
    }
  }

  // Handle date picker change (when user clicks calendar icon)
  const handleDatePickerChange = (field, value) => {
    if (value) {
      setDateFilter(prev => ({ ...prev, [field]: formatToDisplayDate(value) }))
    }
  }

  // Handle form date input change with formatting (DD/MM/YYYY)
  const handleFormDateChange = (value) => {
    // Remove any non-numeric characters except /
    let cleaned = value.replace(/[^0-9/]/g, '')
    
    // Auto-format as user types
    if (cleaned.length >= 2 && cleaned.charAt(2) !== '/') {
      if (cleaned.length === 2) {
        cleaned = cleaned + '/'
      } else if (cleaned.length > 2 && cleaned.length <= 4) {
        cleaned = cleaned.substring(0, 2) + '/' + cleaned.substring(2)
      }
    }
    
    if (cleaned.length >= 5 && cleaned.charAt(5) !== '/') {
      if (cleaned.length === 5) {
        cleaned = cleaned + '/'
      } else if (cleaned.length > 5) {
        const parts = cleaned.split('/')
        if (parts.length === 2) {
          cleaned = parts[0] + '/' + parts[1].substring(0, 2) + '/' + parts[1].substring(2)
        }
      }
    }
    
    // Limit to dd/mm/yyyy format (10 characters)
    if (cleaned.length <= 10) {
      // Convert DD/MM/YYYY back to YYYY-MM-DD for form data storage
      if (isValidDate(cleaned)) {
        const apiDate = formatToAPIDate(cleaned)
        setFormData(prev => ({ ...prev, data_date: apiDate }))
      } else {
        // For partial input, just store the display format temporarily
        // We'll validate on submit
        setFormData(prev => ({ ...prev, data_date: cleaned }))
      }
    }
  }

  // Handle form date picker change (when user clicks calendar icon)
  const handleFormDatePickerChange = (value) => {
    if (value) {
      setFormData(prev => ({ ...prev, data_date: value }))
    }
  }

  if (campaignLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Campaign Not Found</h2>
          <button
            onClick={() => navigate('/campaigns')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Campaigns
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header with back button */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/campaigns')}
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Campaigns
        </button>
        
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{campaign.name}</h1>
        </div>
      </div>



      {/* Performance Data Section */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Performance Data</h2>
            <button
              onClick={handleCreate}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Data Entry
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="p-6 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Date From */}
            <div>
              <label htmlFor="date_from" className="block text-xs font-medium text-gray-700 mb-1">
                From Date (DD/MM/YYYY)
              </label>
              <div className="relative">
                <Calendar 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 cursor-pointer z-10" 
                  onClick={() => document.getElementById('date_from_picker').showPicker && document.getElementById('date_from_picker').showPicker()}
                />
                <input
                  type="text"
                  id="date_from"
                  value={dateFilter.from}
                  onChange={(e) => handleDateChange('from', e.target.value)}
                  placeholder="DD/MM/YYYY"
                  className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2"
                />
                <input
                  type="date"
                  id="date_from_picker"
                  className="absolute opacity-0 pointer-events-none"
                  onChange={(e) => handleDatePickerChange('from', e.target.value)}
                  tabIndex={-1}
                />
              </div>
            </div>

            {/* Date To */}
            <div>
              <label htmlFor="date_to" className="block text-xs font-medium text-gray-700 mb-1">
                To Date (DD/MM/YYYY)
              </label>
              <div className="relative">
                <Calendar 
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 cursor-pointer z-10" 
                  onClick={() => document.getElementById('date_to_picker').showPicker && document.getElementById('date_to_picker').showPicker()}
                />
                <input
                  type="text"
                  id="date_to"
                  value={dateFilter.to}
                  onChange={(e) => handleDateChange('to', e.target.value)}
                  placeholder="DD/MM/YYYY"
                  className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2"
                />
                <input
                  type="date"
                  id="date_to_picker"
                  className="absolute opacity-0 pointer-events-none"
                  onChange={(e) => handleDatePickerChange('to', e.target.value)}
                  tabIndex={-1}
                />
              </div>
            </div>

            {/* Search */}
            <div>
              <label htmlFor="search" className="block text-xs font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  id="search"
                  placeholder="Search data..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2"
                />
              </div>
            </div>

            {/* Refresh Button */}
            <div className="flex items-end">
              <button
                onClick={fetchCampaignData}
                disabled={loading}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="mt-2 text-sm text-red-600 underline hover:text-red-800"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
              <p className="text-gray-500 mt-2">Loading performance data...</p>
            </div>
          ) : campaignData.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <BarChart3 className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No performance data yet</h3>
              <p className="text-gray-500 mb-4">Start tracking your campaign performance by adding data entries.</p>
              <button
                onClick={handleCreate}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Entry
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
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
                      Card
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {campaignData.map((item) => {
                    const facebookResult = parseInt(item.facebook_result) || 0
                    const zohoResult = parseInt(item.zoho_result) || 0
                    
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{formatDate(item.data_date)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-700">{facebookResult}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-700">{zohoResult}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-green-600">{formatCurrency(item.spent)}</div>
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
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Campaign Data Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 text-center mb-4">
                {editingItem ? 'Edit Performance Data' : 'Add Performance Data'}
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
                    Spent (₹)
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
                    Date * (DD/MM/YYYY)
                  </label>
                  <div className="relative">
                    <Calendar 
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 cursor-pointer z-10" 
                      onClick={() => document.getElementById('form_date_picker').showPicker && document.getElementById('form_date_picker').showPicker()}
                    />
                    <input
                      type="text"
                      id="data_date"
                      name="data_date"
                      value={formData.data_date ? formatToDisplayDate(formData.data_date) : ''}
                      onChange={(e) => handleFormDateChange(e.target.value)}
                      placeholder="DD/MM/YYYY"
                      required
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2 px-3 pl-10"
                    />
                    <input
                      type="date"
                      id="form_date_picker"
                      className="absolute opacity-0 pointer-events-none"
                      onChange={(e) => handleFormDatePickerChange(e.target.value)}
                      tabIndex={-1}
                    />
                  </div>
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
              <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Performance Data</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this performance data entry? This action cannot be undone.
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

export default CampaignDetail
