const { pool } = require('./config/database');

async function analyzeUserOwnership() {
  try {
    console.log('🔍 ANALYZING TABLES FOR USER OWNERSHIP COLUMNS');
    console.log('============================================\n');

    const tables = ['campaign_data', 'campaigns', 'cards', 'users', 'reports', 'card_users'];

    for (const table of tables) {
      try {
        const [columns] = await pool.query(`DESCRIBE ${table}`);
        console.log(`📋 ${table.toUpperCase()}:`);
        
        // Look for user ownership columns
        const userColumns = columns.filter(col => 
          col.Field.includes('created_by') || 
          col.Field.includes('user_id') || 
          col.Field.includes('owner') ||
          col.Field.includes('assigned_to')
        );

        if (userColumns.length > 0) {
          userColumns.forEach(col => {
            const nullable = col.Null === 'YES' ? 'Nullable' : 'Required';
            const defaultVal = col.Default ? `Default: ${col.Default}` : 'No default';
            console.log(`   ✅ ${col.Field} (${col.Type}) - ${nullable}, ${defaultVal}`);
          });
        } else {
          console.log('   ❌ No user ownership columns found');
        }

        // Check if table has sample data
        const [sampleData] = await pool.query(`SELECT COUNT(*) as count FROM ${table} LIMIT 1`);
        console.log(`   📊 Records: ${sampleData[0].count}`);

      } catch (e) {
        console.log(`   ❌ Table ${table} not accessible: ${e.message}`);
      }
      console.log('');
    }

    // Check existing campaign_data to see user distribution
    console.log('🔍 CHECKING EXISTING CAMPAIGN_DATA USER DISTRIBUTION:');
    try {
      const [userData] = await pool.query(`
        SELECT 
          created_by, 
          COUNT(*) as count,
          u.username
        FROM campaign_data cd
        LEFT JOIN users u ON cd.created_by = u.id
        GROUP BY created_by
        ORDER BY count DESC
      `);
      
      if (userData.length > 0) {
        console.log('Current data ownership:');
        userData.forEach(row => {
          const user = row.username || `Unknown User (ID: ${row.created_by})`;
          console.log(`   User: ${user} - ${row.count} records`);
        });
      } else {
        console.log('No campaign data found');
      }
    } catch (e) {
      console.log('Cannot analyze campaign_data:', e.message);
    }

    console.log('\n🎯 DATA PRIVACY STRATEGY:');
    console.log('=========================');
    console.log('Tables that need user-based filtering:');
    console.log('✅ campaign_data - Filter by created_by');
    console.log('✅ campaigns - Filter by created_by (if exists)');
    console.log('✅ cards - Filter by created_by (if exists)');
    console.log('✅ reports - Filter by user ownership');
    console.log('');
    console.log('Admin users (level >= 8) should see ALL data');
    console.log('Regular users should only see their own created_by data');

  } catch (error) {
    console.error('❌ Analysis error:', error);
  } finally {
    await pool.end();
  }
}

analyzeUserOwnership();
