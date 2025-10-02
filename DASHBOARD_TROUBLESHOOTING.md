# Dashboard Troubleshooting Guide

## ✅ Issues Fixed

### 1. **Currency Symbol Fixed: USD → INR**
- Dashboard now shows **₹** instead of **$**
- All monetary values use Indian Rupee formatting

### 2. **Missing Activities Endpoint Fixed**
- Removed call to non-existent `/api/analytics/activities` endpoint
- Using mock activity data until backend endpoint is implemented
- No more 404 errors for activities

### 3. **Login Redirect Issue Improved**
- Added better error handling to prevent unnecessary login redirects
- Only redirects on actual authentication failures (401/403)
- API errors no longer trigger login redirects

## 🐛 Current Issues & Solutions

### Issue 1: "Getting redirected to login page on refresh"

**Possible Causes:**
1. **Token Expiration**: Your JWT token has expired
2. **Token Missing**: Authentication token not found in localStorage
3. **Backend Not Running**: Backend server is not responding
4. **Database Connection**: Backend can't connect to database

**Solutions:**
1. **Check if backend is running:**
   ```bash
   # In backend directory
   npm start
   # Or
   node server.js
   ```

2. **Check authentication status:**
   - Click the red "Debug Auth" button in bottom-right corner
   - Check what tokens are present
   - Look for any missing tokens

3. **Clear tokens and re-login:**
   - Click "Clear All & Reload" in debug panel
   - Or manually clear: Press F12 → Application → Storage → Clear All
   - Login again

### Issue 2: "KPI cards showing zero values"

**Possible Causes:**
1. **No Data in Database**: Reports table is empty
2. **Database Connection**: Backend can't connect to database  
3. **API Endpoints**: Analytics endpoints returning empty results
4. **Date Range**: No data in the current date range being queried

**Solutions:**
1. **Check if backend is running:**
   ```bash
   # Should see: "Server running on port 5000"
   cd backend
   npm start
   ```

2. **Check database connection:**
   ```bash
   # In backend directory, run:
   node debug-dashboard-data.js
   ```

3. **Verify data exists in database:**
   - Open browser dev tools (F12)
   - Go to Network tab
   - Refresh dashboard
   - Look for `/api/analytics/dashboard` request
   - Check response data

4. **Check API responses:**
   - If API returns empty data, you need to add sample data to database
   - Or check if date filters are too restrictive

## 🔧 Debug Tools Added

### Auth Debug Component
- **Location**: Bottom-right corner (red button)
- **Shows**: Authentication status, tokens, user info
- **Actions**: Clear tokens, log debug info to console

### Enhanced Error Handling
- **Graceful Fallbacks**: Empty arrays instead of crashes
- **Better Error Messages**: More specific error descriptions
- **Auth-Aware**: Distinguishes between API errors and auth errors

## 📋 Step-by-Step Debug Process

### Step 1: Check Authentication
1. Look for red "Debug Auth" button in bottom-right
2. Click it to see authentication status
3. If any token is missing (❌), click "Clear All & Reload" and login again

### Step 2: Check Backend Status
1. Open terminal in backend directory
2. Run `npm start` or `node server.js`
3. Should see "Server running on port 5000"
4. If not, check for errors in terminal

### Step 3: Check API Calls
1. Open browser Developer Tools (F12)
2. Go to Network tab
3. Refresh dashboard page
4. Look for API calls to:
   - `/api/analytics/dashboard`
   - `/api/analytics/charts/time-series`
   - `/api/analytics/charts/campaign-performance`
   - `/api/analytics/charts/brand-analysis`

### Step 4: Check API Responses
1. Click on each API call in Network tab
2. Check Response tab for actual data
3. If responses are empty `{}`, database has no data
4. If status is 401/403, it's an authentication issue
5. If status is 500, it's a backend error

### Step 5: Add Sample Data (if needed)
If all APIs work but return empty data, you need to add sample data:

1. **Check what's in database:**
   ```sql
   SELECT COUNT(*) FROM reports;
   SELECT * FROM reports LIMIT 5;
   ```

2. **Add sample data if empty:**
   ```sql
   INSERT INTO reports (campaign_id, campaign_name, brand, leads, spent, cost_per_lead, report_date)
   VALUES 
   (1, 'Sample Campaign 1', 'Brand A', 100, 5000, 50, CURDATE()),
   (2, 'Sample Campaign 2', 'Brand B', 75, 3750, 50, CURDATE()),
   (3, 'Sample Campaign 3', 'Brand C', 50, 2500, 50, CURDATE());
   ```

## 🚀 Quick Fixes

### Fix 1: Clear All Tokens and Restart
```javascript
// In browser console (F12)
localStorage.clear();
sessionStorage.clear();
window.location.reload();
```

### Fix 2: Check Backend is Running
```bash
# Terminal 1: Start Backend
cd "C:\Users\bazaa\Desktop\Ads Reporting Software\backend"
npm start

# Terminal 2: Check if it's accessible
curl http://localhost:5000/api/health
```

### Fix 3: Manual Login
1. Go to http://localhost:3000/login
2. Enter your credentials
3. After successful login, try dashboard again

## ✅ Expected Results After Fixes

Once working correctly, you should see:
- **KPI Cards**: Real numbers with ₹ symbols
- **Charts**: Interactive graphs with data
- **Activities**: List of recent activities (mock data for now)
- **No 404 Errors**: All API calls should succeed
- **No Login Redirects**: Should stay on dashboard after refresh

## 🆘 Still Having Issues?

If problems persist:

1. **Check Console Errors:**
   - Press F12 → Console tab
   - Look for any red error messages
   - Share the error messages for specific help

2. **Check Network Errors:**
   - Press F12 → Network tab
   - Look for failed requests (red status)
   - Check what the server is actually returning

3. **Restart Everything:**
   - Close browser
   - Stop backend server (Ctrl+C)
   - Start backend: `npm start`
   - Open browser and login again

The dashboard should now display Indian Rupees (₹) and handle API errors gracefully! 🎉
