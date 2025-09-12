const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testDirectLogin() {
    try {
        console.log('🔐 Testing direct login API...\n');
        
        const testCases = [
            { username: 'ahmed', password: 'Admin123!' },
            { username: 'Ahmed', password: 'Admin123!' },
            { username: 'AHMED', password: 'Admin123!' },
            { username: 'aamir', password: 'Admin123!' },
            { username: 'testadmin', password: 'Admin123!' }
        ];
        
        for (const testCase of testCases) {
            console.log(`Testing login with: "${testCase.username}" / "${testCase.password}"`);
            
            try {
                const response = await axios.post(`${BASE_URL}/auth/login`, {
                    username: testCase.username,
                    password: testCase.password
                });
                
                if (response.data.success) {
                    console.log('✅ SUCCESS:', {
                        username: response.data.data?.user?.username,
                        requires_2fa: response.data.data?.requires_2fa,
                        token_present: !!response.data.data?.token
                    });
                } else {
                    console.log('❌ FAILED:', response.data.message);
                }
                
            } catch (error) {
                console.log('❌ ERROR:', error.response?.data?.message || error.message);
            }
            
            console.log(''); // Empty line for separation
        }
        
        console.log('✅ Direct login testing completed!');
        
    } catch (error) {
        console.error('❌ Error during direct login test:', error);
    }
}

testDirectLogin();
