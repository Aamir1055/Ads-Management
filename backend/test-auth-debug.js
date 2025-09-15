const { pool } = require('./config/database');
const bcrypt = require('bcryptjs');

async function testAuthDebug() {
  console.log('🔍 Testing Authentication & User Data...\n');

  try {
    // 1. Check users and their passwords
    console.log('1️⃣ Checking user data...');
    const [users] = await pool.query(`
      SELECT u.id, u.username, u.hashed_password, r.name as role_name, r.level as role_level
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.is_active = 1
      ORDER BY u.id
    `);

    console.log('👥 Active users:');
    for (const user of users) {
      console.log(`   - ${user.username} (ID: ${user.id}, Role: ${user.role_name}, Level: ${user.role_level})`);
      
      // Try to verify password for Saad
      if (user.username === 'Saad' && user.hashed_password) {
        console.log(`     🔐 Testing passwords for ${user.username}...`);
        const testPasswords = ['password123', 'password', '123456', 'saad123', 'saad', 'Password123'];
        
        for (const testPassword of testPasswords) {
          try {
            const isValid = await bcrypt.compare(testPassword, user.hashed_password);
            if (isValid) {
              console.log(`     ✅ Password found: "${testPassword}"`);
              break;
            }
          } catch (error) {
            // Skip bcrypt errors
          }
        }
      }
    }

    // 2. Check campaigns ownership
    console.log('\n2️⃣ Checking campaign ownership...');
    const [campaigns] = await pool.query(`
      SELECT c.id, c.name, c.created_by, u.username as creator_username
      FROM campaigns c
      LEFT JOIN users u ON c.created_by = u.id
      ORDER BY c.created_by
    `);

    console.log('📊 Campaign ownership:');
    campaigns.forEach(camp => {
      console.log(`   - "${camp.name}" → Created by: ${camp.creator_username} (ID: ${camp.created_by})`);
    });

    // 3. Test the privacy logic manually
    console.log('\n3️⃣ Testing privacy logic manually...');
    
    const saadUser = users.find(u => u.username === 'Saad');
    if (saadUser) {
      console.log(`\nSimulating API call for Saad (ID: ${saadUser.id}):`);
      
      // Mock req.user object
      const mockReqUser = {
        id: saadUser.id,
        username: saadUser.username,
        role: {
          level: saadUser.role_level,
          name: saadUser.role_name
        }
      };

      // Test admin check
      const isAdmin = mockReqUser.role && (mockReqUser.role.level >= 8 || mockReqUser.role.name === 'super_admin' || mockReqUser.role.name === 'admin');
      console.log(`   Admin check result: ${isAdmin} (should be false)`);

      // Build query like controller does
      let whereClause = 'WHERE 1=1';
      const params = [];
      
      if (!isAdmin) {
        whereClause += ' AND c.created_by = ?';
        params.push(mockReqUser.id);
      }

      console.log(`   WHERE clause: ${whereClause}`);
      console.log(`   Parameters: ${JSON.stringify(params)}`);

      // Execute the actual query
      const [filteredCampaigns] = await pool.query(`
        SELECT c.*, ct.type_name as campaign_type_name
        FROM campaigns c
        LEFT JOIN campaign_types ct ON c.campaign_type_id = ct.id
        ${whereClause}
        ORDER BY c.created_at DESC
      `, params);

      console.log(`   Query result: ${filteredCampaigns.length} campaigns`);
      filteredCampaigns.forEach(camp => {
        console.log(`     ✅ "${camp.name}"`);
      });

      if (filteredCampaigns.length === 1) {
        console.log('   ✅ CORRECT: Privacy filtering is working in database');
      } else {
        console.log('   ❌ PROBLEM: Privacy filtering not working properly');
      }
    }

    // 4. Check if there are any other campaign-related tables or endpoints
    console.log('\n4️⃣ Checking for additional campaign sources...');
    
    try {
      const [campaignData] = await pool.query('SELECT COUNT(*) as count FROM campaign_data');
      console.log(`   campaign_data table: ${campaignData[0].count} records`);
    } catch (error) {
      console.log('   campaign_data table: not accessible');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    console.log('\n🎯 ANALYSIS:');
    console.log('If the privacy filtering works correctly in this test but not in the browser,');
    console.log('the issue might be:');
    console.log('1. User authentication not working properly in the frontend');
    console.log('2. Different API endpoint being called');
    console.log('3. Browser cache or session issues');
    console.log('4. Frontend bypassing the backend privacy filters somehow');
    
    process.exit(0);
  }
}

testAuthDebug();
