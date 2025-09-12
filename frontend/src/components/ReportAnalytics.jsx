import React, { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Activity,
  Users,
  BarChart3,
  PieChart,
  Download,
  RefreshCw,
  Calendar,
  Filter,
  AlertCircle,
  Wifi,
  WifiOff,
  Play,
  Square
} from 'lucide-react';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ReportAnalytics = () => {
  // State management
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    brand: '',
    campaignId: ''
  });
  const [filterOptions, setFilterOptions] = useState({
    brands: [],
    campaigns: [],
    dateRange: {}
  });

  // Real-time WebSocket state
  const [wsConnected, setWsConnected] = useState(false);
  const [realtimeActive, setRealtimeActive] = useState(false);
  const [updateCount, setUpdateCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(null);
  const wsRef = useRef(null);

  // Auto-refresh state
  const [autoRefresh, setAutoRefresh] = useState(false);
  const autoRefreshRef = useRef(null);

  // Initialize component
  useEffect(() => {
    initializeDates();
    loadFilterOptions();
    loadAnalytics();
    connectWebSocket();

    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
      }
    };
  }, []);

  // Initialize default date range (last 30 days)
  const initializeDates = () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    setFilters(prev => ({
      ...prev,
      dateFrom: thirtyDaysAgo.toISOString().split('T')[0],
      dateTo: now.toISOString().split('T')[0]
    }));
  };

  // Load filter options
  const loadFilterOptions = async () => {
    try {
      const response = await fetch('/api/reports/filters');
      const data = await response.json();
      
      if (data.success) {
        setFilterOptions(data.data);
      }
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  // Load analytics data
  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        date_from: filters.dateFrom,
        date_to: filters.dateTo
      });

      if (filters.brand) params.append('brand', filters.brand);
      if (filters.campaignId) params.append('campaign_id', filters.campaignId);

      const response = await fetch(`/api/reports/charts?${params}`);
      const data = await response.json();

      if (data.success) {
        setAnalyticsData(data.data);
      } else {
        setError(data.message || 'Failed to load analytics data');
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  // WebSocket connection
  const connectWebSocket = () => {
    if (wsRef.current) return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.hostname}:5000/ws/analytics`;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setWsConnected(true);
        
        // Subscribe to updates
        wsRef.current.send(JSON.stringify({
          type: 'subscribe',
          filters: filters,
          updateFrequency: 30000
        }));
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setWsConnected(false);
        setRealtimeActive(false);
        wsRef.current = null;

        // Attempt to reconnect after 3 seconds
        setTimeout(() => {
          if (!wsRef.current) {
            connectWebSocket();
          }
        }, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setWsConnected(false);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  };

  // Handle WebSocket messages
  const handleWebSocketMessage = (message) => {
    switch (message.type) {
      case 'welcome':
        console.log('WebSocket welcome message received');
        break;
      case 'initial_data':
      case 'data_update':
      case 'realtime_update':
        setAnalyticsData(message.data);
        setUpdateCount(prev => prev + 1);
        setLastUpdate(new Date());
        break;
      case 'error':
        console.error('WebSocket error:', message.message);
        setError(message.message);
        break;
      default:
        console.log('Unknown WebSocket message type:', message.type);
    }
  };

  // Toggle real-time updates
  const toggleRealtime = () => {
    if (!wsConnected) {
      connectWebSocket();
      return;
    }

    if (realtimeActive) {
      setRealtimeActive(false);
      if (wsRef.current) {
        wsRef.current.send(JSON.stringify({ type: 'unsubscribe' }));
      }
    } else {
      setRealtimeActive(true);
      if (wsRef.current) {
        wsRef.current.send(JSON.stringify({
          type: 'subscribe',
          filters: filters,
          updateFrequency: 30000
        }));
      }
    }
  };

  // Toggle auto-refresh
  const toggleAutoRefresh = () => {
    if (autoRefresh) {
      clearInterval(autoRefreshRef.current);
      setAutoRefresh(false);
    } else {
      autoRefreshRef.current = setInterval(loadAnalytics, 30000);
      setAutoRefresh(true);
    }
  };

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Apply filters and reload data
  const applyFilters = () => {
    loadAnalytics();
    
    // Update WebSocket subscription if connected
    if (wsRef.current && wsConnected && realtimeActive) {
      wsRef.current.send(JSON.stringify({
        type: 'subscribe',
        filters: filters,
        updateFrequency: 30000
      }));
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!analyticsData) return;

    const { topCampaigns, byBrand, series } = analyticsData;
    
    let csv = 'Campaign Performance\n';
    csv += 'Campaign,Leads,Spending,Cost per Lead\n';
    topCampaigns.forEach(campaign => {
      csv += `"${campaign.campaign_name || 'Unknown'}",${campaign.leads || 0},${campaign.spent || 0},${campaign.cpl || 0}\n`;
    });
    
    csv += '\n\nBrand Performance\n';
    csv += 'Brand,Leads,Spending\n';
    byBrand.forEach(brand => {
      csv += `"${brand.brand || 'Unknown'}",${brand.leads || 0},${brand.spent || 0}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'analytics_report.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Utility functions
  const formatNumber = (number, decimals = 0) => {
    if (isNaN(number) || number === null || number === undefined) return '0';
    return Number(number).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const getPerformanceBadge = (cpl) => {
    if (cpl === 0) return { text: 'No Data', color: 'bg-gray-100 text-gray-800' };
    if (cpl < 5) return { text: 'Excellent', color: 'bg-green-100 text-green-800' };
    if (cpl < 15) return { text: 'Good', color: 'bg-blue-100 text-blue-800' };
    if (cpl < 25) return { text: 'Average', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'Poor', color: 'bg-red-100 text-red-800' };
  };

  // Chart configurations
  const getTrendsChartData = () => {
    if (!analyticsData?.series) return null;

    const labels = analyticsData.series.map(item => 
      new Date(item.date).toLocaleDateString()
    );
    const leadsData = analyticsData.series.map(item => item.leads || 0);
    const spentData = analyticsData.series.map(item => item.spent || 0);

    return {
      labels,
      datasets: [
        {
          label: 'Leads',
          data: leadsData,
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          tension: 0.4,
          yAxisID: 'y',
        },
        {
          label: 'Spending',
          data: spentData,
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4,
          yAxisID: 'y1',
        }
      ]
    };
  };

  const getBrandsChartData = () => {
    if (!analyticsData?.byBrand) return null;

    const labels = analyticsData.byBrand.map(item => item.brand || 'Unknown');
    const data = analyticsData.byBrand.map(item => item.leads || 0);
    const colors = [
      '#6366f1', '#8b5cf6', '#10b981', '#ef4444', '#f59e0b',
      '#3b82f6', '#ec4899', '#06b6d4', '#84cc16', '#f97316'
    ];

    return {
      labels,
      datasets: [{
        data,
        backgroundColor: colors.slice(0, labels.length),
        borderWidth: 2
      }]
    };
  };

  const getSpendingChartData = () => {
    if (!analyticsData?.byBrand) return null;

    const labels = analyticsData.byBrand.map(item => item.brand || 'Unknown');
    const data = analyticsData.byBrand.map(item => item.spent || 0);

    return {
      labels,
      datasets: [{
        label: 'Spending',
        data,
        backgroundColor: 'rgba(99, 102, 241, 0.8)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 1
      }]
    };
  };

  const getCampaignChartData = () => {
    if (!analyticsData?.topCampaigns) return null;

    const top10 = analyticsData.topCampaigns.slice(0, 10);
    const labels = top10.map(item => item.campaign_name || `Campaign ${item.campaign_id}`);
    const leadsData = top10.map(item => item.leads || 0);
    const spentData = top10.map(item => item.spent || 0);

    return {
      labels,
      datasets: [
        {
          label: 'Leads',
          data: leadsData,
          backgroundColor: 'rgba(99, 102, 241, 0.8)',
          yAxisID: 'y',
        },
        {
          label: 'Spending',
          data: spentData,
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          yAxisID: 'y1',
        }
      ]
    };
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  const dualAxisOptions = {
    ...chartOptions,
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Leads'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Spending ($)'
        },
        grid: {
          drawOnChartArea: false,
        }
      }
    }
  };

  // Calculate KPIs
  const getKPIs = () => {
    if (!analyticsData) return {};

    const { series, byBrand, topCampaigns } = analyticsData;
    const totalLeads = series.reduce((sum, item) => sum + (item.leads || 0), 0);
    const totalSpent = series.reduce((sum, item) => sum + (item.spent || 0), 0);
    const avgCPL = totalLeads > 0 ? (totalSpent / totalLeads) : 0;

    return {
      totalLeads,
      totalSpent,
      avgCPL,
      totalCampaigns: topCampaigns.length
    };
  };

  const kpis = getKPIs();

  if (loading && !analyticsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">📊 Analytics Dashboard</h1>
            <p className="text-blue-100 mt-1">
              Comprehensive campaign performance insights and data visualization
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {/* WebSocket Status */}
            <div className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm ${
              wsConnected ? 'bg-green-500' : 'bg-red-500'
            } bg-opacity-20`}>
              {wsConnected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              <span>{wsConnected ? 'Live' : 'Offline'}</span>
            </div>
            
            {/* Real-time Toggle */}
            <button
              onClick={toggleRealtime}
              className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                realtimeActive 
                  ? 'bg-red-500 bg-opacity-20 text-red-100' 
                  : 'bg-green-500 bg-opacity-20 text-green-100'
              }`}
            >
              {realtimeActive ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              <span>{realtimeActive ? 'Stop Live' : 'Start Live'}</span>
            </button>
          </div>
        </div>

        {/* Real-time Stats */}
        {(updateCount > 0 || lastUpdate) && (
          <div className="mt-4 flex items-center space-x-6 text-sm text-blue-100">
            <div>Updates Received: {updateCount}</div>
            {lastUpdate && (
              <div>Last Update: {lastUpdate.toLocaleTimeString()}</div>
            )}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
            <select
              value={filters.brand}
              onChange={(e) => handleFilterChange('brand', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Brands</option>
              {filterOptions.brands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Campaign</label>
            <select
              value={filters.campaignId}
              onChange={(e) => handleFilterChange('campaignId', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Campaigns</option>
              {filterOptions.campaigns.map(campaign => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.name} ({campaign.brand || 'No Brand'})
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={applyFilters}
            disabled={loading}
            className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Filter className="h-4 w-4 mr-2" />
            {loading ? 'Loading...' : 'Apply Filters'}
          </button>
          <div className="flex space-x-2">
            <button
              onClick={toggleAutoRefresh}
              className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                autoRefresh 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? 'Stop Auto' : 'Auto Refresh'}
            </button>
            <button
              onClick={exportToCSV}
              disabled={!analyticsData}
              className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
            >
              <Download className="h-4 w-4 mr-1" />
              CSV
            </button>
          </div>
        </div>
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

      {analyticsData && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Leads</p>
                  <p className="text-3xl font-bold text-gray-900">{formatNumber(kpis.totalLeads)}</p>
                </div>
                <Target className="h-8 w-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total Spent</p>
                  <p className="text-3xl font-bold text-gray-900">{formatCurrency(kpis.totalSpent)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Avg Cost Per Lead</p>
                  <p className="text-3xl font-bold text-gray-900">{formatCurrency(kpis.avgCPL)}</p>
                </div>
                <Activity className="h-8 w-8 text-purple-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Active Campaigns</p>
                  <p className="text-3xl font-bold text-gray-900">{formatNumber(kpis.totalCampaigns)}</p>
                </div>
                <Users className="h-8 w-8 text-orange-500" />
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Trends */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Performance Trends</h3>
              </div>
              <div className="h-80">
                {getTrendsChartData() && (
                  <Line data={getTrendsChartData()} options={dualAxisOptions} />
                )}
              </div>
            </div>

            {/* Leads by Brand */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <PieChart className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Leads by Brand</h3>
              </div>
              <div className="h-80">
                {getBrandsChartData() && (
                  <Doughnut data={getBrandsChartData()} options={chartOptions} />
                )}
              </div>
            </div>

            {/* Spending Distribution */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <DollarSign className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Spending Distribution</h3>
              </div>
              <div className="h-80">
                {getSpendingChartData() && (
                  <Bar data={getSpendingChartData()} options={chartOptions} />
                )}
              </div>
            </div>

            {/* Campaign Performance */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <BarChart3 className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Campaign Performance</h3>
              </div>
              <div className="h-80">
                {getCampaignChartData() && (
                  <Bar data={getCampaignChartData()} options={dualAxisOptions} />
                )}
              </div>
            </div>
          </div>

          {/* Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Campaigns Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                <h3 className="text-lg font-medium text-white">📋 Top Campaigns Performance</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leads</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Spending</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPL</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analyticsData.topCampaigns.slice(0, 10).map((campaign, index) => {
                      const performance = getPerformanceBadge(campaign.cpl || 0);
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {campaign.campaign_name || `Campaign ${campaign.campaign_id}`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatNumber(campaign.leads || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(campaign.spent || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(campaign.cpl || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${performance.color}`}>
                              {performance.text}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Brand Performance Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                <h3 className="text-lg font-medium text-white">🏢 Brand Performance Summary</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Leads</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Spending</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg CPL</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Market Share</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analyticsData.byBrand.map((brand, index) => {
                      const totalLeads = analyticsData.byBrand.reduce((sum, b) => sum + (b.leads || 0), 0);
                      const marketShare = totalLeads > 0 ? ((brand.leads || 0) / totalLeads * 100) : 0;
                      const avgCPL = (brand.leads || 0) > 0 ? (brand.spent || 0) / (brand.leads || 0) : 0;
                      
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {brand.brand || 'Unknown'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatNumber(brand.leads || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(brand.spent || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(avgCPL)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatNumber(marketShare, 1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReportAnalytics;
