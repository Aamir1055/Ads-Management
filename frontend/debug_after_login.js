// ================================================
// POST-LOGIN DEBUG SCRIPT
// Run this in browser console AFTER you login
// ================================================

console.log('🔍 Starting post-login debugging...\n');

// Check current page and authentication state
console.log('📍 Current page:', window.location.pathname);
console.log('🔑 Token exists:', !!localStorage.getItem('access_token'));

// Function to test API calls with current token
const testAPI = async (endpoint, description) => {
  try {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`http://localhost:5000/api${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    console.log(`📡 ${description}:`);
    console.log(`   Status: ${response.status} ${response.ok ? '✅' : '❌'}`);
    console.log(`   Success: ${data.success}`);
    console.log(`   Records: ${data.data?.length || 0}`);
    
    if (data.data && data.data.length > 0) {
      console.log(`   Sample record:`, data.data[0]);
    }
    
    if (!response.ok) {
      console.log(`   Error: ${data.message || 'Unknown error'}`);
    }
    
    return { ok: response.ok, data };
  } catch (error) {
    console.log(`❌ ${description} failed:`, error.message);
    return { ok: false, error: error.message };
  }
};

// Test all main endpoints
const testAllEndpoints = async () => {
  console.log('\n🧪 Testing all API endpoints with current authentication...\n');
  
  const endpoints = [
    { path: '/brands', name: 'Brands' },
    { path: '/users', name: 'Users' },
    { path: '/campaigns', name: 'Campaigns' },
    { path: '/cards', name: 'Cards' },
    { path: '/campaign-types', name: 'Campaign Types' },
    { path: '/campaign-data', name: 'Campaign Data' }
  ];
  
  for (const endpoint of endpoints) {
    await testAPI(endpoint.path, endpoint.name);
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 200));
  }
};

// Check if React components are rendered
const checkComponentRendering = () => {
  console.log('\n🧩 Checking React component rendering...\n');
  
  // Check if main content areas exist
  const mainContent = document.querySelector('main');
  const contentAreas = document.querySelectorAll('[class*="content"], [class*="container"], [class*="module"]');
  const tableElements = document.querySelectorAll('table');
  const loadingElements = document.querySelectorAll('[class*="loading"], [class*="spinner"]');
  const emptyStates = document.querySelectorAll('[class*="empty"], [class*="no-data"]');
  
  console.log(`📱 UI Elements found:`);
  console.log(`   Main content: ${mainContent ? '✅' : '❌'}`);
  console.log(`   Content areas: ${contentAreas.length}`);
  console.log(`   Tables: ${tableElements.length}`);
  console.log(`   Loading indicators: ${loadingElements.length}`);
  console.log(`   Empty state messages: ${emptyStates.length}`);
  
  // Check if we have any text content visible
  const bodyText = document.body.innerText.toLowerCase();
  const hasErrorMessages = bodyText.includes('error') || bodyText.includes('failed');
  const hasLoadingMessages = bodyText.includes('loading');
  const hasEmptyMessages = bodyText.includes('no data') || bodyText.includes('empty');
  
  console.log(`📝 Page text content indicators:`);
  console.log(`   Contains error messages: ${hasErrorMessages ? '⚠️' : '✅'}`);
  console.log(`   Contains loading messages: ${hasLoadingMessages ? '⏳' : '✅'}`);
  console.log(`   Contains empty messages: ${hasEmptyMessages ? '📭' : '✅'}`);
  
  // Check for specific module containers
  const brandElements = document.querySelectorAll('[class*="brand"], [id*="brand"]');
  const campaignElements = document.querySelectorAll('[class*="campaign"], [id*="campaign"]');
  const userElements = document.querySelectorAll('[class*="user"], [id*="user"]');
  
  console.log(`🏷️ Module-specific elements:`);
  console.log(`   Brand elements: ${brandElements.length}`);
  console.log(`   Campaign elements: ${campaignElements.length}`);
  console.log(`   User elements: ${userElements.length}`);
  
  return {
    hasMainContent: !!mainContent,
    contentAreasCount: contentAreas.length,
    tablesCount: tableElements.length,
    loadingCount: loadingElements.length,
    emptyStatesCount: emptyStates.length
  };
};

// Check network requests in real-time
const monitorNetworkRequests = () => {
  console.log('\n🌐 Starting network request monitoring...');
  console.log('   (Check the Network tab for real-time requests)');
  
  // Override fetch to log requests
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    console.log('📡 Making fetch request:', args[0]);
    return originalFetch.apply(this, args)
      .then(response => {
        console.log(`📡 Fetch response: ${response.status} ${response.ok ? '✅' : '❌'} - ${args[0]}`);
        return response;
      })
      .catch(error => {
        console.log(`❌ Fetch error: ${error.message} - ${args[0]}`);
        throw error;
      });
  };
  
  console.log('✅ Network monitoring active (fetch requests will be logged)');
};

// Main debugging function
const runFullDiagnosis = async () => {
  console.log('🚀 Running full post-login diagnosis...\n');
  
  // Step 1: Check component rendering
  const renderingInfo = checkComponentRendering();
  
  // Step 2: Test API endpoints
  await testAllEndpoints();
  
  // Step 3: Start network monitoring
  monitorNetworkRequests();
  
  // Step 4: Final recommendations
  console.log('\n💡 DIAGNOSIS RESULTS:');
  console.log('═══════════════════════════════════════');
  
  if (renderingInfo.loadingCount > 0) {
    console.log('⏳ Page appears to be in loading state');
    console.log('   - This could indicate API calls are hanging');
    console.log('   - Check Network tab for slow/pending requests');
  }
  
  if (renderingInfo.emptyStatesCount > 0) {
    console.log('📭 Empty state components detected');
    console.log('   - This could indicate API calls return empty data');
    console.log('   - Or components are not handling data properly');
  }
  
  if (renderingInfo.tablesCount === 0 && renderingInfo.contentAreasCount === 0) {
    console.log('❌ No content containers found');
    console.log('   - This suggests a component rendering issue');
    console.log('   - Check for JavaScript errors in console');
  }
  
  console.log('\n🔧 Next steps:');
  console.log('1. Try navigating to different modules');
  console.log('2. Check for JavaScript errors (red text) in this console');
  console.log('3. Check Network tab for failed/pending requests');
  console.log('4. Try refreshing the page (Ctrl+F5)');
};

// Auto-run diagnosis
runFullDiagnosis();

// Make functions available globally
window.testAPI = testAPI;
window.checkComponentRendering = checkComponentRendering;
window.runFullDiagnosis = runFullDiagnosis;
