# Complete Solution for "Insufficient Permissions" Error

## Problem Summary
Your frontend application is showing **"Insufficient permissions"** errors when trying to access admin features like user management and role management. The errors are occurring across multiple API endpoints.

## Root Causes Identified

### 1. **Backend Server Issues** ❌
- Database connection failing due to configuration issues
- Database name contains spaces: `ads reporting` (should be `ads_reporting`)
- Server not properly starting due to database connection failure

### 2. **API Service Conflicts** ⚠️
- Multiple API service files with different configurations:
  - `./frontend/src/services/api.js`
  - `./frontend/src/utils/api.js`
- `roleService.js` importing from wrong API service

### 3. **Authentication State Issues** 🔐
- User may not be properly authenticated
- JWT tokens may have expired
- Auth tokens may not be sent with requests

## Complete Fix Steps

### Step 1: Fix Database Configuration

1. **Edit the database name in `.env` file:**
   ```bash
   # Change from:
   DB_NAME=ads reporting
   
   # To:
   DB_NAME=ads_reporting
   ```

2. **Ensure MySQL/MariaDB is running:**
   ```bash
   # Windows: Check if MySQL service is running
   Get-Service -Name "MySQL*" | Select-Object Name, Status
   
   # Or start MySQL if needed
   Start-Service -Name "MySQL80" # or your MySQL service name
   ```

3. **Create/verify database exists:**
   ```sql
   -- Connect to MySQL and run:
   CREATE DATABASE IF NOT EXISTS `ads_reporting`;
   ```

### Step 2: Fix API Service Configuration

**I've already fixed the roleService.js import.** The fix changes:
```javascript
// FROM:
import api from './api'

// TO:
import api from '../utils/api'
```

### Step 3: Start the Backend Server

```bash
cd backend
npm start
```

**Expected output:**
```
✅ Database connection established
🚀 Server started successfully!
🌐 Server URL: http://localhost:5000
```

### Step 4: Fix Frontend Authentication

#### A. Clear Browser Storage
1. Open browser Developer Tools (F12)
2. Go to **Application** → **Storage** → **Local Storage**
3. Delete `authToken` and `user` entries
4. Close and reopen the browser

#### B. Log In Again
1. Navigate to your login page
2. Log in with **admin credentials**
3. Verify the auth token is saved in localStorage

#### C. Verify Authentication (Browser Console)

Copy and paste this into browser console (F12):
```javascript
// Check authentication status
function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    
    console.log('🔐 Authentication Status:');
    console.log('Token exists:', !!token);
    console.log('User data exists:', !!user);
    
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            console.log('Token payload:', payload);
            console.log('Token expired?', payload.exp < Date.now() / 1000);
        } catch (e) {
            console.log('Token format invalid:', e.message);
        }
    }
    
    if (user) {
        try {
            const userData = JSON.parse(user);
            console.log('User data:', userData);
        } catch (e) {
            console.log('User data format invalid:', e.message);
        }
    }
}

checkAuthStatus();
```

### Step 5: Test API Endpoints

After logging in, test the problematic endpoints:
```javascript
// Run in browser console after logging in
async function testApiWithAuth() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.log('❌ No auth token found. Please log in first.');
        return;
    }
    
    const endpoints = [
        '/admin/users',
        '/admin/roles', 
        '/permissions/roles-list',
        '/users/roles'
    ];
    
    console.log('🧪 Testing with authentication token...');
    
    for (const endpoint of endpoints) {
        try {
            const response = await fetch('/api' + endpoint, {
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'Content-Type': 'application/json'
                }
            });
            
            const status = response.status;
            console.log(`${endpoint}: ${status} - ${status < 400 ? '✅ Success' : '❌ Error'}`);
            
            if (status >= 400) {
                const errorData = await response.text();
                console.log('  Error details:', errorData);
            }
        } catch (error) {
            console.log(`${endpoint}: ❌ Network error -`, error.message);
        }
    }
}

testApiWithAuth();
```

## Common Issues & Solutions

### Issue: "Token expired" ❌
**Solution:** Clear localStorage and log in again

### Issue: "User lacks admin permissions" ❌
**Solution:** 
1. Check user role in database:
   ```sql
   SELECT u.username, r.name as role_name 
   FROM users u 
   JOIN user_roles ur ON u.id = ur.user_id 
   JOIN roles r ON ur.role_id = r.id 
   WHERE u.username = 'your_username';
   ```
2. Assign admin role if needed

### Issue: "Network errors" ❌
**Solution:** 
1. Verify backend server is running on port 5000
2. Check firewall settings
3. Verify CORS configuration

### Issue: "403 Forbidden still appearing" ❌
**Solution:**
1. The user needs proper admin permissions
2. Check the permissions table in the database
3. Verify role-permission associations

## Database Admin User Creation

If you need to create an admin user, run this in MySQL:

```sql
-- First, ensure you have the tables
USE ads_reporting;

-- Create admin user (if not exists)
INSERT INTO users (username, password, is_active, created_at) 
VALUES ('admin', '$2b$10$hashedpassword', 1, NOW())
ON DUPLICATE KEY UPDATE username=username;

-- Get user ID
SET @user_id = (SELECT id FROM users WHERE username = 'admin');

-- Create admin role (if not exists)
INSERT INTO roles (name, description, is_system_role, created_at) 
VALUES ('admin', 'System Administrator', 1, NOW())
ON DUPLICATE KEY UPDATE name=name;

-- Get role ID
SET @role_id = (SELECT id FROM roles WHERE name = 'admin');

-- Assign admin role to user
INSERT IGNORE INTO user_roles (user_id, role_id, created_at) 
VALUES (@user_id, @role_id, NOW());
```

## Verification Checklist

✅ **Backend Issues:**
- [ ] Database name fixed (no spaces)
- [ ] MySQL/MariaDB running
- [ ] Backend server starts without errors
- [ ] Health endpoint responds: `curl http://localhost:5000/api/health`

✅ **Frontend Issues:**
- [ ] Browser localStorage cleared
- [ ] Logged in with admin account
- [ ] Auth token exists in localStorage
- [ ] API endpoints return 200 instead of 403

✅ **Permission Issues:**
- [ ] User has admin role in database
- [ ] Admin role has required permissions
- [ ] JWT token contains proper user/role information

## Quick Start Commands

```bash
# 1. Fix database and start backend
cd backend
# Edit .env to change DB_NAME to ads_reporting
npm start

# 2. Test endpoints
curl http://localhost:5000/api/health

# 3. Open frontend and clear browser storage
# 4. Log in with admin credentials
# 5. Test in browser console using the scripts above
```

If all steps are completed correctly, the "Insufficient permissions" errors should be resolved and you should be able to access the admin features.
