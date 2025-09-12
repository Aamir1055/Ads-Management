# User Module API Documentation

## Base URL
```
http://localhost:5000/api/users
```

## API Endpoints

### 1. Create User (POST)
**Endpoint:** `POST /api/users`

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "SecurePass@123",
  "confirmPassword": "SecurePass@123",
  "role_id": 3
}
```

**Password Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character (@$!%*?&)

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": 1,
    "username": "john_doe",
    "role_id": 3,
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANS...",
    "secret": "JBSWY3DPEHPK3PXP",
    "setupInstructions": "Scan this QR code with Google Authenticator app to enable 2FA"
  }
}
```

**Important:** Save the QR code image and scan it with Google Authenticator app to set up 2FA.

### 2. Get All Users (GET)
**Endpoint:** `GET /api/users`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Example Request:**
```
GET /api/users?page=1&limit=10
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "username": "john_doe",
        "role_id": 3,
        "role_name": "user",
        "is_2fa_enabled": false,
        "is_active": true,
        "last_login": null,
        "created_at": "2024-12-06T10:00:00.000Z",
        "updated_at": "2024-12-06T10:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalPages": 1,
      "totalUsers": 1
    }
  }
}
```

### 3. Get User by ID (GET)
**Endpoint:** `GET /api/users/:id`

**Example Request:**
```
GET /api/users/1
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "john_doe",
    "role_id": 3,
    "role_name": "user",
    "is_2fa_enabled": false,
    "is_active": true,
    "last_login": null,
    "created_at": "2024-12-06T10:00:00.000Z",
    "updated_at": "2024-12-06T10:00:00.000Z"
  }
}
```

### 4. Update User (PUT)
**Endpoint:** `PUT /api/users/:id`

**Request Body (all fields optional):**
```json
{
  "username": "john_updated",
  "password": "NewSecure@456",
  "confirmPassword": "NewSecure@456",
  "role_id": 2,
  "is_active": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": 1,
    "username": "john_updated",
    "role_id": 2,
    "role_name": "manager",
    "is_2fa_enabled": false,
    "is_active": true,
    "created_at": "2024-12-06T10:00:00.000Z",
    "updated_at": "2024-12-06T10:15:00.000Z"
  }
}
```

### 5. Delete User (DELETE)
**Endpoint:** `DELETE /api/users/:id`

**Example Request:**
```
DELETE /api/users/1
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

### 6. Enable 2FA (POST)
**Endpoint:** `POST /api/users/:id/enable-2fa`

**Request Body:**
```json
{
  "token": "123456"
}
```

**Note:** The token is the 6-digit code from Google Authenticator app after scanning the QR code.

**Response (200 OK):**
```json
{
  "success": true,
  "message": "2FA enabled successfully"
}
```

### 7. Verify 2FA Token (POST)
**Endpoint:** `POST /api/users/verify-2fa`

**Request Body:**
```json
{
  "username": "john_doe",
  "token": "123456"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "2FA verification successful"
}
```

## Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character"
  ]
}
```

### Conflict Error (409)
```json
{
  "success": false,
  "message": "Username already exists"
}
```

### Not Found Error (404)
```json
{
  "success": false,
  "message": "User not found"
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Failed to create user",
  "error": "Error details (only in development mode)"
}
```

## Testing with cURL

### Create User
```bash
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "Test@1234",
    "confirmPassword": "Test@1234"
  }'
```

### Get All Users
```bash
curl http://localhost:5000/api/users
```

### Get User by ID
```bash
curl http://localhost:5000/api/users/1
```

### Update User
```bash
curl -X PUT http://localhost:5000/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{
    "username": "updateduser",
    "is_active": true
  }'
```

### Delete User
```bash
curl -X DELETE http://localhost:5000/api/users/1
```

### Enable 2FA
```bash
curl -X POST http://localhost:5000/api/users/1/enable-2fa \
  -H "Content-Type: application/json" \
  -d '{
    "token": "123456"
  }'
```

### Verify 2FA
```bash
curl -X POST http://localhost:5000/api/users/verify-2fa \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "token": "123456"
  }'
```

## 2FA Setup Process

1. **Create a new user** - You'll receive a QR code in the response
2. **Scan the QR code** with Google Authenticator app on your phone
3. **Get the 6-digit token** from Google Authenticator
4. **Enable 2FA** by calling the enable-2fa endpoint with the token
5. **For future logins**, use the verify-2fa endpoint with the current token from Google Authenticator

## Notes

- The `created_at` and `updated_at` timestamps are automatically managed by the database
- Role IDs: 1 = admin, 2 = manager, 3 = user (default)
- Passwords are hashed using bcrypt before storing in the database
- 2FA secrets are stored encrypted in the database
- The QR code is only shown once during user creation - save it for setup!
