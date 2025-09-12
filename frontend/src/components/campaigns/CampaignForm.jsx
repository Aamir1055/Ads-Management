import React, { useState, useEffect } from 'react'
import { X, Save, AlertCircle } from 'lucide-react'
import campaignService from '../../services/campaignService'

const CampaignForm = ({ campaign = null, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    persona: '', // Changed to string for comma-separated values
    gender: [],
    age: '',
    location: '',
    creatives: 'image',
    campaign_type_id: '',
    brand: '',
    is_enabled: true
  })

  const [campaignTypes, setCampaignTypes] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState({})

  const personaOptions = [
    'Young Adults (18-25)',
    'Professionals (26-35)',
    'Parents (30-45)', 
    'Seniors (45+)',
    'Students',
    'Entrepreneurs',
    'Homemakers',
    'Tech Enthusiasts'
  ]

  const genderOptions = [
    { id: 'male', label: 'Male' },
    { id: 'female', label: 'Female' },
    { id: 'other', label: 'Other' }
  ]

  const creativeOptions = [
    { value: 'image', label: 'Images' },
    { value: 'video', label: 'Videos' },
    { value: 'carousel', label: 'Carousel' },
    { value: 'collection', label: 'Collection' }
  ]

  useEffect(() => {
    if (isOpen) {
      loadCampaignTypes()
      if (campaign) {
        setFormData({
          name: campaign.name || '',
          persona: campaign.persona || '', // Handle persona as text
          gender: Array.isArray(campaign.gender) ? campaign.gender : 
                  (campaign.gender ? JSON.parse(campaign.gender) : []),
          age: campaign.age || '',
          location: campaign.location || '',
          creatives: campaign.creatives || 'image',
          campaign_type_id: campaign.campaign_type_id || '',
          brand: campaign.brand || '',
          is_enabled: campaign.is_enabled !== undefined ? !!campaign.is_enabled : true
        })
      } else {
        // Reset form for new campaign
        setFormData({
          name: '',
          persona: '', // Reset persona as empty string
          gender: [],
          age: '',
          location: '',
          creatives: 'image',
          campaign_type_id: '',
          brand: '',
          is_enabled: true
        })
      }
      setError('')
      setValidationErrors({})
    }
  }, [isOpen, campaign])

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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: null
      }))
    }
  }

  const handleCheckboxChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }))
  }

  const handleLocationChange = (e) => {
    const value = e.target.value
    setFormData(prev => ({
      ...prev,
      location: value
    }))
  }

  const validateForm = () => {
    const errors = {}

    if (!formData.name.trim()) {
      errors.name = 'Campaign name is required'
    }

    if (!formData.campaign_type_id) {
      errors.campaign_type_id = 'Campaign type is required'
    }

    if (!formData.persona.trim()) {
      errors.persona = 'Persona is required'
    }

    if (formData.gender.length === 0) {
      errors.gender = 'At least one gender must be selected'
    }

    if (!formData.location.trim()) {
      errors.location = 'Location is required'
    }

    if (formData.age && (isNaN(formData.age) || formData.age < 1 || formData.age > 120)) {
      errors.age = 'Please enter a valid age (1-120)'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const submitData = {
        ...formData,
        persona: formData.persona.trim(), // Send persona as plain text
        gender: JSON.stringify(formData.gender),
        age: formData.age ? parseInt(formData.age) : null,
        campaign_type_id: parseInt(formData.campaign_type_id)
      }

      let response
      if (campaign) {
        response = await campaignService.updateCampaign(campaign.id, submitData)
      } else {
        response = await campaignService.createCampaign(submitData)
      }

      if (response.success) {
        onSave(response.data)
        onClose()
      } else {
        setError(response.message || 'Failed to save campaign')
      }
    } catch (error) {
      console.error('Error saving campaign:', error)
      setError(error.response?.data?.message || 'Failed to save campaign. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {campaign ? 'Edit Campaign' : 'Create New Campaign'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Campaign Name */}
            <div className="md:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Campaign Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  validationErrors.name ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-purple-500'
                }`}
                placeholder="Enter campaign name"
              />
              {validationErrors.name && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
              )}
            </div>

            {/* Brand */}
            <div>
              <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">
                Brand
              </label>
              <input
                type="text"
                id="brand"
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Enter brand name"
              />
            </div>

            {/* Campaign Type */}
            <div>
              <label htmlFor="campaign_type_id" className="block text-sm font-medium text-gray-700 mb-1">
                Campaign Type *
              </label>
              <select
                id="campaign_type_id"
                name="campaign_type_id"
                value={formData.campaign_type_id}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  validationErrors.campaign_type_id ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-purple-500'
                }`}
              >
                <option value="">Select Campaign Type</option>
                {campaignTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.type_name}
                  </option>
                ))}
              </select>
              {validationErrors.campaign_type_id && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.campaign_type_id}</p>
              )}
            </div>

            {/* Age */}
            <div>
              <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
                Target Age
              </label>
              <input
                type="number"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                min="1"
                max="120"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  validationErrors.age ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-purple-500'
                }`}
                placeholder="Enter target age"
              />
              {validationErrors.age && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.age}</p>
              )}
            </div>

            {/* Creatives */}
            <div>
              <label htmlFor="creatives" className="block text-sm font-medium text-gray-700 mb-1">
                Creatives
              </label>
              <select
                id="creatives"
                name="creatives"
                value={formData.creatives}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                {creativeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Persona */}
            <div className="md:col-span-2">
              <label htmlFor="persona" className="block text-sm font-medium text-gray-700 mb-1">
                Persona * <span className="text-sm text-gray-500">(separate multiple values with commas)</span>
              </label>
              <input
                type="text"
                id="persona"
                name="persona"
                value={formData.persona}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  validationErrors.persona ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-purple-500'
                }`}
                placeholder="Young Adults (18-25), Professionals (26-35), Parents (30-45)..."
              />
              <div className="mt-2 text-xs text-gray-500">
                <strong>Suggested values:</strong> {personaOptions.join(', ')}
              </div>
              {validationErrors.persona && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.persona}</p>
              )}
            </div>

            {/* Gender */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender *
              </label>
              <div className="flex space-x-6">
                {genderOptions.map((gender) => (
                  <label key={gender.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.gender.includes(gender.id)}
                      onChange={() => handleCheckboxChange('gender', gender.id)}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700">{gender.label}</span>
                  </label>
                ))}
              </div>
              {validationErrors.gender && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.gender}</p>
              )}
            </div>

            {/* Location */}
            <div className="md:col-span-2">
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Locations * <span className="text-sm text-gray-500">(separate multiple locations with commas)</span>
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleLocationChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  validationErrors.location ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-purple-500'
                }`}
                placeholder="Delhi, Mumbai, Bangalore, Chennai..."
              />
              {validationErrors.location && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.location}</p>
              )}
            </div>

            {/* Enable/Disable Toggle */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between">
                <label htmlFor="is_enabled" className="block text-sm font-medium text-gray-700">
                  Campaign Status
                </label>
                <div className="flex items-center space-x-3">
                  <span className={`text-sm ${formData.is_enabled ? 'text-gray-500' : 'text-gray-900 font-medium'}`}>
                    Disabled
                  </span>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, is_enabled: !prev.is_enabled }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                      formData.is_enabled ? 'bg-purple-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.is_enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className={`text-sm ${formData.is_enabled ? 'text-purple-600 font-medium' : 'text-gray-500'}`}>
                    Enabled
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>{campaign ? 'Update Campaign' : 'Create Campaign'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CampaignForm
