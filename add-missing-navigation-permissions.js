const { pool } = require('./config/database');

async function addMissingNavigationPermissions() {
  try {
    console.log('🔧 ADDING MISSING NAVIGATION PERMISSIONS');
    console.log('=======================================\n');

    // Define the missing permissions for navigation
    const missingPermissions = [
      // Campaign Types permissions
      { category: 'campaign_types', name: 'campaign_types_read', description: 'View campaign types' },
      { category: 'campaign_types', name: 'campaign_types_create', description: 'Create new campaign types' },
      { category: 'campaign_types', name: 'campaign_types_update', description: 'Update campaign types' },
      { category: 'campaign_types', name: 'campaign_types_delete', description: 'Delete campaign types' },
      
      // Card Users permissions
      { category: 'card_users', name: 'card_users_read', description: 'View card users' },
      { category: 'card_users', name: 'card_users_create', description: 'Create new card users' },
      { category: 'card_users', name: 'card_users_update', description: 'Update card users' },
      { category: 'card_users', name: 'card_users_delete', description: 'Delete card users' },
      
      // Permissions management permissions
      { category: 'permissions', name: 'permissions_read', description: 'View roles and permissions' },
      { category: 'permissions', name: 'permissions_create', description: 'Create new roles and permissions' },
      { category: 'permissions', name: 'permissions_update', description: 'Update roles and permissions' },
      { category: 'permissions', name: 'permissions_delete', description: 'Delete roles and permissions' },
      { category: 'permissions', name: 'role_assign', description: 'Assign roles to users' },
      { category: 'permissions', name: 'role_revoke', description: 'Revoke roles from users' },
    ];

    console.log(`Adding ${missingPermissions.length} missing permissions...\n`);

    let addedCount = 0;
    let skippedCount = 0;

    for (const permission of missingPermissions) {
      try {
        // Check if permission already exists
        const [existing] = await pool.query(
          'SELECT id FROM permissions WHERE name = ? AND category = ?',
          [permission.name, permission.category]
        );

        if (existing.length > 0) {
          console.log(`⚠️  Permission already exists: ${permission.category}.${permission.name}`);
          skippedCount++;
          continue;
        }

        // Insert new permission
        const [result] = await pool.query(`
          INSERT INTO permissions (name, category, description, is_active, created_at)
          VALUES (?, ?, ?, 1, NOW())
        `, [permission.name, permission.category, permission.description]);

        console.log(`✅ Added permission: ${permission.category}.${permission.name} (ID: ${result.insertId})`);
        addedCount++;

      } catch (error) {
        console.log(`❌ Failed to add ${permission.category}.${permission.name}:`, error.message);
      }
    }

    console.log(`\n📊 SUMMARY:`);
    console.log(`   ✅ Added: ${addedCount} permissions`);
    console.log(`   ⚠️  Skipped: ${skippedCount} permissions`);

    // Now assign all new permissions to Super Admin role
    console.log(`\n🔑 ASSIGNING NEW PERMISSIONS TO SUPER ADMIN ROLE...`);

    // Get Super Admin role
    const [superAdminRole] = await pool.query('SELECT id FROM roles WHERE name = ?', ['Super Admin']);
    if (superAdminRole.length === 0) {
      throw new Error('Super Admin role not found');
    }
    const superAdminRoleId = superAdminRole[0].id;

    // Get all permissions in the new categories
    const [newPermissions] = await pool.query(`
      SELECT id, name, category 
      FROM permissions 
      WHERE category IN ('campaign_types', 'card_users', 'permissions') 
      AND is_active = 1
    `);

    let assignedCount = 0;
    let alreadyAssignedCount = 0;

    for (const permission of newPermissions) {
      try {
        // Check if already assigned
        const [existing] = await pool.query(
          'SELECT role_id FROM role_permissions WHERE role_id = ? AND permission_id = ?',
          [superAdminRoleId, permission.id]
        );

        if (existing.length > 0) {
          alreadyAssignedCount++;
          continue;
        }

        // Assign permission to Super Admin role
        await pool.query(
          'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
          [superAdminRoleId, permission.id]
        );

        console.log(`✅ Assigned ${permission.category}.${permission.name} to Super Admin role`);
        assignedCount++;

      } catch (error) {
        console.log(`❌ Failed to assign ${permission.category}.${permission.name}:`, error.message);
      }
    }

    console.log(`\n📊 ROLE ASSIGNMENT SUMMARY:`);
    console.log(`   ✅ Assigned: ${assignedCount} permissions`);
    console.log(`   ⚠️  Already assigned: ${alreadyAssignedCount} permissions`);

    // Verify the final result
    console.log(`\n🔍 VERIFICATION:`);
    const [finalCategories] = await pool.query('SELECT DISTINCT category FROM permissions WHERE is_active = 1 ORDER BY category');
    console.log(`Available permission categories:`, finalCategories.map(c => c.category));

    const [adminPermCount] = await pool.query(`
      SELECT COUNT(*) as count
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
      WHERE rp.role_id = ? AND p.is_active = 1
    `, [superAdminRoleId]);

    console.log(`Super Admin has ${adminPermCount[0].count} total permissions`);

    console.log(`\n🎉 SUCCESS! Navigation permissions have been added.`);
    console.log(`The admin user should now see all navigation items including:`);
    console.log(`   ✅ Campaign Types`);
    console.log(`   ✅ Card Users`);
    console.log(`   ✅ Role Management`);

  } catch (error) {
    console.error('❌ Error adding missing permissions:', error);
  } finally {
    await pool.end();
  }
}

addMissingNavigationPermissions();
