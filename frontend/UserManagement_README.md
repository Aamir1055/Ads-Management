# User Management Module

A complete user management system with 2FA support using Google Authenticator.

## Features

### ✅ **Completed Features:**
- **Tabular Data Display**: Clean table layout showing all user information
- **Create User**: Add new users with username, password, role selection, and optional 2FA
- **Edit User**: Update existing user information including role changes
- **Delete User**: Remove users with confirmation dialog
- **2FA Integration**: Generate QR codes for Google Authenticator setup
- **Search Functionality**: Search users by username or role
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Feedback**: Success/error messages for all operations

### 🎯 **Table Columns:**
- **User**: Avatar, username, and ID
- **Role**: User's assigned role
- **Status**: Active/Inactive status
- **2FA**: Shows if two-factor authentication is enabled
- **Last Login**: Date of last login
- **Created**: Account creation date
- **Actions**: Edit, 2FA QR code generation, and delete buttons

### 🔐 **2FA (Two-Factor Authentication):**
- **Google Authenticator Support**: Generate QR codes for easy setup
- **Secret Key Display**: Backup secret key for manual entry
- **Login Integration**: Users with 2FA enabled can login using their authenticator codes

## How to Use

### 1. **Creating a User**
1. Click the "Create User" button
2. Fill in the required fields:
   - **Username**: Unique username for the user
   - **Password**: Minimum 6 characters
   - **Confirm Password**: Must match the password
   - **Role**: Select from available roles
3. **Optional**: Check "Enable Two-Factor Authentication" for enhanced security
4. Click "Create User"
5. **If 2FA is enabled**: A QR code modal will appear - scan with Google Authenticator

### 2. **Editing a User**
1. Click the edit (✏️) icon next to any user
2. Update the desired fields
3. **Password fields**: Leave empty to keep current password
4. Click "Update User"

### 3. **Generating 2FA QR Code**
1. Click the QR code (🔳) icon next to any user
2. A modal will show the QR code and secret key
3. Scan the QR code with Google Authenticator app
4. Save the secret key securely as backup

### 4. **Deleting a User**
1. Click the delete (🗑️) icon next to any user
2. Confirm the deletion in the dialog box
3. User will be permanently removed

### 5. **Searching Users**
1. Use the search box at the top
2. Search by username or role name
3. Results filter in real-time

## Backend Integration

### **API Endpoints:**
- `GET /api/user-management` - Fetch all users
- `POST /api/user-management` - Create new user
- `PUT /api/user-management/:id` - Update user
- `DELETE /api/user-management/:id` - Delete user
- `POST /api/user-management/:id/generate-2fa` - Generate 2FA QR code
- `GET /api/user-management/roles` - Get available roles

### **Authentication:**
All API calls require authentication token in the header:
```javascript
Authorization: Bearer <your-token>
```

## 2FA Login Process

### **For Users with 2FA Enabled:**
1. Enter username and password on login screen
2. System will prompt for 2FA code
3. Open Google Authenticator app
4. Enter the 6-digit code displayed for your account
5. Complete login process

### **Setting up Google Authenticator:**
1. Download Google Authenticator from app store
2. When creating/editing user with 2FA enabled, scan the QR code
3. App will generate 6-digit codes every 30 seconds
4. Use these codes for login

## Responsive Design

The interface automatically adapts to different screen sizes:
- **Desktop**: Full table view with all columns
- **Tablet**: Optimized spacing and button sizes
- **Mobile**: Horizontal scrolling for table, touch-friendly buttons

## Error Handling

The system provides clear feedback for:
- **Network errors**: Connection issues with backend
- **Validation errors**: Missing or invalid form data
- **Authentication errors**: Invalid or expired tokens
- **Permission errors**: Insufficient access rights

## Security Features

- **Password validation**: Minimum length requirements
- **Confirmation dialogs**: For destructive actions like delete
- **2FA support**: Enhanced security with Google Authenticator
- **Role-based access**: Users assigned specific roles
- **Secure token handling**: JWT authentication

## Technical Details

### **Built with:**
- **React**: Frontend framework
- **Tailwind CSS**: Styling and responsive design
- **Lucide React**: Icon library
- **Fetch API**: HTTP requests to backend
- **Speakeasy**: 2FA token generation (backend)
- **QRCode**: QR code generation (backend)

### **Browser Support:**
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Troubleshooting

### **Common Issues:**

1. **"Failed to load users"**
   - Check backend server is running
   - Verify API URL in environment variables
   - Check authentication token

2. **2FA QR code not displaying**
   - Ensure backend has qrcode and speakeasy packages
   - Check browser console for errors
   - Verify user was created with 2FA enabled

3. **Search not working**
   - Search is case-insensitive
   - Searches username and role fields
   - Clear search to see all users

4. **Mobile display issues**
   - Table is horizontally scrollable on small screens
   - Use landscape mode for better viewing
   - All functionality available on mobile

## Future Enhancements

Potential improvements for future versions:
- Bulk operations (select multiple users)
- Advanced filtering (date ranges, role filters)
- User activity logs
- Export user data to CSV/Excel
- User profile pictures
- Password strength indicator
- Email notifications

## Support

For technical support or feature requests, please contact the development team.
