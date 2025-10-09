const axios = require('axios');

async function testFrontendApiCall() {
  try {
    console.log('🔍 Testing the actual API call that frontend makes...\n');
    
    // Simulate the exact API call the frontend makes
    // The frontend calls /reports with date filters
    const baseUrl = 'http://localhost:5000';
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const params = {
      dateFrom: thirtyDaysAgo,
      dateTo: today,
      page: 1,
      limit: 10
    };
    
    // Convert params to query string like the frontend does
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    const url = `${baseUrl}/api/reports?${queryParams.toString()}`;
    console.log('📡 Making API call to:', url);
    
    // Note: This will fail due to authentication, but let's see what happens
    try {
      const response = await axios.get(url);
      console.log('✅ API Response:', {
        success: response.data.success,
        message: response.data.message,
        dataCount: response.data.data?.length || 0,
        firstRecord: response.data.data?.[0] || 'No data'
      });
    } catch (error) {
      if (error.response) {
        console.log('❌ API Error Response:', {
          status: error.response.status,
          message: error.response.data?.message || error.response.statusText,
          data: error.response.data
        });
      } else {
        console.log('❌ Network Error:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testFrontendApiCall();