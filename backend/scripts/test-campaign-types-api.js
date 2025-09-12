const axios = require('axios');

const API_BASE = 'http://localhost:5000/api/campaign-types';

// Test configuration
const testCampaignType = {
  type_name: 'Test Campaign Type',
  description: 'This is a test campaign type for API testing',
  is_active: true
};

let createdCampaignTypeId;

const runTests = async () => {
  console.log('🧪 Starting Campaign Types API Tests...\n');
  
  try {
    // Test 1: GET /api/campaign-types (Get all campaign types)
    console.log('1️⃣ Testing GET /api/campaign-types');
    const getAllResponse = await axios.get(API_BASE);
    console.log(`✅ Status: ${getAllResponse.status}`);
    console.log(`✅ Found ${getAllResponse.data.data.length} campaign types`);
    console.log(`✅ Pagination: Page ${getAllResponse.data.meta.pagination.currentPage} of ${getAllResponse.data.meta.pagination.totalPages}`);
    console.log('');
    
    // Test 2: POST /api/campaign-types (Create new campaign type)
    console.log('2️⃣ Testing POST /api/campaign-types');
    const createResponse = await axios.post(API_BASE, testCampaignType);
    console.log(`✅ Status: ${createResponse.status}`);
    console.log(`✅ Created campaign type: ${createResponse.data.data.type_name}`);
    createdCampaignTypeId = createResponse.data.data.id;
    console.log(`✅ New ID: ${createdCampaignTypeId}`);
    console.log('');
    
    // Test 3: GET /api/campaign-types/:id (Get campaign type by ID)
    console.log('3️⃣ Testing GET /api/campaign-types/:id');
    const getByIdResponse = await axios.get(`${API_BASE}/${createdCampaignTypeId}`);
    console.log(`✅ Status: ${getByIdResponse.status}`);
    console.log(`✅ Retrieved: ${getByIdResponse.data.data.type_name}`);
    console.log(`✅ Description: ${getByIdResponse.data.data.description}`);
    console.log('');
    
    // Test 4: PUT /api/campaign-types/:id (Update campaign type)
    console.log('4️⃣ Testing PUT /api/campaign-types/:id');
    const updateData = {
      type_name: 'Updated Test Campaign Type',
      description: 'This description has been updated'
    };
    const updateResponse = await axios.put(`${API_BASE}/${createdCampaignTypeId}`, updateData);
    console.log(`✅ Status: ${updateResponse.status}`);
    console.log(`✅ Updated name: ${updateResponse.data.data.type_name}`);
    console.log(`✅ Updated description: ${updateResponse.data.data.description}`);
    console.log('');
    
    // Test 5: GET with search and pagination
    console.log('5️⃣ Testing GET with search and pagination');
    const searchResponse = await axios.get(`${API_BASE}?search=Search&page=1&limit=3`);
    console.log(`✅ Status: ${searchResponse.status}`);
    console.log(`✅ Search results: ${searchResponse.data.data.length} items`);
    console.log(`✅ Search term: ${searchResponse.data.meta.filters.search}`);
    console.log('');
    
    // Test 6: GET with status filter
    console.log('6️⃣ Testing GET with status filter');
    const statusResponse = await axios.get(`${API_BASE}?status=active&limit=5`);
    console.log(`✅ Status: ${statusResponse.status}`);
    console.log(`✅ Active campaign types: ${statusResponse.data.data.length}`);
    console.log(`✅ Status filter: ${statusResponse.data.meta.filters.status}`);
    console.log('');
    
    // Test 7: DELETE /api/campaign-types/:id (Soft delete campaign type)
    console.log('7️⃣ Testing DELETE /api/campaign-types/:id');
    const deleteResponse = await axios.delete(`${API_BASE}/${createdCampaignTypeId}`);
    console.log(`✅ Status: ${deleteResponse.status}`);
    console.log(`✅ Deleted: ${deleteResponse.data.data.type_name}`);
    console.log('');
    
    // Test 8: Verify soft delete - campaign type should still exist but be inactive
    console.log('8️⃣ Testing soft delete verification');
    const verifyDeleteResponse = await axios.get(`${API_BASE}/${createdCampaignTypeId}`);
    console.log(`✅ Status: ${verifyDeleteResponse.status}`);
    console.log(`✅ Campaign type still exists but is_active: ${verifyDeleteResponse.data.data.is_active}`);
    console.log('');
    
    console.log('🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
};

// Additional error testing
const runErrorTests = async () => {
  console.log('\n🚨 Testing Error Scenarios...\n');
  
  try {
    // Test invalid ID
    console.log('❌ Testing invalid ID (should return 404)');
    try {
      await axios.get(`${API_BASE}/99999`);
    } catch (error) {
      console.log(`✅ Expected error: ${error.response.status} - ${error.response.data.message}`);
    }
    
    // Test invalid data
    console.log('❌ Testing invalid data (should return 400)');
    try {
      await axios.post(API_BASE, { type_name: '' }); // Empty name
    } catch (error) {
      console.log(`✅ Expected validation error: ${error.response.status}`);
      console.log(`✅ Validation errors:`, Object.keys(error.response.data.errors));
    }
    
    // Test duplicate name
    console.log('❌ Testing duplicate name (should return 409)');
    try {
      await axios.post(API_BASE, { type_name: 'Search', description: 'Duplicate test' });
    } catch (error) {
      console.log(`✅ Expected duplicate error: ${error.response.status} - ${error.response.data.message}`);
    }
    
    console.log('✅ Error testing completed!');
    
  } catch (error) {
    console.error('❌ Error test failed:', error.message);
  }
};

// Run all tests
const main = async () => {
  await runTests();
  await runErrorTests();
  process.exit(0);
};

main();
