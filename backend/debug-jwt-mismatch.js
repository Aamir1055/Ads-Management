const jwt = require('jsonwebtoken');
require('dotenv').config();

const testJWTFormats = () => {
  console.log('=== JWT FORMAT COMPATIBILITY TEST ===\n');
  
  // Check which JWT secret the system is using
  const jwtSecret = process.env.JWT_SECRET || 'access_token_secret';
  console.log('JWT_SECRET from env:', jwtSecret ? '(set)' : '(not set)');
  console.log('Fallback secret being used:', jwtSecret);
  
  // Test both token formats
  console.log('\n=== Testing Token Format 1: { userId: 15, type: "access" } ===');
  const token1 = jwt.sign({ userId: 15, type: 'access' }, jwtSecret, { expiresIn: '15m' });
  console.log('Token 1 (authMiddleware.js format):', token1.substring(0, 50) + '...');
  
  try {
    const decoded1 = jwt.verify(token1, jwtSecret);
    console.log('✅ Token 1 decoded:', decoded1);
    console.log('✅ authMiddleware.js would use decoded.userId:', decoded1.userId);
    console.log('❌ auth.js would use decoded.id:', decoded1.id || 'UNDEFINED');
  } catch (error) {
    console.log('❌ Token 1 decode failed:', error.message);
  }
  
  console.log('\n=== Testing Token Format 2: { id: 15 } ===');
  const token2 = jwt.sign({ id: 15 }, jwtSecret, { expiresIn: '15m' });
  console.log('Token 2 (auth.js format):', token2.substring(0, 50) + '...');
  
  try {
    const decoded2 = jwt.verify(token2, jwtSecret);
    console.log('✅ Token 2 decoded:', decoded2);
    console.log('❌ authMiddleware.js would use decoded.userId:', decoded2.userId || 'UNDEFINED');
    console.log('✅ auth.js would use decoded.id:', decoded2.id);
  } catch (error) {
    console.log('❌ Token 2 decode failed:', error.message);
  }
  
  console.log('\n=== CONCLUSION ===');
  console.log('🎯 permissionRoutes.js uses authMiddleware.js');
  console.log('🎯 authMiddleware.js expects decoded.userId');
  console.log('🎯 Frontend should send tokens with { userId: 15, type: "access" } format');
  console.log(`🎯 Test with: curl -H "Authorization: Bearer ${token1}" http://localhost:5000/api/permissions/my-permissions`);
};

testJWTFormats();
