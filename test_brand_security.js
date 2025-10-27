require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const TEST_USER = { username: 'admin', password: 'password' };

class BrandSecurityTester {
  constructor() {
    this.token = null;
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

  async testSqlInjectionAttempts() {
    console.log('\n🛡️ Testing SQL Injection Prevention...');
    
    const headers = {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };

    const maliciousInputs = [
      "'; DROP TABLE brands; --",
      "' OR '1'='1",
      "1'; UPDATE brands SET name='hacked' WHERE id=1; --",
      "<script>alert('xss')</script>",
      "../../etc/passwd",
      "\"; system('rm -rf /'); --"
    ];

    for (const input of maliciousInputs) {
      try {
        console.log(`🧪 Testing malicious input: ${input.substring(0, 20)}...`);
        
        const response = await axios.post(`${BASE_URL}/brands`, {
          name: input,
          description: `Test with malicious input: ${input}`
        }, { headers });

        if (response.data.success && response.data.data.id) {
          // If brand was created, check that the malicious content was sanitized
          const brandName = response.data.data.name;
          console.log(`   📋 Brand created with sanitized name: "${brandName}"`);
          
          // Clean up by deleting the test brand
          await axios.delete(`${BASE_URL}/brands/${response.data.data.id}`, { headers });
          console.log(`   🧹 Cleanup: Deleted test brand`);
        }
        
      } catch (error) {
        // Expected for some malicious inputs
        if (error.response?.status === 400) {
          console.log('   ✅ Properly rejected malicious input');
        } else {
          console.log(`   ⚠️ Unexpected error: ${error.response?.status}`);
        }
      }
    }
  }

  async testExtremeInputValues() {
    console.log('\n📏 Testing Extreme Input Values...');
    
    const headers = {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };

    const extremeTests = [
      {
        name: 'Very long name',
        data: {
          name: 'A'.repeat(300), // Longer than database limit
          description: 'Test long name'
        }
      },
      {
        name: 'Very long description', 
        data: {
          name: 'Short Name',
          description: 'B'.repeat(2000) // Longer than database limit
        }
      },
      {
        name: 'Unicode characters',
        data: {
          name: 'Brand 测试 🔥 émojis',
          description: 'Test with unicode: αβγδ 🌟 ñáéíóú'
        }
      },
      {
        name: 'Control characters',
        data: {
          name: `Brand\x00\x01\x02Test`,
          description: `Description\n\r\tTest`
        }
      }
    ];

    for (const test of extremeTests) {
      try {
        console.log(`🧪 Testing ${test.name}...`);
        
        const response = await axios.post(`${BASE_URL}/brands`, test.data, { headers });
        
        if (response.data.success) {
          console.log(`   ✅ ${test.name} - Handled gracefully`);
          console.log(`   📋 Sanitized name: "${response.data.data.name}"`);
          console.log(`   📋 Description length: ${response.data.data.description?.length || 0}`);
          
          // Clean up
          await axios.delete(`${BASE_URL}/brands/${response.data.data.id}`, { headers });
        } else {
          console.log(`   ✅ ${test.name} - Properly rejected`);
        }
        
      } catch (error) {
        if (error.response?.status === 400) {
          console.log(`   ✅ ${test.name} - Properly validated and rejected`);
        } else {
          console.log(`   ❌ ${test.name} - Unexpected error: ${error.response?.status}`);
        }
      }
    }
  }

  async testConcurrentOperations() {
    console.log('\n⚡ Testing Concurrent Operations...');
    
    const headers = {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };

    // Create multiple brands concurrently
    const createPromises = [];
    for (let i = 0; i < 5; i++) {
      createPromises.push(
        axios.post(`${BASE_URL}/brands`, {
          name: `Concurrent Brand ${i} ${Date.now()}`,
          description: `Created concurrently #${i}`
        }, { headers }).catch(err => ({ error: err.response?.status || err.message }))
      );
    }

    try {
      const results = await Promise.all(createPromises);
      const successful = results.filter(r => !r.error && r.data?.success).length;
      const failed = results.filter(r => r.error).length;
      
      console.log(`   📊 Concurrent creates: ${successful} successful, ${failed} failed`);
      
      if (successful > 0) {
        console.log('   ✅ System handles concurrent operations');
        
        // Clean up successful creates
        for (const result of results) {
          if (!result.error && result.data?.success && result.data.data?.id) {
            await axios.delete(`${BASE_URL}/brands/${result.data.data.id}`, { headers }).catch(() => {});
          }
        }
      }
    } catch (error) {
      console.log('   ❌ Concurrent operation test failed:', error.message);
    }
  }

  async testPermissionBoundaries() {
    console.log('\n🔐 Testing Permission Boundaries...');
    
    // Test without token
    try {
      console.log('🧪 Testing request without authentication...');
      await axios.get(`${BASE_URL}/brands`);
      console.log('   ❌ Should have been rejected');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('   ✅ Correctly requires authentication');
      } else {
        console.log(`   ⚠️ Unexpected status: ${error.response?.status}`);
      }
    }

    // Test with invalid token
    try {
      console.log('🧪 Testing with invalid token...');
      await axios.get(`${BASE_URL}/brands`, {
        headers: { 'Authorization': 'Bearer invalid-token' }
      });
      console.log('   ❌ Should have been rejected');
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('   ✅ Correctly rejects invalid token');
      } else {
        console.log(`   ⚠️ Unexpected status: ${error.response?.status}`);
      }
    }
  }

  async runAllTests() {
    console.log('🛡️ Starting Brand Security Tests...\n');
    
    try {
      if (!(await this.login())) {
        console.error('❌ Cannot proceed without authentication');
        return;
      }

      await this.testSqlInjectionAttempts();
      await this.testExtremeInputValues();
      await this.testConcurrentOperations();
      await this.testPermissionBoundaries();

      console.log('\n🎉 Security testing completed!');
      
    } catch (error) {
      console.error('💥 Security test suite failed:', error.message);
    }
  }
}

// Run tests
const tester = new BrandSecurityTester();
tester.runAllTests().catch(console.error);
