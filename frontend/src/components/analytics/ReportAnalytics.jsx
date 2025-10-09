import React, { useState, useEffect } from 'react';
import reportsService from '../../services/reportsService';

const ReportAnalytics = ({ 
  filters = {}, 
  className = '',
  showCharts = true,
  showKPIs = true 
}) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, [filters]);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await reportsService.getReportStats(filters);
      
      if (response.success) {
        setStats(response.data);
      } else {
        setError(response.message || 'Failed to load analytics');
      }
    } catch (error) {
      console.error('Error loading report analytics:', error);
      setError(error.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  const formatPercentage = (num) => {
    return `${(num || 0).toFixed(2)}%`;
  };

  const formatDecimal = (num, decimals = 2) => {
    return (num || 0).toFixed(decimals);
  };

  const KPICard = ({ title, value, subtitle, icon, color = 'blue', trend }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className={`text-2xl font-bold text-${color}-600 mb-1`}>{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500">{subtitle}</p>
          )}
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${
              trend.direction === 'up' ? 'text-green-600' : 
              trend.direction === 'down' ? 'text-red-600' : 
              'text-gray-600'
            }`}>
              {trend.direction === 'up' && (
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                </svg>
              )}
              {trend.direction === 'down' && (
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1V9a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586 3.707 5.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clipRule="evenodd" />
                </svg>
              )}
              <span>{trend.value}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={`flex-shrink-0 p-3 bg-${color}-100 rounded-lg`}>
            <div className={`w-6 h-6 text-${color}-600`}>
              {icon}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const SimpleBarChart = ({ data, title, xKey, yKey, color = 'blue' }) => {
    if (!data || data.length === 0) return null;

    const maxValue = Math.max(...data.map(item => item[yKey] || 0));
    
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
        <div className="space-y-3">
          {data.slice(0, 10).map((item, index) => (
            <div key={index} className="flex items-center">
              <div className="w-24 text-sm text-gray-600 truncate">
                {item[xKey]}
              </div>
              <div className="flex-1 mx-3">
                <div className="bg-gray-200 rounded-full h-3">
                  <div
                    className={`bg-${color}-500 h-3 rounded-full transition-all duration-500`}
                    style={{ 
                      width: `${((item[yKey] || 0) / maxValue) * 100}%` 
                    }}
                  />
                </div>
              </div>
              <div className="w-20 text-sm text-gray-900 text-right">
                {typeof item[yKey] === 'number' && item[yKey] > 1000 
                  ? formatCurrency(item[yKey])
                  : formatNumber(item[yKey])
                }
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-gray-200 h-24 rounded-lg" />
          ))}
        </div>
        {showCharts && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map(i => (
              <div key={i} className="bg-gray-200 h-64 rounded-lg" />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex">
          <svg className="w-5 h-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Analytics Error</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={`bg-gray-50 rounded-lg p-8 text-center ${className}`}>
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h2a2 2 0 01-2-2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No Data Available</h3>
        <p className="mt-1 text-sm text-gray-500">No analytics data found for the selected filters.</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* KPI Cards */}
      {showKPIs && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <KPICard
            title="Total Reports"
            value={formatNumber(stats.totalReports)}
            subtitle="Generated reports"
            color="blue"
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />
          
          <KPICard
            title="Total Spend"
            value={formatCurrency(stats.totalSpend)}
            subtitle="Across all reports"
            color="red"
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            }
          />
          
          <KPICard
            title="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
            subtitle="Generated revenue"
            color="green"
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
          />
          
          <KPICard
            title="Average ROAS"
            value={`${formatDecimal(stats.averageRoas)}x`}
            subtitle="Return on ad spend"
            color="purple"
            icon={
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h2a2 2 0 01-2-2z" />
              </svg>
            }
          />
        </div>
      )}

      {/* Charts */}
      {showCharts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Campaigns by Spend */}
          {stats.topCampaignsBySpend && (
            <SimpleBarChart
              data={stats.topCampaignsBySpend}
              title="Top Campaigns by Spend"
              xKey="campaign_name"
              yKey="total_spend"
              color="red"
            />
          )}

          {/* Top Campaigns by Revenue */}
          {stats.topCampaignsByRevenue && (
            <SimpleBarChart
              data={stats.topCampaignsByRevenue}
              title="Top Campaigns by Revenue"
              xKey="campaign_name"
              yKey="total_revenue"
              color="green"
            />
          )}

          {/* Top Brands by Performance */}
          {stats.topBrandsBySpend && (
            <SimpleBarChart
              data={stats.topBrandsBySpend}
              title="Top Brands by Spend"
              xKey="brand_name"
              yKey="total_spend"
              color="blue"
            />
          )}

          {/* Daily Performance */}
          {stats.dailyPerformance && (
            <SimpleBarChart
              data={stats.dailyPerformance}
              title="Daily Performance"
              xKey="date"
              yKey="total_spend"
              color="purple"
            />
          )}
        </div>
      )}

      {/* Additional Stats */}
      {stats.additionalMetrics && (
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.additionalMetrics).map(([key, value]) => (
              <div key={key} className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {typeof value === 'number' ? formatNumber(value) : value}
                </p>
                <p className="text-sm text-gray-500 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportAnalytics;