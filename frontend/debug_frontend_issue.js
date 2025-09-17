// ============================================================
// FRONTEND DEBUGGING SCRIPT - FINAL DIAGNOSIS
// Run this in your browser console after login
// ============================================================

console.log('🔍 FRONTEND ISSUE DEBUG - Starting comprehensive analysis...\n');

// Step 1: Check if we're actually making API calls
console.log('📡 Step 1: Monitoring all network requests...');
const originalFetch = window.fetch;
const apiCalls = [];

window.fetch = function(...args) {
  const url = args[0];
  const startTime = Date.now();
  
  console.log(`🌐 Making API call: ${url}`);
  apiCalls.push({ url, startTime, status: 'pending' });
  
  return originalFetch.apply(this, args)
    .then(response => {
      const duration = Date.now() - startTime;
      const callIndex = apiCalls.findIndex(call => call.url === url && call.status === 'pending');
      if (callIndex >= 0) {
        apiCalls[callIndex] = {
          ...apiCalls[callIndex],
          status: response.status,
          ok: response.ok,
          duration: duration
        };
      }
      
      console.log(`✅ API Response: ${response.status} ${response.ok ? 'OK' : 'ERROR'} - ${url} (${duration}ms)`);
      return response;
    })
    .catch(error => {
      const duration = Date.now() - startTime;
      console.log(`❌ API Error: ${error.message} - ${url} (${duration}ms)`);
      return Promise.reject(error);
    });
};

// Step 2: Check React components and DOM
setTimeout(() => {
  console.log('\n🧩 Step 2: Checking React components and DOM...');
  
  // Check if main app container exists
  const appRoot = document.getElementById('root') || document.querySelector('[id*="app"]') || document.querySelector('main');
  console.log('📱 App container found:', !!appRoot);
  if (appRoot) {
    console.log('   Container tag:', appRoot.tagName);
    console.log('   Container classes:', appRoot.className);
    console.log('   Container children:', appRoot.children.length);
  }
  
  // Check for React error boundaries or crash messages
  const errorMessages = document.querySelectorAll('[class*="error"], [id*="error"]');
  const crashMessages = Array.from(document.querySelectorAll('*')).filter(el => 
    el.textContent && (
      el.textContent.includes('Something went wrong') ||
      el.textContent.includes('Error') ||
      el.textContent.includes('Failed to load') ||
      el.textContent.includes('Loading...')
    )
  );
  
  console.log('🚨 Error elements found:', errorMessages.length);
  console.log('💥 Crash/loading messages:', crashMessages.length);
  
  if (crashMessages.length > 0) {
    console.log('   Crash messages:', crashMessages.map(el => el.textContent.trim()));
  }
  
  // Check for loading states
  const loadingElements = document.querySelectorAll('[class*="loading"], [class*="spinner"], [class*="skeleton"]');
  console.log('⏳ Loading indicators:', loadingElements.length);
  
  // Check for empty states
  const emptyElements = document.querySelectorAll('[class*="empty"], [class*="no-data"]');
  console.log('📭 Empty state elements:', emptyElements.length);
  
  // Check tables and content containers
  const tables = document.querySelectorAll('table');
  const lists = document.querySelectorAll('ul, ol');
  const cards = document.querySelectorAll('[class*="card"]');
  const contentAreas = document.querySelectorAll('[class*="content"], [class*="main"], [class*="container"]');
  
  console.log('📊 Data display elements:');
  console.log('   Tables:', tables.length);
  console.log('   Lists:', lists.length);
  console.log('   Cards:', cards.length);
  console.log('   Content areas:', contentAreas.length);
  
  // Check if React is loaded
  console.log('\n⚛️  React environment:');
  console.log('   React loaded:', typeof window.React !== 'undefined');
  console.log('   ReactDOM loaded:', typeof window.ReactDOM !== 'undefined');
  
  // Check for React DevTools
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    console.log('   React DevTools available: YES');
  } else {
    console.log('   React DevTools available: NO');
  }

}, 1000);

// Step 3: Test API calls directly
setTimeout(async () => {
  console.log('\n🧪 Step 3: Testing API calls directly...');
  
  const token = localStorage.getItem('access_token');
  if (!token) {
    console.log('❌ No auth token found - this could be the issue!');
    return;
  }
  
  console.log('🔑 Token exists, testing endpoints...');
  
  const testEndpoints = [
    { name: 'Brands', url: 'http://localhost:5000/api/brands' },
    { name: 'Users', url: 'http://localhost:5000/api/users' },
    { name: 'Campaigns', url: 'http://localhost:5000/api/campaigns' }
  ];
  
  for (const endpoint of testEndpoints) {
    try {
      const response = await fetch(endpoint.url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log(`📊 ${endpoint.name}: Status ${response.status}, Success: ${data.success}, Records: ${data.data?.length || 0}`);
      
      if (data.data && data.data.length > 0) {
        console.log(`   Sample: ${JSON.stringify(data.data[0]).substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name}: ${error.message}`);
    }
  }
  
}, 2000);

// Step 4: Check navigation and routing
setTimeout(() => {
  console.log('\n🧭 Step 4: Checking navigation and routing...');
  
  console.log('Current URL:', window.location.href);
  console.log('Current path:', window.location.pathname);
  console.log('URL hash:', window.location.hash);
  
  // Check for React Router
  if (window.history && window.history.pushState) {
    console.log('History API available: YES');
  }
  
  // Check navigation elements
  const navLinks = document.querySelectorAll('nav a, [class*="nav"] a, [class*="menu"] a');
  const buttons = document.querySelectorAll('button');
  
  console.log('🔗 Navigation elements:');
  console.log('   Nav links:', navLinks.length);
  console.log('   Buttons:', buttons.length);
  
  if (navLinks.length > 0) {
    console.log('   Sample nav links:', Array.from(navLinks).slice(0, 3).map(link => ({
      text: link.textContent.trim(),
      href: link.href
    })));
  }
  
}, 3000);

// Step 5: Summary and recommendations
setTimeout(() => {
  console.log('\n🎯 Step 5: FINAL ANALYSIS SUMMARY');
  console.log('═══════════════════════════════════════════════');
  
  console.log('📡 API Calls Made:', apiCalls.length);
  if (apiCalls.length === 0) {
    console.log('🚨 CRITICAL: NO API calls detected!');
    console.log('   This means React components are not making API requests.');
    console.log('   Check: useEffect hooks, component lifecycle, API service calls');
  } else {
    const failedCalls = apiCalls.filter(call => !call.ok);
    console.log('   Failed calls:', failedCalls.length);
    if (failedCalls.length > 0) {
      console.log('   Failed URLs:', failedCalls.map(call => call.url));
    }
  }
  
  console.log('\n💡 NEXT DEBUGGING STEPS:');
  if (apiCalls.length === 0) {
    console.log('1. ⚛️  Check React components are mounting properly');
    console.log('2. 🔄 Check useEffect dependencies and API service calls');
    console.log('3. 🐛 Look for JavaScript errors preventing component execution');
  } else {
    console.log('1. 📊 Check component state management and data rendering');
    console.log('2. 🎨 Check CSS hiding content or layout issues');
    console.log('3. 🔄 Check component re-render cycles');
  }
  
  console.log('\n🔧 Quick fixes to try:');
  console.log('1. Hard refresh: Ctrl+F5');
  console.log('2. Clear cache and reload');
  console.log('3. Check browser console for red error messages');
  console.log('4. Try incognito/private mode');
  
}, 4000);

// Make it available globally
window.debugFrontend = () => {
  console.log('Current API calls:', apiCalls);
  console.log('Storage:', {
    localStorage: Object.keys(localStorage),
    sessionStorage: Object.keys(sessionStorage)
  });
};
