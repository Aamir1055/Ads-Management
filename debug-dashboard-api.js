const axios = require('axios');

async function debugDashboardAPI() {
  console.log('🔍 Testing Dashboard API Endpoints...\n');

  // Get a login token first (demo mode since we don't have real backend)
  const demoToken = 'demo-token-' + Date.now();
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${demoToken}`
  };

  const baseURL = 'http://localhost:5000/api';
  
  const endpoints = [
    '/analytics/dashboard',
    '/analytics/charts/time-series',
    '/analytics/charts/campaign-performance',
    '/analytics/charts/brand-analysis',
    '/analytics/activities',
    '/analytics/system'
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`🔗 Testing: ${baseURL}${endpoint}`);
      
      const response = await axios.get(`${baseURL}${endpoint}`, { 
        headers,
        timeout: 5000
      });
      
      console.log(`✅ ${endpoint} - Status: ${response.status}`);
      console.log(`📊 Response:`, JSON.stringify(response.data, null, 2));
      
    } catch (error) {
      if (error.response) {
        console.log(`❌ ${endpoint} - Status: ${error.response.status}`);
        console.log(`📝 Error:`, error.response.data);
      } else if (error.code === 'ECONNREFUSED') {
        console.log(`❌ ${endpoint} - Backend not running`);
      } else {
        console.log(`❌ ${endpoint} - Error:`, error.message);
      }
    }
    
    console.log(''); // Empty line for readability
  }

  // Test with real backend credentials if available
  console.log('\n🔐 Testing with real authentication...');
  
  try {
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      username: 'admin', // Using the demo credentials
      password: 'password'
    });

    if (loginResponse.data.success) {
      const realToken = loginResponse.data.data.access_token;
      console.log('✅ Successfully authenticated with real backend');
      
      const realHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${realToken}`
      };
      
      // Test the main dashboard endpoint with real auth
      try {
        const dashboardResponse = await axios.get(`${baseURL}/analytics/dashboard`, { 
          headers: realHeaders,
          timeout: 5000
        });
        
        console.log('✅ Dashboard API with real auth - Status:', dashboardResponse.status);
        console.log('📊 Real dashboard data:', JSON.stringify(dashboardResponse.data, null, 2));
        
      } catch (authError) {
        console.log('❌ Dashboard API with real auth failed:', authError.response?.data || authError.message);
      }
      
    } else {
      console.log('❌ Authentication failed:', loginResponse.data.message);
    }
    
  } catch (authError) {
    if (authError.code === 'ECONNREFUSED') {
      console.log('❌ Backend server not running - cannot test real authentication');
    } else {
      console.log('❌ Authentication error:', authError.response?.data || authError.message);
    }
  }
}

debugDashboardAPI().catch(console.error);
