// Authentication Status Checker
// Add this to your browser console to check auth status

function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    
    console.log('🔐 Authentication Status:');
    console.log('Token exists:', !!token);
    console.log('User data exists:', !!user);
    
    if (token) {
        try {
            // Decode JWT token (basic check - don't use in production)
            const payload = JSON.parse(atob(token.split('.')[1]));
            console.log('Token payload:', payload);
            console.log('Token expired?', payload.exp < Date.now() / 1000);
        } catch (e) {
            console.log('Token format invalid:', e.message);
        }
    }
    
    if (user) {
        try {
            const userData = JSON.parse(user);
            console.log('User data:', userData);
        } catch (e) {
            console.log('User data format invalid:', e.message);
        }
    }
}

// Check auth status
checkAuthStatus();
