const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

async function testBMSearchAndFilter() {
    try {
        console.log('🔍 Testing BM Search and Filter functionality...\n');

        // First, get auth token
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

        // Test 1: Get all BMs (no filter)
        console.log('2. Testing: Get all BMs (no filter)...');
        const allResponse = await axios.get(`${API_BASE_URL}/bm?limit=100`, { headers: authHeaders });
        
        if (allResponse.data.success) {
            console.log(`✅ Found ${allResponse.data.data.length} BMs total`);
            allResponse.data.data.forEach(bm => {
                console.log(`   - "${bm.bm_name}" (${bm.status}) - ${bm.email}`);
            });
        } else {
            console.log('❌ Failed:', allResponse.data.message);
        }

        // Test 2: Search by name
        console.log('\n3. Testing: Search by BM name...');
        const searchResponse = await axios.get(`${API_BASE_URL}/bm?limit=100&search=Business`, { headers: authHeaders });
        
        if (searchResponse.data.success) {
            console.log(`✅ Search "Business" found ${searchResponse.data.data.length} BMs:`);
            searchResponse.data.data.forEach(bm => {
                console.log(`   - "${bm.bm_name}" (${bm.status}) - ${bm.email}`);
            });
        } else {
            console.log('❌ Search failed:', searchResponse.data.message);
        }

        // Test 3: Filter by status
        console.log('\n4. Testing: Filter by status (enabled)...');
        const statusResponse = await axios.get(`${API_BASE_URL}/bm?limit=100&status=enabled`, { headers: authHeaders });
        
        if (statusResponse.data.success) {
            console.log(`✅ Status filter "enabled" found ${statusResponse.data.data.length} BMs:`);
            statusResponse.data.data.forEach(bm => {
                console.log(`   - "${bm.bm_name}" (${bm.status}) - ${bm.email}`);
            });
        } else {
            console.log('❌ Status filter failed:', statusResponse.data.message);
        }

        // Test 4: Combined search and filter
        console.log('\n5. Testing: Combined search and status filter...');
        const combinedResponse = await axios.get(`${API_BASE_URL}/bm?limit=100&search=Test&status=enabled`, { headers: authHeaders });
        
        if (combinedResponse.data.success) {
            console.log(`✅ Combined search "Test" + status "enabled" found ${combinedResponse.data.data.length} BMs:`);
            combinedResponse.data.data.forEach(bm => {
                console.log(`   - "${bm.bm_name}" (${bm.status}) - ${bm.email}`);
            });
        } else {
            console.log('❌ Combined filter failed:', combinedResponse.data.message);
        }

        // Test 5: Search by email
        console.log('\n6. Testing: Search by email...');
        const emailSearchResponse = await axios.get(`${API_BASE_URL}/bm?limit=100&search=gmail`, { headers: authHeaders });
        
        if (emailSearchResponse.data.success) {
            console.log(`✅ Email search "gmail" found ${emailSearchResponse.data.data.length} BMs:`);
            emailSearchResponse.data.data.forEach(bm => {
                console.log(`   - "${bm.bm_name}" (${bm.status}) - ${bm.email}`);
            });
        } else {
            console.log('❌ Email search failed:', emailSearchResponse.data.message);
        }

        console.log('\n🎉 All tests completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('📋 Error details:', error.response.data);
        }
    }
}

// Run the test
testBMSearchAndFilter();