/**
 * Investigate permission bypass issues
 */

const { pool } = require('./config/database');

async function investigatePermissionIssues() {
  console.log('🔍 Investigating permission bypass issues...\n');
  
  try {
    // 1. Check current permissions for Aamir
    console.log('1️⃣ Current permissions for Aamir:');
    const [permissions] = await pool.query(`
      SELECT p.name, p.category, p.display_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      JOIN role_permissions rp ON r.id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE u.username = 'Aamir' AND p.is_active = 1
      ORDER BY p.category, p.name
    `);
    
    const grouped = {};
    permissions.forEach(p => {
      if (!grouped[p.category]) grouped[p.category] = [];
      grouped[p.category].push(p.name.split('_').pop());
    });
    
    Object.keys(grouped).forEach(category => {
      console.log(`   ${category}: [${grouped[category].join(', ')}]`);
    });
    
    // 2. Check specific permissions that should be blocked
    console.log('\n2️⃣ Checking specific permissions that should be BLOCKED:');
    
    const shouldBeBlocked = [
      'role_management',
      'users_manage_roles', 
      'card_users_update',
      'card_users_delete',
      'brands_create',
      'brands_update',
      'brands_delete'
    ];
    
    shouldBeBlocked.forEach(permName => {
      const hasPermission = permissions.some(p => p.name === permName);
      console.log(`   ${permName}: ${hasPermission ? '❌ HAS PERMISSION (SHOULD BE BLOCKED!)' : '✅ BLOCKED (CORRECT)'}`);
    });
    
    // 3. Check if there are missing permissions that should be granted
    console.log('\n3️⃣ Checking permissions that might be missing:');
    
    const shouldHave = [
      'campaign_data_read',
      'campaign_types_read',
      'campaigns_read',
      'cards_read',
      'users_read'
    ];
    
    shouldHave.forEach(permName => {
      const hasPermission = permissions.some(p => p.name === permName);
      console.log(`   ${permName}: ${hasPermission ? '✅ HAS (CORRECT)' : '❌ MISSING'}`);
    });
    
    // 4. Check role management routes - see if they're using RBAC
    console.log('\n4️⃣ Checking route files for RBAC integration...');
    
    const fs = require('fs');
    const path = require('path');
    
    // Check if role management routes exist and have RBAC
    const roleRouteFiles = [
      'routes/permissionsRoutes.js',
      'routes/userManagementRoutes_privacy.js'
    ];
    
    roleRouteFiles.forEach(routeFile => {
      const fullPath = path.join(__dirname, routeFile);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const hasRBAC = content.includes('rbacMiddleware') || content.includes('checkModulePermission') || content.includes('createPermissionMiddleware');
        console.log(`   ${routeFile}: ${hasRBAC ? '✅ Has RBAC' : '❌ Missing RBAC'}`);
        
        // Check for role assignment endpoints
        if (content.includes('role/assign') || content.includes('assign-role')) {
          console.log(`     -> Contains role assignment endpoints`);
        }
      } else {
        console.log(`   ${routeFile}: ❌ File not found`);
      }
    });
    
    // 5. Check campaign types data privacy settings
    console.log('\n5️⃣ Checking Campaign Types data...');
    
    const [campaignTypes] = await pool.query(`
      SELECT id, type_name, created_by 
      FROM campaign_types 
      ORDER BY type_name
    `);
    
    console.log(`Found ${campaignTypes.length} campaign types:`);
    campaignTypes.forEach(ct => {
      console.log(`   ${ct.type_name} (ID: ${ct.id}, Created by: ${ct.created_by || 'NULL'})`);
    });
    
    // 6. Check Aamir's user ID to see if data filtering is the issue
    const [aamirInfo] = await pool.query(`
      SELECT id, username FROM users WHERE username = 'Aamir'
    `);
    
    if (aamirInfo.length > 0) {
      console.log(`\nAamir's user ID: ${aamirInfo[0].id}`);
      
      // Check if campaign types are filtered by user
      const [aamirCampaignTypes] = await pool.query(`
        SELECT id, type_name 
        FROM campaign_types 
        WHERE created_by = ? OR created_by IS NULL
        ORDER BY type_name
      `, [aamirInfo[0].id]);
      
      console.log(`Campaign types Aamir should see: ${aamirCampaignTypes.length}`);
      aamirCampaignTypes.forEach(ct => {
        console.log(`   ${ct.type_name}`);
      });
    }
    
    console.log('\n📋 SUMMARY OF ISSUES FOUND:');
    console.log('1. Check if role management routes are properly protected');
    console.log('2. Campaign Types may be incorrectly filtered by user ownership');
    console.log('3. Some delete operations may bypass RBAC checks');
    console.log('4. Frontend forms may not handle permission errors properly');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

investigatePermissionIssues();
