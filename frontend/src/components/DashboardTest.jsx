import React, { useState, useEffect } from 'react';
import dashboardService from '../services/dashboardService';

const DashboardTest = () => {
  const [status, setStatus] = useState('Testing dashboard service...');
  const [results, setResults] = useState([]);

  useEffect(() => {
    testDashboardService();
  }, []);

  const testDashboardService = async () => {
    const tests = [
      {
        name: 'Service Initialization',
        test: () => {
          // Test if the service is properly initialized
          const hasCorrectMethods = [
            'getOverview',
            'getTrends', 
            'getCampaigns',
            'getBrands',
            'getActivities',
            'getRealTimeMetrics'
          ].every(method => typeof dashboardService[method] === 'function');
          
          return hasCorrectMethods ? 'PASS' : 'FAIL - Missing methods';
        }
      },
      {
        name: 'API Base URL',
        test: () => {
          // Check if API_BASE_URL is properly set
          try {
            const axiosInstance = dashboardService.getAxiosInstance();
            const baseURL = axiosInstance.defaults.baseURL;
            return baseURL.includes('dashboard') ? 'PASS' : `FAIL - Incorrect baseURL: ${baseURL}`;
          } catch (error) {
            return `FAIL - ${error.message}`;
          }
        }
      },
      {
        name: 'Cache System',
        test: () => {
          // Test cache system
          try {
            dashboardService.setCachedData('test', { data: 'test' });
            const cached = dashboardService.getCachedData('test');
            dashboardService.clearCache('test');
            return cached?.data === 'test' ? 'PASS' : 'FAIL - Cache not working';
          } catch (error) {
            return `FAIL - ${error.message}`;
          }
        }
      }
    ];

    const testResults = tests.map(test => ({
      name: test.name,
      result: test.test()
    }));

    setResults(testResults);
    const allPassed = testResults.every(r => r.result === 'PASS');
    setStatus(allPassed ? '✅ All tests passed! Dashboard service is ready.' : '❌ Some tests failed. Check results below.');
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Dashboard Service Test</h2>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600">{status}</p>
        </div>

        <div className="space-y-3">
          {results.map((test, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-900">{test.name}</span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                test.result === 'PASS' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {test.result}
              </span>
            </div>
          ))}
        </div>

        {results.length > 0 && results.every(r => r.result === 'PASS') && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Dashboard Service Ready</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>The dashboard service is working correctly and ready to use. You can now safely use the Dashboard component.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardTest;