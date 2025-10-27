# Report Analytics Module Documentation

## Overview

The Report Analytics Module is a comprehensive data visualization and insights system designed to provide powerful analytics capabilities while maintaining strict user data privacy. The module ensures that regular users can only access their own report data, while superadmins can view analytics across all users.

## 🔒 Data Privacy Features

### User Data Isolation
- **Regular Users**: Can only view analytics for reports they have created (`created_by = user.id`)
- **Superadmins**: Can view analytics across all users (role level >= 10)
- **Automatic Filtering**: All database queries are automatically filtered based on user permissions
- **Data Scope Indication**: Every response includes the data scope (`own_data` or `all_users`)

### Security Features
- **JWT Authentication**: All endpoints require valid authentication tokens
- **Role-based Access**: Different access levels based on user role hierarchy
- **Rate Limiting**: Multiple rate limiters for different endpoint types
- **Input Validation**: All parameters are validated and sanitized
- **SQL Injection Prevention**: Parameterized queries throughout

## 📊 Analytics Capabilities

### Dashboard Overview (`GET /api/analytics/dashboard`)
- **Current Month Metrics**: Campaigns, leads, spent, cost-per-lead
- **Daily Comparisons**: Today vs yesterday performance
- **Top Campaigns**: Best performing campaigns by leads
- **Brand Performance**: Performance breakdown by brand
- **Real-time Data**: Auto-updating statistics

### Time Series Analysis (`GET /api/analytics/charts/time-series`)
- **Flexible Grouping**: Day, week, or month-level aggregation
- **Multiple Metrics**: Leads, spent, Facebook results, Zoho results
- **Campaign Activity**: Active campaigns per time period
- **Date Range Filtering**: Custom date range support

### Campaign Performance (`GET /api/analytics/charts/campaign-performance`)
- **Detailed Metrics**: Total leads, spent, results breakdown
- **Performance Rankings**: Campaigns ranked by performance
- **Efficiency Calculations**: Cost efficiency and ROI metrics
- **Historical Analysis**: Performance over time periods

### Brand Analysis (`GET /api/analytics/charts/brand-analysis`)
- **Market Share**: By leads and spend
- **Channel Performance**: Facebook vs Zoho breakdown
- **Brand Comparison**: Side-by-side brand metrics
- **Portfolio Analysis**: Diversification insights

### AI-like Insights (`GET /api/analytics/insights/trends`)
- **Trend Detection**: Automatic identification of trends
- **Performance Alerts**: Warnings for declining performance
- **Recommendations**: Actionable suggestions for improvement
- **Risk Analysis**: Brand concentration and diversification insights

### Data Export (`GET /api/analytics/export`)
- **Multiple Formats**: JSON and CSV export options
- **Export Types**: Summary, detailed, campaigns, brands
- **Metadata Included**: Export timestamp, user info, data scope
- **Large Dataset Support**: Efficient handling of large exports

## 🔌 Real-time Features

### WebSocket Support (`WS /ws/report-analytics`)
- **Authentication**: JWT token-based WebSocket authentication
- **Real-time Updates**: Live analytics updates every 30 seconds
- **User Filtering**: Automatic data filtering based on user permissions
- **Subscription Management**: Customizable update frequency and metrics
- **Client Management**: Connection state tracking and cleanup

### WebSocket Message Types
- `welcome`: Connection confirmation with user context
- `initial_data`: Initial analytics data on connection
- `realtime_update`: Periodic analytics updates
- `data_update`: On-demand data updates
- `filters_updated`: Filter change confirmation
- `subscription_confirmed`: Subscription settings confirmation
- `error`: Error messages
- `system_message`: System-wide announcements

## 🛠 Technical Implementation

### File Structure
```
backend/
├── controllers/
│   └── reportAnalyticsController.js     # Main analytics controller
├── routes/
│   └── reportAnalyticsRoutes.js         # Analytics API routes
├── websocket/
│   └── reportAnalyticsSocket.js         # Real-time WebSocket handler
├── migrations/
│   └── add_created_by_to_reports.js     # Database migration
└── docs/
    └── REPORT_ANALYTICS_MODULE.md       # This documentation
```

### Database Requirements
The module requires a `created_by` field in the `reports` table to maintain user data privacy:

```sql
ALTER TABLE reports 
ADD COLUMN created_by INT NULL,
ADD KEY idx_reports_created_by (created_by),
ADD CONSTRAINT fk_reports_created_by 
FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
```

### Privacy Filtering Logic
```javascript
// Get user filter condition for data privacy
const getUserFilter = (user, tableAlias = 'r') => {
  if (isSuperAdmin(user)) {
    return { whereClause: '', params: [] };
  }
  // Regular users can only see their own reports
  return { 
    whereClause: `${tableAlias}.created_by = ?`, 
    params: [user.id] 
  };
};
```

## 🌐 API Endpoints

### Dashboard
```
GET /api/analytics/dashboard
```
**Response**: Dashboard overview with key performance metrics

### Charts
```
GET /api/analytics/charts/time-series?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD&group_by=day
GET /api/analytics/charts/campaign-performance?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD&limit=20
GET /api/analytics/charts/brand-analysis?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD
```
**Parameters**:
- `date_from`, `date_to`: Date range (required)
- `group_by`: Time grouping (`day`, `week`, `month`)
- `limit`: Result limit for performance queries

### Insights
```
GET /api/analytics/insights/trends?days=30
```
**Parameters**:
- `days`: Number of days to analyze (7-90, default: 30)

### Export
```
GET /api/analytics/export?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD&format=json&type=summary
```
**Parameters**:
- `format`: Export format (`json`, `csv`)
- `type`: Data type (`summary`, `detailed`, `campaigns`, `brands`)

### Health Check
```
GET /api/analytics/health
```
**Response**: Service health status and user context

## 📈 Rate Limiting

Different endpoints have different rate limits to prevent abuse:

- **Dashboard**: 30 requests per minute
- **Charts**: 60 requests per 2 minutes  
- **Insights**: 20 requests per 5 minutes
- **Export**: 10 requests per 10 minutes

## 🧪 Testing

Run the test suite to verify functionality:
```bash
node test-analytics-module.js
```

The test verifies:
- User privacy filtering
- Superadmin access
- Chart data generation
- Insights generation
- Data export capabilities

## 🚀 Setup Instructions

1. **Add Analytics Routes**: Already added to `app.js`
2. **Run Database Migration**:
   ```bash
   node migrations/add_created_by_to_reports.js
   ```
3. **Update Report Creation**: Ensure new reports include `created_by` field
4. **Start Server**: The analytics endpoints will be available at `/api/analytics/*`

## 🔧 Configuration

### Environment Variables
The module uses existing environment variables from your project:
- `JWT_SECRET`: For WebSocket authentication
- `DB_*`: Database connection settings
- `NODE_ENV`: Environment mode

### WebSocket Configuration
To enable WebSocket support, integrate the WebSocket handler in your server setup:
```javascript
const ReportAnalyticsWebSocket = require('./websocket/reportAnalyticsSocket');

// After creating your HTTP server
const analyticsWS = new ReportAnalyticsWebSocket(server);
```

## 🎯 Usage Examples

### Frontend JavaScript Examples

#### Dashboard Data
```javascript
const response = await fetch('/api/analytics/dashboard', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const data = await response.json();
console.log('User role:', data.data.userRole);
console.log('Data scope:', data.data.dataScope);
```

#### Time Series Chart
```javascript
const chartData = await fetch('/api/analytics/charts/time-series?' + 
  new URLSearchParams({
    date_from: '2025-01-01',
    date_to: '2025-01-31',
    group_by: 'day'
  }), {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

#### WebSocket Connection
```javascript
const ws = new WebSocket(`ws://localhost:3000/ws/report-analytics?token=${token}`);

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'realtime_update') {
    updateDashboard(data.data);
  }
};

// Set filters
ws.send(JSON.stringify({
  type: 'set_filters',
  filters: { brand: 'Nike', dateFrom: '2025-01-01' }
}));
```

## 🔍 Data Privacy Verification

You can verify data privacy is working by checking:

1. **Regular User Response**:
   - `dataScope: "own_data"`
   - `userRole: "user"` (or similar)
   - Only sees reports they created

2. **Superadmin Response**:
   - `dataScope: "all_users"`
   - `userRole: "superadmin"`
   - Sees all reports from all users

3. **Database Queries**: Check logs to see user filtering in action

## 🐛 Troubleshooting

### Common Issues

1. **"Authentication required" errors**:
   - Ensure JWT token is included in Authorization header
   - Check token expiration
   - Verify JWT_SECRET environment variable

2. **Empty analytics data**:
   - Run the database migration to add `created_by` field
   - Ensure reports table has data
   - Check date range parameters

3. **WebSocket connection failures**:
   - Include token in query parameter: `?token=JWT_TOKEN`
   - Check WebSocket server is properly initialized
   - Verify network/firewall settings

4. **Database connection issues**:
   - Verify database credentials in environment variables
   - Check database server is running
   - Run connection test: `node -e "require('./config/database').pool.query('SELECT 1')"`

## 📝 Future Enhancements

Potential improvements for future versions:

1. **Advanced Analytics**:
   - Predictive analytics with ML models
   - Anomaly detection
   - Automated reporting

2. **Visualization Enhancements**:
   - More chart types (heatmaps, scatter plots)
   - Interactive dashboards
   - Custom dashboard builder

3. **Performance Optimizations**:
   - Data caching strategies  
   - Query optimization
   - Pagination for large datasets

4. **Additional Features**:
   - Scheduled reports
   - Alert system
   - Data comparison tools

## 🤝 Contributing

When contributing to the analytics module:

1. **Privacy First**: Always ensure user data privacy is maintained
2. **Testing**: Add tests for new analytics features
3. **Documentation**: Update this documentation for any changes
4. **Performance**: Consider query performance for large datasets
5. **Security**: Validate all inputs and use parameterized queries

## 📞 Support

For support with the Report Analytics Module:
- Check the troubleshooting section above
- Review the test script for examples
- Verify database migration has been run
- Check server logs for detailed error messages

---

**Created**: September 2025  
**Version**: 1.0.0  
**Compatibility**: Node.js 14+, MySQL 5.7+
