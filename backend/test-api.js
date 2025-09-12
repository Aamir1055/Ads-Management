const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api/users';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// Test data
const testUsers = [
  {
    username: 'admin_user',
    password: 'Admin@123',
    confirmPassword: 'Admin@123',
    role_id: 1
  },
  {
    username: 'manager_user',
    password: 'Manager@456',
    confirmPassword: 'Manager@456',
    role_id: 2
  },
  {
    username: 'regular_user',
    password: 'User@789',
    confirmPassword: 'User@789',
    role_id: 3
  }
];

let createdUserIds = [];

// Helper function to print test results
function printResult(testName, success, message = '') {
  const status = success ? `${colors.green}✓ PASS${colors.reset}` : `${colors.red}✗ FAIL${colors.reset}`;
  console.log(`${status} - ${testName}`);
  if (message) {
    console.log(`  ${colors.yellow}→${colors.reset} ${message}`);
  }
}

// Test functions
async function testCreateUser() {
  console.log(`\n${colors.blue}=== Testing Create User (POST) ===${colors.reset}`);
  
  for (const userData of testUsers) {
    try {
      const response = await axios.post(API_BASE_URL, userData);
      
      if (response.data.success && response.data.data.id) {
        createdUserIds.push(response.data.data.id);
        printResult(
          `Create user: ${userData.username}`,
          true,
          `User ID: ${response.data.data.id}, QR Code generated: ${response.data.data.qrCode ? 'Yes' : 'No'}`
        );
        
        // Save QR code if needed
        if (response.data.data.qrCode) {
          console.log(`  ${colors.blue}ℹ${colors.reset} QR Code available for 2FA setup`);
        }
      } else {
        printResult(`Create user: ${userData.username}`, false, response.data.message);
      }
    } catch (error) {
      printResult(
        `Create user: ${userData.username}`,
        false,
        error.response?.data?.message || error.message
      );
    }
  }
  
  // Test validation errors
  console.log(`\n${colors.yellow}Testing validation errors:${colors.reset}`);
  
  // Test with invalid password
  try {
    await axios.post(API_BASE_URL, {
      username: 'invalid_pass',
      password: 'weak',
      confirmPassword: 'weak'
    });
    printResult('Reject weak password', false, 'Should have failed');
  } catch (error) {
    printResult('Reject weak password', true, 'Correctly rejected weak password');
  }
  
  // Test with mismatched passwords
  try {
    await axios.post(API_BASE_URL, {
      username: 'mismatch_pass',
      password: 'Strong@123',
      confirmPassword: 'Different@456'
    });
    printResult('Reject mismatched passwords', false, 'Should have failed');
  } catch (error) {
    printResult('Reject mismatched passwords', true, 'Correctly rejected mismatched passwords');
  }
  
  // Test duplicate username
  try {
    await axios.post(API_BASE_URL, testUsers[0]);
    printResult('Reject duplicate username', false, 'Should have failed');
  } catch (error) {
    printResult('Reject duplicate username', true, 'Correctly rejected duplicate username');
  }
}

async function testGetAllUsers() {
  console.log(`\n${colors.blue}=== Testing Get All Users (GET) ===${colors.reset}`);
  
  try {
    // Test without pagination
    const response = await axios.get(API_BASE_URL);
    printResult(
      'Get all users',
      response.data.success,
      `Found ${response.data.data.users.length} users`
    );
    
    // Test with pagination
    const paginatedResponse = await axios.get(`${API_BASE_URL}?page=1&limit=2`);
    printResult(
      'Get users with pagination',
      paginatedResponse.data.success,
      `Page 1 with limit 2: ${paginatedResponse.data.data.users.length} users`
    );
  } catch (error) {
    printResult('Get all users', false, error.response?.data?.message || error.message);
  }
}

async function testGetUserById() {
  console.log(`\n${colors.blue}=== Testing Get User by ID (GET) ===${colors.reset}`);
  
  if (createdUserIds.length === 0) {
    console.log(`${colors.yellow}No users created to test${colors.reset}`);
    return;
  }
  
  // Test valid ID
  try {
    const response = await axios.get(`${API_BASE_URL}/${createdUserIds[0]}`);
    printResult(
      `Get user by ID: ${createdUserIds[0]}`,
      response.data.success,
      `Username: ${response.data.data.username}`
    );
  } catch (error) {
    printResult(
      `Get user by ID: ${createdUserIds[0]}`,
      false,
      error.response?.data?.message || error.message
    );
  }
  
  // Test invalid ID
  try {
    await axios.get(`${API_BASE_URL}/99999`);
    printResult('Get non-existent user', false, 'Should have failed');
  } catch (error) {
    printResult('Get non-existent user', true, 'Correctly returned 404');
  }
}

async function testUpdateUser() {
  console.log(`\n${colors.blue}=== Testing Update User (PUT) ===${colors.reset}`);
  
  if (createdUserIds.length === 0) {
    console.log(`${colors.yellow}No users created to test${colors.reset}`);
    return;
  }
  
  const userId = createdUserIds[0];
  
  // Test username update
  try {
    const response = await axios.put(`${API_BASE_URL}/${userId}`, {
      username: 'updated_admin'
    });
    printResult(
      'Update username',
      response.data.success,
      `New username: ${response.data.data.username}`
    );
  } catch (error) {
    printResult('Update username', false, error.response?.data?.message || error.message);
  }
  
  // Test password update
  try {
    const response = await axios.put(`${API_BASE_URL}/${userId}`, {
      password: 'NewPass@999',
      confirmPassword: 'NewPass@999'
    });
    printResult('Update password', response.data.success, 'Password updated successfully');
  } catch (error) {
    printResult('Update password', false, error.response?.data?.message || error.message);
  }
  
  // Test is_active update
  try {
    const response = await axios.put(`${API_BASE_URL}/${userId}`, {
      is_active: false
    });
    printResult(
      'Update is_active status',
      response.data.success,
      `User active: ${response.data.data.is_active}`
    );
  } catch (error) {
    printResult('Update is_active status', false, error.response?.data?.message || error.message);
  }
}

async function test2FA() {
  console.log(`\n${colors.blue}=== Testing 2FA Features ===${colors.reset}`);
  
  if (createdUserIds.length === 0) {
    console.log(`${colors.yellow}No users created to test${colors.reset}`);
    return;
  }
  
  const userId = createdUserIds[0];
  
  // Test enable 2FA (will fail without valid token from Google Authenticator)
  try {
    await axios.post(`${API_BASE_URL}/${userId}/enable-2fa`, {
      token: '123456' // This will fail as it's not a valid token
    });
    printResult('Enable 2FA', false, 'Should have failed with invalid token');
  } catch (error) {
    printResult(
      'Enable 2FA validation',
      true,
      'Correctly rejected invalid 2FA token'
    );
  }
  
  // Test verify 2FA (will fail as 2FA is not enabled)
  try {
    await axios.post(`${API_BASE_URL}/verify-2fa`, {
      username: 'updated_admin',
      token: '123456'
    });
    printResult('Verify 2FA', false, 'Should have failed');
  } catch (error) {
    printResult(
      'Verify 2FA validation',
      true,
      '2FA not enabled for user - correctly rejected'
    );
  }
}

async function testDeleteUser() {
  console.log(`\n${colors.blue}=== Testing Delete User (DELETE) ===${colors.reset}`);
  
  if (createdUserIds.length === 0) {
    console.log(`${colors.yellow}No users created to test${colors.reset}`);
    return;
  }
  
  // Delete all created test users
  for (const userId of createdUserIds) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/${userId}`);
      printResult(`Delete user ID: ${userId}`, response.data.success, 'User deleted');
    } catch (error) {
      printResult(
        `Delete user ID: ${userId}`,
        false,
        error.response?.data?.message || error.message
      );
    }
  }
  
  // Test delete non-existent user
  try {
    await axios.delete(`${API_BASE_URL}/99999`);
    printResult('Delete non-existent user', false, 'Should have failed');
  } catch (error) {
    printResult('Delete non-existent user', true, 'Correctly returned 404');
  }
}

// Main test runner
async function runAllTests() {
  console.log(`${colors.blue}${'='.repeat(50)}${colors.reset}`);
  console.log(`${colors.blue}Starting User API Tests${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(50)}${colors.reset}`);
  console.log(`API Base URL: ${API_BASE_URL}`);
  
  try {
    // Check if server is running
    await axios.get('http://localhost:5000/api/health');
    console.log(`${colors.green}✓ Server is running${colors.reset}`);
  } catch (error) {
    console.log(`${colors.red}✗ Server is not running. Please start the backend server first.${colors.reset}`);
    process.exit(1);
  }
  
  // Run tests in sequence
  await testCreateUser();
  await testGetAllUsers();
  await testGetUserById();
  await testUpdateUser();
  await test2FA();
  await testDeleteUser();
  
  console.log(`\n${colors.blue}${'='.repeat(50)}${colors.reset}`);
  console.log(`${colors.green}All tests completed!${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(50)}${colors.reset}`);
}

// Run tests
runAllTests().catch(error => {
  console.error(`${colors.red}Test suite failed:${colors.reset}`, error.message);
  process.exit(1);
});
