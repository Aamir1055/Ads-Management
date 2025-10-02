const { pool } = require('./config/database');

async function checkDashboardData() {
  try {
    console.log('🔍 Checking reports table data...\n');

    // Check total counts
    const [totalStats] = await pool.query(`
      SELECT 
        COUNT(*) as total_reports,
        COUNT(DISTINCT campaign_id) as total_campaigns,
        SUM(leads) as total_leads,
        SUM(spent) as total_spent,
        AVG(cost_per_lead) as avg_cost_per_lead,
        MIN(report_date) as earliest_date,
        MAX(report_date) as latest_date
      FROM reports
    `);

    console.log('📊 Overall Statistics:');
    console.log('Total Reports:', totalStats[0]?.total_reports || 0);
    console.log('Total Campaigns:', totalStats[0]?.total_campaigns || 0);
    console.log('Total Leads:', totalStats[0]?.total_leads || 0);
    console.log('Total Spent:', totalStats[0]?.total_spent || 0);
    console.log('Avg Cost Per Lead:', totalStats[0]?.avg_cost_per_lead || 0);
    console.log('Date Range:', totalStats[0]?.earliest_date, 'to', totalStats[0]?.latest_date);
    console.log();

    // Check sample data
    const [sampleData] = await pool.query(`
      SELECT 
        id, campaign_id, campaign_name, brand, 
        leads, spent, cost_per_lead, report_date
      FROM reports 
      ORDER BY report_date DESC 
      LIMIT 5
    `);

    console.log('📝 Sample Report Data:');
    sampleData.forEach((row, index) => {
      console.log(`${index + 1}. Campaign: ${row.campaign_name} | Leads: ${row.leads} | Spent: ${row.spent} | Date: ${row.report_date}`);
    });
    console.log();

    // Check brands
    const [brands] = await pool.query(`
      SELECT 
        COALESCE(brand, 'Unknown') as brand,
        COUNT(*) as reports_count,
        SUM(leads) as total_leads,
        SUM(spent) as total_spent
      FROM reports 
      GROUP BY brand 
      ORDER BY total_leads DESC
      LIMIT 10
    `);

    console.log('🏷️ Brand Performance:');
    brands.forEach((brand, index) => {
      console.log(`${index + 1}. ${brand.brand}: ${brand.total_leads} leads, ₹${brand.total_spent} spent`);
    });
    console.log();

    // Check campaigns
    const [campaigns] = await pool.query(`
      SELECT 
        campaign_id, campaign_name, brand,
        SUM(leads) as total_leads,
        SUM(spent) as total_spent,
        AVG(cost_per_lead) as avg_cost_per_lead
      FROM reports 
      GROUP BY campaign_id, campaign_name, brand
      ORDER BY total_leads DESC
      LIMIT 10
    `);

    console.log('🎯 Top Campaigns:');
    campaigns.forEach((campaign, index) => {
      console.log(`${index + 1}. ${campaign.campaign_name} (${campaign.brand}): ${campaign.total_leads} leads, ₹${campaign.total_spent} spent`);
    });
    console.log();

    // Test dashboard endpoint data structure
    console.log('🧪 Testing Dashboard Endpoint Response Structure...');
    
    const [dashboardStats] = await pool.query(`
      SELECT
        COUNT(DISTINCT campaign_id) as campaigns_count,
        SUM(leads) as total_leads,
        SUM(spent) as total_spent,
        AVG(cost_per_lead) as avg_cost_per_lead,
        SUM(facebook_result) as facebook_results,
        SUM(zoho_result) as zoho_results
      FROM reports
    `);

    const dashboardData = {
      overview: {
        campaignsCount: Number(dashboardStats[0]?.campaigns_count || 0),
        totalLeads: Number(dashboardStats[0]?.total_leads || 0),
        totalSpent: Number(dashboardStats[0]?.total_spent || 0),
        avgCostPerLead: Number(dashboardStats[0]?.avg_cost_per_lead || 0),
        facebookResults: Number(dashboardStats[0]?.facebook_results || 0),
        zohoResults: Number(dashboardStats[0]?.zoho_results || 0)
      },
      topCampaigns: campaigns,
      brandPerformance: brands
    };

    console.log('Dashboard Data Structure:');
    console.log(JSON.stringify(dashboardData, null, 2));

  } catch (error) {
    console.error('❌ Error checking dashboard data:', error);
  } finally {
    pool.end();
  }
}

checkDashboardData();
