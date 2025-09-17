const app = require('./app');

const port = process.env.PORT || 5000; // Use port 5000 to match main server

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📍 Campaigns API: http://localhost:${port}/api/campaigns`);
  console.log(`💓 Health check: http://localhost:${port}/api/health`);
  console.log('\n✅ Your Campaigns API is ready to use!');
  console.log('📝 Test the endpoints:');
  console.log(`   GET    http://localhost:${port}/api/campaigns          - View all campaigns`);
  console.log(`   GET    http://localhost:${port}/api/campaigns/:id      - View single campaign`);
  console.log(`   POST   http://localhost:${port}/api/campaigns          - Create campaign`);
  console.log(`   PUT    http://localhost:${port}/api/campaigns/:id      - Update campaign`);
  console.log(`   DELETE http://localhost:${port}/api/campaigns/:id      - Delete campaign`);
});
