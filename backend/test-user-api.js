/**
 * Simple test script for User Management API endpoints
 * Run with: node test-user-api.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/users';

// Test data
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  display_name: 'Test User',
  password: 'TestPass123!',
  confirm_password: 'TestPass123!',
  role_id: 3, // User role
  enable_2fa: false
};

const testUser2FA = {
  username: 'test2fa',
  email: 'test2fa@example.com',
  display_name: 'Test 2FA User',
  password: 'Test2FA123!',
  confirm_password: 'Test2FA123!',
  role_id: 2, // Manager role
  enable_2fa: true
};

class UserAPITester {
  constructor() {
    this.createdUserIds = [];
  }

  async log(message, data = null) {
    console.log(`\n✅ ${message}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  async logError(message, error) {
    console.error(`\n❌ ${message}`);
    if (error.response?.data) {
      console.error(JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  }

  async testGetRoles() {
    try {
      const response = await axios.get(`${BASE_URL}/roles`);
      await this.log('GET /api/users/roles - Get all roles', response.data);
      return response.data;
    } catch (error) {
      await this.logError('Failed to get roles', error);
      throw error;
    }
  }

  async testCheckUsernameAvailability() {
    try {
      const response = await axios.get(`${BASE_URL}/check/username/testuser`);
      await this.log('GET /api/users/check/username/:username - Check username availability', response.data);
      return response.data;
    } catch (error) {
      await this.logError('Failed to check username availability', error);
      throw error;
    }
  }

  async testCreateUser(userData) {
    try {
      const response = await axios.post(BASE_URL, userData);
      await this.log(`POST /api/users - Create user: ${userData.username}`, response.data);
      
      const userId = response.data.data?.user?.id;
      if (userId) {
        this.createdUserIds.push(userId);
      }
      
      return response.data;
    } catch (error) {
      await this.logError(`Failed to create user: ${userData.username}`, error);
      throw error;
    }
  }

  async testGetAllUsers() {
    try {
      const response = await axios.get(`${BASE_URL}?page=1&limit=10`);
      await this.log('GET /api/users - Get all users with pagination', response.data);
      return response.data;
    } catch (error) {
      await this.logError('Failed to get all users', error);
      throw error;
    }
  }

  async testGetUserById(userId) {
    try {
      const response = await axios.get(`${BASE_URL}/${userId}`);
      await this.log(`GET /api/users/${userId} - Get user by ID`, response.data);
      return response.data;
    } catch (error) {
      await this.logError(`Failed to get user by ID: ${userId}`, error);
      throw error;
    }
  }

  async testUpdateUser(userId) {
    try {
      const updateData = {
        username: 'updateduser',
        role_id: 2
      };
      
      const response = await axios.put(`${BASE_URL}/${userId}`, updateData);
      await this.log(`PUT /api/users/${userId} - Update user`, response.data);
      return response.data;
    } catch (error) {
      await this.logError(`Failed to update user: ${userId}`, error);
      throw error;
    }
  }

  async testToggleUserStatus(userId) {
    try {
      const response = await axios.patch(`${BASE_URL}/${userId}/toggle-status`);
      await this.log(`PATCH /api/users/${userId}/toggle-status - Toggle user status`, response.data);
      return response.data;
    } catch (error) {
      await this.logError(`Failed to toggle user status: ${userId}`, error);
      throw error;
    }
  }

  async testEnable2FA(userId) {
    try {
      const response = await axios.post(`${BASE_URL}/${userId}/enable-2fa`);
      await this.log(`POST /api/users/${userId}/enable-2fa - Enable 2FA`, {
        ...response.data,
        data: response.data.data ? { ...response.data.data, qrCode: '[QR_CODE_TRUNCATED]' } : null
      });
      return response.data;
    } catch (error) {
      await this.logError(`Failed to enable 2FA for user: ${userId}`, error);
      throw error;
    }
  }

  async testDisable2FA(userId) {
    try {
      const response = await axios.post(`${BASE_URL}/${userId}/disable-2fa`);
      await this.log(`POST /api/users/${userId}/disable-2fa - Disable 2FA`, response.data);
      return response.data;
    } catch (error) {
      await this.logError(`Failed to disable 2FA for user: ${userId}`, error);
      throw error;
    }
  }

  async testGetUserStats() {
    try {
      const response = await axios.get(`${BASE_URL}/stats`);
      await this.log('GET /api/users/stats - Get user statistics', response.data);
      return response.data;
    } catch (error) {
      await this.logError('Failed to get user statistics', error);
      throw error;
    }
  }

  async testDeleteUser(userId) {
    try {
      const response = await axios.delete(`${BASE_URL}/${userId}`);
      await this.log(`DELETE /api/users/${userId} - Delete user (soft delete)`, response.data);
      return response.data;
    } catch (error) {
      await this.logError(`Failed to delete user: ${userId}`, error);
      throw error;
    }
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up test data...');
    for (const userId of this.createdUserIds) {
      try {
        await axios.delete(`${BASE_URL}/${userId}`);
        console.log(`Deleted test user: ${userId}`);
      } catch (error) {
        console.error(`Failed to delete test user: ${userId}`, error.message);
      }
    }
  }

  async runAllTests() {
    console.log('🚀 Starting User Management API Tests');
    console.log(`Base URL: ${BASE_URL}`);
    console.log('=' * 50);

    try {
      // Test 1: Get roles (utility endpoint)
      await this.testGetRoles();

      // Test 2: Check username availability
      await this.testCheckUsernameAvailability();

      // Test 3: Create regular user
      const user1Response = await this.testCreateUser(testUser);
      const userId1 = user1Response.data?.user?.id;

      // Test 4: Create user with 2FA enabled
      const user2Response = await this.testCreateUser(testUser2FA);
      const userId2 = user2Response.data?.user?.id;

      // Test 5: Get all users
      await this.testGetAllUsers();

      if (userId1) {
        // Test 6: Get user by ID
        await this.testGetUserById(userId1);

        // Test 7: Update user
        await this.testUpdateUser(userId1);

        // Test 8: Toggle user status
        await this.testToggleUserStatus(userId1);

        // Test 9: Enable 2FA
        await this.testEnable2FA(userId1);

        // Test 10: Disable 2FA
        await this.testDisable2FA(userId1);
      }

      // Test 11: Get user statistics
      await this.testGetUserStats();

      console.log('\n✅ All tests completed successfully!');

    } catch (error) {
      console.log('\n❌ Tests failed with error:', error.message);
    } finally {
      // Cleanup
      await this.cleanup();
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new UserAPITester();
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n\n🛑 Tests interrupted. Cleaning up...');
    await tester.cleanup();
    process.exit(0);
  });

  tester.runAllTests()
    .then(() => {
      console.log('\n✅ Test suite completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test suite failed:', error.message);
      process.exit(1);
    });
}

module.exports = UserAPITester;
