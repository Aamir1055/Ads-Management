const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const username = 'admin';

const commonPasswords = [
  'admin123',
  'password123',
  'password',
  'admin',
  '123456',
  'test123',
  'admin@123',
  'Password123',
  'Admin123'
];

const testPasswords = async () => {
  console.log(`🔑 Testing login passwords for user: ${username}\n`);

  for (const password of commonPasswords) {
    try {
      console.log(`🔍 Trying password: ${password}`);
      const response = await axios.post(`${BASE_URL}/api/auth/login`, {
        username,
        password
      });

      if (response.data.success) {
        console.log(`✅ SUCCESS! Password found: ${password}`);
        console.log('📋 Login response:', response.data);
        return password;
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log(`❌ Password ${password} failed`);
      } else {
        console.log(`⚠️  Error with ${password}:`, error.message);
      }
    }
  }

  console.log('\n❌ No working password found among common ones');
  console.log('💡 You may need to:');
  console.log('   1. Reset the admin password');
  console.log('   2. Create a new test user');
  console.log('   3. Check the frontend to see what password works');
};

testPasswords().catch(console.error);
