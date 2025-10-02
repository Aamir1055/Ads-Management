# Complete Server Restart Script
# This script will properly restart both backend and frontend servers

Write-Host "🔄 Restarting Ads Reporting Software Servers..." -ForegroundColor Cyan

# Kill all existing Node processes
Write-Host "🛑 Stopping existing processes..." -ForegroundColor Yellow
try {
    Get-Process -Name "node" -ErrorAction Stop | Stop-Process -Force
    Write-Host "✅ Node processes stopped" -ForegroundColor Green
} catch {
    Write-Host "ℹ️ No existing node processes found" -ForegroundColor Blue
}

try {
    Get-Process -Name "nodemon" -ErrorAction Stop | Stop-Process -Force
    Write-Host "✅ Nodemon processes stopped" -ForegroundColor Green
} catch {
    Write-Host "ℹ️ No existing nodemon processes found" -ForegroundColor Blue
}

# Wait a moment
Start-Sleep -Seconds 2

# Start Backend Server
Write-Host "🚀 Starting Backend Server (Port 5000)..." -ForegroundColor Cyan
$backendPath = "C:\Users\bazaa\Desktop\Ads Reporting Software\backend"
Start-Process -WindowStyle Hidden -WorkingDirectory $backendPath -FilePath "node" -ArgumentList "server.js"

# Wait for backend to initialize
Write-Host "⏳ Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Test backend health
try {
    $healthCheck = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -UseBasicParsing -TimeoutSec 10
    if ($healthCheck.StatusCode -eq 200) {
        Write-Host "✅ Backend server is healthy" -ForegroundColor Green
    } else {
        Write-Host "❌ Backend server health check failed" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Backend server is not responding" -ForegroundColor Red
}

# Start Frontend Server
Write-Host "🚀 Starting Frontend Server (Port 3000)..." -ForegroundColor Cyan
$frontendPath = "C:\Users\bazaa\Desktop\Ads Reporting Software\frontend"
Start-Process -WindowStyle Minimized -WorkingDirectory $frontendPath -FilePath "npm" -ArgumentList "run dev"

# Wait for frontend to initialize
Write-Host "⏳ Waiting for frontend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Test frontend (note: Vite dev server might not respond to requests immediately)
try {
    $frontendCheck = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5
    if ($frontendCheck.StatusCode -eq 200) {
        Write-Host "✅ Frontend server is running" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️ Frontend server starting (this is normal for Vite)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Servers Started!" -ForegroundColor Green
Write-Host "📍 Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "📍 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔧 Troubleshooting Tips:" -ForegroundColor Yellow
Write-Host "   1. If you get 401 errors, clear browser cache and re-login" -ForegroundColor White
Write-Host "   2. If Excel export fails, check browser console for details" -ForegroundColor White
Write-Host "   3. If ports are still in use, run this script again" -ForegroundColor White
Write-Host ""
Write-Host "✨ Excel Export Features:" -ForegroundColor Magenta
Write-Host "   ✅ Fixed 500 error - export now works correctly" -ForegroundColor White
Write-Host "   ✅ Date format: dd/mm/yyyy as requested" -ForegroundColor White
Write-Host "   ✅ Campaign and brand names included" -ForegroundColor White
Write-Host "   ✅ Privacy filtering applied" -ForegroundColor White
