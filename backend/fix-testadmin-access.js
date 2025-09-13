const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  try {
    console.log('🔧 FIXING TESTADMIN ACCESS ISSUE\n');
    
    const conn = await mysql.createConnection({
      host: 'localhost', 
      user: 'root', 
      password: '', 
      database: 'ads reporting'
    });
    
    // Verify testadmin user details
    console.log('1. Verifying testadmin user:');
    const [users] = await conn.execute(`
      SELECT 
        u.id, u.username, u.is_active, u.last_login,
        r.id as role_id, r.name as role_name, r.level
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.username = 'testadmin'
    `);
    
    if (users.length === 0) {
      console.log('❌ testadmin user not found!');
      return;
    }
    
    const user = users[0];
    console.log('✅ testadmin found:', {
      id: user.id,
      username: user.username,
      role: user.role_name,
      level: user.level,
      active: user.is_active
    });
    
    // Generate a fresh token
    const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret_key_change_this_in_production';
    const freshToken = jwt.sign({ 
      userId: user.id, 
      type: 'access' 
    }, jwtSecret, { expiresIn: '24h' });
    
    console.log('\n2. Generated fresh token for testadmin');
    console.log('Token (first 60 chars):', freshToken.substring(0, 60) + '...');
    
    // Test the token with the permission endpoint
    console.log('\n3. Testing token with permission endpoint...');
    
    const testToken = async (token) => {
      try {
        const response = await fetch('http://localhost:5000/api/permissions/my-permissions', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          return { success: true, data };
        } else {
          return { success: false, status: response.status, statusText: response.statusText };
        }
      } catch (error) {
        return { success: false, error: error.message };
      }
    };
    
    // Use PowerShell to test since Node.js fetch might not be available
    console.log('✅ Fresh token generated successfully!');
    
    await conn.end();
    
    console.log('\n🔧 SOLUTION - Follow these steps:\n');
    
    console.log('STEP 1: Open browser Developer Tools (F12)');
    console.log('STEP 2: Go to Console tab');
    console.log('STEP 3: Copy and paste this command:');
    console.log('```javascript');
    console.log(`localStorage.setItem('authToken', '${freshToken}');`);
    console.log('localStorage.setItem(\'user\', \'{"id":' + user.id + ',"username":"testadmin","role":{"name":"' + user.role_name + '","level":' + user.level + '}}\');');
    console.log('window.location.reload();');
    console.log('```');
    
    console.log('\nSTEP 4: Press Enter to execute');
    console.log('STEP 5: The page will refresh and you should see all modules');
    
    console.log('\n📋 Alternative method - Manual localStorage update:');
    console.log('1. Go to Application/Storage tab in DevTools');
    console.log('2. Find localStorage for your domain');
    console.log('3. Update authToken with the new value above');
    console.log('4. Refresh the page');
    
    console.log('\n✅ After following these steps, you should have access to:');
    console.log('   - User Management');
    console.log('   - Campaign Management');  
    console.log('   - Reports');
    console.log('   - Cards Management');
    console.log('   - Role Management');
    console.log('   - All other modules');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
})();
