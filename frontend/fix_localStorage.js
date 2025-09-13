// Direct fix for localStorage token issue
// Run this in your browser console

console.log('🔧 FIXING LOCALSTORAGE TOKEN ISSUE');
console.log('==================================');

// Step 1: Clear old tokens
console.log('1. Clearing old tokens...');
localStorage.removeItem('access_token');
localStorage.removeItem('authToken');
localStorage.removeItem('user');
console.log('✅ Old tokens cleared');

// Step 2: Get fresh token
console.log('2. Getting fresh token...');
fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
    })
})
.then(response => response.json())
.then(data => {
    console.log('Login response:', data);
    
    if (data.success && data.data.access_token) {
        const token = data.data.access_token;
        
        // Store tokens correctly
        localStorage.setItem('access_token', token);
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        
        console.log('✅ Fresh tokens stored');
        console.log('Token sample:', token.substring(0, 30) + '...');
        
        // Test user management immediately
        return fetch('http://localhost:5000/api/user-management', {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
    } else {
        throw new Error('Login failed');
    }
})
.then(response => {
    console.log('User management test - Status:', response.status);
    
    if (response.status === 200) {
        console.log('✅ SUCCESS! User management is working');
        console.log('🔄 Refreshing page...');
        window.location.reload();
    } else if (response.status === 403) {
        console.log('❌ Still getting 403 - deeper issue exists');
        return response.json();
    } else {
        console.log('⚠️  Unexpected status:', response.status);
        return response.json();
    }
})
.then(data => {
    if (data) {
        console.log('Response data:', data);
    }
})
.catch(error => {
    console.error('❌ Error:', error);
});

console.log('📝 Instructions:');
console.log('1. Copy this entire script');
console.log('2. Open browser Developer Tools (F12)');
console.log('3. Go to Console tab');
console.log('4. Paste and press Enter');
console.log('5. Page should refresh automatically if fixed');
