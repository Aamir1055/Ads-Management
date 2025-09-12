import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'

const CardForm = ({ isOpen, onClose, onSubmit, editData = null, isLoading = false }) => {
  const [submitError, setSubmitError] = useState('')
  const [formData, setFormData] = useState({
    card_name: '',
    card_number_last4: '',
    card_type: '',
    current_balance: '',
    is_active: true
  })
  const [errors, setErrors] = useState({})


  // Update form when editData changes
  useEffect(() => {
    if (editData) {
      setFormData({
        card_name: editData.card_name || '',
        card_number_last4: editData.card_number_last4 || '',
        card_type: editData.card_type || '',
        current_balance: editData.current_balance || '',
        is_active: editData.is_active !== undefined ? editData.is_active : true
      })
    } else {
      setFormData({
        card_name: '',
        card_number_last4: '',
        card_type: '',
        current_balance: '',
        is_active: true
      })
    }
    setErrors({})
  }, [editData, isOpen])

  useEffect(() => {
    if (isOpen) {
      setSubmitError('')
    }
  }, [isOpen])

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.card_name.trim()) {
      newErrors.card_name = 'Card name is required'
    } else if (formData.card_name.length > 100) {
      newErrors.card_name = 'Card name must be less than 100 characters'
    }

    if (!formData.card_number_last4.trim()) {
      newErrors.card_number_last4 = 'Last 4 digits are required'
    } else if (!/^\d{4}$/.test(formData.card_number_last4)) {
      newErrors.card_number_last4 = 'Must be exactly 4 digits'
    }

    if (!formData.card_type) {
      newErrors.card_type = 'Card type is required'
    }

    if (!formData.current_balance.toString().trim()) {
      newErrors.current_balance = 'Current balance is required'
    } else if (isNaN(parseFloat(formData.current_balance)) || parseFloat(formData.current_balance) < 0) {
      newErrors.current_balance = 'Current balance must be a valid positive number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    let newValue = type === 'checkbox' ? checked : value

    // Special handling for card_number_last4 - only allow digits and max 4 characters
    if (name === 'card_number_last4') {
      newValue = value.replace(/\D/g, '').slice(0, 4)
    }

    // Special handling for current_balance - allow decimal numbers
    if (name === 'current_balance') {
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        newValue = value
      } else {
        return // Don't update if invalid format
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: newValue
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
      setSubmitError('')
      // Convert current_balance to number for submission
      const submissionData = {
        ...formData,
        current_balance: parseFloat(formData.current_balance)
      }
      await onSubmit(submissionData)
    } catch (error) {
      console.error('Form submission error:', error)
      setSubmitError(error?.response?.data?.message || error.message || 'An error occurred')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {editData ? 'Edit Card' : 'Add New Card'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {submitError && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Card Name */}
          <div>
            <label htmlFor="card_name" className="block text-sm font-medium text-gray-700 mb-1">
              Card Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="card_name"
              name="card_name"
              value={formData.card_name}
              onChange={handleInputChange}
              className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                errors.card_name ? 'border-red-500' : ''
              }`}
              placeholder="Enter card name"
              maxLength={100}
              disabled={isLoading}
            />
            {errors.card_name && (
              <p className="mt-1 text-sm text-red-600">{errors.card_name}</p>
            )}
          </div>

          {/* Card Number Last 4 */}
          <div>
            <label htmlFor="card_number_last4" className="block text-sm font-medium text-gray-700 mb-1">
              Last 4 Digits <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="card_number_last4"
              name="card_number_last4"
              value={formData.card_number_last4}
              onChange={handleInputChange}
              className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                errors.card_number_last4 ? 'border-red-500' : ''
              }`}
              placeholder="1234"
              maxLength={4}
              disabled={isLoading}
            />
            {errors.card_number_last4 && (
              <p className="mt-1 text-sm text-red-600">{errors.card_number_last4}</p>
            )}
          </div>

          {/* Card Type */}
          <div>
            <label htmlFor="card_type" className="block text-sm font-medium text-gray-700 mb-1">
              Card Type <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="card_type"
              name="card_type"
              value={formData.card_type}
              onChange={handleInputChange}
              className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                errors.card_type ? 'border-red-500' : ''
              }`}
              placeholder="e.g., Visa, MasterCard, American Express"
              maxLength={50}
              disabled={isLoading}
            />
            {errors.card_type && (
              <p className="mt-1 text-sm text-red-600">{errors.card_type}</p>
            )}
          </div>

          {/* Current Balance */}
          <div>
            <label htmlFor="current_balance" className="block text-sm font-medium text-gray-700 mb-1">
              Current Balance <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="text"
                id="current_balance"
                name="current_balance"
                value={formData.current_balance}
                onChange={handleInputChange}
                className={`mt-1 block w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                  errors.current_balance ? 'border-red-500' : ''
                }`}
                placeholder="0.00"
                disabled={isLoading}
              />
            </div>
            {errors.current_balance && (
              <p className="mt-1 text-sm text-red-600">{errors.current_balance}</p>
            )}
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

export default CardForm
