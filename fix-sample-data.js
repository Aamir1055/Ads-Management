const mysql = require('mysql2/promise');

async function fixSampleData() {
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
    
    // First, check existing campaigns
    console.log('\n📋 Checking existing campaigns...');
    const [existingCampaigns] = await connection.execute('SELECT id, name FROM campaigns LIMIT 10');
    
    if (existingCampaigns.length === 0) {
      console.log('❌ No campaigns found. Let\'s create some first...');
      
      // Insert sample campaigns first
      const sampleCampaigns = [
        { id: 101, name: 'Diwali Festival Sale 2024', type: 'Lead Generation', status: 'active' },
        { id: 102, name: 'Mumbai Local Business Boost', type: 'Brand Awareness', status: 'active' },
        { id: 103, name: 'Delhi Food Delivery Campaign', type: 'Lead Generation', status: 'active' },
        { id: 104, name: 'Bangalore Tech Recruitment', type: 'Lead Generation', status: 'active' },
        { id: 105, name: 'Chennai Education Services', type: 'Lead Generation', status: 'active' },
      ];
      
      // Check campaigns table structure first
      const [campaignColumns] = await connection.execute('DESCRIBE campaigns');
      console.log('\n📊 Campaigns Table Structure:');
      campaignColumns.forEach(col => {
        console.log(`• ${col.Field} (${col.Type})`);
      });

      try {
        const campaignInsertQuery = `INSERT INTO campaigns (id, name, type, status) VALUES (?, ?, ?, ?)`;
        
        for (const campaign of sampleCampaigns) {
          try {
            await connection.execute(campaignInsertQuery, [
              campaign.id,
              campaign.name,
              campaign.type,
              campaign.status
            ]);
            console.log(`✅ Created campaign: ${campaign.name}`);
          } catch (err) {
            console.log(`⚠️  Campaign might exist: ${campaign.name}`);
          }
        }
      } catch (error) {
        console.log('❌ Error creating campaigns - table structure might be different');
        console.log('Let\'s try a simpler approach...');
        
        // Try simpler insert
        try {
          await connection.execute('INSERT INTO campaigns (name) VALUES (?)', ['Sample Campaign 1']);
          await connection.execute('INSERT INTO campaigns (name) VALUES (?)', ['Sample Campaign 2']);
          console.log('✅ Created basic campaigns');
        } catch (simpleError) {
          console.log('❌ Even simple insert failed:', simpleError.message);
        }
      }
      
      // Re-check campaigns
      const [newCampaigns] = await connection.execute('SELECT id, name FROM campaigns LIMIT 10');
      console.log(`\n📊 Found ${newCampaigns.length} campaigns after creation`);
    } else {
      console.log(`✅ Found ${existingCampaigns.length} existing campaigns:`);
      existingCampaigns.forEach(campaign => {
        console.log(`• ID ${campaign.id}: ${campaign.name}`);
      });
    }
    
    // Now get fresh campaign list for reports
    const [availableCampaigns] = await connection.execute('SELECT id, name FROM campaigns ORDER BY id LIMIT 10');
    
    if (availableCampaigns.length === 0) {
      console.log('\n❌ Still no campaigns available. Cannot create reports without campaigns.');
      return;
    }
    
    console.log(`\n📝 Creating reports for ${availableCampaigns.length} campaigns...`);
    
    // Clear existing reports
    await connection.execute('DELETE FROM reports');
    console.log('🧹 Cleared existing reports');
    
    const reportData = [
      { leads: 150, spent: 12500.00, date: '2024-10-25' },
      { leads: 89, spent: 8750.00, date: '2024-10-24' },
      { leads: 203, spent: 15600.00, date: '2024-10-23' },
      { leads: 67, spent: 9200.00, date: '2024-10-22' },
      { leads: 134, spent: 11800.00, date: '2024-10-21' }
    ];
    
    let inserted = 0;
    for (let i = 0; i < Math.min(availableCampaigns.length, reportData.length); i++) {
      const campaign = availableCampaigns[i];
      const data = reportData[i];
      
      try {
        await connection.execute(`
          INSERT INTO reports (campaign_id, campaign_name, brand, leads, spent, report_date, created_by)
          VALUES (?, ?, 1, ?, ?, ?, 1)
        `, [
          campaign.id,
          campaign.name,
          data.leads,
          data.spent,
          data.date
        ]);
        
        console.log(`✅ Added report for: ${campaign.name} - ${data.leads} leads, ₹${data.spent}`);
        inserted++;
        
      } catch (error) {
        console.log(`❌ Failed to add report for ${campaign.name}:`, error.message);
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
      console.log('\n🎉 SUCCESS! Your dashboard should now show real data.');
      console.log('🔄 Refresh your dashboard at http://localhost:3001/dashboard');
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

fixSampleData().catch(console.error);
