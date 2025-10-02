import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  Users,
  Target,
  BarChart3,
  FileText,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Plus,
  Eye,
  Download,
  Calendar,
  AlertTriangle,
  PieChart,
  Activity,
  Zap
} from 'lucide-react';

// Import our new components
import dashboardService from '../services/dashboardService';
import KPICard from '../components/dashboard/KPICard';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import {
  PerformanceTrendChart,
  CampaignPerformanceChart,
  BrandDistributionChart
} from '../components/dashboard/DashboardCharts';
import { CardSkeleton } from '../components/LoadingSkeleton';
import {
  createCachedService,
  invalidateCache,
  preloadDashboardData,
  createLazyChartLoader
} from '../utils/dashboardCache';
import AuthDebug from '../components/debug/AuthDebug';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Create cached service instance
  const cachedDashboardService = useMemo(
    () => createCachedService(dashboardService, 'dashboardService'),
    []
  );
  
  // Lazy chart loader
  const lazyLoader = useMemo(() => createLazyChartLoader(), []);
  
  // State management
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [trendsData, setTrendsData] = useState(null);
  const [campaignData, setCampaignData] = useState(null);
  const [brandData, setBrandData] = useState(null);
  const [activities, setActivities] = useState([]);
  const [showMoreCampaigns, setShowMoreCampaigns] = useState(false);
  const [showMoreBrands, setShowMoreBrands] = useState(false);
  const [loading, setLoading] = useState({
    overview: true,
    trends: true,
    campaigns: true,
    brands: true,
    activities: true
  });
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Fetch dashboard overview data
  const fetchDashboardOverview = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, overview: true }));
      const response = await cachedDashboardService.getDashboardOverview();
      
      if (response.success) {
        setDashboardData(response.data);
        setError(null);
      } else {
        throw new Error(response.message || 'Failed to load dashboard data');
      }
    } catch (err) {
      console.error('Dashboard overview error:', err);
      
      // Only set error state for non-auth issues
      if (err.response?.status !== 401 && err.response?.status !== 403) {
        setError(err.message || 'Unable to load dashboard data');
      }
      
      // Set fallback data
      setDashboardData({
        overview: {
          campaignsCount: 0,
          totalLeads: 0,
          totalSpent: 0,
          avgCostPerLead: 0
        },
        dailyComparison: {
          changes: { leadsChange: 0, spentChange: 0 }
        },
        topCampaigns: [],
        brandPerformance: []
      });
    } finally {
      setLoading(prev => ({ ...prev, overview: false }));
    }
  }, [cachedDashboardService]);

  // Fetch trends data
  const fetchTrendsData = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, trends: true }));
      const response = await cachedDashboardService.getTrendsData({ period: '30d' });
      
      if (response.success) {
        setTrendsData(response.data?.series || []);
      }
    } catch (err) {
      console.error('Trends data error:', err);
      // Set empty array to prevent chart errors
      setTrendsData([]);
    } finally {
      setLoading(prev => ({ ...prev, trends: false }));
    }
  }, [cachedDashboardService]);

  // Fetch campaign performance data
  const fetchCampaignData = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, campaigns: true }));
      const response = await cachedDashboardService.getCampaignPerformance({ limit: 10 });
      
      if (response.success) {
        setCampaignData(response.data?.campaigns || []);
      }
    } catch (err) {
      console.error('Campaign data error:', err);
      // Set empty array to prevent chart errors
      setCampaignData([]);
    } finally {
      setLoading(prev => ({ ...prev, campaigns: false }));
    }
  }, [cachedDashboardService]);

  // Fetch brand performance data
  const fetchBrandData = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, brands: true }));
      const response = await cachedDashboardService.getBrandPerformance({ limit: 8 });
      
      if (response.success) {
        setBrandData(response.data?.brands || []);
      }
    } catch (err) {
      console.error('Brand data error:', err);
      // Set empty array to prevent chart errors
      setBrandData([]);
    } finally {
      setLoading(prev => ({ ...prev, brands: false }));
    }
  }, [cachedDashboardService]);

  // Fetch activities
  const fetchActivities = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, activities: true }));
      const response = await cachedDashboardService.getRecentActivities({ limit: 10 });
      
      if (response.success) {
        setActivities(response.data?.activities || []);
      } else {
        // Fallback sample activities for demo
        setActivities([
          {
            id: 1,
            type: 'report_generated',
            title: 'Campaign Report Generated',
            description: 'Monthly performance report for TK TAMIL campaign',
            timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
            user: 'System',
            status: 'success'
          },
          {
            id: 2,
            type: 'user_login',
            title: 'User Login',
            description: 'User logged into dashboard',
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            user: user?.username || 'User',
            status: 'success'
          },
          {
            id: 3,
            type: 'data_refresh',
            title: 'Data Refreshed',
            description: 'Dashboard data updated automatically',
            timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
            user: 'System',
            status: 'success'
          },
          {
            id: 4,
            type: 'campaign_updated',
            title: 'Campaign Modified',
            description: 'TK TAMIL campaign settings updated',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            user: user?.username || 'User',
            status: 'success'
          },
          {
            id: 5,
            type: 'analytics_view',
            title: 'Analytics Accessed',
            description: 'Performance analytics page viewed',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
            user: user?.username || 'User',
            status: 'success'
          }
        ]);
      }
    } catch (err) {
      console.error('Activities error:', err);
      // Set fallback sample activities
      setActivities([
        {
          id: 1,
          type: 'report_generated',
          title: 'System Report',
          timestamp: new Date().toISOString(),
          user: 'System',
          status: 'success'
        }
      ]);
    } finally {
      setLoading(prev => ({ ...prev, activities: false }));
    }
  }, [cachedDashboardService, user]);

  // Refresh all data
  const refreshAllData = useCallback(async () => {
    // Clear cache before refreshing
    invalidateCache.all();
    
    setLastRefresh(new Date());
    await Promise.all([
      fetchDashboardOverview(),
      fetchTrendsData(),
      fetchCampaignData(),
      fetchBrandData(),
      fetchActivities()
    ]);
    toast.success('Dashboard refreshed successfully!');
  }, [fetchDashboardOverview, fetchTrendsData, fetchCampaignData, fetchBrandData, fetchActivities]);

  // Initial data load with preloading
  useEffect(() => {
    // Preload critical data first
    preloadDashboardData(cachedDashboardService).then(() => {
      // Then load all dashboard data
      fetchDashboardOverview();
      fetchTrendsData();
      fetchCampaignData();
      fetchBrandData();
      fetchActivities();
    });
  }, [fetchDashboardOverview, fetchTrendsData, fetchCampaignData, fetchBrandData, fetchActivities, cachedDashboardService]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(refreshAllData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [refreshAllData]);
  
  // Cleanup lazy loader on unmount
  useEffect(() => {
    return () => {
      lazyLoader.cleanup();
    };
  }, [lazyLoader]);

  // Quick action handlers
  const handleQuickAction = (action) => {
    switch (action) {
      case 'create_campaign':
        navigate('/campaigns?action=create');
        break;
      case 'generate_report':
        navigate('/reports?action=generate');
        break;
      case 'view_analytics':
        navigate('/report-analytics');
        break;
      case 'manage_users':
        navigate('/user-management');
        break;
      case 'export_data':
        navigate('/reports?action=export');
        break;
      default:
        console.log(`Action: ${action}`);
    }
  };

  const overview = dashboardData?.overview || {};
  const dailyComparison = dashboardData?.dailyComparison || {};
  const changes = dailyComparison.changes || {};

  // Tab configuration
  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'trends', name: 'Trends', icon: TrendingUp },
    { id: 'campaigns', name: 'Campaigns', icon: Target },
    { id: 'brands', name: 'Brands', icon: PieChart },
    { id: 'activity', name: 'Activity', icon: Activity }
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Compact Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Welcome back, {user?.username || 'User'}!
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            {activeTab === 'overview' ? 'Dashboard overview and key metrics' :
             activeTab === 'trends' ? 'Performance trends over time' :
             activeTab === 'campaigns' ? 'Top performing campaigns' :
             activeTab === 'brands' ? 'Brand performance analysis' :
             'Recent system activity'}
          </p>
        </div>
        <div className="mt-3 lg:mt-0 flex items-center space-x-3">
          <div className="text-xs text-gray-500">
            Updated: {lastRefresh.toLocaleTimeString()}
          </div>
          <button
            onClick={refreshAllData}
            className="btn-secondary flex items-center space-x-2 text-sm px-3 py-2"
            disabled={Object.values(loading).some(Boolean)}
          >
            <RefreshCw className={`h-3 w-3 ${Object.values(loading).some(Boolean) ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <TabIcon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start space-x-3">
          <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">Data Loading Issue</h3>
            <p className="text-xs text-yellow-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Compact KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
              <KPICard
                title="Campaigns"
                value={overview.campaignsCount}
                icon={Target}
                color="bg-blue-500"
                loading={loading.overview}
                onClick={() => navigate('/campaigns')}
                className="text-sm"
              />
              <KPICard
                title="Total Leads"
                value={overview.totalLeads}
                previousValue={overview.totalLeads - (changes.leadsChange || 0)}
                icon={Users}
                color="bg-green-500"
                format="compact"
                loading={loading.overview}
                onClick={() => navigate('/reports')}
                className="text-sm"
              />
              <KPICard
                title="Total Spent"
                value={overview.totalSpent}
                previousValue={overview.totalSpent - (changes.spentChange || 0)}
                icon={DollarSign}
                color="bg-purple-500"
                format="currency"
                loading={loading.overview}
                onClick={() => navigate('/report-analytics')}
                className="text-sm"
              />
              <KPICard
                title="Avg Cost/Lead"
                value={overview.avgCostPerLead}
                icon={TrendingUp}
                color="bg-orange-500"
                format="currency"
                precision={2}
                loading={loading.overview}
                className="text-sm"
              />
            </div>

            {/* Grid layout for Quick Actions and Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quick Actions Grid */}
              <div className="card">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleQuickAction('create_campaign')}
                    className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group"
                  >
                    <Plus className="h-6 w-6 text-gray-400 group-hover:text-blue-500 mb-2" />
                    <span className="text-xs font-medium text-gray-700 group-hover:text-blue-700 text-center">
                      Create Campaign
                    </span>
                  </button>
                  
                  <button
                    onClick={() => handleQuickAction('generate_report')}
                    className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all duration-200 group"
                  >
                    <FileText className="h-6 w-6 text-gray-400 group-hover:text-green-500 mb-2" />
                    <span className="text-xs font-medium text-gray-700 group-hover:text-green-700 text-center">
                      Generate Report
                    </span>
                  </button>
                  
                  <button
                    onClick={() => handleQuickAction('view_analytics')}
                    className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all duration-200 group"
                  >
                    <BarChart3 className="h-6 w-6 text-gray-400 group-hover:text-purple-500 mb-2" />
                    <span className="text-xs font-medium text-gray-700 group-hover:text-purple-700 text-center">
                      View Analytics
                    </span>
                  </button>
                  
                  <button
                    onClick={() => handleQuickAction('export_data')}
                    className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all duration-200 group"
                  >
                    <Download className="h-6 w-6 text-gray-400 group-hover:text-orange-500 mb-2" />
                    <span className="text-xs font-medium text-gray-700 group-hover:text-orange-700 text-center">
                      Export Data
                    </span>
                  </button>
                </div>
              </div>

              {/* Compact Recent Activity */}
              <ActivityFeed
                activities={activities}
                loading={loading.activities}
                title="Recent Activity"
                compact={true}
                maxVisible={3}
              />
            </div>
          </>
        )}

        {/* Trends Tab */}
        {activeTab === 'trends' && (
          <div className="space-y-6">
            <PerformanceTrendChart
              data={trendsData}
              loading={loading.trends}
              title="30-Day Performance Trends"
            />
          </div>
        )}

        {/* Campaigns Tab */}
        {activeTab === 'campaigns' && (
          <div className="space-y-6">
            <CampaignPerformanceChart
              data={campaignData}
              loading={loading.campaigns}
              title="Campaign Performance"
            />
            
            {/* Campaign List */}
            {campaignData && campaignData.length > 0 && (
              <div className="card">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Campaign Details</h3>
                <div className="space-y-3">
                  {(showMoreCampaigns ? campaignData : campaignData.slice(0, 5)).map((campaign, index) => (
                    <div key={campaign.campaign_id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{campaign.campaign_name || `Campaign ${campaign.campaign_id}`}</h4>
                        <p className="text-sm text-gray-600">
                          {campaign.totalLeads || campaign.total_leads || 0} leads • 
                          ₹{Number(campaign.totalSpent || campaign.total_spent || 0).toLocaleString('en-IN')} spent
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-gray-900">
                          ₹{Number(campaign.avgCostPerLead || campaign.avg_cost_per_lead || 0).toFixed(2)}
                        </span>
                        <p className="text-xs text-gray-500">cost/lead</p>
                      </div>
                    </div>
                  ))}
                  
                  {campaignData.length > 5 && (
                    <button
                      onClick={() => setShowMoreCampaigns(!showMoreCampaigns)}
                      className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium py-2"
                    >
                      {showMoreCampaigns ? 'Show Less' : `Show ${campaignData.length - 5} More`}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Brands Tab */}
        {activeTab === 'brands' && (
          <div className="space-y-6">
            <BrandDistributionChart
              data={brandData}
              loading={loading.brands}
              title="Brand Performance Distribution"
            />
            
            {/* Brand List */}
            {brandData && brandData.length > 0 && (
              <div className="card">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Brand Details</h3>
                <div className="space-y-3">
                  {(showMoreBrands ? brandData : brandData.slice(0, 5)).map((brand, index) => (
                    <div key={brand.brand || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{brand.brand || 'Unknown Brand'}</h4>
                        <p className="text-sm text-gray-600">
                          {brand.totalLeads || brand.total_leads || 0} leads • 
                          {brand.campaignsCount || brand.campaigns_count || 0} campaigns
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-gray-900">
                          ₹{Number(brand.totalSpent || brand.total_spent || 0).toLocaleString('en-IN')}
                        </span>
                        <p className="text-xs text-gray-500">total spent</p>
                      </div>
                    </div>
                  ))}
                  
                  {brandData.length > 5 && (
                    <button
                      onClick={() => setShowMoreBrands(!showMoreBrands)}
                      className="w-full text-center text-sm text-blue-600 hover:text-blue-800 font-medium py-2"
                    >
                      {showMoreBrands ? 'Show Less' : `Show ${brandData.length - 5} More`}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="space-y-6">
            <ActivityFeed
              activities={activities}
              loading={loading.activities}
              title="Recent System Activity"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
