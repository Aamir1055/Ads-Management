import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  IndianRupee,
  Target,
  FileText,
  Activity,
  Download,
  Calendar,
  AlertCircle,
  PieChart,
  Users
} from 'lucide-react';
import reportsService from '../services/reportsService';
import GenerateReportModal from '../components/GenerateReportModal';
// import * as XLSX from 'xlsx';

// Date formatting utility for DD/MM/YYYY display
const formatDateToDisplay = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const Reports = () => {
  // State management
  const [generatedReport, setGeneratedReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  
  // UI states
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [viewMode, setViewMode] = useState('summary'); // 'summary', 'detailed', 'breakdown'

  // Load dashboard stats on component mount
  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await reportsService.getDashboardStats();
      if (response.success) {
        setDashboardStats(response.data);
      }
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      setError('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleReportGenerated = (reportData) => {
    setGeneratedReport(reportData);
    setError(null);
  };

  const clearReport = () => {
    setGeneratedReport(null);
    setError(null);
  };

  const StatCard = ({ title, value, icon: Icon, change, changeType, description }) => (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
          {change && (
            <p className={`text-sm flex items-center mt-2 ${
              changeType === 'positive' ? 'text-green-600' : 'text-red-600'
            }`}>
              {changeType === 'positive' ? (
                <TrendingUp className="h-4 w-4 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 mr-1" />
              )}
              {change}
            </p>
          )}
        </div>
        <div className="p-3 bg-blue-50 rounded-full">
          <Icon className="h-6 w-6 text-blue-600" />
        </div>
      </div>
    </div>
  );

  const ReportSummaryCard = ({ title, data }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      <div className="space-y-4">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="flex justify-between items-center">
            <span className="text-sm text-gray-600 capitalize">
              {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
            </span>
            <span className="text-sm font-medium text-gray-900">
              {typeof value === 'number' && key.includes('spent') 
                ? reportsService.formatCurrency(value)
                : typeof value === 'number' 
                  ? reportsService.formatNumber(value)
                  : value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const ReportTable = ({ reports }) => (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Detailed Report Data
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Campaign
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Spent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Facebook
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Zoho
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Facebook Cost/Lead
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Zoho Cost/Lead
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reports.map((report, index) => {
                const facebookCostPerLead = report.facebook_cost_per_lead ? parseFloat(report.facebook_cost_per_lead) : 0;
                const zohoCostPerLead = report.zoho_cost_per_lead ? parseFloat(report.zoho_cost_per_lead) : 0;
                
                const getCostPerLeadStyle = (cost) => {
                  if (!cost || cost === 0) return 'bg-gray-100 text-gray-800';
                  if (cost < 5) return 'bg-green-100 text-green-800';
                  if (cost < 10) return 'bg-yellow-100 text-yellow-800';
                  return 'bg-red-100 text-red-800';
                };
                
                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {report.campaign_name || `Campaign ${report.campaign_id}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDateToDisplay(report.report_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reportsService.formatCurrency(report.spent)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reportsService.formatNumber(report.facebook_result || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {reportsService.formatNumber(report.zoho_result || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${getCostPerLeadStyle(facebookCostPerLead)}`}>
                        {facebookCostPerLead > 0 ? reportsService.formatCurrency(facebookCostPerLead) : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${getCostPerLeadStyle(zohoCostPerLead)}`}>
                        {zohoCostPerLead > 0 ? reportsService.formatCurrency(zohoCostPerLead) : 'N/A'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  if (loading && !generatedReport && !dashboardStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600">Generate and analyze comprehensive advertising reports</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowGenerateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Generate Report
          </button>
          {generatedReport && (
            <button
              onClick={clearReport}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Clear Report
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {/* Generated Report Display */}
      {generatedReport ? (
        <div className="space-y-6">
          {/* Report Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Spent"
                value={reportsService.formatCurrency(generatedReport.summary?.totalSpent || 0)}
                icon={IndianRupee}
                description={`From ${formatDateToDisplay(generatedReport.filters?.dateFrom)} to ${formatDateToDisplay(generatedReport.filters?.dateTo)}`}
              />
            <StatCard
              title="Total Results"
              value={reportsService.formatNumber(generatedReport.summary?.totalResults || 0)}
              icon={Target}
              description={`Facebook: ${reportsService.formatNumber(generatedReport.summary?.totalFacebookResults || 0)} | Zoho: ${reportsService.formatNumber(generatedReport.summary?.totalZohoResults || 0)}`}
            />
            <StatCard
              title="Campaigns"
              value={reportsService.formatNumber(generatedReport.summary?.totalCampaigns || 0)}
              icon={Users}
              description={`${generatedReport.summary?.totalRecords || 0} total records`}
            />
            <StatCard
              title="Avg Cost/Result"
              value={reportsService.formatCurrency(generatedReport.summary?.avgCostPerResult || 0)}
              icon={Activity}
            />
          </div>

          {/* View Mode Toggle */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex space-x-1">
              <button
                onClick={() => setViewMode('summary')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  viewMode === 'summary'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Summary
              </button>
              <button
                onClick={() => setViewMode('detailed')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  viewMode === 'detailed'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Detailed Data
              </button>
              <button
                onClick={() => setViewMode('breakdown')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  viewMode === 'breakdown'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Breakdown
              </button>
            </div>
          </div>

          {/* Report Content Based on View Mode */}
          {viewMode === 'summary' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ReportSummaryCard 
                title="Summary Statistics" 
                data={generatedReport.summary || {}} 
              />
              {generatedReport.filters && (
                <ReportSummaryCard 
                  title="Applied Filters" 
                  data={generatedReport.filters} 
                />
              )}
            </div>
          )}

          {viewMode === 'detailed' && generatedReport.reports && (
            <ReportTable reports={generatedReport.reports} />
          )}

          {viewMode === 'breakdown' && (
            <div className="space-y-6">
              {/* Brand Breakdown */}
              {generatedReport.brandBreakdown && generatedReport.brandBreakdown.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <PieChart className="h-5 w-5 mr-2 text-blue-600" />
                    Brand Breakdown
                  </h3>
                  <div className="space-y-3">
                    {generatedReport.brandBreakdown.map((brand, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <span className="font-medium text-gray-900">{brand.brand || 'Unknown Brand'}</span>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {reportsService.formatCurrency(brand.total_spent)} spent
                          </div>
                          <div className="text-xs text-gray-500">
                            {reportsService.formatNumber(brand.total_results)} results | {brand.campaigns_count} campaigns
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Campaign Breakdown */}
              {generatedReport.campaignBreakdown && generatedReport.campaignBreakdown.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
                    Campaign Breakdown
                  </h3>
                  <div className="space-y-3">
                    {generatedReport.campaignBreakdown.map((campaign, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div>
                          <div className="font-medium text-gray-900">{campaign.campaign_name}</div>
                          <div className="text-xs text-gray-500">{campaign.brand}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {reportsService.formatCurrency(campaign.total_spent)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {reportsService.formatNumber(campaign.total_results)} results
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        // Default Dashboard View
        <div className="space-y-6">
          {/* Dashboard Stats */}
          {dashboardStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Current Month"
                value={reportsService.formatCurrency(dashboardStats.currentMonth?.totalSpent || 0)}
                icon={IndianRupee}
                description={`${dashboardStats.currentMonth?.month} overview`}
              />
              <StatCard
                title="Monthly Campaigns"
                value={reportsService.formatNumber(dashboardStats.currentMonth?.campaignsCount || 0)}
                icon={Target}
                description="Active this month"
              />
              <StatCard
                title="Monthly Results"
                value={reportsService.formatNumber(dashboardStats.currentMonth?.totalLeads || 0)}
                icon={Activity}
              />
              <StatCard
                title="Avg Cost/Lead"
                value={reportsService.formatCurrency(dashboardStats.currentMonth?.avgCostPerLead || 0)}
                icon={TrendingUp}
              />
            </div>
          )}

          {/* Get Started Card */}
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <FileText className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Generate Your First Report</h3>
            <p className="text-gray-600 mb-4">
              Click "Generate Report" to create comprehensive reports from your campaign data with custom date ranges and filters.
            </p>
            <button
              onClick={() => setShowGenerateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Get Started
            </button>
          </div>
        </div>
      )}

      {/* Generate Report Modal */}
      <GenerateReportModal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        onReportGenerated={handleReportGenerated}
      />
    </div>
  );
};

export default Reports;
