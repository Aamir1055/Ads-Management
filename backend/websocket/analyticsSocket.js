const WebSocket = require('ws');
const { pool } = require('../config/database');

class AnalyticsWebSocket {
  constructor(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws/analytics'
    });
    
    this.clients = new Set();
    this.updateInterval = null;
    this.isRunning = false;
    
    this.setupWebSocketServer();
    this.startPeriodicUpdates();
  }

  setupWebSocketServer() {
    this.wss.on('connection', (ws, request) => {
      console.log(`[Analytics WebSocket] New client connected from ${request.socket.remoteAddress}`);
      
      this.clients.add(ws);
      
      // Send initial data to the new client
      this.sendInitialData(ws);
      
      // Handle client messages
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleClientMessage(ws, data);
        } catch (error) {
          console.error('[Analytics WebSocket] Error parsing client message:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format'
          }));
        }
      });
      
      // Handle client disconnect
      ws.on('close', () => {
        console.log('[Analytics WebSocket] Client disconnected');
        this.clients.delete(ws);
      });
      
      // Handle errors
      ws.on('error', (error) => {
        console.error('[Analytics WebSocket] Client error:', error);
        this.clients.delete(ws);
      });
      
      // Send welcome message
      ws.send(JSON.stringify({
        type: 'welcome',
        message: 'Connected to Analytics WebSocket',
        timestamp: new Date().toISOString()
      }));
    });
    
    console.log('[Analytics WebSocket] Server initialized on /ws/analytics');
  }

  async sendInitialData(ws) {
    try {
      const realtimeData = await this.getRealtimeAnalytics();
      ws.send(JSON.stringify({
        type: 'initial_data',
        data: realtimeData,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('[Analytics WebSocket] Error sending initial data:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to load initial analytics data'
      }));
    }
  }

  handleClientMessage(ws, data) {
    switch (data.type) {
      case 'subscribe':
        this.handleSubscription(ws, data);
        break;
      case 'request_update':
        this.sendUpdateToClient(ws);
        break;
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
        break;
      default:
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Unknown message type'
        }));
    }
  }

  handleSubscription(ws, data) {
    // Store client preferences for filtered updates
    ws.filters = data.filters || {};
    ws.updateFrequency = data.updateFrequency || 30000; // Default 30 seconds
    
    ws.send(JSON.stringify({
      type: 'subscription_confirmed',
      filters: ws.filters,
      updateFrequency: ws.updateFrequency
    }));
  }

  async sendUpdateToClient(ws) {
    try {
      const realtimeData = await this.getRealtimeAnalytics(ws.filters);
      ws.send(JSON.stringify({
        type: 'data_update',
        data: realtimeData,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('[Analytics WebSocket] Error sending update to client:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to get analytics update'
      }));
    }
  }

  startPeriodicUpdates() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.updateInterval = setInterval(async () => {
      if (this.clients.size === 0) return;
      
      try {
        const realtimeData = await this.getRealtimeAnalytics();
        
        // Send updates to all connected clients
        this.clients.forEach(async (ws) => {
          if (ws.readyState === WebSocket.OPEN) {
            try {
              // Get filtered data if client has filters
              const clientData = ws.filters ? await this.getRealtimeAnalytics(ws.filters) : realtimeData;
              
              ws.send(JSON.stringify({
                type: 'realtime_update',
                data: clientData,
                timestamp: new Date().toISOString()
              }));
            } catch (error) {
              console.error('[Analytics WebSocket] Error sending update to client:', error);
            }
          } else {
            this.clients.delete(ws);
          }
        });
      } catch (error) {
        console.error('[Analytics WebSocket] Error in periodic update:', error);
      }
    }, 30000); // Update every 30 seconds
    
    console.log('[Analytics WebSocket] Periodic updates started');
  }

  stopPeriodicUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      this.isRunning = false;
      console.log('[Analytics WebSocket] Periodic updates stopped');
    }
  }

  async getRealtimeAnalytics(filters = {}) {
    try {
      // Get current date range (last 30 days by default)
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      
      const dateFrom = filters.dateFrom || this.toMysqlDate(thirtyDaysAgo);
      const dateTo = filters.dateTo || this.toMysqlDate(now);
      
      // Build WHERE clause for filters
      const where = ['r.report_date >= ?', 'r.report_date <= ?'];
      const params = [dateFrom, dateTo];
      
      if (filters.brand) {
        where.push('r.brand = ?');
        params.push(filters.brand);
      }
      
      if (filters.campaignId) {
        where.push('r.campaign_id = ?');
        params.push(filters.campaignId);
      }
      
      const whereClause = 'WHERE ' + where.join(' AND ');
      
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
      const [trendsRows] = await pool.query(`
        SELECT
          DATE(r.report_date) as date,
          SUM(r.leads) as leads,
          SUM(r.spent) as spent
        FROM reports r
        WHERE r.report_date >= ? AND r.report_date <= ?
        ${filters.brand ? 'AND r.brand = ?' : ''}
        ${filters.campaignId ? 'AND r.campaign_id = ?' : ''}
        GROUP BY DATE(r.report_date)
        ORDER BY DATE(r.report_date) ASC
      `, [
        this.toMysqlDate(sevenDaysAgo),
        this.toMysqlDate(now),
        ...(filters.brand ? [filters.brand] : []),
        ...(filters.campaignId ? [filters.campaignId] : [])
      ].filter(Boolean));
      
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
      
      // Get brand performance
      const [brandsRows] = await pool.query(`
        SELECT
          COALESCE(r.brand, 'Unknown') as brand,
          SUM(r.leads) as leads,
          SUM(r.spent) as spent
        FROM reports r
        ${whereClause}
        GROUP BY r.brand
        ORDER BY SUM(r.leads) DESC
        LIMIT 10
      `, params);
      
      // Calculate performance indicators
      const summary = summaryRows[0] || {};
      const totalLeads = Number(summary.total_leads || 0);
      const totalSpent = Number(summary.total_spent || 0);
      const avgCPL = Number(summary.avg_cost_per_lead || 0);
      
      // Mock performance changes (in a real app, compare with previous period)
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
          spent: Number(row.spent || 0)
        })),
        topCampaigns: campaignsRows.map(row => ({
          campaignId: row.campaign_id,
          campaignName: row.campaign_name,
          brand: row.brand,
          leads: Number(row.leads || 0),
          spent: Number(row.spent || 0),
          cpl: Number(row.cpl || 0)
        })),
        brandPerformance: brandsRows.map(row => ({
          brand: row.brand,
          leads: Number(row.leads || 0),
          spent: Number(row.spent || 0)
        })),
        lastUpdated: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('[Analytics WebSocket] Error getting realtime analytics:', error);
      throw error;
    }
  }

  calculateMockChange(value, inverse = false) {
    // Generate mock percentage change (-10% to +15%)
    const change = (Math.random() * 25) - 10;
    const adjustedChange = inverse ? -change : change;
    return {
      percentage: Math.round(adjustedChange * 10) / 10,
      isPositive: adjustedChange > 0,
      formatted: `${adjustedChange > 0 ? '+' : ''}${Math.round(adjustedChange * 10) / 10}%`
    };
  }

  toMysqlDate(date) {
    const d = new Date(date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  broadcastAlert(alert) {
    const message = JSON.stringify({
      type: 'alert',
      data: alert,
      timestamp: new Date().toISOString()
    });
    
    this.clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }

  broadcastSystemMessage(message) {
    const systemMessage = JSON.stringify({
      type: 'system_message',
      message: message,
      timestamp: new Date().toISOString()
    });
    
    this.clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(systemMessage);
      }
    });
  }

  getStats() {
    return {
      connectedClients: this.clients.size,
      isRunning: this.isRunning,
      updateInterval: this.updateInterval ? 30000 : null
    };
  }

  shutdown() {
    console.log('[Analytics WebSocket] Shutting down...');
    
    this.stopPeriodicUpdates();
    
    // Close all client connections
    this.clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'server_shutdown',
          message: 'Server is shutting down'
        }));
        ws.close();
      }
    });
    
    this.clients.clear();
    
    // Close the WebSocket server
    this.wss.close(() => {
      console.log('[Analytics WebSocket] Server closed');
    });
  }
}

module.exports = AnalyticsWebSocket;
