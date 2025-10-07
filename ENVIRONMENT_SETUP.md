# Environment Configuration Guide

This guide explains how to configure environment variables for production deployment.

## Overview

The application has been refactored to use environment variables for all port and URL configurations. **No hardcoded ports or URLs remain in the codebase.**

## Required Environment Variables

### Backend (.env)

Create `backend/.env` from `backend/.env.example`:

```bash
# Server Configuration (REQUIRED)
PORT=5000                    # Backend server port - NO DEFAULT FALLBACK

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ads_reporting
DB_PORT=3306

# Security
JWT_SECRET=your_jwt_secret_key_change_this_in_production
REFRESH_TOKEN_SECRET=your_refresh_token_secret_key_change_this_in_production

# CORS - Frontend URLs
CLIENT_URL=http://localhost:3000,http://localhost:5173
CORS_ALLOWLIST=http://localhost:3000,http://localhost:5173
FRONTEND_URL=http://localhost:3000

# Environment
NODE_ENV=development
```

### Frontend (.env)

Create `frontend/.env` from `frontend/.env.example`:

```bash
# Development Server
VITE_PORT=3000              # Frontend development server port
PORT=3000                   # Fallback port

# API Configuration
VITE_API_BASE_URL=http://localhost:5000/api    # Backend API URL
VITE_API_PROXY_TARGET=http://localhost:5000    # Vite dev server proxy target
```

## Production Deployment

### 1. Backend Production Environment

```bash
# Server
PORT=80                     # Or your desired production port
NODE_ENV=production

# Database
DB_HOST=your-production-db-host
DB_USER=your_production_db_user
DB_PASSWORD=your_secure_production_password

# CORS - Your production frontend URLs
CLIENT_URL=https://yourdomain.com
CORS_ALLOWLIST=https://yourdomain.com,https://www.yourdomain.com
FRONTEND_URL=https://yourdomain.com

# Security - Generate secure secrets
JWT_SECRET=your_super_secure_jwt_secret_64_characters_minimum
REFRESH_TOKEN_SECRET=your_super_secure_refresh_token_secret_64_characters_minimum
```

### 2. Frontend Production Environment

```bash
# Production API URLs
VITE_API_BASE_URL=https://api.yourdomain.com/api
VITE_API_PROXY_TARGET=https://api.yourdomain.com

# Port (if needed for build process)
VITE_PORT=80
PORT=80
```

## Key Changes Made

✅ **Removed all hardcoded ports:**
- Backend: Removed `|| 5000` fallback in `server.js`
- Frontend: Replaced hardcoded ports in `vite.config.js`

✅ **Replaced hardcoded API URLs:**
- Updated `Login.jsx` and `LoginSimple.jsx` to use `config.API_BASE_URL`
- Updated `utils/api.js` to use config-based URLs

✅ **Environment-driven configuration:**
- Backend now requires `PORT` environment variable (no fallback)
- Frontend uses `VITE_PORT`, `VITE_API_BASE_URL`, and `VITE_API_PROXY_TARGET`

## Deployment Steps

1. **Copy environment templates:**
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

2. **Update with production values:**
   - Set your production ports
   - Update database credentials
   - Set production domain URLs
   - Generate secure JWT secrets

3. **Build and deploy:**
   ```bash
   # Backend
   cd backend
   npm install
   npm start

   # Frontend
   cd frontend
   npm install
   npm run build
   ```

## Environment Variable Reference

| Variable | Location | Required | Description |
|----------|----------|----------|-------------|
| `PORT` | Backend | ✅ Yes | Backend server port (no fallback) |
| `VITE_PORT` | Frontend | ⚠️ Optional | Frontend dev server port |
| `VITE_API_BASE_URL` | Frontend | ✅ Yes | Backend API base URL |
| `VITE_API_PROXY_TARGET` | Frontend | ✅ Yes | Vite proxy target for dev server |
| `CLIENT_URL` | Backend | ✅ Yes | Frontend URLs for CORS |
| `DB_HOST` | Backend | ✅ Yes | Database host |
| `JWT_SECRET` | Backend | ✅ Yes | JWT signing secret |

## Troubleshooting

**Backend won't start:**
- Ensure `PORT` environment variable is set
- Check that the port is not already in use

**Frontend can't connect to API:**
- Verify `VITE_API_BASE_URL` points to your backend
- Ensure backend CORS allows your frontend URL

**CORS errors:**
- Update `CLIENT_URL` and `CORS_ALLOWLIST` in backend .env
- Include all frontend URLs (with/without www, http/https)
