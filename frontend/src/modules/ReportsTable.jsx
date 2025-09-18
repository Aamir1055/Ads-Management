import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Filter, 
  RefreshCw,
  AlertCircle,
  FileText,
  BarChart3,
  TrendingUp,
  Search
} from 'lucide-react';
import reportsService from '../services/reportsService';

// Utility function to format dates for display (DD/MM/YYYY)
const formatDisplayDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB'); // DD/MM/YYYY format
};

// Utility function to get date range label
const getDateRangeLabel = (from, to) => {
  if (!from || !to) return '';
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const diffTime = Math.abs(toDate - fromDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays <= 7) return `Last ${diffDays} days`;
  if (diffDays <= 30) return `Last ${Math.ceil(diffDays / 7)} weeks`;
  return `${Math.ceil(diffDays / 30)} months`;
};

const ReportsTable = () => {
  // State for filters
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    campaignId: '',
    brand: ''
  });

  // State for data
  const [reportsData, setReportsData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // State for filter options
  const [filterOptions, setFilterOptions] = useState({
    campaigns: [],
    brands: [],
    dateRange: {}
  });

  // State for UI
  const [showFilters, setShowFilters] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);

  // Load filter options on component mount
  useEffect(() => {
    loadFilterOptions();
    setDefaultDateRange();
  }, []);

  // Load reports when filters change
  useEffect(() => {
    if (filters.dateFrom && filters.dateTo) {
      loadReports();
    }
  }, [filters]);

  // Set default date range (last 30 days)
  const setDefaultDateRange = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    setFilters(prev => ({
      ...prev,
      dateFrom: thirtyDaysAgo.toISOString().split('T')[0],
      dateTo: today.toISOString().split('T')[0]
    }));
  };

  // Load filter options from API
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

  // Load reports from API
  const loadReports = async () => {
    if (!filters.dateFrom || !filters.dateTo) return;

    setLoading(true);
    setError('');

    try {
      const response = await reportsService.generateReport(filters);
      
      if (response.success) {
        // The new backend returns data.reports array and data.summary
        const { reports = [], summary: summaryData = null } = response.data || {};
        
        setReportsData(reports);
        setSummary(summaryData);
        setCurrentPage(1); // Reset pagination
        
        console.log('📊 Reports loaded:', {
          totalRecords: reports.length,
          summary: summaryData,
          filters: filters
        });
      } else {
        setError(response.message || 'Failed to load reports');
        setReportsData([]);
        setSummary(null);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
      setError('Failed to load reports. Please try again.');
      setReportsData([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle filter changes
  const updateFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setError(''); // Clear any existing errors
  };

  // Apply quick date presets
  const applyDatePreset = (presetKey) => {
    const presets = reportsService.getDateRangePresets();
    const preset = presets[presetKey];
    if (preset) {
      setFilters(prev => ({
        ...prev,
        dateFrom: preset.from,
        dateTo: preset.to
      }));
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      campaignId: '',
      brand: ''
    });
    setReportsData([]);
    setSummary(null);
    setCurrentPage(1);
  };

  // Pagination calculations
  const totalPages = Math.ceil(reportsData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageData = reportsData.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Cost per lead badge styling
  const getCostPerLeadStyle = (cost) => {
    if (!cost || cost === 0) return 'bg-gray-100 text-gray-800';
    if (cost < 5) return 'bg-green-100 text-green-800';
    if (cost < 10) return 'bg-yellow-100 text-yellow-800';
    if (cost < 20) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <FileText className="h-8 w-8 mr-3 text-blue-600" />
              Campaign Reports
            </h1>
            <p className="text-gray-600 mt-2">
              Live data from campaign performance • 
              {reportsData.length > 0 && (
                <span className="ml-1">
                  {getDateRangeLabel(filters.dateFrom, filters.dateTo)} • 
                  {reportsData.length} records
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={loadReports}
              disabled={loading || !filters.dateFrom || !filters.dateTo}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Loading...' : 'Refresh Data'}
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        {summary && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Campaigns</p>
                  <p className="text-2xl font-bold text-blue-900">{summary.totalCampaigns || 0}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center">
                <BarChart3 className="h-5 w-5 text-green-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-green-600">Total Leads</p>
                  <p className="text-2xl font-bold text-green-900">
                    {reportsService.formatNumber(summary.totalResults || 0)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="h-5 w-5 bg-purple-600 rounded mr-2"></div>
                <div>
                  <p className="text-sm font-medium text-purple-600">Total Spent</p>
                  <p className="text-2xl font-bold text-purple-900">
                    {reportsService.formatCurrency(summary.totalSpent || 0)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="h-5 w-5 bg-orange-600 rounded-full mr-2"></div>
                <div>
                  <p className="text-sm font-medium text-orange-600">Avg Cost/Lead</p>
                  <p className="text-2xl font-bold text-orange-900">
                    {summary.avgCostPerResult > 0 ? 
                      reportsService.formatCurrency(summary.avgCostPerResult) : 
                      'N/A'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
          >
            <Filter className="h-5 w-5 mr-2 text-blue-600" />
            Filters & Date Range
            <svg
              className={`h-4 w-4 ml-2 transition-transform ${showFilters ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        
        {showFilters && (
          <div className="p-6 space-y-6">
            {/* Date Range Section */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                <Calendar className="h-4 w-4 inline mr-1" />
                Date Range (Required)
              </label>
              
              {/* Quick Presets */}
              <div className="flex flex-wrap gap-2 mb-4">
                {Object.entries(reportsService.getDateRangePresets()).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => applyDatePreset(key)}
                    disabled={loading}
                    className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors disabled:opacity-50"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Custom Date Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">From Date</label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => updateFilter('dateFrom', e.target.value)}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">To Date</label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => updateFilter('dateTo', e.target.value)}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:bg-gray-50"
                  />
                </div>
              </div>
            </div>

            {/* Campaign and Brand Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Campaign</label>
                <select
                  value={filters.campaignId}
                  onChange={(e) => updateFilter('campaignId', e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:bg-gray-50"
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Brand</label>
                <select
                  value={filters.brand}
                  onChange={(e) => updateFilter('brand', e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:bg-gray-50"
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
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <button
                onClick={clearAllFilters}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Clear all filters
              </button>
              <div className="text-sm text-gray-600">
                {reportsData.length} record{reportsData.length !== 1 ? 's' : ''} found
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Campaign Performance Data</h3>
            {reportsData.length > 0 && (
              <div className="text-sm text-gray-500">
                Showing {startIndex + 1} to {Math.min(endIndex, reportsData.length)} of {reportsData.length} entries
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading campaign data...</p>
            </div>
          </div>
        ) : reportsData.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No data available</h3>
            <p className="text-gray-600 max-w-sm mx-auto">
              {filters.dateFrom && filters.dateTo 
                ? 'No records found for the selected date range and filters. Try adjusting your selection.'
                : 'Please select a date range to view campaign reports.'
              }
            </p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Campaign</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Brand</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Facebook</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Zoho</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Leads</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount Spent</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cost/Lead</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentPageData.map((report, index) => {
                    const costPerLead = report.cost_per_lead ? parseFloat(report.cost_per_lead) : 0;
                    
                    return (
                      <tr key={`${report.id}-${index}`} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {report.campaign_name || `Campaign ${report.campaign_id}`}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {report.brand || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDisplayDate(report.report_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {reportsService.formatNumber(report.facebook_result || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {reportsService.formatNumber(report.zoho_result || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">
                          {reportsService.formatNumber(report.leads || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {reportsService.formatCurrency(report.spent || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getCostPerLeadStyle(costPerLead)}`}>
                            {costPerLead > 0 ? reportsService.formatCurrency(costPerLead) : 'N/A'}
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
              <div className="bg-white px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(endIndex, reportsData.length)}</span> of{' '}
                    <span className="font-medium">{reportsData.length}</span> results
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => goToPage(pageNum)}
                            className={`px-3 py-1 text-sm rounded transition-colors ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ReportsTable;
