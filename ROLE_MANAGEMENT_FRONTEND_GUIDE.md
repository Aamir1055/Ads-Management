# 🛡️ Role-Based Management Frontend

A comprehensive role and permission management system for your Ads Reporting Software frontend. This system provides a clean, intuitive interface for managing roles, permissions, and user access control.

## 🎯 Features

### ✅ **Comprehensive Role Management Dashboard**
- **Tabbed Interface**: Clean navigation between different management sections
- **Role Management**: Create, view, and manage roles with hierarchy levels
- **User Role Assignment**: Assign and revoke roles for individual users
- **Permission Management**: Fine-grained control over role permissions
- **Audit Logging**: (Coming soon) Track all role and permission changes

### ✅ **Role Management Tab**
- View all existing roles with levels and descriptions
- Create new roles with custom names, descriptions, and hierarchy levels
- Assign/revoke permissions to roles organized by modules
- Real-time permission management with instant feedback
- Module-based permission grouping for better organization

### ✅ **User Role Assignment Tab**
- Visual user cards showing current role assignments
- Search and filter users by name
- Modal-based role assignment with checkbox interface
- Bulk role changes for individual users
- Role hierarchy visualization with level indicators

### ✅ **Integration with Backend**
- Full API integration with your permissions system
- Real-time data loading and updates
- Error handling and user feedback
- Automatic data refresh after changes

## 🚀 How to Access

1. **Navigate to Role Management**
   - Click on **"Role Management"** in the sidebar (🔑 Key icon)
   - The comprehensive dashboard will open with tabbed interface

2. **Available Tabs**
   - **Role Management**: Manage roles and their permissions
   - **User Roles**: Assign roles to users
   - **Permissions**: (Coming soon) Direct permission management
   - **Audit Logs**: (Coming soon) View change history

## 🔧 Using the Role Management System

### **Role Management Tab**

#### Creating a New Role
1. Navigate to the "Create New Role" section (left panel)
2. Fill in the required information:
   - **Role Name**: e.g., "Content Manager", "Analyst"
   - **Description**: What this role can do
   - **Level**: Hierarchy level (1-10, higher = more authority)
3. Click **"Create Role"**

#### Managing Role Permissions
1. **Select a Role**: Choose from the dropdown in the left panel
2. **View Current Permissions**: See permissions organized by module
3. **Assign Permission**: 
   - Use the "Add permission" dropdown at the top
   - Click "Assign" to add the permission
   - Or click "Assign" on individual permissions in the module view
4. **Revoke Permission**: Click "Revoke" next to any assigned permission

### **User Roles Tab**

#### Assigning Roles to Users
1. **Find the User**: Use the search box to find specific users
2. **Click "Manage Roles"**: Opens the role assignment modal
3. **Select Roles**: Check/uncheck roles for the user
4. **Save Changes**: Click "Save Changes" to apply

#### Understanding User Role Cards
- **Avatar**: Shows user's first initial
- **Username & ID**: User identification
- **Current Roles**: Shows all assigned roles with hierarchy levels
- **Manage Roles Button**: Opens the assignment interface

## 🎨 UI Features

### **Visual Design**
- **Clean Interface**: Modern, professional design
- **Responsive Layout**: Works on desktop, tablet, and mobile
- **Color-Coded Elements**: 
  - Blue tags for role assignments
  - Gray tags for unassigned states
  - Green/Red buttons for actions
- **Loading States**: Visual feedback during API calls
- **Error Handling**: Clear error messages and recovery options

### **Interactive Elements**
- **Tabbed Navigation**: Easy switching between management sections
- **Modal Dialogs**: Non-intrusive role assignment interface
- **Search & Filter**: Real-time user and permission filtering
- **Dropdown Selects**: Clean role and permission selection
- **Action Buttons**: Clear, labeled buttons for all operations

## 🔒 Permission Requirements

The frontend respects your backend permission system. Users need appropriate permissions to:

- **View Roles**: `roles.view`
- **Create Roles**: `roles.create`
- **Update Roles**: `roles.update`
- **Delete Roles**: `roles.delete`
- **Assign Permissions**: `permissions.assign`
- **Revoke Permissions**: `permissions.revoke`
- **Manage User Roles**: `users.change_role`

## 📡 API Integration

The frontend integrates with these backend endpoints:

### Role Management
- `GET /api/permissions/roles-list` - Get all roles
- `POST /api/permissions/roles` - Create new role
- `PUT /api/permissions/roles/:id` - Update role
- `DELETE /api/permissions/roles/:id` - Delete role

### Permission Management
- `GET /api/permissions/permissions-list` - Get all permissions
- `GET /api/permissions/role/:id/permissions` - Get role permissions
- `POST /api/permissions/assign` - Assign permission to role
- `POST /api/permissions/revoke` - Revoke permission from role

### User Role Management
- `GET /api/permissions/user/:id/roles` - Get user roles
- `POST /api/permissions/assign-user-role` - Assign user to role
- `POST /api/permissions/revoke-user-role` - Remove user from role

## 🛠️ Technical Details

### **Components Structure**
```
src/modules/
├── RolePermissionDashboard.jsx    # Main dashboard with tabs
├── RoleBasedManagement.jsx        # Role and permission management
└── UserRoleManagement.jsx         # User role assignment

src/services/
└── roleService.js                 # API service layer
```

### **State Management**
- React hooks for local state
- Automatic data refresh after changes
- Loading states for better UX
- Error boundaries for fault tolerance

### **Styling**
- Tailwind CSS for responsive design
- Custom component classes for consistency
- Accessible color schemes
- Mobile-first responsive design

## 🔄 Data Flow

1. **Load Data**: Components fetch roles, permissions, and users on mount
2. **User Actions**: Form submissions and button clicks trigger API calls
3. **Update State**: Successful operations update local state
4. **Refresh Data**: Components reload data to show changes
5. **Error Handling**: Failed operations show error messages

## 📱 Mobile Support

The system is fully responsive and works on:
- **Desktop**: Full-featured experience with side-by-side layout
- **Tablet**: Adapted layout with stacked sections
- **Mobile**: Touch-optimized interface with modal dialogs

## 🚀 Next Steps

### **Planned Features**
- **Audit Log Viewer**: Visual timeline of role and permission changes
- **Bulk User Management**: Assign roles to multiple users at once
- **Role Templates**: Pre-configured role sets for common scenarios
- **Permission Analytics**: Usage statistics and access patterns
- **Export/Import**: Role configuration backup and migration

### **Enhancement Ideas**
- Drag-and-drop role assignment
- Visual role hierarchy trees
- Permission impact analysis
- Role usage recommendations

## 🔧 Troubleshooting

### **Common Issues**

1. **"Failed to load data"**
   - Check backend server is running
   - Verify API endpoints are accessible
   - Check browser console for detailed errors

2. **"Access denied" errors**
   - Ensure user has required permissions
   - Check authentication token validity
   - Verify role assignments in backend

3. **Changes not appearing**
   - Data refreshes automatically after changes
   - Try refreshing the browser if issues persist
   - Check network tab for failed API calls

### **Debug Mode**
Enable detailed logging by setting `NODE_ENV=development` in your environment.

## 🎉 Success! 

Your role-based management system is now fully integrated and ready to use. The system provides enterprise-grade role and permission management with an intuitive, user-friendly interface.

Navigate to the **Role Management** section in your sidebar to start managing your application's security and access control!
