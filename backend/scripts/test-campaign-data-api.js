const axios = require('axios');

const API_BASE = 'http://localhost:5000/api/campaign-data';

// Test configuration
const testCampaignData = {
  campaign_id: 11, // Summer Sale 2025 campaign
  facebook_result: 450,
  xoho_result: 380,
  spent: 675.50,
  data_date: '2025-09-08',
  card_id: 1,
  card_name: 'Facebook Ads Card',
  created_by: 2 // Valid user ID
};

let createdCampaignDataId;

const runTests = async () => {
  console.log('🧪 Starting Campaign Data API Tests...\n');
  
  try {
    // Test 1: GET /api/campaign-data/campaigns (Get campaigns for dropdown)
    console.log('1️⃣ Testing GET /api/campaign-data/campaigns');
    try {
      const campaignsResponse = await axios.get(`${API_BASE}/campaigns`);
      console.log(`✅ Status: ${campaignsResponse.status}`);
      console.log(`✅ Found ${campaignsResponse.data.data?.length || 0} campaigns`);
      if (campaignsResponse.data.data && campaignsResponse.data.data.length > 0) {
        console.log(`✅ Sample campaign: ${campaignsResponse.data.data[0].name} (ID: ${campaignsResponse.data.data[0].id})`);
      }
    } catch (error) {
      console.log(`ℹ️  Campaigns endpoint returned: ${error.response?.status} - ${error.response?.data?.message}`);
    }
    console.log('');
    
    // Test 2: GET /api/campaign-data/cards (Get cards for dropdown)
    console.log('2️⃣ Testing GET /api/campaign-data/cards');
    try {
      const cardsResponse = await axios.get(`${API_BASE}/cards`);
      console.log(`✅ Status: ${cardsResponse.status}`);
      console.log(`✅ Found ${cardsResponse.data.data?.length || 0} cards`);
      if (cardsResponse.data.data && cardsResponse.data.data.length > 0) {
        console.log(`✅ Sample card: ${cardsResponse.data.data[0].card_name} (ID: ${cardsResponse.data.data[0].id})`);
      }
    } catch (error) {
      console.log(`ℹ️  Cards endpoint returned: ${error.response?.status} - ${error.response?.data?.message}`);
    }
    console.log('');
    
    // Test 3: GET /api/campaign-data (Get all campaign data)
    console.log('3️⃣ Testing GET /api/campaign-data');
    const getAllResponse = await axios.get(API_BASE);
    console.log(`✅ Status: ${getAllResponse.status}`);
    console.log(`✅ Found ${getAllResponse.data.data?.length || 0} campaign data entries`);
    if (getAllResponse.data.meta?.pagination) {
      console.log(`✅ Pagination: Page ${getAllResponse.data.meta.pagination.currentPage} of ${getAllResponse.data.meta.pagination.totalPages}`);
    }
    console.log('');
    
    // Test 4: POST /api/campaign-data (Create new campaign data)
    console.log('4️⃣ Testing POST /api/campaign-data');
    const createResponse = await axios.post(API_BASE, testCampaignData);
    console.log(`✅ Status: ${createResponse.status}`);
    console.log(`✅ Created campaign data for campaign: ${createResponse.data.data.campaign_name}`);
    createdCampaignDataId = createResponse.data.data.id;
    console.log(`✅ New ID: ${createdCampaignDataId}`);
    console.log(`✅ Facebook Result: ${createResponse.data.data.facebook_result}, Xoho Result: ${createResponse.data.data.xoho_result}, Spent: $${createResponse.data.data.spent}`);
    console.log('');
    
    // Test 5: GET /api/campaign-data/:id (Get campaign data by ID)
    console.log('5️⃣ Testing GET /api/campaign-data/:id');
    const getByIdResponse = await axios.get(`${API_BASE}/${createdCampaignDataId}`);
    console.log(`✅ Status: ${getByIdResponse.status}`);
    console.log(`✅ Retrieved: ${getByIdResponse.data.data.campaign_name}`);
    console.log(`✅ Data Date: ${getByIdResponse.data.data.data_date}`);
    console.log(`✅ Card: ${getByIdResponse.data.data.card_name}`);
    console.log('');
    
    // Test 6: PUT /api/campaign-data/:id (Update campaign data)
    console.log('6️⃣ Testing PUT /api/campaign-data/:id');
    const updateData = {
      facebook_result: 520,
      xoho_result: 450,
      spent: 785.25
    };
    const updateResponse = await axios.put(`${API_BASE}/${createdCampaignDataId}`, updateData);
    console.log(`✅ Status: ${updateResponse.status}`);
    console.log(`✅ Updated Facebook Result: ${updateResponse.data.data.facebook_result}`);
    console.log(`✅ Updated Xoho Result: ${updateResponse.data.data.xoho_result}`);
    console.log(`✅ Updated Spent: $${updateResponse.data.data.spent}`);
    console.log('');
    
    // Test 7: GET with filtering
    console.log('7️⃣ Testing GET with filtering (campaign_id)');
    const filterResponse = await axios.get(`${API_BASE}?campaign_id=11&limit=5`);
    console.log(`✅ Status: ${filterResponse.status}`);
    console.log(`✅ Filtered results: ${filterResponse.data.data?.length || 0} entries`);
    if (filterResponse.data.meta?.filters) {
      console.log(`✅ Applied filter: campaign_id=${filterResponse.data.meta.filters.campaign_id}`);
    }
    console.log('');
    
    // Test 8: GET with date range filtering
    console.log('8️⃣ Testing GET with date range filtering');
    const dateFilterResponse = await axios.get(`${API_BASE}?date_from=2025-09-01&date_to=2025-09-08&limit=10`);
    console.log(`✅ Status: ${dateFilterResponse.status}`);
    console.log(`✅ Date filtered results: ${dateFilterResponse.data.data?.length || 0} entries`);
    console.log('');
    
    // Test 9: DELETE /api/campaign-data/:id (Delete campaign data)
    console.log('9️⃣ Testing DELETE /api/campaign-data/:id');
    const deleteResponse = await axios.delete(`${API_BASE}/${createdCampaignDataId}`);
    console.log(`✅ Status: ${deleteResponse.status}`);
    console.log(`✅ Deleted campaign data: ${deleteResponse.data.data.campaign_name}`);
    console.log(`✅ Deleted entry date: ${deleteResponse.data.data.data_date}`);
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
    
    // Test invalid campaign_id
    console.log('❌ Testing invalid campaign_id (should return 400 or 404)');
    try {
      await axios.post(API_BASE, {
        campaign_id: 99999,
        facebook_result: 100,
        xoho_result: 100,
        spent: 100.00
      });
    } catch (error) {
      console.log(`✅ Expected error: ${error.response.status} - ${error.response.data.message}`);
    }
    
    // Test missing required fields
    console.log('❌ Testing missing required fields (should return 400)');
    try {
      await axios.post(API_BASE, {
        facebook_result: 100,
        // Missing campaign_id
      });
    } catch (error) {
      console.log(`✅ Expected validation error: ${error.response.status}`);
      console.log(`✅ Validation errors:`, Object.keys(error.response.data.errors || {}));
    }
    
    // Test duplicate entry (same campaign and date)
    console.log('❌ Testing duplicate entry (should return 409)');
    try {
      // First create an entry
      const duplicateData = {
        campaign_id: 11,
        facebook_result: 100,
        xoho_result: 100,
        spent: 100.00,
        data_date: '2025-09-08',
        created_by: 2
      };
      
      await axios.post(API_BASE, duplicateData);
      // Try to create the same entry again
      await axios.post(API_BASE, duplicateData);
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
