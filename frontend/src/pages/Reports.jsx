import React, { useState, useEffect } from 'react';
import reportsService from '../services/reportsService';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorAlert from '../components/common/ErrorAlert';

const Reports = () => {
  // Data states
  const [reports, setReports] = useState([]);
  const [availableCampaigns, setAvailableCampaigns] = useState([]);
  const [availableBrands, setAvailableBrands] = useState([]);
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedReports, setSelectedReports] = useState([]);
  
  // Filter and pagination states
  const [filters, setFilters] = useState({
    campaign_name: '',
    brand_name: '',
    date_preset: '',
    date_from: '',
    date_to: ''
  });
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalPages: 0,
    totalCount: 0,
    hasNext: false,
    hasPrev: false
  });

  // Load filtered data only when filters change (not on initial mount)
  useEffect(() => {
    if (filters.date_from || filters.date_to || filters.campaign_name || filters.brand_name || pagination.page > 1) {
      loadReports();
    }
  }, [filters, pagination.page, pagination.limit]);

  // Load all reports initially to populate dropdowns
  useEffect(() => {
    loadAllReports();
  }, []);

  const loadAllReports = async () => {
    try {
      setLoading(true);
      const params = {
        page: 1,
        limit: 1000 // Get all reports for dropdown population
      };

      console.log('Loading all reports for dropdowns with params:', params);
      const response = await reportsService.getAllReports(params);
      console.log('All reports response:', response);
      
      if (response.success) {
        const reportsData = response.data || [];
        
        // Extract unique campaigns and brands from the reports data
        const uniqueCampaigns = [...new Set(reportsData
          .map(report => report.campaign_name)
          .filter(name => name && name !== '-' && name !== null && name !== undefined)
        )].sort();
        
        const uniqueBrands = [...new Set(reportsData
          .map(report => report.brand_name)
          .filter(name => name && name !== '-' && name !== null && name !== undefined)
        )].sort();
        
        console.log('Extracted unique campaigns:', uniqueCampaigns);
        console.log('Extracted unique brands:', uniqueBrands);
        
        setAvailableCampaigns(uniqueCampaigns);
        setAvailableBrands(uniqueBrands);
        
        // If no filters are set, show all data
        if (!filters.date_from && !filters.date_to && !filters.campaign_name && !filters.brand_name) {
          setReports(reportsData.slice(0, pagination.limit));
          setPagination(prev => ({
            ...prev,
            totalCount: reportsData.length,
            totalPages: Math.ceil(reportsData.length / pagination.limit),
            hasNext: reportsData.length > pagination.limit,
            hasPrev: false
          }));
        }
        
        setError('');
      } else {
        setError(response.message || 'Failed to load reports');
        setReports([]);
        setAvailableCampaigns([]);
        setAvailableBrands([]);
      }
    } catch (error) {
      console.error('Error loading all reports:', error);
      setError(error.message || 'Failed to load reports');
      setReports([]);
      setAvailableCampaigns([]);
      setAvailableBrands([]);
    } finally {
      setLoading(false);
    }
  };

  const loadReports = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      };

      console.log('Loading reports with params:', params);
      console.log('Current filters:', filters);
      const response = await reportsService.getAllReports(params);
      console.log('Reports response:', response);
      
      if (response.success) {
        const reportsData = response.data || [];
        setReports(reportsData);
        
        if (response.meta?.pagination) {
          setPagination(prev => ({
            ...prev,
            ...response.meta.pagination
          }));
        }
        setError('');
      } else {
        setError(response.message || 'Failed to load reports');
        setReports([]);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
      setError(error.message || 'Failed to load reports');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  // Date preset handler
  const handleDatePreset = (preset) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let dateFrom, dateTo;
    
    switch (preset) {
      case 'today':
        dateFrom = dateTo = today.toISOString().split('T')[0];
        break;
      case 'yesterday':
        dateFrom = dateTo = yesterday.toISOString().split('T')[0];
        break;
      case 'last7days':
        const last7Days = new Date(today);
        last7Days.setDate(last7Days.getDate() - 7);
        dateFrom = last7Days.toISOString().split('T')[0];
        dateTo = today.toISOString().split('T')[0];
        break;
      case 'lastMonth':
        const lastMonth = new Date(today);
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        dateFrom = lastMonth.toISOString().split('T')[0];
        dateTo = today.toISOString().split('T')[0];
        break;
      case 'last3Months':
        const last3Months = new Date(today);
        last3Months.setMonth(last3Months.getMonth() - 3);
        dateFrom = last3Months.toISOString().split('T')[0];
        dateTo = today.toISOString().split('T')[0];
        break;
      default:
        return;
    }
    
    setFilters(prev => ({
      ...prev,
      date_preset: preset,
      date_from: dateFrom,
      date_to: dateTo
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleClearFilters = () => {
    setFilters({
      campaign_name: '',
      brand_name: '',
      date_preset: '',
      date_from: '',
      date_to: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
    // Reload all data when filters are cleared
    loadAllReports();
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleSelectReport = (reportId) => {
    setSelectedReports(prev => 
      prev.includes(reportId)
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  const handleSelectAllReports = () => {
    if (selectedReports.length === reports.length) {
      setSelectedReports([]);
    } else {
      setSelectedReports(reports.map((report, index) => report.id || `${report.campaign_id}-${report.report_date}-${index}`));
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      const response = await reportsService.deleteReport(reportId);
      if (response.success) {
        loadReports(); // Reload the list
        setSelectedReports(prev => prev.filter(id => id !== reportId));
      } else {
        alert('Failed to delete report: ' + response.message);
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('Failed to delete report');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedReports.length === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedReports.length} selected report(s)?`)) return;

    try {
      const promises = selectedReports.map(id => reportsService.deleteReport(id));
      await Promise.all(promises);
      loadReports();
      setSelectedReports([]);
    } catch (error) {
      console.error('Error deleting reports:', error);
      alert('Failed to delete some reports');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
  };
  
  const formatCostPerLead = (cost) => {
    if (cost === null || cost === undefined) return 'N/A';
    return formatCurrency(cost);
  };

  // Date conversion helpers
  const formatDateToDisplay = (backendDate) => {
    if (!backendDate) return '';
    const date = new Date(backendDate + 'T00:00:00'); // Add time to avoid timezone issues
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const convertDisplayToBackend = (displayDate) => {
    if (!displayDate) return '';
    const regex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    const match = displayDate.match(regex);
    if (match) {
      const day = match[1].padStart(2, '0');
      const month = match[2].padStart(2, '0');
      const year = match[3];
      return `${year}-${month}-${day}`;
    }
    return '';
  };


  if (loading && reports.length === 0) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <LoadingSkeleton className="h-8 w-64 mb-4" />
          <LoadingSkeleton className="h-6 w-96" />
        </div>
        <div className="grid grid-cols-1 gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <LoadingSkeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Reports</h1>
        <p className="text-gray-600">Manage and view your advertising campaign reports</p>
      </div>

      {/* Action Buttons */}
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={loadAllReports}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center disabled:opacity-50"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>

        {selectedReports.length > 0 && (
          <button
            onClick={handleBulkDelete}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Selected ({selectedReports.length})
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg">
        {/* Date Presets */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Quick Date Filters</label>
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'today', label: 'Today' },
              { value: 'yesterday', label: 'Yesterday' },
              { value: 'last7days', label: 'Last 7 Days' },
              { value: 'lastMonth', label: 'Last Month' },
              { value: 'last3Months', label: 'Last 3 Months' }
            ].map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => handleDatePreset(preset.value)}
                className={`px-3 py-1 text-xs border rounded-md transition-colors ${
                  filters.date_preset === preset.value
                    ? 'bg-blue-100 border-blue-300 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
            <select
              value={filters.brand_name}
              onChange={(e) => handleFilterChange('brand_name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Brands</option>
              {availableBrands.map((brandName) => (
                <option key={brandName} value={brandName}>
                  {brandName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Campaign</label>
            <select
              value={filters.campaign_name}
              onChange={(e) => handleFilterChange('campaign_name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Campaigns</option>
              {availableCampaigns.map((campaignName) => (
                <option key={campaignName} value={campaignName}>
                  {campaignName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date (dd/mm/yyyy)</label>
            <div className="relative">
              <input
                type="text"
                placeholder="dd/mm/yyyy"
                value={filters.date_from ? formatDateToDisplay(filters.date_from) : ''}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow only numbers and forward slashes
                  const cleanValue = value.replace(/[^0-9/]/g, '');
                  // Auto-format as user types
                  let formatted = cleanValue;
                  if (cleanValue.length >= 2 && !cleanValue.includes('/')) {
                    formatted = cleanValue.slice(0, 2) + '/' + cleanValue.slice(2);
                  }
                  if (cleanValue.length >= 5 && cleanValue.split('/').length === 2) {
                    const parts = cleanValue.split('/');
                    formatted = parts[0] + '/' + parts[1].slice(0, 2) + '/' + parts[1].slice(2);
                  }
                  if (formatted.length <= 10) {
                    // Convert dd/mm/yyyy to yyyy-mm-dd for backend
                    const backendDate = convertDisplayToBackend(formatted);
                    handleFilterChange('date_from', backendDate);
                    handleFilterChange('date_preset', ''); // Clear preset when manual date is set
                  }
                }}
                onBlur={(e) => {
                  // Validate format on blur
                  const value = e.target.value;
                  const regex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
                  if (value && !regex.test(value)) {
                    alert('Please enter date in dd/mm/yyyy format');
                  }
                }}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => {
                  handleFilterChange('date_from', e.target.value);
                  handleFilterChange('date_preset', '');
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 w-6 h-6 cursor-pointer"
                onFocus={(e) => e.target.showPicker && e.target.showPicker()}
                style={{ pointerEvents: 'all' }}
              />
              <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date (dd/mm/yyyy)</label>
            <div className="relative">
              <input
                type="text"
                placeholder="dd/mm/yyyy"
                value={filters.date_to ? formatDateToDisplay(filters.date_to) : ''}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow only numbers and forward slashes
                  const cleanValue = value.replace(/[^0-9/]/g, '');
                  // Auto-format as user types
                  let formatted = cleanValue;
                  if (cleanValue.length >= 2 && !cleanValue.includes('/')) {
                    formatted = cleanValue.slice(0, 2) + '/' + cleanValue.slice(2);
                  }
                  if (cleanValue.length >= 5 && cleanValue.split('/').length === 2) {
                    const parts = cleanValue.split('/');
                    formatted = parts[0] + '/' + parts[1].slice(0, 2) + '/' + parts[1].slice(2);
                  }
                  if (formatted.length <= 10) {
                    // Convert dd/mm/yyyy to yyyy-mm-dd for backend
                    const backendDate = convertDisplayToBackend(formatted);
                    handleFilterChange('date_to', backendDate);
                    handleFilterChange('date_preset', ''); // Clear preset when manual date is set
                  }
                }}
                onBlur={(e) => {
                  // Validate format on blur
                  const value = e.target.value;
                  const regex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
                  if (value && !regex.test(value)) {
                    alert('Please enter date in dd/mm/yyyy format');
                  }
                }}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => {
                  handleFilterChange('date_to', e.target.value);
                  handleFilterChange('date_preset', '');
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 w-6 h-6 cursor-pointer"
                onFocus={(e) => e.target.showPicker && e.target.showPicker()}
                style={{ pointerEvents: 'all' }}
              />
              <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleClearFilters}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md font-medium transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && <ErrorAlert message={error} className="mb-6" />}

      {/* Reports Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={selectedReports.length === reports.length && reports.length > 0}
              onChange={handleSelectAllReports}
              className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <h3 className="text-lg font-medium text-gray-900">
              Reports ({pagination.totalCount})
            </h3>
          </div>
          <div className="text-sm text-gray-500">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of {pagination.totalCount}
          </div>
        </div>

        {/* Table Content */}
        {reports.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No reports</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by generating some reports.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Select
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campaign Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campaign Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Brand Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Facebook Leads
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Zoho Leads
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Leads
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Facebook Cost Per Lead
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Zoho Cost Per Lead
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Cost Per Lead
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((report, index) => (
                  <tr key={report.id || `${report.campaign_id}-${report.report_date}-${index}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedReports.includes(report.id || `${report.campaign_id}-${report.report_date}-${index}`)}
                        onChange={() => handleSelectReport(report.id || `${report.campaign_id}-${report.report_date}-${index}`)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(report.report_date || report.data_date || report.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.campaign_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.campaign_type || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.brand_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(report.facebook_leads || report.facebook_result || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(report.zoho_leads || report.zoho_result || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {formatNumber(report.total_leads || report.leads || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(report.facebook_cost_per_lead || (report.amount_spend || report.spent || 0) / (report.facebook_leads || report.facebook_result || 1))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(report.zoho_cost_per_lead || (report.amount_spend || report.spent || 0) / (report.zoho_leads || report.zoho_result || 1))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {formatCurrency(report.total_cost_per_lead || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDeleteReport(report.id || `${report.campaign_id}-${report.report_date}-${index}`)}
                        className="text-red-600 hover:text-red-900 ml-2"
                        title="Delete report"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="flex justify-between flex-1 sm:hidden">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={!pagination.hasPrev}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.hasNext}
                className="relative ml-3 inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{pagination.page}</span> of{' '}
                  <span className="font-medium">{pagination.totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPrev}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                    {pagination.page} / {pagination.totalPages}
                  </span>
                  
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNext}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>


    </div>
  );
};

export default Reports;