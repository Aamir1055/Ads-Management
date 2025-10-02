const axios = require('axios');

// Test the dashboard API endpoints
async function testDashboardAPI() {
  const baseURL = 'http://localhost:3000/api';
  
  // You'll need to get a valid JWT token by logging in first
  // For testing, you can get this from the browser dev tools
  const authToken = 'your-jwt-token-here'; // Replace with actual token
  
  const config = {
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  };

  console.log('🧪 Testing Dashboard API Endpoints...\n');

  try {
    // Test dashboard overview
    console.log('1. Testing /api/analytics/dashboard');
    const dashboardResponse = await axios.get(`${baseURL}/analytics/dashboard`, config);
    console.log('✅ Dashboard Overview:', JSON.stringify(dashboardResponse.data, null, 2));
    console.log('\n');

    // Test time series data
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    console.log('2. Testing /api/analytics/charts/time-series');
    const timeSeriesResponse = await axios.get(
      `${baseURL}/analytics/charts/time-series?date_from=${startDate}&date_to=${endDate}&group_by=day`,
      config
    );
    console.log('✅ Time Series Data:', JSON.stringify(timeSeriesResponse.data, null, 2));
    console.log('\n');

    // Test campaign performance
    console.log('3. Testing /api/analytics/charts/campaign-performance');
    const campaignResponse = await axios.get(
      `${baseURL}/analytics/charts/campaign-performance?date_from=${startDate}&date_to=${endDate}&limit=5`,
      config
    );
    console.log('✅ Campaign Performance:', JSON.stringify(campaignResponse.data, null, 2));
    console.log('\n');

    // Test brand analysis
    console.log('4. Testing /api/analytics/charts/brand-analysis');
    const brandResponse = await axios.get(
      `${baseURL}/analytics/charts/brand-analysis?date_from=${startDate}&date_to=${endDate}`,
      config
    );
    console.log('✅ Brand Analysis:', JSON.stringify(brandResponse.data, null, 2));

  } catch (error) {
    console.error('❌ API Test Error:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
    
    console.log('\n📋 Next Steps:');
    console.log('1. Make sure the backend server is running on port 3000');
    console.log('2. Get a valid JWT token by logging into the frontend');
    console.log('3. Replace "your-jwt-token-here" in this file with the actual token');
    console.log('4. Run this test again: node test-dashboard-api.js');
  }
}

testDashboardAPI();
