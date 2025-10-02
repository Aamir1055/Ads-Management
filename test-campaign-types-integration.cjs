#!/usr/bin/env node

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000/api';
const CREDENTIALS = { username: 'admin', password: 'password' };

let authToken = null;
let createdCampaignTypeId = null;

console.log('🚀 Campaign Types Frontend-Backend Integration Test');
console.log('=' .repeat(60));

/**
 * Test authentication and get token
 */
async function testAuthentication() {
  console.log('\n1. Testing Authentication...');
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, CREDENTIALS);
    
    if (response.data.success && response.data.data.access_token) {
      authToken = response.data.data.access_token;
      console.log('✅ Authentication successful');
      console.log(`   Token: ${authToken.substring(0, 20)}...`);
      return true;
    } else {
      console.log('❌ Authentication failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ Authentication error:', error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * Test GET /api/campaign-types (frontend-style call)
 */
async function testGetCampaignTypes() {
  console.log('\n2. Testing GET /api/campaign-types (frontend parameters)...');
  try {
    const params = {
      page: 1,
      limit: 10,
      status: 'active'
    };
    
    const response = await axios.get(`${BASE_URL}/campaign-types`, {
      params,
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success) {
      console.log('✅ GET campaign types successful');
      console.log(`   Found: ${response.data.data.length} campaign types`);
      console.log(`   Total: ${response.data.meta.pagination.totalCount}`);
      console.log(`   Page: ${response.data.meta.pagination.currentPage} of ${response.data.meta.pagination.totalPages}`);
      
      // Verify structure matches frontend expectations
      if (response.data.data.length > 0) {
        const firstItem = response.data.data[0];
        console.log('   First item structure:');
        console.log(`     - id: ${firstItem.id}`);
        console.log(`     - type_name: ${firstItem.type_name}`);
        console.log(`     - description: ${firstItem.description || '(empty)'}`);
        console.log(`     - is_active: ${firstItem.is_active} (${typeof firstItem.is_active})`);
        console.log(`     - created_at: ${firstItem.created_at}`);
        
        // Verify boolean handling
        if (firstItem.is_active === 1 || firstItem.is_active === true) {
          console.log('   ✅ Boolean field handling correct');
        } else {
          console.log('   ⚠️  Boolean field might need frontend adjustment');
        }
      }
      return true;
    } else {
      console.log('❌ GET failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ GET error:', error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * Test POST /api/campaign-types (create - frontend-style call)
 */
async function testCreateCampaignType() {
  console.log('\n3. Testing POST /api/campaign-types (create)...');
  try {
    const testData = {
      type_name: `Frontend Test ${Date.now()}`,
      description: 'Created by frontend integration test',
      is_active: true
    };
    
    const response = await axios.post(`${BASE_URL}/campaign-types`, testData, {
      headers: { 
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success) {
      createdCampaignTypeId = response.data.data.id;
      console.log('✅ CREATE campaign type successful');
      console.log(`   Created ID: ${createdCampaignTypeId}`);
      console.log(`   Name: ${response.data.data.type_name}`);
      console.log(`   Active: ${response.data.data.is_active}`);
      return true;
    } else {
      console.log('❌ CREATE failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ CREATE error:', error.response?.data?.message || error.message);
    if (error.response?.data?.errors) {
      console.log('   Validation errors:', error.response.data.errors);
    }
    return false;
  }
}

/**
 * Test GET /api/campaign-types/:id (get by ID)
 */
async function testGetCampaignTypeById() {
  if (!createdCampaignTypeId) {
    console.log('\n4. Skipping GET by ID (no created item)');
    return false;
  }
  
  console.log('\n4. Testing GET /api/campaign-types/:id...');
  try {
    const response = await axios.get(`${BASE_URL}/campaign-types/${createdCampaignTypeId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success) {
      console.log('✅ GET by ID successful');
      console.log(`   Retrieved: ${response.data.data.type_name}`);
      return true;
    } else {
      console.log('❌ GET by ID failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ GET by ID error:', error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * Test PUT /api/campaign-types/:id (update)
 */
async function testUpdateCampaignType() {
  if (!createdCampaignTypeId) {
    console.log('\n5. Skipping UPDATE (no created item)');
    return false;
  }
  
  console.log('\n5. Testing PUT /api/campaign-types/:id (update)...');
  try {
    const updateData = {
      type_name: `Updated Frontend Test ${Date.now()}`,
      description: 'Updated by frontend integration test',
      is_active: false
    };
    
    const response = await axios.put(`${BASE_URL}/campaign-types/${createdCampaignTypeId}`, updateData, {
      headers: { 
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success) {
      console.log('✅ UPDATE successful');
      console.log(`   Updated name: ${response.data.data.type_name}`);
      console.log(`   Updated active: ${response.data.data.is_active}`);
      return true;
    } else {
      console.log('❌ UPDATE failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ UPDATE error:', error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * Test validation (frontend-style validation)
 */
async function testValidation() {
  console.log('\n6. Testing Validation (empty type_name)...');
  try {
    const invalidData = {
      type_name: '',
      description: 'This should fail validation'
    };
    
    const response = await axios.post(`${BASE_URL}/campaign-types`, invalidData, {
      headers: { 
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('❌ Validation test failed - should have rejected empty type_name');
    return false;
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Validation working correctly - rejected empty type_name');
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Message: ${error.response.data.message}`);
      return true;
    } else {
      console.log('❌ Unexpected validation error:', error.response?.data?.message || error.message);
      return false;
    }
  }
}

/**
 * Test DELETE /api/campaign-types/:id (cleanup)
 */
async function testDeleteCampaignType() {
  if (!createdCampaignTypeId) {
    console.log('\n7. Skipping DELETE (no created item)');
    return false;
  }
  
  console.log('\n7. Testing DELETE /api/campaign-types/:id (cleanup)...');
  try {
    const response = await axios.delete(`${BASE_URL}/campaign-types/${createdCampaignTypeId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data.success) {
      console.log('✅ DELETE successful');
      console.log(`   Message: ${response.data.message}`);
      return true;
    } else {
      console.log('❌ DELETE failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.log('❌ DELETE error:', error.response?.data?.message || error.message);
    return false;
  }
}

/**
 * Main test runner
 */
async function runTests() {
  const results = [];
  
  // Run all tests
  results.push(await testAuthentication());
  results.push(await testGetCampaignTypes());
  results.push(await testCreateCampaignType());
  results.push(await testGetCampaignTypeById());
  results.push(await testUpdateCampaignType());
  results.push(await testValidation());
  results.push(await testDeleteCampaignType());
  
  // Summary
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passed}/${total} tests`);
  console.log(`${passed === total ? '🎉' : '⚠️ '} Frontend-Backend Integration: ${passed === total ? 'FULLY COMPATIBLE' : 'NEEDS ATTENTION'}`);
  
  if (passed === total) {
    console.log('\n🎯 All tests passed! The frontend is fully compatible with the backend API.');
    console.log('🚀 The Campaign Types module is ready for production use.');
  } else {
    console.log('\n🔧 Some tests failed. Please review the errors above.');
  }
  
  process.exit(passed === total ? 0 : 1);
}

// Run the tests
runTests().catch(error => {
  console.error('\n💥 Test runner error:', error.message);
  process.exit(1);
});
