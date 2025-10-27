// add_missing_modules_permissions.js - Add all modules and permissions based on actual route files
require('dotenv').config();
const { pool } = require('./config/database');

const addMissingModulesAndPermissions = async () => {
  try {
    console.log('🔧 Adding all modules and their permissions based on actual route files...');
    
    // Define all modules with their actual API endpoints
    const modules = [
      {
        name: 'ads',
        description: 'Advertisement management',
        permissions: [
          { key: 'ads.create', name: 'Create Ads', description: 'Create new advertisements' },
          { key: 'ads.read', name: 'Read Ads', description: 'View advertisements' },
          { key: 'ads.update', name: 'Update Ads', description: 'Update advertisement details' },
          { key: 'ads.delete', name: 'Delete Ads', description: 'Delete advertisements' },
          { key: 'ads.stats', name: 'View Ad Stats', description: 'View advertisement statistics' }
        ]
      },
      {
        name: 'campaigns',
        description: 'Campaign management',
        permissions: [
          { key: 'campaigns.create', name: 'Create Campaigns', description: 'Create new campaigns' },
          { key: 'campaigns.read', name: 'Read Campaigns', description: 'View campaigns' },
          { key: 'campaigns.update', name: 'Update Campaigns', description: 'Update campaign details' },
          { key: 'campaigns.delete', name: 'Delete Campaigns', description: 'Delete campaigns' },
          { key: 'campaigns.toggle-status', name: 'Toggle Campaign Status', description: 'Enable/disable campaigns' }
        ]
      },
      {
        name: 'campaign-data',
        description: 'Campaign performance data management',
        permissions: [
          { key: 'campaign-data.create', name: 'Create Campaign Data', description: 'Add campaign performance data' },
          { key: 'campaign-data.read', name: 'Read Campaign Data', description: 'View campaign performance data' },
          { key: 'campaign-data.update', name: 'Update Campaign Data', description: 'Update campaign performance data' },
          { key: 'campaign-data.delete', name: 'Delete Campaign Data', description: 'Delete campaign performance data' }
        ]
      },
      {
        name: 'campaign-types',
        description: 'Campaign type management',
        permissions: [
          { key: 'campaign-types.create', name: 'Create Campaign Types', description: 'Create new campaign types' },
          { key: 'campaign-types.read', name: 'Read Campaign Types', description: 'View campaign types' },
          { key: 'campaign-types.update', name: 'Update Campaign Types', description: 'Update campaign type details' },
          { key: 'campaign-types.delete', name: 'Delete Campaign Types', description: 'Delete campaign types' }
        ]
      },
      {
        name: 'cards',
        description: 'Card management',
        permissions: [
          { key: 'cards.create', name: 'Create Cards', description: 'Create new cards' },
          { key: 'cards.read', name: 'Read Cards', description: 'View cards' },
          { key: 'cards.update', name: 'Update Cards', description: 'Update card details' },
          { key: 'cards.delete', name: 'Delete Cards', description: 'Delete cards' },
          { key: 'cards.add-balance', name: 'Add Balance', description: 'Add balance to cards' }
        ]
      },
      {
        name: 'card-users',
        description: 'Card user assignment management',
        permissions: [
          { key: 'card-users.create', name: 'Create Card Assignments', description: 'Assign cards to users' },
          { key: 'card-users.read', name: 'Read Card Assignments', description: 'View card user assignments' },
          { key: 'card-users.update', name: 'Update Card Assignments', description: 'Update card user assignments' },
          { key: 'card-users.delete', name: 'Delete Card Assignments', description: 'Remove card user assignments' }
        ]
      },
      {
        name: 'reports',
        description: 'Report generation and management',
        permissions: [
          { key: 'reports.create', name: 'Create Reports', description: 'Create and generate reports' },
          { key: 'reports.read', name: 'Read Reports', description: 'View generated reports' },
          { key: 'reports.update', name: 'Update Reports', description: 'Update report data' },
          { key: 'reports.delete', name: 'Delete Reports', description: 'Delete reports' },
          { key: 'reports.build', name: 'Build Reports', description: 'Build reports for specific dates/ranges' },
          { key: 'reports.generate', name: 'Generate Reports', description: 'Generate comprehensive reports with filters' },
          { key: 'reports.dashboard', name: 'View Dashboard', description: 'Access reporting dashboard and statistics' },
          { key: 'reports.charts', name: 'View Charts', description: 'Access chart data and visualizations' }
        ]
      },
      {
        name: 'users',
        description: 'User management',
        permissions: [
          { key: 'users.create', name: 'Create Users', description: 'Create new users' },
          { key: 'users.read', name: 'Read Users', description: 'View users' },
          { key: 'users.update', name: 'Update Users', description: 'Update user details' },
          { key: 'users.delete', name: 'Delete Users', description: 'Delete users' },
          { key: 'users.toggle-status', name: 'Toggle User Status', description: 'Enable/disable users' },
          { key: 'users.enable-2fa', name: 'Enable 2FA', description: 'Enable two-factor authentication for users' },
          { key: 'users.disable-2fa', name: 'Disable 2FA', description: 'Disable two-factor authentication for users' },
          { key: 'users.view-stats', name: 'View User Stats', description: 'View user statistics' },
          { key: 'users.check-username', name: 'Check Username', description: 'Check username availability' }
        ]
      },
      {
        name: 'permissions',
        description: 'Roles and permissions management',
        permissions: [
          { key: 'permissions.create', name: 'Create Permissions', description: 'Create new permissions' },
          { key: 'permissions.read', name: 'Read Permissions', description: 'View permissions and roles' },
          { key: 'permissions.delete', name: 'Delete Permissions', description: 'Delete permissions' }
        ]
      },
      {
        name: 'modules',
        description: 'Module management',
        permissions: [
          { key: 'modules.create', name: 'Create Modules', description: 'Create new modules' },
          { key: 'modules.read', name: 'Read Modules', description: 'View modules' },
          { key: 'modules.update', name: 'Update Modules', description: 'Update module details' }
        ]
      },
      {
        name: 'two-factor-auth',
        description: 'Two-factor authentication management',
        permissions: [
          { key: '2fa.setup', name: 'Setup 2FA', description: 'Setup two-factor authentication' },
          { key: '2fa.verify-setup', name: 'Verify 2FA Setup', description: 'Verify and complete 2FA setup' },
          { key: '2fa.verify-login', name: 'Verify 2FA Login', description: 'Verify 2FA tokens during login' },
          { key: '2fa.disable', name: 'Disable 2FA', description: 'Disable two-factor authentication' },
          { key: '2fa.status', name: 'Check 2FA Status', description: 'Check 2FA status for users' },
          { key: '2fa.backup-codes', name: 'Manage Backup Codes', description: 'Generate and manage backup codes' }
        ]
      }
    ];

    console.log(`\n📊 Will add ${modules.length} modules with their permissions...`);

    let totalModulesAdded = 0;
    let totalPermissionsAdded = 0;

    for (const moduleData of modules) {
      console.log(`\n🔧 Processing module: ${moduleData.name}`);
      
      // Check if module exists
      const [existingModule] = await pool.query(
        'SELECT id FROM modules WHERE module_name = ?',
        [moduleData.name]
      );

      let moduleId;
      
      if (existingModule.length > 0) {
        moduleId = existingModule[0].id;
        console.log(`   ✅ Module "${moduleData.name}" already exists (ID: ${moduleId})`);
      } else {
        // Create module
        const [result] = await pool.query(
          'INSERT INTO modules (module_name, description, is_active, created_at) VALUES (?, ?, 1, NOW())',
          [moduleData.name, moduleData.description]
        );
        moduleId = result.insertId;
        totalModulesAdded++;
        console.log(`   ✅ Created module "${moduleData.name}" (ID: ${moduleId})`);
      }

      // Add permissions for this module
      let permissionsAddedForModule = 0;
      for (const permission of moduleData.permissions) {
        // Check if permission exists
        const [existingPermission] = await pool.query(
          'SELECT id FROM permissions WHERE permission_key = ? AND module_id = ?',
          [permission.key, moduleId]
        );

        if (existingPermission.length === 0) {
          // Create permission
          await pool.query(
            'INSERT INTO permissions (module_id, permission_key, permission_name, description, created_at) VALUES (?, ?, ?, ?, NOW())',
            [moduleId, permission.key, permission.name, permission.description]
          );
          permissionsAddedForModule++;
          totalPermissionsAdded++;
        }
      }
      console.log(`   ✅ Added ${permissionsAddedForModule} permissions for "${moduleData.name}"`);
    }

    // Show final results
    console.log('\n📊 Final Results:');
    const [allModules] = await pool.query(`
      SELECT 
        m.id, 
        m.module_name, 
        m.description,
        COUNT(p.id) as permission_count
      FROM modules m 
      LEFT JOIN permissions p ON m.id = p.module_id 
      GROUP BY m.id, m.module_name, m.description
      ORDER BY m.module_name
    `);
    
    console.table(allModules);
    
    console.log(`\n✨ Module setup completed successfully!`);
    console.log(`📈 Summary:`);
    console.log(`   - Modules added: ${totalModulesAdded}`);
    console.log(`   - Permissions added: ${totalPermissionsAdded}`);
    console.log(`   - Total modules: ${allModules.length}`);
    console.log(`   - Total permissions: ${allModules.reduce((sum, m) => sum + m.permission_count, 0)}`);
    
  } catch (error) {
    console.error('❌ Error during module setup:', error);
    throw error;
  } finally {
    process.exit(0);
  }
};

// Run the setup
addMissingModulesAndPermissions();
