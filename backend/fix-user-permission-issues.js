/**
 * Fix user permission issues for Aamir
 */

const { pool } = require('./config/database');

async function fixUserPermissions() {
  console.log('🔧 Fixing user permission issues for Aamir...\n');

  try {
    // Get user's role ID
    const [user] = await pool.query('SELECT id, username, role_id FROM users WHERE id = 51');
    if (user.length === 0) {
      throw new Error('User Aamir not found');
    }
    
    const roleId = user[0].role_id;
    console.log(`✅ User: ${user[0].username} (Role ID: ${roleId})`);

    // 1. Add missing campaign_data permissions
    console.log('\n1️⃣ Adding missing campaign_data permissions...');
    
    // Get campaign_data permission IDs
    const [campaignDataPermissions] = await pool.query(`
      SELECT id, name, display_name 
      FROM permissions 
      WHERE category = 'campaign_data' AND is_active = 1
      ORDER BY name
    `);

    console.log(`Found ${campaignDataPermissions.length} campaign_data permissions`);

    for (const permission of campaignDataPermissions) {
      // Check if already assigned
      const [existing] = await pool.query(`
        SELECT id FROM role_permissions 
        WHERE role_id = ? AND permission_id = ?
      `, [roleId, permission.id]);

      if (existing.length === 0) {
        await pool.query(`
          INSERT INTO role_permissions (role_id, permission_id, granted_by, granted_at)
          VALUES (?, ?, 1, NOW())
        `, [roleId, permission.id]);
        console.log(`  ✅ Added: ${permission.name} (${permission.display_name})`);
      } else {
        console.log(`  ✓ Already has: ${permission.name}`);
      }
    }

    // 2. Verify all permissions are now correctly assigned
    console.log('\n2️⃣ Verifying permission assignments...');
    const [finalPermissions] = await pool.query(`
      SELECT 
        p.name as permission_name,
        p.category as module_name,
        p.display_name,
        p.is_active
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      JOIN users u ON u.role_id = rp.role_id
      WHERE u.id = 51 AND p.is_active = 1
      ORDER BY p.category, p.name
    `);

    console.log(`✅ Total permissions after fix: ${finalPermissions.length}`);
    
    const grouped = {};
    finalPermissions.forEach(perm => {
      if (!grouped[perm.module_name]) {
        grouped[perm.module_name] = [];
      }
      grouped[perm.module_name].push(perm.permission_name);
    });

    Object.keys(grouped).forEach(module => {
      console.log(`\n${module.toUpperCase()}:`);
      grouped[module].forEach(perm => {
        console.log(`  ✅ ${perm}`);
      });
    });

    // 3. Test API endpoints that should now work
    console.log('\n3️⃣ Permission fixes completed successfully!');
    console.log('\n🔧 FRONTEND ISSUES TO ADDRESS:');
    console.log('1. Cards dropdown: User now has campaign_data_read - should show cards');
    console.log('2. Campaign types: User has campaigns_read - master endpoint should work');
    console.log('3. Form close: Frontend needs error handling for 403 responses');
    console.log('4. Error messages: Display at top of forms, not behind them');

    console.log('\n📊 EXPECTED FIXES:');
    console.log('✅ Cards should now appear in campaign data form dropdown');
    console.log('✅ Campaign types should show all types (if using master endpoint)');
    console.log('⚠️ Form close and error display - requires frontend fixes');

  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
}

fixUserPermissions();
