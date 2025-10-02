import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { ChartSkeleton } from '../LoadingSkeleton';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

// Common chart options
const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        padding: 20,
        usePointStyle: true,
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#fff',
      bodyColor: '#fff',
      cornerRadius: 8,
      displayColors: false,
    }
  }
};

// Performance Trend Chart
export const PerformanceTrendChart = ({ data, loading = false, title = 'Performance Trends' }) => {
  const chartData = useMemo(() => {
    if (!data || !data.length) return null;

    const labels = data.map(item => {
      const date = new Date(item.date || item.date_group || item.report_date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    return {
      labels,
      datasets: [
        {
          label: 'Leads',
          data: data.map(item => Number(item.leads || item.daily_leads || 0)),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Spent (₹)',
          data: data.map(item => Number(item.spent || item.daily_spent || 0)),
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4,
          yAxisID: 'y1',
        }
      ]
    };
  }, [data]);

  const options = useMemo(() => ({
    ...commonOptions,
    scales: {
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
      },
    }
  }), []);

  if (loading) {
    return <ChartSkeleton height="h-80" />;
  }

  if (!chartData) {
    return (
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
        <div className="h-80 flex items-center justify-center text-gray-500">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      <div className="h-80">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

// Campaign Performance Bar Chart
export const CampaignPerformanceChart = ({ data, loading = false, title = 'Top Campaigns' }) => {
  const chartData = useMemo(() => {
    if (!data || !data.length) return null;

    // Take top 10 campaigns
    const topCampaigns = data.slice(0, 10);

    return {
      labels: topCampaigns.map(item => {
        const name = item.campaign_name || item.name || `Campaign ${item.campaign_id}`;
        return name.length > 20 ? `${name.substring(0, 20)}...` : name;
      }),
      datasets: [
        {
          label: 'Leads',
          data: topCampaigns.map(item => Number(item.totalLeads || item.total_leads || item.leads || 0)),
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(236, 72, 153, 0.8)',
            'rgba(14, 165, 233, 0.8)',
            'rgba(34, 197, 94, 0.8)',
            'rgba(251, 146, 60, 0.8)',
            'rgba(168, 85, 247, 0.8)'
          ],
          borderColor: [
            'rgb(59, 130, 246)',
            'rgb(16, 185, 129)',
            'rgb(245, 158, 11)',
            'rgb(239, 68, 68)',
            'rgb(139, 92, 246)',
            'rgb(236, 72, 153)',
            'rgb(14, 165, 233)',
            'rgb(34, 197, 94)',
            'rgb(251, 146, 60)',
            'rgb(168, 85, 247)'
          ],
          borderWidth: 1
        }
      ]
    };
  }, [data]);

  const options = useMemo(() => ({
    ...commonOptions,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Leads'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Campaigns'
        }
      }
    },
    plugins: {
      ...commonOptions.plugins,
      tooltip: {
        ...commonOptions.plugins.tooltip,
        callbacks: {
          title: (context) => {
            const index = context[0].dataIndex;
            return data?.[index]?.campaign_name || `Campaign ${data?.[index]?.campaign_id}`;
          },
          label: (context) => {
            const index = context.dataIndex;
            const campaign = data?.[index];
            if (!campaign) return context.formattedValue;
            
            return [
              `Leads: ${context.formattedValue}`,
              `Spent: ₹${Number(campaign.totalSpent || campaign.total_spent || campaign.spent || 0).toLocaleString('en-IN')}`,
              `CPL: ₹${Number(campaign.avgCostPerLead || campaign.avg_cost_per_lead || campaign.cost_per_lead || 0).toFixed(2)}`,
              `Brand: ${campaign.brand || 'Unknown'}`
            ];
          }
        }
      }
    }
  }), [data]);

  if (loading) {
    return <ChartSkeleton height="h-96" />;
  }

  if (!chartData) {
    return (
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
        <div className="h-96 flex items-center justify-center text-gray-500">
          No campaign data available
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      <div className="h-96">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
};

// Brand Distribution Donut Chart
export const BrandDistributionChart = ({ data, loading = false, title = 'Brand Performance' }) => {
  const chartData = useMemo(() => {
    if (!data || !data.length) return null;

    // Take top 8 brands
    const topBrands = data.slice(0, 8);

    return {
      labels: topBrands.map(item => item.brand || 'Unknown'),
      datasets: [
        {
          data: topBrands.map(item => Number(item.totalLeads || item.total_leads || item.leads || 0)),
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(236, 72, 153, 0.8)',
            'rgba(14, 165, 233, 0.8)',
            'rgba(34, 197, 94, 0.8)'
          ],
          borderColor: [
            'rgb(59, 130, 246)',
            'rgb(16, 185, 129)',
            'rgb(245, 158, 11)',
            'rgb(239, 68, 68)',
            'rgb(139, 92, 246)',
            'rgb(236, 72, 153)',
            'rgb(14, 165, 233)',
            'rgb(34, 197, 94)'
          ],
          borderWidth: 2
        }
      ]
    };
  }, [data]);

  const options = useMemo(() => ({
    ...commonOptions,
    cutout: '60%',
    plugins: {
      ...commonOptions.plugins,
      tooltip: {
        ...commonOptions.plugins.tooltip,
        callbacks: {
          label: (context) => {
            const index = context.dataIndex;
            const brand = data?.[index];
            if (!brand) return context.formattedValue;
            
            const percentage = ((context.parsed / context.dataset.data.reduce((a, b) => a + b, 0)) * 100).toFixed(1);
            
            return [
              `${brand.brand || 'Unknown'}: ${context.formattedValue} leads (${percentage}%)`,
              `Spent: ₹${Number(brand.totalSpent || brand.total_spent || brand.spent || 0).toLocaleString('en-IN')}`,
              `Campaigns: ${brand.campaignsCount || brand.campaigns_count || 0}`
            ];
          }
        }
      }
    }
  }), [data]);

  if (loading) {
    return <ChartSkeleton height="h-80" />;
  }

  if (!chartData) {
    return (
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
        <div className="h-80 flex items-center justify-center text-gray-500">
          No brand data available
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      <div className="h-80">
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  );
};

// Monthly Comparison Chart
export const MonthlyComparisonChart = ({ data, loading = false, title = 'Monthly Comparison' }) => {
  const chartData = useMemo(() => {
    if (!data || !data.length) return null;

    return {
      labels: data.map(item => {
        const date = new Date(item.month + '-01');
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }),
      datasets: [
        {
          label: 'Total Leads',
          data: data.map(item => Number(item.total_leads || 0)),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          fill: true,
        },
        {
          label: 'Total Spent',
          data: data.map(item => Number(item.total_spent || 0)),
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          fill: true,
          yAxisID: 'y1',
        }
      ]
    };
  }, [data]);

  const options = useMemo(() => ({
    ...commonOptions,
    scales: {
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
      },
    }
  }), []);

  if (loading) {
    return <ChartSkeleton height="h-80" />;
  }

  if (!chartData) {
    return (
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
        <div className="h-80 flex items-center justify-center text-gray-500">
          No monthly data available
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      <div className="h-80">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default {
  PerformanceTrendChart,
  CampaignPerformanceChart,
  BrandDistributionChart,
  MonthlyComparisonChart
};
