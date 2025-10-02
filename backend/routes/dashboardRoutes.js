const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');

// GET /api/dashboard - Get dashboard overview data
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const userId = req.user.userId || req.user.id;
    const userRole = req.user.role_name || req.user.role?.name || 'user';

    // Get basic stats - campaigns table has is_enabled column, not is_active
    const [campaignStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_campaigns,
        COUNT(CASE WHEN status = 'active' OR status IS NULL THEN 1 END) as active_campaigns,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as paused_campaigns
      FROM campaigns 
      WHERE (is_enabled = 1 OR is_enabled IS NULL)
      ${userRole !== 'super_admin' ? 'AND (created_by = ? OR created_by IS NULL)' : ''}
    `, userRole !== 'super_admin' ? [userId] : []);

    // Get report stats - reports table has no is_active column
    const [reportStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_reports,
        COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as reports_today
      FROM reports 
      WHERE 1=1
      ${userRole !== 'super_admin' ? 'AND (created_by = ? OR created_by IS NULL)' : ''}
    `, userRole !== 'super_admin' ? [userId] : []);

    // Get campaign types summary
    const [campaignTypes] = await pool.execute(`
      SELECT 
        ct.type_name,
        COUNT(c.id) as campaign_count
      FROM campaign_types ct
      LEFT JOIN campaigns c ON ct.id = c.campaign_type_id AND (c.is_enabled = 1 OR c.is_enabled IS NULL)
      WHERE (ct.is_active = 1 OR ct.is_active IS NULL)
      ${userRole !== 'super_admin' ? 'AND (c.created_by = ? OR c.created_by IS NULL)' : ''}
      GROUP BY ct.id, ct.type_name
      ORDER BY campaign_count DESC
    `, userRole !== 'super_admin' ? [userId] : []);

    // Get recent activities (simplified)
    const [recentActivities] = await pool.execute(`
      SELECT 
        'Campaign Created' as activity_type,
        COALESCE(name, 'Unknown Campaign') as activity_description,
        created_at as activity_date,
        'campaign' as entity_type
      FROM campaigns 
      WHERE (is_enabled = 1 OR is_enabled IS NULL) 
      ${userRole !== 'super_admin' ? 'AND (created_by = ? OR created_by IS NULL)' : ''}
      ORDER BY created_at DESC 
      LIMIT 10
    `, userRole !== 'super_admin' ? [userId] : []);

    // Build dashboard data
    const dashboardData = {
      success: true,
      message: 'Dashboard data retrieved successfully',
      timestamp: new Date().toISOString(),
      data: {
        overview: {
          campaigns: {
            total: campaignStats[0].total_campaigns || 0,
            active: campaignStats[0].active_campaigns || 0,
            paused: campaignStats[0].paused_campaigns || 0
          },
          reports: {
            total: reportStats[0].total_reports || 0,
            today: reportStats[0].reports_today || 0
          }
        },
        campaignTypeBreakdown: campaignTypes.map(ct => ({
          type: ct.type_name,
          count: ct.campaign_count || 0
        })),
        recentActivity: recentActivities.map(activity => ({
          id: `${activity.entity_type}_${Date.now()}_${Math.random()}`,
          type: activity.activity_type.toLowerCase().replace(/\s+/g, '_'),
          title: activity.activity_type,
          description: activity.activity_description,
          timestamp: activity.activity_date,
          user: 'System'
        })),
        user: {
          id: userId,
          role: userRole,
          permissions: req.user.permissions || []
        }
      }
    };

    res.json(dashboardData);

  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/dashboard/stats - Get detailed statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const userId = req.user.userId;
    const userRole = req.user.role_name || 'user';

    // Get performance metrics
    const [performanceMetrics] = await pool.execute(`
      SELECT 
        AVG(CASE WHEN impressions > 0 THEN clicks / impressions * 100 ELSE 0 END) as avg_ctr,
        AVG(CASE WHEN clicks > 0 THEN cost / clicks ELSE 0 END) as avg_cpc,
        SUM(impressions) as total_impressions,
        SUM(clicks) as total_clicks,
        SUM(cost) as total_cost
      FROM campaigns 
      WHERE is_active = 1
      ${userRole !== 'super_admin' ? 'AND created_by = ?' : ''}
    `, userRole !== 'super_admin' ? [userId] : []);

    res.json({
      success: true,
      message: 'Dashboard statistics retrieved successfully',
      timestamp: new Date().toISOString(),
      data: {
        performance: {
          averageCTR: parseFloat((performanceMetrics[0].avg_ctr || 0).toFixed(2)),
          averageCPC: parseFloat((performanceMetrics[0].avg_cpc || 0).toFixed(2)),
          totalImpressions: performanceMetrics[0].total_impressions || 0,
          totalClicks: performanceMetrics[0].total_clicks || 0,
          totalCost: parseFloat((performanceMetrics[0].total_cost || 0).toFixed(2))
        }
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/dashboard/trends - Get performance trends data for charts
router.get('/trends', authenticateToken, async (req, res) => {
  try {
    const { pool } = require('../config/database');
    const userId = req.user.userId || req.user.id;
    const userRole = req.user.role_name || req.user.role?.name || 'user';
    
    // Get days parameter (default 30 days)
    const days = parseInt(req.query.days) || 30;
    const chartType = req.query.chart_type || 'line'; // line, bar, area, doughnut
    
    // Get performance trends over the specified period
    const [trendsData] = await pool.execute(`
      SELECT 
        DATE(r.report_date) as date,
        SUM(r.leads) as total_leads,
        SUM(r.spent) as total_spent,
        COUNT(DISTINCT r.campaign_id) as active_campaigns,
        AVG(r.cost_per_lead) as avg_cost_per_lead,
        SUM(r.facebook_result) as facebook_leads,
        SUM(r.zoho_result) as zoho_leads
      FROM reports r
      WHERE r.report_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        ${userRole !== 'super_admin' ? 'AND (r.created_by = ? OR r.created_by IS NULL)' : ''}
      GROUP BY DATE(r.report_date)
      ORDER BY r.report_date ASC
    `, userRole !== 'super_admin' ? [days, userId] : [days]);

    // Get campaign performance breakdown
    const [campaignBreakdown] = await pool.execute(`
      SELECT 
        r.campaign_name,
        SUM(r.leads) as total_leads,
        SUM(r.spent) as total_spent,
        AVG(r.cost_per_lead) as avg_cost_per_lead
      FROM reports r
      WHERE r.report_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        ${userRole !== 'super_admin' ? 'AND (r.created_by = ? OR r.created_by IS NULL)' : ''}
      GROUP BY r.campaign_name, r.campaign_id
      ORDER BY total_spent DESC
      LIMIT 10
    `, userRole !== 'super_admin' ? [days, userId] : [days]);

    // Get daily performance metrics
    const [dailyMetrics] = await pool.execute(`
      SELECT 
        DATE(r.report_date) as date,
        SUM(r.spent) as spent,
        SUM(r.leads) as leads,
        CASE 
          WHEN SUM(r.leads) > 0 THEN SUM(r.spent) / SUM(r.leads)
          ELSE 0
        END as cost_per_lead
      FROM reports r
      WHERE r.report_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
        ${userRole !== 'super_admin' ? 'AND (r.created_by = ? OR r.created_by IS NULL)' : ''}
      GROUP BY DATE(r.report_date)
      ORDER BY r.report_date ASC
    `, userRole !== 'super_admin' ? [days, userId] : [days]);

    // Format data for different chart types
    const formatDataForChartType = (data, type) => {
      switch (type) {
        case 'line':
        case 'area':
          return {
            labels: data.map(item => {
              const date = new Date(item.date);
              return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }),
            datasets: [
              {
                label: 'Leads',
                data: data.map(item => parseInt(item.total_leads) || 0),
                borderColor: '#3b82f6',
                backgroundColor: type === 'area' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                tension: 0.4,
                fill: type === 'area'
              },
              {
                label: 'Spent (₹)',
                data: data.map(item => parseFloat(item.total_spent) || 0),
                borderColor: '#10b981',
                backgroundColor: type === 'area' ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                tension: 0.4,
                fill: type === 'area',
                yAxisID: 'y1'
              }
            ]
          };
        
        case 'bar':
          return {
            labels: data.map(item => {
              const date = new Date(item.date);
              return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }),
            datasets: [
              {
                label: 'Leads',
                data: data.map(item => parseInt(item.total_leads) || 0),
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                borderColor: '#3b82f6',
                borderWidth: 1
              },
              {
                label: 'Spent (₹)',
                data: data.map(item => parseFloat(item.total_spent) || 0),
                backgroundColor: 'rgba(16, 185, 129, 0.8)',
                borderColor: '#10b981',
                borderWidth: 1
              }
            ]
          };
        
        case 'doughnut':
        case 'pie':
          const campaignData = campaignBreakdown.slice(0, 6); // Top 6 campaigns
          return {
            labels: campaignData.map(item => item.campaign_name || 'Unknown'),
            datasets: [{
              data: campaignData.map(item => parseFloat(item.total_spent) || 0),
              backgroundColor: [
                '#3b82f6',
                '#10b981', 
                '#f59e0b',
                '#ef4444',
                '#8b5cf6',
                '#06b6d4'
              ],
              borderWidth: 2,
              borderColor: '#ffffff'
            }]
          };
        
        default:
          return formatDataForChartType(data, 'line');
      }
    };

    // Calculate summary statistics
    const totalLeads = trendsData.reduce((sum, item) => sum + (parseInt(item.total_leads) || 0), 0);
    const totalSpent = trendsData.reduce((sum, item) => sum + (parseFloat(item.total_spent) || 0), 0);
    const avgCostPerLead = totalLeads > 0 ? totalSpent / totalLeads : 0;
    
    // Growth calculations (compare with previous period)
    const midPoint = Math.floor(trendsData.length / 2);
    const firstHalf = trendsData.slice(0, midPoint);
    const secondHalf = trendsData.slice(midPoint);
    
    const firstHalfLeads = firstHalf.reduce((sum, item) => sum + (parseInt(item.total_leads) || 0), 0);
    const secondHalfLeads = secondHalf.reduce((sum, item) => sum + (parseInt(item.total_leads) || 0), 0);
    const leadsGrowth = firstHalfLeads > 0 ? ((secondHalfLeads - firstHalfLeads) / firstHalfLeads) * 100 : 0;
    
    const firstHalfSpent = firstHalf.reduce((sum, item) => sum + (parseFloat(item.total_spent) || 0), 0);
    const secondHalfSpent = secondHalf.reduce((sum, item) => sum + (parseFloat(item.total_spent) || 0), 0);
    const spentGrowth = firstHalfSpent > 0 ? ((secondHalfSpent - firstHalfSpent) / firstHalfSpent) * 100 : 0;

    const responseData = {
      chart: formatDataForChartType(trendsData, chartType),
      summary: {
        totalLeads,
        totalSpent: parseFloat(totalSpent.toFixed(2)),
        avgCostPerLead: parseFloat(avgCostPerLead.toFixed(2)),
        activeCampaigns: Math.max(...trendsData.map(item => item.active_campaigns || 0), 0),
        dateRange: {
          from: trendsData[0]?.date || null,
          to: trendsData[trendsData.length - 1]?.date || null,
          days
        },
        growth: {
          leads: parseFloat(leadsGrowth.toFixed(1)),
          spent: parseFloat(spentGrowth.toFixed(1))
        }
      },
      campaignBreakdown: campaignBreakdown.map(campaign => ({
        name: campaign.campaign_name || 'Unknown',
        leads: parseInt(campaign.total_leads) || 0,
        spent: parseFloat(campaign.total_spent) || 0,
        costPerLead: parseFloat(campaign.avg_cost_per_lead) || 0
      })),
      chartOptions: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: `${days}-Day Performance Trends`
          }
        },
        scales: chartType === 'line' || chartType === 'area' ? {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Leads'
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Spent (₹)'
            },
            grid: {
              drawOnChartArea: false,
            },
          }
        } : chartType === 'bar' ? {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Value'
            }
          }
        } : {}
      }
    };

    res.json({
      success: true,
      message: `Retrieved ${days}-day performance trends`,
      timestamp: new Date().toISOString(),
      data: responseData
    });

  } catch (error) {
    console.error('Dashboard trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard trends',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
