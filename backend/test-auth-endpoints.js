const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');

(async () => {
  try {
    // Get the JWT secret from environment or use default
    const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET || 'access_token_secret';
    
    // Generate a test token for testadmin (user ID 15)
    const payload = { userId: 15, type: 'access' };
    const testToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    
    console.log('=== TESTING AUTH ENDPOINTS ===\n');
    console.log('Generated test token for testadmin (user ID 15)');
    console.log('Token (first 50 chars):', testToken.substring(0, 50) + '...\n');
    
    // Test the token by decoding it
    const decoded = jwt.verify(testToken, ACCESS_TOKEN_SECRET);
    console.log('Token decoded successfully:', decoded);
    
    // Simulate what the auth middleware does
    const conn = await mysql.createConnection({
      host: 'localhost', 
      user: 'root', 
      password: '', 
      database: 'ads reporting'
    });
    
    console.log('\n=== Simulating Auth Middleware ===');
    
    // Get user with role information from database
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
      console.log('❌ Auth middleware would FAIL - user not found or inactive');
      await conn.end();
      return;
    }

    const user = users[0];
    console.log('✅ Auth middleware would PASS - user found:', user.username);

    // Get user permissions
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
    `, [user.id]);

    console.log(`✅ Found ${permissions.length} permissions for user`);
    
    // Simulate getMyPermissions endpoint
    const groupedPermissions = permissions.reduce((acc, perm) => {
      if (!acc[perm.category]) {
        acc[perm.category] = [];
      }
      acc[perm.category].push({
        name: perm.name,
        displayName: perm.display_name
      });
      return acc;
    }, {});
    
    console.log('\n=== getMyPermissions would return ===');
    console.log('Permission categories:', Object.keys(groupedPermissions));
    
    console.log('\n=== getMyRoles would return ===');
    console.log('Role:', {
      id: user.role_id,
      name: user.role_name,
      displayName: user.role_display_name,
      level: user.role_level
    });
    
    await conn.end();
    
    console.log('\n✅ All authentication checks passed. The API should work with this token.');
    console.log('\n🔍 To test manually, use this curl command:');
    console.log(`curl -H "Authorization: Bearer ${testToken}" http://localhost:5000/api/permissions/my-permissions`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
})();
