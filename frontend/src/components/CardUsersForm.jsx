import React, { useEffect, useState } from 'react'
import { X, AlertCircle } from 'lucide-react'
import cardsService from '../services/cardsService'
import cardUsersService from '../services/cardUsersService'
import usersService from '../services/usersService'

const CardUsersForm = ({ isOpen, onClose, onSubmit, editData, isLoading }) => {
  const [formData, setFormData] = useState({
    card_id: '',
    user_id: '',
    assigned_date: new Date().toISOString().split('T')[0], // Today's date
    is_primary: false
  })
  
  const [errors, setErrors] = useState({})
  const [cards, setCards] = useState([])
  const [users, setUsers] = useState([])
  const [loadingOptions, setLoadingOptions] = useState(false)

  // Reset form when opening/closing or editData changes
  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setFormData({
          card_id: editData.card_id?.toString() || '',
          user_id: editData.user_id?.toString() || '',
          assigned_date: editData.assigned_date ? 
            new Date(editData.assigned_date).toISOString().split('T')[0] : 
            new Date().toISOString().split('T')[0],
          is_primary: Boolean(editData.is_primary)
        })
      } else {
        setFormData({
          card_id: '',
          user_id: '',
          assigned_date: new Date().toISOString().split('T')[0],
          is_primary: false
        })
      }
      setErrors({})
    }
  }, [isOpen, editData])

  // Load cards and users for dropdowns
  useEffect(() => {
    if (isOpen) {
      loadOptions()
    }
  }, [isOpen])

  const loadOptions = async () => {
    setLoadingOptions(true)
    try {
      // Load cards
      const cardsResponse = await cardsService.getAll({ limit: 100 })
      const cardsList = cardsResponse?.data?.cards || cardsResponse?.data || []
      setCards(Array.isArray(cardsList) ? cardsList : [])

      // Load users from API
      const usersResponse = await usersService.getForDropdown()
      const usersList = usersResponse?.data || []
      setUsers(Array.isArray(usersList) ? usersList : [])
    } catch (error) {
      console.error('Error loading options:', error)
      setCards([])
      setUsers([])
    } finally {
      setLoadingOptions(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.card_id) {
      newErrors.card_id = 'Card is required'
    }
    if (!formData.user_id) {
      newErrors.user_id = 'User is required'
    }
    if (!formData.assigned_date) {
      newErrors.assigned_date = 'Assigned date is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      const submitData = {
        ...formData,
        card_id: parseInt(formData.card_id),
        user_id: parseInt(formData.user_id)
      }
      
      await onSubmit(submitData)
    } catch (error) {
      console.error('Form submission error:', error)
      setErrors({ 
        submit: error.response?.data?.message || error.message || 'An error occurred while saving' 
      })
    }
  }

  const handleClose = () => {
    setFormData({
      card_id: '',
      user_id: '',
      assigned_date: new Date().toISOString().split('T')[0],
      is_primary: false
    })
    setErrors({})
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose}></div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              onClick={handleClose}
              className="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className="w-full mt-3 text-center sm:mt-0 sm:text-left">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                {editData ? 'Edit Card Assignment' : 'Assign Card to User'}
              </h3>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Submit Error */}
                {errors.submit && (
                  <div className="rounded-md bg-red-50 border border-red-200 p-4">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                      <p className="text-sm text-red-700">{errors.submit}</p>
                    </div>
                  </div>
                )}

                {/* Card Selection */}
                <div>
                  <label htmlFor="card_id" className="block text-sm font-medium text-gray-700">
                    Card *
                  </label>
                  <select
                    id="card_id"
                    name="card_id"
                    value={formData.card_id}
                    onChange={handleInputChange}
                    disabled={loadingOptions || isLoading}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.card_id ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select a card...</option>
                    {cards.map(card => (
                      <option key={card.id} value={card.id}>
                        {card.card_name} (••••{card.card_number_last4})
                      </option>
                    ))}
                  </select>
                  {errors.card_id && (
                    <p className="mt-1 text-xs text-red-600">{errors.card_id}</p>
                  )}
                </div>

                {/* User Selection */}
                <div>
                  <label htmlFor="user_id" className="block text-sm font-medium text-gray-700">
                    User *
                  </label>
                  <select
                    id="user_id"
                    name="user_id"
                    value={formData.user_id}
                    onChange={handleInputChange}
                    disabled={loadingOptions || isLoading}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.user_id ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select a user...</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.username}
                      </option>
                    ))}
                  </select>
                  {errors.user_id && (
                    <p className="mt-1 text-xs text-red-600">{errors.user_id}</p>
                  )}
                </div>

                {/* Assigned Date */}
                <div>
                  <label htmlFor="assigned_date" className="block text-sm font-medium text-gray-700">
                    Assigned Date *
                  </label>
                  <input
                    type="date"
                    id="assigned_date"
                    name="assigned_date"
                    value={formData.assigned_date}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.assigned_date ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.assigned_date && (
                    <p className="mt-1 text-xs text-red-600">{errors.assigned_date}</p>
                  )}
                </div>

                {/* Is Primary Checkbox */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_primary"
                    name="is_primary"
                    checked={formData.is_primary}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_primary" className="ml-2 block text-sm text-gray-700">
                    Set as primary card for this user
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isLoading}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || loadingOptions}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isLoading ? 'Saving...' : (editData ? 'Update Assignment' : 'Create Assignment')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CardUsersForm
