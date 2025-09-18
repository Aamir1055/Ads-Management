import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Filter, 
  Search,
  Download,
  RefreshCw,
  AlertCircle,
  FileText,
  BarChart3
} from 'lucide-react';
import reportsService from '../services/reportsService';

// Date formatting utility for DD/MM/YYYY display
const formatDateToDisplay = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const ReportsTable = () => {
  // State for filters
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    campaignId: '',
    brand: ''
  });

  // State for data and UI
  const [reportData, setReportData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterOptions, setFilterOptions] = useState({
    campaigns: [],
    brands: [],
    dateRange: {}
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // UI state for collapsible filters
  const [showFilters, setShowFilters] = useState(false);

  // Load initial data and filter options
  useEffect(() => {
    loadFilterOptions();
    loadDefaultData();
  }, []);

  // Filter data when filters change
  useEffect(() => {
    if (filters.dateFrom && filters.dateTo) {
      loadReportData();
    } else {
      setFilteredData(reportData);
    }
  }, [filters]);

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

  const loadDefaultData = () => {
    // Set default date range (last 30 days)
    const today = new Date();
    const lastMonth = new Date();
    lastMonth.setDate(today.getDate() - 30);
    
    setFilters({
      dateFrom: lastMonth.toISOString().split('T')[0],
      dateTo: today.toISOString().split('T')[0],
      campaignId: '',
      brand: ''
    });
  };

  const loadReportData = async () => {
    if (!filters.dateFrom || !filters.dateTo) return;

    setLoading(true);
    setError('');

    try {
      const response = await reportsService.generateReport(filters);
      
      if (response.success) {
        // generateReport returns data.reports array, not data directly
        const reports = response.data?.reports || [];
        console.log('🔍 Reports API Response:', {
          totalRecords: reports.length,
          sampleData: reports.slice(0, 3),
          fullResponse: response.data,
          allReports: reports
        });
        setReportData(reports);
        setFilteredData(reports);
        setCurrentPage(1); // Reset to first page when data changes
      } else {
        setError(response.data?.message || response.message || 'Failed to load report data');
        setReportData([]);
        setFilteredData([]);
      }
    } catch (error) {
      console.error('Error loading report data:', error);
      setError('Failed to load report data. Please try again.');
      setReportData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setError('');
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

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      campaignId: '',
      brand: ''
    });
    setReportData([]);
    setFilteredData([]);
    setCurrentPage(1);
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  
  // Debug pagination
  console.log('📄 Pagination Debug:', {
    filteredDataLength: filteredData.length,
    currentPage,
    itemsPerPage,
    indexOfFirstItem,
    indexOfLastItem,
    currentItemsLength: currentItems.length,
    totalPages,
    currentItemsSample: currentItems.slice(0, 2)
  });

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <FileText className="h-6 w-6 mr-2 text-blue-600" />
            Reports
          </h1>
          <p className="text-gray-600 mt-1">View and analyze campaign performance data</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={loadReportData}
            disabled={loading || !filters.dateFrom || !filters.dateTo}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow p-6">
        {/* Filter Toggle Button */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors"
          >
            <Filter className="h-5 w-5 mr-2 text-blue-600" />
            Filters
            <svg
              className={`h-4 w-4 ml-1 transition-transform ${showFilters ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div className="text-sm text-gray-500">
            {filteredData.length} record{filteredData.length !== 1 ? 's' : ''} found
          </div>
        </div>

        {showFilters && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Date Range *
              </label>
              
              {/* Date Presets */}
              <div className="flex flex-wrap gap-2 mb-3">
                {Object.entries(reportsService.getDateRangePresets()).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => applyDatePreset(key)}
                    disabled={loading}
                    className="px-3 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
  
              {/* Custom Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">From Date</label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    disabled={loading}
                    max={filterOptions.dateRange?.latest}
                    min={filterOptions.dateRange?.earliest}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">To Date</label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    disabled={loading}
                    max={filterOptions.dateRange?.latest}
                    min={filters.dateFrom || filterOptions.dateRange?.earliest}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                  />
                </div>
              </div>
            </div>
  
            {/* Campaign and Brand Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Campaign</label>
                <select
                  value={filters.campaignId}
                  onChange={(e) => handleFilterChange('campaignId', e.target.value)}
                  disabled={loading}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                >
                  <option value="">All Campaigns</option>
                  {filterOptions.campaigns?.map(campaign => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.name} {campaign.brand && `(${campaign.brand})`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                <select
                  value={filters.brand}
                  onChange={(e) => handleFilterChange('brand', e.target.value)}
                  disabled={loading}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
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
  
            {/* Filter Actions */}
            <div className="flex justify-between items-center">
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear all filters
              </button>
              <div className="text-sm text-gray-500">
                {filteredData.length} record{filteredData.length !== 1 ? 's' : ''} found
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Campaign Performance Data
            </h3>
            {filteredData.length > 0 && (
              <div className="text-sm text-gray-500">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length} entries
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No data found</h3>
              <p className="text-gray-600">
                {filters.dateFrom && filters.dateTo 
                  ? 'No records found for the selected filters. Try adjusting your date range or filters.'
                  : 'Please select a date range to view reports.'
                }
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Campaign
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Brand
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Facebook Results
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Zoho Results
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Results
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount Spent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Cost Per Lead
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentItems.map((report, index) => {
                      // Convert cost_per_lead to number for proper comparison
                      const costPerResult = report.cost_per_lead ? 
                        parseFloat(report.cost_per_lead) : 
                        reportsService.calculateCostPerResult(report.spent, report.leads);
                      
                      // Brand and cost per lead are now working correctly
                      
                      return (
                        <tr key={`${report.campaign_id}-${report.report_date}-${index}`} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {report.campaign_name || `Campaign ${report.campaign_id}`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {report.brand || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDateToDisplay(report.report_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {reportsService.formatNumber(report.facebook_result || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {reportsService.formatNumber(report.zoho_result || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {reportsService.formatNumber(report.leads || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {reportsService.formatCurrency(report.spent)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              !costPerResult || costPerResult === 0 ? 'bg-gray-100 text-gray-800' :
                              costPerResult < 5 ? 'bg-green-100 text-green-800' :
                              costPerResult < 10 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {!costPerResult || costPerResult === 0 ? 'N/A' : reportsService.formatCurrency(costPerResult)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                        <span className="font-medium">{Math.min(indexOfLastItem, filteredData.length)}</span> of{' '}
                        <span className="font-medium">{filteredData.length}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => paginate(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        
                        {/* Page numbers */}
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const pageNum = i + 1;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => paginate(pageNum)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                currentPage === pageNum
                                  ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        
                        <button
                          onClick={() => paginate(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsTable;
