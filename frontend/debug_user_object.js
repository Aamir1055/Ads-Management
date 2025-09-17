// Simple frontend debug script
// Paste this into your browser console AFTER logging in

console.log('🔍 DEBUG: User object analysis...\n');

// Check localStorage
const userString = localStorage.getItem('user');
const token = localStorage.getItem('access_token');

console.log('📦 localStorage data:');
console.log('   Token exists:', !!token);
console.log('   Token length:', token ? token.length : 0);
console.log('   User string exists:', !!userString);

if (userString) {
  try {
    const user = JSON.parse(userString);
    console.log('👤 User object structure:', user);
    console.log('');
    
    // Check role information
    console.log('🎭 Role information:');
    console.log('   user.role_name:', user.role_name);
    console.log('   user.role?.name:', user.role?.name);
    console.log('   user.role:', user.role);
    console.log('   user.role_id:', user.role_id);
    console.log('');
    
    // Check permissions
    console.log('🔑 Permission information:');
    console.log('   user.permissions type:', typeof user.permissions);
    console.log('   user.permissions:', user.permissions);
    console.log('   user.userPermissions:', user.userPermissions);
    console.log('');
    
    // Check super admin status
    const isSuperAdmin1 = user.role_name === 'super_admin';
    const isSuperAdmin2 = user.role?.name === 'super_admin';
    const isSuperAdmin3 = user.role === 'super_admin';
    
    console.log('🔍 Super admin checks:');
    console.log('   user.role_name === "super_admin":', isSuperAdmin1);
    console.log('   user.role?.name === "super_admin":', isSuperAdmin2);
    console.log('   user.role === "super_admin":', isSuperAdmin3);
    console.log('   Should be super admin:', isSuperAdmin1 || isSuperAdmin2 || isSuperAdmin3);
    
  } catch (error) {
    console.log('❌ Error parsing user object:', error);
  }
} else {
  console.log('❌ No user data found in localStorage');
}

console.log('\n💡 EXPECTED FOR BRANDS TO WORK:');
console.log('   - user.role_name should be "super_admin"');
console.log('   - OR user.role.name should be "super_admin"'); 
console.log('   - OR user should have permissions array with brand permissions');

// Test permission check manually
if (userString) {
  try {
    const user = JSON.parse(userString);
    const isSuperAdmin = user?.role_name === 'super_admin' || user?.role?.name === 'super_admin';
    
    if (isSuperAdmin) {
      console.log('\n✅ SHOULD WORK: User is detected as super admin');
    } else {
      console.log('\n❌ PROBLEM: User is NOT detected as super admin');
      console.log('   This is why brand permissions are failing');
    }
  } catch (error) {
    console.log('❌ Error in manual check:', error);
  }
}
