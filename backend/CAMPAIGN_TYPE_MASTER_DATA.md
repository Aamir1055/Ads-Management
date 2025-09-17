# Campaign Type Module - Master Data Access Control

## Overview
The Campaign Type Module is implemented as a **Master Data Module** with special access control rules that differ from other modules in the system.

## Access Control Rules

### 📖 **Read Access (GET Operations)**
- **Available to ALL authenticated users** regardless of role
- **No specific permissions required** beyond authentication
- **Purpose**: Allows all users to access campaign types when creating/managing campaigns
- **Routes**: 
  - `GET /api/campaign-types` - List all campaign types
  - `GET /api/campaign-types/:id` - Get specific campaign type

### 🛡️ **Write Access (CREATE/UPDATE/DELETE Operations)**
- **SuperAdmin ONLY** - No other roles have access
- **Purpose**: Master data should only be modified by system administrators
- **Routes**:
  - `POST /api/campaign-types` - Create campaign type (SuperAdmin only)
  - `PUT /api/campaign-types/:id` - Update campaign type (SuperAdmin only) 
  - `DELETE /api/campaign-types/:id` - Delete campaign type (SuperAdmin only)

## Error Messages

When non-SuperAdmin users try to perform write operations, they receive:

```json
{
  "success": false,
  "message": "SuperAdmin access required. This master data module can only be modified by SuperAdmin users.",
  "details": {
    "reason": "Master data access restriction",
    "requiredRole": "SuperAdmin",
    "currentAction": "Master data modification"
  }
}
```

## Why This Pattern?

### 1. **Master Data Integrity**
- Campaign Types are foundational data used across the system
- Prevents accidental modification by regular users
- Ensures data consistency across all campaigns

### 2. **Operational Efficiency** 
- All users can read campaign types without permission checks
- No need to assign specific "campaign_types_read" permissions
- Simplifies permission management for this master data

### 3. **System Usability**
- Users creating campaigns can access campaign types seamlessly
- No permission-related blocking when using dropdown lists
- Maintains user experience while securing modifications

## Technical Implementation

### Authentication Flow
```javascript
// All routes require authentication
router.use(authenticateToken);
router.use(attachUserPermissions);

// Read operations - no additional checks
router.get('/', getAllCampaignTypes);
router.get('/:id', getCampaignTypeById);

// Write operations - SuperAdmin only
router.post('/', requireSuperAdmin, createCampaignType);
router.put('/:id', requireSuperAdmin, updateCampaignType);
router.delete('/:id', requireSuperAdmin, deleteCampaignType);
```

### SuperAdmin Check
```javascript
const requireSuperAdmin = async (req, res, next) => {
  const [roleInfo] = await pool.query(`
    SELECT name, level FROM roles 
    WHERE id = ? AND (name = 'SuperAdmin' OR name = 'Super Admin')
    LIMIT 1
  `, [req.user.role_id]);

  if (roleInfo.length === 0) {
    return res.status(403).json({
      success: false,
      message: 'SuperAdmin access required. This master data module can only be modified by SuperAdmin users.',
      details: {
        reason: 'Master data access restriction',
        requiredRole: 'SuperAdmin',
        currentAction: 'Master data modification'
      }
    });
  }
  
  next();
};
```

## User Roles & Access Matrix

| Role | Read Campaign Types | Create Campaign Types | Update Campaign Types | Delete Campaign Types |
|------|-------------------|---------------------|---------------------|---------------------|
| **SuperAdmin** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| **Admin** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Manager** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **Advertiser** | ✅ Yes | ❌ No | ❌ No | ❌ No |
| **All Others** | ✅ Yes | ❌ No | ❌ No | ❌ No |

## Database Considerations

### No Special Permissions Required
Unlike other modules, Campaign Types don't require specific permissions in the database:
- No `campaign_types_read` permission needed
- No `campaign_types_create` permission needed
- Access is controlled purely by role-based checks

### SuperAdmin Role Setup
Ensure your database has a SuperAdmin role configured:
```sql
-- Example SuperAdmin role
INSERT INTO roles (name, description, level) 
VALUES ('SuperAdmin', 'System Super Administrator with master data access', 10);
```

## Best Practices

### 1. **For Developers**
- Use Campaign Types in dropdown lists without permission checks
- Always validate SuperAdmin access before write operations
- Log all master data modifications for audit purposes

### 2. **For System Administrators**
- Limit SuperAdmin role assignment to trusted system administrators
- Regular backup of campaign types before modifications
- Document all changes to master data

### 3. **For Frontend Applications**
- Show campaign type dropdowns to all authenticated users
- Hide Create/Edit/Delete buttons for non-SuperAdmin users
- Handle 403 errors gracefully with appropriate messaging

## Integration with Campaign Module

Campaign Types integrate seamlessly with the Campaign module:
- All users can access campaign types when creating campaigns
- No permission barriers for reading master data
- Ensures consistent campaign type usage across the system

This master data pattern ensures system integrity while maintaining usability for all users.
