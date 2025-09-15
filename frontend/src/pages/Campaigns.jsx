import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Eye, Search, Filter, MoreVertical, AlertTriangle, X } from 'lucide-react'
import CampaignForm from '../components/campaigns/CampaignForm'
import campaignService from '../services/campaignService'
import { formatDate, formatDateTime } from '../utils/dateUtils'

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState([])
  const [campaignTypes, setCampaignTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCampaignType, setSelectedCampaignType] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  
  // Loading states for individual operations
  const [operationLoading, setOperationLoading] = useState({
    delete: null,
    toggle: null
  })
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState(null)
  const [deletingCampaign, setDeletingCampaign] = useState(null)
  const [viewingCampaign, setViewingCampaign] = useState(null)

  // Dropdown states
  const [activeDropdown, setActiveDropdown] = useState(null)

  useEffect(() => {
    loadCampaigns()
    loadCampaignTypes()
  }, [])

  const loadCampaigns = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await campaignService.getCampaigns()
      if (response.success) {
        setCampaigns(response.data || [])
      } else {
        setError(response.message || 'Failed to load campaigns')
      }
    } catch (error) {
      console.error('Error loading campaigns:', error)
      setError('Failed to load campaigns. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const loadCampaignTypes = async () => {
    try {
      const response = await campaignService.getCampaignTypes()
      if (response.success) {
        setCampaignTypes(response.data || [])
      }
    } catch (error) {
      console.error('Error loading campaign types:', error)
    }
  }

  const handleCreateCampaign = () => {
    setEditingCampaign(null)
    setIsFormOpen(true)
  }

  const handleEditCampaign = (campaign) => {
    setEditingCampaign(campaign)
    setIsFormOpen(true)
    setActiveDropdown(null)
  }

  const handleDeleteCampaign = (campaign) => {
    setDeletingCampaign(campaign)
    setActiveDropdown(null)
  }

  const confirmDelete = async () => {
    try {
      const response = await campaignService.deleteCampaign(deletingCampaign.id)
      if (response.success) {
        setCampaigns(prev => prev.filter(c => c.id !== deletingCampaign.id))
        setDeletingCampaign(null)
      } else {
        setError(response.message || 'Failed to delete campaign')
      }
    } catch (error) {
      console.error('Error deleting campaign:', error)
      setError('Failed to delete campaign. Please try again.')
    }
  }

  const handleToggleStatus = async (campaign) => {
    try {
      const response = await campaignService.toggleCampaignStatus(campaign.id)
      if (response.success) {
        setCampaigns(prev => 
          prev.map(c => 
            c.id === campaign.id 
              ? { ...c, is_enabled: !c.is_enabled }
              : c
          )
        )
      } else {
        setError(response.message || 'Failed to update campaign status')
      }
    } catch (error) {
      console.error('Error toggling campaign status:', error)
      setError('Failed to update campaign status. Please try again.')
    }
    setActiveDropdown(null)
  }

  const handleFormSave = (savedCampaign) => {
    if (editingCampaign) {
      // Update existing campaign
      setCampaigns(prev => 
        prev.map(c => c.id === savedCampaign.id ? savedCampaign : c)
      )
    } else {
      // Add new campaign
      setCampaigns(prev => [savedCampaign, ...prev])
    }
  }

  const handleViewCampaign = (campaign) => {
    setViewingCampaign(campaign)
    setActiveDropdown(null)
  }

  // Filter campaigns based on search and filters
  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (campaign.brand && campaign.brand.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesType = !selectedCampaignType || 
                        campaign.campaign_type_id === parseInt(selectedCampaignType)
    
    const matchesStatus = !statusFilter || 
                         (statusFilter === 'enabled' && campaign.is_enabled) ||
                         (statusFilter === 'disabled' && !campaign.is_enabled)
    
    return matchesSearch && matchesType && matchesStatus
  })

  const getCampaignTypeName = (typeId) => {
    const type = campaignTypes.find(t => t.id === typeId)
    return type ? type.type_name : 'Unknown'
  }

  const parseJsonField = (field) => {
    if (!field) return []
    if (Array.isArray(field)) return field
    try {
      return JSON.parse(field)
    } catch {
      return []
    }
  }

  // Helper function to display persona as text (no parsing needed now)
  const displayPersona = (persona) => {
    if (!persona) return 'N/A'
    return persona // Persona is now stored as plain text
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Click outside to close dropdowns */}
        {activeDropdown && (
          <div
            className="fixed inset-0 z-10"
            onClick={() => setActiveDropdown(null)}
          ></div>
        )}
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
            <p className="text-gray-600 mt-1">Manage your advertising campaigns</p>
          </div>
          <button
            onClick={handleCreateCampaign}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span>New Campaign</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            {/* Campaign Type Filter */}
            <div>
              <select
                value={selectedCampaignType}
                onChange={(e) => setSelectedCampaignType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">All Campaign Types</option>
                {campaignTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.type_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="">All Statuses</option>
                <option value="enabled">Enabled</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>

            {/* Clear Filters */}
            <div>
              <button
                onClick={() => {
                  setSearchTerm('')
                  setSelectedCampaignType('')
                  setStatusFilter('')
                }}
                className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
                <button
                  onClick={() => setError('')}
                  className="mt-2 text-sm text-red-600 underline hover:text-red-800"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Campaigns List */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {filteredCampaigns.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Filter className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns found</h3>
              <p className="text-gray-600 mb-4">
                {campaigns.length === 0 
                  ? "Get started by creating your first campaign."
                  : "Try adjusting your search or filter criteria."
                }
              </p>
              {campaigns.length === 0 && (
                <button
                  onClick={handleCreateCampaign}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Create Campaign
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Campaign
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Targeting
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Creative
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
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
                  {filteredCampaigns.map((campaign) => (
                    <tr key={campaign.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                          {campaign.brand && (
                            <div className="text-sm text-gray-500">{campaign.brand}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {getCampaignTypeName(campaign.campaign_type_id)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {campaign.age && <div>Age: {campaign.age}</div>}
                          <div className="text-xs text-gray-500">
                            Gender: {parseJsonField(campaign.gender).join(', ') || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500 truncate max-w-xs">
                            {campaign.location || 'N/A'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                          {campaign.creatives}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            campaign.is_enabled
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {campaign.is_enabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(campaign.created_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {/* View Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewCampaign(campaign)
                            }}
                            className="text-blue-500 hover:text-blue-700 p-1 rounded-md hover:bg-blue-50 transition-colors"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          
                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditCampaign(campaign)
                            }}
                            className="text-yellow-500 hover:text-yellow-700 p-1 rounded-md hover:bg-yellow-50 transition-colors"
                            title="Edit Campaign"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          
                          {/* Toggle Status Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleStatus(campaign)
                            }}
                            className={`p-1 rounded-md transition-colors ${
                              campaign.is_enabled 
                                ? 'text-red-500 hover:text-red-700 hover:bg-red-50' 
                                : 'text-green-500 hover:text-green-700 hover:bg-green-50'
                            }`}
                            title={campaign.is_enabled ? 'Disable Campaign' : 'Enable Campaign'}
                          >
                            <div className={`h-4 w-4 rounded-full ${
                              campaign.is_enabled ? 'bg-red-500' : 'bg-green-500'
                            }`}></div>
                          </button>
                          
                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteCampaign(campaign)
                            }}
                            className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50 transition-colors"
                            title="Delete Campaign"
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

        {/* Results Summary */}
        {filteredCampaigns.length > 0 && (
          <div className="mt-4 text-sm text-gray-600 text-center">
            Showing {filteredCampaigns.length} of {campaigns.length} campaigns
          </div>
        )}
      </div>

      {/* Campaign Form Modal */}
      <CampaignForm
        campaign={editingCampaign}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditingCampaign(null)
        }}
        onSave={handleFormSave}
      />

      {/* View Campaign Modal */}
      {viewingCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Campaign Details</h2>
              <button
                onClick={() => setViewingCampaign(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Campaign Name</label>
                <p className="mt-1 text-sm text-gray-900">{viewingCampaign.name}</p>
              </div>
              {viewingCampaign.brand && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Brand</label>
                  <p className="mt-1 text-sm text-gray-900">{viewingCampaign.brand}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-500">Campaign Type</label>
                <p className="mt-1 text-sm text-gray-900">{getCampaignTypeName(viewingCampaign.campaign_type_id)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Persona</label>
                <p className="mt-1 text-sm text-gray-900">{displayPersona(viewingCampaign.persona)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Gender</label>
                <p className="mt-1 text-sm text-gray-900">{parseJsonField(viewingCampaign.gender).join(', ') || 'N/A'}</p>
              </div>
              {viewingCampaign.age && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Target Age</label>
                  <p className="mt-1 text-sm text-gray-900">{viewingCampaign.age}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-500">Locations</label>
                <p className="mt-1 text-sm text-gray-900">{viewingCampaign.location || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Creatives</label>
                <p className="mt-1 text-sm text-gray-900 capitalize">{viewingCampaign.creatives}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Status</label>
                <p className={`mt-1 text-sm font-medium ${viewingCampaign.is_enabled ? 'text-green-600' : 'text-red-600'}`}>
                  {viewingCampaign.is_enabled ? 'Enabled' : 'Disabled'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">Created</label>
                <p className="mt-1 text-sm text-gray-900">{formatDateTime(viewingCampaign.created_at)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Delete Campaign</h3>
              </div>
              <p className="mt-3 text-sm text-gray-600">
                Are you sure you want to delete "{deletingCampaign.name}"? This action cannot be undone.
              </p>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setDeletingCampaign(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default Campaigns
