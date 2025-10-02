const { exportToExcel } = require('./controllers/reportController');

// Mock request and response objects
const mockReq = {
  query: {
    date_from: '2025-09-23',
    date_to: '2025-09-23'
  }
};

const mockRes = {
  status: (code) => {
    console.log('Status:', code);
    return mockRes;
  },
  json: (data) => {
    console.log('JSON Response:', JSON.stringify(data, null, 2));
    return mockRes;
  },
  setHeader: (name, value) => {
    console.log('Header:', name, '=', value);
    return mockRes;
  },
  send: (data) => {
    console.log('Sent data length:', data ? data.length : 0);
    console.log('✅ Excel export function executed successfully!');
    return mockRes;
  }
};

console.log('🧪 Testing Excel export function directly...\n');

// Call the function directly
exportToExcel(mockReq, mockRes);
