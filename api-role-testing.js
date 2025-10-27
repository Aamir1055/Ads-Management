const axios = require('axios');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const BASE_URL = 'http://localhost:5000';

// Test credentials - using existing users and will create advertiser if needed
const TEST_USERS = {
  admin: {
    username: 'admin',
    password: 'password', // Found from test-login-passwords.js
    role: 'admin'
  },
  advertiser: {
    username: 'testadvertiser',  
    password: 'test123',
    role: 'advertiser'
  }
};

class APITester {
  constructor() {
    this.results = {
      admin: { passed: 0, failed: 0, tests: [] },
      advertiser: { passed: 0, failed: 0, tests: [] }
    };
  }

  async setupDatabase() {
    console.log('🔧 Setting up database and test users...\n');
    
    const pool = mysql.createPool({
      host: 'localhost',
      user: 'root', 
      password: '',
      database: 'ads reporting',
      port: 3306
    });

    try {
      // Ensure advertiser role exists
      await pool.execute(`
        INSERT IGNORE INTO roles (name, display_name, description, level, is_active, created_at, updated_at)
        VALUES ('advertiser', 'Advertiser', 'Advertiser with limited access', 10, 1, NOW(), NOW())
      `);

      // Check if advertiser user exists, create if not
      const [existing] = await pool.execute(
        'SELECT id FROM users WHERE username = ?', 
        [TEST_USERS.advertiser.username]
      );

      if (existing.length === 0) {
        const hashedPassword = await bcrypt.hash(TEST_USERS.advertiser.password, 10);
        const [roleResult] = await pool.execute('SELECT id FROM roles WHERE name = ?', ['advertiser']);
        const roleId = roleResult[0]?.id || 2;

        // Check what columns exist in users table
        const [columns] = await pool.execute('DESCRIBE users');
        const columnNames = columns.map(col => col.Field);
        
        let insertSQL, insertValues;
        if (columnNames.includes('email')) {
          insertSQL = `INSERT INTO users (username, email, hashed_password, role_id, is_active, is_2fa_enabled, created_at, updated_at) VALUES (?, ?, ?, ?, 1, 0, NOW(), NOW())`;
          insertValues = [TEST_USERS.advertiser.username, 'testadvertiser@test.com', hashedPassword, roleId];
        } else {
          insertSQL = `INSERT INTO users (username, hashed_password, role_id, is_active, is_2fa_enabled, created_at, updated_at) VALUES (?, ?, ?, 1, 0, NOW(), NOW())`;
          insertValues = [TEST_USERS.advertiser.username, hashedPassword, roleId];
        }

        await pool.execute(insertSQL, insertValues);
        console.log('✅ Created advertiser test user');
      } else {
        console.log('✅ Advertiser test user already exists');
      }

    } catch (error) {
      console.error('❌ Database setup error:', error.message);
    } finally {
      await pool.end();
    }
  }

  async testEndpoint(method, endpoint, data, token, expectedStatus = 200) {
    try {
      const config = {
        method: method.toLowerCase(),
        url: `${BASE_URL}${endpoint}`,
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
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

  async login(username, password) {
    console.log(`🔐 Attempting login for ${username}...`);
    
    const result = await this.testEndpoint('POST', '/api/auth/login', {
      username,
      password
    });

    // Check for both token formats that might be returned
    const token = result.data?.token || result.data?.data?.access_token;
    
    if (result.success && token) {
      console.log(`✅ Login successful for ${username}`);
      return token;
    } else {
      console.log(`❌ Login failed for ${username}: ${result.error || result.data?.message || 'Unknown error'}`);
      
      // For admin, try common passwords from your test scripts
      const altPasswords = username === 'admin' ? 
        ['admin123', 'password123', 'admin', 'test123', 'Password123', 'Admin123', '123456', 'admin@123'] :
        ['test123', 'password123', 'admin123', 'advertiser123', 'password'];
      
      for (const altPassword of altPasswords) {
        if (altPassword === password) continue;
        
        console.log(`🔄 Trying alternative password: ${altPassword}`);
        const altResult = await this.testEndpoint('POST', '/api/auth/login', {
          username,
          password: altPassword
        });
        
        const altToken = altResult.data?.token || altResult.data?.data?.access_token;
        if (altResult.success && altToken) {
          console.log(`✅ Login successful with alternative password: ${altPassword}`);
          TEST_USERS[username === 'admin' ? 'admin' : 'advertiser'].password = altPassword;
          return altToken;
        }
      }
      
      console.log(`❌ All password attempts failed for ${username}`);
      return null;
    }
  }

  async runTestSuite(role, token) {
    console.log(`\n🧪 Running ${role.toUpperCase()} test suite...\n`);

    const tests = [
      {
        name: 'Get Dashboard Data',
        method: 'GET', 
        endpoint: '/api/dashboard',
        expectedStatus: 200
      },
      {
        name: 'Get User Profile',
        method: 'GET',
        endpoint: '/api/user-management/profile',
        expectedStatus: 200
      },
      {
        name: 'Get Campaigns',
        method: 'GET',
        endpoint: '/api/campaigns',
        expectedStatus: 200
      },
      {
        name: 'Get Reports',
        method: 'GET',
        endpoint: '/api/reports',
        expectedStatus: 200
      },
      {
        name: 'Get Analytics',
        method: 'GET',
        endpoint: '/api/analytics',
        expectedStatus: 200
      },
      {
        name: 'Get Campaign Types',
        method: 'GET',
        endpoint: '/api/campaign-types',
        expectedStatus: 200
      },
      {
        name: 'Get Cards (User Dashboard Cards)',
        method: 'GET', 
        endpoint: '/api/cards',
        expectedStatus: 200
      }
    ];

    // Add admin-specific tests
    if (role === 'admin') {
      tests.push(
        {
          name: 'Get All Users (Admin Only)',
          method: 'GET',
          endpoint: '/api/users',
          expectedStatus: 200
        },
        {
          name: 'Get User Management (Admin Only)', 
          method: 'GET',
          endpoint: '/api/user-management',
          expectedStatus: 200
        },
        {
          name: 'Get Permissions (Admin Only)',
          method: 'GET',
          endpoint: '/api/permissions',
          expectedStatus: 200
        }
      );
    }

    for (const test of tests) {
      console.log(`  📋 Testing: ${test.name}`);
      
      const result = await this.testEndpoint(
        test.method,
        test.endpoint,
        test.data,
        token,
        test.expectedStatus
      );

      const testResult = {
        name: test.name,
        endpoint: test.endpoint,
        method: test.method,
        success: result.success,
        status: result.status,
        error: result.error
      };

      this.results[role].tests.push(testResult);

      if (result.success) {
        this.results[role].passed++;
        console.log(`    ✅ PASSED (${result.status})`);
        if (result.data && typeof result.data === 'object') {
          const dataInfo = Array.isArray(result.data) ? 
            `${result.data.length} items` : 
            Object.keys(result.data).length + ' properties';
          console.log(`    📊 Response: ${dataInfo}`);
        }
      } else {
        this.results[role].failed++;
        console.log(`    ❌ FAILED (${result.status}) - ${result.error || 'Unknown error'}`);
        if (result.data?.message) {
          console.log(`    💬 Message: ${result.data.message}`);
        }
      }
    }
  }

  async runAllTests() {
    console.log('🚀 Starting comprehensive API role testing...\n');

    // Setup database first
    await this.setupDatabase();

    // Test admin role
    const adminToken = await this.login(TEST_USERS.admin.username, TEST_USERS.admin.password);
    if (adminToken) {
      await this.runTestSuite('admin', adminToken);
    } else {
      console.log('❌ Could not get admin token, skipping admin tests');
      this.results.admin.failed = 999;
    }

    // Test advertiser role  
    const advertiserToken = await this.login(TEST_USERS.advertiser.username, TEST_USERS.advertiser.password);
    if (advertiserToken) {
      await this.runTestSuite('advertiser', advertiserToken);
    } else {
      console.log('❌ Could not get advertiser token, skipping advertiser tests');
      this.results.advertiser.failed = 999;
    }

    // Print summary
    this.printSummary();
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));

    for (const [role, results] of Object.entries(this.results)) {
      const total = results.passed + results.failed;
      const passRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : '0.0';
      
      console.log(`\n🔐 ${role.toUpperCase()} ROLE:`);
      console.log(`   ✅ Passed: ${results.passed}`);
      console.log(`   ❌ Failed: ${results.failed}`);
      console.log(`   📈 Success Rate: ${passRate}%`);

      if (results.failed > 0) {
        console.log(`   🚨 Failed Tests:`);
        results.tests.filter(t => !t.success).forEach(test => {
          console.log(`     • ${test.name} - ${test.status} ${test.error || ''}`);
        });
      }
    }

    console.log('\n' + '='.repeat(60));
    
    // Recommendations
    console.log('💡 RECOMMENDATIONS:');
    if (this.results.admin.failed > 0 || this.results.advertiser.failed > 0) {
      console.log('   • Check server is running on port 5000');
      console.log('   • Verify database connection and permissions');
      console.log('   • Review user roles and authentication setup');
      console.log('   • Check API endpoints are properly configured');
    } else {
      console.log('   • All tests passed! Your API is working correctly.');
    }
    
    console.log('\n📝 Test completed. Review the results above.');
  }
}

// Run the tests
const tester = new APITester();
tester.runAllTests().catch(console.error);
