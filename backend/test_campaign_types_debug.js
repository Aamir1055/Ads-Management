const axios = require('axios');
require('dotenv').config();

const API_BASE = process.env.API_BASE || 'http://localhost:5000/api';

async function testCampaignTypesCreation() {
    console.log('🚀 Testing Campaign Types Creation with Debug Logging');
    console.log('=' .repeat(60));

    try {
        // Step 1: Login as admin
        console.log('\n📝 Step 1: Logging in as admin...');
        const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
            username: 'admin',
            password: 'password'
        });

        const token = loginResponse.data.token;
        console.log('✅ Login successful, token received');
        console.log('   Token preview:', token.substring(0, 30) + '...');

        // Step 2: Test GET /campaign-types (should work)
        console.log('\n📝 Step 2: Testing GET /api/campaign-types...');
        try {
            const getResponse = await axios.get(`${API_BASE}/campaign-types`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ GET request successful, existing campaign types:', getResponse.data.data?.length || 0);
        } catch (getError) {
            console.log('⚠️  GET request failed:', getError.response?.status, getError.response?.data?.message);
            console.log('   But continuing with POST test anyway...');
        }

        // Step 3: Test POST /campaign-types (the problematic request)
        console.log('\n📝 Step 3: Testing POST /api/campaign-types...');
        console.log('   This request should trigger extensive debug logging in the backend');
        
        const testCampaignType = {
            name: `Debug Test Campaign Type ${Date.now()}`,
            description: 'This is a test campaign type for debugging purposes',
            is_active: true
        };

        console.log('   Request data:', testCampaignType);
        console.log('\n⚠️  Watch the backend console for detailed debug logs now...\n');

        const createResponse = await axios.post(`${API_BASE}/campaign-types`, testCampaignType, {
            headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ POST request successful!');
        console.log('   Response:', createResponse.data);

    } catch (error) {
        console.log('\n❌ Error occurred:');
        console.log('   Status:', error.response?.status);
        console.log('   Status Text:', error.response?.statusText);
        console.log('   Error Message:', error.response?.data?.message);
        console.log('   Full Error Data:', JSON.stringify(error.response?.data, null, 2));
        
        if (error.response?.status === 403) {
            console.log('\n🔍 403 Forbidden Error Analysis:');
            console.log('   - This suggests the request reached the server but was denied');
            console.log('   - Check if the requireSuperAdmin middleware logs appeared in backend console');
            console.log('   - Verify the user authentication and role assignment');
        }
    }
}

testCampaignTypesCreation().catch(console.error);
