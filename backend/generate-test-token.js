const jwt = require('jsonwebtoken');

// The JWT secret should match what's in your backend
const JWT_SECRET = 'your_jwt_secret_key_change_this_in_production';

// User data for token
const userData = {
  userId: 1,
  username: 'aamir',
  email: 'aamir@example.com',
  roleId: 6,
  role: {
    id: 6,
    name: 'SuperAdministrator',
    level: 10,
    description: 'Full system access',
    canAccessAllData: true
  },
  permissions: []
};

// Generate token with 1 hour expiry
const token = jwt.sign(userData, JWT_SECRET, {
  expiresIn: '1h'
});

console.log('🔑 Generated JWT Token:');
console.log(token);
console.log('\n✅ Token expires in 1 hour');
console.log('🔄 Use this token for API testing');
