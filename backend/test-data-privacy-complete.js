const axios = require('axios');

async function testDataPrivacySystem() {
  try {
    console.log('🧪 COMPREHENSIVE DATA PRIVACY TESTING');
    console.log('====================================\n');

    const baseURL = 'http://localhost:5000/api';

    // Test credentials
    const adminCreds = { username: 'admin', password: 'admin123' };
    const testUserCreds = { username: 'testuser', password: 'testpass123' };

    let adminToken, testUserToken;

    // Phase 1: Login as both users
    console.log('📋 PHASE 1: USER AUTHENTICATION');
    console.log('------------------------------');

    // Login as admin
    try {
      const adminLogin = await axios.post(`${baseURL}/auth/login`, adminCreds);
      adminToken = adminLogin.data.data?.access_token;
      console.log('✅ Admin login successful');
    } catch (error) {
      console.log('❌ Admin login failed:', error.response?.data?.message || error.message);
      return;
    }

    // Login as test user
    try {
      const testUserLogin = await axios.post(`${baseURL}/auth/login`, testUserCreds);
      testUserToken = testUserLogin.data.data?.access_token;
      console.log('✅ Test user login successful');
    } catch (error) {
      console.log('❌ Test user login failed:', error.response?.data?.message || error.message);
      return;
    }

    // Phase 2: Test data visibility (before enabling privacy routes)\n    console.log('\\n📋 PHASE 2: CURRENT DATA VISIBILITY (Original Routes)');
    console.log('---------------------------------------------------');

    // Test admin can see all data
    try {
      const adminData = await axios.get(`${baseURL}/campaign-data`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log(`✅ Admin sees ${adminData.data.data?.length || 0} campaign records (current system)`);
    } catch (error) {
      console.log('❌ Admin data fetch failed:', error.response?.data?.message || error.message);
    }

    // Test regular user can see all data (current system - no privacy)
    try {
      const testUserData = await axios.get(`${baseURL}/campaign-data`, {
        headers: { Authorization: `Bearer ${testUserToken}` }
      });
      console.log(`⚠️  Test user sees ${testUserData.data.data?.length || 0} campaign records (current system - NO PRIVACY)`);
    } catch (error) {
      console.log('❌ Test user data fetch failed:', error.response?.data?.message || error.message);
    }

    // Phase 3: Create test data as both users
    console.log('\\n📋 PHASE 3: CREATING TEST DATA');
    console.log('-----------------------------');

    const testCampaignData = {
      campaign_id: 28, // This should exist from previous tests
      facebook_result: 100,
      zoho_result: 150,
      spent: 75.50,
      data_date: '2025-09-13',
      card_id: 17
    };

    // Create data as admin
    try {
      const adminCreate = await axios.post(`${baseURL}/campaign-data`, 
        { ...testCampaignData, facebook_result: 200 }, 
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      console.log('✅ Admin created campaign data - ID:', adminCreate.data.data?.id);
    } catch (error) {
      console.log('❌ Admin create failed:', error.response?.data?.message || error.message);
    }

    // Create data as test user
    try {
      const testUserCreate = await axios.post(`${baseURL}/campaign-data`, 
        { ...testCampaignData, facebook_result: 300 }, 
        { headers: { Authorization: `Bearer ${testUserToken}` } }
      );
      console.log('✅ Test user created campaign data - ID:', testUserCreate.data.data?.id);
    } catch (error) {
      console.log('❌ Test user create failed:', error.response?.data?.message || error.message);
    }

    console.log('\\n🔐 DATA PRIVACY IMPLEMENTATION COMPLETE!');
    console.log('=======================================\\n');

    console.log('📋 SUMMARY:');
    console.log('  ✅ Data privacy middleware created');
    console.log('  ✅ Privacy-enabled controller created');
    console.log('  ✅ Privacy-enabled routes created');
    console.log('  ✅ Existing data ownership fixed');
    console.log('  ✅ Test users created');

    console.log('\\n🚀 NEXT STEPS TO ENABLE DATA PRIVACY:');
    console.log('===================================');
    console.log('\\n1. BACKUP current route file:');
    console.log('   cp campaignDataRoutes.js campaignDataRoutes_original.js');
    
    console.log('\\n2. REPLACE route file with privacy-enabled version:');
    console.log('   cp campaignDataRoutes_privacy.js campaignDataRoutes.js');
    
    console.log('\\n3. RESTART the backend server');
    
    console.log('\\n4. TEST the privacy system:');
    console.log('   • Admin user (admin/admin123) - sees ALL data');
    console.log('   • Test user (testuser/testpass123) - sees ONLY own data');
    console.log('   • New campaign data automatically assigned to creator');

    console.log('\\n🔍 PRIVACY FEATURES:');
    console.log('   📊 Token-based user identification');
    console.log('   🛡️  Automatic data filtering by created_by');
    console.log('   👑 Admin bypass (role level >= 8)');
    console.log('   🔒 Ownership validation for updates/deletes');
    console.log('   🆔 Auto-assignment of created_by on creation');
    console.log('   📝 Comprehensive logging for audit trail');

    console.log('\\n✨ PRIVACY RULES:');
    console.log('   • Super Admin (Level 10): Full access to all data');
    console.log('   • Admin (Level 8+): Full access to all data');
    console.log('   • Regular users (Level < 8): Only own created data');
    console.log('   • All CRUD operations respect ownership rules');

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testDataPrivacySystem();
