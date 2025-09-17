// Debug permissions script
// Run this in the browser console

console.log('=== PERMISSION DEBUG ===');

// Get data from localStorage
const userStr = localStorage.getItem('user');
const token = localStorage.getItem('access_token');

console.log('1. Token exists:', !!token);
console.log('2. Raw user string:', userStr);

if (userStr) {
    try {
        const user = JSON.parse(userStr);
        console.log('3. Parsed user:', user);
        console.log('4. User role_name:', user.role_name);
        console.log('5. User role object:', user.role);
        console.log('6. User permissions array:', user.permissions);
        
        // Check super admin
        const isSuperAdmin1 = user?.role_name === 'super_admin';
        const isSuperAdmin2 = user?.role?.name === 'super_admin';
        console.log('7. Is super admin (role_name):', isSuperAdmin1);
        console.log('8. Is super admin (role.name):', isSuperAdmin2);
        
        // Check direct permissions
        const hasBrandsRead = user?.permissions?.includes?.('brands_read');
        const hasBrandsCreate = user?.permissions?.includes?.('brands_create');
        const hasBrandsUpdate = user?.permissions?.includes?.('brands_update');
        const hasBrandsDelete = user?.permissions?.includes?.('brands_delete');
        
        console.log('9. Direct permission checks:');
        console.log('   - brands_read:', hasBrandsRead);
        console.log('   - brands_create:', hasBrandsCreate);
        console.log('   - brands_update:', hasBrandsUpdate);
        console.log('   - brands_delete:', hasBrandsDelete);
        
        // Final permission logic
        const finalCanView = isSuperAdmin1 || isSuperAdmin2 || hasBrandsRead || hasBrandsCreate || hasBrandsUpdate;
        console.log('10. Final canView result:', finalCanView);
        
    } catch (e) {
        console.error('Error parsing user:', e);
    }
}

console.log('=== END DEBUG ===');
