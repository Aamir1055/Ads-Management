// =================================================================
// DASHBOARD CACHE CLEAR SCRIPT - Run this in browser console
// =================================================================
// 
// Instructions:
// 1. Open your ads reporting website
// 2. Open Developer Tools (F12)
// 3. Go to Console tab
// 4. Copy and paste this script
// 5. Press Enter to run it
// 6. Refresh the page
//
// This will clear all dashboard cache and force fresh data fetch
// =================================================================

console.log('🧹 Clearing Dashboard Cache...\n');

// Method 1: Clear dashboard service cache if available
try {
  if (window.dashboardService && typeof window.dashboardService.clearCache === 'function') {
    window.dashboardService.clearCache();
    console.log('✅ Dashboard service cache cleared');
  } else {
    console.log('ℹ️ Dashboard service not available on window object');
  }
} catch (e) {
  console.log('⚠️ Could not access dashboard service:', e.message);
}

// Method 2: Clear localStorage dashboard-related data
const dashboardKeys = [];
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && (key.includes('dashboard') || key.includes('cache') || key.includes('overview'))) {
    dashboardKeys.push(key);
  }
}

if (dashboardKeys.length > 0) {
  console.log('🗑️ Removing dashboard-related localStorage items:');
  dashboardKeys.forEach(key => {
    localStorage.removeItem(key);
    console.log(`   - Removed: ${key}`);
  });
} else {
  console.log('ℹ️ No dashboard-related localStorage items found');
}

// Method 3: Clear sessionStorage dashboard-related data
const sessionKeys = [];
for (let i = 0; i < sessionStorage.length; i++) {
  const key = sessionStorage.key(i);
  if (key && (key.includes('dashboard') || key.includes('cache'))) {
    sessionKeys.push(key);
  }
}

if (sessionKeys.length > 0) {
  console.log('🗑️ Removing dashboard-related sessionStorage items:');
  sessionKeys.forEach(key => {
    sessionStorage.removeItem(key);
    console.log(`   - Removed: ${key}`);
  });
} else {
  console.log('ℹ️ No dashboard-related sessionStorage items found');
}

// Method 4: Try to access and clear React component state (if available)
try {
  // This won't work in production but might work in development
  if (window.React && window.React.useState) {
    console.log('⚠️ Cannot directly clear React component state from console');
    console.log('   Use the Refresh button in the dashboard or reload the page');
  }
} catch (e) {
  console.log('ℹ️ React not available on window object');
}

// Method 5: Force hard refresh
console.log('\n💡 Recommended actions:');
console.log('1. Click the "Refresh" button in your dashboard');
console.log('2. Or press Ctrl+F5 (Windows) / Cmd+Shift+R (Mac) for hard refresh');
console.log('3. Or run: location.reload(true) to force page reload');

// Utility function to force dashboard refresh
window.forceDashboardRefresh = () => {
  console.log('🔄 Forcing dashboard refresh...');
  // Clear any remaining cache
  try {
    const event = new CustomEvent('dashboardRefresh', { detail: { clearCache: true } });
    window.dispatchEvent(event);
    console.log('✅ Dashboard refresh event dispatched');
  } catch (e) {
    console.log('⚠️ Could not dispatch refresh event:', e.message);
  }
  
  // Hard reload as fallback
  setTimeout(() => {
    console.log('🔄 Performing hard reload...');
    location.reload(true);
  }, 1000);
};

console.log('\n🔧 Utility function available:');
console.log('- forceDashboardRefresh() - Force complete dashboard refresh');
console.log('\n✅ Cache clearing complete!');
console.log('Now click the dashboard Refresh button or use forceDashboardRefresh()');