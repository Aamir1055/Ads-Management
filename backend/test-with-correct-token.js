/**
 * Test with correct access token format
 */

const axios = require('axios');
const jwt = require('jsonwebtoken');
const { pool } = require('./config/database');

const SERVER_URL = 'http://localhost:5000';

async function testWithCorrectToken() {
  console.log('🧪 Testing with CORRECT access token format...\n');
  
  try {
    // Get user data
    const [users] = await pool.query(`
      SELECT id, username, hashed_password, role_id
      FROM users WHERE username = 'Aamir' LIMIT 1
    `);
    
    if (users.length === 0) {
      console.log('❌ User "Aamir" not found');
      return;
    }
    
    const user = users[0];
    console.log(`👤 Testing with user: ${user.username} (ID: ${user.id}, Role: ${user.role_id})`);
    
    // Create CORRECT access token format (what the authMiddleware expects)
    const jwtSecret = process.env.JWT_SECRET || 'access_token_secret';
    const accessToken = jwt.sign(
      {
        userId: user.id,  // Note: userId, not id
        type: 'access'    // Required: must be 'access'
      },
      jwtSecret,
      { expiresIn: '15m' }
    );
    
    console.log(`✅ Generated correct access token`);
    console.log(`   Token preview: ${accessToken.substring(0, 50)}...\n`);
    
    // Test endpoints with correct token
    const endpoints = [
      { url: '/api/campaign-types', name: 'Campaign Types' },
      { url: '/api/user-management', name: 'User Management' },
      { url: '/api/campaigns', name: 'Campaigns' },
      { url: '/api/cards', name: 'Cards' },
      { url: '/api/reports/filters', name: 'Reports' }
    ];
    
    console.log('🔍 Testing protected endpoints with correct token...\n');
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Testing ${endpoint.name}: ${endpoint.url}`);
        
        const response = await axios.get(`${SERVER_URL}${endpoint.url}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        });
        
        console.log(`✅ ${endpoint.name}: ${response.status} ${response.statusText}`);
        console.log(`   Data: ${JSON.stringify(response.data).substring(0, 150)}...\n`);
        
      } catch (error) {
        if (error.response) {
          console.log(`❌ ${endpoint.name}: ${error.response.status} ${error.response.statusText}`);
          console.log(`   Error: ${error.response.data.message || JSON.stringify(error.response.data)}`);
          
          if (error.response.data.details) {
            console.log(`   Details:`, error.response.data.details);
          }
        } else {
          console.log(`❌ ${endpoint.name}: ${error.message}`);
        }
        console.log();
      }
    }
    
    console.log('🎯 SUMMARY:');
    console.log('- If you see ✅ responses above: RBAC is working correctly!');
    console.log('- If you still see 403 errors: Check server console for "🐛 RBAC DEBUG" messages');
    console.log('- Look for any permission mismatches or SuperAdmin role detection issues');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await pool.end();
  }
}

// Also test SuperAdmin user if available
async function testSuperAdmin() {
  console.log('\n🔥 Testing SuperAdmin access...\n');
  
  try {
    // Look for super admin users
    const [adminUsers] = await pool.query(`
      SELECT u.id, u.username, u.role_id, r.name as role_name, r.level
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE r.name LIKE '%admin%' OR r.level >= 8
      ORDER BY r.level DESC
      LIMIT 3
    `);
    
    if (adminUsers.length === 0) {
      console.log('❌ No admin users found');
      return;
    }
    
    console.log('🔍 Found admin users:');
    adminUsers.forEach(user => {
      console.log(`   - ${user.username} (Role: ${user.role_name}, Level: ${user.level})`);
    });
    
    // Test with the highest level admin
    const superUser = adminUsers[0];
    console.log(`\n🚀 Testing with: ${superUser.username} (${superUser.role_name})`);
    
    const jwtSecret = process.env.JWT_SECRET || 'access_token_secret';
    const adminToken = jwt.sign(
      {
        userId: superUser.id,
        type: 'access'
      },
      jwtSecret,
      { expiresIn: '15m' }
    );
    
    // Test one endpoint with admin token
    try {
      const response = await axios.get(`${SERVER_URL}/api/campaign-types`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });
      
      console.log(`✅ SuperAdmin access: ${response.status} ${response.statusText}`);
      console.log(`   SuperAdmin bypassed all permission checks successfully!`);
      
    } catch (error) {
      if (error.response) {
        console.log(`❌ SuperAdmin blocked: ${error.response.status} ${error.response.statusText}`);
        console.log(`   Error: ${error.response.data.message}`);
        console.log(`   This suggests SuperAdmin detection is not working properly`);
      }
    }
    
  } catch (error) {
    console.error('❌ SuperAdmin test failed:', error.message);
  }
}

// Run tests
testWithCorrectToken().then(() => {
  return testSuperAdmin();
});
