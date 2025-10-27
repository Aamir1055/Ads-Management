const reportController = require('./controllers/reportController');

console.log('=== Report Controller Exports ===');
console.log('Available functions:');
Object.keys(reportController).forEach(key => {
  console.log(`- ${key}: ${typeof reportController[key]}`);
});

console.log('\n=== Testing generateReport function ===');
console.log('generateReport exists:', typeof reportController.generateReport);
console.log('Function content preview:');
console.log(reportController.generateReport.toString().substring(0, 200) + '...');
