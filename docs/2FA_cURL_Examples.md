# 2FA API - cURL Examples

## Prerequisites
1. Make sure your server is running: `npm start` or `npm run dev`
2. You need a user in the database to test with
3. Base URL: `http://localhost:5000`

## 🔐 Authentication Endpoints

### 1. Login (Standard)
```bash
# Login without 2FA enabled
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "TestPassword123!"
  }'
```

**Response (No 2FA):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "requires_2fa": false,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "testuser",
      "role_id": 2,
      "role_name": "user",
      "twofa_enabled": false
    }
  },
  "timestamp": "2025-09-09T07:19:55.000Z"
}
```

**Response (Needs 2FA):**
```json
{
  "success": true,
  "message": "Password verified. 2FA token required.",
  "data": {
    "requires_2fa": true,
    "user_id": 1,
    "username": "testuser",
    "next_step": "Please provide your 2FA token to complete login"
  },
  "timestamp": "2025-09-09T07:19:55.000Z"
}
```

### 2. Complete Login with 2FA
```bash
# Complete login using 2FA token
curl -X POST http://localhost:5000/api/auth/login-2fa \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "token": "123456"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Login with 2FA successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "testuser",
      "role_id": 2,
      "role_name": "user",
      "twofa_enabled": true,
      "two_factor_verified": true
    }
  },
  "timestamp": "2025-09-09T07:19:55.000Z"
}
```

### 3. Get Current User Info
```bash
# Get current user (requires JWT token)
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

---

## 🛡️ 2FA Management Endpoints

### 1. Generate 2FA Setup (QR Code)
```bash
# Generate QR code and secret for 2FA setup
curl -X POST http://localhost:5000/api/2fa/setup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "2FA setup initiated successfully",
  "data": {
    "user_id": 1,
    "username": "testuser",
    "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "manual_entry_key": "JBSWY3DPEHPK3PXP",
    "setup_instructions": {
      "step1": "Install Google Authenticator or similar TOTP app",
      "step2": "Scan the QR code or enter the manual key",
      "step3": "Enter the 6-digit code from your app to complete setup"
    },
    "backup_note": "Save the manual entry key as backup - you'll need it if you lose access to your authenticator app"
  },
  "timestamp": "2025-09-09T07:19:55.000Z"
}
```

### 2. Verify and Enable 2FA
```bash
# Verify 6-digit code and enable 2FA
curl -X POST http://localhost:5000/api/2fa/verify-setup \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "token": "123456"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "2FA enabled successfully",
  "data": {
    "user": {
      "id": 1,
      "username": "testuser",
      "twofa_enabled": true,
      "verified_at": "2025-09-09T07:19:55.000Z"
    },
    "backup_codes": [
      "ABCD1234",
      "EFGH5678",
      "IJKL9012",
      "MNOP3456",
      "QRST7890"
    ],
    "important_note": "Save these backup codes in a secure place. Each code can only be used once for emergency access."
  },
  "timestamp": "2025-09-09T07:19:55.000Z"
}
```

### 3. Get 2FA Status
```bash
# Check 2FA status for user
curl -X GET http://localhost:5000/api/2fa/status/1
```

**Response:**
```json
{
  "success": true,
  "message": "2FA status retrieved successfully",
  "data": {
    "user": {
      "id": 1,
      "username": "testuser",
      "role": "user",
      "twofa_enabled": true,
      "twofa_verified_at": "2025-09-09T07:19:55.000Z",
      "last_login": "2025-09-09T07:25:30.000Z"
    },
    "recommendations": [
      "Your account is secured with 2FA",
      "Keep your authenticator app updated"
    ]
  },
  "timestamp": "2025-09-09T07:19:55.000Z"
}
```

### 4. Disable 2FA
```bash
# Disable 2FA (requires current token)
curl -X POST http://localhost:5000/api/2fa/disable \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "current_token": "123456"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "2FA disabled successfully",
  "data": {
    "user": {
      "id": 1,
      "username": "testuser",
      "twofa_enabled": false,
      "disabled_at": "2025-09-09T07:19:55.000Z"
    },
    "security_note": "Your account is now less secure. Consider re-enabling 2FA for better protection."
  },
  "timestamp": "2025-09-09T07:19:55.000Z"
}
```

### 5. Generate New Backup Codes
```bash
# Generate new backup codes (requires current token)
curl -X POST http://localhost:5000/api/2fa/backup-codes \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "current_token": "123456"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "New backup codes generated successfully",
  "data": {
    "user": {
      "id": 1,
      "username": "testuser"
    },
    "backup_codes": [
      "WXYZ1234",
      "ABCD5678",
      "EFGH9012",
      "IJKL3456",
      "MNOP7890"
    ],
    "important_notes": [
      "These codes replace any previously generated backup codes",
      "Each code can only be used once",
      "Store them securely - they provide emergency access to your account",
      "Generate new codes if you suspect these have been compromised"
    ],
    "generated_at": "2025-09-09T07:19:55.000Z"
  },
  "timestamp": "2025-09-09T07:19:55.000Z"
}
```

### 6. Verify 2FA Token (Alternative)
```bash
# Alternative way to verify 2FA token
curl -X POST http://localhost:5000/api/2fa/verify-login \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "token": "123456"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "2FA verification successful",
  "data": {
    "user": {
      "id": 1,
      "username": "testuser",
      "two_factor_verified": true,
      "verified_at": "2025-09-09T07:19:55.000Z"
    }
  },
  "timestamp": "2025-09-09T07:19:55.000Z"
}
```

### 7. Get 2FA Information
```bash
# Get general 2FA information
curl -X GET http://localhost:5000/api/2fa/info
```

**Response:**
```json
{
  "success": true,
  "message": "2FA information retrieved successfully",
  "data": {
    "what_is_2fa": "Two-Factor Authentication adds an extra layer of security to your account",
    "supported_apps": [
      "Google Authenticator",
      "Microsoft Authenticator",
      "Authy",
      "LastPass Authenticator",
      "1Password"
    ],
    "setup_process": {
      "step1": "Enable 2FA in your account settings",
      "step2": "Scan the QR code with your authenticator app",
      "step3": "Enter the 6-digit code to complete setup",
      "step4": "Save the backup codes in a secure location"
    },
    "token_info": {
      "format": "6 digits",
      "refresh_interval": "30 seconds",
      "tolerance_window": "±90 seconds for login verification"
    }
  },
  "timestamp": "2025-09-09T07:19:55.000Z"
}
```

---

## 👥 User Management (Updated with 2FA)

### 1. Get All Users
```bash
# Get all users (now includes twofa_enabled field)
curl -X GET http://localhost:5000/api/users
```

### 2. Get User by ID
```bash
# Get specific user (includes twofa_enabled field)
curl -X GET http://localhost:5000/api/users/1
```

### 3. Create New User
```bash
# Create new user (2FA disabled by default)
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newuser",
    "password": "NewPassword123!",
    "role_id": 2
  }'
```

---

## 🧪 Testing Workflow

### Complete 2FA Setup Flow:
```bash
# Step 1: Create a user first (if needed)
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "TestPassword123!",
    "role_id": 2
  }'

# Step 2: Check initial status (should be false)
curl -X GET http://localhost:5000/api/2fa/status/1

# Step 3: Generate 2FA setup
curl -X POST http://localhost:5000/api/2fa/setup \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser"}'

# Step 4: Use Google Authenticator to scan QR code
# Then get the 6-digit code and verify setup:
curl -X POST http://localhost:5000/api/2fa/verify-setup \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "token": "ENTER_REAL_TOKEN_HERE"
  }'

# Step 5: Test login flow
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "TestPassword123!"
  }'

# Step 6: Complete login with 2FA
curl -X POST http://localhost:5000/api/auth/login-2fa \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "token": "ENTER_REAL_TOKEN_HERE"
  }'
```

---

## 🚨 Error Responses

### Common Error Formats:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": ["Token must be exactly 6 digits"],
  "timestamp": "2025-09-09T07:19:55.000Z"
}
```

### Error Codes:
- **400**: Validation error, invalid input
- **401**: Invalid credentials or 2FA token
- **404**: User not found
- **409**: 2FA already enabled/disabled
- **429**: Rate limit exceeded
- **500**: Internal server error

---

## 📝 Notes

1. **Replace tokens**: Use real 6-digit tokens from your authenticator app
2. **Replace user_id**: Use actual user IDs from your database
3. **JWT tokens**: Save JWT tokens from login responses for authenticated endpoints
4. **QR codes**: The QR code is base64 encoded - paste into browser or decode to view
5. **Rate limits**: Don't spam requests - there are rate limits in place

## 🔗 Additional Resources

- **Swagger UI**: Open `docs/2fa-swagger.html` in your browser
- **Postman**: Import `docs/2FA_Postman_Collection.json`
- **Full Documentation**: `2FA_API_GUIDE.md`
