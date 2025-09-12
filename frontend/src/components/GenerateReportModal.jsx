import React, { useState, useEffect } from 'react';
import { X, Calendar, Download, Filter, BarChart3, AlertCircle } from 'lucide-react';
import reportsService from '../services/reportsService';
// import * as XLSX from 'xlsx';

// Date formatting utilities
const formatDateToDisplay = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatDateForInput = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const GenerateReportModal = ({ isOpen, onClose, onReportGenerated }) => {
  // State for filters
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    campaignId: '',
    brand: ''
  });

  // State for loading and options
  const [isGenerating, setIsGenerating] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    campaigns: [],
    brands: [],
    dateRange: {}
  });
  const [error, setError] = useState('');

  // Load filter options when modal opens
  useEffect(() => {
    if (isOpen) {
      loadFilterOptions();
      // Set default date range (last 7 days)
      const today = new Date();
      const lastWeek = new Date();
      lastWeek.setDate(today.getDate() - 7);
      
      setFilters({
        dateFrom: lastWeek.toISOString().split('T')[0],
        dateTo: today.toISOString().split('T')[0],
        campaignId: '',
        brand: ''
      });
      setError('');
    }
  }, [isOpen]);

  const loadFilterOptions = async () => {
    try {
      const response = await reportsService.getFilterOptions();
      if (response.success) {
        setFilterOptions(response.data);
      }
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setError('');
  };

  const validateFilters = () => {
    if (!filters.dateFrom || !filters.dateTo) {
      setError('Please select both start and end dates');
      return false;
    }

    const startDate = new Date(filters.dateFrom);
    const endDate = new Date(filters.dateTo);

    if (startDate > endDate) {
      setError('Start date cannot be after end date');
      return false;
    }

    // Check if date range is too long (more than 1 year)
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 365) {
      setError('Date range cannot exceed 1 year');
      return false;
    }

    return true;
  };

  const downloadExcelReport = (reportData, filters) => {
    setError('Excel export is currently disabled due to missing dependency.');
  };

  const handleGenerateReport = async () => {
    if (!validateFilters()) return;

    setIsGenerating(true);
    setError('');

    try {
      const response = await reportsService.generateReport(filters);
      
      if (response.success) {
        // Check if we have data
        if (response.data.message === 'No data found for the selected date range') {
          setError('No data found for the selected date range. Please try different filters.');
        } else {
          // Download Excel file with the report data
          downloadExcelReport(response.data, filters);
        }
      } else {
        setError(response.message || 'Failed to generate report');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      setError('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    if (!isGenerating) {
      onClose();
    }
  };

  const applyDatePreset = (preset) => {
    const presets = reportsService.getDateRangePresets();
    const selectedPreset = presets[preset];
    if (selectedPreset) {
      setFilters(prev => ({
        ...prev,
        dateFrom: selectedPreset.from,
        dateTo: selectedPreset.to
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          onClick={handleClose}
        ></div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <BarChart3 className="h-6 w-6 text-blue-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">
                  Generate Report
                </h3>
              </div>
              <button
                onClick={handleClose}
                disabled={isGenerating}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Generate and download an Excel report based on your selected filters
            </p>
          </div>

          {/* Body */}
          <div className="bg-white px-6 py-4 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            )}

            {/* Date Range */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900 flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                Date Range *
              </h4>
              
              {/* Date Presets */}
              <div className="flex flex-wrap gap-2">
                {Object.entries(reportsService.getDateRangePresets()).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => applyDatePreset(key)}
                    disabled={isGenerating}
                    className="px-3 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Custom Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    disabled={isGenerating}
                    max={filterOptions.dateRange?.latest}
                    min={filterOptions.dateRange?.earliest}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    disabled={isGenerating}
                    max={filterOptions.dateRange?.latest}
                    min={filters.dateFrom || filterOptions.dateRange?.earliest}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900 flex items-center">
                <Filter className="h-4 w-4 mr-2 text-blue-600" />
                Filters (Optional)
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Campaign Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Campaign
                  </label>
                  <select
                    value={filters.campaignId}
                    onChange={(e) => handleFilterChange('campaignId', e.target.value)}
                    disabled={isGenerating}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Campaigns</option>
                    {filterOptions.campaigns?.map(campaign => (
                      <option key={campaign.id} value={campaign.id}>
                        {campaign.name} {campaign.brand && `(${campaign.brand})`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Brand Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Brand
                  </label>
                  <select
                    value={filters.brand}
                    onChange={(e) => handleFilterChange('brand', e.target.value)}
                    disabled={isGenerating}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Brands</option>
                    {filterOptions.brands?.map(brand => (
                      <option key={brand} value={brand}>
                        {brand}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Summary Info */}
            {filterOptions.dateRange?.earliest && filterOptions.dateRange?.latest && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="text-sm text-blue-700">
                  <strong>Available Data:</strong> {formatDateToDisplay(filterOptions.dateRange.earliest)} to {formatDateToDisplay(filterOptions.dateRange.latest)}
                </p>
                <p className="text-sm text-blue-600 mt-1">
                  <strong>Campaigns:</strong> {filterOptions.campaigns?.length || 0} campaigns available
                </p>
                <p className="text-sm text-blue-600">
                  <strong>Brands:</strong> {filterOptions.brands?.length || 0} brands available
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleGenerateReport}
              disabled={isGenerating || !filters.dateFrom || !filters.dateTo}
              className="w-full inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Generate Report
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={isGenerating}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerateReportModal;
