import React, { useState, useEffect } from 'react'
import { X, Save, AlertCircle, Plus } from 'lucide-react'
import campaignService from '../../services/campaignService'

const CampaignForm = ({ campaign = null, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    persona: [], // Array for tags, stored as JSON
    gender: [], // Array for multiple selections, stored as JSON
    age: '', // Single age field (string format like "18-25", "30+")
    min_age: '', // Minimum age (integer)
    max_age: '', // Maximum age (integer)
    location: [], // Array for tags, stored as JSON
    creatives: 'image',
    campaign_type_id: '',
    brand: '', // String field as per database schema
    is_enabled: true
  })

  const [personaInput, setPersonaInput] = useState('')
  const [locationInput, setLocationInput] = useState('')

  const [campaignTypes, setCampaignTypes] = useState([])
  const [brands, setBrands] = useState([])
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

  const locationOptions = [
    'Delhi',
    'Mumbai',
    'Bangalore',
    'Chennai',
    'Hyderabad',
    'Pune',
    'Kolkata',
    'Ahmedabad',
    'Jaipur',
    'Surat',
    'Lucknow',
    'Kanpur',
    'Nagpur',
    'Indore',
    'Thane',
    'Bhopal',
    'Visakhapatnam',
    'Patna'
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
      loadBrands()
      if (campaign) {
        // Parse persona - handle both JSON array and comma-separated string
        let personaArray = []
        if (campaign.persona) {
          if (Array.isArray(campaign.persona)) {
            personaArray = campaign.persona
          } else {
            try {
              personaArray = JSON.parse(campaign.persona)
            } catch {
              // Fallback to comma-separated string
              personaArray = campaign.persona.split(',').map(p => p.trim()).filter(p => p)
            }
          }
        }
        
        // Parse location - handle both JSON array and comma-separated string
        let locationArray = []
        if (campaign.location) {
          if (Array.isArray(campaign.location)) {
            locationArray = campaign.location
          } else {
            try {
              locationArray = JSON.parse(campaign.location)
            } catch {
              // Fallback to comma-separated string
              locationArray = campaign.location.split(',').map(l => l.trim()).filter(l => l)
            }
          }
        }
        
        // Handle age fields - support both formats
        let ageValue = campaign.age || ''
        let minAgeValue = campaign.min_age ? campaign.min_age.toString() : ''
        let maxAgeValue = campaign.max_age ? campaign.max_age.toString() : ''
        
        // If no age string but we have min/max, generate age string for display
        if (!ageValue && (campaign.min_age || campaign.max_age)) {
          if (campaign.min_age && campaign.max_age) {
            ageValue = `${campaign.min_age}-${campaign.max_age}`
          } else if (campaign.min_age) {
            ageValue = `${campaign.min_age}+`
          } else if (campaign.max_age) {
            ageValue = `up to ${campaign.max_age}`
          }
        }
        
        
        setFormData({
          name: campaign.name || '',
          persona: personaArray,
          gender: (() => {
            if (Array.isArray(campaign.gender)) return campaign.gender
            if (!campaign.gender) return []
            try {
              const parsed = JSON.parse(campaign.gender)
              return Array.isArray(parsed) ? parsed : []
            } catch {
              // Try to handle double-escaped JSON
              try {
                const doubleDecoded = JSON.parse(JSON.parse(campaign.gender))
                return Array.isArray(doubleDecoded) ? doubleDecoded : []
              } catch {
                return []
              }
            }
          })(),
          age: ageValue,
          min_age: minAgeValue,
          max_age: maxAgeValue,
          location: locationArray,
          creatives: campaign.creatives || 'image',
          campaign_type_id: campaign.campaign_type_id || '',
          brand: campaign.brand || '',
          is_enabled: campaign.is_enabled !== undefined ? !!campaign.is_enabled : true
        })
      } else {
        // Reset form for new campaign
        setFormData({
          name: '',
          persona: [],
          gender: [],
          age: '',
          min_age: '',
          max_age: '',
          location: [],
          creatives: 'image',
          campaign_type_id: '',
          brand: '',
          is_enabled: true
        })
      }
      setPersonaInput('')
      setLocationInput('')
      setError('')
      setValidationErrors({})
    }
  }, [isOpen, campaign])
  

  const loadCampaignTypes = async () => {
    try {
      const response = await campaignService.getCampaignTypes()
      if (response.success) {
        // Filter to only show active campaign types
        const activeCampaignTypes = (response.data || []).filter(type => type.is_active)
        setCampaignTypes(activeCampaignTypes)
      }
    } catch (error) {
      console.error('Error loading campaign types:', error)
    }
  }

  const loadBrands = async () => {
    try {
      const response = await brandService.getActiveBrands()
      if (response.success) {
        setBrands(response.data || [])
      }
    } catch (error) {
      console.error('Error loading brands:', error)
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


  const validateForm = () => {
    const errors = {}

    if (!formData.name.trim()) {
      errors.name = 'Campaign name is required'
    }

    if (!formData.campaign_type_id) {
      errors.campaign_type_id = 'Campaign type is required'
    }

    if (!formData.brand.trim()) {
      errors.brand = 'Brand is required'
    }

    if (formData.persona.length === 0) {
      errors.persona = 'At least one persona is required'
    }

    if (formData.gender.length === 0) {
      errors.gender = 'At least one gender must be selected'
    }

    if (formData.location.length === 0) {
      errors.location = 'At least one location is required'
    }

    // Age validation - flexible format
    if (formData.age && formData.age.trim()) {
      const ageValue = formData.age.trim()
      // Check if it's a valid age format (number, range, or descriptive)
      const isValidAge = /^(\d+|\d+-\d+|\d+\+|up to \d+)$/.test(ageValue)
      if (!isValidAge) {
        errors.age = 'Please enter a valid age format (e.g., 25, 18-35, 30+, up to 40)'
      }
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
      // Parse min_age and max_age if they exist
      const minAge = formData.min_age ? parseInt(formData.min_age) : null
      const maxAge = formData.max_age ? parseInt(formData.max_age) : null
      
      const submitData = {
        ...formData,
        persona: JSON.stringify(formData.persona), // Store as JSON array
        location: JSON.stringify(formData.location), // Store as JSON array
        gender: JSON.stringify(formData.gender), // Store as JSON array
        age: formData.age.trim() || null, // Store age as string
        min_age: minAge, // Store as integer
        max_age: maxAge, // Store as integer
        campaign_type_id: parseInt(formData.campaign_type_id),
        brand: formData.brand.trim() // Use brand name directly
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
                Brand *
              </label>
              <input
                type="text"
                id="brand"
                name="brand"
                value={formData.brand}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  validationErrors.brand ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-purple-500'
                }`}
                placeholder="Enter brand name"
              />
              {validationErrors.brand && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.brand}</p>
              )}
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
                type="text"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  validationErrors.age ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-purple-500'
                }`}
                placeholder="e.g., 25, 18-35, 30+, up to 40"
              />
              <p className="mt-1 text-xs text-gray-500">Examples: 25 (exact age), 18-35 (range), 30+ (and above), up to 40 (maximum)</p>
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

            {/* Persona Tags */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Persona *
              </label>
              
              {/* Selected Persona Tags */}
              <div className="mb-2 flex flex-wrap gap-2">
                {formData.persona.map((persona, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800 border border-purple-200"
                  >
                    <span>{persona}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          persona: prev.persona.filter((_, i) => i !== index)
                        }))
                      }}
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && personaInput.trim()) {
                      e.preventDefault()
                      const trimmedInput = personaInput.trim()
                      if (!formData.persona.includes(trimmedInput)) {
                        setFormData(prev => ({
                          ...prev,
                          persona: [...prev.persona, trimmedInput]
                        }))
                      }
                      setPersonaInput('')
                    }
                  }}
                  className={`flex-1 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    validationErrors.persona ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-purple-500'
                  }`}
                  placeholder="Type persona and press Enter to add"
                />
                <button
                  type="button"
                  onClick={() => {
                    const trimmedInput = personaInput.trim()
                    if (trimmedInput && !formData.persona.includes(trimmedInput)) {
                      setFormData(prev => ({
                        ...prev,
                        persona: [...prev.persona, trimmedInput]
                      }))
                      setPersonaInput('')
                    }
                  }}
                  disabled={!personaInput.trim()}
                  className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              
              {/* Quick add suggested personas */}
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-2">Quick add:</p>
                <div className="flex flex-wrap gap-2">
                  {personaOptions
                    .filter(option => !formData.persona.includes(option))
                    .slice(0, 6)
                    .map((option, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            persona: [...prev.persona, option]
                          }))
                        }}
                        className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        + {option}
                      </button>
                    ))
                  }
                </div>
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

            {/* Location Tags */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Locations *
              </label>
              
              {/* Selected Location Tags */}
              <div className="mb-2 flex flex-wrap gap-2">
                {formData.location.map((location, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 border border-blue-200"
                  >
                    <span>{location}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          location: prev.location.filter((_, i) => i !== index)
                        }))
                      }}
                      className="ml-2 text-blue-600 hover:text-blue-800"
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && locationInput.trim()) {
                      e.preventDefault()
                      const trimmedInput = locationInput.trim()
                      if (!formData.location.includes(trimmedInput)) {
                        setFormData(prev => ({
                          ...prev,
                          location: [...prev.location, trimmedInput]
                        }))
                      }
                      setLocationInput('')
                    }
                  }}
                  className={`flex-1 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    validationErrors.location ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-purple-500'
                  }`}
                  placeholder="Type location and press Enter to add"
                />
                <button
                  type="button"
                  onClick={() => {
                    const trimmedInput = locationInput.trim()
                    if (trimmedInput && !formData.location.includes(trimmedInput)) {
                      setFormData(prev => ({
                        ...prev,
                        location: [...prev.location, trimmedInput]
                      }))
                      setLocationInput('')
                    }
                  }}
                  disabled={!locationInput.trim()}
                  className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              
              {/* Quick add suggested locations */}
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-2">Quick add popular cities:</p>
                <div className="flex flex-wrap gap-2">
                  {locationOptions
                    .filter(option => !formData.location.includes(option))
                    .slice(0, 8)
                    .map((option, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            location: [...prev.location, option]
                          }))
                        }}
                        className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        + {option}
                      </button>
                    ))
                  }
                </div>
              </div>
              
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
