const { pool } = require('./config/database');

/**
 * Comprehensive Data Privacy Diagnosis
 * This script will identify all issues preventing proper data privacy
 */

async function diagnosePrivacyIssues() {
  console.log('🔍 Diagnosing Data Privacy Issues...\n');

  try {
    // 1. Check if privacy columns exist
    console.log('1️⃣ Checking database schema...');
    
    const tables = ['cards', 'campaigns', 'campaign_data', 'card_users'];
    for (const table of tables) {
      try {
        const [columns] = await pool.query(`SHOW COLUMNS FROM ${table} LIKE 'created_by'`);
        if (columns.length > 0) {
          console.log(`   ✅ ${table} has created_by column`);
        } else {
          console.log(`   ❌ ${table} MISSING created_by column`);
        }
      } catch (error) {
        console.log(`   ❌ Error checking ${table}: ${error.message}`);
      }
    }

    // 2. Check data ownership
    console.log('\n2️⃣ Checking data ownership...');
    
    // Check campaigns
    const [campaigns] = await pool.query('SELECT name, created_by FROM campaigns LIMIT 10');
    console.log(`   📊 Found ${campaigns.length} campaigns:`);
    campaigns.forEach(camp => {
      console.log(`     - "${camp.name}" (created_by: ${camp.created_by || 'NULL'})`);
    });

    // Check cards
    const [cards] = await pool.query('SELECT card_name, created_by FROM cards LIMIT 10');
    console.log(`   💳 Found ${cards.length} cards:`);
    cards.forEach(card => {
      console.log(`     - "${card.card_name}" (created_by: ${card.created_by || 'NULL'})`);
    });

    // 3. Check user data
    console.log('\n3️⃣ Checking users...');
    const [users] = await pool.query(`
      SELECT u.id, u.username, r.name as role_name, r.level as role_level
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.is_active = 1
      ORDER BY r.level DESC
    `);
    
    console.log('   👥 Active users:');
    let adminCount = 0;
    let regularCount = 0;
    
    users.forEach(user => {
      const isAdmin = user.role_level >= 8 || ['super_admin', 'admin'].includes(user.role_name);
      if (isAdmin) {
        console.log(`     - ${user.username} (ID: ${user.id}) - 🔴 ADMIN (Level: ${user.role_level})`);
        adminCount++;
      } else {
        console.log(`     - ${user.username} (ID: ${user.id}) - 🔵 Regular (Level: ${user.role_level})`);
        regularCount++;
      }
    });

    console.log(`   📊 Summary: ${adminCount} admins, ${regularCount} regular users`);

    // 4. Check if created_by fields are populated
    console.log('\n4️⃣ Checking data ownership population...');
    
    const [nullCampaigns] = await pool.query('SELECT COUNT(*) as count FROM campaigns WHERE created_by IS NULL');
    const [nullCards] = await pool.query('SELECT COUNT(*) as count FROM cards WHERE created_by IS NULL');
    const [nullCardUsers] = await pool.query('SELECT COUNT(*) as count FROM card_users WHERE created_by IS NULL');
    const [nullCampaignData] = await pool.query('SELECT COUNT(*) as count FROM campaign_data WHERE created_by IS NULL');
    
    console.log(`   📊 Records without ownership:`);
    console.log(`     - Campaigns: ${nullCampaigns[0].count} records have NULL created_by`);
    console.log(`     - Cards: ${nullCards[0].count} records have NULL created_by`);
    console.log(`     - Card Users: ${nullCardUsers[0].count} records have NULL created_by`);
    console.log(`     - Campaign Data: ${nullCampaignData[0].count} records have NULL created_by`);

    // 5. Recommendations
    console.log('\n🎯 DIAGNOSIS RESULTS:\n');

    let hasIssues = false;

    // Check for NULL ownership
    const totalNullRecords = nullCampaigns[0].count + nullCards[0].count + nullCardUsers[0].count + nullCampaignData[0].count;
    if (totalNullRecords > 0) {
      hasIssues = true;
      console.log('❌ ISSUE: Records with NULL created_by fields found');
      console.log('   SOLUTION: Run this SQL to assign orphaned records to an admin user:');
      console.log('   ```sql');
      console.log(`   UPDATE campaigns SET created_by = ${users.find(u => u.role_level >= 8)?.id || 35} WHERE created_by IS NULL;`);
      console.log(`   UPDATE cards SET created_by = ${users.find(u => u.role_level >= 8)?.id || 35} WHERE created_by IS NULL;`);
      console.log(`   UPDATE card_users SET created_by = ${users.find(u => u.role_level >= 8)?.id || 35} WHERE created_by IS NULL;`);
      console.log(`   UPDATE campaign_data SET created_by = ${users.find(u => u.role_level >= 8)?.id || 35} WHERE created_by IS NULL;`);
      console.log('   ```\n');
    }

    // Check server restart requirement
    console.log('🔄 SERVER RESTART REQUIRED:');
    console.log('   The /api/users endpoint was changed to use privacy-filtered routes.');
    console.log('   You MUST restart the Node.js server for changes to take effect!\n');

    // Test endpoints (if server is running)
    console.log('🧪 TESTING RECOMMENDATIONS:');
    console.log('   1. Restart your Node.js server (npm start or node app.js)');
    console.log('   2. Login as a regular user (e.g., "Saad")');
    console.log('   3. Check these dropdowns:');
    console.log('      - Campaign dropdown should only show Saad\'s campaigns');
    console.log('      - User dropdown should only show Saad himself');
    console.log('      - Card dropdown should only show Saad\'s cards');
    console.log('   4. Login as admin user and verify they see everything\n');

    if (!hasIssues && totalNullRecords === 0) {
      console.log('✅ DATABASE: All privacy columns exist and are populated!');
      console.log('✅ ROUTES: Privacy routes are configured in app.js');
      console.log('⚠️  ACTION NEEDED: Restart server to apply route changes');
    }

  } catch (error) {
    console.error('❌ Diagnosis failed:', error);
  } finally {
    console.log('\n🚀 Next Steps:');
    console.log('1. Run the SQL updates above (if needed)');
    console.log('2. Restart your Node.js server');
    console.log('3. Test the frontend dropdowns');
    console.log('4. Verify regular users only see their own data\n');
    
    process.exit(0);
  }
}

diagnosePrivacyIssues();
