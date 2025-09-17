const axios = require('axios');

// API configuration
const API_BASE_URL = 'http://localhost:5000/api';
const TEST_USER_CREDENTIALS = {
  username: 'admin',
  password: 'password'
};

let authToken = null;
let testBrandId = null;

// HTTP client with token
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

// Response interceptor for better error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message;
    const status = error.response?.status || 'Unknown';
    console.error(`❌ API Error [${status}]: ${message}`);
    throw error;
  }
);

async function login() {
  console.log('🔐 Logging in...');
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, TEST_USER_CREDENTIALS);
    if (response.data.success && response.data.data.access_token) {
      authToken = response.data.data.access_token;
      console.log('✅ Logged in successfully');
      return true;
    } else {
      console.log('❌ Login failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Login error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testGetAllBrands() {
  console.log('\n📋 Testing GET /api/brands...');
  try {
    const response = await apiClient.get('/brands');
    console.log('✅ GET /api/brands successful');
    console.log(`   Found ${response.data.data.length} brands`);
    return response.data;
  } catch (error) {
    console.error('❌ GET /api/brands failed');
    throw error;
  }
}

async function testGetActiveBrands() {
  console.log('\n📋 Testing GET /api/brands/active...');
  try {
    const response = await apiClient.get('/brands/active');
    console.log('✅ GET /api/brands/active successful');
    console.log(`   Found ${response.data.data.length} active brands`);
    return response.data;
  } catch (error) {
    console.error('❌ GET /api/brands/active failed');
    throw error;
  }
}

async function testGetBrandStats() {
  console.log('\n📊 Testing GET /api/brands/admin/stats...');
  try {
    const response = await apiClient.get('/brands/admin/stats');
    console.log('✅ GET /api/brands/admin/stats successful');
    console.log('   Stats:', response.data.data);
    return response.data;
  } catch (error) {
    console.error('❌ GET /api/brands/admin/stats failed');
    throw error;
  }
}

async function testCreateBrand() {
  console.log('\n📝 Testing POST /api/brands...');
  const brandData = {
    name: 'Test HTTP Brand',
    description: 'Brand created via HTTP API test',
    is_active: true
  };
  
  try {
    const response = await apiClient.post('/brands', brandData);
    console.log('✅ POST /api/brands successful');
    console.log(`   Created brand: ${response.data.data.name} (ID: ${response.data.data.id})`);
    testBrandId = response.data.data.id;
    return response.data;
  } catch (error) {
    console.error('❌ POST /api/brands failed');
    throw error;
  }
}

async function testGetBrandById() {
  if (!testBrandId) {
    console.log('\n⚠️ Skipping GET /api/brands/:id (no test brand ID)');
    return;
  }

  console.log(`\n🔍 Testing GET /api/brands/${testBrandId}...`);
  try {
    const response = await apiClient.get(`/brands/${testBrandId}`);
    console.log('✅ GET /api/brands/:id successful');
    console.log(`   Brand: ${response.data.data.name}`);
    return response.data;
  } catch (error) {
    console.error('❌ GET /api/brands/:id failed');
    throw error;
  }
}

async function testUpdateBrand() {
  if (!testBrandId) {
    console.log('\n⚠️ Skipping PUT /api/brands/:id (no test brand ID)');
    return;
  }

  console.log(`\n✏️ Testing PUT /api/brands/${testBrandId}...`);
  const updateData = {
    name: 'Test HTTP Brand Updated',
    description: 'Updated via HTTP API test',
    is_active: true
  };
  
  try {
    const response = await apiClient.put(`/brands/${testBrandId}`, updateData);
    console.log('✅ PUT /api/brands/:id successful');
    console.log(`   Updated brand: ${response.data.data.name}`);
    return response.data;
  } catch (error) {
    console.error('❌ PUT /api/brands/:id failed');
    throw error;
  }
}

async function testToggleBrandStatus() {
  if (!testBrandId) {
    console.log('\n⚠️ Skipping PUT /api/brands/:id/toggle (no test brand ID)');
    return;
  }

  console.log(`\n🔄 Testing PUT /api/brands/${testBrandId}/toggle...`);
  try {
    const response = await apiClient.put(`/brands/${testBrandId}/toggle`);
    console.log('✅ PUT /api/brands/:id/toggle successful');
    console.log(`   Brand status: ${response.data.data.is_active ? 'Active' : 'Inactive'}`);
    return response.data;
  } catch (error) {
    console.error('❌ PUT /api/brands/:id/toggle failed');
    throw error;
  }
}

async function testDeleteBrand() {
  if (!testBrandId) {
    console.log('\n⚠️ Skipping DELETE /api/brands/:id (no test brand ID)');
    return;
  }

  console.log(`\n🗑️ Testing DELETE /api/brands/${testBrandId}...`);
  try {
    const response = await apiClient.delete(`/brands/${testBrandId}`);
    console.log('✅ DELETE /api/brands/:id successful');
    return response.data;
  } catch (error) {
    console.error('❌ DELETE /api/brands/:id failed');
    throw error;
  }
}

async function testValidation() {
  console.log('\n🛡️ Testing validation...');
  
  // Test empty name
  try {
    await apiClient.post('/brands', { name: '', description: 'Test' });
    console.log('❌ Should have failed with empty name');
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Empty name validation working');
    } else {
      throw error;
    }
  }
  
  // Test duplicate name (if we have any existing brand)
  try {
    const brands = await apiClient.get('/brands');
    if (brands.data.data.length > 0) {
      const existingName = brands.data.data[0].name;
      await apiClient.post('/brands', { name: existingName, description: 'Duplicate test' });
      console.log('❌ Should have failed with duplicate name');
    }
  } catch (error) {
    if (error.response?.status === 400 || error.response?.status === 409) {
      console.log('✅ Duplicate name validation working');
    } else {
      throw error;
    }
  }
}

async function runHTTPTests() {
  console.log('🧪 Testing Brands HTTP API Endpoints...\n');
  
  try {
    // 1. Login first
    const loginSuccess = await login();
    if (!loginSuccess) {
      console.log('❌ Cannot proceed without authentication');
      return;
    }
    
    // 2. Test all endpoints
    await testGetAllBrands();
    await testGetActiveBrands();
    await testGetBrandStats();
    await testCreateBrand();
    await testGetBrandById();
    await testUpdateBrand();
    await testToggleBrandStatus();
    await testDeleteBrand();
    await testValidation();
    
    console.log('\n🎉 All HTTP API tests completed successfully!');
    
  } catch (error) {
    console.error('\n❌ HTTP API tests failed:', error.message);
    if (error.response?.data) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Check if server is running
async function checkServer() {
  try {
    console.log('🔍 Checking if server is running...');
    await axios.get(`${API_BASE_URL}/health`, { timeout: 5000 });
    console.log('✅ Server is running');
    return true;
  } catch (error) {
    console.error('❌ Server is not running or not accessible');
    console.error('   Please start the server first: npm start or node server.js');
    return false;
  }
}

// Main execution
async function main() {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await runHTTPTests();
  }
}

main();
