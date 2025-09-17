import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Eye,
  EyeOff,
  MapPin,
  Users,
  Target,
  Calendar,
  Building,
  Image,
  Video,
  AlertTriangle,
  X
} from 'lucide-react'
import campaignService from '../services/campaignService'
import { formatDate, formatDateTime } from '../utils/dateUtils'
import CampaignForm from '../components/campaigns/CampaignForm'

const CampaignInfo = () => {
  const { id: campaignId } = useParams()
  const navigate = useNavigate()
  
  const [campaign, setCampaign] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Modal states
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (campaignId) {
      fetchCampaign()
    }
  }, [campaignId])

  const fetchCampaign = async () => {
    try {
      setLoading(true)
      setError('')
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
      setLoading(false)
    }
  }

  const handleToggleStatus = async () => {
    try {
      setActionLoading(true)
      const response = await campaignService.toggleCampaignStatus(campaignId)
      if (response.success) {
        setCampaign(prev => ({ ...prev, is_enabled: !prev.is_enabled }))
      } else {
        setError(response.message || 'Failed to update campaign status')
      }
    } catch (error) {
      console.error('Error toggling campaign status:', error)
      setError('Failed to update campaign status. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      setActionLoading(true)
      const response = await campaignService.deleteCampaign(campaignId)
      if (response.success) {
        navigate('/campaigns')
      } else {
        setError(response.message || 'Failed to delete campaign')
      }
    } catch (error) {
      console.error('Error deleting campaign:', error)
      setError('Failed to delete campaign. Please try again.')
    } finally {
      setActionLoading(false)
      setIsDeleteOpen(false)
    }
  }

  const handleEditSave = (savedCampaign) => {
    setCampaign(savedCampaign)
    setIsEditOpen(false)
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

  const displayArray = (array, fallback = 'None specified') => {
    if (!array || array.length === 0) return fallback
    return array
  }

  const getCreativeIcon = (creative) => {
    switch (creative) {
      case 'video':
        return <Video className="h-4 w-4" />
      case 'carousel':
        return <Image className="h-4 w-4" />
      case 'collection':
        return <Image className="h-4 w-4" />
      default:
        return <Image className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Campaign Not Found</h2>
          <button
            onClick={() => navigate('/campaigns')}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Campaigns
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/campaigns')}
            className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Campaigns
          </button>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{campaign.name}</h1>
              <div className="flex items-center space-x-4">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    campaign.is_enabled
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {campaign.is_enabled ? (
                    <Eye className="h-3 w-3 mr-1" />
                  ) : (
                    <EyeOff className="h-3 w-3 mr-1" />
                  )}
                  {campaign.is_enabled ? 'Enabled' : 'Disabled'}
                </span>
                {campaign.brand && (
                  <span className="text-gray-500 text-sm">
                    <Building className="h-4 w-4 inline mr-1" />
                    {campaign.brand}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleToggleStatus}
                disabled={actionLoading}
                className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  campaign.is_enabled
                    ? 'text-red-700 bg-red-100 hover:bg-red-200'
                    : 'text-green-700 bg-green-100 hover:bg-green-200'
                } disabled:opacity-50`}
              >
                {campaign.is_enabled ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-1" />
                    Disable
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-1" />
                    Enable
                  </>
                )}
              </button>
              
              <button
                onClick={() => setIsEditOpen(true)}
                className="inline-flex items-center px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm font-medium transition-colors"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </button>
              
              <button
                onClick={() => setIsDeleteOpen(true)}
                className="inline-flex items-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium transition-colors"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
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

        {/* Campaign Details */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Campaign Details</h2>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Campaign Name</label>
                <p className="text-gray-900 font-medium">{campaign.name}</p>
              </div>

              {campaign.brand && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Brand</label>
                  <p className="text-gray-900">{campaign.brand}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Campaign Type</label>
                <p className="text-gray-900">{campaign.campaign_type_name || 'Unknown'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Creative Format</label>
                <div className="flex items-center">
                  {getCreativeIcon(campaign.creatives)}
                  <span className="ml-2 text-gray-900 capitalize">{campaign.creatives}</span>
                </div>
              </div>

            </div>

            {/* Targeting Information */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Target Personas</label>
                <div className="flex flex-wrap gap-2">
                  {displayArray(parseJsonField(campaign.persona)).length > 0 ? (
                    displayArray(parseJsonField(campaign.persona)).map((persona, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800 border border-purple-200"
                      >
                        <Users className="h-3 w-3 mr-1" />
                        {persona}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm">No personas specified</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Target Gender</label>
                <div className="flex flex-wrap gap-2">
                  {displayArray(parseJsonField(campaign.gender)).length > 0 ? (
                    displayArray(parseJsonField(campaign.gender)).map((gender, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 border border-blue-200 capitalize"
                      >
                        {gender}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm">No gender targeting</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Target Locations</label>
                <div className="flex flex-wrap gap-2">
                  {displayArray(parseJsonField(campaign.location)).length > 0 ? (
                    displayArray(parseJsonField(campaign.location)).map((location, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 border border-green-200"
                      >
                        <MapPin className="h-3 w-3 mr-1" />
                        {location}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm">No location targeting</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Created: {formatDate(campaign.created_at)}
              </div>
              {campaign.updated_at && campaign.updated_at !== campaign.created_at && (
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  Updated: {formatDate(campaign.updated_at)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Performance Section Placeholder */}
        <div className="bg-white rounded-lg shadow-sm mt-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Performance Tracking</h2>
          </div>
          <div className="p-6 text-center text-gray-500">
            <p>Performance tracking and data entry features will be available soon.</p>
            <button 
              onClick={() => navigate(`/campaigns/${campaignId}`)}
              className="mt-3 inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm"
            >
              View Full Campaign Details
            </button>
          </div>
        </div>
      </div>

      {/* Edit Campaign Modal */}
      <CampaignForm
        campaign={campaign}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSave={handleEditSave}
      />

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Delete Campaign</h3>
              </div>
              <p className="mt-3 text-sm text-gray-600">
                Are you sure you want to delete "{campaign.name}"? This action cannot be undone and will remove all associated data.
              </p>
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setIsDeleteOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Deleting...' : 'Delete Campaign'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CampaignInfo
