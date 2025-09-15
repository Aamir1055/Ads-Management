/**
 * Report Analytics API adapter
 * 
 * This module adapts the backend analytics API responses to the format expected by the ReportAnalytics component
 */

/**
 * Fetch analytics data with date filters
 * @param {Object} filters - Filter parameters (dateFrom, dateTo, brand, campaignId)
 * @returns {Promise<Object>} - Formatted analytics data for the component
 */
export const fetchAnalyticsData = async (filters) => {
  try {
    // Create date params
    const params = new URLSearchParams({
      date_from: filters.dateFrom,
      date_to: filters.dateTo
    });

    if (filters.brand) params.append('brand', filters.brand);
    if (filters.campaignId) params.append('campaign_id', filters.campaignId);

    // Get authentication token
    const token = localStorage.getItem('authToken') || localStorage.getItem('access_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };

    // Fetch time series data
    const timeSeriesResponse = await fetch(`/api/analytics/charts/time-series?${params}`, { headers });
    const timeSeriesResult = await timeSeriesResponse.json();

    // Fetch campaign performance data
    const campaignResponse = await fetch(`/api/analytics/charts/campaign-performance?${params}`, { headers });
    const campaignResult = await campaignResponse.json();

    // Fetch brand analysis data
    const brandResponse = await fetch(`/api/analytics/charts/brand-analysis?${params}`, { headers });
    const brandResult = await brandResponse.json();

    // If any request failed, throw an error
    if (!timeSeriesResult.success || !campaignResult.success || !brandResult.success) {
      throw new Error(timeSeriesResult.message || campaignResult.message || brandResult.message);
    }

    // Transform data into the format expected by the ReportAnalytics component
    return {
      success: true,
      data: {
        // Time series data (already formatted in the controller)
        series: timeSeriesResult.data.series.map(item => ({
          date: item.date,
          leads: item.leads,
          spent: item.spent,
          // Add other fields as needed
        })),

        // Top campaigns data
        topCampaigns: campaignResult.data.campaigns.map(campaign => ({
          campaign_id: campaign.campaign_id,
          campaign_name: campaign.campaign_name,
          leads: campaign.totalLeads,
          spent: campaign.totalSpent,
          cpl: campaign.avgCostPerLead
        })),

        // Brand analysis data
        byBrand: brandResult.data.brands.map(brand => ({
          brand: brand.brand || 'Unknown',
          leads: brand.totalLeads,
          spent: brand.totalSpent
        }))
      }
    };
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    return {
      success: false,
      message: error.message || 'Failed to load analytics data'
    };
  }
};

/**
 * Fetch filter options for the analytics
 * @returns {Promise<Object>} - Filter options (brands, campaigns, dateRange)
 */
export const fetchFilterOptions = async () => {
  try {
    // Get authentication token
    const token = localStorage.getItem('authToken') || localStorage.getItem('access_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };

    // Fetch dashboard data for filter options
    const response = await fetch('/api/analytics/dashboard', { headers });
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Failed to load filter options');
    }

    // Transform brands and campaigns for dropdown lists
    return {
      success: true,
      data: {
        brands: result.data.brandPerformance.map(brand => brand.brand || 'Unknown'),
        campaigns: result.data.topCampaigns.map(campaign => ({
          id: campaign.campaign_id,
          name: campaign.campaign_name,
          brand: campaign.brand
        })),
        dateRange: {
          min: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year ago
          max: new Date().toISOString().split('T')[0] // today
        }
      }
    };
  } catch (error) {
    console.error('Error fetching filter options:', error);
    return {
      success: false,
      message: error.message || 'Failed to load filter options'
    };
  }
};
