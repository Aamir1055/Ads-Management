const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testAPIEndpoints() {
    try {
        console.log('Testing API endpoints with authentication...\n');
        
        // Step 1: Login to get token
        console.log('1. Logging in as ahmed...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            username: 'ahmed',
            password: 'Admin123!'
        });
        
        if (loginResponse.data.success) {
            console.log('✅ Login successful');
            console.log('Full login response:', JSON.stringify(loginResponse.data, null, 2));
            
            const token = loginResponse.data.data.token;
            console.log('Extracted token:', token);
            console.log('Token length:', token ? token.length : 'null');
            const headers = { Authorization: `Bearer ${token}` };
            console.log('Authorization header:', headers.Authorization);
            
            // Step 2: Test users endpoint
            console.log('\n2. Testing /api/users endpoint...');
            try {
                const usersResponse = await axios.get(`${BASE_URL}/users`, { headers });
                console.log('✅ Users endpoint successful');
                console.log(`Found ${usersResponse.data.users?.length || 0} users`);
            } catch (error) {
                console.log('❌ Users endpoint failed:', error.response?.data || error.message);
            }
            
            // Step 3: Test permissions endpoints
            console.log('\n3. Testing /api/permissions endpoints...');
            try {
                const permissionsResponse = await axios.get(`${BASE_URL}/permissions`, { headers });
                console.log('✅ Permissions endpoint successful');
                console.log(`Found ${permissionsResponse.data.permissions?.length || 0} permissions`);
            } catch (error) {
                console.log('❌ Permissions endpoint failed:', error.response?.data || error.message);
            }
            
            // Step 4: Test permissions-list endpoint
            console.log('\n4. Testing /api/permissions/permissions-list endpoint...');
            try {
                const permListResponse = await axios.get(`${BASE_URL}/permissions/permissions-list`, { headers });
                console.log('✅ Permissions list endpoint successful');
                console.log(`Found ${permListResponse.data.permissions?.length || 0} permissions in list`);
            } catch (error) {
                console.log('❌ Permissions list endpoint failed:', error.response?.data || error.message);
            }
            
            // Step 5: Test roles endpoint
            console.log('\n5. Testing /api/permissions/roles endpoint...');
            try {
                const rolesResponse = await axios.get(`${BASE_URL}/permissions/roles`, { headers });
                console.log('✅ Roles endpoint successful');
                console.log(`Found ${rolesResponse.data.roles?.length || 0} roles`);
            } catch (error) {
                console.log('❌ Roles endpoint failed:', error.response?.data || error.message);
            }
            
        } else {
            console.log('❌ Login failed:', loginResponse.data);
        }
        
        console.log('\n✅ API endpoint testing completed!');
        
    } catch (error) {
        console.error('❌ Error testing API endpoints:', error.response?.data || error.message);
    }
}

// Run the test
testAPIEndpoints();
