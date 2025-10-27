const axios = require('axios');

// Test analytics API endpoints
async function testAnalyticsAPI() {
  console.log('🧪 Testing Analytics API endpoints...\n');
  
  const baseURL = 'http://localhost:5000';
  const testEndpoints = [
    '/api/analytics/dashboard',
    '/api/analytics/charts/campaign-performance?date_from=2025-09-08&date_to=2025-10-08&limit=5',
    '/api/analytics/charts/time-series?date_from=2025-09-08&date_to=2025-10-08&group_by=day',
    '/api/analytics/charts/brand-analysis?date_from=2025-09-08&date_to=2025-10-08&limit=8',
    '/api/analytics/overview',
    '/api/analytics/filters'
  ];

  // Test without auth first (should fail)
  console.log('Testing without authentication (should get 401)...');
  for (const endpoint of testEndpoints) {
    try {
      const response = await axios.get(`${baseURL}${endpoint}`, { timeout: 5000 });
      console.log(`❌ ${endpoint} - Expected 401 but got ${response.status}`);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log(`✅ ${endpoint} - Correctly returned 401 Unauthorized`);
      } else if (error.response && error.response.status === 404) {
        console.log(`❌ ${endpoint} - Route not found (404)`);
      } else {
        console.log(`⚠️  ${endpoint} - Error: ${error.message}`);
      }
    }
  }

  console.log('\n🔍 Testing server health...');
  try {
    const healthResponse = await axios.get(`${baseURL}/api/health`, { timeout: 5000 });
    console.log(`✅ Health check: ${healthResponse.status} - ${healthResponse.data.message}`);
    console.log(`   Database: ${healthResponse.data.database.status}`);
  } catch (error) {
    console.log(`❌ Health check failed: ${error.message}`);
  }

  console.log('\n📋 Testing reports API (should work similarly)...');
  try {
    const reportsResponse = await axios.get(`${baseURL}/api/reports`, { timeout: 5000 });
    console.log(`❌ Reports API - Expected 401 but got ${reportsResponse.status}`);
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log(`✅ Reports API - Correctly returned 401 Unauthorized`);
    } else if (error.response && error.response.status === 404) {
      console.log(`❌ Reports API - Route not found (404)`);
    } else {
      console.log(`⚠️  Reports API - Error: ${error.message}`);
    }
  }

  console.log('\n🎯 Summary:');
  console.log('- Analytics API endpoints should return 401 (Unauthorized) when no auth token provided');
  console.log('- If you see 404 errors, the routes are not registered properly');
  console.log('- If you see 401 errors, the routes exist but require authentication (good!)');
}

testAnalyticsAPI().catch(console.error);