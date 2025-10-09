import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Calendar,
  RefreshCw,
  Download,
  Eye,
  Activity,
  PieChart,
  Zap,
  AlertTriangle,
  ChevronRight,
  Play,
  Pause,
  Settings,
  Filter,
  Building2
} from 'lucide-react';

// Chart components
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

// Services
import safeDashboardService from '../services/safeDashboardService';
import dashboardService from '../services/dashboardService';

// Register ChartJS components
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

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State management - will load real data
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState({});
  const [loading, setLoading] = useState({
    overview: false,
    trends: false,
    campaigns: false
  });
  const [error, setError] = useState(null);
  
  // Real-time data will be loaded from API
  const [realTimeData, setRealTimeData] = useState(null);

  // Load data for specific tab - SAFE VERSION
  const loadTabData = useCallback(async (tab) => {
    console.log(`SafeDashboard: Loading data for ${tab} tab...`);
    try {
      setLoading(prev => ({ ...prev, [tab]: true }));
      setError(null); // Clear any previous errors
      let data;
      
      switch (tab) {
        case 'overview':
          data = await safeDashboardService.getOverview();
          // Also try to load real-time data for overview
          try {
            const realtime = await safeDashboardService.getRealTimeMetrics();
            if (realtime?.data) {
              setRealTimeData(realtime.data);
              console.log('SafeDashboard: Real-time data loaded');
            }
          } catch (realtimeErr) {
            console.log('SafeDashboard: Real-time data not available:', realtimeErr.message);
            // Not a critical error, continue without real-time data
          }
          break;
        case 'trends':
          data = await safeDashboardService.getTrends();
          break;
        case 'campaigns':
          data = await safeDashboardService.getCampaigns();
          break;
        default:
          return;
      }
      
      if (data?.data) {
        setDashboardData(prev => ({ ...prev, [tab]: data.data }));
        console.log(`SafeDashboard: ${tab} data loaded successfully:`, data.data);
        
        // Debug: Log the structure to understand available fields
        if (tab === 'overview') {
          console.log('SafeDashboard: Overview data structure:', {
            fullData: data.data,
            campaigns: data.data?.campaigns,
            performance: data.data?.performance,
            todayFields: Object.keys(data.data || {}).filter(key => key.toLowerCase().includes('today')),
            allFields: Object.keys(data.data || {})
          });
        }
        
        toast.success(`${tab} data loaded successfully`);
      } else {
        console.warn(`SafeDashboard: No data received for ${tab}`);
        setError(`No data available for ${tab}`);
      }
    } catch (err) {
      console.error(`SafeDashboard: Failed to load ${tab} data:`, err.message);
      setError(`Failed to load ${tab} data: ${err.message}`);
      toast.error(`Failed to load ${tab} data`);
    } finally {
      setLoading(prev => ({ ...prev, [tab]: false }));
    }
  }, []);

  // Initialize dashboard - Test connection and load overview data
  useEffect(() => {
    console.log('SafeDashboard: Component mounted, initializing...');
    
    const initDashboard = async () => {
      try {
        // Test API connection first
        console.log('SafeDashboard: Testing API connection...');
        const connectionTest = await safeDashboardService.testConnection();
        
        if (connectionTest.success) {
          console.log('SafeDashboard: API connection successful, loading overview data...');
          await loadTabData('overview');
        } else {
          console.error('SafeDashboard: API connection failed:', connectionTest.message);
          setError('Unable to connect to the server. Please check if the backend is running.');
          toast.error('Backend connection failed');
        }
      } catch (err) {
        console.error('SafeDashboard: Initialization failed:', err.message);
        setError('Failed to initialize dashboard');
        toast.error('Dashboard initialization failed');
      }
    };
    
    // Delay initialization to ensure auth is stable
    const timer = setTimeout(initDashboard, 2000);
    
    return () => clearTimeout(timer);
  }, []); // Empty dependency array - runs only once on mount
  
  // Refs - REMOVED to prevent loops

  // Navigation handlers - SIMPLIFIED
  const navigateTo = useCallback((path) => {
    console.log('Navigating to:', path);
    navigate(path);
  }, [navigate]);

  // Refresh function - ENABLED with force refresh
  const refreshAll = async () => {
    console.log('Dashboard: Starting FORCE REFRESH...');
    toast.info('Force refreshing all data...');
    
    try {
      setLoading({ overview: true, trends: true, campaigns: true });
      setError(null);
      
      // Use the new force refresh method to bypass all caches
      const result = await dashboardService.forceRefresh();
      
      if (result.success && result.data) {
        console.log('Dashboard: Force refresh successful, updating state...');
        
        // Update dashboard data with fresh results
        const [overview, trends, campaigns, brands, activities] = result.data;
        
        setDashboardData({
          overview: overview?.data,
          trends: trends?.data,
          campaigns: campaigns?.data,
          brands: brands?.data,
          activities: activities?.data
        });
        
        toast.success('Dashboard refreshed successfully');
      } else {
        throw new Error(result.message || 'Force refresh failed');
      }
      
    } catch (error) {
      console.error('Dashboard: Force refresh failed:', error);
      setError(`Force refresh failed: ${error.message}`);
      toast.error('Failed to refresh dashboard');
      
      // Fallback to safe service for current tab
      console.log('Dashboard: Falling back to safe service for current tab...');
      try {
        await loadTabData(activeTab);
      } catch (fallbackError) {
        console.error('Dashboard: Fallback also failed:', fallbackError);
      }
    } finally {
      setLoading({ overview: false, trends: false, campaigns: false });
    }
  };

  // Tab configuration - Removed Activities and Brands
  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3, color: 'blue' },
    { id: 'trends', name: 'Trends', icon: TrendingUp, color: 'green' },
    { id: 'campaigns', name: 'Campaigns', icon: Target, color: 'purple' }
  ];

  // Load data when tab changes - ENABLED with safe service
  const handleTabChange = (tabId) => {
    console.log(`SafeDashboard: Changing to ${tabId} tab`);
    setActiveTab(tabId);
    
    // Load data if not already loaded
    if (!dashboardData[tabId] && !loading[tabId]) {
      console.log(`SafeDashboard: Loading data for new tab: ${tabId}`);
      loadTabData(tabId);
    }
  };

  // Enhanced chart options for better readability
  const getChartOptions = (title, yAxisLabel) => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index'
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: 'bold'
          }
        }
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: 20
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#3B82F6',
        borderWidth: 2,
        cornerRadius: 8,
        padding: 12
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          font: {
            size: 11,
            weight: '500'
          },
          color: '#6B7280'
        }
      },
      y: {
        beginAtZero: true,
        display: true,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)'
        },
        title: {
          display: true,
          text: yAxisLabel,
          font: {
            size: 12,
            weight: 'bold'
          },
          color: '#374151'
        },
        ticks: {
          font: {
            size: 11
          },
          color: '#6B7280'
        }
      }
    },
    elements: {
      point: {
        radius: 6,
        hoverRadius: 8,
        borderWidth: 3,
        backgroundColor: '#fff'
      },
      line: {
        tension: 0.4,
        borderWidth: 3
      }
    }
  });

  // DISABLED export handler to prevent loops
  const handleExport = (type, format) => {
    console.log('Export disabled to prevent loops');
    toast.error('Export temporarily disabled');
  };

  // Metric cards component - No click functionality
  const MetricCard = ({ title, value, change, icon: Icon, color, loading }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-all duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="flex items-center mt-2">
            {loading ? (
              <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
            ) : (
              <p className="text-2xl font-bold text-gray-900">
                {typeof value === 'number' && value >= 1000 ? 
                  (value >= 100000 ? `${(value/100000).toFixed(1)}L` : `${(value/1000).toFixed(1)}K`) : 
                  value?.toLocaleString?.() || value || '0'}
              </p>
            )}
            {change !== undefined && !loading && (
              <span className={`ml-2 text-sm font-medium ${
                change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {change > 0 ? '+' : ''}{change}%
              </span>
            )}
          </div>
        </div>
        <div className={`p-3 rounded-full bg-${color}-100`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  // SIMPLIFIED - All complex logic removed to prevent loops

  // Activity item component
  const ActivityItem = ({ activity }) => {
    const getActivityIcon = (type) => {
      switch (type) {
        case 'campaign_created': return Target;
        case 'report_generated': return BarChart3;
        case 'card_updated': return DollarSign;
        default: return Activity;
      }
    };

    const Icon = getActivityIcon(activity.type);
    return (
      <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
        <div className="flex-shrink-0">
          <div className="p-2 bg-blue-100 rounded-full">
            <Icon className="h-4 w-4 text-blue-600" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{activity.title}</p>
          <p className="text-sm text-gray-500 mt-1">{activity.description}</p>
          <p className="text-xs text-gray-400 mt-1">
            {new Date(activity.timestamp).toLocaleString()}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Dashboard
              </h1>
              <span className="ml-3 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                {user?.username || 'User'}
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Status indicator */}
              <div className="flex items-center space-x-2">
                <div className={`h-2 w-2 rounded-full ${
                  Object.values(loading).some(Boolean) ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'
                }`}></div>
                <span className="text-xs text-gray-500">
                  {Object.values(loading).some(Boolean) ? 'Loading...' : 'Ready'}
                </span>
              </div>

              {/* Refresh buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    console.log('Dashboard: Quick refresh current tab...');
                    loadTabData(activeTab);
                    toast.info('Refreshing current tab...');
                  }}
                  disabled={Object.values(loading).some(Boolean)}
                  className="flex items-center space-x-2 px-3 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <RefreshCw className={`h-4 w-4 ${Object.values(loading).some(Boolean) ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
                
                <button
                  onClick={refreshAll}
                  disabled={Object.values(loading).some(Boolean)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <RefreshCw className={`h-4 w-4 ${Object.values(loading).some(Boolean) ? 'animate-spin' : ''}`} />
                  <span>Hard Refresh</span>
                </button>
              </div>

              {/* Export dropdown */}
              <div className="relative group">
                <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <div className="py-2">
                    <button 
                      onClick={() => handleExport('overview', 'json')}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      Export Overview (JSON)
                    </button>
                    <button 
                      onClick={() => handleExport('campaigns', 'csv')}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      Export Campaigns (CSV)
                    </button>
                    <button 
                      onClick={() => handleExport('brands', 'json')}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      Export Brands (JSON)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? `border-${tab.color}-500 text-${tab.color}-600`
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <TabIcon className="h-4 w-4" />
                  <span>{tab.name}</span>
                  {loading[tab.id] && (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Data Loading Issue</h3>
              <p className="text-sm text-yellow-700 mt-1">{error}</p>
            </div>
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-yellow-600 hover:text-yellow-800"
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 mb-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Total Campaigns"
                value={dashboardData.overview?.campaigns?.total}
                icon={Target}
                color="blue"
                loading={loading.overview}
              />
              <MetricCard
                title="Total Leads"
                value={dashboardData.overview?.performance?.total_leads}
                icon={Users}
                color="green"
                loading={loading.overview}
              />
              <MetricCard
                title="Total Spent"
                value={`₹${(dashboardData.overview?.performance?.total_spent || 0).toLocaleString()}`}
                icon={TrendingUp}
                color="purple"
                loading={loading.overview}
              />
              <MetricCard
                title="Avg Cost/Lead"
                value={`₹${(dashboardData.overview?.performance?.avg_cost_per_lead || 0).toFixed(2)}`}
                icon={Target}
                color="orange"
                loading={loading.overview}
              />
            </div>


            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => navigateTo('/campaigns?action=create')}
                  className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group"
                >
                  <Target className="h-8 w-8 text-gray-400 group-hover:text-blue-500 mb-2" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
                    Create Campaign
                  </span>
                </button>
                <button
                  onClick={() => navigateTo('/reports?action=generate')}
                  className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all duration-200 group"
                >
                  <BarChart3 className="h-8 w-8 text-gray-400 group-hover:text-green-500 mb-2" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-green-700">
                    Generate Report
                  </span>
                </button>
                <button
                  onClick={() => navigateTo('/business-manager')}
                  className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all duration-200 group"
                >
                  <Building2 className="h-8 w-8 text-gray-400 group-hover:text-purple-500 mb-2" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700">
                    Business Manager
                  </span>
                </button>
                <button
                  onClick={() => navigateTo('/user-management')}
                  className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all duration-200 group"
                >
                  <Users className="h-8 w-8 text-gray-400 group-hover:text-orange-500 mb-2" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-orange-700">
                    Manage Users
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Performance Trends</h3>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  </div>
                  <span>Multiple Metrics</span>
                </div>
              </div>
              {loading.trends ? (
                <div className="animate-pulse bg-gray-200 h-80 rounded-lg"></div>
              ) : dashboardData.trends?.chart ? (
                <div className="h-80 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4">
                  <Line 
                    data={{
                      ...dashboardData.trends.chart,
                      datasets: dashboardData.trends.chart.datasets?.map((dataset, index) => {
                        const colors = [
                          { border: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)', hover: '#1D4ED8' }, // Blue
                          { border: '#10B981', bg: 'rgba(16, 185, 129, 0.1)', hover: '#047857' }, // Green  
                          { border: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)', hover: '#D97706' }, // Orange
                          { border: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)', hover: '#DC2626' }, // Red
                          { border: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)', hover: '#7C3AED' }, // Purple
                          { border: '#06B6D4', bg: 'rgba(6, 182, 212, 0.1)', hover: '#0891B2' }  // Cyan
                        ];
                        const colorSet = colors[index % colors.length];
                        return {
                          ...dataset,
                          borderColor: colorSet.border,
                          backgroundColor: colorSet.bg,
                          pointBackgroundColor: colorSet.border,
                          pointBorderColor: '#ffffff',
                          pointHoverBackgroundColor: colorSet.hover,
                          pointHoverBorderColor: '#ffffff',
                          fill: true,
                          tension: 0.4
                        };
                      }) || []
                    }}
                    options={getChartOptions('', 'Number of Leads')} 
                  />
                </div>
              ) : (
                <div className="h-80 flex flex-col items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
                  <TrendingUp className="h-16 w-16 text-gray-300 mb-4" />
                  <p className="text-lg font-medium mb-2">No trends data available</p>
                  <p className="text-sm">Data will appear here once campaigns generate leads</p>
                </div>
              )}
            </div>
            
            {dashboardData.trends?.summary && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Trends Summary</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{dashboardData.trends.summary.total_leads}</p>
                    <p className="text-sm text-gray-600">Total Leads (30d)</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">₹{dashboardData.trends.summary.total_spent.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Total Spent (30d)</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">₹{dashboardData.trends.summary.avg_cost_per_lead}</p>
                    <p className="text-sm text-gray-600">Avg Cost/Lead</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Campaigns Tab */}
        {activeTab === 'campaigns' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Top Performing Campaigns</h3>
                <button
                  onClick={() => navigateTo('/campaigns')}
                  className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  <span>View All</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              
              {loading.campaigns ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center justify-between p-4 bg-gray-100 rounded-lg">
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-300 rounded w-1/3"></div>
                      </div>
                      <div className="h-4 bg-gray-300 rounded w-16"></div>
                    </div>
                  ))}
                </div>
              ) : dashboardData.campaigns?.campaigns?.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.campaigns.campaigns.map((campaign, index) => (
                    <div key={campaign.campaign_id || index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900">{campaign.campaign_name}</h4>
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            {campaign.brand}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {campaign.total_leads} leads • ₹{campaign.total_spent.toLocaleString()} spent
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-gray-900">
                          ₹{campaign.avg_cost_per_lead.toFixed(2)}
                        </span>
                        <p className="text-xs text-gray-500">cost/lead</p>
                        {campaign.performance_score && (
                          <div className="mt-1">
                            <div className="flex items-center space-x-1">
                              <div className="w-8 bg-gray-200 rounded-full h-1">
                                <div 
                                  className="bg-blue-600 h-1 rounded-full" 
                                  style={{ width: `${Math.min(campaign.performance_score, 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-500">{campaign.performance_score}/100</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No campaigns data available
                </div>
              )}
            </div>
          </div>
        )}


      </div>
    </div>
  );
};

export default Dashboard;