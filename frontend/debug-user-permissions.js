// Debug script to check user permissions data
// Run this in the browser console on the Brand Management page

console.log('=== USER PERMISSION DEBUG ===');

// Check localStorage data
const accessToken = localStorage.getItem('access_token');
const userString = localStorage.getItem('user');

console.log('1. Access Token exists:', !!accessToken);
console.log('2. User string from localStorage:', userString);

if (userString) {
  try {
    const user = JSON.parse(userString);
    console.log('3. Parsed user object:', user);
    console.log('4. User role_name:', user.role_name);
    console.log('5. User role:', user.role);
    console.log('6. User permissions:', user.permissions);
    console.log('7. User userPermissions:', user.userPermissions);
    
    // Check role structure
    if (user.role) {
      console.log('8. Role object:', user.role);
      console.log('9. Role name:', user.role.name);
      console.log('10. Role permissions:', user.role.permissions);
    }
    
    // Check if super admin
    const isSuperAdmin = user?.role_name === 'super_admin' || user?.role?.name === 'super_admin';
    console.log('11. Is Super Admin:', isSuperAdmin);
    
    // Check specific brand permissions
    const hasBrandsRead = user?.permissions?.includes?.('brands_read') || 
                         user?.permissions?.brands_read ||
                         user?.userPermissions?.includes?.('brands_read');
    console.log('12. Has brands_read permission:', hasBrandsRead);
    
  } catch (error) {
    console.error('Error parsing user data:', error);
  }
}

// Check what useAuth returns
console.log('=== CHECKING useAuth CONTEXT ===');
// This will need to be run in the React component context
