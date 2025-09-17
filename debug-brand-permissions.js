const axios = require('axios');
const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'ads reporting'
};

async function comprehensiveDebug() {
  let connection;
  
  console.log('🔍 COMPREHENSIVE BRAND PERMISSION DEBUG');
  console.log('═══════════════════════════════════════════');
  
  try {
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected\n');
    
    // STEP 1: Test fresh login and examine response
    console.log('1️⃣ TESTING FRESH LOGIN');
    console.log('─────────────────────────');
    
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'admin',
      password: 'password'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data.message);
      return;
    }
    
    const token = loginResponse.data.data.access_token;
    const loginUser = loginResponse.data.data.user;
    
    console.log('✅ Fresh login successful');
    console.log('📊 Login response user object:');
    console.log(JSON.stringify(loginUser, null, 2));
    console.log('');
    
    // Check if role_name is now included
    const hasRoleName = loginUser.hasOwnProperty('role_name');
    console.log(`🔍 role_name included in login response: ${hasRoleName}`);
    if (hasRoleName) {
      console.log(`   role_name value: "${loginUser.role_name}"`);
    }
    console.log('');
    
    // STEP 2: Test the brands API directly
    console.log('2️⃣ TESTING BRANDS API DIRECTLY');
    console.log('──────────────────────────────');
    
    try {
      const brandsResponse = await axios.get('http://localhost:5000/api/brands', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Brands API successful!');
      console.log(`📊 Status: ${brandsResponse.status}`);
      console.log(`📊 Success: ${brandsResponse.data.success}`);
      console.log(`📊 Records: ${brandsResponse.data.data?.length || 0}`);
      
      if (brandsResponse.data.data && brandsResponse.data.data.length > 0) {
        console.log('📊 Sample brand:', brandsResponse.data.data[0]);
      }
      
    } catch (error) {
      console.log('❌ Brands API failed!');
      console.log(`   Status: ${error.response?.status}`);
      console.log(`   Message: ${error.response?.data?.message}`);
      console.log(`   Details:`, error.response?.data?.details);
      
      // This would indicate a backend permission issue
      if (error.response?.status === 403) {
        console.log('🚨 BACKEND PERMISSION ISSUE DETECTED');
        
        // Check what the middleware is actually doing
        const details = error.response.data.details;
        if (details) {
          console.log(`   User role detected by middleware: ${details.userRole}`);
          console.log(`   Required permission: ${details.requiredPermission}`);
          console.log(`   Available actions: ${details.availableActions?.join(', ')}`);
        }
      }
    }
    console.log('');
    
    // STEP 3: Check database role mapping
    console.log('3️⃣ DATABASE ROLE VERIFICATION');
    console.log('─────────────────────────────');
    
    const [userRole] = await connection.execute(`
      SELECT u.id, u.username, u.role_id, r.name as role_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.username = 'admin'
    `);
    
    if (userRole.length > 0) {
      const dbUser = userRole[0];
      console.log('📊 Database user info:');
      console.log(`   ID: ${dbUser.id}`);
      console.log(`   Username: ${dbUser.username}`);
      console.log(`   Role ID: ${dbUser.role_id}`);
      console.log(`   Role Name: ${dbUser.role_name}`);
      
      // Check if login response matches database
      const roleNameMatch = loginUser.role_name === dbUser.role_name;
      console.log(`🔍 Role name match: ${roleNameMatch}`);
      if (!roleNameMatch) {
        console.log('🚨 MISMATCH DETECTED!');
        console.log(`   Login response role_name: "${loginUser.role_name}"`);
        console.log(`   Database role_name: "${dbUser.role_name}"`);
      }
    } else {
      console.log('❌ No user found in database');
    }
    console.log('');
    
    // STEP 4: Test middleware permission check manually
    console.log('4️⃣ MANUAL MIDDLEWARE PERMISSION CHECK');
    console.log('─────────────────────────────────────');
    
    const [permissionCheck] = await connection.execute(`
      SELECT 
        r.name as role_name,
        r.level as role_level,
        p.name as permission_name,
        p.display_name as permission_display_name
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      WHERE u.username = 'admin' AND (p.name LIKE 'brands_%' OR p.name IS NULL)
      ORDER BY p.name
    `);
    
    if (permissionCheck.length > 0) {
      const userRole = permissionCheck[0];
      console.log(`📊 User role: ${userRole.role_name} (level: ${userRole.role_level})`);
      
      const brandPermissions = permissionCheck
        .filter(p => p.permission_name)
        .map(p => p.permission_display_name);
      
      if (brandPermissions.length > 0) {
        console.log(`📊 Brand permissions: ${brandPermissions.join(', ')}`);
      } else {
        console.log('❌ NO brand permissions found for this user!');
      }
      
      // Check if it's a SuperAdmin
      const isSuperAdmin = userRole.role_name === 'super_admin' || 
                          userRole.role_name === 'SuperAdmin' || 
                          userRole.role_name === 'Super Admin' ||
                          userRole.role_level >= 10;
      
      console.log(`🔍 Should be SuperAdmin: ${isSuperAdmin}`);
      
      if (isSuperAdmin) {
        console.log('✅ User should have SuperAdmin access (bypasses permission checks)');
      } else if (brandPermissions.length === 0) {
        console.log('🚨 User has NO brand permissions and is NOT SuperAdmin');
      }
    }
    console.log('');
    
    // STEP 5: Test the frontend permission detection logic manually
    console.log('5️⃣ FRONTEND PERMISSION LOGIC TEST');
    console.log('─────────────────────────────');
    
    // Simulate the frontend logic
    const user = loginUser;
    
    console.log('Testing frontend permission detection logic:');
    console.log(`user?.role_name === 'super_admin': ${user?.role_name === 'super_admin'}`);
    console.log(`user?.role?.name === 'super_admin': ${user?.role?.name === 'super_admin'}`);
    console.log(`user?.role === 'super_admin': ${user?.role === 'super_admin'}`);
    
    const isSuperAdminFrontend = user?.role_name === 'super_admin' || 
                                user?.role?.name === 'super_admin' ||
                                user?.role === 'super_admin';
    
    console.log(`🔍 Frontend SuperAdmin detection result: ${isSuperAdminFrontend}`);
    
    if (!isSuperAdminFrontend) {
      console.log('🚨 FRONTEND WILL NOT DETECT USER AS SUPERADMIN!');
      console.log('   This is why brand permissions are failing');
      
      // Check what the user object structure actually is
      console.log('\n📊 User object analysis:');
      console.log('   user.role_name:', user.role_name);
      console.log('   user.role:', user.role);
      console.log('   typeof user.role:', typeof user.role);
      console.log('   user.permissions:', user.permissions);
    } else {
      console.log('✅ Frontend should detect user as SuperAdmin');
    }
    console.log('');
    
    // STEP 6: Final diagnosis
    console.log('6️⃣ FINAL DIAGNOSIS');
    console.log('──────────────────');
    
    if (!hasRoleName) {
      console.log('🚨 ISSUE: Login response does not include role_name');
      console.log('   SOLUTION: Backend auth controller needs to be fixed to include role_name');
    } else if (loginUser.role_name !== 'super_admin') {
      console.log('🚨 ISSUE: User role_name is not "super_admin"');
      console.log(`   Current role_name: "${loginUser.role_name}"`);
      console.log('   SOLUTION: Either fix database role name or update frontend logic');
    } else if (!isSuperAdminFrontend) {
      console.log('🚨 ISSUE: Frontend permission logic is not detecting SuperAdmin correctly');
      console.log('   SOLUTION: Update frontend usePermissions hook');
    } else {
      console.log('❓ MYSTERIOUS ISSUE: Everything looks correct but still failing');
      console.log('   SOLUTION: Need to debug frontend component directly');
    }
    
  } catch (error) {
    console.error('❌ Debug script error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Backend server is not running');
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

comprehensiveDebug();
