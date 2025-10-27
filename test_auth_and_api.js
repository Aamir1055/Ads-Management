const axios = require('axios');

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 10000
});

(async () => {
  try {
    console.log('🔐 Step 1: Authenticating...\n');
    
    // First, authenticate with test credentials
    const authResponse = await api.post('/auth/login', {
      username: 'admin',
      password: 'password'
    });
    
    console.log('✅ Authentication successful');
    const token = authResponse.data.data?.access_token;
    console.log('Token received:', token ? `${token.substring(0, 30)}...` : 'No token');
    
    if (!token) {
      console.error('❌ No access token received from login');
      return;
    }
    
    // Set token for subsequent requests
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    console.log('\n📊 Step 2: Testing reports API...\n');
    
    // First, check what dates exist in campaign_data
    const mysql = require('mysql2/promise');
    const connection = await mysql.createConnection({ 
      host: 'localhost', 
      user: 'root', 
      password: '', 
      database: 'ads reporting' 
    });
    
    const [dateRange] = await connection.query('SELECT MIN(data_date) as min_date, MAX(data_date) as max_date FROM campaign_data');
    console.log('Available date range in campaign_data:', dateRange[0]);
    
    await connection.end();
    
    const startDate = dateRange[0]?.min_date || '2024-01-01';
    const endDate = dateRange[0]?.max_date || '2024-12-31';
    
    console.log(`Using date range: ${startDate} to ${endDate}`);
    
    // Test the generate report endpoint with actual dates
    const response = await api.get('/reports/generate', {
      params: {
        date_from: startDate,
        date_to: endDate
      }
    });
    
    console.log('✅ API Response received');
    console.log('Status:', response.status);
    console.log('Success:', response.data.success);
    console.log('Message:', response.data.message);
    
    if (response.data.data && response.data.data.reports) {
      const reports = response.data.data.reports;
      console.log('\n📊 Reports data:');
      console.log('Total records:', reports.length);
      
      if (reports.length > 0) {
        console.log('\n🔍 First 3 records:');
        reports.slice(0, 3).forEach((record, idx) => {
          console.log(`\nRecord ${idx + 1}:`);
          console.log('  ID:', record.id);
          console.log('  Campaign:', record.campaign_name);
          console.log('  Brand field:', `"${record.brand}" (type: ${typeof record.brand})`);
          console.log('  Brand ID field:', record.brand_id, '(type:', typeof record.brand_id, ')');
          console.log('  Leads:', record.leads, '(type:', typeof record.leads, ')');
          console.log('  Cost per lead:', record.cost_per_lead, '(type:', typeof record.cost_per_lead, ')');
          console.log('  Report date:', record.report_date);
        });
        
        // Check if any brand values are numbers (which would indicate the bug)
        const brandTypes = reports.map(r => typeof r.brand).filter((type, idx, arr) => arr.indexOf(type) === idx);
        console.log('\n🧐 Brand field types found:', brandTypes);
        
        const numericBrands = reports.filter(r => typeof r.brand === 'number' || (!isNaN(Number(r.brand)) && r.brand !== null));
        if (numericBrands.length > 0) {
          console.log('\n❌ Found numeric brand values (this is the bug!):');
          numericBrands.slice(0, 5).forEach((record, idx) => {
            console.log(`  Record ${idx + 1}: brand="${record.brand}" (type: ${typeof record.brand}), brand_id: ${record.brand_id}`);
          });
        } else {
          console.log('\n✅ All brand values are strings (names), no bug detected');
        }
      }
    } else {
      console.log('❌ No reports data found in response');
      console.log('Response structure:', Object.keys(response.data));
    }
    
  } catch (error) {
    console.error('❌ Test failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Status Text:', error.response.statusText);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
})();
