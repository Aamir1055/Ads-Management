const WebSocket = require('ws');
const { pool } = require('../config/database');
const jwt = require('jsonwebtoken');

class ReportAnalyticsWebSocket {
  constructor(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws/report-analytics'
    });
    
    this.clients = new Map(); // Map<ws, {userId, username, roleLevel, filters}>
    this.updateInterval = null;
    this.isRunning = false;
    
    this.setupWebSocketServer();
    this.startPeriodicUpdates();
  }

  setupWebSocketServer() {
    this.wss.on('connection', (ws, request) => {
      console.log(`[Report Analytics WS] New connection from ${request.socket.remoteAddress}`);
      
      // Handle authentication
      this.authenticateConnection(ws, request);
      
      // Handle client messages
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleClientMessage(ws, data);
        } catch (error) {
          console.error('[Report Analytics WS] Error parsing message:', error);
          this.sendError(ws, 'Invalid message format');
        }
      });
      
      // Handle client disconnect
      ws.on('close', () => {
        console.log('[Report Analytics WS] Client disconnected');
        this.clients.delete(ws);
      });
      
      // Handle errors
      ws.on('error', (error) => {
        console.error('[Report Analytics WS] Client error:', error);
        this.clients.delete(ws);
      });
    });
    
    console.log('[Report Analytics WS] Server initialized on /ws/report-analytics');
  }

  async authenticateConnection(ws, request) {
    try {
      // Extract token from query parameters or headers
      const url = new URL(request.url, 'http://localhost');
      let token = url.searchParams.get('token') || request.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        this.sendError(ws, 'Authentication token required');
        ws.close(1008, 'Authentication required');
        return;
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user information from database
      const [userRows] = await pool.query(`
        SELECT u.id, u.username, r.name as role_name, r.level as role_level
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.id = ? AND u.is_active = 1
      `, [decoded.id]);

      if (userRows.length === 0) {
        this.sendError(ws, 'User not found or inactive');
        ws.close(1008, 'Invalid user');
        return;
      }

      const user = userRows[0];
      
      // Store client information
      this.clients.set(ws, {
        userId: user.id,
        username: user.username,
        roleName: user.role_name,
        roleLevel: user.role_level,
        isSuperAdmin: user.role_level >= 10,
        filters: {},
        lastActivity: Date.now()
      });

      // Send welcome message with user context
      this.sendMessage(ws, {
        type: 'welcome',
        message: 'Connected to Report Analytics WebSocket',
        user: {
          id: user.id,
          username: user.username,
          role: user.role_name,
          canViewAllData: user.role_level >= 10
        },
        timestamp: new Date().toISOString()
      });

      // Send initial analytics data
      await this.sendInitialData(ws);
      
    } catch (error) {
      console.error('[Report Analytics WS] Authentication error:', error);
      this.sendError(ws, 'Authentication failed');
      ws.close(1008, 'Authentication failed');
    }
  }

  async sendInitialData(ws) {
    try {
      const clientInfo = this.clients.get(ws);
      if (!clientInfo) return;

      const analyticsData = await this.getRealtimeAnalytics(clientInfo);
      
      this.sendMessage(ws, {
        type: 'initial_data',
        data: analyticsData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[Report Analytics WS] Error sending initial data:', error);
      this.sendError(ws, 'Failed to load initial analytics data');
    }
  }

  handleClientMessage(ws, data) {
    const clientInfo = this.clients.get(ws);
    if (!clientInfo) {
      this.sendError(ws, 'Client not authenticated');
      return;
    }

    // Update last activity
    clientInfo.lastActivity = Date.now();

    switch (data.type) {
      case 'subscribe':
        this.handleSubscription(ws, data);
        break;
      case 'request_update':
        this.sendUpdateToClient(ws);
        break;
      case 'set_filters':
        this.handleSetFilters(ws, data);
        break;
      case 'ping':
        this.sendMessage(ws, { 
          type: 'pong', 
          timestamp: new Date().toISOString() 
        });
        break;
      default:
        this.sendError(ws, 'Unknown message type');
    }
  }

  handleSubscription(ws, data) {
    const clientInfo = this.clients.get(ws);
    if (!clientInfo) return;

    // Update subscription preferences
    clientInfo.updateFrequency = Math.max(5000, data.updateFrequency || 30000); // Min 5 seconds
    clientInfo.subscribedMetrics = data.metrics || ['overview', 'trends'];
    
    this.sendMessage(ws, {
      type: 'subscription_confirmed',
      updateFrequency: clientInfo.updateFrequency,
      subscribedMetrics: clientInfo.subscribedMetrics,
      filters: clientInfo.filters
    });
  }

  handleSetFilters(ws, data) {
    const clientInfo = this.clients.get(ws);
    if (!clientInfo) return;

    // Validate and set filters
    const filters = data.filters || {};
    
    // Sanitize date filters
    if (filters.dateFrom) {
      filters.dateFrom = this.toMysqlDate(filters.dateFrom);
    }
    if (filters.dateTo) {
      filters.dateTo = this.toMysqlDate(filters.dateTo);
    }

    // Sanitize other filters
    if (filters.campaignId) {
      filters.campaignId = parseInt(filters.campaignId, 10) || null;
    }
    if (filters.brand) {
      filters.brand = String(filters.brand).trim() || null;
    }

    clientInfo.filters = filters;
    
    this.sendMessage(ws, {
      type: 'filters_updated',
      filters: clientInfo.filters,
      timestamp: new Date().toISOString()
    });

    // Send updated data with new filters
    this.sendUpdateToClient(ws);
  }

  async sendUpdateToClient(ws) {
    try {
      const clientInfo = this.clients.get(ws);
      if (!clientInfo) return;

      const analyticsData = await this.getRealtimeAnalytics(clientInfo);
      
      this.sendMessage(ws, {
        type: 'data_update',
        data: analyticsData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[Report Analytics WS] Error sending update:', error);
      this.sendError(ws, 'Failed to get analytics update');
    }
  }

  startPeriodicUpdates() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.updateInterval = setInterval(async () => {
      if (this.clients.size === 0) return;
      
      try {
        // Send updates to all connected clients
        for (const [ws, clientInfo] of this.clients.entries()) {
          if (ws.readyState === WebSocket.OPEN) {
            try {
              const analyticsData = await this.getRealtimeAnalytics(clientInfo);
              
              this.sendMessage(ws, {
                type: 'realtime_update',
                data: analyticsData,
                timestamp: new Date().toISOString()
              });
            } catch (error) {
              console.error('[Report Analytics WS] Error sending update to client:', error);
            }
          } else {
            this.clients.delete(ws);
          }
        }
      } catch (error) {
        console.error('[Report Analytics WS] Error in periodic update:', error);
      }
    }, 30000); // Update every 30 seconds
    
    console.log('[Report Analytics WS] Periodic updates started');
  }

  stopPeriodicUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      this.isRunning = false;
      console.log('[Report Analytics WS] Periodic updates stopped');
    }
  }

  async getRealtimeAnalytics(clientInfo) {
    try {
      const { userId, isSuperAdmin, filters = {} } = clientInfo;
      
      // Get current date range (last 30 days by default)
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      
      const dateFrom = filters.dateFrom || this.toMysqlDate(thirtyDaysAgo);
      const dateTo = filters.dateTo || this.toMysqlDate(now);
      
      // Build WHERE clause based on user permissions and filters
      const whereConditions = ['r.report_date >= ?', 'r.report_date <= ?'];
      const params = [dateFrom, dateTo];
      
      // Add user privacy filter for non-superadmins
      if (!isSuperAdmin) {
        whereConditions.push('r.created_by = ?');
        params.push(userId);
      }
      
      // Add optional filters
      if (filters.brand) {
        whereConditions.push('r.brand = ?');
        params.push(filters.brand);
      }
      
      if (filters.campaignId) {
        whereConditions.push('r.campaign_id = ?');
        params.push(filters.campaignId);
      }
      
      const whereClause = 'WHERE ' + whereConditions.join(' AND ');
      
      // Get summary metrics
      const [summaryRows] = await pool.query(`
        SELECT
          COUNT(DISTINCT r.campaign_id) as total_campaigns,
          SUM(r.leads) as total_leads,
          SUM(r.spent) as total_spent,
          AVG(r.cost_per_lead) as avg_cost_per_lead,
          SUM(r.facebook_result) as total_facebook_results,
          SUM(r.zoho_result) as total_zoho_results
        FROM reports r
        ${whereClause}
      `, params);
      
      // Get recent trends (last 7 days)
      const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
      const trendParams = [...params.slice(0, -2), this.toMysqlDate(sevenDaysAgo), this.toMysqlDate(now)];
      if (!isSuperAdmin) trendParams.push(userId);
      if (filters.brand) trendParams.push(filters.brand);
      if (filters.campaignId) trendParams.push(filters.campaignId);
      
      const [trendsRows] = await pool.query(`
        SELECT
          DATE(r.report_date) as date,
          SUM(r.leads) as leads,
          SUM(r.spent) as spent,
          AVG(r.cost_per_lead) as cpl
        FROM reports r
        ${whereClause.replace('r.report_date >= ?', 'r.report_date >= ?').replace('r.report_date <= ?', 'r.report_date <= ?')}
        GROUP BY DATE(r.report_date)
        ORDER BY date ASC
      `, trendParams);
      
      // Get top performing campaigns
      const [campaignsRows] = await pool.query(`
        SELECT
          r.campaign_id,
          r.campaign_name,
          r.brand,
          SUM(r.leads) as leads,
          SUM(r.spent) as spent,
          AVG(r.cost_per_lead) as cpl
        FROM reports r
        ${whereClause}
        GROUP BY r.campaign_id, r.campaign_name, r.brand
        ORDER BY SUM(r.leads) DESC
        LIMIT 5
      `, params);
      
      // Calculate performance indicators
      const summary = summaryRows[0] || {};
      const totalLeads = Number(summary.total_leads || 0);
      const totalSpent = Number(summary.total_spent || 0);
      const avgCPL = Number(summary.avg_cost_per_lead || 0);
      
      // Mock performance changes (in a real implementation, compare with previous period)
      const performanceChanges = {
        leadsChange: this.calculateMockChange(totalLeads),
        spentChange: this.calculateMockChange(totalSpent),
        cplChange: this.calculateMockChange(avgCPL, true), // inverse for CPL
        campaignsChange: Math.floor(Math.random() * 5) - 2 // -2 to +2
      };
      
      return {
        summary: {
          totalCampaigns: Number(summary.total_campaigns || 0),
          totalLeads: totalLeads,
          totalSpent: totalSpent,
          avgCostPerLead: avgCPL,
          totalFacebookResults: Number(summary.total_facebook_results || 0),
          totalZohoResults: Number(summary.total_zoho_results || 0),
          changes: performanceChanges
        },
        trends: trendsRows.map(row => ({
          date: row.date,
          leads: Number(row.leads || 0),
          spent: Number(row.spent || 0),
          cpl: Number(row.cpl || 0)
        })),
        topCampaigns: campaignsRows.map(row => ({
          campaignId: row.campaign_id,
          campaignName: row.campaign_name,
          brand: row.brand,
          leads: Number(row.leads || 0),
          spent: Number(row.spent || 0),
          cpl: Number(row.cpl || 0)
        })),
        filters: filters,
        dateRange: { from: dateFrom, to: dateTo },
        dataScope: isSuperAdmin ? 'all_users' : 'own_data',
        lastUpdated: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('[Report Analytics WS] Error getting realtime analytics:', error);
      throw error;
    }
  }

  calculateMockChange(value, inverse = false) {
    // Generate realistic percentage change (-15% to +20%)
    const change = (Math.random() * 35) - 15;
    const adjustedChange = inverse ? -change : change;
    return {
      percentage: Math.round(adjustedChange * 10) / 10,
      isPositive: adjustedChange > 0,
      formatted: `${adjustedChange > 0 ? '+' : ''}${Math.round(adjustedChange * 10) / 10}%`
    };
  }

  toMysqlDate(date) {
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  sendMessage(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  sendError(ws, message) {
    this.sendMessage(ws, {
      type: 'error',
      message: message,
      timestamp: new Date().toISOString()
    });
  }

  broadcastToRole(roleLevel, message) {
    const messageStr = JSON.stringify({
      type: 'broadcast',
      data: message,
      timestamp: new Date().toISOString()
    });
    
    this.clients.forEach((clientInfo, ws) => {
      if (clientInfo.roleLevel >= roleLevel && ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    });
  }

  broadcastSystemMessage(message, targetRole = null) {
    const systemMessage = JSON.stringify({
      type: 'system_message',
      message: message,
      timestamp: new Date().toISOString()
    });
    
    this.clients.forEach((clientInfo, ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        if (!targetRole || clientInfo.roleName === targetRole) {
          ws.send(systemMessage);
        }
      }
    });
  }

  getStats() {
    const connectedClients = Array.from(this.clients.values());
    return {
      connectedClients: this.clients.size,
      isRunning: this.isRunning,
      updateInterval: this.updateInterval ? 30000 : null,
      clientsByRole: connectedClients.reduce((acc, client) => {
        acc[client.roleName] = (acc[client.roleName] || 0) + 1;
        return acc;
      }, {}),
      superAdmins: connectedClients.filter(c => c.isSuperAdmin).length,
      regularUsers: connectedClients.filter(c => !c.isSuperAdmin).length
    };
  }

  shutdown() {
    console.log('[Report Analytics WS] Shutting down...');
    
    this.stopPeriodicUpdates();
    
    // Notify all clients of shutdown
    this.clients.forEach((clientInfo, ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        this.sendMessage(ws, {
          type: 'server_shutdown',
          message: 'Server is shutting down'
        });
        ws.close();
      }
    });
    
    this.clients.clear();
    
    // Close the WebSocket server
    this.wss.close(() => {
      console.log('[Report Analytics WS] Server closed');
    });
  }
}

module.exports = ReportAnalyticsWebSocket;
