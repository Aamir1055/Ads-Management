const { pool } = require('../config/database');
const Report = require('../models/Report');

class ReportService {
  /**
   * Generate reports by aggregating data from campaign_data, campaigns, and campaign_types tables
   * This is the main function that fetches data from different tables and calculates metrics
   */
  static async generateReportsFromCampaignData(dateFrom, dateTo, options = {}) {
    try {
      console.log(`📊 Generating reports from ${dateFrom} to ${dateTo}`);
      
      // Query to fetch and aggregate data from multiple tables
      const query = `
        SELECT 
          cd.data_date as report_date,
          DATE_FORMAT(cd.data_date, '%Y-%m') as report_month,
          cd.campaign_id,
          c.name as campaign_name,
          ct.type_name as campaign_type,
          c.brand,
          b.name as brand_name,
          
          -- Aggregate campaign data by date and campaign
          SUM(cd.facebook_result) as facebook_result,
          SUM(cd.xoho_result) as zoho_result,
          SUM(cd.facebook_result + cd.xoho_result) as leads,
          SUM(cd.spent) as spent
          
        FROM campaign_data cd
        LEFT JOIN campaigns c ON cd.campaign_id = c.id
        LEFT JOIN campaign_types ct ON c.campaign_type_id = ct.id  
        LEFT JOIN brands b ON c.brand = b.id
        WHERE cd.data_date >= ? AND cd.data_date <= ?
        ${options.campaignId ? 'AND cd.campaign_id = ?' : ''}
        ${options.brandId ? 'AND c.brand = ?' : ''}
        GROUP BY cd.data_date, cd.campaign_id
        ORDER BY cd.data_date DESC, cd.campaign_id
      `;

      const params = [dateFrom, dateTo];
      if (options.campaignId) params.push(options.campaignId);
      if (options.brandId) params.push(options.brandId);

      console.log('🔍 Executing query:', query);
      console.log('📝 Query params:', params);

      const [rows] = await pool.execute(query, params);
      
      console.log(`✅ Found ${rows.length} records to process`);

      const processedReports = rows.map(row => ({
        report_date: row.report_date,
        report_month: row.report_month,
        campaign_id: row.campaign_id,
        campaign_name: row.campaign_name,
        campaign_type: row.campaign_type,
        brand: row.brand,
        brand_name: row.brand_name,
        leads: parseInt(row.leads) || 0,
        facebook_result: parseInt(row.facebook_result) || 0,
        zoho_result: parseInt(row.zoho_result) || 0,
        spent: parseFloat(row.spent) || 0.00
      }));

      return {
        success: true,
        data: {
          reports: processedReports,
          summary: {
            totalRecords: processedReports.length,
            totalSpent: processedReports.reduce((sum, r) => sum + r.spent, 0),
            totalLeads: processedReports.reduce((sum, r) => sum + r.leads, 0),
            totalFacebookResults: processedReports.reduce((sum, r) => sum + r.facebook_result, 0),
            totalZohoResults: processedReports.reduce((sum, r) => sum + r.zoho_result, 0),
            dateRange: { from: dateFrom, to: dateTo }
          }
        }
      };

    } catch (error) {
      console.error('❌ Error generating reports from campaign data:', error);
      return {
        success: false,
        message: 'Failed to generate reports: ' + error.message
      };
    }
  }

  /**
   * Sync data from campaign_data to reports table
   * This function takes the aggregated data and stores it in the reports table
   */
  static async syncReportsToTable(dateFrom, dateTo, options = {}) {
    try {
      console.log(`🔄 Syncing reports to table from ${dateFrom} to ${dateTo}`);

      // First, generate the report data
      const reportData = await this.generateReportsFromCampaignData(dateFrom, dateTo, options);
      
      if (!reportData.success) {
        return reportData;
      }

      const reports = reportData.data.reports;
      let insertedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;

      // Process each report record
      for (const reportRow of reports) {
        try {
          // Check if record already exists
          const existingQuery = `
            SELECT id FROM reports 
            WHERE campaign_id = ? AND report_date = ?
          `;
          
          const [existing] = await pool.execute(existingQuery, [
            reportRow.campaign_id, 
            reportRow.report_date
          ]);

          if (existing.length > 0) {
            // Update existing record
            if (options.updateExisting !== false) {
              await Report.update(existing[0].id, {
                ...reportRow,
                created_by: options.userId || null
              });
              updatedCount++;
              console.log(`✅ Updated report for campaign ${reportRow.campaign_id} on ${reportRow.report_date}`);
            } else {
              skippedCount++;
              console.log(`⏭️  Skipped existing report for campaign ${reportRow.campaign_id} on ${reportRow.report_date}`);
            }
          } else {
            // Insert new record
            await Report.create({
              ...reportRow,
              created_by: options.userId || null
            });
            insertedCount++;
            console.log(`➕ Created new report for campaign ${reportRow.campaign_id} on ${reportRow.report_date}`);
          }

        } catch (recordError) {
          console.error(`❌ Error processing report for campaign ${reportRow.campaign_id}:`, recordError.message);
          // Continue with next record
        }
      }

      return {
        success: true,
        data: {
          summary: {
            totalRecords: reports.length,
            inserted: insertedCount,
            updated: updatedCount,
            skipped: skippedCount
          }
        },
        message: `Sync completed: ${insertedCount} inserted, ${updatedCount} updated, ${skippedCount} skipped`
      };

    } catch (error) {
      console.error('❌ Error syncing reports to table:', error);
      return {
        success: false,
        message: 'Failed to sync reports: ' + error.message
      };
    }
  }

  /**
   * Get filter options for reports (brands, campaigns, date ranges)
   */
  static async getFilterOptions() {
    try {
      // Get available brands
      const [brands] = await pool.execute(`
        SELECT DISTINCT b.id, b.name 
        FROM brands b 
        INNER JOIN campaigns c ON b.id = c.brand 
        ORDER BY b.name
      `);

      // Get available campaigns
      const [campaigns] = await pool.execute(`
        SELECT DISTINCT c.id, c.name, b.name as brand_name
        FROM campaigns c 
        LEFT JOIN brands b ON c.brand = b.id
        ORDER BY c.name
      `);

      // Get date range from campaign_data
      const [dateRange] = await pool.execute(`
        SELECT 
          MIN(data_date) as earliest_date,
          MAX(data_date) as latest_date
        FROM campaign_data
      `);

      return {
        brands: brands,
        campaigns: campaigns,
        dateRange: dateRange[0] || { earliest_date: null, latest_date: null }
      };

    } catch (error) {
      console.error('❌ Error getting filter options:', error);
      throw new Error('Failed to get filter options: ' + error.message);
    }
  }

  /**
   * Get dashboard statistics
   */
  static async getDashboardStats(filters = {}) {
    try {
      // Get stats from reports table
      const reportStats = await Report.getStats(filters);

      // Get campaign data stats for comparison
      let whereClause = 'WHERE 1=1';
      const params = [];

      if (filters.dateFrom) {
        whereClause += ' AND cd.data_date >= ?';
        params.push(filters.dateFrom);
      }

      if (filters.dateTo) {
        whereClause += ' AND cd.data_date <= ?';
        params.push(filters.dateTo);
      }

      const [campaignDataStats] = await pool.execute(`
        SELECT 
          COUNT(*) as total_campaign_data_records,
          COUNT(DISTINCT cd.campaign_id) as unique_campaigns_in_data,
          SUM(cd.facebook_result) as total_facebook_from_data,
          SUM(cd.xoho_result) as total_zoho_from_data,
          SUM(cd.spent) as total_spent_from_data
        FROM campaign_data cd
        ${whereClause}
      `, params);

      return {
        reports: reportStats,
        campaignData: campaignDataStats[0],
        syncStatus: {
          lastSyncDate: null, // Could be implemented with a sync log table
          recordsInSync: reportStats.total_reports || 0
        }
      };

    } catch (error) {
      console.error('❌ Error getting dashboard stats:', error);
      throw new Error('Failed to get dashboard statistics: ' + error.message);
    }
  }

  /**
   * Delete reports for a specific date range
   */
  static async deleteReportsInRange(dateFrom, dateTo, options = {}) {
    try {
      let whereClause = 'WHERE report_date >= ? AND report_date <= ?';
      const params = [dateFrom, dateTo];

      if (options.campaignId) {
        whereClause += ' AND campaign_id = ?';
        params.push(options.campaignId);
      }

      if (options.brandId) {
        whereClause += ' AND brand = ?';
        params.push(options.brandId);
      }

      const [result] = await pool.execute(
        `DELETE FROM reports ${whereClause}`,
        params
      );

      return {
        success: true,
        deletedCount: result.affectedRows,
        message: `Deleted ${result.affectedRows} report records`
      };

    } catch (error) {
      console.error('❌ Error deleting reports:', error);
      return {
        success: false,
        message: 'Failed to delete reports: ' + error.message
      };
    }
  }
}

module.exports = ReportService;