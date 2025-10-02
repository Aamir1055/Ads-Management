// Test script to check dashboard API endpoints
// Run this to see what data the backend is actually returning

const axios = require('axios');

async function testDashboardEndpoints() {
  console.log('🧪 Testing Dashboard API Endpoints...\n');
  
  // Test without authentication first to see if endpoints exist
  const baseURL = 'http://localhost:5000/api';
  
  try {
    // Test 1: Check if server is running
    console.log('1. Testing server health...');
    try {
      const healthResponse = await axios.get(`${baseURL}/health`);
      console.log('✅ Server is running!');
      console.log('Server response:', healthResponse.data);
    } catch (error) {
      console.log('❌ Server health check failed:', error.message);
      console.log('   Make sure backend server is running on port 5000');
      return;
    }
    
    console.log('\n2. Testing dashboard endpoint (without auth)...');
    try {
      const dashboardResponse = await axios.get(`${baseURL}/analytics/dashboard`);
      console.log('✅ Dashboard endpoint accessible');
      console.log('Data structure:', JSON.stringify(dashboardResponse.data, null, 2));
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('⚠️ Dashboard requires authentication (expected)');
        console.log('Status:', error.response.status);
        console.log('Message:', error.response.data?.message);
      } else {
        console.log('❌ Dashboard endpoint error:', error.message);
        console.log('Status:', error.response?.status);
        console.log('Response:', error.response?.data);
      }
    }
    
    console.log('\n3. Testing time-series endpoint...');
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    try {
      const timeSeriesResponse = await axios.get(
        `${baseURL}/analytics/charts/time-series?date_from=${startDate}&date_to=${endDate}&group_by=day`
      );
      console.log('✅ Time-series endpoint accessible');
      console.log('Data points:', timeSeriesResponse.data?.data?.series?.length || 0);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('⚠️ Time-series requires authentication (expected)');
      } else {
        console.log('❌ Time-series endpoint error:', error.message);
        console.log('Status:', error.response?.status);
      }
    }
    
    console.log('\n📋 Next Steps:');
    console.log('1. Make sure you are logged in to the frontend');
    console.log('2. Check browser Network tab (F12) when refreshing dashboard');
    console.log('3. Look for API calls and their responses');
    console.log('4. If APIs return empty data, check if database has reports data');
    
  } catch (error) {
    console.error('❌ Connection error:', error.message);
    console.log('\n💡 Solutions:');
    console.log('- Check if backend server is running: npm start (in backend directory)');
    console.log('- Check if port 5000 is being used');
    console.log('- Check firewall/antivirus settings');
  }
}

// Also test database content check
async function suggestDatabaseCheck() {
  console.log('\n🗄️ To check if database has data, run these commands:');
  console.log('');
  console.log('Option 1 - Using MySQL command line:');
  console.log('mysql -u root -p');
  console.log('USE ads_reporting;');
  console.log('SELECT COUNT(*) FROM reports;');
  console.log('SELECT * FROM reports LIMIT 5;');
  console.log('');
  console.log('Option 2 - Using Node.js (create a simple script):');
  console.log(`
const mysql = require('mysql2/promise');

async function checkData() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',  // your db user
      password: '',  // your db password  
      database: 'ads_reporting'
    });
    
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM reports');
    console.log('Reports count:', rows[0].count);
    
    const [sample] = await connection.query('SELECT * FROM reports LIMIT 3');
    console.log('Sample data:', sample);
    
    connection.end();
  } catch (error) {
    console.error('Database error:', error.message);
  }
}

checkData();
`);
}

testDashboardEndpoints().then(() => {
  suggestDatabaseCheck();
});
