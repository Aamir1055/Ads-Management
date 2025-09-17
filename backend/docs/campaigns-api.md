# Campaigns API Documentation

## Overview
The Campaigns API provides complete CRUD operations for managing advertising campaigns with support for multiple targeting options including persona, gender, age ranges, locations, and creative types.

## Base URL
```
/api/campaigns
```

## Authentication
All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Permissions
The API uses role-based access control (RBAC) with the following permissions:
- `campaigns:view` - View campaigns
- `campaigns:create` - Create new campaigns  
- `campaigns:update` - Update existing campaigns
- `campaigns:delete` - Delete campaigns

## Data Structure

### Campaign Object
```json
{
  "id": 1,
  "name": "Summer Sale Campaign",
  "persona": ["young_professionals", "students"],
  "gender": ["male", "female"],
  "min_age": 18,
  "max_age": 35,
  "location": ["New York", "Los Angeles", "Chicago"],
  "creatives": "image",
  "is_enabled": true,
  "status": "active",
  "campaign_type_id": 2,
  "brand": 1,
  "created_by": 5,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z",
  "campaign_type_name": "Display Advertising",
  "brand_name": "Nike",
  "created_by_username": "john.doe"
}
```

### Field Descriptions
- `id` (integer): Unique campaign identifier
- `name` (string): Campaign name (required, max 255 characters)
- `persona` (array): Target personas as JSON array (optional)
- `gender` (array): Target genders as JSON array (optional)
- `min_age` (integer): Minimum target age (0-100, optional)
- `max_age` (integer): Maximum target age (0-100, optional)
- `location` (array): Target locations as JSON array (optional)
- `creatives` (enum): Creative type - "video", "image", "carousel", "collection" (default: "image")
- `is_enabled` (boolean): Enable/disable toggle (default: true)
- `status` (enum): Campaign status - "active", "inactive" (default: "active")
- `campaign_type_id` (integer): Reference to campaign type (optional)
- `brand` (integer): Reference to brand (optional)
- `created_by` (integer): User who created the campaign
- `created_at` (datetime): Creation timestamp
- `updated_at` (datetime): Last update timestamp

## Endpoints

### 1. Get All Campaigns
```http
GET /api/campaigns
```

**Query Parameters:**
- `page` (integer, optional): Page number (default: 1)
- `limit` (integer, optional): Items per page (1-100, default: 10)
- `search` (string, optional): Search in campaign name, brand name, campaign type (max 255 chars)
- `status` (string, optional): Filter by status ("active" or "inactive")
- `enabled` (string, optional): Filter by enabled status ("true" or "false")
- `brand_id` (integer, optional): Filter by brand ID
- `campaign_type_id` (integer, optional): Filter by campaign type ID
- `creatives` (string, optional): Filter by creative type

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Summer Sale Campaign",
      // ... full campaign object
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  },
  "message": "Found 25 campaigns"
}
```

### 2. Get Campaign by ID
```http
GET /api/campaigns/{id}
```

**Path Parameters:**
- `id` (integer, required): Campaign ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Summer Sale Campaign",
    // ... full campaign object
  },
  "message": "Campaign retrieved successfully"
}
```

### 3. Create Campaign
```http
POST /api/campaigns
```

**Request Body:**
```json
{
  "name": "New Campaign",
  "persona": ["young_professionals"],
  "gender": ["female"],
  "min_age": 25,
  "max_age": 45,
  "location": ["San Francisco"],
  "creatives": "video",
  "campaign_type_id": 1,
  "brand": 2
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 26,
    "name": "New Campaign",
    // ... full campaign object
  },
  "message": "Campaign created successfully"
}
```

### 4. Update Campaign
```http
PUT /api/campaigns/{id}
```

**Path Parameters:**
- `id` (integer, required): Campaign ID

**Request Body:**
```json
{
  "name": "Updated Campaign Name",
  "status": "inactive",
  "max_age": 50
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Updated Campaign Name",
    // ... full campaign object
  },
  "message": "Campaign updated successfully"
}
```

### 5. Delete Campaign
```http
DELETE /api/campaigns/{id}
```

**Path Parameters:**
- `id` (integer, required): Campaign ID

**Response:**
```json
{
  "success": true,
  "message": "Campaign deleted successfully"
}
```

### 6. Toggle Campaign Status (Active/Inactive)
```http
PUT /api/campaigns/{id}/toggle-status
```

**Path Parameters:**
- `id` (integer, required): Campaign ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "inactive",
    // ... full campaign object
  },
  "message": "Campaign deactivated successfully"
}
```

### 7. Toggle Campaign Enabled Status
```http
PUT /api/campaigns/{id}/toggle-enabled
```

**Path Parameters:**
- `id` (integer, required): Campaign ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "is_enabled": false,
    // ... full campaign object
  },
  "message": "Campaign disabled successfully"
}
```

### 8. Activate Campaign
```http
PUT /api/campaigns/{id}/activate
```

**Path Parameters:**
- `id` (integer, required): Campaign ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "active",
    // ... full campaign object
  },
  "message": "Campaign activated successfully"
}
```

### 9. Deactivate Campaign
```http
PUT /api/campaigns/{id}/deactivate
```

**Path Parameters:**
- `id` (integer, required): Campaign ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "inactive",
    // ... full campaign object
  },
  "message": "Campaign deactivated successfully"
}
```

### 10. Get Campaign Statistics
```http
GET /api/campaigns/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_campaigns": 150,
    "active_campaigns": 120,
    "inactive_campaigns": 30,
    "enabled_campaigns": 145,
    "disabled_campaigns": 5,
    "unique_brands": 25,
    "unique_campaign_types": 8,
    "total_creators": 12,
    "recent_campaigns": 15,
    "creatives_breakdown": [
      {
        "creatives": "image",
        "count": 85
      },
      {
        "creatives": "video", 
        "count": 45
      },
      {
        "creatives": "carousel",
        "count": 15
      },
      {
        "creatives": "collection",
        "count": 5
      }
    ]
  },
  "message": "Campaign statistics retrieved successfully"
}
```

### 11. Get Campaigns by Brand
```http
GET /api/campaigns/by-brand/{brandId}
```

**Path Parameters:**
- `brandId` (integer, required): Brand ID

**Query Parameters:**
- `search` (string, optional): Search term
- `status` (string, optional): Filter by status
- `enabled` (string, optional): Filter by enabled status

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      // ... campaign objects for the brand
    }
  ],
  "message": "Found 5 campaigns"
}
```

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "name",
      "message": "Campaign name is required",
      "value": ""
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized access"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Campaign not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Database connection failed"
}
```

## Validation Rules

### Campaign Creation/Update
- `name`: Required (create only), 1-255 characters
- `persona`: Optional, valid JSON array
- `gender`: Optional, valid JSON array
- `min_age`: Optional, integer 0-100
- `max_age`: Optional, integer 0-100
- `min_age` must be <= `max_age` when both provided
- `location`: Optional, valid JSON array
- `creatives`: Optional, one of: "video", "image", "carousel", "collection"
- `campaign_type_id`: Optional, positive integer
- `brand`: Optional, positive integer
- `is_enabled`: Optional, boolean
- `status`: Optional, "active" or "inactive"

### Query Parameters
- `page`: Positive integer
- `limit`: 1-100
- `search`: Max 255 characters
- `status`: "active" or "inactive"
- `enabled`: "true" or "false"
- `brand_id`: Positive integer
- `campaign_type_id`: Positive integer
- `creatives`: One of valid creative types

## Usage Examples

### Create a Campaign with Multiple Targeting Options
```bash
curl -X POST "http://localhost:3000/api/campaigns" \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Holiday Sale 2024",
    "persona": ["families", "gift_buyers"],
    "gender": ["male", "female"],
    "min_age": 25,
    "max_age": 55,
    "location": ["New York", "California", "Texas"],
    "creatives": "carousel",
    "campaign_type_id": 3,
    "brand": 5
  }'
```

### Get Active Campaigns for a Specific Brand
```bash
curl -X GET "http://localhost:3000/api/campaigns/by-brand/5?status=active&enabled=true" \
  -H "Authorization: Bearer your_jwt_token"
```

### Search Campaigns with Pagination
```bash
curl -X GET "http://localhost:3000/api/campaigns?search=holiday&page=2&limit=20" \
  -H "Authorization: Bearer your_jwt_token"
```

## Notes
- All JSON array fields (persona, gender, location) are stored as JSON strings in the database but returned as parsed arrays in API responses
- Timestamps are returned in ISO 8601 format
- The API supports filtering, searching, and pagination for optimal performance
- Campaign names must be unique across the system
- Soft relationships exist with brands and campaign_types tables
