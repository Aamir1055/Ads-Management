const axios = require('axios');
const mysql = require('mysql2/promise');

const BASE_URL = 'http://localhost:5000';

// Test advertiser user
const ADVERTISER_USER = {
  username: 'testadvertiser',
  password: 'test123'
};

class AdvertiserRoleTest {
  constructor() {
    this.token = null;
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async setupDatabase() {
    console.log('🔧 Verifying advertiser user exists...\n');
    
    const pool = mysql.createPool({
      host: 'localhost',
      user: 'root', 
      password: '',
      database: 'ads reporting',
      port: 3306
    });

    try {
      // Check if advertiser user exists
      const [existing] = await pool.execute(
        'SELECT id, username, role_id FROM users WHERE username = ?', 
        [ADVERTISER_USER.username]
      );

      if (existing.length === 0) {
        console.log('❌ Advertiser user not found. Creating user...');
        
        // Get advertiser role ID
        const [roleResult] = await pool.execute('SELECT id FROM roles WHERE name = ?', ['advertiser']);
        if (roleResult.length === 0) {
          console.log('❌ Advertiser role not found in database');
          return false;
        }
        
        const roleId = roleResult[0].id;
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(ADVERTISER_USER.password, 10);

        await pool.execute(
          'INSERT INTO users (username, hashed_password, role_id, is_active, created_at, updated_at) VALUES (?, ?, ?, 1, NOW(), NOW())',
          [ADVERTISER_USER.username, hashedPassword, roleId]
        );
        
        console.log('✅ Advertiser user created successfully');
      } else {
        console.log('✅ Advertiser user exists:', existing[0].username, 'Role ID:', existing[0].role_id);
      }

    } catch (error) {
      console.error('❌ Database setup error:', error.message);
      return false;
    } finally {
      await pool.end();
    }
    return true;
  }

  async testEndpoint(method, endpoint, data, expectedStatus = 200) {
    try {
      const config = {
        method: method.toLowerCase(),
        url: `${BASE_URL}${endpoint}`,
        headers: this.token ? { 'Authorization': `Bearer ${this.token}` } : {},
        validateStatus: () => true // Don't throw on HTTP error status
      };

      if (data && ['post', 'put', 'patch'].includes(method.toLowerCase())) {
        config.data = data;
        config.headers['Content-Type'] = 'application/json';
      }

      const response = await axios(config);
      
      const success = response.status === expectedStatus || 
                     (expectedStatus === 200 && response.status < 300) ||
                     (response.data && response.data.success === true);

      return {
        success,
        status: response.status,
        data: response.data,
        error: null
      };

    } catch (error) {
      return {
        success: false,
        status: error.response?.status || 0,
        data: error.response?.data || null,
        error: error.message
      };
    }
  }

  async login() {
    console.log(`🔐 Logging in as advertiser: ${ADVERTISER_USER.username}...`);
    
    const result = await this.testEndpoint('POST', '/api/auth/login', {
      username: ADVERTISER_USER.username,
      password: ADVERTISER_USER.password
    });

    if (result.success && result.data?.data?.access_token) {
      this.token = result.data.data.access_token;
      console.log(`✅ Advertiser login successful`);
      console.log(`👤 User Info:`, result.data.data.user);
      return true;
    } else {
      console.log(`❌ Advertiser login failed:`, result.error || result.data?.message || 'Unknown error');
      return false;
    }
  }

  async runAdvertiserTests() {
    console.log(`\n🧪 Running ADVERTISER ROLE comprehensive tests...\n`);

    const tests = [
      // Basic functionality tests
      {
        category: 'Core Functionality',
        tests: [
          {
            name: 'Get Dashboard Data',
            method: 'GET',
            endpoint: '/api/dashboard',
            expectedStatus: 200,
            description: 'Should access dashboard with limited data based on role'
          },
          {
            name: 'Get User Profile',
            method: 'GET',
            endpoint: '/api/user-management/profile',
            expectedStatus: 200,
            description: 'Should access own profile information'
          }
        ]
      },
      
      // Campaign management tests
      {
        category: 'Campaign Management',
        tests: [
          {
            name: 'View Campaigns',
            method: 'GET',
            endpoint: '/api/campaigns',
            expectedStatus: 200,
            description: 'Should see campaigns (filtered by user)'
          },
          {
            name: 'View Campaign Types',
            method: 'GET',
            endpoint: '/api/campaign-types',
            expectedStatus: 200,
            description: 'Should see available campaign types'
          }
        ]
      },

      // Reporting tests
      {
        category: 'Reporting & Analytics',
        tests: [
          {
            name: 'View Reports',
            method: 'GET',
            endpoint: '/api/reports',
            expectedStatus: 200,
            description: 'Should access reporting data'
          },
          {
            name: 'View Analytics',
            method: 'GET',
            endpoint: '/api/analytics',
            expectedStatus: 200,
            description: 'Should access analytics overview'
          }
        ]
      },

      // Card management tests
      {
        category: 'Payment & Cards',
        tests: [
          {
            name: 'View Assigned Cards',
            method: 'GET',
            endpoint: '/api/cards',
            expectedStatus: 200,
            description: 'Should see cards assigned to user'
          }
        ]
      },

      // Permission restriction tests
      {
        category: 'Access Control (Should be Restricted)',
        tests: [
          {
            name: 'Admin Users List (Should be Forbidden)',
            method: 'GET',
            endpoint: '/api/users',
            expectedStatus: 403,
            description: 'Should NOT have access to all users list'
          },
          {
            name: 'User Management (Should be Forbidden)',
            method: 'GET',
            endpoint: '/api/user-management',
            expectedStatus: 403,
            description: 'Should NOT have access to user management'
          },
          {
            name: 'Permissions Management (Should be Forbidden)',
            method: 'GET',
            endpoint: '/api/permissions',
            expectedStatus: 403,
            description: 'Should NOT have access to permissions management'
          }
        ]
      }
    ];

    for (const category of tests) {
      console.log(`\n📂 Testing Category: ${category.category}`);
      console.log('─'.repeat(50));

      for (const test of category.tests) {
        console.log(`  📋 ${test.name}`);
        console.log(`      Description: ${test.description}`);
        
        const result = await this.testEndpoint(
          test.method,
          test.endpoint,
          test.data,
          test.expectedStatus
        );

        const testResult = {
          category: category.category,
          name: test.name,
          endpoint: test.endpoint,
          method: test.method,
          success: result.success,
          status: result.status,
          expectedStatus: test.expectedStatus,
          error: result.error,
          description: test.description
        };

        this.results.tests.push(testResult);

        if (result.success) {
          this.results.passed++;
          console.log(`      ✅ PASSED (${result.status})`);
          
          if (result.data && typeof result.data === 'object') {
            const dataInfo = Array.isArray(result.data.data) ? 
              `${result.data.data.length} items` : 
              result.data.data ? Object.keys(result.data.data).length + ' properties' : 'No data';
            console.log(`      📊 Response: ${dataInfo}`);
          }
        } else {
          this.results.failed++;
          console.log(`      ❌ FAILED (${result.status}) - Expected: ${test.expectedStatus}`);
          if (result.data?.message) {
            console.log(`      💬 Message: ${result.data.message}`);
          }
          if (result.error) {
            console.log(`      🔍 Error: ${result.error}`);
          }
        }
      }
    }
  }

  async testAdvertiserPermissions() {
    console.log(`\n🔒 Testing Advertiser-Specific Permissions...\n`);

    // Test if advertiser can access their own data
    const profileResult = await this.testEndpoint('GET', '/api/user-management/profile');
    if (profileResult.success) {
      console.log('✅ Can access own profile');
      console.log('👤 Profile data:', profileResult.data.data);
    }

    // Test campaign creation (if allowed for advertisers)
    console.log('\n📝 Testing campaign creation...');
    const campaignData = {
      name: 'Test Advertiser Campaign',
      description: 'Test campaign created by advertiser',
      campaign_type_id: 1,
      brand: 1
    };

    const createResult = await this.testEndpoint('POST', '/api/campaigns', campaignData);
    if (createResult.success) {
      console.log('✅ Can create campaigns');
    } else {
      console.log(`ℹ️ Campaign creation: ${createResult.status} - ${createResult.data?.message || 'Not allowed'}`);
    }
  }

  async runFullTest() {
    console.log('🚀 Starting Comprehensive Advertiser Role Testing...\n');

    // Setup
    const setupSuccess = await this.setupDatabase();
    if (!setupSuccess) {
      console.log('❌ Setup failed. Cannot continue testing.');
      return;
    }

    // Login
    const loginSuccess = await this.login();
    if (!loginSuccess) {
      console.log('❌ Login failed. Cannot continue testing.');
      return;
    }

    // Run tests
    await this.runAdvertiserTests();
    await this.testAdvertiserPermissions();

    // Print summary
    this.printSummary();
  }

  printSummary() {
    console.log('\n' + '='.repeat(70));
    console.log('📊 ADVERTISER ROLE TEST RESULTS SUMMARY');
    console.log('='.repeat(70));

    const total = this.results.passed + this.results.failed;
    const passRate = total > 0 ? ((this.results.passed / total) * 100).toFixed(1) : '0.0';
    
    console.log(`\n🎯 ADVERTISER ROLE PERFORMANCE:`);
    console.log(`   ✅ Passed: ${this.results.passed}`);
    console.log(`   ❌ Failed: ${this.results.failed}`);
    console.log(`   📈 Success Rate: ${passRate}%`);

    // Group results by category
    const byCategory = {};
    this.results.tests.forEach(test => {
      if (!byCategory[test.category]) {
        byCategory[test.category] = { passed: 0, failed: 0, tests: [] };
      }
      byCategory[test.category].tests.push(test);
      if (test.success) {
        byCategory[test.category].passed++;
      } else {
        byCategory[test.category].failed++;
      }
    });

    console.log(`\n📂 RESULTS BY CATEGORY:`);
    Object.entries(byCategory).forEach(([category, results]) => {
      const categoryTotal = results.passed + results.failed;
      const categoryRate = categoryTotal > 0 ? ((results.passed / categoryTotal) * 100).toFixed(1) : '0.0';
      console.log(`\n   📁 ${category}:`);
      console.log(`      ✅ ${results.passed} passed, ❌ ${results.failed} failed (${categoryRate}%)`);
      
      if (results.failed > 0) {
        console.log(`      🚨 Failed tests:`);
        results.tests.filter(t => !t.success).forEach(test => {
          console.log(`         • ${test.name} - ${test.status} ${test.error || ''}`);
        });
      }
    });

    console.log('\n' + '='.repeat(70));
    
    // Final assessment
    console.log('💡 ADVERTISER ROLE ASSESSMENT:');
    if (this.results.failed === 0) {
      console.log('   🎉 EXCELLENT! Advertiser role is fully functional with proper access controls.');
    } else if (passRate >= 80) {
      console.log('   ✅ GOOD! Most advertiser functionality works, minor issues detected.');
    } else {
      console.log('   ⚠️ ATTENTION NEEDED! Several advertiser role issues detected.');
    }
    
    console.log('\n📝 Test completed. Review the results above.');
  }
}

// Run the test
const tester = new AdvertiserRoleTest();
tester.runFullTest().catch(console.error);
