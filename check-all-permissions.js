const { pool } = require('./config/database');

async function checkAllPermissions() {
  try {
    console.log('🔍 COMPREHENSIVE PERMISSION & API CHECK\n');
    console.log('=' .repeat(80));
    
    // 1. DETAILED ROLE MANAGEMENT PERMISSIONS
    console.log('\n🎭 ROLE MANAGEMENT MODULE PERMISSIONS:');
    console.log('=' .repeat(50));
    
    const [rolePermissions] = await pool.query(`
      SELECT p.id, p.name, p.display_name, p.description, p.category, p.is_active
      FROM permissions p
      JOIN modules m ON p.module_id = m.id
      WHERE m.name = 'roles'
      ORDER BY p.name
    `);
    
    console.log('\n📋 All Role Management Permissions:');
    rolePermissions.forEach((perm, index) => {
      console.log(`  ${index + 1}. ${perm.name}`);
      console.log(`     Display: ${perm.display_name}`);
      console.log(`     Description: ${perm.description}`);
      console.log(`     Category: ${perm.category}`);
      console.log(`     Status: ${perm.is_active ? 'Active' : 'Inactive'}`);
      console.log('');
    });
    
    // Check which users have role permissions
    console.log('👥 Role Permission Assignments:');
    const [roleUserPerms] = await pool.query(`
      SELECT 
        u.username,
        r.name as role_name,
        r.level,
        GROUP_CONCAT(p.name ORDER BY p.name) as role_permissions
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id 
      LEFT JOIN modules m ON p.module_id = m.id
      WHERE m.name = 'roles' OR p.name LIKE 'role%'
      GROUP BY u.id, r.id
      ORDER BY r.level DESC
    `);
    
    roleUserPerms.forEach(user => {
      const perms = user.role_permissions ? user.role_permissions.split(',') : ['NONE'];
      console.log(`  👤 ${user.username} (${user.role_name} - Level ${user.level}):`);
      perms.forEach(perm => {
        console.log(`     ✓ ${perm}`);
      });
      console.log('');
    });
    
    // 2. BRAND MODULE PERMISSIONS & API TEST
    console.log('\n🏷️ BRAND MODULE ANALYSIS:');
    console.log('=' .repeat(50));
    
    const [brandPermissions] = await pool.query(`
      SELECT p.id, p.name, p.display_name, p.description, p.category, p.is_active
      FROM permissions p
      JOIN modules m ON p.module_id = m.id
      WHERE m.name = 'brands'
      ORDER BY p.name
    `);
    
    console.log('\n📋 All Brand Module Permissions:');
    brandPermissions.forEach((perm, index) => {
      console.log(`  ${index + 1}. ${perm.name}`);
      console.log(`     Display: ${perm.display_name}`);
      console.log(`     Description: ${perm.description}`);
      console.log('');
    });
    
    // Check brand permission assignments
    console.log('👥 Brand Permission Assignments:');
    const [brandUserPerms] = await pool.query(`
      SELECT 
        u.username,
        r.name as role_name,
        r.level,
        GROUP_CONCAT(p.name ORDER BY p.name) as brand_permissions
      FROM users u
      JOIN roles r ON u.role_id = r.id
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id 
      LEFT JOIN modules m ON p.module_id = m.id
      WHERE m.name = 'brands'
      GROUP BY u.id, r.id
      ORDER BY r.level DESC
    `);
    
    brandUserPerms.forEach(user => {
      const perms = user.brand_permissions ? user.brand_permissions.split(',') : ['NONE'];
      console.log(`  👤 ${user.username} (${user.role_name} - Level ${user.level}):`);
      perms.forEach(perm => {
        console.log(`     ✓ ${perm}`);
      });
      console.log('');
    });
    
    // Test Brand API Data
    console.log('🔬 BRAND API DATA TEST:');
    const [brands] = await pool.query(`
      SELECT id, name, description, is_active, created_by, created_at
      FROM brands
      ORDER BY created_at DESC
    `);
    
    console.log(`📊 Total brands in database: ${brands.length}`);
    if (brands.length > 0) {
      console.log('\n📝 Brand Data Sample:');
      brands.slice(0, 3).forEach((brand, index) => {
        console.log(`  ${index + 1}. ${brand.name}`);
        console.log(`     ID: ${brand.id}`);
        console.log(`     Description: ${brand.description || 'No description'}`);
        console.log(`     Status: ${brand.is_active ? 'Active' : 'Inactive'}`);
        console.log(`     Created: ${brand.created_at}`);
        console.log('');
      });
    } else {
      console.log('  ⚠️ No brands found in database!');
    }
    
    // 3. REPORT MODULE PERMISSIONS
    console.log('\n📊 REPORT MODULE ANALYSIS:');
    console.log('=' .repeat(50));
    
    const [reportPermissions] = await pool.query(`
      SELECT p.id, p.name, p.display_name, p.description, p.category, p.is_active
      FROM permissions p
      JOIN modules m ON p.module_id = m.id
      WHERE m.name = 'reports'
      ORDER BY p.name
    `);
    
    console.log('\n📋 All Report Module Permissions:');
    if (reportPermissions.length > 0) {
      reportPermissions.forEach((perm, index) => {
        console.log(`  ${index + 1}. ${perm.name}`);
        console.log(`     Display: ${perm.display_name}`);
        console.log(`     Description: ${perm.description}`);
        console.log(`     Category: ${perm.category}`);
        console.log('');
      });
      
      // Check report permission assignments
      console.log('👥 Report Permission Assignments:');
      const [reportUserPerms] = await pool.query(`
        SELECT 
          u.username,
          r.name as role_name,
          r.level,
          GROUP_CONCAT(p.name ORDER BY p.name) as report_permissions
        FROM users u
        JOIN roles r ON u.role_id = r.id
        LEFT JOIN role_permissions rp ON r.id = rp.role_id
        LEFT JOIN permissions p ON rp.permission_id = p.id 
        LEFT JOIN modules m ON p.module_id = m.id
        WHERE m.name = 'reports'
        GROUP BY u.id, r.id
        ORDER BY r.level DESC
      `);
      
      reportUserPerms.forEach(user => {
        const perms = user.report_permissions ? user.report_permissions.split(',') : ['NONE'];
        console.log(`  👤 ${user.username} (${user.role_name} - Level ${user.level}):`);
        perms.forEach(perm => {
          console.log(`     ✓ ${perm}`);
        });
        console.log('');
      });
    } else {
      console.log('  ⚠️ No report permissions found!');
    }
    
    // 4. COMPLETE PERMISSION MATRIX
    console.log('\n🗂️ COMPLETE PERMISSION MATRIX BY MODULE:');
    console.log('=' .repeat(80));
    
    const [allModulesPerms] = await pool.query(`
      SELECT 
        m.name as module_name,
        m.display_name as module_display,
        COUNT(p.id) as permission_count,
        GROUP_CONCAT(p.name ORDER BY p.name) as permissions
      FROM modules m
      LEFT JOIN permissions p ON m.id = p.module_id AND p.is_active = 1
      WHERE m.is_active = 1
      GROUP BY m.id, m.name, m.display_name
      ORDER BY m.order_index, m.name
    `);
    
    allModulesPerms.forEach(module => {
      console.log(`\n📁 ${module.module_display} (${module.module_name})`);
      console.log(`   Permissions: ${module.permission_count}`);
      if (module.permissions) {
        const perms = module.permissions.split(',');
        perms.forEach(perm => {
          console.log(`   ✓ ${perm}`);
        });
      } else {
        console.log('   ❌ No permissions defined');
      }
    });
    
    // 5. API ENDPOINT AVAILABILITY CHECK
    console.log('\n🌐 API ENDPOINT ANALYSIS:');
    console.log('=' .repeat(50));
    
    console.log('\n📡 Brand API Endpoints:');
    console.log('  GET    /api/brands              → List all brands');
    console.log('  GET    /api/brands/active       → Get active brands');  
    console.log('  GET    /api/brands/:id          → Get single brand');
    console.log('  POST   /api/brands              → Create brand');
    console.log('  PUT    /api/brands/:id          → Update brand');
    console.log('  DELETE /api/brands/:id          → Delete brand');
    console.log('  PUT    /api/brands/:id/toggle   → Toggle brand status');
    console.log('  GET    /api/brands/admin/stats  → Brand statistics');
    
    console.log('\n📡 Role API Endpoints:');
    console.log('  GET    /api/roles                   → List all roles');
    console.log('  GET    /api/roles/:id               → Get single role');
    console.log('  GET    /api/roles/:id/permissions   → Get role permissions');
    console.log('  POST   /api/roles                   → Create role');
    console.log('  PUT    /api/roles/:id               → Update role');
    console.log('  DELETE /api/roles/:id               → Delete role');
    
    // 6. DIAGNOSTIC SUMMARY
    console.log('\n🩺 DIAGNOSTIC SUMMARY:');
    console.log('=' .repeat(50));
    
    const adminUser = brandUserPerms.find(u => u.username === 'Aamir');
    const superAdminUser = brandUserPerms.find(u => u.username === 'admin');
    
    console.log('\n✅ Brand Module Diagnostics:');
    if (adminUser && adminUser.brand_permissions && adminUser.brand_permissions.includes('brands_read')) {
      console.log('  ✅ Admin user has brands_read permission');
    } else {
      console.log('  ❌ Admin user missing brands_read permission');
    }
    
    if (brands.length > 0) {
      console.log('  ✅ Brand data exists in database');
    } else {
      console.log('  ⚠️ No brand data in database');
    }
    
    console.log('\n✅ Role Module Diagnostics:');
    const roleModuleExists = allModulesPerms.find(m => m.module_name === 'roles');
    if (roleModuleExists && roleModuleExists.permission_count > 0) {
      console.log('  ✅ Role module has permissions defined');
    } else {
      console.log('  ❌ Role module missing permissions');
    }
    
    console.log('\n🔍 FRONTEND DEBUGGING TIPS:');
    console.log('If brand module still shows loading:');
    console.log('  1. Check browser dev console for errors');
    console.log('  2. Verify API calls to /api/brands return data');
    console.log('  3. Check if frontend has proper authentication headers');
    console.log('  4. Test API directly: curl -H "Authorization: Bearer <token>" http://localhost:port/api/brands');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking permissions:', error);
    process.exit(1);
  }
}

checkAllPermissions();
