# Card Ownership and Permission System Implementation

## Overview

I've successfully implemented a comprehensive card ownership and permission system as requested. Here's what has been implemented:

## Key Features Implemented

### 1. Automatic Card Assignment to Creator
- **When a card is created**: The system automatically assigns the card to the user who created it
- **Primary card assignment**: New cards are automatically set as the user's primary card
- **Database tracking**: The `created_by` field tracks who originally created the card

### 2. Ownership-Based Permission System
- **Card owners only**: Users can only edit/delete cards they own (either created or assigned to them)
- **Superadmin exception**: Only users with `super_admin` role can edit/delete any card
- **Automatic enforcement**: Middleware automatically validates ownership on all card operations

### 3. User Card Status Management
Users can manage their own cards with these new endpoints:

#### Toggle Card Status (Active/Inactive)
- **Endpoint**: `PATCH /cards/:id/toggle-status`
- **Purpose**: Allows users to activate/deactivate their own cards
- **Permission**: Only card owner or superadmin

#### Set Card Priority (Primary/Secondary)
- **Endpoint**: `PATCH /cards/:id/set-priority`
- **Purpose**: Allows users to set cards as primary or secondary
- **Body**: `{ "is_primary": true/false }`
- **Auto-management**: Setting a card as primary automatically unsets other primary cards for that user

#### Get My Cards
- **Endpoint**: `GET /cards/my-cards`
- **Purpose**: Retrieve only the cards assigned to the current user
- **Ordering**: Primary cards first, then by creation date

## Technical Implementation

### 1. Database Schema
- ✅ `cards.created_by` field already exists (linking to users table)
- ✅ `card_users` table manages user-card assignments with `is_primary` flag
- ✅ Foreign key constraints ensure data integrity

### 2. Middleware Implementation
Created `middleware/cardOwnership.js` with:

#### `checkCardOwnership`
- Validates user owns the card for edit/delete operations
- Allows superadmin access to all cards
- Checks both `created_by` and `card_users` assignment

#### `checkCardAssignmentOwnership`
- Validates card ownership for card-user assignment operations
- Handles different parameter patterns (card_id, params.id, etc.)
- Allows superadmin full access

### 3. Controller Updates

#### Cards Controller (`controllers/cardsController.js`)
**Enhanced `createCard` method:**
- Automatically sets `created_by` field
- Creates `card_users` entry with `is_primary = true`
- Transactional operations ensure data consistency

**New methods added:**
- `toggleCardStatus` - Toggle card active/inactive
- `setCardPriority` - Set card as primary/secondary
- `getMyCards` - Get user's own cards

#### Updated Routes (`routes/cardsRoutes.js`)
- Added ownership checks to update/delete operations
- New routes for card status management:
  - `GET /cards/my-cards`
  - `PATCH /cards/:id/toggle-status`
  - `PATCH /cards/:id/set-priority`

#### Card Users Routes (`routes/cardUsersRoutes.js`)
- Added authentication and RBAC middleware
- Added ownership checks for all card-user assignment operations
- Only card owners or superadmin can modify assignments

## Permission Matrix

| Operation | Card Owner | Superadmin | Other Users |
|-----------|------------|------------|-------------|
| Create Card | ✅ | ✅ | ✅ |
| View All Cards | ✅ | ✅ | ✅ |
| View Own Cards | ✅ | ✅ | ✅ |
| Edit Own Card | ✅ | ✅ | ❌ |
| Edit Other's Card | ❌ | ✅ | ❌ |
| Delete Own Card | ✅ | ✅ | ❌ |
| Delete Other's Card | ❌ | ✅ | ❌ |
| Toggle Card Status | ✅ | ✅ | ❌ |
| Set Card Priority | ✅ | ✅ | ❌ |
| Assign Card to User | ✅ | ✅ | ❌ |
| Modify Card Assignment | ✅ | ✅ | ❌ |

## API Endpoints Summary

### Existing Endpoints (Enhanced)
```
POST /cards              - Create card (auto-assigns to creator)
GET /cards               - List all cards
GET /cards/:id           - Get specific card
PUT /cards/:id           - Update card (ownership check)
DELETE /cards/:id        - Delete card (ownership check)
POST /cards/:id/add-balance - Add balance (ownership check)
```

### New Endpoints
```
GET /cards/my-cards                    - Get current user's cards
PATCH /cards/:id/toggle-status         - Toggle card active/inactive
PATCH /cards/:id/set-priority          - Set card as primary/secondary
```

### Card Users Endpoints (Enhanced with ownership checks)
```
POST /card-users         - Create assignment (ownership check)
PUT /card-users/:id      - Update assignment (ownership check)
DELETE /card-users/:id   - Delete assignment (ownership check)
```

## Security Features

1. **Automatic Ownership Validation**: All card operations validate ownership
2. **Superadmin Override**: Superadmin can access any card for administrative purposes
3. **Transaction Safety**: All database operations use transactions
4. **Input Validation**: Comprehensive input validation with Joi schemas
5. **Rate Limiting**: All endpoints have appropriate rate limiting
6. **Error Handling**: Secure error messages that don't leak sensitive information

## Usage Examples

### Create a Card (Auto-assignment)
```javascript
POST /cards
{
  "card_name": "My Business Card",
  "card_type": "Visa",
  "current_balance": 1000.00
}
// Automatically assigns to creator as primary card
```

### Toggle Card Status
```javascript
PATCH /cards/123/toggle-status
// Toggles between active/inactive
```

### Set Card Priority
```javascript
PATCH /cards/123/set-priority
{
  "is_primary": true
}
// Sets as primary, unsets other primary cards for user
```

### Get My Cards
```javascript
GET /cards/my-cards
// Returns only cards assigned to current user
```

## Error Handling

The system provides clear error messages for:
- **403 Forbidden**: When user tries to access cards they don't own
- **404 Not Found**: When card doesn't exist
- **409 Conflict**: When trying to create duplicate card names
- **400 Bad Request**: For validation errors

## Backwards Compatibility

- All existing API endpoints remain functional
- No breaking changes to existing card operations
- Enhanced functionality is additive only
- Database migration script ensures existing cards have proper ownership

This implementation fully satisfies your requirements:
✅ Cards automatically assigned to creators
✅ Only card owners can edit/delete (except superadmin)
✅ Users can set cards as primary/secondary
✅ Users can activate/deactivate their cards
✅ Comprehensive permission system with proper security
