#!/usr/bin/env node

const http = require('http');

const healthCheck = async () => {
  const options = {
    hostname: process.env.HEALTH_CHECK_HOST || 'localhost',
    port: process.env.PORT || 5000,
    path: '/api/health',
    method: 'GET',
    timeout: 5000
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (res.statusCode === 200 && result.success) {
            console.log('✅ Health check passed');
            console.log(`📊 Status: ${result.message}`);
            console.log(`⚡ Uptime: ${Math.floor(result.system.uptime)} seconds`);
            console.log(`💾 Memory: ${result.system.memory.used}MB used / ${result.system.memory.total}MB total`);
            console.log(`🗄️  Database: ${result.database.status}`);
            resolve(0);
          } else {
            console.error('❌ Health check failed - API returned error');
            console.error('Response:', data);
            resolve(1);
          }
        } catch (error) {
          console.error('❌ Health check failed - Invalid JSON response');
          console.error('Raw response:', data);
          resolve(1);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Health check failed - Connection error');
      console.error('Error:', error.message);
      resolve(1);
    });

    req.on('timeout', () => {
      console.error('❌ Health check failed - Timeout');
      req.destroy();
      resolve(1);
    });

    req.setTimeout(5000);
    req.end();
  });
};

// Run health check
healthCheck().then((exitCode) => {
  process.exit(exitCode);
}).catch((error) => {
  console.error('❌ Health check failed - Unexpected error');
  console.error(error);
  process.exit(1);
});
