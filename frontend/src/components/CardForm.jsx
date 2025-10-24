import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import ErrorAlert from './common/ErrorAlert'

const CardForm = ({ isOpen, onClose, onSubmit, editData = null, isLoading = false, accounts = [] }) => {
  const [submitError, setSubmitError] = useState('')
  const [formData, setFormData] = useState({
    card_name: '',
    card_number_last4: '',
    card_type: '',
    is_active: true,
    account_id: ''
  })
  const [errors, setErrors] = useState({})


  // Update form when editData changes
  useEffect(() => {
    if (editData) {
      setFormData({
        card_name: editData.card_name || '',
        card_number_last4: editData.card_number_last4 || '',
        card_type: editData.card_type || '',
        account_id: editData.account_id || '',
        is_active: editData.is_active !== undefined ? editData.is_active : true
      })
    } else {
      setFormData({
        card_name: '',
        card_number_last4: '',
        card_type: '',
        account_id: '',
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

    if (!formData.account_id) {
      newErrors.account_id = 'Account selection is required'
    }


    if (!formData.account_id) {
      newErrors.account_id = 'Account selection is required'
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
      const submissionData = {
        ...formData,
        account_id: formData.account_id ? Number(formData.account_id) : null
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
          <ErrorAlert 
            error={submitError} 
            onDismiss={() => setSubmitError('')}
            className="mb-4"
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account Selection */}
          <div>
            <label htmlFor="account_id" className="block text-sm font-medium text-gray-700 mb-1">
              Account <span className="text-red-500">*</span>
            </label>
            <select
              id="account_id"
              name="account_id"
              value={formData.account_id}
              onChange={handleInputChange}
              className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                errors.account_id ? 'border-red-500' : ''
              }`}
              disabled={isLoading}
            >
              <option value="">Select an account</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.account_name}</option>
              ))}
            </select>
            {errors.account_id && (
              <p className="mt-1 text-sm text-red-600">{errors.account_id}</p>
            )}
          </div>

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
