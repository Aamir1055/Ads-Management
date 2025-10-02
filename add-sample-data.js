const mysql = require('mysql2/promise');

async function addSampleData() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    
    // Database connection - update these with your actual DB credentials
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root', // Update if different
      password: '', // Update with your MySQL password
      database: 'ads reporting' // Update with your database name
    });
    
    console.log('✅ Connected to database');
    
    // Check if data already exists
    const [existingRows] = await connection.execute('SELECT COUNT(*) as count FROM reports');
    const existingCount = existingRows[0].count;
    
    console.log(`📊 Current reports in database: ${existingCount}`);
    
    if (existingCount > 0) {
      console.log('⚠️  Data already exists. Do you want to add more sample data? (This will add to existing data)');
    }
    
    // Sample campaigns data with Indian context
    const campaigns = [
      {
        campaign_name: 'Diwali Festival Sale 2024',
        brand: 'FashionHub',
        leads: 150,
        spent: 12500.00,
        platform: 'Facebook',
        date: '2024-10-25'
      },
      {
        campaign_name: 'Mumbai Local Business Boost',
        brand: 'TechStart',
        leads: 89,
        spent: 8750.00,
        platform: 'Google Ads',
        date: '2024-10-24'
      },
      {
        campaign_name: 'Delhi Food Delivery Campaign',
        brand: 'QuickBites',
        leads: 203,
        spent: 15600.00,
        platform: 'Instagram',
        date: '2024-10-23'
      },
      {
        campaign_name: 'Bangalore Tech Recruitment',
        brand: 'HireFast',
        leads: 67,
        spent: 9200.00,
        platform: 'LinkedIn',
        date: '2024-10-22'
      },
      {
        campaign_name: 'Chennai Education Services',
        brand: 'LearnMore',
        leads: 134,
        spent: 11800.00,
        platform: 'Facebook',
        date: '2024-10-21'
      },
      {
        campaign_name: 'Kolkata Wedding Planning',
        brand: 'DreamWeddings',
        leads: 78,
        spent: 6900.00,
        platform: 'Google Ads',
        date: '2024-10-20'
      },
      {
        campaign_name: 'Pune Real Estate Leads',
        brand: 'PropertyPro',
        leads: 112,
        spent: 18500.00,
        platform: 'Facebook',
        date: '2024-10-19'
      },
      {
        campaign_name: 'Hyderabad IT Services',
        brand: 'CodeCraft',
        leads: 95,
        spent: 13400.00,
        platform: 'LinkedIn',
        date: '2024-10-18'
      }
    ];
    
    console.log('📝 Adding sample campaign data...');
    
    let addedCount = 0;
    
    for (const campaign of campaigns) {
      // Calculate cost per lead
      const costPerLead = campaign.spent / campaign.leads;
      
      try {
        await connection.execute(`
          INSERT INTO reports (campaign_id, campaign_name, brand, leads, spent, report_date, created_by)
          VALUES (?, ?, 1, ?, ?, ?, 1)
        `, [
          Math.floor(Math.random() * 1000) + 100, // Random campaign_id
          campaign.campaign_name,
          campaign.leads,
          campaign.spent,
          campaign.date
        ]);
        
        addedCount++;
        console.log(`✅ Added: ${campaign.campaign_name} - ₹${campaign.spent} spent, ${campaign.leads} leads`);
        
      } catch (insertError) {
        console.log(`⚠️  Skipped: ${campaign.campaign_name} (might already exist)`);
      }
    }
    
    console.log(`\n🎉 Successfully added ${addedCount} sample campaigns!`);
    
    // Show summary of data
    const [totalStats] = await connection.execute(`
      SELECT 
        COUNT(*) as total_campaigns,
        SUM(leads) as total_leads,
        SUM(spent) as total_spent,
        AVG(cost_per_lead) as avg_cost_per_lead
      FROM reports
    `);
    
    const stats = totalStats[0];
    console.log('\n📊 Database Summary:');
    console.log(`• Total Campaigns: ${stats.total_campaigns}`);
    console.log(`• Total Leads: ${stats.total_leads}`);
    console.log(`• Total Spent: ₹${parseFloat(stats.total_spent).toFixed(2)}`);
    console.log(`• Average Cost Per Lead: ₹${parseFloat(stats.avg_cost_per_lead).toFixed(2)}`);
    
    console.log('\n✨ Sample data added successfully! Your dashboard should now show real data.');
    console.log('🔄 Refresh your dashboard at http://localhost:3001/dashboard');
    
  } catch (error) {
    console.error('❌ Error adding sample data:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Fix: Update the database credentials in this script');
      console.log('   - Check your MySQL username and password');
      console.log('   - Make sure your database name is correct');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Fix: Make sure MySQL server is running');
      console.log('   - Start XAMPP or your MySQL service');
      console.log('   - Check if the database exists');
    } else if (error.code === 'ER_NO_SUCH_TABLE') {
      console.log('\n💡 Fix: Reports table might not exist');
      console.log('   - Run your database migrations first');
      console.log('   - Check table name is "reports"');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the function
addSampleData().catch(console.error);
