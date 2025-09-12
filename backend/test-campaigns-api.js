const { pool } = require('./config/database');
const campaignController = require('./controllers/campaignController');

async function testCampaignsAPI() {
  try {
    console.log('🧪 Testing Campaigns API Functions...');
    
    // Mock request and response objects
    const mockReq = (params = {}, query = {}, body = {}) => ({
      params,
      query,
      body,
      user: null // simulate no authenticated user
    });
    
    const mockRes = () => {
      const res = {
        statusCode: null,
        data: null,
        status: function(code) {
          this.statusCode = code;
          return this;
        },
        json: function(data) {
          this.data = data;
          console.log(`Response [${this.statusCode}]:`, JSON.stringify(data, null, 2));
          return this;
        }
      };
      return res;
    };
    
    console.log('\n1. Testing GET all campaigns...');
    try {
      const req = mockReq({}, { page: 1, limit: 10 });
      const res = mockRes();
      await campaignController.getAllCampaigns(req, res);
      
      if (res.statusCode === 200) {
        console.log('✅ GET all campaigns - SUCCESS');
      } else {
        console.log('❌ GET all campaigns - FAILED');
      }
    } catch (error) {
      console.log('❌ GET all campaigns - ERROR:', error.message);
    }
    
    console.log('\n2. Testing GET campaign by ID...');
    try {
      const req = mockReq({ id: '11' }); // Using ID from our debug output
      const res = mockRes();
      await campaignController.getCampaignById(req, res);
      
      if (res.statusCode === 200) {
        console.log('✅ GET campaign by ID - SUCCESS');
      } else {
        console.log('❌ GET campaign by ID - FAILED');
      }
    } catch (error) {
      console.log('❌ GET campaign by ID - ERROR:', error.message);
    }
    
    console.log('\n3. Testing UPDATE campaign...');
    try {
      const req = mockReq(
        { id: '11' }, 
        {}, 
        { 
          name: 'Updated Summer Sale 2025',
          brand: 'Test Brand',
          is_enabled: true
        }
      );
      const res = mockRes();
      await campaignController.updateCampaign(req, res);
      
      if (res.statusCode === 200) {
        console.log('✅ UPDATE campaign - SUCCESS');
      } else {
        console.log('❌ UPDATE campaign - FAILED');
      }
    } catch (error) {
      console.log('❌ UPDATE campaign - ERROR:', error.message);
    }
    
    console.log('\n4. Testing CREATE campaign...');
    try {
      const req = mockReq(
        {}, 
        {}, 
        { 
          name: 'Test Campaign API',
          brand: 'Test Brand',
          campaign_type_id: 19, // Using ID from our debug output
          is_enabled: true,
          age: 25,
          location: 'Test Location'
        }
      );
      const res = mockRes();
      await campaignController.createCampaign(req, res);
      
      if (res.statusCode === 201) {
        console.log('✅ CREATE campaign - SUCCESS');
        // Store the created ID for deletion test
        global.createdCampaignId = res.data.data.id;
      } else {
        console.log('❌ CREATE campaign - FAILED');
      }
    } catch (error) {
      console.log('❌ CREATE campaign - ERROR:', error.message);
    }
    
    console.log('\n5. Testing DELETE campaign...');
    try {
      // Use the created campaign ID if available, otherwise use a test ID
      const idToDelete = global.createdCampaignId || '13';
      const req = mockReq({ id: idToDelete.toString() });
      const res = mockRes();
      await campaignController.deleteCampaign(req, res);
      
      if (res.statusCode === 200) {
        console.log('✅ DELETE campaign - SUCCESS');
      } else {
        console.log('❌ DELETE campaign - FAILED');
      }
    } catch (error) {
      console.log('❌ DELETE campaign - ERROR:', error.message);
    }
    
    console.log('\n✅ API Testing complete!');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    process.exit(0);
  }
}

testCampaignsAPI();
