require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Date helper
const toMysqlDate = (val) => {
  if (!val) return null;
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return null;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// Response helper
const createResponse = (success, message, data = null, meta = null) => {
  const response = { success, message, timestamp: new Date().toISOString() };
  if (data !== null) response.data = data;
  if (meta !== null) response.meta = meta;
  return response;
};

// Test route
app.get('/test', (req, res) => {
  res.json({ message: 'Test server is working!' });
});

// Reports generate endpoint
app.get('/api/reports/generate', async (req, res) => {
  try {
    console.log('🔍 [DEBUG] /api/reports/generate called with query:', req.query);
    
    const dateFrom = toMysqlDate(req.query.date_from);
    const dateTo = toMysqlDate(req.query.date_to);
    const brand = (req.query.brand || '').trim();
    const campaignId = req.query.campaign_id ? Number(req.query.campaign_id) : null;

    if (!dateFrom || !dateTo) {
      return res.status(400).json(createResponse(false, 'date_from and date_to are required (YYYY-MM-DD format)'));
    }

    const where = [];
    const params = [];

    // Date range filter
    where.push('cd.data_date >= ?', 'cd.data_date <= ?');
    params.push(dateFrom, dateTo);

    // Brand filter (by brand name)
    if (brand) {
      where.push('b.name = ?');
      params.push(brand);
    }

    // Campaign filter
    if (campaignId) {
      where.push('cd.campaign_id = ?');
      params.push(campaignId);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    // Main query: Get ALL campaign_data entries with joined info
    const reportSql = `
      SELECT
        cd.id,
        cd.data_date as report_date,
        DATE_FORMAT(cd.data_date, '%Y-%m') as report_month,
        cd.campaign_id,
        c.name as campaign_name,
        ct.type_name as campaign_type,
        COALESCE(b.name, 'Unknown Brand') as brand,
        c.brand as brand_id,
        cd.facebook_result,
        cd.xoho_result as zoho_result,
        (cd.facebook_result + cd.xoho_result) as leads,
        cd.spent,
        cd.card_id,
        cd.card_name,
        CASE 
          WHEN (cd.facebook_result + cd.xoho_result) > 0 
          THEN cd.spent / (cd.facebook_result + cd.xoho_result)
          ELSE NULL 
        END as cost_per_lead,
        CASE 
          WHEN cd.facebook_result > 0 
          THEN cd.spent / cd.facebook_result
          ELSE NULL 
        END as facebook_cost_per_lead,
        CASE 
          WHEN cd.xoho_result > 0 
          THEN cd.spent / cd.xoho_result
          ELSE NULL 
        END as zoho_cost_per_lead,
        cd.created_at,
        cd.updated_at
      FROM campaign_data cd
      LEFT JOIN campaigns c ON cd.campaign_id = c.id
      LEFT JOIN campaign_types ct ON c.campaign_type_id = ct.id
      LEFT JOIN brands b ON c.brand = b.id
      ${whereClause}
      ORDER BY cd.data_date DESC, cd.id DESC
    `;

    // Execute query
    const [reportData] = await pool.query(reportSql, params);
    
    console.log('🔍 [DEBUG] Query executed successfully');
    console.log('🔍 [DEBUG] Results count:', reportData?.length || 0);
    
    if (reportData && reportData.length > 0) {
      console.log('🔍 [DEBUG] First record:', {
        campaign_name: reportData[0].campaign_name,
        facebook_result: reportData[0].facebook_result,
        zoho_result: reportData[0].zoho_result,
        spent: reportData[0].spent,
        facebook_cost_per_lead: reportData[0].facebook_cost_per_lead,
        zoho_cost_per_lead: reportData[0].zoho_cost_per_lead
      });
    }

    // Handle empty results
    if (!reportData || reportData.length === 0) {
      return res.status(200).json(createResponse(true, 'No data found for the selected date range', {
        summary: {
          totalCampaigns: 0,
          totalRecords: 0,
          totalFacebookResults: 0,
          totalZohoResults: 0,
          totalResults: 0,
          totalSpent: 0,
          avgCostPerResult: 0,
          dateRange: { from: dateFrom, to: dateTo }
        },
        reports: [],
        filters: {
          dateFrom,
          dateTo,
          ...(brand && { brand }),
          ...(campaignId && { campaignId })
        }
      }));
    }

    // Calculate summary (simplified for testing)
    const summary = {
      totalCampaigns: 1,
      totalRecords: reportData.length,
      totalFacebookResults: reportData.reduce((sum, r) => sum + (r.facebook_result || 0), 0),
      totalZohoResults: reportData.reduce((sum, r) => sum + (r.zoho_result || 0), 0),
      totalResults: reportData.reduce((sum, r) => sum + (r.leads || 0), 0),
      totalSpent: reportData.reduce((sum, r) => sum + parseFloat(r.spent || 0), 0),
      avgCostPerResult: 0,
      dateRange: {
        from: dateFrom,
        to: dateTo
      }
    };

    const responseData = {
      summary,
      reports: reportData || [],
      filters: {
        dateFrom,
        dateTo,
        ...(brand && { brand }),
        ...(campaignId && { campaignId })
      }
    };

    console.log('✅ [DEBUG] Sending response with', reportData.length, 'records');
    return res.status(200).json(createResponse(true, `Report generated successfully with ${reportData.length} records`, responseData));
    
  } catch (error) {
    console.error('❌ [DEBUG] Error in /api/reports/generate:', error);
    return res.status(500).json(createResponse(false, 'Failed to generate report', null));
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Test server running on http://localhost:${PORT}`);
  console.log(`📊 Test the endpoint: http://localhost:${PORT}/api/reports/generate?date_from=2025-08-19&date_to=2025-09-18`);
});
