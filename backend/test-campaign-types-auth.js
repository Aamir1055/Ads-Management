/**
 * Test Campaign Types Authentication
 * This script will test if the POST /api/campaign-types endpoint is working correctly
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testCampaignTypesAuth() {
  console.log('🧪 Testing Campaign Types Authentication...\\n');
  
  try {
    // Step 1: Login as admin to get token
    console.log('1️⃣ Logging in as admin...');
    
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      username: 'admin',
      password: 'admin123' // Try common admin passwords
    });
    
    if (!loginResponse.data.success) {
      // Try alternative passwords
      const altPasswords = ['password', 'admin', '123456', 'password123'];
      let token = null;
      
      for (const pwd of altPasswords) {
        try {
          const altLogin = await axios.post(`${API_BASE}/auth/login`, {
            username: 'admin',
            password: pwd
          });
          if (altLogin.data.success) {
            token = altLogin.data.data.token;
            console.log(`✅ Login successful with password: ${pwd}`);
            break;
          }
        } catch (e) {
          // Continue trying
        }
      }
      
      if (!token) {
        console.log('❌ Could not login with any common passwords');
        console.log('💡 Please check the admin user password in your database');
        return;
      }
    }
    
    const token = loginResponse.data.success ? loginResponse.data.data.token : null;
    
    if (!token) {
      console.log('❌ No token received from login');
      return;
    }
    
    console.log('✅ Login successful, token received');
    console.log(`Token preview: ${token.substring(0, 20)}...`);
    
    // Step 2: Test GET request (working)
    console.log('\\n2️⃣ Testing GET /api/campaign-types...');
    
    try {
      const getResponse = await axios.get(`${API_BASE}/campaign-types`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`✅ GET request successful: ${getResponse.status}`);
      console.log(`   Campaign types found: ${getResponse.data.data?.length || 0}`);
    } catch (error) {
      console.log(`❌ GET request failed: ${error.response?.status} - ${error.response?.data?.message}`);
    }
    
    // Step 3: Test POST request (failing)
    console.log('\\n3️⃣ Testing POST /api/campaign-types...');
    
    const testCampaignType = {
      type_name: 'Test Campaign Type',
      description: 'Test description for debugging'
    };
    
    try {
      const postResponse = await axios.post(`${API_BASE}/campaign-types`, testCampaignType, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`✅ POST request successful: ${postResponse.status}`);
      console.log(`   Created campaign type: ${postResponse.data.data?.type_name}`);
    } catch (error) {
      console.log(`❌ POST request failed: ${error.response?.status}`);
      console.log(`   Error: ${error.response?.data?.message}`);
      console.log(`   Details:`, error.response?.data?.details);
      
      if (error.response?.status === 403) {
        console.log('\\n🔍 403 Forbidden - This suggests:');
        console.log('   1. The requireSuperAdmin middleware is rejecting the request');
        console.log('   2. The token might not contain the correct role information');
        console.log('   3. The middleware is not recognizing the super_admin role');
      }
    }
    
    // Step 4: Test token payload
    console.log('\\n4️⃣ Analyzing token payload...');
    
    try {
      // Decode JWT token (without verification - just for debugging)
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
        console.log('Token payload:', {
          userId: payload.id,
          username: payload.username,
          roleId: payload.role_id,
          roleName: payload.role?.name,
          roleLevel: payload.role?.level,
          exp: new Date(payload.exp * 1000).toISOString()
        });
        
        if (!payload.role || !payload.role.name) {
          console.log('⚠️  Token does not contain role information!');
          console.log('💡 This could be why the SuperAdmin check is failing');
        }
      }
    } catch (error) {
      console.log('⚠️  Could not decode token payload');
    }
    
    // Step 5: Test with direct curl-like request
    console.log('\\n5️⃣ Testing raw HTTP request...');
    
    try {
      const rawResponse = await axios({
        method: 'POST',
        url: `${API_BASE}/campaign-types`,
        data: testCampaignType,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        validateStatus: function (status) {
          return status < 500; // Don't throw error for 4xx status codes
        }
      });
      
      console.log(`Raw response status: ${rawResponse.status}`);
      console.log(`Raw response data:`, rawResponse.data);
      
      if (rawResponse.status === 403) {
        console.log('\\n💡 DIAGNOSIS: The issue is in the requireSuperAdmin middleware');
        console.log('The token is being sent correctly, but the middleware is rejecting it');
      }
    } catch (error) {
      console.log(`Raw request error: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testCampaignTypesAuth();
