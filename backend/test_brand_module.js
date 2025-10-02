require('dotenv').config();
const mysql = require('mysql2/promise');
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test credentials
const TEST_USER = {
  username: 'admin',
  password: 'password'
};

class BrandModuleTester {
  constructor() {
    this.token = null;
    this.connection = null;
  }

  async initialize() {
    // Database connection
    this.connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'ads reporting',
      port: process.env.DB_PORT || 3306
    });

    console.log('🔗 Database connection established');
  }

  async login() {
    try {
      const response = await axios.post(`${BASE_URL}/auth/login`, TEST_USER);
      if (response.data.success) {
        this.token = response.data.data.access_token;
        console.log('✅ Login successful');
        return true;
      }
    } catch (error) {
      console.error('❌ Login failed:', error.response?.data?.message || error.message);
      return false;
    }
  }

  async testDatabaseStructure() {
    console.log('\n🏗️ Testing Database Structure...');
    
    try {
      // Check if brands table exists
      const [tables] = await this.connection.execute("SHOW TABLES LIKE 'brands'");
      if (tables.length === 0) {
        console.error('❌ Brands table does not exist');
        return false;
      }
      console.log('✅ Brands table exists');

      // Check table structure
      const [structure] = await this.connection.execute('DESCRIBE brands');
      console.log('📋 Table structure:');
      structure.forEach(col => {
        console.log(`   ${col.Field} (${col.Type}) - ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Key ? '[' + col.Key + ']' : ''}`);
      });

      // Check current data
      const [count] = await this.connection.execute('SELECT COUNT(*) as total FROM brands');
      console.log(`📊 Total brands in database: ${count[0].total}`);

      return true;
    } catch (error) {
      console.error('❌ Database structure test failed:', error.message);
      return false;
    }
  }

  async testApiEndpoints() {
    console.log('\n🌐 Testing API Endpoints...');
    
    const headers = {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };

    const tests = [
      {
        name: 'GET /api/brands',
        method: 'GET',
        url: `${BASE_URL}/brands`,
        expectedStatus: 200
      },
      {
        name: 'GET /api/brands/active',
        method: 'GET', 
        url: `${BASE_URL}/brands/active`,
        expectedStatus: 200
      },
      {
        name: 'POST /api/brands (create)',
        method: 'POST',
        url: `${BASE_URL}/brands`,
        data: {
          name: 'Test Brand ' + Date.now(),
          description: 'Test brand description',
          is_active: true
        },
        expectedStatus: 201
      }
    ];

    for (const test of tests) {
      try {
        console.log(`\n🧪 Testing ${test.name}...`);
        
        const config = {
          method: test.method,
          url: test.url,
          headers,
          ...(test.data && { data: test.data })
        };

        const response = await axios(config);
        
        if (response.status === test.expectedStatus) {
          console.log(`✅ ${test.name} - Status: ${response.status}`);
          
          if (response.data.success) {
            console.log(`   📋 Success: ${response.data.message}`);
            if (response.data.data) {
              const dataType = Array.isArray(response.data.data) ? 'array' : 'object';
              const dataLength = Array.isArray(response.data.data) ? response.data.data.length : 1;
              console.log(`   📊 Data: ${dataType} with ${dataLength} item(s)`);
              
              // Store created brand ID for further tests
              if (test.name.includes('create') && response.data.data.id) {
                this.createdBrandId = response.data.data.id;
                console.log(`   💾 Created brand ID: ${this.createdBrandId}`);
              }
            }
          } else {
            console.log(`⚠️ ${test.name} - API returned success: false`);
          }
        } else {
          console.log(`❌ ${test.name} - Unexpected status: ${response.status}`);
        }
        
      } catch (error) {
        console.error(`❌ ${test.name} failed:`);
        console.error(`   Status: ${error.response?.status || 'N/A'}`);
        console.error(`   Message: ${error.response?.data?.message || error.message}`);
        
        if (error.response?.data?.errors) {
          console.error(`   Errors:`, error.response.data.errors);
        }
      }
    }

    // Test additional operations if we created a brand
    if (this.createdBrandId) {
      await this.testBrandOperations();
    }
  }

  async testBrandOperations() {
    console.log('\n🔧 Testing Brand Operations...');
    
    const headers = {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };

    // Test GET by ID
    try {
      console.log(`🧪 Testing GET /api/brands/${this.createdBrandId}...`);
      const response = await axios.get(`${BASE_URL}/brands/${this.createdBrandId}`, { headers });
      
      if (response.data.success) {
        console.log('✅ GET brand by ID - Success');
        console.log(`   📋 Brand: ${response.data.data.name}`);
      } else {
        console.log('❌ GET brand by ID - Failed');
      }
    } catch (error) {
      console.error('❌ GET brand by ID failed:', error.response?.data?.message || error.message);
    }

    // Test UPDATE
    try {
      console.log(`🧪 Testing PUT /api/brands/${this.createdBrandId}...`);
      const updateData = {
        name: 'Updated Test Brand ' + Date.now(),
        description: 'Updated description',
        is_active: true
      };
      
      const response = await axios.put(`${BASE_URL}/brands/${this.createdBrandId}`, updateData, { headers });
      
      if (response.data.success) {
        console.log('✅ UPDATE brand - Success');
        console.log(`   📋 Updated name: ${response.data.data.name}`);
      } else {
        console.log('❌ UPDATE brand - Failed');
      }
    } catch (error) {
      console.error('❌ UPDATE brand failed:', error.response?.data?.message || error.message);
    }

    // Test DELETE
    try {
      console.log(`🧪 Testing DELETE /api/brands/${this.createdBrandId}...`);
      const response = await axios.delete(`${BASE_URL}/brands/${this.createdBrandId}`, { headers });
      
      if (response.data.success) {
        console.log('✅ DELETE brand - Success');
      } else {
        console.log('❌ DELETE brand - Failed');
      }
    } catch (error) {
      console.error('❌ DELETE brand failed:', error.response?.data?.message || error.message);
    }
  }

  async testEdgeCases() {
    console.log('\n🎯 Testing Edge Cases...');
    
    const headers = {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };

    // Test invalid brand ID
    try {
      console.log('🧪 Testing invalid brand ID...');
      await axios.get(`${BASE_URL}/brands/999999`, { headers });
      console.log('❌ Should have failed for invalid ID');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Correctly handles invalid brand ID');
      } else {
        console.log('⚠️ Unexpected error for invalid ID:', error.response?.status);
      }
    }

    // Test empty name
    try {
      console.log('🧪 Testing empty brand name...');
      await axios.post(`${BASE_URL}/brands`, { name: '', description: 'test' }, { headers });
      console.log('❌ Should have failed for empty name');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Correctly validates empty brand name');
      } else {
        console.log('⚠️ Unexpected error for empty name:', error.response?.status);
      }
    }

    // Test duplicate name (if possible)
    try {
      console.log('🧪 Testing duplicate brand name...');
      const dupName = 'Duplicate Test Brand';
      
      // Create first brand
      await axios.post(`${BASE_URL}/brands`, { name: dupName, description: 'first' }, { headers });
      
      // Try to create second with same name
      await axios.post(`${BASE_URL}/brands`, { name: dupName, description: 'second' }, { headers });
      console.log('❌ Should have failed for duplicate name');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('✅ Correctly handles duplicate brand name');
      } else {
        console.log('⚠️ Unexpected error for duplicate name:', error.response?.status);
      }
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Brand Module Tests...\n');
    
    try {
      await this.initialize();
      
      if (!(await this.login())) {
        console.error('❌ Cannot proceed without authentication');
        return;
      }

      await this.testDatabaseStructure();
      await this.testApiEndpoints();
      await this.testEdgeCases();

      console.log('\n🎉 Brand module testing completed!');
      
    } catch (error) {
      console.error('💥 Test suite failed:', error.message);
    } finally {
      if (this.connection) {
        await this.connection.end();
        console.log('🔌 Database connection closed');
      }
    }
  }
}

// Run tests
const tester = new BrandModuleTester();
tester.runAllTests().catch(console.error);
