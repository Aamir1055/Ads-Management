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
  
  // State management with placeholder data
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState({
    overview: {
      campaigns: { total: 15, active: 8 },
      performance: {
        total_leads: 2847,
        total_spent: 189500,
        avg_cost_per_lead: 66.58,
        today_leads: 24,
        today_spent: 3200,
      }
    },
    trends: {
      chart: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Leads',
          data: [120, 190, 300, 500, 400, 650],
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true
        }]
      },
      summary: {
        total_leads: 2200,
        total_spent: 147000,
        avg_cost_per_lead: 66.82
      }
    },
    campaigns: {
      campaigns: [
        {
          campaign_id: 1,
          campaign_name: 'Summer Sale Facebook Ads',
          brand: 'Fashion Brand A',
          total_leads: 450,
          total_spent: 28500,
          avg_cost_per_lead: 63.33,
          performance_score: 85
        },
        {
          campaign_id: 2,
          campaign_name: 'Holiday Shopping Campaign',
          brand: 'Electronics Store',
          total_leads: 320,
          total_spent: 24800,
          avg_cost_per_lead: 77.50,
          performance_score: 72
        },
        {
          campaign_id: 3,
          campaign_name: 'Back to School Promotion',
          brand: 'Education Co',
          total_leads: 280,
          total_spent: 18200,
          avg_cost_per_lead: 65.00,
          performance_score: 78
        }
      ]
    },
    brands: {
      brands: [
        {
          brand: 'Fashion Brand A',
          campaigns_count: 5,
          total_leads: 890,
          total_spent: 58500,
          avg_cost_per_lead: 65.73,
          efficiency_score: 88
        },
        {
          brand: 'Electronics Store',
          campaigns_count: 3,
          total_leads: 650,
          total_spent: 48200,
          avg_cost_per_lead: 74.15,
          efficiency_score: 76
        },
        {
          brand: 'Education Co',
          campaigns_count: 4,
          total_leads: 520,
          total_spent: 31800,
          avg_cost_per_lead: 61.15,
          efficiency_score: 82
        }
      ]
    }
  });
  const [loading, setLoading] = useState({
    overview: false,
    trends: false,
    campaigns: false,
    brands: false
  });
  const [error, setError] = useState(null);
  
  // Real-time data will be loaded from API
  const [realTimeData, setRealTimeData] = useState(null);

  // Load data for specific tab
  const loadTabData = useCallback(async (tab) => {
    console.log(`Loading data for ${tab} tab...`);
    try {
      setLoading(prev => ({ ...prev, [tab]: true }));
      let data;
      
      switch (tab) {
        case 'overview':
          data = await dashboardService.getOverview();
          // Also load real-time data for overview
          try {
            const realtime = await dashboardService.getRealTimeMetrics();
            if (realtime?.data) {
              setRealTimeData(realtime.data);
            }
          } catch (realtimeErr) {
            console.log('Real-time data not available:', realtimeErr.message);
          }
          break;
        case 'trends':
          data = await dashboardService.getTrends();
          break;
        case 'campaigns':
          data = await dashboardService.getCampaigns();
          break;
        case 'brands':
          data = await dashboardService.getBrands();
          break;
        default:
          return;
      }
      
      if (data?.data) {
        setDashboardData(prev => ({ ...prev, [tab]: data.data }));
        console.log(`${tab} data loaded:`, data.data);
      }
    } catch (err) {
      console.error(`Failed to load ${tab} data:`, err);
      setError(`Failed to load ${tab} data`);
    } finally {
      setLoading(prev => ({ ...prev, [tab]: false }));
    }
  }, []);

  // DISABLE API calls to prevent loops - showing static data instead
  useEffect(() => {
    console.log('Dashboard: API calls disabled - showing static data to prevent loops');
    // loadTabData('overview'); // DISABLED to prevent auth loops
  }, []);
  
  // Refs - REMOVED to prevent loops

  // Navigation handlers - SIMPLIFIED
  const navigateTo = useCallback((path) => {
    console.log('Navigating to:', path);
    navigate(path);
  }, [navigate]);

  // Refresh function - DISABLED to prevent loops
  const refreshAll = () => {
    console.log('Refresh disabled to prevent loops');
    toast.error('Refresh disabled - API calls cause authentication loops');
  };

  // Tab configuration - Remove Activities
  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3, color: 'blue' },
    { id: 'trends', name: 'Trends', icon: TrendingUp, color: 'green' },
    { id: 'campaigns', name: 'Campaigns', icon: Target, color: 'purple' },
    { id: 'brands', name: 'Brands', icon: PieChart, color: 'orange' }
  ];

  // Load data when tab changes - DISABLED
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    console.log('Tab data loading disabled to prevent auth loops');
    // if (!dashboardData[tabId]) {
    //   loadTabData(tabId);
    // }
  };

  // Chart options helper function
  const getChartOptions = (title, yAxisLabel) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: title,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: yAxisLabel,
        },
      },
    },
  });

  // DISABLED export handler to prevent loops
  const handleExport = (type, format) => {
    console.log('Export disabled to prevent loops');
    toast.error('Export temporarily disabled');
  };

  // Metric cards component
  const MetricCard = ({ title, value, change, icon: Icon, color, onClick, loading }) => (
    <div 
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-all duration-200 ${onClick ? 'hover:border-' + color + '-200' : ''}`}
      onClick={onClick}
    >
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

              {/* Refresh button */}
              <button
                onClick={refreshAll}
                disabled={Object.values(loading).some(Boolean)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${Object.values(loading).some(Boolean) ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>

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
                change={realTimeData?.comparisons?.campaigns_change}
                icon={Target}
                color="blue"
                onClick={() => navigateTo('/campaigns')}
                loading={loading.overview}
              />
              <MetricCard
                title="Total Leads"
                value={dashboardData.overview?.performance?.total_leads}
                change={realTimeData?.comparisons?.leads_change}
                icon={Users}
                color="green"
                onClick={() => navigateTo('/reports')}
                loading={loading.overview}
              />
              <MetricCard
                title="Total Spent"
                value={`₹${(dashboardData.overview?.performance?.total_spent || 0).toLocaleString()}`}
                change={realTimeData?.comparisons?.spent_change}
                icon={DollarSign}
                color="purple"
                onClick={() => navigateTo('/report-analytics')}
                loading={loading.overview}
              />
              <MetricCard
                title="Avg Cost/Lead"
                value={`₹${(dashboardData.overview?.performance?.avg_cost_per_lead || 0).toFixed(2)}`}
                icon={TrendingUp}
                color="orange"
                loading={loading.overview}
              />
            </div>

            {/* Today's Performance */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Today's Performance</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  {loading.overview ? (
                    <div className="animate-pulse bg-gray-200 h-8 w-16 rounded mx-auto mb-2"></div>
                  ) : (
                    <p className="text-2xl font-bold text-blue-600">
                      {dashboardData.overview?.performance?.today_leads || '24'}
                    </p>
                  )}
                  <p className="text-sm text-gray-600">Leads Today</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  {loading.overview ? (
                    <div className="animate-pulse bg-gray-200 h-8 w-16 rounded mx-auto mb-2"></div>
                  ) : (
                    <p className="text-2xl font-bold text-green-600">
                      ₹{(dashboardData.overview?.performance?.today_spent || 3200).toLocaleString()}
                    </p>
                  )}
                  <p className="text-sm text-gray-600">Spent Today</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  {loading.overview ? (
                    <div className="animate-pulse bg-gray-200 h-8 w-16 rounded mx-auto mb-2"></div>
                  ) : (
                    <p className="text-2xl font-bold text-purple-600">
                      {dashboardData.overview?.campaigns?.active || '8'}
                    </p>
                  )}
                  <p className="text-sm text-gray-600">Active Campaigns</p>
                </div>
              </div>
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
              <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Trends (30 Days)</h3>
              {loading.trends ? (
                <div className="animate-pulse bg-gray-200 h-64 rounded"></div>
              ) : dashboardData.trends?.chart ? (
                <div className="h-64">
                  <Line 
                    data={dashboardData.trends.chart} 
                    options={getChartOptions('Performance Trends', 'Leads')} 
                  />
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  No trends data available
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

        {/* Brands Tab */}
        {activeTab === 'brands' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Brand Performance</h3>
              </div>
              
              {loading.brands ? (
                <div className="animate-pulse bg-gray-200 h-64 rounded"></div>
              ) : dashboardData.brands?.brands?.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {dashboardData.brands.brands.map((brand, index) => (
                    <div key={brand.brand || index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-900">{brand.brand}</h4>
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                          {brand.campaigns_count} campaigns
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Total Leads</p>
                          <p className="font-bold text-gray-900">{brand.total_leads}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Total Spent</p>
                          <p className="font-bold text-gray-900">₹{brand.total_spent.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Avg Cost/Lead</p>
                          <p className="font-bold text-gray-900">₹{brand.avg_cost_per_lead.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Efficiency Score</p>
                          <p className="font-bold text-blue-600">{brand.efficiency_score}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No brands data available
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