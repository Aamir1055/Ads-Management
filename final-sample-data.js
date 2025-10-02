const mysql = require('mysql2/promise');

async function addFinalSampleData() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '', 
      database: 'ads reporting'
    });
    
    console.log('✅ Connected to database');
    
    // Check existing users
    console.log('\n👥 Checking existing users...');
    const [users] = await connection.execute('SELECT id, username FROM users LIMIT 5');
    
    if (users.length === 0) {
      console.log('❌ No users found. Cannot create reports without users.');
      return;
    }
    
    console.log(`✅ Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`• ID ${user.id}: ${user.username}`);
    });
    
    const firstUserId = users[0].id;
    console.log(`\n🎯 Using user ID ${firstUserId} for created_by`);
    
    // Check existing campaigns
    console.log('\n📋 Checking existing campaigns...');
    const [campaigns] = await connection.execute('SELECT id, name FROM campaigns LIMIT 10');
    
    if (campaigns.length === 0) {
      console.log('❌ No campaigns found. Cannot create reports without campaigns.');
      return;
    }
    
    console.log(`✅ Found ${campaigns.length} campaigns:`);
    campaigns.forEach(campaign => {
      console.log(`• ID ${campaign.id}: ${campaign.name}`);
    });
    
    // Clear existing reports
    await connection.execute('DELETE FROM reports');
    console.log('\n🧹 Cleared existing reports');
    
    // Create sample report data for existing campaigns
    // Generate recent dates (within last 30 days)
    const today = new Date();
    const reportData = [
      { leads: 150, spent: 12500.00, date: new Date(today - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
      { leads: 89, spent: 8750.00, date: new Date(today - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
      { leads: 203, spent: 15600.00, date: new Date(today - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
      { leads: 67, spent: 9200.00, date: new Date(today - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
      { leads: 134, spent: 11800.00, date: new Date(today - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }
    ];
    
    console.log(`\n📝 Creating reports for existing campaigns...`);
    
    let inserted = 0;
    for (let i = 0; i < Math.min(campaigns.length, reportData.length); i++) {
      const campaign = campaigns[i];
      const data = reportData[i];
      
      try {
        await connection.execute(`
          INSERT INTO reports (campaign_id, campaign_name, brand, leads, spent, report_date, created_by)
          VALUES (?, ?, 1, ?, ?, ?, ?)
        `, [
          campaign.id,
          campaign.name,
          data.leads,
          data.spent,
          data.date,
          firstUserId
        ]);
        
        console.log(`✅ Added report for: ${campaign.name} - ${data.leads} leads, ₹${data.spent}`);
        inserted++;
        
      } catch (error) {
        console.log(`❌ Failed to add report for ${campaign.name}:`, error.message);
      }
    }
    
    // If we only had 1 campaign, duplicate it with different dates to get more data
    if (campaigns.length === 1 && inserted > 0) {
      console.log('\n📊 Only one campaign found. Creating additional report entries for better dashboard data...');
      
      const campaign = campaigns[0];
      const additionalData = reportData.slice(1, 4); // Get 3 more entries
      
      for (const data of additionalData) {
        try {
          await connection.execute(`
            INSERT INTO reports (campaign_id, campaign_name, brand, leads, spent, report_date, created_by)
            VALUES (?, ?, 1, ?, ?, ?, ?)
          `, [
            campaign.id,
            `${campaign.name} - ${data.date}`,
            data.leads,
            data.spent,
            data.date,
            firstUserId
          ]);
          
          console.log(`✅ Added additional report: ${data.leads} leads, ₹${data.spent} on ${data.date}`);
          inserted++;
          
        } catch (error) {
          console.log(`⚠️  Could not add additional data:`, error.message);
        }
      }
    }
    
    console.log(`\n🎉 Successfully created ${inserted} reports!`);
    
    // Final verification
    const [finalStats] = await connection.execute(`
      SELECT 
        COUNT(*) as total_campaigns,
        SUM(leads) as total_leads,
        SUM(spent) as total_spent,
        AVG(spent/leads) as avg_cost_per_lead
      FROM reports
    `);
    
    const stats = finalStats[0];
    console.log('\n📊 Final Database Summary:');
    console.log(`• Total Reports: ${stats.total_campaigns}`);
    console.log(`• Total Leads: ${stats.total_leads || 0}`);
    console.log(`• Total Spent: ₹${parseFloat(stats.total_spent || 0).toFixed(2)}`);
    console.log(`• Average Cost Per Lead: ₹${parseFloat(stats.avg_cost_per_lead || 0).toFixed(2)}`);
    
    if (stats.total_campaigns > 0) {
      console.log('\n🎉 SUCCESS! Your dashboard should now show real data with ₹ symbols!');
      console.log('🔄 Refresh your dashboard at http://localhost:3001/dashboard');
      console.log('🧹 Also clear browser cache: Press Ctrl+Shift+R or clear localStorage');
    } else {
      console.log('\n⚠️  No data was inserted. Check the error messages above.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

addFinalSampleData().catch(console.error);
