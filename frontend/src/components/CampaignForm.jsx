import React, { useState, useEffect } from 'react'
import { X, Plus, Minus, AlertCircle, Loader } from 'lucide-react'
import campaignService from '../services/campaignService'

const CampaignForm = ({ 
  campaign = null, 
  isOpen, 
  onClose, 
  onSave, 
  isLoading = false 
}) => {
  console.log('🚀 CampaignForm rendered with:', { campaign, isOpen })
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    persona: [],
    gender: [],
    min_age: '',
    max_age: '',
    location: [],
    creatives: 'image',
    enabled: true,
    campaign_type_id: '',
    brand: ''
  })

  // Input states for tag fields
  const [personaInput, setPersonaInput] = useState('')
  const [locationInput, setLocationInput] = useState('')

  // Loading states
  const [campaignTypes, setCampaignTypes] = useState([])
  const [brands, setBrands] = useState([])
  const [loadingDropdowns, setLoadingDropdowns] = useState(false)

  // Error state
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  // Available options
  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' }
  ]

  const creativesOptions = [
    { value: 'image', label: 'Image' },
    { value: 'video', label: 'Video' },
    { value: 'carousel', label: 'Carousel' },
    { value: 'collection', label: 'Collection' }
  ]

  // Initialize form data when campaign prop changes
  useEffect(() => {
    if (campaign) {
      console.log('🔧 Initializing form with campaign data:', campaign)
      const brandId = (typeof campaign.brand === 'object' && campaign.brand?.id) ? campaign.brand.id.toString() : (campaign.brand ? campaign.brand.toString() : '')
      console.log('🔧 Extracted brand ID:', brandId, 'from brand:', campaign.brand)
      
      setFormData({
        name: campaign.name || '',
        persona: Array.isArray(campaign.persona) ? campaign.persona : [],
        gender: Array.isArray(campaign.gender) ? campaign.gender : [],
        min_age: campaign.min_age?.toString() || '',
        max_age: campaign.max_age?.toString() || '',
        location: Array.isArray(campaign.location) ? campaign.location : [],
        creatives: campaign.creatives || 'image',
        enabled: Boolean(campaign.enabled || campaign.is_enabled),
        campaign_type_id: campaign.campaign_type_id?.toString() || '',
        brand: brandId
      })
    } else {
      // Reset form for new campaign
      setFormData({
        name: '',
        persona: [],
        gender: [],
        min_age: '',
        max_age: '',
        location: [],
        creatives: 'image',
        enabled: true,
        campaign_type_id: '',
        brand: ''
      })
    }
  }, [campaign])

  // Re-initialize form data when brands load (in case form was initialized before brands were loaded)
  useEffect(() => {
    if (campaign && brands.length > 0 && !loadingDropdowns) {
      const brandId = (typeof campaign.brand === 'object' && campaign.brand?.id) ? campaign.brand.id.toString() : (campaign.brand ? campaign.brand.toString() : '')
      console.log('🔧 Re-setting brand after brands loaded. Brand ID:', brandId, 'Available brands:', brands.length)
      
      setFormData(prev => ({
        ...prev,
        brand: brandId
      }))
    }
  }, [campaign, brands, loadingDropdowns])

  // Load dropdown data
  useEffect(() => {
    if (isOpen) {
      loadDropdownData()
    }
  }, [isOpen])

  const loadDropdownData = async () => {
    try {
      setLoadingDropdowns(true)
      
      // Load campaign types and brands in parallel
      const [campaignTypesResponse, brandsResponse] = await Promise.all([
        campaignService.getCampaignTypes(),
        campaignService.getBrands()
      ])

      if (campaignTypesResponse.success) {
        setCampaignTypes(campaignTypesResponse.data || [])
      }
      
      if (brandsResponse.success) {
        console.log('🏢 Loaded brands:', brandsResponse.data)
        setBrands(brandsResponse.data || [])
      }
    } catch (err) {
      console.error('Error loading dropdown data:', err)
      setError('Failed to load form options')
    } finally {
      setLoadingDropdowns(false)
    }
  }

  // Handle basic input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  // Handle gender checkbox changes
  const handleGenderChange = (genderValue) => {
    setFormData(prev => {
      const currentGender = prev.gender || []
      const isSelected = currentGender.includes(genderValue)
      
      if (isSelected) {
        return {
          ...prev,
          gender: currentGender.filter(g => g !== genderValue)
        }
      } else {
        return {
          ...prev,
          gender: [...currentGender, genderValue]
        }
      }
    })
  }

  // Handle tag field additions
  const addTag = (field, value) => {
    if (!value.trim()) return
    
    setFormData(prev => {
      const currentArray = prev[field] || []
      if (!currentArray.includes(value.trim())) {
        return {
          ...prev,
          [field]: [...currentArray, value.trim()]
        }
      }
      return prev
    })
    
    // Clear input
    if (field === 'persona') setPersonaInput('')
    if (field === 'location') setLocationInput('')
  }

  // Handle tag removal
  const removeTag = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  // Handle key press for tag inputs
  const handleTagKeyPress = (e, field, value) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag(field, value)
    }
  }

  // Form validation
  const validateForm = () => {
    const errors = {}
    
    if (!formData.name.trim()) {
      errors.name = 'Campaign name is required'
    }
    
    if (formData.min_age && formData.max_age) {
      const minAge = parseInt(formData.min_age)
      const maxAge = parseInt(formData.max_age)
      
      if (minAge > maxAge) {
        errors.max_age = 'Maximum age cannot be less than minimum age'
      }
    }
    
    if (formData.min_age && (parseInt(formData.min_age) < 0 || parseInt(formData.min_age) > 100)) {
      errors.min_age = 'Age must be between 0 and 100'
    }
    
    if (formData.max_age && (parseInt(formData.max_age) < 0 || parseInt(formData.max_age) > 100)) {
      errors.max_age = 'Age must be between 0 and 100'
    }
    
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!validateForm()) {
      return
    }

    try {
      const submitData = {
        name: formData.name.trim(),
        persona: formData.persona.length > 0 ? formData.persona : null,
        gender: formData.gender.length > 0 ? formData.gender : null,
        min_age: formData.min_age ? parseInt(formData.min_age) : null,
        max_age: formData.max_age ? parseInt(formData.max_age) : null,
        location: formData.location.length > 0 ? formData.location : null,
        creatives: formData.creatives,
        is_enabled: formData.enabled,
        campaign_type_id: formData.campaign_type_id ? parseInt(formData.campaign_type_id) : null,
        brand: formData.brand ? parseInt(formData.brand) : null
      }

      await onSave(submitData)
    } catch (err) {
      console.error('Error saving campaign:', err)
      setError(err.message || 'Failed to save campaign')
    }
  }

  if (!isOpen) {
    console.log('❌ CampaignForm not open, returning null')
    return null
  }
  
  console.log('🎯 CampaignForm rendering form with formData:', formData)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {campaign ? 'Edit Campaign' : 'Create New Campaign'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Campaign Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    fieldErrors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter campaign name"
                  disabled={isLoading}
                  required
                />
                {fieldErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>
                )}
              </div>

              {/* Personas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Personas
                </label>
                <div className="space-y-2">
                  <div className="flex">
                    <input
                      type="text"
                      value={personaInput}
                      onChange={(e) => setPersonaInput(e.target.value)}
                      onKeyPress={(e) => handleTagKeyPress(e, 'persona', personaInput)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Add persona (press Enter)"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => addTag('persona', personaInput)}
                      className="px-3 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      disabled={isLoading}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  {formData.persona.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.persona.map((persona, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800"
                        >
                          {persona}
                          <button
                            type="button"
                            onClick={() => removeTag('persona', index)}
                            className="ml-1 text-purple-600 hover:text-purple-800"
                            disabled={isLoading}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Gender Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender Targeting
                </label>
                <div className="space-y-2">
                  {genderOptions.map((option) => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.gender.includes(option.value)}
                        onChange={() => handleGenderChange(option.value)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        disabled={isLoading}
                      />
                      <span className="ml-2 text-sm text-gray-900">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Age Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="min_age" className="block text-sm font-medium text-gray-700 mb-2">
                    Min Age
                  </label>
                  <input
                    type="number"
                    id="min_age"
                    name="min_age"
                    value={formData.min_age}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      fieldErrors.min_age ? 'border-red-300' : 'border-gray-300'
                    }`}
                    min="0"
                    max="100"
                    placeholder="18"
                    disabled={isLoading}
                  />
                  {fieldErrors.min_age && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.min_age}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="max_age" className="block text-sm font-medium text-gray-700 mb-2">
                    Max Age
                  </label>
                  <input
                    type="number"
                    id="max_age"
                    name="max_age"
                    value={formData.max_age}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      fieldErrors.max_age ? 'border-red-300' : 'border-gray-300'
                    }`}
                    min="0"
                    max="100"
                    placeholder="65"
                    disabled={isLoading}
                  />
                  {fieldErrors.max_age && (
                    <p className="mt-1 text-sm text-red-600">{fieldErrors.max_age}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Locations */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Locations
                </label>
                <div className="space-y-2">
                  <div className="flex">
                    <input
                      type="text"
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                      onKeyPress={(e) => handleTagKeyPress(e, 'location', locationInput)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Add location (press Enter)"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => addTag('location', locationInput)}
                      className="px-3 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      disabled={isLoading}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  {formData.location.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.location.map((location, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
                        >
                          {location}
                          <button
                            type="button"
                            onClick={() => removeTag('location', index)}
                            className="ml-1 text-green-600 hover:text-green-800"
                            disabled={isLoading}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Creatives */}
              <div>
                <label htmlFor="creatives" className="block text-sm font-medium text-gray-700 mb-2">
                  Creative Type
                </label>
                <select
                  id="creatives"
                  name="creatives"
                  value={formData.creatives}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                >
                  {creativesOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Campaign Type */}
              <div>
                <label htmlFor="campaign_type_id" className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Type
                </label>
                <select
                  id="campaign_type_id"
                  name="campaign_type_id"
                  value={formData.campaign_type_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading || loadingDropdowns}
                >
                  <option value="">Select Campaign Type</option>
                  {campaignTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.type_name || type.name}
                    </option>
                  ))}
                </select>
                {loadingDropdowns && (
                  <p className="mt-1 text-sm text-gray-500">Loading campaign types...</p>
                )}
              </div>

              {/* Brand */}
              <div>
                <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-2">
                  Brand {formData.brand && `(Selected: ${formData.brand})`}
                </label>
                <select
                  id="brand"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading || loadingDropdowns}
                >
                  <option value="">Select Brand</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </select>
                {loadingDropdowns && (
                  <p className="mt-1 text-sm text-gray-500">Loading brands...</p>
                )}
              </div>

              {/* Enabled Toggle */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="enabled"
                    checked={formData.enabled}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    disabled={isLoading}
                  />
                  <span className="ml-2 text-sm text-gray-900">Enable Campaign</span>
                </label>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={isLoading || loadingDropdowns}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <Loader className="animate-spin h-4 w-4 mr-2" />
                  {campaign ? 'Updating...' : 'Creating...'}
                </div>
              ) : (
                campaign ? 'Update Campaign' : 'Create Campaign'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CampaignForm
