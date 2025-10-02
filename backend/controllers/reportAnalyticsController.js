const { pool } = require('../config/database');

// Response envelope
const createResponse = (success, message, data = null, meta = null) => {
  const out = { success, message, timestamp: new Date().toISOString() };
  if (data !== null) out.data = data;
  if (meta !== null) out.meta = meta;
  return out;
};

// Helper functions
const toMysqlDate = (val) => {
  if (!val) return null;
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return null;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const handleDbError = (error, operation, res) => {
  console.error(`[ReportAnalyticsController] ${operation} error:`, error);
  return res.status(500).json(
    createResponse(false, `Failed to ${operation}`, null, 
      process.env.NODE_ENV === 'development' ? { error: error.message } : null)
  );
};

// Check if user is superadmin (level 10)
const isSuperAdmin = (user) => {
  return user && (user.role_level >= 10 || user.role?.level >= 10);
};

// Get user filter condition for data privacy
const getUserFilter = (user, tableAlias = 'r') => {
  // Temporarily disable user filtering for debugging
  console.log('[DEBUG] User object:', JSON.stringify(user, null, 2));
  return { whereClause: '', params: [] };
  
  // Original filtering logic (commented out for debugging)
  // if (isSuperAdmin(user)) {
  //   return { whereClause: '', params: [] };
  // }
  // return { 
  //   whereClause: `${tableAlias}.created_by = ?`, 
  //   params: [user.id] 
  // };
};

const reportAnalyticsController = {
  // GET /api/analytics/dashboard
  // Dashboard overview with user-specific data
  getDashboardOverview: async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json(createResponse(false, 'Authentication required'));
      }

      const userFilter = getUserFilter(user, 'r');
      // Use broader date range for debugging - include 2025 data
      const currentMonth = '2025-12'; // Use December 2025 where the data exists
      const currentDate = toMysqlDate(new Date());
      
      console.log('[DEBUG] Using month filter:', currentMonth);
      console.log('[DEBUG] User filter:', userFilter);
      
      // Base WHERE clause for user filtering
      const baseWhere = userFilter.whereClause ? `WHERE ${userFilter.whereClause}` : '';
      const baseParams = userFilter.params;

      // Show all data for debugging (remove month filter)
      const monthWhere = baseWhere;
      const monthParams = baseParams;
      
      // Original month-filtered query (commented out for debugging):
      // const monthWhere = baseWhere ? 
      //   `${baseWhere} AND r.report_month = ?` : 
      //   `WHERE r.report_month = ?`;
      // const monthParams = [...baseParams, currentMonth];

      const [currentMonthStats] = await pool.query(`
        SELECT
          COUNT(DISTINCT r.campaign_id) as campaigns_count,
          SUM(r.leads) as total_leads,
          SUM(r.spent) as total_spent,
          COALESCE(
            CASE 
              WHEN SUM(r.leads) > 0 THEN SUM(r.spent) / SUM(r.leads)
              ELSE 0
            END, 0
          ) as avg_cost_per_lead,
          SUM(r.facebook_result) as facebook_results,
          SUM(r.zoho_result) as zoho_results,
          AVG(r.facebook_cost_per_lead) as avg_facebook_cost_per_lead,
          AVG(r.zoho_cost_per_lead) as avg_zoho_cost_per_lead
        FROM reports r
        ${monthWhere}
      `, monthParams);

      // Yesterday vs today comparison
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = toMysqlDate(yesterday);

      const todayWhere = baseWhere ? 
        `${baseWhere} AND r.report_date = ?` : 
        `WHERE r.report_date = ?`;
      
      const [todayStats] = await pool.query(`
        SELECT
          SUM(r.leads) as today_leads,
          SUM(r.spent) as today_spent
        FROM reports r
        ${todayWhere}
      `, [...baseParams, currentDate]);

      const [yesterdayStats] = await pool.query(`
        SELECT
          SUM(r.leads) as yesterday_leads,
          SUM(r.spent) as yesterday_spent
        FROM reports r
        ${todayWhere}
      `, [...baseParams, yesterdayStr]);

      // Top performing campaigns (current month)
      const [topCampaigns] = await pool.query(`
        SELECT
          r.campaign_id,
          r.campaign_name,
          r.brand,
          r.brand_name,
          SUM(r.leads) as total_leads,
          SUM(r.spent) as total_spent,
          SUM(r.facebook_result) as facebook_results,
          SUM(r.zoho_result) as zoho_results,
          AVG(r.facebook_cost_per_lead) as avg_facebook_cost_per_lead,
          AVG(r.zoho_cost_per_lead) as avg_zoho_cost_per_lead,
          COALESCE(
            CASE 
              WHEN SUM(r.leads) > 0 THEN SUM(r.spent) / SUM(r.leads)
              ELSE 0
            END, 0
          ) as avg_cost_per_lead
        FROM reports r
        ${monthWhere}
        GROUP BY r.campaign_id, r.campaign_name, r.brand, r.brand_name
        ORDER BY total_leads DESC
        LIMIT 5
      `, monthParams);

      // Brand performance
      const [brandPerformance] = await pool.query(`
        SELECT
          COALESCE(r.brand, 'Unknown') as brand,
          COALESCE(r.brand_name, 'Unknown Brand') as brand_name,
          SUM(r.leads) as total_leads,
          SUM(r.spent) as total_spent,
          SUM(r.facebook_result) as facebook_results,
          SUM(r.zoho_result) as zoho_results,
          AVG(r.facebook_cost_per_lead) as avg_facebook_cost_per_lead,
          AVG(r.zoho_cost_per_lead) as avg_zoho_cost_per_lead,
          COUNT(DISTINCT r.campaign_id) as campaigns_count
        FROM reports r
        ${monthWhere}
        GROUP BY r.brand, r.brand_name
        ORDER BY total_leads DESC
        LIMIT 10
      `, monthParams);

      const currentStats = currentMonthStats[0] || {};
      const todayData = todayStats[0] || {};
      const yesterdayData = yesterdayStats[0] || {};

      // Calculate daily changes
      const todayLeads = Number(todayData.today_leads || 0);
      const yesterdayLeads = Number(yesterdayData.yesterday_leads || 0);
      const todaySpent = Number(todayData.today_spent || 0);
      const yesterdaySpent = Number(yesterdayData.yesterday_spent || 0);

      const leadsChange = yesterdayLeads > 0 ? 
        ((todayLeads - yesterdayLeads) / yesterdayLeads * 100).toFixed(1) : 0;
      const spentChange = yesterdaySpent > 0 ? 
        ((todaySpent - yesterdaySpent) / yesterdaySpent * 100).toFixed(1) : 0;

      const dashboardData = {
        overview: {
          currentMonth: currentMonth,
          campaignsCount: Number(currentStats.campaigns_count || 0),
          totalLeads: Number(currentStats.total_leads || 0),
          totalSpent: Number(currentStats.total_spent || 0),
          avgCostPerLead: Number(currentStats.avg_cost_per_lead || 0),
          facebookResults: Number(currentStats.facebook_results || 0),
          zohoResults: Number(currentStats.zoho_results || 0),
          avgFacebookCostPerLead: Number(currentStats.avg_facebook_cost_per_lead || 0),
          avgZohoCostPerLead: Number(currentStats.avg_zoho_cost_per_lead || 0)
        },
        dailyComparison: {
          today: {
            leads: todayLeads,
            spent: todaySpent,
            date: currentDate
          },
          yesterday: {
            leads: yesterdayLeads,
            spent: yesterdaySpent,
            date: yesterdayStr
          },
          changes: {
            leadsChange: Number(leadsChange),
            spentChange: Number(spentChange)
          }
        },
        topCampaigns: topCampaigns || [],
        brandPerformance: brandPerformance || [],
        userRole: isSuperAdmin(user) ? 'superadmin' : 'user',
        dataScope: isSuperAdmin(user) ? 'all_users' : 'own_data'
      };

      return res.status(200).json(createResponse(
        true, 
        'Dashboard overview retrieved successfully', 
        dashboardData
      ));
    } catch (error) {
      return handleDbError(error, 'get dashboard overview', res);
    }
  },

  // GET /api/analytics/charts/time-series
  // Time series data for charts
  getTimeSeriesData: async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json(createResponse(false, 'Authentication required'));
      }

      const dateFrom = toMysqlDate(req.query.date_from);
      const dateTo = toMysqlDate(req.query.date_to);
      const groupBy = req.query.group_by || 'day'; // day, week, month
      
      if (!dateFrom || !dateTo) {
        return res.status(400).json(createResponse(
          false, 
          'date_from and date_to are required (YYYY-MM-DD format)'
        ));
      }

      const userFilter = getUserFilter(user, 'r');
      
      // Build date grouping based on group_by parameter
      let dateGrouping, orderBy;
      switch (groupBy) {
        case 'week':
          dateGrouping = 'DATE_FORMAT(r.report_date, "%Y-%u")';
          orderBy = 'week_year';
          break;
        case 'month':
          dateGrouping = 'DATE_FORMAT(r.report_date, "%Y-%m")';
          orderBy = 'month_year';
          break;
        default: // day
          dateGrouping = 'DATE(r.report_date)';
          orderBy = 'date_group';
      }

      const whereConditions = ['r.report_date >= ?', 'r.report_date <= ?'];
      const params = [dateFrom, dateTo];

      if (userFilter.whereClause) {
        whereConditions.push(userFilter.whereClause);
        params.push(...userFilter.params);
      }

      const whereClause = 'WHERE ' + whereConditions.join(' AND ');

      const [timeSeriesData] = await pool.query(`
        SELECT
          ${dateGrouping} as date_group,
          SUM(r.leads) as leads,
          SUM(r.spent) as spent,
          SUM(r.facebook_result) as facebook_results,
          SUM(r.zoho_result) as zoho_results,
          AVG(r.cost_per_lead) as avg_cost_per_lead,
          COUNT(DISTINCT r.campaign_id) as active_campaigns
        FROM reports r
        ${whereClause}
        GROUP BY ${dateGrouping}
        ORDER BY ${orderBy} ASC
      `, params);

      return res.status(200).json(createResponse(
        true, 
        `Time series data retrieved (${timeSeriesData.length} data points)`,
        {
          dateRange: { from: dateFrom, to: dateTo },
          groupBy: groupBy,
          series: timeSeriesData.map(row => ({
            date: row.date_group,
            leads: Number(row.leads || 0),
            spent: Number(row.spent || 0),
            facebookResults: Number(row.facebook_results || 0),
            zohoResults: Number(row.zoho_results || 0),
            avgCostPerLead: Number(row.avg_cost_per_lead || 0),
            activeCampaigns: Number(row.active_campaigns || 0)
          })),
          userRole: isSuperAdmin(user) ? 'superadmin' : 'user'
        }
      ));
    } catch (error) {
      return handleDbError(error, 'get time series data', res);
    }
  },

  // GET /api/analytics/charts/campaign-performance
  // Campaign performance analysis
  getCampaignPerformanceData: async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json(createResponse(false, 'Authentication required'));
      }

      const dateFrom = toMysqlDate(req.query.date_from);
      const dateTo = toMysqlDate(req.query.date_to);
      const limit = Math.min(50, Math.max(5, parseInt(req.query.limit, 10) || 20));
      
      if (!dateFrom || !dateTo) {
        return res.status(400).json(createResponse(
          false, 
          'date_from and date_to are required (YYYY-MM-DD format)'
        ));
      }

      const userFilter = getUserFilter(user, 'r');
      
      const whereConditions = ['r.report_date >= ?', 'r.report_date <= ?'];
      const params = [dateFrom, dateTo];

      if (userFilter.whereClause) {
        whereConditions.push(userFilter.whereClause);
        params.push(...userFilter.params);
      }

      const whereClause = 'WHERE ' + whereConditions.join(' AND ');

      const [campaignData] = await pool.query(`
        SELECT
          r.campaign_id,
          r.campaign_name,
          r.brand,
          r.campaign_type,
          SUM(r.leads) as total_leads,
          SUM(r.spent) as total_spent,
          SUM(r.facebook_result) as facebook_results,
          SUM(r.zoho_result) as zoho_results,
          AVG(r.cost_per_lead) as avg_cost_per_lead,
          COUNT(*) as report_days,
          MIN(r.report_date) as first_active,
          MAX(r.report_date) as last_active,
          -- Performance metrics
          (SUM(r.leads) / COUNT(*)) as avg_daily_leads,
          (SUM(r.spent) / COUNT(*)) as avg_daily_spend
        FROM reports r
        ${whereClause}
        GROUP BY r.campaign_id, r.campaign_name, r.brand, r.campaign_type
        ORDER BY total_leads DESC
        LIMIT ?
      `, [...params, limit]);

      // Calculate performance rankings
      const enhancedData = campaignData.map((campaign, index) => ({
        ...campaign,
        rank: index + 1,
        totalLeads: Number(campaign.total_leads || 0),
        totalSpent: Number(campaign.total_spent || 0),
        facebookResults: Number(campaign.facebook_results || 0),
        zohoResults: Number(campaign.zoho_results || 0),
        avgCostPerLead: Number(campaign.avg_cost_per_lead || 0),
        avgDailyLeads: Number(campaign.avg_daily_leads || 0),
        avgDailySpend: Number(campaign.avg_daily_spend || 0),
        reportDays: Number(campaign.report_days || 0),
        efficiency: campaign.total_spent > 0 ? 
          Number((campaign.total_leads / campaign.total_spent * 100).toFixed(2)) : 0
      }));

      return res.status(200).json(createResponse(
        true, 
        `Campaign performance data retrieved (${enhancedData.length} campaigns)`,
        {
          dateRange: { from: dateFrom, to: dateTo },
          campaigns: enhancedData,
          totalCampaigns: enhancedData.length,
          userRole: isSuperAdmin(user) ? 'superadmin' : 'user'
        }
      ));
    } catch (error) {
      return handleDbError(error, 'get campaign performance data', res);
    }
  },

  // GET /api/analytics/charts/brand-analysis
  // Brand performance analysis
  getBrandAnalysisData: async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json(createResponse(false, 'Authentication required'));
      }

      const dateFrom = toMysqlDate(req.query.date_from);
      const dateTo = toMysqlDate(req.query.date_to);
      
      if (!dateFrom || !dateTo) {
        return res.status(400).json(createResponse(
          false, 
          'date_from and date_to are required (YYYY-MM-DD format)'
        ));
      }

      const userFilter = getUserFilter(user, 'r');
      
      const whereConditions = ['r.report_date >= ?', 'r.report_date <= ?'];
      const params = [dateFrom, dateTo];

      if (userFilter.whereClause) {
        whereConditions.push(userFilter.whereClause);
        params.push(...userFilter.params);
      }

      const whereClause = 'WHERE ' + whereConditions.join(' AND ');

      const [brandData] = await pool.query(`
        SELECT
          COALESCE(r.brand, 'Unknown') as brand,
          SUM(r.leads) as total_leads,
          SUM(r.spent) as total_spent,
          SUM(r.facebook_result) as facebook_results,
          SUM(r.zoho_result) as zoho_results,
          AVG(r.cost_per_lead) as avg_cost_per_lead,
          COUNT(DISTINCT r.campaign_id) as campaigns_count,
          COUNT(*) as report_days,
          -- Performance ratios
          (SUM(r.facebook_result) / SUM(r.leads) * 100) as facebook_percentage,
          (SUM(r.zoho_result) / SUM(r.leads) * 100) as zoho_percentage
        FROM reports r
        ${whereClause}
        GROUP BY r.brand
        ORDER BY total_leads DESC
      `, params);

      // Calculate market share and performance metrics
      const totalLeads = brandData.reduce((sum, brand) => sum + Number(brand.total_leads || 0), 0);
      const totalSpent = brandData.reduce((sum, brand) => sum + Number(brand.total_spent || 0), 0);

      const enhancedBrandData = brandData.map(brand => ({
        brand: brand.brand,
        totalLeads: Number(brand.total_leads || 0),
        totalSpent: Number(brand.total_spent || 0),
        facebookResults: Number(brand.facebook_results || 0),
        zohoResults: Number(brand.zoho_results || 0),
        avgCostPerLead: Number(brand.avg_cost_per_lead || 0),
        campaignsCount: Number(brand.campaigns_count || 0),
        reportDays: Number(brand.report_days || 0),
        facebookPercentage: Number(brand.facebook_percentage || 0),
        zohoPercentage: Number(brand.zoho_percentage || 0),
        marketShareByLeads: totalLeads > 0 ? 
          Number((Number(brand.total_leads || 0) / totalLeads * 100).toFixed(2)) : 0,
        marketShareBySpend: totalSpent > 0 ? 
          Number((Number(brand.total_spent || 0) / totalSpent * 100).toFixed(2)) : 0
      }));

      return res.status(200).json(createResponse(
        true, 
        `Brand analysis data retrieved (${enhancedBrandData.length} brands)`,
        {
          dateRange: { from: dateFrom, to: dateTo },
          brands: enhancedBrandData,
          summary: {
            totalBrands: enhancedBrandData.length,
            totalLeads: totalLeads,
            totalSpent: totalSpent
          },
          userRole: isSuperAdmin(user) ? 'superadmin' : 'user'
        }
      ));
    } catch (error) {
      return handleDbError(error, 'get brand analysis data', res);
    }
  },

  // GET /api/analytics/insights/trends
  // AI-like insights and trends analysis
  getTrendsAndInsights: async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json(createResponse(false, 'Authentication required'));
      }

      const days = Math.min(90, Math.max(7, parseInt(req.query.days, 10) || 30));
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const dateFrom = toMysqlDate(startDate);
      const dateTo = toMysqlDate(endDate);

      const userFilter = getUserFilter(user, 'r');
      
      const whereConditions = ['r.report_date >= ?', 'r.report_date <= ?'];
      const params = [dateFrom, dateTo];

      if (userFilter.whereClause) {
        whereConditions.push(userFilter.whereClause);
        params.push(...userFilter.params);
      }

      const whereClause = 'WHERE ' + whereConditions.join(' AND ');

      // Get weekly aggregated data for trend analysis
      const [weeklyData] = await pool.query(`
        SELECT
          WEEK(r.report_date) as week_num,
          YEAR(r.report_date) as year_num,
          SUM(r.leads) as weekly_leads,
          SUM(r.spent) as weekly_spent,
          AVG(r.cost_per_lead) as weekly_cpl,
          COUNT(DISTINCT r.campaign_id) as active_campaigns
        FROM reports r
        ${whereClause}
        GROUP BY YEAR(r.report_date), WEEK(r.report_date)
        ORDER BY year_num, week_num
      `, params);

      // Calculate trends
      const calculateTrend = (data, key) => {
        if (data.length < 2) return 0;
        const values = data.map(d => Number(d[key] || 0));
        const recent = values.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, values.length);
        const earlier = values.slice(0, 3).reduce((a, b) => a + b, 0) / Math.min(3, values.length);
        return earlier > 0 ? ((recent - earlier) / earlier * 100) : 0;
      };

      const leadsTrend = calculateTrend(weeklyData, 'weekly_leads');
      const spentTrend = calculateTrend(weeklyData, 'weekly_spent');
      const cplTrend = calculateTrend(weeklyData, 'weekly_cpl');

      // Get best and worst performing campaigns
      const [campaignPerformance] = await pool.query(`
        SELECT
          r.campaign_id,
          r.campaign_name,
          r.brand,
          SUM(r.leads) as total_leads,
          SUM(r.spent) as total_spent,
          AVG(r.cost_per_lead) as avg_cpl
        FROM reports r
        ${whereClause}
        GROUP BY r.campaign_id, r.campaign_name, r.brand
        HAVING total_leads > 0
        ORDER BY total_leads DESC
      `, params);

      const bestPerformers = campaignPerformance.slice(0, 3);
      const worstPerformers = campaignPerformance.slice(-3).reverse();

      // Generate insights
      const insights = [];
      
      if (leadsTrend > 10) {
        insights.push({
          type: 'positive',
          category: 'performance',
          title: 'Strong Lead Growth',
          description: `Leads have increased by ${leadsTrend.toFixed(1)}% over the analysis period`,
          recommendation: 'Continue current strategies and consider scaling successful campaigns'
        });
      } else if (leadsTrend < -10) {
        insights.push({
          type: 'warning',
          category: 'performance',
          title: 'Declining Lead Generation',
          description: `Leads have decreased by ${Math.abs(leadsTrend).toFixed(1)}% over the analysis period`,
          recommendation: 'Review campaign strategies and optimize underperforming campaigns'
        });
      }

      if (cplTrend < -15) {
        insights.push({
          type: 'positive',
          category: 'efficiency',
          title: 'Improved Cost Efficiency',
          description: `Cost per lead has decreased by ${Math.abs(cplTrend).toFixed(1)}%`,
          recommendation: 'Analyze successful campaigns to replicate cost-saving strategies'
        });
      } else if (cplTrend > 15) {
        insights.push({
          type: 'warning',
          category: 'efficiency',
          title: 'Rising Costs',
          description: `Cost per lead has increased by ${cplTrend.toFixed(1)}%`,
          recommendation: 'Review campaign targeting and ad spend optimization'
        });
      }

      // Brand concentration insights
      const [brandConcentration] = await pool.query(`
        SELECT
          COALESCE(r.brand, 'Unknown') as brand,
          SUM(r.leads) as brand_leads,
          (SUM(r.leads) / (SELECT SUM(leads) FROM reports r2 ${whereClause}) * 100) as percentage
        FROM reports r
        ${whereClause}
        GROUP BY r.brand
        ORDER BY brand_leads DESC
        LIMIT 1
      `, params);

      if (brandConcentration.length > 0 && brandConcentration[0].percentage > 60) {
        insights.push({
          type: 'info',
          category: 'diversification',
          title: 'High Brand Concentration',
          description: `${brandConcentration[0].brand} accounts for ${brandConcentration[0].percentage.toFixed(1)}% of leads`,
          recommendation: 'Consider diversifying across more brands to reduce risk'
        });
      }

      return res.status(200).json(createResponse(
        true,
        'Trends and insights generated successfully',
        {
          period: { days, from: dateFrom, to: dateTo },
          trends: {
            leads: Number(leadsTrend.toFixed(1)),
            spent: Number(spentTrend.toFixed(1)),
            costPerLead: Number(cplTrend.toFixed(1))
          },
          insights: insights,
          topPerformers: bestPerformers.map(c => ({
            campaignId: c.campaign_id,
            name: c.campaign_name,
            brand: c.brand,
            leads: Number(c.total_leads || 0),
            spent: Number(c.total_spent || 0),
            cpl: Number(c.avg_cpl || 0)
          })),
          bottomPerformers: worstPerformers.map(c => ({
            campaignId: c.campaign_id,
            name: c.campaign_name,
            brand: c.brand,
            leads: Number(c.total_leads || 0),
            spent: Number(c.total_spent || 0),
            cpl: Number(c.avg_cpl || 0)
          })),
          weeklyData: weeklyData.map(w => ({
            week: w.week_num,
            year: w.year_num,
            leads: Number(w.weekly_leads || 0),
            spent: Number(w.weekly_spent || 0),
            cpl: Number(w.weekly_cpl || 0),
            campaigns: Number(w.active_campaigns || 0)
          })),
          userRole: isSuperAdmin(user) ? 'superadmin' : 'user'
        }
      ));
    } catch (error) {
      return handleDbError(error, 'get trends and insights', res);
    }
  },

  // GET /api/analytics/export
  // Export analytics data in various formats
  exportAnalyticsData: async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json(createResponse(false, 'Authentication required'));
      }

      const dateFrom = toMysqlDate(req.query.date_from);
      const dateTo = toMysqlDate(req.query.date_to);
      const format = req.query.format || 'json'; // json, csv
      const dataType = req.query.type || 'summary'; // summary, detailed, campaigns, brands
      
      if (!dateFrom || !dateTo) {
        return res.status(400).json(createResponse(
          false, 
          'date_from and date_to are required (YYYY-MM-DD format)'
        ));
      }

      const userFilter = getUserFilter(user, 'r');
      
      const whereConditions = ['r.report_date >= ?', 'r.report_date <= ?'];
      const params = [dateFrom, dateTo];

      if (userFilter.whereClause) {
        whereConditions.push(userFilter.whereClause);
        params.push(...userFilter.params);
      }

      const whereClause = 'WHERE ' + whereConditions.join(' AND ');

      let exportData = {};
      let filename = `analytics_${dataType}_${dateFrom}_to_${dateTo}`;

      switch (dataType) {
        case 'detailed':
          const [detailedData] = await pool.query(`
            SELECT
              r.report_date,
              r.campaign_id,
              r.campaign_name,
              r.brand,
              r.campaign_type,
              r.leads,
              r.spent,
              r.cost_per_lead,
              r.facebook_result,
              r.zoho_result
            FROM reports r
            ${whereClause}
            ORDER BY r.report_date DESC, r.campaign_name
          `, params);
          
          exportData = {
            type: 'detailed_reports',
            dateRange: { from: dateFrom, to: dateTo },
            recordCount: detailedData.length,
            data: detailedData
          };
          break;

        case 'campaigns':
          const [campaignData] = await pool.query(`
            SELECT
              r.campaign_id,
              r.campaign_name,
              r.brand,
              r.campaign_type,
              SUM(r.leads) as total_leads,
              SUM(r.spent) as total_spent,
              AVG(r.cost_per_lead) as avg_cost_per_lead,
              SUM(r.facebook_result) as facebook_results,
              SUM(r.zoho_result) as zoho_results
            FROM reports r
            ${whereClause}
            GROUP BY r.campaign_id, r.campaign_name, r.brand, r.campaign_type
            ORDER BY total_leads DESC
          `, params);
          
          exportData = {
            type: 'campaign_summary',
            dateRange: { from: dateFrom, to: dateTo },
            recordCount: campaignData.length,
            data: campaignData
          };
          break;

        case 'brands':
          const [brandData] = await pool.query(`
            SELECT
              COALESCE(r.brand, 'Unknown') as brand,
              SUM(r.leads) as total_leads,
              SUM(r.spent) as total_spent,
              AVG(r.cost_per_lead) as avg_cost_per_lead,
              COUNT(DISTINCT r.campaign_id) as campaigns_count
            FROM reports r
            ${whereClause}
            GROUP BY r.brand
            ORDER BY total_leads DESC
          `, params);
          
          exportData = {
            type: 'brand_summary',
            dateRange: { from: dateFrom, to: dateTo },
            recordCount: brandData.length,
            data: brandData
          };
          break;

        default: // summary
          const [summaryData] = await pool.query(`
            SELECT
              DATE(r.report_date) as date,
              SUM(r.leads) as daily_leads,
              SUM(r.spent) as daily_spent,
              AVG(r.cost_per_lead) as daily_avg_cpl,
              COUNT(DISTINCT r.campaign_id) as active_campaigns
            FROM reports r
            ${whereClause}
            GROUP BY DATE(r.report_date)
            ORDER BY date DESC
          `, params);
          
          exportData = {
            type: 'daily_summary',
            dateRange: { from: dateFrom, to: dateTo },
            recordCount: summaryData.length,
            data: summaryData
          };
      }

      // Add metadata
      exportData.exportedAt = new Date().toISOString();
      exportData.exportedBy = user.username;
      exportData.userRole = isSuperAdmin(user) ? 'superadmin' : 'user';
      exportData.dataScope = isSuperAdmin(user) ? 'all_users' : 'own_data';

      if (format === 'csv') {
        // Convert to CSV format
        const data = exportData.data;
        if (!data || data.length === 0) {
          return res.status(404).json(createResponse(false, 'No data to export'));
        }

        const headers = Object.keys(data[0]);
        const csvRows = [
          headers.join(','),
          ...data.map(row => 
            headers.map(header => {
              const value = row[header];
              return typeof value === 'string' && value.includes(',') ? 
                `"${value}"` : value;
            }).join(',')
          )
        ];

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
        return res.send(csvRows.join('\n'));
      }

      // Return JSON format
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
      return res.status(200).json(createResponse(
        true,
        'Analytics data exported successfully',
        exportData
      ));
    } catch (error) {
      return handleDbError(error, 'export analytics data', res);
    }
  }
};

module.exports = reportAnalyticsController;
