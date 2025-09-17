/**
 * Diagnose current user permission issues
 */

const { pool } = require('./config/database');
const jwt = require('jsonwebtoken');

async function diagnoseUserIssues() {
  console.log('🔍 Diagnosing user permission issues...\n');

  try {
    // Check user's current permissions
    console.log('1️⃣ Checking user permissions for Aamir (ID: 51)...');
    const [userPermissions] = await pool.query(`
      SELECT 
        u.id as user_id,
        u.username,
        r.name as role_name,
        p.name as permission_name,
        p.category as module_name,
        p.display_name,
        p.is_active
      FROM users u
      JOIN roles r ON u.role_id = r.id
      JOIN role_permissions rp ON r.id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE u.id = 51
      ORDER BY p.category, p.name
    `);

    console.log(`✅ User: ${userPermissions[0]?.username || 'Unknown'}`);
    console.log(`✅ Role: ${userPermissions[0]?.role_name || 'Unknown'}`);
    console.log(`✅ Total Permissions: ${userPermissions.length}`);

    // Group by module
    const modulePermissions = {};
    userPermissions.forEach(perm => {
      if (!modulePermissions[perm.module_name]) {
        modulePermissions[perm.module_name] = [];
      }
      modulePermissions[perm.module_name].push({
        permission: perm.permission_name,
        display: perm.display_name,
        active: perm.is_active
      });
    });

    console.log('\n📋 Permissions by Module:');
    for (const [module, perms] of Object.entries(modulePermissions)) {
      console.log(`\n${module.toUpperCase()}:`);
      perms.forEach(p => {
        const status = p.active ? '✅' : '❌';
        console.log(`  ${status} ${p.permission} (${p.display})`);
      });
    }

    // Check specific issues
    console.log('\n2️⃣ Checking specific issues...');
    
    // Check campaign types
    const campaignTypePermissions = modulePermissions['campaigns'] || [];
    const campaignTypesPermissions = modulePermissions['campaign_types'] || [];
    console.log('\n🎯 CAMPAIGN TYPES ACCESS:');
    console.log('Campaign permissions:', campaignTypePermissions.map(p => p.permission));
    console.log('Campaign Types permissions:', campaignTypesPermissions.map(p => p.permission));
    
    // Check cards permissions
    const cardsPermissions = modulePermissions['cards'] || [];
    console.log('\n🃏 CARDS ACCESS:');
    console.log('Cards permissions:', cardsPermissions.map(p => p.permission));
    
    // Check campaign data permissions
    const campaignDataPermissions = modulePermissions['campaign_data'] || [];
    console.log('\n📊 CAMPAIGN DATA ACCESS:');
    console.log('Campaign Data permissions:', campaignDataPermissions.map(p => p.permission));

    // Check actual cards data
    console.log('\n3️⃣ Checking available cards...');
    const [cards] = await pool.query(`
      SELECT id, card_name, user_id, is_active, created_at
      FROM cards 
      WHERE is_active = 1
      ORDER BY card_name
    `);
    console.log(`✅ Total active cards: ${cards.length}`);
    cards.forEach(card => {
      console.log(`  Card: ${card.card_name} (ID: ${card.id}, Owner: ${card.user_id})`);
    });

    // Check campaign types data
    console.log('\n4️⃣ Checking available campaign types...');
    const [campaignTypes] = await pool.query(`
      SELECT id, type_name, created_by, is_active, created_at
      FROM campaign_types 
      WHERE is_active = 1
      ORDER BY type_name
    `);
    console.log(`✅ Total active campaign types: ${campaignTypes.length}`);
    campaignTypes.forEach(ct => {
      console.log(`  Type: ${ct.type_name} (ID: ${ct.id}, Creator: ${ct.created_by})`);
    });

    // Test JWT token generation
    console.log('\n5️⃣ Testing JWT token generation...');
    const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret_key_change_this_in_production';
    const accessToken = jwt.sign(
      {
        userId: 51,
        type: 'access'
      },
      jwtSecret,
      { expiresIn: '15m' }
    );
    console.log('✅ JWT token generated successfully');

    // Verify token
    try {
      const decoded = jwt.verify(accessToken, jwtSecret);
      console.log('✅ JWT token verification successful');
      console.log('Token payload:', decoded);
    } catch (error) {
      console.log('❌ JWT token verification failed:', error.message);
    }

    console.log('\n📋 SUMMARY OF FINDINGS:');
    console.log('=======================');
    
    // Check for missing critical permissions
    const criticalModules = ['campaigns', 'cards', 'campaign_data', 'users'];
    criticalModules.forEach(module => {
      const perms = modulePermissions[module] || [];
      const readPerm = perms.find(p => p.permission.includes('read'));
      if (readPerm) {
        console.log(`✅ ${module}: Has read access`);
      } else {
        console.log(`❌ ${module}: Missing read access`);
      }
    });

    console.log('\n🔧 RECOMMENDED FIXES:');
    console.log('1. Verify frontend is using /api/campaign-types/master endpoint');
    console.log('2. Check if cards API endpoint is properly returning data');
    console.log('3. Ensure frontend error handling closes forms on 403 responses');
    console.log('4. Add error message display at top of forms instead of behind');

  } catch (error) {
    console.error('❌ Diagnosis failed:', error);
  }
}

diagnoseUserIssues();
