const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  console.log('🔍 TRACING AUTHENTICATION FAILURE - ROOT CAUSE ANALYSIS\n');
  
  const conn = await mysql.createConnection({
    host: 'localhost', 
    user: 'root', 
    password: '', 
    database: 'ads reporting'
  });
  
  // 1. Check what token is currently being sent by the frontend
  console.log('1. Checking JWT configuration:');
  const jwtSecret = process.env.JWT_SECRET;
  console.log('JWT_SECRET exists:', !!jwtSecret);
  console.log('JWT_SECRET value:', jwtSecret);
  
  // 2. Generate a test token with the EXACT same process as the auth controller
  console.log('\n2. Testing token generation process:');
  const { generateTokens } = require('./middleware/authMiddleware');
  
  try {
    const testTokens = generateTokens(15); // testadmin user ID
    console.log('✅ generateTokens() works');
    console.log('Access token (first 50 chars):', testTokens.accessToken.substring(0, 50) + '...');
    
    // Decode the token to see its structure
    const decoded = jwt.verify(testTokens.accessToken, jwtSecret);
    console.log('Token structure:', decoded);
    
  } catch (error) {
    console.log('❌ generateTokens() failed:', error.message);
  }
  
  // 3. Trace the exact authentication middleware process
  console.log('\n3. Simulating authentication middleware step by step:');
  
  // Test token (this is what should be working)
  const testToken = jwt.sign({ userId: 15, type: 'access' }, jwtSecret, { expiresIn: '15m' });
  console.log('Test token created');
  
  try {
    // Step 3.1: Token verification
    console.log('\nStep 3.1: JWT verification');
    const decoded = jwt.verify(testToken, jwtSecret);
    console.log('✅ Token verifies successfully');
    console.log('Decoded payload:', decoded);
    
    // Check token type
    if (decoded.type !== 'access') {
      console.log('❌ Invalid token type:', decoded.type);
    } else {
      console.log('✅ Token type is correct');
    }
    
    // Step 3.2: Database user lookup (this is where it might be failing)
    console.log('\nStep 3.2: Database user lookup');
    const [users] = await conn.execute(`
      SELECT 
        u.id, u.username, u.is_active, u.last_login,
        r.id as role_id, r.name as role_name, r.display_name as role_display_name, 
        r.level as role_level, r.is_active as role_active
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = ? AND u.is_active = 1 AND r.is_active = 1
    `, [decoded.userId]);
    
    if (users.length === 0) {
      console.log('❌ FOUND THE ISSUE: User lookup failed!');
      console.log('User ID from token:', decoded.userId);
      
      // Check if user exists at all
      const [allUsers] = await conn.execute('SELECT id, username, is_active, role_id FROM users WHERE id = ?', [decoded.userId]);
      if (allUsers.length === 0) {
        console.log('❌ User does not exist in database');
      } else {
        const user = allUsers[0];
        console.log('User exists:', user);
        
        if (!user.is_active) {
          console.log('❌ User is inactive');
        }
        
        // Check role
        const [roles] = await conn.execute('SELECT * FROM roles WHERE id = ?', [user.role_id]);
        if (roles.length === 0) {
          console.log('❌ User role does not exist');
        } else {
          console.log('Role exists:', roles[0]);
          if (!roles[0].is_active) {
            console.log('❌ Role is inactive');
          }
        }
      }
    } else {
      console.log('✅ User lookup successful:', users[0]);
      
      // Step 3.3: Permission lookup
      console.log('\nStep 3.3: Permission lookup');
      const [permissions] = await conn.execute(`
        SELECT 
          p.name,
          p.display_name,
          p.category
        FROM users u
        JOIN roles r ON u.role_id = r.id
        JOIN role_permissions rp ON r.id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE u.id = ? AND p.is_active = 1
        ORDER BY p.category, p.display_name
      `, [decoded.userId]);
      
      console.log('✅ Found', permissions.length, 'permissions');
      
      if (permissions.length === 0) {
        console.log('❌ No permissions found for user');
      }
    }
    
  } catch (jwtError) {
    console.log('❌ JWT verification failed:', jwtError.message);
  }
  
  // 4. Check if there's a middleware conflict
  console.log('\n4. Checking for middleware conflicts:');
  
  // Check if both auth middleware files exist
  const fs = require('fs');
  const authMiddlewarePath = './middleware/authMiddleware.js';
  const authPath = './middleware/auth.js';
  
  console.log('authMiddleware.js exists:', fs.existsSync(authMiddlewarePath));
  console.log('auth.js exists:', fs.existsSync(authPath));
  
  if (fs.existsSync(authPath)) {
    console.log('⚠️  Multiple auth middleware files detected - potential conflict!');
  }
  
  // 5. Check the actual route registration
  console.log('\n5. Checking route registration:');
  try {
    const permissionRoutes = require('./routes/permissionRoutes');
    console.log('✅ Permission routes loaded successfully');
  } catch (error) {
    console.log('❌ Permission routes failed to load:', error.message);
  }
  
  await conn.end();
  
  console.log('\n🎯 ROOT CAUSE ANALYSIS COMPLETE');
  console.log('Check the output above to identify the exact failure point.');
  
})().catch(error => {
  console.error('❌ Fatal error in root cause analysis:', error.message);
  console.error('Stack trace:', error.stack);
});
