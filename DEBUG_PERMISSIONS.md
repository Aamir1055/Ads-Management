
# Permission Error Debugging Steps

## Immediate Actions:

### 1. Start the Backend Server
cd backend
npm install  # if not already done
npm start    # or: node server.js

### 2. Check Authentication in Browser
1. Open browser developer tools (F12)
2. Go to Application/Storage tab
3. Check localStorage for:
   - authToken (should contain JWT token)
   - user (should contain user data)
4. If missing, you need to log in again

### 3. Verify User Permissions
Run this in browser console after logging in:
```javascript
// Check current user permissions
fetch('/api/permissions/user/' + JSON.parse(localStorage.getItem('user')).id, {
    headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('authToken')
    }
})
.then(r => r.json())
.then(data => console.log('User permissions:', data))
```

### 4. Check API Endpoints
Verify these endpoints are working:
- GET /api/admin/users
- GET /api/admin/roles  
- GET /api/permissions/roles-list

## Common Solutions:

### A. Authentication Issues:
- Clear localStorage and log in again
- Check if JWT token has expired
- Verify backend authentication middleware

### B. Permission Issues:
- User needs admin role/permissions
- Check user_roles table in database
- Verify role_permissions associations

### C. API Configuration Issues:
- Ensure backend server is running on port 5000
- Check CORS configuration
- Verify API route definitions

## Files to Check:

Frontend:
- ./frontend/src/services/api.js
- ./frontend/src/utils/api.js
- ./frontend/src/services/usersService.js
- ./frontend/src/services/roleService.js

Backend:
- ./backend/routes/permissionsRoutes.js
- ./backend/controllers/permissionsController.js
- ./backend/middleware/auth.js
