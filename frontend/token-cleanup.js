// TOKEN CLEANUP SCRIPT
// Run this in your browser console (F12) to fix token issues

console.log('🔧 Cleaning up old tokens...');

// Remove all old token formats
localStorage.removeItem('authToken');
localStorage.removeItem('auth_token');
localStorage.removeItem('access_token');
localStorage.removeItem('refresh_token');
localStorage.removeItem('user');

// Clear session storage as well
sessionStorage.clear();

console.log('✅ Old tokens cleared!');
console.log('🔄 Please refresh the page and log in again.');

// Automatically refresh the page
setTimeout(() => {
    window.location.reload();
}, 1000);
