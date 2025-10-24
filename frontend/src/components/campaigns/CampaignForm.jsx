import React, { useState, useEffect } from 'react'
import { X, Save, AlertCircle, Plus } from 'lucide-react'
import campaignService from '../../services/campaignService'

const CampaignForm = ({ campaign = null, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    persona: [], // Array for multiple values stored as JSON
    gender: [], // Array for multiple values stored as JSON
    min_age: '', // Integer field for minimum age
    max_age: '', // Integer field for maximum age
    location: [], // Array for multiple values stored as JSON
    creatives: 'image', // Enum dropdown
    is_enabled: true, // Toggle
    campaign_type_id: '', // Foreign key to campaign_types
    brand: '' // Foreign key to brands (store ID, display name)
  })

  const [personaInput, setPersonaInput] = useState('')
  const [locationInput, setLocationInput] = useState('')

  const [campaignTypes, setCampaignTypes] = useState([])
  const [brands, setBrands] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState({})

  const creativeOptions = [
    { value: 'video', label: 'Video' },
    { value: 'image', label: 'Image' },
    { value: 'carousel', label: 'Carousel' },
    { value: 'collection', label: 'Collection' }
  ]

  const genderOptions = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
    { value: 'Other', label: 'Other' }
  ]

  useEffect(() => {
    if (isOpen) {
      loadDropdownData()
      if (campaign) {
        console.log('🔧 Initializing form with campaign data:', campaign)
        const brandId = (typeof campaign.brand === 'object' && campaign.brand?.id) ? campaign.brand.id.toString() : (campaign.brand ? campaign.brand.toString() : '')
        console.log('🔧 Extracted brand ID:', brandId, 'from brand:', campaign.brand)
        
        // Parse existing campaign data
        setFormData({
          name: campaign.name || '',
          persona: parseJsonArray(campaign.persona),
          gender: parseJsonArray(campaign.gender),
          min_age: campaign.min_age ? campaign.min_age.toString() : '',
          max_age: campaign.max_age ? campaign.max_age.toString() : '',
          location: parseJsonArray(campaign.location),
          creatives: campaign.creatives || 'image',
          is_enabled: campaign.is_enabled !== undefined ? !!campaign.is_enabled : true,
          campaign_type_id: campaign.campaign_type_id || '',
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
          is_enabled: true,
          campaign_type_id: '',
          brand: ''
        })
      }
      resetInputs()
      setError('')
      setValidationErrors({})
    }
  }, [isOpen, campaign])

  // Re-set brand if campaign and brands are loaded (timing fix)
  useEffect(() => {
    if (campaign && brands.length > 0) {
      const brandId = (typeof campaign.brand === 'object' && campaign.brand?.id) ? campaign.brand.id.toString() : (campaign.brand ? campaign.brand.toString() : '')
      console.log('🔧 Re-setting brand after brands loaded. Brand ID:', brandId, 'Available brands:', brands.length)
      setFormData(prev => ({
        ...prev,
        brand: brandId
      }))
    }
  }, [campaign, brands])

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

  const resetInputs = () => {
    setPersonaInput('')
    setLocationInput('')
  }

  const loadDropdownData = async () => {
    try {
      // Load campaign types
      const campaignTypesResponse = await campaignService.getCampaignTypes()
      if (campaignTypesResponse.success) {
        setCampaignTypes(campaignTypesResponse.data || [])
      }

      // Load brands
      const brandsResponse = await campaignService.getBrands()
      if (brandsResponse.success) {
        console.log('🏢 Loaded brands:', brandsResponse.data)
        setBrands(brandsResponse.data || [])
      }
    } catch (error) {
      console.error('Error loading dropdown data:', error)
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

  const addToArray = (field, value, inputSetter) => {
    const trimmedValue = value.trim()
    if (trimmedValue && !formData[field].includes(trimmedValue)) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], trimmedValue]
      }))
      inputSetter('')
    }
  }

  const removeFromArray = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  const handleKeyPress = (e, field, value, inputSetter) => {
    if (e.key === 'Enter' && value.trim()) {
      e.preventDefault()
      addToArray(field, value, inputSetter)
    }
  }

  const handleGenderCheckboxChange = (genderValue, checked) => {
    setFormData(prev => ({
      ...prev,
      gender: checked 
        ? [...prev.gender, genderValue]
        : prev.gender.filter(g => g !== genderValue)
    }))
  }

  const validateForm = () => {
    const errors = {}

    // Required field validations
    if (!formData.name.trim()) {
      errors.name = 'Campaign name is required'
    }

    if (!formData.campaign_type_id) {
      errors.campaign_type_id = 'Campaign type is required'
    }

    if (!formData.brand) {
      errors.brand = 'Brand is required'
    }

    if (formData.persona.length === 0) {
      errors.persona = 'At least one persona is required'
    }

    if (formData.gender.length === 0) {
      errors.gender = 'At least one gender is required'
    }

    if (formData.location.length === 0) {
      errors.location = 'At least one location is required'
    }

    if (!formData.creatives) {
      errors.creatives = 'Creative type is required'
    }

    // Age validations
    if (!formData.min_age) {
      errors.min_age = 'Minimum age is required'
    } else if (isNaN(formData.min_age) || parseInt(formData.min_age) < 0 || parseInt(formData.min_age) > 100) {
      errors.min_age = 'Minimum age must be a number between 0 and 100'
    }

    if (!formData.max_age) {
      errors.max_age = 'Maximum age is required'
    } else if (isNaN(formData.max_age) || parseInt(formData.max_age) < 0 || parseInt(formData.max_age) > 100) {
      errors.max_age = 'Maximum age must be a number between 0 and 100'
    }

    if (formData.min_age && formData.max_age && parseInt(formData.min_age) > parseInt(formData.max_age)) {
      errors.min_age = 'Minimum age cannot be greater than maximum age'
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
        name: formData.name.trim(),
        persona: formData.persona, // Send as array, backend will handle JSON conversion
        gender: formData.gender, // Send as array, backend will handle JSON conversion
        min_age: formData.min_age ? parseInt(formData.min_age) : null,
        max_age: formData.max_age ? parseInt(formData.max_age) : null,
        location: formData.location, // Send as array, backend will handle JSON conversion
        creatives: formData.creatives,
        is_enabled: formData.is_enabled,
        campaign_type_id: parseInt(formData.campaign_type_id),
        brand: parseInt(formData.brand) // Send brand ID
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

            {/* Campaign Type Dropdown */}
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
                {campaignTypes.filter(type => type.is_active).map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.type_name}
                  </option>
                ))}
              </select>
              {validationErrors.campaign_type_id && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.campaign_type_id}</p>
              )}
            </div>

            {/* Brand Dropdown */}
            <div>
              <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">
                Brand *
              </label>
              <select
                id="brand"
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  validationErrors.brand ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-purple-500'
                }`}
              >
                <option value="">Select Brand</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
              {validationErrors.brand && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.brand}</p>
              )}
            </div>

            {/* Min Age */}
            <div>
              <label htmlFor="min_age" className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Age *
              </label>
              <input
                type="number"
                id="min_age"
                name="min_age"
                min="0"
                max="100"
                value={formData.min_age}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  validationErrors.min_age ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-purple-500'
                }`}
                placeholder="Enter minimum age"
              />
              {validationErrors.min_age && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.min_age}</p>
              )}
            </div>

            {/* Max Age */}
            <div>
              <label htmlFor="max_age" className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Age *
              </label>
              <input
                type="number"
                id="max_age"
                name="max_age"
                min="0"
                max="100"
                value={formData.max_age}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  validationErrors.max_age ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-purple-500'
                }`}
                placeholder="Enter maximum age"
              />
              {validationErrors.max_age && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.max_age}</p>
              )}
            </div>

            {/* Creatives Dropdown */}
            <div>
              <label htmlFor="creatives" className="block text-sm font-medium text-gray-700 mb-1">
                Creative Type
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

            {/* Persona Multi-Value Input */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Persona (Multiple Values) *
              </label>
              {validationErrors.persona && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.persona}</p>
              )}
              
              {/* Display selected personas */}
              <div className="mb-2 flex flex-wrap gap-2">
                {formData.persona.map((persona, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800 border border-purple-200"
                  >
                    <span>{persona}</span>
                    <button
                      type="button"
                      onClick={() => removeFromArray('persona', index)}
                      className="ml-2 text-purple-600 hover:text-purple-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              
              {/* Input for new persona */}
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={personaInput}
                  onChange={(e) => setPersonaInput(e.target.value)}
                  onKeyDown={(e) => handleKeyPress(e, 'persona', personaInput, setPersonaInput)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Type persona and press Enter"
                />
                <button
                  type="button"
                  onClick={() => addToArray('persona', personaInput, setPersonaInput)}
                  disabled={!personaInput.trim()}
                  className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Gender Checkbox Selection */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Gender (Multiple Selection) *
              </label>
              {validationErrors.gender && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.gender}</p>
              )}
              
              {/* Display selected genders */}
              {formData.gender.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {formData.gender.map((gender, index) => (
                    <div
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 border border-blue-200"
                    >
                      <span>{gender}</span>
                      <button
                        type="button"
                        onClick={() => removeFromArray('gender', index)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Gender checkboxes */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {genderOptions.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center space-x-3 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.gender.includes(option.value)}
                      onChange={(e) => handleGenderCheckboxChange(option.value, e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Location Multi-Value Input */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location (Multiple Values) *
              </label>
              {validationErrors.location && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.location}</p>
              )}
              
              {/* Display selected locations */}
              <div className="mb-2 flex flex-wrap gap-2">
                {formData.location.map((location, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800 border border-green-200"
                  >
                    <span>{location}</span>
                    <button
                      type="button"
                      onClick={() => removeFromArray('location', index)}
                      className="ml-2 text-green-600 hover:text-green-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              
              {/* Input for new location */}
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  onKeyDown={(e) => handleKeyPress(e, 'location', locationInput, setLocationInput)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="Type location and press Enter"
                />
                <button
                  type="button"
                  onClick={() => addToArray('location', locationInput, setLocationInput)}
                  disabled={!locationInput.trim()}
                  className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Is Enabled Toggle */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between">
                <label htmlFor="is_enabled" className="block text-sm font-medium text-gray-700">
                  Campaign Status *
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
