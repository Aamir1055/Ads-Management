const reportController = require('./controllers/reportController');

// Mock request and response objects
const mockReq = {
  query: {
    date_from: '2025-09-16',
    date_to: '2025-09-17'
  }
};

const mockRes = {
  status: (code) => ({
    json: (data) => {
      console.log('Response Status:', code);
      console.log('Response Data:');
      console.log(JSON.stringify(data, null, 2));
      
      if (data.data && data.data.reports && data.data.reports.length > 0) {
        const firstReport = data.data.reports[0];
        console.log('\n=== First Report Object Keys ===');
        console.log(Object.keys(firstReport));
        
        console.log('\n=== Field Analysis ===');
        Object.entries(firstReport).forEach(([key, value]) => {
          console.log(`${key}: "${value}" (type: ${typeof value})`);
        });
      }
      
      return { json: () => {} };
    }
  })
};

console.log('🧪 Testing generateReport function directly...\n');

(async () => {
  try {
    await reportController.generateReport(mockReq, mockRes);
  } catch (error) {
    console.error('Error calling generateReport directly:', error);
  }
})();
