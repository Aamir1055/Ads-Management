const { pool } = require('../config/database');

class DashboardService {
  /**
   * Get dashboard overview statistics
   * @param {number} userId - Current user ID
   * @param {string} userRole - User role for data filtering
   * @returns {Promise<Object>} Dashboard overview data
   */
  async getOverviewStats(userId, userRole) {
    try {
      // Base WHERE clause for role-based filtering
      const roleFilter = userRole !== 'super_admin' ? 'AND (created_by = ? OR created_by IS NULL)' : '';
      const params = userRole !== 'super_admin' ? [userId] : [];

      // Get campaign statistics
      const [campaignStats] = await pool.execute(`
        SELECT 
          COUNT(*) as total_campaigns,
          COUNT(CASE WHEN is_enabled = 1 THEN 1 END) as active_campaigns,
          COUNT(CASE WHEN is_enabled = 0 THEN 1 END) as inactive_campaigns,
          COUNT(DISTINCT brand) as unique_brands,
          COUNT(DISTINCT campaign_type_id) as campaign_types_used
        FROM campaigns 
        WHERE 1=1 ${roleFilter}
      `, params);

      // Get reports statistics (last 30 days)
      const [reportStats] = await pool.execute(`
        SELECT 
          COUNT(*) as total_reports,
          COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as reports_today,
          COUNT(CASE WHEN DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 END) as reports_this_week,
          COUNT(CASE WHEN DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 END) as reports_this_month
        FROM reports 
        WHERE report_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        ${userRole !== 'super_admin' ? 'AND (created_by = ? OR created_by IS NULL)' : ''}
      `, params);

      // Get performance metrics from recent reports
      const [performanceStats] = await pool.execute(`
        SELECT 
          SUM(leads) as total_leads,
          SUM(facebook_result) as total_facebook_leads,
          SUM(zoho_result) as total_zoho_leads,
          SUM(spent) as total_spent,
          AVG(cost_per_lead) as avg_cost_per_lead,
          COUNT(DISTINCT campaign_id) as active_campaigns_with_data,
          MAX(report_date) as last_report_date,
          MIN(report_date) as first_report_date
        FROM reports 
        WHERE report_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        ${userRole !== 'super_admin' ? 'AND (created_by = ? OR created_by IS NULL)' : ''}
      `, params);

      // Get card statistics
      const [cardStats] = await pool.execute(`
        SELECT 
          COUNT(*) as total_cards,
          COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_cards,
          SUM(current_balance) as total_balance,
          AVG(current_balance) as avg_balance,
          COUNT(DISTINCT cu.user_id) as users_with_cards
        FROM cards c
        LEFT JOIN card_users cu ON c.id = cu.card_id
        WHERE 1=1
        ${userRole !== 'super_admin' ? 'AND (cu.user_id = ? OR cu.user_id IS NULL)' : ''}
      `, params);

      // Calculate growth metrics (compare last 15 days vs previous 15 days)
      const [growthStats] = await pool.execute(`
        SELECT 
          -- Recent period (last 15 days)
          SUM(CASE WHEN report_date >= DATE_SUB(CURDATE(), INTERVAL 15 DAY) THEN leads ELSE 0 END) as recent_leads,
          SUM(CASE WHEN report_date >= DATE_SUB(CURDATE(), INTERVAL 15 DAY) THEN spent ELSE 0 END) as recent_spent,
          -- Previous period (16-30 days ago)
          SUM(CASE WHEN report_date BETWEEN DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND DATE_SUB(CURDATE(), INTERVAL 16 DAY) THEN leads ELSE 0 END) as previous_leads,
          SUM(CASE WHEN report_date BETWEEN DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND DATE_SUB(CURDATE(), INTERVAL 16 DAY) THEN spent ELSE 0 END) as previous_spent
        FROM reports 
        WHERE report_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        ${userRole !== 'super_admin' ? 'AND (created_by = ? OR created_by IS NULL)' : ''}
      `, params);

      // Calculate percentage changes
      const growth = growthStats[0];
      const leadsGrowth = growth.previous_leads > 0 
        ? ((growth.recent_leads - growth.previous_leads) / growth.previous_leads) * 100 
        : 0;
      const spentGrowth = growth.previous_spent > 0 
        ? ((growth.recent_spent - growth.previous_spent) / growth.previous_spent) * 100 
        : 0;

      return {
        campaigns: {
          total: campaignStats[0].total_campaigns || 0,
          active: campaignStats[0].active_campaigns || 0,
          inactive: campaignStats[0].inactive_campaigns || 0,
          unique_brands: campaignStats[0].unique_brands || 0,
          campaign_types_used: campaignStats[0].campaign_types_used || 0
        },
        reports: {
          total: reportStats[0].total_reports || 0,
          today: reportStats[0].reports_today || 0,
          this_week: reportStats[0].reports_this_week || 0,
          this_month: reportStats[0].reports_this_month || 0
        },
        performance: {
          total_leads: performanceStats[0].total_leads || 0,
          facebook_leads: performanceStats[0].total_facebook_leads || 0,
          zoho_leads: performanceStats[0].total_zoho_leads || 0,
          total_spent: parseFloat(performanceStats[0].total_spent || 0),
          avg_cost_per_lead: parseFloat(performanceStats[0].avg_cost_per_lead || 0),
          active_campaigns_with_data: performanceStats[0].active_campaigns_with_data || 0,
          last_report_date: performanceStats[0].last_report_date,
          first_report_date: performanceStats[0].first_report_date
        },
        cards: {
          total: cardStats[0].total_cards || 0,
          active: cardStats[0].active_cards || 0,
          total_balance: parseFloat(cardStats[0].total_balance || 0),
          avg_balance: parseFloat(cardStats[0].avg_balance || 0),
          users_with_cards: cardStats[0].users_with_cards || 0
        },
        growth: {
          leads: parseFloat(leadsGrowth.toFixed(1)),
          spent: parseFloat(spentGrowth.toFixed(1)),
          period: '15 days'
        }
      };
    } catch (error) {
      console.error('Error fetching overview stats:', error);
      throw new Error(`Failed to fetch overview statistics: ${error.message}`);
    }
  }

  /**
   * Get performance trends data for charts
   * @param {number} userId - Current user ID
   * @param {string} userRole - User role for data filtering
   * @param {number} days - Number of days to look back (default: 30)
   * @returns {Promise<Object>} Trends data
   */
  async getPerformanceTrends(userId, userRole, days = 30) {
    try {
      const roleFilter = userRole !== 'super_admin' ? 'AND (r.created_by = ? OR r.created_by IS NULL)' : '';
      const params = userRole !== 'super_admin' ? [days, userId] : [days];

      // Get daily performance trends
      const [trendsData] = await pool.execute(`
        SELECT 
          DATE(r.report_date) as date,
          SUM(r.leads) as total_leads,
          SUM(r.facebook_result) as facebook_leads,
          SUM(r.zoho_result) as zoho_leads,
          SUM(r.spent) as total_spent,
          COUNT(DISTINCT r.campaign_id) as active_campaigns,
          AVG(r.cost_per_lead) as avg_cost_per_lead
        FROM reports r
        WHERE r.report_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        ${roleFilter}
        GROUP BY DATE(r.report_date)
        ORDER BY r.report_date ASC
      `, params);

      // Format data for charts
      const chartData = {
        labels: trendsData.map(item => {
          const date = new Date(item.date);
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }),
        datasets: [
          {
            label: 'Total Leads',
            data: trendsData.map(item => parseInt(item.total_leads) || 0),
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4
          },
          {
            label: 'Facebook Leads',
            data: trendsData.map(item => parseInt(item.facebook_leads) || 0),
            borderColor: '#1877f2',
            backgroundColor: 'rgba(24, 119, 242, 0.1)',
            tension: 0.4
          },
          {
            label: 'Zoho Leads',
            data: trendsData.map(item => parseInt(item.zoho_leads) || 0),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4
          },
          {
            label: 'Spent (₹)',
            data: trendsData.map(item => parseFloat(item.total_spent) || 0),
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            tension: 0.4,
            yAxisID: 'y1'
          }
        ]
      };

      // Calculate summary
      const totalLeads = trendsData.reduce((sum, item) => sum + (parseInt(item.total_leads) || 0), 0);
      const totalSpent = trendsData.reduce((sum, item) => sum + (parseFloat(item.total_spent) || 0), 0);

      return {
        chart: chartData,
        raw_data: trendsData,
        summary: {
          total_leads: totalLeads,
          total_spent: parseFloat(totalSpent.toFixed(2)),
          avg_cost_per_lead: totalLeads > 0 ? parseFloat((totalSpent / totalLeads).toFixed(2)) : 0,
          period_days: days,
          data_points: trendsData.length
        }
      };
    } catch (error) {
      console.error('Error fetching performance trends:', error);
      throw new Error(`Failed to fetch performance trends: ${error.message}`);
    }
  }

  /**
   * Get top performing campaigns
   * @param {number} userId - Current user ID  
   * @param {string} userRole - User role for data filtering
   * @param {number} limit - Number of campaigns to return
   * @returns {Promise<Array>} Top campaigns data
   */
  async getTopCampaigns(userId, userRole, limit = 10) {
    try {
      const roleFilter = userRole !== 'super_admin' ? 'AND (r.created_by = ? OR r.created_by IS NULL)' : '';
      const params = userRole !== 'super_admin' ? [limit, userId] : [limit];

      const [campaigns] = await pool.execute(`
        SELECT 
          r.campaign_id,
          r.campaign_name,
          r.brand,
          r.campaign_type,
          SUM(r.leads) as total_leads,
          SUM(r.facebook_result) as facebook_leads,
          SUM(r.zoho_result) as zoho_leads,
          SUM(r.spent) as total_spent,
          AVG(r.cost_per_lead) as avg_cost_per_lead,
          COUNT(*) as report_days,
          MAX(r.report_date) as last_active_date,
          MIN(r.report_date) as first_active_date
        FROM reports r
        WHERE r.report_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        ${roleFilter}
        GROUP BY r.campaign_id, r.campaign_name, r.brand, r.campaign_type
        HAVING total_leads > 0
        ORDER BY total_leads DESC, total_spent DESC
        LIMIT ?
      `, params);

      return campaigns.map(campaign => ({
        campaign_id: campaign.campaign_id,
        campaign_name: campaign.campaign_name || 'Unknown Campaign',
        brand: campaign.brand || 'Unknown Brand',
        campaign_type: campaign.campaign_type || 'Unknown Type',
        total_leads: parseInt(campaign.total_leads) || 0,
        facebook_leads: parseInt(campaign.facebook_leads) || 0,
        zoho_leads: parseInt(campaign.zoho_leads) || 0,
        total_spent: parseFloat(campaign.total_spent) || 0,
        avg_cost_per_lead: parseFloat(campaign.avg_cost_per_lead) || 0,
        report_days: parseInt(campaign.report_days) || 0,
        performance_score: this.calculatePerformanceScore(campaign),
        last_active_date: campaign.last_active_date,
        first_active_date: campaign.first_active_date
      }));
    } catch (error) {
      console.error('Error fetching top campaigns:', error);
      throw new Error(`Failed to fetch top campaigns: ${error.message}`);
    }
  }

  /**
   * Get brand performance analysis
   * @param {number} userId - Current user ID
   * @param {string} userRole - User role for data filtering  
   * @param {number} limit - Number of brands to return
   * @returns {Promise<Array>} Brand performance data
   */
  async getBrandPerformance(userId, userRole, limit = 8) {
    try {
      const roleFilter = userRole !== 'super_admin' ? 'AND (r.created_by = ? OR r.created_by IS NULL)' : '';
      const params = userRole !== 'super_admin' ? [limit, userId] : [limit];

      const [brands] = await pool.execute(`
        SELECT 
          r.brand,
          COUNT(DISTINCT r.campaign_id) as campaigns_count,
          SUM(r.leads) as total_leads,
          SUM(r.facebook_result) as facebook_leads,
          SUM(r.zoho_result) as zoho_leads,
          SUM(r.spent) as total_spent,
          AVG(r.cost_per_lead) as avg_cost_per_lead,
          COUNT(*) as total_reports,
          MAX(r.report_date) as last_active_date,
          MIN(r.report_date) as first_active_date
        FROM reports r
        WHERE r.report_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
          AND r.brand IS NOT NULL AND r.brand != ''
        ${roleFilter}
        GROUP BY r.brand
        HAVING total_leads > 0
        ORDER BY total_spent DESC, total_leads DESC
        LIMIT ?
      `, params);

      return brands.map(brand => ({
        brand: brand.brand,
        campaigns_count: parseInt(brand.campaigns_count) || 0,
        total_leads: parseInt(brand.total_leads) || 0,
        facebook_leads: parseInt(brand.facebook_leads) || 0,
        zoho_leads: parseInt(brand.zoho_leads) || 0,
        total_spent: parseFloat(brand.total_spent) || 0,
        avg_cost_per_lead: parseFloat(brand.avg_cost_per_lead) || 0,
        total_reports: parseInt(brand.total_reports) || 0,
        efficiency_score: this.calculateBrandEfficiency(brand),
        last_active_date: brand.last_active_date,
        first_active_date: brand.first_active_date
      }));
    } catch (error) {
      console.error('Error fetching brand performance:', error);
      throw new Error(`Failed to fetch brand performance: ${error.message}`);
    }
  }

  /**
   * Get recent system activities
   * @param {number} userId - Current user ID
   * @param {string} userRole - User role for data filtering
   * @param {number} limit - Number of activities to return
   * @returns {Promise<Array>} Recent activities
   */
  async getRecentActivities(userId, userRole, limit = 20) {
    try {
      const roleFilter = userRole !== 'super_admin' ? 'AND (created_by = ? OR created_by IS NULL)' : '';
      const params = userRole !== 'super_admin' ? [limit, userId] : [limit];

      // Get various activity types
      const activities = [];

      // Recent campaigns
      const [campaignActivities] = await pool.execute(`
        SELECT 
          'campaign_created' as activity_type,
          name as entity_name,
          brand,
          created_at,
          created_by,
          'campaign' as entity_type
        FROM campaigns 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ${roleFilter}
        ORDER BY created_at DESC
        LIMIT ?
      `, params);

      // Recent reports  
      const [reportActivities] = await pool.execute(`
        SELECT 
          'report_generated' as activity_type,
          campaign_name as entity_name,
          brand,
          created_at,
          created_by,
          'report' as entity_type,
          leads,
          spent
        FROM reports 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ${roleFilter}
        ORDER BY created_at DESC
        LIMIT ?
      `, params);

      // Recent card updates (if user has access)
      let cardActivities = [];
      if (userRole === 'super_admin' || userRole === 'admin') {
        const [cardResults] = await pool.execute(`
          SELECT 
            'card_updated' as activity_type,
            card_name as entity_name,
            NULL as brand,
            updated_at as created_at,
            NULL as created_by,
            'card' as entity_type,
            current_balance
          FROM cards 
          WHERE updated_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            AND updated_at > created_at
          ORDER BY updated_at DESC
          LIMIT ?
        `, [Math.min(limit, 5)]);
        cardActivities = cardResults;
      }

      // Combine all activities
      activities.push(...campaignActivities, ...reportActivities, ...cardActivities);

      // Sort by date and limit
      activities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const limitedActivities = activities.slice(0, limit);

      return limitedActivities.map(activity => ({
        id: `${activity.entity_type}_${activity.created_at}_${Math.random().toString(36).substr(2, 9)}`,
        type: activity.activity_type,
        title: this.formatActivityTitle(activity),
        description: this.formatActivityDescription(activity),
        timestamp: activity.created_at,
        entity_type: activity.entity_type,
        entity_name: activity.entity_name,
        brand: activity.brand,
        user: activity.created_by ? `User ${activity.created_by}` : 'System',
        status: 'success'
      }));
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      throw new Error(`Failed to fetch recent activities: ${error.message}`);
    }
  }

  /**
   * Get real-time dashboard metrics for auto-refresh
   * @param {number} userId - Current user ID
   * @param {string} userRole - User role for data filtering
   * @returns {Promise<Object>} Real-time metrics
   */
  async getRealTimeMetrics(userId, userRole) {
    try {
      const roleFilter = userRole !== 'super_admin' ? 'AND (created_by = ? OR created_by IS NULL)' : '';
      const params = userRole !== 'super_admin' ? [userId] : [];

      // Get today's performance
      const [todayStats] = await pool.execute(`
        SELECT 
          SUM(leads) as today_leads,
          SUM(spent) as today_spent,
          COUNT(*) as today_reports,
          COUNT(DISTINCT campaign_id) as active_campaigns_today
        FROM reports 
        WHERE DATE(report_date) = CURDATE()
        ${roleFilter}
      `, params);

      // Get yesterday's performance for comparison
      const [yesterdayStats] = await pool.execute(`
        SELECT 
          SUM(leads) as yesterday_leads,
          SUM(spent) as yesterday_spent,
          COUNT(*) as yesterday_reports
        FROM reports 
        WHERE DATE(report_date) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
        ${roleFilter}
      `, params);

      // Get system health indicators
      const [systemHealth] = await pool.execute(`
        SELECT 
          COUNT(DISTINCT DATE(created_at)) as active_days_last_week,
          MAX(created_at) as last_activity,
          COUNT(*) as total_activities_last_week
        FROM reports 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ${roleFilter}
      `);

      const today = todayStats[0];
      const yesterday = yesterdayStats[0];

      return {
        today: {
          leads: parseInt(today.today_leads) || 0,
          spent: parseFloat(today.today_spent) || 0,
          reports: parseInt(today.today_reports) || 0,
          active_campaigns: parseInt(today.active_campaigns_today) || 0
        },
        yesterday: {
          leads: parseInt(yesterday.yesterday_leads) || 0,
          spent: parseFloat(yesterday.yesterday_spent) || 0,
          reports: parseInt(yesterday.yesterday_reports) || 0
        },
        comparisons: {
          leads_change: this.calculatePercentageChange(yesterday.yesterday_leads, today.today_leads),
          spent_change: this.calculatePercentageChange(yesterday.yesterday_spent, today.today_spent),
          reports_change: this.calculatePercentageChange(yesterday.yesterday_reports, today.today_reports)
        },
        system_health: {
          active_days_last_week: parseInt(systemHealth[0].active_days_last_week) || 0,
          last_activity: systemHealth[0].last_activity,
          total_activities_last_week: parseInt(systemHealth[0].total_activities_last_week) || 0,
          health_score: this.calculateSystemHealthScore(systemHealth[0])
        },
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching real-time metrics:', error);
      throw new Error(`Failed to fetch real-time metrics: ${error.message}`);
    }
  }

  // Helper methods
  calculatePerformanceScore(campaign) {
    const leads = parseInt(campaign.total_leads) || 0;
    const spent = parseFloat(campaign.total_spent) || 0;
    const costPerLead = parseFloat(campaign.avg_cost_per_lead) || 0;

    if (leads === 0) return 0;

    // Score based on leads volume (40%), cost efficiency (40%), and consistency (20%)
    const volumeScore = Math.min((leads / 100) * 40, 40); // Max 40 points for 100+ leads
    const efficiencyScore = costPerLead > 0 ? Math.max(40 - (costPerLead / 10), 0) : 0; // Better score for lower cost per lead
    const consistencyScore = campaign.report_days >= 7 ? 20 : (campaign.report_days / 7) * 20;

    return Math.round(volumeScore + efficiencyScore + consistencyScore);
  }

  calculateBrandEfficiency(brand) {
    const leads = parseInt(brand.total_leads) || 0;
    const spent = parseFloat(brand.total_spent) || 0;
    const campaigns = parseInt(brand.campaigns_count) || 1;

    if (leads === 0 || spent === 0) return 0;

    // Efficiency score: leads per rupee spent, adjusted for campaign diversity
    const leadsPerRupee = leads / spent;
    const diversityBonus = Math.min(campaigns * 0.1, 1); // Bonus for managing multiple campaigns

    return parseFloat((leadsPerRupee * (1 + diversityBonus) * 100).toFixed(2));
  }

  calculatePercentageChange(oldValue, newValue) {
    const old = parseFloat(oldValue) || 0;
    const current = parseFloat(newValue) || 0;

    if (old === 0) return current > 0 ? 100 : 0;

    return parseFloat(((current - old) / old * 100).toFixed(1));
  }

  calculateSystemHealthScore(healthData) {
    const activeDays = parseInt(healthData.active_days_last_week) || 0;
    const totalActivities = parseInt(healthData.total_activities_last_week) || 0;
    const lastActivity = new Date(healthData.last_activity || new Date());
    const hoursSinceLastActivity = (new Date() - lastActivity) / (1000 * 60 * 60);

    let score = 0;

    // Active days score (0-40 points)
    score += Math.min((activeDays / 7) * 40, 40);

    // Activity volume score (0-30 points)  
    score += Math.min((totalActivities / 50) * 30, 30);

    // Recency score (0-30 points)
    if (hoursSinceLastActivity <= 1) score += 30;
    else if (hoursSinceLastActivity <= 24) score += 20;
    else if (hoursSinceLastActivity <= 72) score += 10;

    return Math.round(score);
  }

  formatActivityTitle(activity) {
    switch (activity.activity_type) {
      case 'campaign_created':
        return 'New Campaign Created';
      case 'report_generated':
        return 'Report Generated';
      case 'card_updated':
        return 'Card Balance Updated';
      default:
        return 'System Activity';
    }
  }

  formatActivityDescription(activity) {
    switch (activity.activity_type) {
      case 'campaign_created':
        return `Campaign "${activity.entity_name}" created for ${activity.brand || 'Unknown Brand'}`;
      case 'report_generated':
        return `Performance report for "${activity.entity_name}" - ${activity.leads || 0} leads, ₹${activity.spent || 0} spent`;
      case 'card_updated':
        return `Card "${activity.entity_name}" balance updated to ₹${activity.current_balance || 0}`;
      default:
        return activity.entity_name || 'System activity occurred';
    }
  }
}

module.exports = new DashboardService();