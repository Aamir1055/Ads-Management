import React, { useState, useEffect } from 'react';
import { BarChart3, RefreshCw, AlertCircle } from 'lucide-react';

const SimpleReportAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get authentication token
      const token = localStorage.getItem('authToken') || localStorage.getItem('access_token');
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      };

      // Get dashboard data
      const response = await fetch('/api/analytics/dashboard', { headers });
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.message || 'Failed to load data');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to connect to analytics API');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              <BarChart3 className="mr-3" />
              Report Analytics Dashboard
            </h1>
            <p className="text-blue-100 mt-1">
              Campaign performance insights and data visualization
            </p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium transition-colors bg-white bg-opacity-20 hover:bg-opacity-30 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Loading...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <div>
              <p className="text-sm text-red-600">{error}</p>
              <p className="text-xs text-red-500 mt-1">
                Make sure you're logged in and have proper permissions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Data Display */}
      {data && (
        <div className="space-y-6">

          {/* Top Campaigns */}
          {data.topCampaigns && data.topCampaigns.length > 0 && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                <h3 className="text-lg font-medium text-white">Top Campaigns</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Campaign
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Brand
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Leads
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Spent
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {data.topCampaigns.map((campaign, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {campaign.campaign_name || `Campaign ${campaign.campaign_id}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {campaign.brand || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {campaign.total_leads || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${(campaign.total_spent || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Debug Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Debug Information:</h3>
            <div className="space-y-2">
              <div className="text-xs">
                <strong>Current Month:</strong> {data.overview?.currentMonth || 'N/A'}
              </div>
              <div className="text-xs">
                <strong>User Role:</strong> {data.userRole || 'N/A'}
              </div>
              <div className="text-xs">
                <strong>Data Scope:</strong> {data.dataScope || 'N/A'}
              </div>
              <div className="text-xs">
                <strong>Top Campaigns Count:</strong> {data.topCampaigns?.length || 0}
              </div>
              <div className="text-xs">
                <strong>Brand Performance Count:</strong> {data.brandPerformance?.length || 0}
              </div>
            </div>
            <details className="mt-4">
              <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                Full Debug Data (Click to expand)
              </summary>
              <pre className="mt-2 text-xs text-gray-600 overflow-auto">
                {JSON.stringify(data, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleReportAnalytics;
