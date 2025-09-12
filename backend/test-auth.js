// Simple test script to verify our authentication logic

const axios = require('axios');

const testAuth = async () => {
  try {
    console.log('🧪 Testing authentication API...\n');
    
    // Test 1: Get all users
    console.log('📋 Test 1: Fetching all users...');
    const usersResponse = await axios.get('http://localhost:5000/api/users');
    
    if (usersResponse.data.success) {
      console.log('✅ Users API working');
      console.log('👥 Available users:');
      usersResponse.data.data.users.forEach(user => {
        console.log(`   - ID: ${user.id}, Username: ${user.username}, Role: ${user.role_name}, 2FA: ${user.is_2fa_enabled ? 'Yes' : 'No'}`);
      });
      console.log('');
      
      // Test 2: Simulate login logic
      const testUsername = 'updateduser12';
      console.log(`🔐 Test 2: Simulating login for username: ${testUsername}`);
      
      const user = usersResponse.data.data.users.find(u => u.username === testUsername);
      if (user) {
        console.log('✅ User found in database:');
        console.log(`   - ID: ${user.id}`);
        console.log(`   - Username: ${user.username}`);
        console.log(`   - Role: ${user.role_name}`);
        console.log(`   - 2FA Enabled: ${user.is_2fa_enabled ? 'Yes' : 'No'}`);
        console.log(`   - Active: ${user.is_active !== false ? 'Yes' : 'No'}`);
        
        if (!user.is_2fa_enabled) {
          console.log('✅ Login should succeed (no 2FA required)');
        } else {
          console.log('🔒 2FA verification would be required');
        }
      } else {
        console.log('❌ User not found');
      }
    } else {
      console.log('❌ Users API failed:', usersResponse.data);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
};

testAuth();
