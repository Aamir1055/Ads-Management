const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function debugFrontendAuth() {
    try {
        console.log('🔍 Debugging frontend authentication issues...\n');
        
        // Step 1: Test login and get token
        console.log('1. Testing login to get authentication token...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            username: 'ahmed',
            password: 'Admin123!'
        });
        
        if (!loginResponse.data.success) {
            console.log('❌ Login failed:', loginResponse.data);
            return;
        }
        
        console.log('✅ Login successful!');
        const token = loginResponse.data.data.token;
        const user = loginResponse.data.data.user;
        console.log('User:', user);
        console.log('Token (first 20 chars):', token.substring(0, 20) + '...');
        
        const headers = { Authorization: `Bearer ${token}` };
        
        // Step 2: Test user operations with token
        console.log('\n2. Testing user operations with authentication...');
        
        // Test getting users list
        console.log('\nTesting GET /api/users...');
        try {
            const usersResponse = await axios.get(`${BASE_URL}/users`, { headers });
            console.log('✅ Get users successful:', usersResponse.data.data?.users?.length || 0, 'users found');
        } catch (error) {
            console.log('❌ Get users failed:', error.response?.data || error.message);
        }
        
        // Test creating a user
        console.log('\nTesting POST /api/users (create user)...');
        try {
            const newUserData = {
                username: `testuser${Date.now()}`,
                password: 'TestPass123!',
                confirm_password: 'TestPass123!',
                role_id: 2, // admin role
                enable_2fa: false,
                is_active: true
            };
            
            const createResponse = await axios.post(`${BASE_URL}/users`, newUserData, { headers });
            console.log('✅ Create user successful:', createResponse.data.data?.user?.username);
            
            const newUserId = createResponse.data.data?.user?.id;
            
            if (newUserId) {
                // Test updating the user
                console.log('\nTesting PUT /api/users/:id (update user)...');
                try {
                    const updateData = {
                        username: `updated${Date.now()}`,
                        role_id: 2,
                        is_active: true
                    };
                    
                    const updateResponse = await axios.put(`${BASE_URL}/users/${newUserId}`, updateData, { headers });
                    console.log('✅ Update user successful:', updateResponse.data.data?.user?.username);
                } catch (error) {
                    console.log('❌ Update user failed:', error.response?.data || error.message);
                }
                
                // Test deleting the user
                console.log('\nTesting DELETE /api/users/:id (delete user)...');
                try {
                    const deleteResponse = await axios.delete(`${BASE_URL}/users/${newUserId}`, { headers });
                    console.log('✅ Delete user successful:', deleteResponse.data.message);
                } catch (error) {
                    console.log('❌ Delete user failed:', error.response?.data || error.message);
                }
            }
            
        } catch (error) {
            console.log('❌ Create user failed:', error.response?.data || error.message);
        }
        
        // Step 3: Test specific user operations that are failing
        console.log('\n3. Testing specific operations that frontend is trying...');
        
        // Try to delete user 16 (the one that failed in frontend)
        console.log('\nTesting DELETE /api/users/16...');
        try {
            const deleteResponse = await axios.delete(`${BASE_URL}/users/16`, { headers });
            console.log('✅ Delete user 16 successful:', deleteResponse.data.message);
        } catch (error) {
            console.log('❌ Delete user 16 failed:', {
                status: error.response?.status,
                message: error.response?.data?.message,
                errors: error.response?.data?.errors
            });
        }
        
        // Try to update user 17 (the one that failed in frontend)
        console.log('\nTesting PUT /api/users/17...');
        try {
            const updateData = {
                username: 'testupdate',
                role_id: 2,
                is_active: true
            };
            
            const updateResponse = await axios.put(`${BASE_URL}/users/17`, updateData, { headers });
            console.log('✅ Update user 17 successful:', updateResponse.data.data?.user?.username);
        } catch (error) {
            console.log('❌ Update user 17 failed:', {
                status: error.response?.status,
                message: error.response?.data?.message,
                errors: error.response?.data?.errors
            });
        }
        
        console.log('\n✅ Authentication debug completed!');
        
    } catch (error) {
        console.error('❌ Error during debug:', error.response?.data || error.message);
    }
}

debugFrontendAuth();
