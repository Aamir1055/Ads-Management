const mysql = require('mysql2/promise');

async function insertSampleData() {
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
    
    // Delete existing data first (optional)
    await connection.execute('DELETE FROM reports');
    console.log('🧹 Cleared existing data');
    
    const insertQuery = `
      INSERT INTO reports (campaign_id, campaign_name, brand, leads, spent, report_date, created_by)
      VALUES (?, ?, 1, ?, ?, ?, 1)
    `;
    
    const campaigns = [
      { id: 101, name: 'Diwali Festival Sale 2024', leads: 150, spent: 12500.00, date: '2024-10-25' },
      { id: 102, name: 'Mumbai Local Business Boost', leads: 89, spent: 8750.00, date: '2024-10-24' },
      { id: 103, name: 'Delhi Food Delivery Campaign', leads: 203, spent: 15600.00, date: '2024-10-23' },
      { id: 104, name: 'Bangalore Tech Recruitment', leads: 67, spent: 9200.00, date: '2024-10-22' },
      { id: 105, name: 'Chennai Education Services', leads: 134, spent: 11800.00, date: '2024-10-21' },
      { id: 106, name: 'Kolkata Wedding Planning', leads: 78, spent: 6900.00, date: '2024-10-20' },
      { id: 107, name: 'Pune Real Estate Leads', leads: 112, spent: 18500.00, date: '2024-10-19' },
      { id: 108, name: 'Hyderabad IT Services', leads: 95, spent: 13400.00, date: '2024-10-18' }
    ];
    
    console.log('📝 Inserting sample data...');
    
    let inserted = 0;
    for (const campaign of campaigns) {
      try {
        await connection.execute(insertQuery, [
          campaign.id,
          campaign.name,
          campaign.leads,
          campaign.spent,
          campaign.date
        ]);
        
        console.log(`✅ Inserted: ${campaign.name}`);
        inserted++;
        
      } catch (error) {
        console.log(`❌ Failed to insert ${campaign.name}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Successfully inserted ${inserted} campaigns!`);
    
    // Verify the data
    const [result] = await connection.execute(`
      SELECT 
        COUNT(*) as total_campaigns,
        SUM(leads) as total_leads,
        SUM(spent) as total_spent,
        AVG(spent/leads) as avg_cost_per_lead
      FROM reports
    `);
    
    const stats = result[0];
    console.log('\n📊 Database Summary:');
    console.log(`• Total Campaigns: ${stats.total_campaigns}`);
    console.log(`• Total Leads: ${stats.total_leads}`);
    console.log(`• Total Spent: ₹${parseFloat(stats.total_spent).toFixed(2)}`);
    console.log(`• Average Cost Per Lead: ₹${parseFloat(stats.avg_cost_per_lead).toFixed(2)}`);
    
    console.log('\n✨ Sample data inserted successfully!');
    console.log('🔄 Now refresh your dashboard at http://localhost:3001/dashboard');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

insertSampleData().catch(console.error);
