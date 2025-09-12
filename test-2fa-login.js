const https = require('https');
const http = require('http');

// Test credentials - replace with a real 2FA-enabled user
const TEST_USER = {
    username: 'your_test_username', // Replace with actual username
    password: 'your_test_password'   // Replace with actual password
};

function makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const protocol = options.port === 443 ? https : http;
        const req = protocol.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(responseData);
                    resolve({
                        statusCode: res.statusCode,
                        data: parsedData
                    });
                } catch (e) {
                    resolve({
                        statusCode: res.statusCode,
                        data: responseData
                    });
                }
            });
        });
        
        req.on('error', (err) => {
            reject(err);
        });
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

async function test2FALogin() {
    console.log('🧪 Testing 2FA Login Flow...\n');
    
    // Step 1: Test regular login with username/password
    console.log('📝 Step 1: Testing username/password login...');
    
    try {
        const loginResponse = await makeRequest({
            hostname: 'localhost',
            port: 5000,
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        }, {
            username: TEST_USER.username,
            password: TEST_USER.password
        });
        
        console.log('📊 Login Response Status:', loginResponse.statusCode);
        console.log('📊 Login Response Data:', JSON.stringify(loginResponse.data, null, 2));
        
        if (loginResponse.data.success && loginResponse.data.data.requires_2fa) {
            console.log('\n✅ Step 1 Passed: 2FA is required!');
            console.log('👤 User ID:', loginResponse.data.data.user.id);
            console.log('🔐 2FA Required:', loginResponse.data.data.requires_2fa);
            
            // Step 2: Test 2FA verification (will fail without real token)
            console.log('\n📝 Step 2: Testing 2FA verification with dummy token...');
            
            const twofaResponse = await makeRequest({
                hostname: 'localhost',
                port: 5000,
                path: '/api/auth/login-2fa',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            }, {
                user_id: loginResponse.data.data.user.id,
                token: '123456' // This will fail, but we can see if the endpoint works
            });
            
            console.log('📊 2FA Response Status:', twofaResponse.statusCode);
            console.log('📊 2FA Response Data:', JSON.stringify(twofaResponse.data, null, 2));
            
            if (twofaResponse.statusCode === 401 && twofaResponse.data.message === 'Invalid 2FA token') {
                console.log('\n✅ Step 2 Passed: 2FA endpoint working correctly (rejected invalid token)');
                console.log('\n🎉 2FA Login Flow Test: SUCCESS');
                console.log('\n📋 Instructions:');
                console.log('1. Use your authenticator app to get the current 6-digit code');
                console.log('2. Enter that code in the login form when prompted');
                console.log('3. The login should now work correctly');
            } else {
                console.log('\n❌ Step 2 Failed: Unexpected 2FA response');
            }
            
        } else if (loginResponse.data.success && !loginResponse.data.data.requires_2fa) {
            console.log('\n⚠️  User does not have 2FA enabled');
            console.log('🔧 To test 2FA login, first enable 2FA for this user in the user management panel');
        } else {
            console.log('\n❌ Step 1 Failed: Login failed');
            if (loginResponse.statusCode === 401) {
                console.log('🚫 Invalid credentials - please update TEST_USER in the script');
            }
        }
        
    } catch (error) {
        console.error('❌ Test Error:', error.message);
        console.log('\n🔧 Make sure:');
        console.log('1. Backend server is running on port 5000');
        console.log('2. Database is connected');
        console.log('3. Update TEST_USER credentials in the script');
    }
}

console.log('🚀 2FA Login Flow Test');
console.log('======================');
console.log('⚠️  Please update TEST_USER credentials in the script before running');
console.log('📝 Make sure the user has 2FA enabled\n');

test2FALogin();
