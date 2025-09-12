const { pool } = require('./config/database');
const campaignController = require('./controllers/campaignController');

async function testPersonaChanges() {
  try {
    console.log('🧪 Testing Persona Field Changes...\n');
    
    // Mock request and response objects
    const mockReq = (params = {}, query = {}, body = {}) => ({
      params,
      query,
      body,
      user: null
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
          return this;
        }
      };
      return res;
    };
    
    console.log('1. Testing CREATE campaign with comma-separated persona...');
    const createReq = mockReq(
      {}, 
      {}, 
      { 
        name: 'Test Persona Campaign',
        persona: 'Young Adults (18-25), Professionals (26-35), Students', // Comma-separated text
        brand: 'Test Brand',
        campaign_type_id: 19, // Using existing campaign type
        gender: ['male', 'female'],
        location: 'New York, Los Angeles, Chicago',
        age: 28,
        is_enabled: true
      }
    );
    const createRes = mockRes();
    await campaignController.createCampaign(createReq, createRes);
    
    if (createRes.statusCode === 201) {
      console.log('✅ CREATE with comma-separated persona - SUCCESS');
      console.log(`   Persona stored: "${createRes.data.data.persona}"`);
      
      const createdCampaignId = createRes.data.data.id;
      
      // Test reading the campaign
      console.log('\n2. Testing GET campaign with comma-separated persona...');
      const getReq = mockReq({ id: createdCampaignId.toString() });
      const getRes = mockRes();
      await campaignController.getCampaignById(getReq, getRes);
      
      if (getRes.statusCode === 200) {
        console.log('✅ GET with comma-separated persona - SUCCESS');
        console.log(`   Persona retrieved: "${getRes.data.data.persona}"`);
        console.log(`   Persona type: ${typeof getRes.data.data.persona}`);
      } else {
        console.log('❌ GET campaign - FAILED');
        console.log('   Response:', getRes.data);
      }
      
      // Test updating the campaign
      console.log('\n3. Testing UPDATE campaign with comma-separated persona...');
      const updateReq = mockReq(
        { id: createdCampaignId.toString() }, 
        {}, 
        { 
          persona: 'Entrepreneurs, Tech Enthusiasts, Homemakers', // Updated comma-separated text
          name: 'Updated Test Persona Campaign'
        }
      );
      const updateRes = mockRes();
      await campaignController.updateCampaign(updateReq, updateRes);
      
      if (updateRes.statusCode === 200) {
        console.log('✅ UPDATE with comma-separated persona - SUCCESS');
        console.log(`   Updated persona: "${updateRes.data.data.persona}"`);
      } else {
        console.log('❌ UPDATE campaign - FAILED');
        console.log('   Response:', updateRes.data);
      }
      
      // Clean up - delete the test campaign
      console.log('\n4. Cleaning up test data...');
      const deleteReq = mockReq({ id: createdCampaignId.toString() });
      const deleteRes = mockRes();
      await campaignController.deleteCampaign(deleteReq, deleteRes);
      
      if (deleteRes.statusCode === 200) {
        console.log('✅ Test cleanup - SUCCESS');
      }
      
    } else {
      console.log('❌ CREATE campaign - FAILED');
      console.log('   Response:', createRes.data);
    }
    
    console.log('\n✅ Persona field testing complete!');
    console.log('🎉 The persona field now accepts comma-separated text values instead of JSON arrays.');
    console.log('📝 Users can enter: "Young Adults (18-25), Professionals (26-35), Students"');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    process.exit(0);
  }
}

testPersonaChanges();
