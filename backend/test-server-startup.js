console.log('🧪 Testing server startup...\n');

try {
  console.log('1. Testing route imports...');
  const campaignRoutes = require('./routes/campaignDataRoutes');
  console.log('   ✅ Campaign data routes loaded successfully');

  console.log('\n2. Testing controller imports...');
  const controller = require('./controllers/campaignDataController');
  console.log('   ✅ Campaign data controller loaded successfully');
  console.log('   Available functions:', Object.keys(controller));

  console.log('\n3. Testing middleware imports...');
  const dataPrivacy = require('./middleware/dataPrivacy');
  console.log('   ✅ Data privacy middleware loaded successfully');

  console.log('\n✅ ALL IMPORTS SUCCESSFUL!');
  console.log('The server should start correctly now.');

} catch (error) {
  console.log('\n❌ IMPORT FAILED:');
  console.log('Error:', error.message);
  console.log('Stack:', error.stack);
}
