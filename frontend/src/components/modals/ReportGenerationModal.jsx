import React, { useState, useEffect } from 'react';
import reportsService from '../../services/reportsService';
import brandService from '../../services/brandService';
import campaignService from '../../services/campaignService';

const ReportGenerationModal = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  mode = 'generate', // 'generate' or 'sync'
  title
}) => {
  // Date conversion helper functions
  const convertToDisplayFormat = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const convertToInputFormat = (dateString) => {
    if (!dateString) return '';
    const parts = dateString.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return dateString;
  };
  const [formData, setFormData] = useState({
    dateFrom: '',
    dateTo: '',
    campaignId: '',
    brandId: '',
    updateExisting: true
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [brands, setBrands] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [quickDateRange, setQuickDateRange] = useState('');

  // Load brands and campaigns on mount
  useEffect(() => {
    if (isOpen) {
      loadBrands();
      loadCampaigns();
    }
  }, [isOpen]);

  // Set quick date range
  useEffect(() => {
    if (quickDateRange) {
      const dateRange = reportsService.getDateRange(quickDateRange);
      setFormData(prev => ({
        ...prev,
        dateFrom: dateRange.dateFrom,
        dateTo: dateRange.dateTo
      }));
    }
  }, [quickDateRange]);

  const loadBrands = async () => {
    try {
      console.log('Modal: Loading brands...');
      const response = await brandService.getAll();
      console.log('Modal: Brands response:', response);
      if (response.success) {
        console.log('Modal: Setting brands data:', response.data);
        setBrands(Array.isArray(response.data) ? response.data : []);
      } else {
        setBrands([]);
      }
    } catch (error) {
      console.error('Modal: Error loading brands:', error);
      setBrands([]);
    }
  };

  const loadCampaigns = async () => {
    try {
      console.log('Modal: Loading campaigns...');
      const response = await campaignService.getCampaigns();
      console.log('Modal: Campaigns response:', response);
      if (response.success) {
        console.log('Modal: Setting campaigns data:', response.data);
        setCampaigns(Array.isArray(response.data) ? response.data : []);
      } else {
        setCampaigns([]);
      }
    } catch (error) {
      console.error('Modal: Error loading campaigns:', error);
      setCampaigns([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.dateFrom || !formData.dateTo) {
      setError('Date range is required');
      return;
    }

    if (new Date(formData.dateFrom) > new Date(formData.dateTo)) {
      setError('Start date must be before or equal to end date');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Prepare request data
      const requestData = {
        dateFrom: formData.dateFrom,
        dateTo: formData.dateTo,
      };

      if (formData.campaignId) {
        requestData.campaignId = parseInt(formData.campaignId);
      }
      if (formData.brandId) {
        requestData.brandId = parseInt(formData.brandId);
      }

      if (mode === 'sync') {
        requestData.updateExisting = formData.updateExisting;
      }

      // Call appropriate API
      const response = mode === 'generate' 
        ? await reportsService.generateReports(requestData)
        : await reportsService.syncReports(requestData);

      if (response.success) {
        setSuccess(response.message);
        onSuccess && onSuccess(response);
        
        // Auto-close after success
        setTimeout(() => {
          onClose();
          resetForm();
        }, 2000);
      } else {
        setError(response.message || `Failed to ${mode} reports`);
      }
    } catch (error) {
      console.error(`Error ${mode}ing reports:`, error);
      setError(error.message || `Failed to ${mode} reports`);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      dateFrom: '',
      dateTo: '',
      campaignId: '',
      brandId: '',
      updateExisting: true
    });
    setQuickDateRange('');
    setError('');
    setSuccess('');
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      resetForm();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-gray-900">
            {title || `${mode === 'generate' ? 'Generate' : 'Sync'} Reports`}
          </h3>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Quick Date Range Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Date Range
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'yesterday', label: 'Yesterday' },
                { value: 'last7days', label: 'Last 7 Days' },
                { value: 'last30days', label: 'Last 30 Days' },
                { value: 'thisMonth', label: 'This Month' },
                { value: 'lastMonth', label: 'Last Month' },
                { value: 'today', label: 'Today' }
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setQuickDateRange(option.value)}
                  className={`px-3 py-2 text-xs border rounded-md transition-colors ${
                    quickDateRange === option.value
                      ? 'bg-blue-100 border-blue-300 text-blue-700'
                      : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Range */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 mb-2">
                Start Date * (dd/mm/yyyy)
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="dateFrom"
                  name="dateFrom"
                  value={formData.dateFrom}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  style={{
                    colorScheme: 'light',
                    position: 'relative',
                    padding: '8px 12px',
                    fontSize: '14px'
                  }}
                  onFocus={(e) => e.target.showPicker && e.target.showPicker()}
                />
              </div>
            </div>

            <div>
              <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 mb-2">
                End Date * (dd/mm/yyyy)
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="dateTo"
                  name="dateTo"
                  value={formData.dateTo}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  style={{
                    colorScheme: 'light',
                    position: 'relative',
                    padding: '8px 12px',
                    fontSize: '14px'
                  }}
                  onFocus={(e) => e.target.showPicker && e.target.showPicker()}
                />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="brandId" className="block text-sm font-medium text-gray-700 mb-2">
                Brand (Optional)
              </label>
              <select
                id="brandId"
                name="brandId"
                value={formData.brandId}
                onChange={handleInputChange}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">All Brands</option>
                {Array.isArray(brands) ? brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                )) : []}
              </select>
            </div>

            <div>
              <label htmlFor="campaignId" className="block text-sm font-medium text-gray-700 mb-2">
                Campaign (Optional)
              </label>
              <select
                id="campaignId"
                name="campaignId"
                value={formData.campaignId}
                onChange={handleInputChange}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">All Campaigns</option>
                {Array.isArray(campaigns) ? campaigns
                  .filter(campaign => !formData.brandId || campaign.brand_id == formData.brandId)
                  .map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                )) : []}
              </select>
            </div>
          </div>

          {/* Sync Options */}
          {mode === 'sync' && (
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="updateExisting"
                  checked={formData.updateExisting}
                  onChange={handleInputChange}
                  disabled={loading}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Update existing reports</span>
              </label>
            </div>
          )}

          {/* Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded-md">
              {success}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={loading || !formData.dateFrom || !formData.dateTo}
              className="px-4 py-2 text-sm text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {loading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {loading 
                ? `${mode === 'generate' ? 'Generating' : 'Syncing'}...` 
                : `${mode === 'generate' ? 'Generate' : 'Sync'} Reports`
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportGenerationModal;