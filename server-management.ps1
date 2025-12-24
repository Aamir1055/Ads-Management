# Server Management Helper Script
# Quick commands for managing Ads Reporting Software on production server

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('status', 'logs', 'restart', 'stop', 'start', 'connect', 'help')]
    [string]$Action = 'help'
)

$SERVER_IP = "77.42.45.79"
$SERVER_USER = "root"
$SERVER_PASSWORD = "Fasahaty@#786"

function Show-Help {
    Write-Host "=========================================="  -ForegroundColor Cyan
    Write-Host "Server Management Helper" -ForegroundColor Cyan
    Write-Host "=========================================="  -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\server-management.ps1 -Action <command>" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Available Commands:" -ForegroundColor Green
    Write-Host "  status    - Check application status" -ForegroundColor White
    Write-Host "  logs      - View application logs" -ForegroundColor White
    Write-Host "  restart   - Restart the application" -ForegroundColor White
    Write-Host "  stop      - Stop the application" -ForegroundColor White
    Write-Host "  start     - Start the application" -ForegroundColor White
    Write-Host "  connect   - SSH to server" -ForegroundColor White
    Write-Host "  help      - Show this help message" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Cyan
    Write-Host "  .\server-management.ps1 -Action status" -ForegroundColor Gray
    Write-Host "  .\server-management.ps1 -Action logs" -ForegroundColor Gray
    Write-Host "  .\server-management.ps1 -Action restart" -ForegroundColor Gray
}

function Invoke-SSH {
    param([string]$Command)
    
    if (Get-Command "plink" -ErrorAction SilentlyContinue) {
        plink -ssh -batch -pw $SERVER_PASSWORD "${SERVER_USER}@${SERVER_IP}" $Command
    } else {
        Write-Host "PuTTY/plink not found. Install PuTTY or run manually:" -ForegroundColor Yellow
        Write-Host "SSH: ssh ${SERVER_USER}@${SERVER_IP}" -ForegroundColor Cyan
        Write-Host "Command: $Command" -ForegroundColor Cyan
    }
}

switch ($Action) {
    'status' {
        Write-Host "Checking application status..." -ForegroundColor Yellow
        Invoke-SSH "pm2 status"
    }
    'logs' {
        Write-Host "Fetching application logs (last 50 lines)..." -ForegroundColor Yellow
        Invoke-SSH "pm2 logs ads-reporting-api --lines 50 --nostream"
    }
    'restart' {
        Write-Host "Restarting application..." -ForegroundColor Yellow
        Invoke-SSH "pm2 restart ads-reporting-api"
        Write-Host "Application restarted!" -ForegroundColor Green
    }
    'stop' {
        Write-Host "Stopping application..." -ForegroundColor Yellow
        Invoke-SSH "pm2 stop ads-reporting-api"
        Write-Host "Application stopped!" -ForegroundColor Green
    }
    'start' {
        Write-Host "Starting application..." -ForegroundColor Yellow
        Invoke-SSH "pm2 start ads-reporting-api"
        Write-Host "Application started!" -ForegroundColor Green
    }
    'connect' {
        Write-Host "Connecting to server..." -ForegroundColor Yellow
        Write-Host "Server: $SERVER_IP" -ForegroundColor Cyan
        Write-Host "User: $SERVER_USER" -ForegroundColor Cyan
        Write-Host ""
        
        if (Get-Command "ssh" -ErrorAction SilentlyContinue) {
            ssh "${SERVER_USER}@${SERVER_IP}"
        } elseif (Get-Command "putty" -ErrorAction SilentlyContinue) {
            putty -ssh "${SERVER_USER}@${SERVER_IP}" -pw $SERVER_PASSWORD
        } else {
            Write-Host "SSH client not found." -ForegroundColor Red
            Write-Host "Install PuTTY or use: ssh ${SERVER_USER}@${SERVER_IP}" -ForegroundColor Yellow
        }
    }
    'help' {
        Show-Help
    }
}
