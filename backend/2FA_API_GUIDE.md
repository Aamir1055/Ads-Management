# Two-Factor Authentication (2FA) API Guide

## Overview
This guide explains how to implement and use the Two-Factor Authentication (2FA) system in your Ads Reporting Software backend.

## Database Setup

1. **Run the Migration**:
```sql
-- Apply the migration to add 2FA fields
SOURCE ./migrations/add_2fa_fields.sql;
```

2. **Verify Database Schema**:
After running the migration, your `users` table should have these additional columns:
- `twofa_enabled` (BOOLEAN, DEFAULT FALSE)
- `twofa_secret` (VARCHAR(255), NULL)
- `twofa_verified_at` (TIMESTAMP, NULL)

## API Endpoints

### Authentication Endpoints (Modified)

#### 1. Login (Updated with 2FA Support)
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "TestPassword123!"
}
```

**Responses:**

**Without 2FA:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "requires_2fa": false,
    "token": "jwt_token_here",
    "user": {
      "id": 1,
      "username": "testuser",
      "role_id": 2,
      "role_name": "user",
      "twofa_enabled": false
    }
  },
  "timestamp": "2025-09-09T07:04:06.000Z"
}
```

**With 2FA Enabled:**
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
  "timestamp": "2025-09-09T07:04:06.000Z"
}
```

#### 2. Complete Login with 2FA
```http
POST /api/auth/login-2fa
Content-Type: application/json

{
  "user_id": 1,
  "token": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login with 2FA successful",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": 1,
      "username": "testuser",
      "role_id": 2,
      "role_name": "user",
      "twofa_enabled": true,
      "two_factor_verified": true
    }
  },
  "timestamp": "2025-09-09T07:04:06.000Z"
}
```

### 2FA Management Endpoints

#### 1. Generate 2FA Setup (QR Code)
```http
POST /api/2fa/setup
Content-Type: application/json

{
  "username": "testuser"
}
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
  "timestamp": "2025-09-09T07:04:06.000Z"
}
```

#### 2. Verify and Complete 2FA Setup
```http
POST /api/2fa/verify-setup
Content-Type: application/json

{
  "user_id": 1,
  "token": "123456"
}
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
      "verified_at": "2025-09-09T07:04:06.000Z"
    },
    "backup_codes": [
      "ABCD1234",
      "EFGH5678",
      "..."
    ],
    "important_note": "Save these backup codes in a secure place. Each code can only be used once for emergency access."
  },
  "timestamp": "2025-09-09T07:04:06.000Z"
}
```

#### 3. Get 2FA Status
```http
GET /api/2fa/status/1
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
      "twofa_verified_at": "2025-09-09T07:04:06.000Z",
      "last_login": "2025-09-09T07:04:06.000Z"
    },
    "recommendations": [
      "Your account is secured with 2FA",
      "Keep your authenticator app updated"
    ]
  },
  "timestamp": "2025-09-09T07:04:06.000Z"
}
```

#### 4. Disable 2FA
```http
POST /api/2fa/disable
Content-Type: application/json

{
  "user_id": 1,
  "current_token": "123456"
}
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
      "disabled_at": "2025-09-09T07:04:06.000Z"
    },
    "security_note": "Your account is now less secure. Consider re-enabling 2FA for better protection."
  },
  "timestamp": "2025-09-09T07:04:06.000Z"
}
```

#### 5. Generate New Backup Codes
```http
POST /api/2fa/backup-codes
Content-Type: application/json

{
  "user_id": 1,
  "current_token": "123456"
}
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
      "ABCD1234",
      "EFGH5678",
      "..."
    ],
    "important_notes": [
      "These codes replace any previously generated backup codes",
      "Each code can only be used once",
      "Store them securely - they provide emergency access to your account",
      "Generate new codes if you suspect these have been compromised"
    ],
    "generated_at": "2025-09-09T07:04:06.000Z"
  },
  "timestamp": "2025-09-09T07:04:06.000Z"
}
```

#### 6. Get 2FA Information
```http
GET /api/2fa/info
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
    "security_tips": [
      "Use a reputable authenticator app",
      "Keep your backup codes secure and offline",
      "Don't share your 2FA codes with anyone",
      "Enable 2FA on all important accounts"
    ],
    "token_info": {
      "format": "6 digits",
      "refresh_interval": "30 seconds",
      "tolerance_window": "±90 seconds for login verification"
    }
  },
  "timestamp": "2025-09-09T07:04:06.000Z"
}
```

## Frontend Implementation Flow

### 1. User Wants to Enable 2FA

1. **Check current 2FA status** (GET `/api/2fa/status/{user_id}`)
2. **Generate setup** (POST `/api/2fa/setup`)
3. **Display QR code** to user
4. **User scans QR code** with authenticator app
5. **User enters 6-digit code** 
6. **Verify setup** (POST `/api/2fa/verify-setup`)
7. **Show backup codes** to user (important!)

### 2. User Login with 2FA

1. **User enters username/password** (POST `/api/auth/login`)
2. **If `requires_2fa: true`**, show 2FA token input
3. **User enters 6-digit token**
4. **Complete login** (POST `/api/auth/login-2fa`)
5. **Receive JWT token** for authenticated requests

### 3. User Management Features

- **Toggle 2FA**: Show button based on `twofa_enabled` status
- **Regenerate backup codes**: Available when 2FA is enabled
- **Disable 2FA**: Requires current 2FA token for security

## Frontend Toggle Button Implementation

Here's how your frontend toggle would work:

```javascript
// Example React component
const TwoFactorToggle = ({ user, onToggle }) => {
  const [isEnabled, setIsEnabled] = useState(user.twofa_enabled);
  const [showQR, setShowQR] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [setupData, setSetupData] = useState(null);

  const handleToggle = async () => {
    if (!isEnabled) {
      // Enable 2FA - Generate QR Code
      try {
        const response = await fetch('/api/2fa/setup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: user.username })
        });
        
        const data = await response.json();
        if (data.success) {
          setQrCode(data.data.qr_code);
          setSetupData(data.data);
          setShowQR(true);
        }
      } catch (error) {
        console.error('Failed to generate 2FA setup:', error);
      }
    } else {
      // Disable 2FA - Show token input
      const token = prompt('Enter your current 2FA token to disable:');
      if (token) {
        try {
          const response = await fetch('/api/2fa/disable', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              user_id: user.id, 
              current_token: token 
            })
          });
          
          const data = await response.json();
          if (data.success) {
            setIsEnabled(false);
            onToggle(false);
          }
        } catch (error) {
          console.error('Failed to disable 2FA:', error);
        }
      }
    }
  };

  const verifySetup = async (token) => {
    try {
      const response = await fetch('/api/2fa/verify-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: user.id, 
          token: token 
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setIsEnabled(true);
        setShowQR(false);
        onToggle(true);
        
        // Show backup codes to user
        alert(`2FA Enabled! Save these backup codes: ${data.data.backup_codes.join(', ')}`);
      }
    } catch (error) {
      console.error('Failed to verify 2FA setup:', error);
    }
  };

  return (
    <div>
      <label>
        <input 
          type="checkbox" 
          checked={isEnabled} 
          onChange={handleToggle}
        />
        Enable Two-Factor Authentication
      </label>
      
      {showQR && (
        <div className="qr-setup">
          <img src={qrCode} alt="2FA QR Code" />
          <p>Manual key: {setupData.manual_entry_key}</p>
          <input 
            type="text" 
            placeholder="Enter 6-digit code" 
            onBlur={(e) => e.target.value && verifySetup(e.target.value)}
          />
        </div>
      )}
    </div>
  );
};
```

## Testing

### Test Users Creation
```sql
-- Create a test user to test 2FA
INSERT INTO users (username, hashed_password, role_id, is_active) VALUES 
('testuser', '$2a$12$hashedpasswordhere', 2, 1);
```

### Testing with curl

1. **Login without 2FA:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser", "password": "TestPassword123!"}'
```

2. **Generate 2FA Setup:**
```bash
curl -X POST http://localhost:5000/api/2fa/setup \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser"}'
```

3. **Verify Setup:**
```bash
curl -X POST http://localhost:5000/api/2fa/verify-setup \
  -H "Content-Type: application/json" \
  -d '{"user_id": 1, "token": "123456"}'
```

## Security Considerations

1. **Rate Limiting**: All 2FA endpoints have rate limiting to prevent brute force attacks
2. **Token Validation**: 6-digit tokens with time window validation (±90 seconds)
3. **Secret Storage**: Secrets are stored encrypted in the database
4. **Backup Codes**: 10 single-use backup codes for emergency access
5. **Audit Trail**: All 2FA operations are logged

## Troubleshooting

### Common Issues:

1. **"Invalid 2FA token"**: 
   - Check device time synchronization
   - Ensure token is entered within 90-second window
   - Try regenerating the QR code

2. **QR Code not displaying**:
   - Check image data format
   - Verify base64 encoding is correct

3. **Database connection issues**:
   - Run the migration script
   - Verify database schema changes

### Error Codes:
- `400`: Validation error (invalid input)
- `401`: Invalid credentials or 2FA token
- `404`: User not found
- `409`: 2FA already enabled/disabled
- `429`: Rate limit exceeded

## Support

For additional support:
- Check server logs for detailed error messages
- Verify environment variables are set
- Test with curl commands first
- Check database schema matches expected structure
