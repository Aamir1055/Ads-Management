/**
 * Fix permission bypass issues and data privacy problems
 */

const fs = require('fs');
const path = require('path');

function fixPermissionBypasses() {
  console.log('🔧 Fixing permission bypass issues...\n');
  
  try {
    // 1. Fix permissionsRoutes.js - add RBAC middleware
    console.log('1️⃣ Adding RBAC middleware to permissionsRoutes.js...');
    
    const permissionsRoutePath = path.join(__dirname, 'routes', 'permissionsRoutes.js');
    let permissionsContent = fs.readFileSync(permissionsRoutePath, 'utf8');
    
    // Check if RBAC is already imported
    if (!permissionsContent.includes('rbacMiddleware')) {
      // Add RBAC import after existing imports
      const importSection = `const { permissionsController } = require('../controllers/permissionsController');
const { protect } = require('../middleware/auth');
const { attachUserPermissions } = require('../middleware/frontendPermissionCheck');`;
      
      const newImportSection = `const { permissionsController } = require('../controllers/permissionsController');
const { protect } = require('../middleware/auth');
const { attachUserPermissions } = require('../middleware/frontendPermissionCheck');
const { requireAdmin, requireSuperAdmin } = require('../middleware/rbacMiddleware');`;
      
      permissionsContent = permissionsContent.replace(importSection, newImportSection);
      
      // Add RBAC middleware to role management endpoints
      const roleManagementEndpoints = [
        'router.post(\'/role/assign\'',
        'router.post(\'/assign-role\'',
        'router.post(\'/roles\'',
        'router.put(\'/roles/:id\'',
        'router.delete(\'/role/:id\'',
        'router.post(\'/grant-role-permission\'',
        'router.delete(\'/revoke-role-permission\')'
      ];
      
      roleManagementEndpoints.forEach(endpoint => {
        const oldPattern = `${endpoint}, rlWrite,`;
        const newPattern = `${endpoint}, rlWrite, requireAdmin,`;
        permissionsContent = permissionsContent.replace(oldPattern, newPattern);
      });
      
      fs.writeFileSync(permissionsRoutePath, permissionsContent);
      console.log('✅ Added RBAC middleware to permissionsRoutes.js');
    } else {
      console.log('✅ RBAC middleware already exists in permissionsRoutes.js');
    }
    
    // 2. Create a master campaign types route (without data privacy filtering)
    console.log('\n2️⃣ Creating master campaign types route...');
    
    const campaignTypesPath = path.join(__dirname, 'routes', 'campaignTypeRoutes_privacy.js');
    let campaignContent = fs.readFileSync(campaignTypesPath, 'utf8');
    
    // Add a master endpoint that doesn't filter by user
    const masterEndpoint = `
// =============================================================================
// MASTER DATA ROUTES (NO USER FILTERING)
// =============================================================================

/**
 * GET /api/campaign-types/master
 * Gets ALL campaign types without user filtering (for dropdowns)
 * Campaign types are master data that should be visible to all users
 * - RBAC: Requires campaign_types_read permission
 */
router.get('/master', 
  listLimiter,
  createPermissionMiddleware.campaignTypes.read(), // 🔒 RBAC: campaign_types_read required
  async (req, res) => {
    try {
      const { pool } = require('../config/database');
      
      // Get ALL campaign types without user filtering
      const [campaignTypes] = await pool.query(\`
        SELECT 
          id,
          type_name,
          description,
          is_active,
          created_at
        FROM campaign_types 
        WHERE is_active = 1
        ORDER BY type_name ASC
      \`);
      
      res.json({
        success: true,
        message: \`Retrieved \${campaignTypes.length} campaign type(s)\`,
        timestamp: new Date().toISOString(),
        data: campaignTypes
      });
    } catch (error) {
      console.error('Error fetching master campaign types:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch campaign types',
        error: error.message
      });
    }
  }
);`;
    
    if (!campaignContent.includes('/master')) {
      // Insert master endpoint before the regular GET route
      const insertPoint = 'router.get(\'/';
      const insertIndex = campaignContent.indexOf(insertPoint);
      if (insertIndex !== -1) {
        campaignContent = campaignContent.slice(0, insertIndex) + 
                         masterEndpoint + '\n\n' + 
                         campaignContent.slice(insertIndex);
        
        fs.writeFileSync(campaignTypesPath, campaignContent);
        console.log('✅ Added master campaign types endpoint');
      }
    } else {
      console.log('✅ Master campaign types endpoint already exists');
    }
    
    // 3. Create fixes for card users routes
    console.log('\n3️⃣ Checking card users routes...');
    
    const cardUsersPath = path.join(__dirname, 'routes', 'cardUsers_privacy.js');
    if (fs.existsSync(cardUsersPath)) {
      const cardUsersContent = fs.readFileSync(cardUsersPath, 'utf8');
      
      // Check if delete routes have proper RBAC
      const hasDeleteRBAC = cardUsersContent.includes('card_users_delete') || 
                           cardUsersContent.includes('cardUsers.delete');
      
      if (!hasDeleteRBAC) {
        console.log('❌ Card users delete route missing RBAC protection');
        console.log('   This needs manual review and fixing');
      } else {
        console.log('✅ Card users routes appear to have RBAC protection');
      }
    } else {
      console.log('❌ Card users privacy routes file not found');
    }
    
    // 4. Create a summary of fixes needed
    console.log('\n📋 SUMMARY OF FIXES APPLIED:');
    console.log('✅ Added RBAC middleware to permissionsRoutes.js role management endpoints');
    console.log('✅ Created master campaign types endpoint (no user filtering)');
    console.log('');
    
    console.log('🔧 REMAINING ISSUES TO FIX:');
    console.log('1. Update frontend to use /api/campaign-types/master for dropdowns');
    console.log('2. Fix form close button issues (frontend)');
    console.log('3. Add proper error messages for card users operations');
    console.log('4. Review all delete operations for proper RBAC protection');
    console.log('5. Fix status update operations');
    
    // 5. Create recommendations for frontend fixes
    console.log('\n💡 FRONTEND RECOMMENDATIONS:');
    console.log('• Use /api/campaign-types/master instead of /api/campaign-types for dropdowns');
    console.log('• Add proper error handling for 403 responses in forms');
    console.log('• Show permission denied messages for blocked operations');
    console.log('• Fix form modal close button event handlers');
    
  } catch (error) {
    console.error('❌ Error fixing permission bypasses:', error);
  }
}

fixPermissionBypasses();
