/**
 * Check database structure and diagnose issues
 */

const { pool } = require('./config/database');

async function checkDBStructure() {
  console.log('🔍 Checking database structure...\n');

  try {
    // Check cards table structure
    console.log('1️⃣ Checking cards table structure...');
    const [cardsStructure] = await pool.query('DESCRIBE cards');
    console.log('Cards table columns:');
    cardsStructure.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // Get cards data with correct columns
    console.log('\n2️⃣ Checking cards data...');
    const [cards] = await pool.query(`
      SELECT id, card_name, created_by, is_active, created_at
      FROM cards 
      WHERE is_active = 1
      ORDER BY card_name
    `);
    console.log(`✅ Total active cards: ${cards.length}`);
    cards.forEach(card => {
      console.log(`  Card: ${card.card_name} (ID: ${card.id}, Creator: ${card.created_by})`);
    });

    // Check campaign_types table structure
    console.log('\n3️⃣ Checking campaign_types table structure...');
    const [campaignTypesStructure] = await pool.query('DESCRIBE campaign_types');
    console.log('Campaign Types table columns:');
    campaignTypesStructure.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type}) ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    // Get campaign types data
    console.log('\n4️⃣ Checking campaign types data...');
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

    // Check if user has campaign_data permissions
    console.log('\n5️⃣ Checking user campaign_data permissions...');
    const [campaignDataPermissions] = await pool.query(`
      SELECT p.name as permission_name, p.is_active
      FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      JOIN users u ON u.role_id = rp.role_id
      WHERE u.id = 51 AND p.category = 'campaign_data'
    `);
    
    console.log(`Campaign Data permissions: ${campaignDataPermissions.length}`);
    campaignDataPermissions.forEach(perm => {
      const status = perm.is_active ? '✅' : '❌';
      console.log(`  ${status} ${perm.permission_name}`);
    });

    // Check if there are ANY campaign_data permissions in the system
    console.log('\n6️⃣ Checking all campaign_data permissions in system...');
    const [allCampaignDataPermissions] = await pool.query(`
      SELECT id, name, display_name, is_active
      FROM permissions
      WHERE category = 'campaign_data'
      ORDER BY name
    `);
    
    console.log(`Total campaign_data permissions in system: ${allCampaignDataPermissions.length}`);
    allCampaignDataPermissions.forEach(perm => {
      const status = perm.is_active ? '✅' : '❌';
      console.log(`  ${status} ${perm.name} (${perm.display_name})`);
    });

    // Check user's full permissions list again
    console.log('\n7️⃣ User Aamir full permission summary...');
    const [userPermissions] = await pool.query(`
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

    console.log(`✅ Total active permissions for Aamir: ${userPermissions.length}`);
    
    const grouped = {};
    userPermissions.forEach(perm => {
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

  } catch (error) {
    console.error('❌ Database check failed:', error);
  }
}

checkDBStructure();
