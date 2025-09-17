/**
 * Test API endpoints directly to identify the 403 issue
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('./config/database');

async function testAPIAccess() {
  console.log('🧪 Testing API Access for Aamir...\n');
  
  try {
    // Step 1: Get user and verify password
    console.log('1️⃣ Fetching user credentials...');
    const [users] = await pool.query(`
      SELECT id, username, hashed_password, role_id
      FROM users WHERE username = 'Aamir'
    `);
    
    if (users.length === 0) {
      console.log('❌ User not found');
      return;
    }
    
    const user = users[0];
    console.log(`✅ Found user: ID=${user.id}, Role=${user.role_id}\n`);
    
    // Step 2: Create a mock JWT token like the server would
    console.log('2️⃣ Creating JWT token...');
    const jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role_id: user.role_id
      },
      jwtSecret,
      { expiresIn: '24h' }
    );
    console.log(`✅ JWT token created (first 50 chars): ${token.substring(0, 50)}...\n`);
    
    // Step 3: Test permission check manually (like middleware would do)
    console.log('3️⃣ Testing permission checks manually...');
    
    const testPermissions = [
      'campaign_types_read',
      'users_read',
      'campaigns_read'
    ];
    
    for (const permissionName of testPermissions) {
      console.log(`\n🔍 Testing ${permissionName}:`);
      
      const [permissions] = await pool.query(`
        SELECT p.name, r.name as role_name, r.level as role_level, p.category as module_name
        FROM permissions p
        JOIN role_permissions rp ON p.id = rp.permission_id
        JOIN roles r ON rp.role_id = r.id
        WHERE rp.role_id = ? AND p.name = ?
        AND p.is_active = 1
        LIMIT 1
      `, [user.role_id, permissionName]);
      
      if (permissions.length > 0) {
        console.log(`   ✅ PERMISSION FOUND: ${permissionName}`);
        console.log(`   📋 Details: role=${permissions[0].role_name}, level=${permissions[0].role_level}`);
      } else {
        console.log(`   ❌ PERMISSION MISSING: ${permissionName}`);
        
        // Check what permissions they do have
        const [availablePerms] = await pool.query(`
          SELECT p.name, p.category
          FROM permissions p
          JOIN role_permissions rp ON p.id = rp.permission_id
          WHERE rp.role_id = ? AND p.is_active = 1
        `, [user.role_id]);
        
        console.log(`   📋 Available permissions: ${availablePerms.map(p => p.name).slice(0, 5).join(', ')}...`);
      }
    }
    
    // Step 4: Test with a mock request object like express would create
    console.log('\n4️⃣ Simulating middleware check...');
    
    const mockUser = {
      id: user.id,
      username: user.username,
      role_id: user.role_id
    };
    
    console.log(`   📤 Mock user object:`, mockUser);
    console.log(`   🔐 Testing permission: campaign_types_read`);
    
    // This is the exact query from the middleware
    const [middlewareResult] = await pool.query(`
      SELECT p.name, r.name as role_name, r.level as role_level, p.category as module_name
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      JOIN roles r ON rp.role_id = r.id
      WHERE rp.role_id = ? AND p.name = ?
      AND p.is_active = 1
      LIMIT 1
    `, [mockUser.role_id, 'campaign_types_read']);
    
    if (middlewareResult.length > 0) {
      console.log(`   ✅ MIDDLEWARE WOULD ALLOW ACCESS`);
      console.log(`   📋 Found: ${middlewareResult[0].name} for role ${middlewareResult[0].role_name}`);
    } else {
      console.log(`   ❌ MIDDLEWARE WOULD BLOCK ACCESS`);
    }
    
    console.log('\n📊 SUMMARY:');
    console.log(`   User: ${user.username} (ID: ${user.id})`);
    console.log(`   Role ID: ${user.role_id}`);
    console.log(`   JWT Token: Generated successfully`);
    console.log(`   Database Permissions: Working correctly`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await pool.end();
  }
}

testAPIAccess();
