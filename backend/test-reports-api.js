const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// Helper function to print test results
function printResult(testName, success, message = '') {
  const status = success ? `${colors.green}✓ PASS${colors.reset}` : `${colors.red}✗ FAIL${colors.reset}`;
  console.log(`${status} - ${testName}`);
  if (message) {
    console.log(`  ${colors.yellow}→${colors.reset} ${message}`);
  }
}

// First, let's create a test user and login to get a token
async function getAuthToken() {
  try {
    // Try to create a test user (might fail if already exists)
    try {
      await axios.post(`${API_BASE_URL}/users`, {
        username: 'test_reports_user',
        password: 'Test@123',
        confirmPassword: 'Test@123',
        role_id: 1
      });
      console.log(`${colors.green}Test user created${colors.reset}`);
    } catch (error) {
      console.log(`${colors.yellow}Test user might already exist, continuing...${colors.reset}`);
    }

    // Login to get token
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      username: 'test_reports_user',
      password: 'Test@123'
    });

    if (loginResponse.data.success && loginResponse.data.token) {
      console.log(`${colors.green}Successfully logged in${colors.reset}`);
      return loginResponse.data.token;
    } else {
      throw new Error('Failed to get auth token');
    }
  } catch (error) {
    console.error(`${colors.red}Auth setup failed:${colors.reset}`, error.response?.data?.message || error.message);
    return null;
  }
}

// Test the reports API
async function testReportsAPI() {
  console.log(`\n${colors.blue}=== Testing Reports API Brand Names ===${colors.reset}`);
  
  const token = await getAuthToken();
  if (!token) {
    console.log(`${colors.red}Cannot test reports API without auth token${colors.reset}`);
    return;
  }

  try {
    const response = await axios.get(`${API_BASE_URL}/reports`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      const reports = response.data.data;
      printResult('Get reports API', true, `Found ${reports.length} reports`);
      
      // Check first few reports for brand_name field
      console.log(`\n${colors.blue}Checking brand_name field in reports:${colors.reset}`);
      
      for (let i = 0; i < Math.min(5, reports.length); i++) {
        const report = reports[i];
        const hasBrandName = report.hasOwnProperty('brand_name');
        const brandNameValue = report.brand_name;
        
        console.log(`${colors.yellow}Report ${i + 1}:${colors.reset}`);
        console.log(`  Campaign: ${report.campaign_name || 'N/A'}`);
        console.log(`  Brand ID: ${report.brand_id || 'N/A'}`);
        console.log(`  Brand Name Field: ${hasBrandName ? 'Present' : 'Missing'}`);
        console.log(`  Brand Name Value: ${brandNameValue || 'undefined/null'}`);
        
        if (hasBrandName && brandNameValue && brandNameValue !== 'undefined') {
          printResult(`Report ${i + 1} brand name`, true, `Brand: ${brandNameValue}`);
        } else {
          printResult(`Report ${i + 1} brand name`, false, `Brand name is ${brandNameValue}`);
        }
        console.log('');
      }
      
      // Summary of brand names
      const brandNames = reports
        .map(r => r.brand_name)
        .filter(name => name && name !== 'undefined' && name !== 'null');
        
      const uniqueBrands = [...new Set(brandNames)];
      
      console.log(`${colors.blue}Summary:${colors.reset}`);
      console.log(`  Total reports: ${reports.length}`);
      console.log(`  Reports with valid brand names: ${brandNames.length}`);
      console.log(`  Unique brand names: ${uniqueBrands.join(', ') || 'None'}`);
      
    } else {
      printResult('Get reports API', false, response.data.message);
    }
  } catch (error) {
    printResult('Get reports API', false, error.response?.data?.message || error.message);
  }
}

// Main test runner
async function runTests() {
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.blue}Testing Reports API - Brand Name Functionality${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`API Base URL: ${API_BASE_URL}`);
  
  try {
    // Check if server is running
    await axios.get('http://localhost:5000/api/health');
    console.log(`${colors.green}✓ Server is running${colors.reset}`);
  } catch (error) {
    console.log(`${colors.red}✗ Server is not running. Please start the backend server first.${colors.reset}`);
    process.exit(1);
  }
  
  await testReportsAPI();
  
  console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.green}Test completed!${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}`);
}

// Run tests
runTests().catch(error => {
  console.error(`${colors.red}Test failed:${colors.reset}`, error.message);
  process.exit(1);
});
