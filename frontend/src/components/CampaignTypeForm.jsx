import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const CampaignTypeForm = ({ isOpen, onClose, onSubmit, editData = null, isLoading = false }) => {
  const [formData, setFormData] = useState({
    type_name: '',
    description: '',
    is_active: true
  })
  const [errors, setErrors] = useState({})

  // Update form when editData changes
  useEffect(() => {
    if (editData) {
      setFormData({
        type_name: editData.type_name || '',
        description: editData.description || '',
        is_active: editData.is_active !== undefined ? editData.is_active : true
      })
    } else {
      setFormData({
        type_name: '',
        description: '',
        is_active: true
      })
    }
    setErrors({})
  }, [editData, isOpen])

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.type_name.trim()) {
      newErrors.type_name = 'Campaign type name is required'
    } else if (formData.type_name.length > 100) {
      newErrors.type_name = 'Campaign type name must be less than 100 characters'
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'Description must be less than 1000 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {editData ? 'Edit Campaign Type' : 'Create Campaign Type'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campaign Type Name */}
          <div>
            <label htmlFor="type_name" className="block text-sm font-medium text-gray-700 mb-1">
              Campaign Type Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="type_name"
              name="type_name"
              value={formData.type_name}
              onChange={handleInputChange}
              className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                errors.type_name ? 'border-red-500' : ''
              }`}
              placeholder="Enter campaign type name"
              maxLength={100}
              disabled={isLoading}
            />
            {errors.type_name && (
              <p className="mt-1 text-sm text-red-600">{errors.type_name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                errors.description ? 'border-red-500' : ''
              }`}
              placeholder="Enter description (optional)"
              maxLength={1000}
              disabled={isLoading}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formData.description.length}/1000 characters
            </p>
          </div>

          {/* Is Active */}
          <div className="flex items-center">
            <input
              id="is_active"
              name="is_active"
              type="checkbox"
              checked={formData.is_active}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={isLoading}
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
              Active
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : (editData ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CampaignTypeForm
