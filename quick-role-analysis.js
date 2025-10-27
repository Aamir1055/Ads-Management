#!/usr/bin/env node
const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function makeRequest(method, endpoint, data = null) {
    try {
        const config = {
            method,
            url: `${BASE_URL}${endpoint}`,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (data) {
            config.data = data;
        }

        const response = await axios(config);
        return { success: true, data: response.data, status: response.status };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data || error.message,
            status: error.response?.status,
            details: error.response?.data?.details
        };
    }
}

async function analyzeIssues() {
    console.log('🔍 Analyzing Role Management Issues (No Auth)');
    console.log('==============================================');

    const issues = [];

    // Test basic connectivity
    console.log('\n1. Testing server connectivity...');
    const healthResult = await makeRequest('GET', '/health');
    if (!healthResult.success) {
        issues.push('Server is not running or not accessible');
        console.error('❌ Server not accessible');
        return issues;
    }
    console.log('✅ Server is running');

    // Test unauthenticated access to role endpoints (should return 401)
    console.log('\n2. Testing authentication requirements...');
    
    const endpoints = [
        '/roles',
        '/permissions/roles-list',
        '/permissions/modules',
        '/permissions'
    ];

    for (const endpoint of endpoints) {
        const result = await makeRequest('GET', endpoint);
        if (result.status === 401) {
            console.log(`✅ ${endpoint} correctly requires authentication`);
        } else if (result.success) {
            issues.push(`${endpoint} does not require authentication (security issue)`);
            console.log(`⚠️ ${endpoint} accessible without auth - security issue`);
        } else {
            console.log(`❓ ${endpoint} returned ${result.status}: ${result.error?.message || 'unknown error'}`);
            if (result.status !== 401 && result.status !== 403) {
                issues.push(`${endpoint} has unexpected error: ${result.error?.message}`);
            }
        }
    }

    return issues;
}

analyzeIssues().then(issues => {
    console.log('\n📋 Analysis Summary');
    console.log('===================');
    
    if (issues.length === 0) {
        console.log('✅ No issues found in basic analysis');
        console.log('📝 For full testing, authentication is required');
    } else {
        console.log('🐛 Issues found:');
        issues.forEach((issue, index) => {
            console.log(`${index + 1}. ${issue}`);
        });
    }
}).catch(error => {
    console.error('💥 Error during analysis:', error.message);
});
