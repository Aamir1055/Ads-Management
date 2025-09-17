/**
 * Test if server has been restarted with fixes and authentication is working
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');
const { pool } = require('./config/database');

const SERVER_URL = 'http://localhost:5000';

async function testServerStatus() {
  console.log('🚀 Testing Server Status and Authentication...\n');
  
  try {
    // Test 1: Health check
    console.log('1️⃣ Testing server health...');
    const healthResponse = await axios.get(`${SERVER_URL}/api/health`);
    console.log(`✅ Server is running: ${healthResponse.data.message}`);
    console.log(`   Uptime: ${Math.round(healthResponse.data.system.uptime)}s\n`);
    
    // Test 2: Get user data from database
    console.log('2️⃣ Fetching user data from database...');
    const [users] = await pool.query(`
      SELECT id, username, hashed_password, role_id
      FROM users WHERE username = 'Aamir' OR username = 'admin' 
      ORDER BY username LIMIT 2
    `);
    
    if (users.length === 0) {
      console.log('❌ No test users found in database');
      return;
    }
    
    console.log(`✅ Found ${users.length} test users:`);
    users.forEach(user => {
      console.log(`   - ${user.username} (ID: ${user.id}, Role: ${user.role_id})`);
    });
    console.log();
    
    // Test 3: Attempt login
    console.log('3️⃣ Testing authentication...');
    let authToken = null;
    let testUser = null;
    
    // Try to get a test user (preferably Aamir)
    testUser = users.find(u => u.username === 'Aamir') || users[0];
    
    // Create a JWT token manually (simulating successful login)
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    authToken = jwt.sign(
      {
        id: testUser.id,
        username: testUser.username,
        role_id: testUser.role_id
      },
      jwtSecret,
      { expiresIn: '24h' }
    );
    
    console.log(`✅ Created JWT token for ${testUser.username}`);
    console.log(`   Token preview: ${authToken.substring(0, 50)}...\n`);
    
    // Test 4: Test protected endpoints with auth token
    console.log('4️⃣ Testing protected endpoints...');
    
    const endpoints = [
      { url: '/api/campaign-types', name: 'Campaign Types' },
      { url: '/api/user-management', name: 'User Management' },
      { url: '/api/campaigns', name: 'Campaigns' },
      { url: '/api/cards', name: 'Cards' },
      { url: '/api/reports/filters', name: 'Reports' }
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`   Testing ${endpoint.name}: ${endpoint.url}`);
        
        const response = await axios.get(`${SERVER_URL}${endpoint.url}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        });
        
        console.log(`   ✅ ${endpoint.name}: ${response.status} ${response.statusText}`);
        console.log(`      Response: ${JSON.stringify(response.data).substring(0, 100)}...`);
        
      } catch (error) {
        if (error.response) {
          console.log(`   ❌ ${endpoint.name}: ${error.response.status} ${error.response.statusText}`);
          console.log(`      Error: ${error.response.data.message || error.response.data}`);
          
          // If it's 403, show debug details
          if (error.response.status === 403 && error.response.data.details) {
            console.log(`      Required: ${error.response.data.details.requiredPermission}`);
            console.log(`      User Role: ${error.response.data.details.userRole}`);
          }
        } else if (error.code === 'ECONNREFUSED') {
          console.log(`   ❌ ${endpoint.name}: Server not running (connection refused)`);
        } else {
          console.log(`   ❌ ${endpoint.name}: ${error.message}`);
        }
      }
      console.log();
    }
    
    // Test 5: Check server logs for debug output
    console.log('5️⃣ Debug Information:');
    console.log(`   Test User: ${testUser.username} (ID: ${testUser.id}, Role: ${testUser.role_id})`);
    console.log(`   Server URL: ${SERVER_URL}`);
    console.log(`   JWT Secret: ${jwtSecret === 'your-secret-key' ? 'Using default' : 'Custom set'}`);
    console.log();
    
    console.log('📋 Next Steps:');
    console.log('1. Check your server console for debug messages starting with "🐛 RBAC DEBUG"');
    console.log('2. If you see 403 errors above, the server needs a RESTART');
    console.log('3. If you see connection refused, start your server with: npm start');
    console.log('4. If authentication fails, check JWT_SECRET in .env');
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Cannot connect to server - is it running on port 5000?');
      console.log('   Start your server with: npm start');
    } else {
      console.error('❌ Test failed:', error.message);
    }
  } finally {
    await pool.end();
  }
}

// Function to check if server is actually restarted
function checkServerProcess() {
  console.log('🔍 Checking if server process was restarted...\n');
  
  const { exec } = require('child_process');
  exec('netstat -ano | findstr :5000', (error, stdout, stderr) => {
    if (error) {
      console.log('❌ Could not check server process');
      return;
    }
    
    if (stdout.trim()) {
      console.log('✅ Server is listening on port 5000');
      console.log('   Process details:', stdout.trim());
    } else {
      console.log('❌ No process found listening on port 5000');
      console.log('   Server may not be running');
    }
    console.log();
  });
}

// Run tests
console.log('🧪 COMPREHENSIVE SERVER TEST\n');
console.log('This will test if your server has been restarted with all fixes applied.\n');

checkServerProcess();
setTimeout(() => {
  testServerStatus();
}, 1000);
