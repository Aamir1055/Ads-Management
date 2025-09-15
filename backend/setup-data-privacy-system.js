const { pool } = require('./config/database');

async function setupDataPrivacySystem() {
  try {
    console.log('🔐 SETTING UP DATA PRIVACY SYSTEM');
    console.log('=================================\n');

    // Step 1: Fix existing campaign_data with null created_by
    console.log('1. Fixing existing campaign_data ownership...');
    
    // Check current state
    const [nullOwnership] = await pool.query(`
      SELECT COUNT(*) as count FROM campaign_data WHERE created_by IS NULL
    `);
    
    console.log(`   Found ${nullOwnership[0].count} records with null ownership`);
    
    if (nullOwnership[0].count > 0) {
      // Get the admin user ID
      const [adminUser] = await pool.query(`
        SELECT id FROM users 
        WHERE username = 'admin' 
        OR role_id IN (SELECT id FROM roles WHERE name = 'Super Admin' OR level >= 10)
        ORDER BY id DESC
        LIMIT 1
      `);
      
      if (adminUser.length > 0) {
        const adminId = adminUser[0].id;
        console.log(`   Assigning ownership to admin user: ${adminId}`);
        
        const [updateResult] = await pool.query(`
          UPDATE campaign_data 
          SET created_by = ?, updated_at = NOW() 
          WHERE created_by IS NULL
        `, [adminId]);
        
        console.log(`   ✅ Updated ${updateResult.affectedRows} records with admin ownership`);
      } else {
        console.log('   ⚠️  No admin user found - leaving records as-is');
      }
    } else {
      console.log('   ✅ All records already have proper ownership');
    }

    // Step 2: Check campaign ownership
    console.log('\n2. Checking campaigns table ownership...');
    
    const [campaignNullOwnership] = await pool.query(`
      SELECT COUNT(*) as count FROM campaigns WHERE created_by IS NULL
    `);
    
    console.log(`   Found ${campaignNullOwnership[0].count} campaigns with null ownership`);
    
    if (campaignNullOwnership[0].count > 0) {
      const [adminUser] = await pool.query(`
        SELECT id FROM users 
        WHERE username = 'admin' 
        ORDER BY id DESC
        LIMIT 1
      `);
      
      if (adminUser.length > 0) {
        const adminId = adminUser[0].id;
        
        const [updateResult] = await pool.query(`
          UPDATE campaigns 
          SET created_by = ?, updated_at = NOW() 
          WHERE created_by IS NULL
        `, [adminId]);
        
        console.log(`   ✅ Updated ${updateResult.affectedRows} campaigns with admin ownership`);
      }
    } else {
      console.log('   ✅ All campaigns already have proper ownership');
    }

    // Step 3: Create test user for privacy testing
    console.log('\n3. Creating test user for privacy testing...');
    
    // Check if test user exists
    const [existingTestUser] = await pool.query(`
      SELECT id, username FROM users WHERE username = 'testuser'
    `);
    
    if (existingTestUser.length === 0) {
      // Get a regular role (not admin)
      const [regularRole] = await pool.query(`
        SELECT id FROM roles 
        WHERE level < 8 AND name NOT IN ('Super Admin', 'Admin')
        ORDER BY level DESC
        LIMIT 1
      `);
      
      if (regularRole.length > 0) {
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('testpass123', 12);
        
        const [createResult] = await pool.query(`
          INSERT INTO users (username, hashed_password, role_id, is_active, created_at)
          VALUES (?, ?, ?, 1, NOW())
        `, ['testuser', hashedPassword, regularRole[0].id]);
        
        console.log(`   ✅ Created test user 'testuser' with ID: ${createResult.insertId}`);
        console.log('      Username: testuser');
        console.log('      Password: testpass123');
      } else {
        console.log('   ⚠️  No suitable regular role found for test user');
      }
    } else {
      console.log(`   ✅ Test user already exists: ${existingTestUser[0].username} (ID: ${existingTestUser[0].id})`);
    }

    // Step 4: Show data privacy summary
    console.log('\n4. Data privacy system summary...');
    
    // Show user counts by role
    const [usersByRole] = await pool.query(`
      SELECT r.name as role_name, r.level, COUNT(u.id) as user_count
      FROM roles r
      LEFT JOIN users u ON r.id = u.role_id AND u.is_active = 1
      GROUP BY r.id, r.name, r.level
      ORDER BY r.level DESC
    `);
    
    console.log('   User distribution by role:');
    usersByRole.forEach(role => {
      const access = role.level >= 8 ? 'Can see ALL data' : 'Can see ONLY own data';
      console.log(`      ${role.role_name} (Level ${role.level}): ${role.user_count} users - ${access}`);
    });

    // Show data ownership distribution
    const [dataOwnership] = await pool.query(`
      SELECT 
        CASE 
          WHEN u.username IS NOT NULL THEN u.username
          ELSE CONCAT('Unknown User (ID: ', cd.created_by, ')')
        END as owner,
        r.name as role_name,
        r.level,
        COUNT(*) as record_count
      FROM campaign_data cd
      LEFT JOIN users u ON cd.created_by = u.id
      LEFT JOIN roles r ON u.role_id = r.id
      GROUP BY cd.created_by, u.username, r.name, r.level
      ORDER BY record_count DESC
    `);
    
    console.log('\n   Campaign data ownership distribution:');
    if (dataOwnership.length === 0) {
      console.log('      No campaign data found');
    } else {
      dataOwnership.forEach(owner => {
        const roleInfo = owner.role_name ? `${owner.role_name} (Level ${owner.level})` : 'Unknown role';
        console.log(`      ${owner.owner} [${roleInfo}]: ${owner.record_count} records`);
      });
    }

    console.log('\n🎉 DATA PRIVACY SYSTEM SETUP COMPLETE!');
    console.log('\n🔐 PRIVACY RULES:');
    console.log('   ✅ Admin users (level >= 8) can see ALL data');
    console.log('   ✅ Regular users can only see their own created data');
    console.log('   ✅ All new records automatically get created_by = current user');
    console.log('   ✅ Update/Delete operations validate ownership');
    console.log('\n🧪 TESTING:');
    console.log('   • Login as admin (username: admin, password: admin123) - sees all data');
    console.log('   • Login as testuser (username: testuser, password: testpass123) - sees only own data');
    console.log('   • Create new campaign data - automatically owned by current user');
    console.log('\n🚀 TO ENABLE: Replace campaignDataRoutes.js with campaignDataRoutes_privacy.js in app.js');

  } catch (error) {
    console.error('❌ Error setting up data privacy system:', error);
  } finally {
    await pool.end();
  }
}

setupDataPrivacySystem();
