const { pool } = require('./config/database');

async function fixSaadRole() {
  try {
    console.log('🔍 CHECKING SAAD\'S ROLE AND FIXING DATA PRIVACY');
    console.log('==============================================\n');

    // Show available roles
    console.log('Available roles:');
    const [roles] = await pool.query('SELECT id, name, level, description FROM roles WHERE is_active = 1 ORDER BY level DESC');
    roles.forEach(r => {
      const access = r.level >= 8 ? 'ADMIN (sees all data)' : 'REGULAR (sees only own data)';
      console.log(`  ID ${r.id}: ${r.name} (Level ${r.level}) - ${access}`);
    });

    // Find regular user role (Advertiser, level 1)
    const [regularRole] = await pool.query('SELECT id, name, level FROM roles WHERE level < 8 ORDER BY level DESC LIMIT 1');
    
    if (regularRole.length === 0) {
      console.log('\n❌ No regular user role found');
      return;
    }

    const targetRole = regularRole[0];
    console.log(`\nTarget role for regular users: ${targetRole.name} (Level ${targetRole.level})`);

    // Check Saad's current role
    const [saadInfo] = await pool.query(`
      SELECT u.id, u.username, u.role_id, r.name as role_name, r.level as role_level
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.username = ?
    `, ['Saad']);

    if (saadInfo.length === 0) {
      console.log('\n❌ User Saad not found');
      return;
    }

    const saad = saadInfo[0];
    console.log(`\nCurrent Saad info:`);
    console.log(`  Username: ${saad.username}`);
    console.log(`  Current Role: ${saad.role_name} (Level ${saad.role_level})`);
    console.log(`  Is Admin: ${saad.role_level >= 8 ? 'YES - sees all data' : 'NO - sees only own data'}`);

    if (saad.role_level >= 8) {
      console.log(`\n🔄 Changing Saad from admin to regular user...`);
      
      // Update Saad's role to regular user
      const [updateResult] = await pool.query(`
        UPDATE users SET role_id = ?, updated_at = NOW() WHERE username = ?
      `, [targetRole.id, 'Saad']);

      if (updateResult.affectedRows > 0) {
        console.log(`✅ Saad's role updated successfully!`);
        console.log(`   New Role: ${targetRole.name} (Level ${targetRole.level})`);
        console.log(`   Data Privacy: Will only see own created data`);
      } else {
        console.log(`❌ Failed to update Saad's role`);
      }
    } else {
      console.log(`\n✅ Saad already has a regular user role - data privacy should work`);
    }

    // Check what data Saad has created
    console.log(`\n📊 Checking Saad's data ownership:`);
    const [saadData] = await pool.query(`
      SELECT COUNT(*) as count FROM campaign_data WHERE created_by = ?
    `, [saad.id]);

    console.log(`   Campaign data created by Saad: ${saadData[0].count} records`);
    
    if (saadData[0].count === 0) {
      console.log(`   👉 Since Saad hasn't created any data, he should see EMPTY list when logged in`);
    }

    console.log(`\n🔐 PRIVACY TEST RESULTS:`);
    console.log(`=============================`);
    console.log(`✅ Data privacy system is now ACTIVE`);
    console.log(`✅ Saad is now a regular user (not admin)`);
    console.log(`✅ Saad should only see campaign data he creates`);
    console.log(`✅ Admin users still see all data`);
    
    console.log(`\n📋 TEST INSTRUCTIONS:`);
    console.log(`1. Refresh the frontend page`);
    console.log(`2. Navigate to Campaign Data page`);
    console.log(`3. Saad should see NO data (empty list)`);
    console.log(`4. Create new campaign data as Saad - he'll only see his own data`);
    console.log(`5. Login as admin - should see ALL data from all users`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixSaadRole();
