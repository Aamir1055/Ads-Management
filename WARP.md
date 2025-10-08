# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

The Ads Reporting Software is a full-stack web application for managing advertising campaigns, reports, and analytics. It uses a modern architecture with React/Vite frontend and Node.js/Express backend with MySQL database.

## Development Commands

### Backend Development
```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Development with auto-restart
npm run dev

# Production start
npm start

# Database setup (ensure MySQL running first)
mysql -u root -p < database.sql

# Health check
npm run health-check

# Process management (PM2)
npm run pm2:start
npm run pm2:stop
npm run pm2:restart
npm run pm2:logs
```

### Frontend Development
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Full Stack Development
Start both servers simultaneously:
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend  
cd frontend && npm run dev
```

### Database Operations
```bash
# Start XAMPP MySQL (if using XAMPP)
# Access phpMyAdmin: http://localhost/phpmyadmin

# Create database and run schema
mysql -u root -p
CREATE DATABASE ads_reporting;
USE ads_reporting;
SOURCE backend/database.sql;
```

## Architecture Overview

### Backend Architecture (Node.js/Express)
- **Entry Point**: `backend/server.js` - Server startup, database connection, graceful shutdown
- **App Configuration**: `backend/app.js` - Express setup, middleware, routes, security
- **Database Layer**: 
  - `config/database.js` - MySQL connection pool configuration
  - `models/` - Database models and queries
- **API Layer**:
  - `routes/` - API endpoints organized by feature (auth, users, campaigns, etc.)
  - `controllers/` - Business logic handlers
  - `middleware/` - Authentication, authorization, validation, error handling
- **Utilities**: `utils/` - Helper functions, validators, formatters
- **WebSocket**: `websocket/` - Real-time analytics updates
- **Security**: JWT-based authentication, RBAC system, 2FA support

### Frontend Architecture (React/Vite)
- **Entry Point**: `frontend/src/main.jsx` - React app initialization  
- **App Root**: `frontend/src/App.jsx` - Routing, authentication flow, layout structure
- **Architecture Patterns**:
  - **Context-based State**: `contexts/AuthContext.js` and `contexts/PermissionContext.js` for global state
  - **Module-based Organization**: `modules/` for complex features (Dashboard, UserManagement, etc.)
  - **Page Components**: `pages/` for route-level components
  - **Shared Components**: `components/` for reusable UI elements
  - **Protected Routes**: All authenticated routes wrapped with `ProtectedRoute` and `PermissionProvider`

### Database Schema
- **Core Tables**: `users`, `roles`, `permissions`, `campaigns`, `ads`, `reports`, `brands`
- **Security**: Role-based permissions system with granular access control
- **Analytics**: `ad_stats` table for performance metrics, real-time data via WebSocket
- **Audit**: Created/updated timestamps on all major entities

### Key Architectural Patterns

#### Authentication Flow
1. Login → JWT tokens (access + refresh)
2. Protected routes check token validity
3. Permission context loads user roles/permissions
4. Route-level and component-level permission checking

#### Role-Based Access Control (RBAC)
- **Roles**: Admin, Manager, User with hierarchical permissions
- **Modules**: Dashboard, User Management, Campaign Management, Reports, etc.
- **Actions**: Create, Read, Update, Delete per module
- **Frontend**: Permission context provides `hasPermission()` helper
- **Backend**: Middleware validates permissions on API routes

#### Data Flow Pattern
- Frontend makes API calls via Axios
- Backend validates JWT, checks permissions
- Database operations through connection pool
- Structured error responses with proper HTTP codes
- Real-time updates via WebSocket for analytics

## Environment Configuration

### Backend (.env)
Required variables:
- `PORT=5000` - Server port
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` - Database connection
- `JWT_SECRET`, `REFRESH_TOKEN_SECRET` - Authentication secrets
- `CLIENT_URL` - Frontend URL for CORS
- `NODE_ENV` - Environment mode

### Frontend (.env)
- `VITE_API_PROXY_TARGET` - Backend API URL for development proxy
- `VITE_PORT` - Development server port (optional)

## Database Setup Notes

1. Ensure MySQL server is running (XAMPP, standalone, etc.)
2. Create database: `ads_reporting`
3. Run schema: `backend/database.sql`
4. Default connection: `localhost:3306` with user `root`
5. Production requires proper credentials and connection pooling

## Common Development Patterns

### Adding New Features
1. **Backend**: Create route → controller → model → test endpoints
2. **Frontend**: Create page/component → add route in App.jsx → implement permissions
3. **Database**: Add migration if schema changes needed
4. **Integration**: Test full flow with proper error handling

### Permission Integration
- Backend: Use permission middleware on routes
- Frontend: Wrap components with permission checks
- Always verify permissions on both client and server side

### Error Handling
- Backend: Structured error responses with appropriate HTTP codes
- Frontend: React error boundaries and toast notifications
- Database: Proper foreign key constraints and validation

## Technical Considerations

### Performance
- Database connection pooling configured
- Frontend code splitting via React Router
- Compression and caching headers in production
- Rate limiting on API endpoints

### Security
- Helmet.js for security headers
- CORS properly configured
- JWT with refresh token rotation
- Input validation on all endpoints
- 2FA support for enhanced security

### Development Experience
- Hot reload on both frontend and backend
- Comprehensive error logging
- Health check endpoint for monitoring
- WebSocket for real-time features

## Troubleshooting

### Database Connection Issues
- Verify MySQL service is running
- Check `.env` database credentials
- Ensure `ads_reporting` database exists
- Review connection pool settings

### CORS Issues
- Verify `CLIENT_URL` matches frontend URL
- Check CORS allowlist configuration
- Ensure credentials are properly handled

### Authentication Problems
- Check JWT secret configuration
- Verify token storage in frontend
- Review permission assignments in database
- Check 2FA setup if enabled