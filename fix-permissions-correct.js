/**
 * Fix user permissions with correct table structure
 */

const { pool } = require('./config/database');

async function fixPermissionsCorrect() {
  console.log('🔧 Fixing user permissions correctly...\n');

  try {
    // Check role_permissions table structure first
    console.log('1️⃣ Checking role_permissions table structure...');
    const [rolePermStructure] = await pool.query('DESCRIBE role_permissions');
    console.log('Role permissions table columns:');
    rolePermStructure.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });

    // Get user's role ID
    const [user] = await pool.query('SELECT id, username, role_id FROM users WHERE id = 51');
    const roleId = user[0].role_id;
    console.log(`\n✅ User: ${user[0].username} (Role ID: ${roleId})`);

    // Add missing campaign_data permissions
    console.log('\n2️⃣ Adding missing campaign_data permissions...');
    
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
        // Insert without granted_by column if it doesn't exist
        await pool.query(`
          INSERT INTO role_permissions (role_id, permission_id)
          VALUES (?, ?)
        `, [roleId, permission.id]);
        console.log(`  ✅ Added: ${permission.name} (${permission.display_name})`);
      } else {
        console.log(`  ✓ Already has: ${permission.name}`);
      }
    }

    // Verify final permissions
    console.log('\n3️⃣ Verifying final permission assignments...');
    const [finalPermissions] = await pool.query(`
      SELECT 
        p.name as permission_name,
        p.category as module_name,
        p.display_name
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ? AND p.is_active = 1
      ORDER BY p.category, p.name
    `, [roleId]);

    console.log(`✅ Total permissions after fix: ${finalPermissions.length}`);
    
    const grouped = {};
    finalPermissions.forEach(perm => {
      if (!grouped[perm.module_name]) {
        grouped[perm.module_name] = [];
      }
      grouped[perm.module_name].push(perm.permission_name);
    });

    console.log('\n📋 FINAL PERMISSION SUMMARY:');
    Object.keys(grouped).forEach(module => {
      console.log(`\n${module.toUpperCase()}:`);
      grouped[module].forEach(perm => {
        console.log(`  ✅ ${perm}`);
      });
    });

    // Check specific permissions user should now have
    console.log('\n4️⃣ Checking key permissions for troubleshooting...');
    const keyPermissions = [
      'campaign_data_read',
      'campaigns_read', 
      'cards_read',
      'campaign_types_read'
    ];

    for (const permName of keyPermissions) {
      const hasPermission = finalPermissions.some(p => p.permission_name === permName);
      const status = hasPermission ? '✅' : '❌';
      console.log(`  ${status} ${permName}`);
    }

    console.log('\n🎯 EXPECTED FIXES:');
    console.log('✅ Cards dropdown should now work (has campaign_data_read)');
    console.log('✅ Campaign types should show all types (has campaigns_read)');
    console.log('✅ Campaign data form should load properly');

  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
}

fixPermissionsCorrect();
