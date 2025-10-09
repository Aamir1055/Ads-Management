const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// Test data
const testBM = {
    bm_name: 'Test BM for API',
    email: 'test.bm@example.com',
    phone_number: '1234567890',
    status: 'enabled'
};

const testAdsManager = {
    ads_manager_name: 'Test Ads Manager',
    // email: '', // Testing optional email
    phone_number: '0987654321',
    status: 'enabled'
};

async function testAdsManagerAPI() {
    try {
        console.log('🚀 Testing Ads Manager API with optional email...\n');

        // First, get auth token (assuming you have a test user)
        console.log('1. Login to get auth token...');
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
            username: 'admin', // Replace with actual test credentials
            password: 'admin123' // Replace with actual test credentials
        });

        if (!loginResponse.data.success) {
            throw new Error('Login failed');
        }

        const token = loginResponse.data.data.access_token || loginResponse.data.access_token;
        console.log('✅ Login successful\n');

        const authHeaders = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // Create a test BM first
        console.log('2. Creating test Business Manager...');
        const bmResponse = await axios.post(`${API_BASE_URL}/bm`, testBM, { headers: authHeaders });
        
        if (!bmResponse.data.success) {
            throw new Error('Failed to create BM: ' + bmResponse.data.message);
        }

        const bmId = bmResponse.data.data.id;
        console.log('✅ BM created with ID:', bmId);
        testAdsManager.bm_id = bmId;

        // Test creating Ads Manager WITHOUT email
        console.log('\n3. Creating Ads Manager without email...');
        const adsManagerResponse = await axios.post(`${API_BASE_URL}/ads-managers`, testAdsManager, { headers: authHeaders });
        
        if (!adsManagerResponse.data.success) {
            throw new Error('Failed to create Ads Manager: ' + adsManagerResponse.data.message);
        }

        const adsManagerId = adsManagerResponse.data.data.id;
        console.log('✅ Ads Manager created with ID:', adsManagerId);
        console.log('📋 Created Ads Manager data:', JSON.stringify(adsManagerResponse.data.data, null, 2));

        // Test creating Ads Manager WITH email
        console.log('\n4. Creating Ads Manager with email...');
        const testAdsManager2 = {
            ...testAdsManager,
            ads_manager_name: 'Test Ads Manager 2',
            email: 'test.ads.manager@example.com'
        };

        const adsManagerResponse2 = await axios.post(`${API_BASE_URL}/ads-managers`, testAdsManager2, { headers: authHeaders });
        
        if (!adsManagerResponse2.data.success) {
            throw new Error('Failed to create Ads Manager 2: ' + adsManagerResponse2.data.message);
        }

        const adsManagerId2 = adsManagerResponse2.data.data.id;
        console.log('✅ Ads Manager 2 created with ID:', adsManagerId2);
        console.log('📋 Created Ads Manager 2 data:', JSON.stringify(adsManagerResponse2.data.data, null, 2));

        // Test getting BM dropdown options
        console.log('\n5. Testing BM dropdown API...');
        const dropdownResponse = await axios.get(`${API_BASE_URL}/bm/dropdown`, { headers: authHeaders });
        
        if (!dropdownResponse.data.success) {
            throw new Error('Failed to get BM dropdown: ' + dropdownResponse.data.message);
        }

        console.log('✅ BM dropdown options:');
        dropdownResponse.data.data.forEach(bm => {
            console.log(`   - ${bm.bm_name} (ID: ${bm.id})`);
        });

        // Cleanup
        console.log('\n6. Cleaning up test data...');
        await axios.delete(`${API_BASE_URL}/ads-managers/${adsManagerId}`, { headers: authHeaders });
        await axios.delete(`${API_BASE_URL}/ads-managers/${adsManagerId2}`, { headers: authHeaders });
        await axios.delete(`${API_BASE_URL}/bm/${bmId}`, { headers: authHeaders });
        console.log('✅ Cleanup completed\n');

        console.log('🎉 All tests passed! Email is now optional for Ads Managers.');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('📋 Error details:', error.response.data);
        }
    }
}

// Run the test
testAdsManagerAPI();