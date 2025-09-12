# Ads Reporting Software - Login System

A complete login system with Two-Factor Authentication (2FA) support for the Ads Reporting Software.

## Features

- ✅ Responsive login page with modern UI
- ✅ Username and password authentication
- ✅ Two-Factor Authentication (2FA) support using TOTP
- ✅ Session management
- ✅ Security features (password hashing, timing attack prevention)
- ✅ Error handling and validation
- ✅ Logging for security events
- ✅ Mobile-responsive design

## Files Structure

```
backend/
├── login.html          # Main login page
├── auth.php           # Authentication handler
├── dashboard.php      # Dashboard (post-login)
├── logout.php         # Logout handler
├── config/
│   └── database.php   # Database configuration
└── README.md          # This file
```

## Setup Instructions

### 1. Database Configuration

1. Update the database credentials in `config/database.php`:
   ```php
   define('DB_HOST', 'your_host');
   define('DB_NAME', 'your_database_name');
   define('DB_USER', 'your_username');
   define('DB_PASS', 'your_password');
   ```

2. Make sure your `users` table exists with the provided schema.

### 2. Web Server Setup

1. Place all files in your web server directory
2. Ensure PHP has the following extensions enabled:
   - PDO
   - PDO MySQL
   - Session support
   - Hash functions

### 3. Test User Creation

Create test users in your database:

```sql
-- User without 2FA
INSERT INTO users (username, hashed_password, role_id, is_active) 
VALUES ('testuser', '$2y$10$your_hashed_password', 1, 1);

-- User with 2FA enabled
INSERT INTO users (username, hashed_password, role_id, is_active, is_2fa_enabled, two_factor_secret) 
VALUES ('admin', '$2y$10$your_hashed_password', 1, 1, 1, 'JBSWY3DPEHPK3PXP');
```

To create hashed passwords, use:
```php
echo password_hash('your_password', PASSWORD_DEFAULT);
```

## Usage

### 1. Access the Login Page
Navigate to `login.html` in your browser.

### 2. Login Process

**Without 2FA:**
1. Enter username and password
2. Click "Sign In"
3. Redirected to dashboard on success

**With 2FA:**
1. Enter username and password
2. Click "Sign In"
3. Enter 6-digit 2FA code from authenticator app
4. Click "Verify & Sign In"
5. Redirected to dashboard on success

### 3. 2FA Setup

For users with 2FA enabled, they need to:
1. Have a 2FA secret stored in `two_factor_secret` or `twofa_secret` column
2. Have either `is_2fa_enabled` or `twofa_enabled` set to 1
3. Use an authenticator app (Google Authenticator, Authy, etc.) configured with their secret

## Security Features

### Password Security
- Passwords are hashed using PHP's `password_hash()` function
- Timing attack prevention with `usleep()` delays
- Failed login attempts are logged

### Session Security
- Session variables are properly set and validated
- Session timeout for 2FA verification (5 minutes)
- Secure session destruction on logout

### 2FA Security
- TOTP (Time-based One-Time Password) implementation
- 30-second time window with ±1 window tolerance for clock drift
- Failed 2FA attempts are logged
- Base32 secret decoding for compatibility with standard authenticators

### Input Validation
- SQL injection prevention with prepared statements
- XSS prevention with `htmlspecialchars()`
- Input sanitization and validation
- CSRF protection through session management

## API Endpoints

### POST /auth.php

**Check Credentials:**
```json
{
  "action": "check_credentials",
  "username": "your_username",
  "password": "your_password"
}
```

**Verify 2FA:**
```json
{
  "action": "verify_2fa",
  "username": "your_username", 
  "password": "your_password",
  "twofa_code": "123456"
}
```

## Error Handling

The system handles various error scenarios:
- Invalid credentials
- Inactive accounts
- Missing 2FA codes
- Expired 2FA sessions
- Database connection issues
- Invalid request formats

## Browser Compatibility

- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Production Considerations

1. **HTTPS**: Always use HTTPS in production
2. **2FA Library**: Consider using a dedicated library like `RobThree/TwoFactorAuth` for production
3. **Rate Limiting**: Implement rate limiting for login attempts
4. **Logging**: Set up proper logging infrastructure
5. **Database Security**: Use least-privilege database accounts
6. **Session Security**: Configure secure session settings in php.ini

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check database credentials in `config/database.php`
   - Ensure database server is running
   - Verify database name exists

2. **2FA Not Working**
   - Verify user has `is_2fa_enabled` or `twofa_enabled` set to 1
   - Check that `two_factor_secret` or `twofa_secret` contains valid base32 string
   - Ensure authenticator app is set up with the correct secret

3. **Session Issues**
   - Check PHP session configuration
   - Ensure session files directory is writable
   - Verify session cookies are being set

### Debug Mode

For debugging, you can add error reporting to the top of your PHP files:
```php
error_reporting(E_ALL);
ini_set('display_errors', 1);
```

## Support

For issues or questions:
1. Check the error logs for detailed error messages
2. Verify database connection and credentials
3. Test with a simple user first (without 2FA)
4. Check browser console for JavaScript errors
