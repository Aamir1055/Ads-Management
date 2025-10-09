/**
 * Frontend Implementation Test Script
 * Tests the new frontend reports implementation
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const FRONTEND_URL = 'http://localhost:5173'; // Vite dev server default
const BACKEND_URL = 'http://localhost:3000';  // Backend API default
const TEST_RESULTS_FILE = path.join(__dirname, 'frontend-test-results.json');

// Test results storage
const testResults = {
    timestamp: new Date().toISOString(),
    summary: {
        passed: 0,
        failed: 0,
        total: 0
    },
    tests: []
};

/**
 * Log test result
 */
function logTest(testName, passed, message, details = null) {
    const result = {
        name: testName,
        passed,
        message,
        details,
        timestamp: new Date().toISOString()
    };

    testResults.tests.push(result);
    testResults.summary.total++;
    
    if (passed) {
        testResults.summary.passed++;
        console.log(`✅ ${testName}: ${message}`);
    } else {
        testResults.summary.failed++;
        console.log(`❌ ${testName}: ${message}`);
    }
    
    if (details) {
        console.log(`   Details: ${details}`);
    }
}

/**
 * Check if file exists and contains expected content
 */
function checkFile(filePath, expectedContent = null) {
    const exists = fs.existsSync(filePath);
    if (!exists) {
        return { exists: false };
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const hasExpectedContent = expectedContent ? content.includes(expectedContent) : true;

    return {
        exists: true,
        content,
        hasExpectedContent,
        size: content.length
    };
}

/**
 * Test API endpoint
 */
async function testApiEndpoint(url, method = 'GET', expectedStatus = 200) {
    try {
        const response = await axios({
            method,
            url,
            timeout: 10000,
            validateStatus: false
        });

        return {
            success: response.status === expectedStatus,
            status: response.status,
            data: response.data,
            error: null
        };
    } catch (error) {
        return {
            success: false,
            status: error.response?.status || null,
            data: null,
            error: error.message
        };
    }
}

/**
 * Test frontend file structure
 */
function testFrontendFiles() {
    console.log('\n🔍 Testing Frontend File Structure...');

    const frontendBase = path.join(__dirname, 'frontend');
    
    const requiredFiles = [
        {
            path: path.join(frontendBase, 'src', 'services', 'reportsService.js'),
            description: 'Reports Service',
            expectedContent: 'getAllReports'
        },
        {
            path: path.join(frontendBase, 'src', 'components', 'ReportsList.jsx'),
            description: 'ReportsList Component',
            expectedContent: 'ReportsList'
        },
        {
            path: path.join(frontendBase, 'src', 'pages', 'Reports.jsx'),
            description: 'Reports Page',
            expectedContent: 'ReportsList'
        },
        {
            path: path.join(frontendBase, 'src', 'modules', 'ReportsTable.jsx'),
            description: 'ReportsTable Module',
            expectedContent: 'getAllReports'
        },
        {
            path: path.join(frontendBase, 'src', 'modules', 'Reports.jsx'),
            description: 'Reports Module',
            expectedContent: 'reportsService'
        },
        {
            path: path.join(frontendBase, 'src', 'pages', 'ReportsTable.jsx'),
            description: 'ReportsTable Page',
            expectedContent: 'ReportsTable'
        }
    ];

    for (const file of requiredFiles) {
        const result = checkFile(file.path, file.expectedContent);
        
        if (result.exists && result.hasExpectedContent) {
            logTest(
                `File: ${file.description}`,
                true,
                'File exists and contains expected content',
                `Size: ${result.size} bytes`
            );
        } else if (result.exists) {
            logTest(
                `File: ${file.description}`,
                false,
                'File exists but missing expected content',
                `Expected: ${file.expectedContent}`
            );
        } else {
            logTest(
                `File: ${file.description}`,
                false,
                'File does not exist',
                `Path: ${file.path}`
            );
        }
    }
}

/**
 * Test backend API endpoints
 */
async function testBackendApi() {
    console.log('\n🔍 Testing Backend API Endpoints...');

    const endpoints = [
        {
            url: `${BACKEND_URL}/api/reports`,
            description: 'Reports List API',
            method: 'GET'
        },
        {
            url: `${BACKEND_URL}/api/reports/dashboard`,
            description: 'Dashboard Stats API',
            method: 'GET'
        },
        {
            url: `${BACKEND_URL}/api/reports/filters`,
            description: 'Filters API',
            method: 'GET'
        }
    ];

    for (const endpoint of endpoints) {
        const result = await testApiEndpoint(endpoint.url, endpoint.method);
        
        if (result.success) {
            logTest(
                `API: ${endpoint.description}`,
                true,
                `Endpoint responding correctly (${result.status})`,
                result.data ? `Response type: ${typeof result.data}` : null
            );
        } else {
            logTest(
                `API: ${endpoint.description}`,
                false,
                `Endpoint failed (${result.status || 'No response'})`,
                result.error || `URL: ${endpoint.url}`
            );
        }
    }
}

/**
 * Test service configuration
 */
function testServiceConfiguration() {
    console.log('\n🔍 Testing Service Configuration...');

    const serviceFile = path.join(__dirname, 'frontend', 'src', 'services', 'reportsService.js');
    const configFile = path.join(__dirname, 'frontend', 'src', 'config', 'config.js');
    const apiUtilFile = path.join(__dirname, 'frontend', 'src', 'utils', 'api.js');
    
    const serviceCheck = checkFile(serviceFile);
    const configCheck = checkFile(configFile);
    const apiUtilCheck = checkFile(apiUtilFile);

    if (!serviceCheck.exists) {
        logTest('Service Config', false, 'reportsService.js not found');
        return;
    }

    const serviceContent = serviceCheck.content;
    const hasAllMethods = [
        'getAllReports',
        'getDashboardStats', 
        'getChartData',
        'exportToExcel',
        'syncReports',
        'getFilterOptions'
    ].every(method => serviceContent.includes(method));

    // Check if service is using proper API utility
    const usesApiUtility = serviceContent.includes('api.get') && serviceContent.includes('import { api }');
    
    // Check config file for correct base URL
    let hasCorrectConfig = false;
    if (configCheck.exists) {
        const configContent = configCheck.content;
        hasCorrectConfig = configContent.includes('localhost:3000') || configContent.includes('3000');
    }
    
    // Check if API utility exists and configured correctly
    let hasCorrectApiUtil = false;
    if (apiUtilCheck.exists) {
        const apiContent = apiUtilCheck.content;
        hasCorrectApiUtil = apiContent.includes('baseURL: config.API_BASE_URL');
    }

    logTest(
        'Service Config: Base URL Configuration',
        hasCorrectConfig && hasCorrectApiUtil && usesApiUtility,
        hasCorrectConfig && hasCorrectApiUtil && usesApiUtility ? 
            'API configuration properly set up with correct base URL' : 
            'API configuration issues detected',
        `Config file: ${hasCorrectConfig}, API util: ${hasCorrectApiUtil}, Service uses API: ${usesApiUtility}`
    );

    logTest(
        'Service Config: API Methods',
        hasAllMethods,
        hasAllMethods ? 'All required API methods present' : 'Missing required API methods'
    );
}

/**
 * Test component integration
 */
function testComponentIntegration() {
    console.log('\n🔍 Testing Component Integration...');

    const reportsPage = path.join(__dirname, 'frontend', 'src', 'pages', 'Reports.jsx');
    const reportsPageCheck = checkFile(reportsPage);

    if (reportsPageCheck.exists) {
        const usesReportsList = reportsPageCheck.content.includes('ReportsList');
        const importsReportsList = reportsPageCheck.content.includes('import') && reportsPageCheck.content.includes('ReportsList');

        logTest(
            'Integration: Reports Page',
            usesReportsList && importsReportsList,
            usesReportsList && importsReportsList ? 'Reports page properly imports and uses ReportsList' : 'Reports page integration incomplete',
            `Uses ReportsList: ${usesReportsList}, Imports ReportsList: ${importsReportsList}`
        );
    } else {
        logTest('Integration: Reports Page', false, 'Reports page not found');
    }

    const reportsList = path.join(__dirname, 'frontend', 'src', 'components', 'ReportsList.jsx');
    const reportsListCheck = checkFile(reportsList);

    if (reportsListCheck.exists) {
        const hasStateManagement = reportsListCheck.content.includes('useState');
        const hasEffectHook = reportsListCheck.content.includes('useEffect');
        const hasReportsService = reportsListCheck.content.includes('reportsService');

        logTest(
            'Integration: ReportsList Component',
            hasStateManagement && hasEffectHook && hasReportsService,
            'ReportsList component properly structured',
            `State: ${hasStateManagement}, Effect: ${hasEffectHook}, Service: ${hasReportsService}`
        );
    } else {
        logTest('Integration: ReportsList Component', false, 'ReportsList component not found');
    }
}

/**
 * Generate final report
 */
function generateFinalReport() {
    console.log('\n📊 Test Results Summary:');
    console.log(`✅ Passed: ${testResults.summary.passed}`);
    console.log(`❌ Failed: ${testResults.summary.failed}`);
    console.log(`📝 Total:  ${testResults.summary.total}`);
    
    const successRate = Math.round((testResults.summary.passed / testResults.summary.total) * 100);
    console.log(`📈 Success Rate: ${successRate}%`);

    // Save results to file
    fs.writeFileSync(TEST_RESULTS_FILE, JSON.stringify(testResults, null, 2));
    console.log(`\n📄 Detailed results saved to: ${TEST_RESULTS_FILE}`);

    if (successRate >= 80) {
        console.log('\n🎉 Frontend implementation looks good! Most tests passed.');
        return true;
    } else {
        console.log('\n⚠️  Frontend implementation needs attention. Several tests failed.');
        return false;
    }
}

/**
 * Main test function
 */
async function runFrontendTests() {
    console.log('🚀 Starting Frontend Implementation Tests...');
    console.log('='.repeat(60));

    try {
        // Test file structure
        testFrontendFiles();

        // Test service configuration
        testServiceConfiguration();

        // Test component integration
        testComponentIntegration();

        // Test backend API (if available)
        await testBackendApi();

        // Generate final report
        const success = generateFinalReport();
        
        console.log('\n='.repeat(60));
        console.log(success ? '✅ Frontend testing completed successfully!' : '❌ Frontend testing completed with issues.');
        
        return success;
    } catch (error) {
        console.error('\n💥 Test execution failed:', error.message);
        logTest('Test Execution', false, 'Failed to complete tests', error.message);
        generateFinalReport();
        return false;
    }
}

// Run tests if this script is executed directly
if (require.main === module) {
    runFrontendTests().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = { runFrontendTests, testResults };