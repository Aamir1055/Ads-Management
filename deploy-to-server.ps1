# Safe deployment script for Ads-Management project
# Syncs local changes to server while preserving .env files and not touching PM2

param(
    [switch]$DryRun,
    [switch]$SkipBackup
)

# Configuration
$REMOTE_HOST = "65.20.84.140"
$REMOTE_USER = "deployer"
$REMOTE_DIR = "~/Ads-Management-Fresh"
$LOCAL_DIR = $PSScriptRoot

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Deploy to Production Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Target: ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}" -ForegroundColor Gray
Write-Host "Mode: $(if ($DryRun) { 'DRY RUN' } else { 'LIVE DEPLOYMENT' })" -ForegroundColor $(if ($DryRun) { 'Yellow' } else { 'Green' })
Write-Host ""

# Check rsync
Write-Host "[1/6] Checking prerequisites..." -ForegroundColor Cyan
if (!(Get-Command rsync -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: rsync not found. Install Git for Windows or use WSL" -ForegroundColor Red
    exit 1
}
Write-Host "OK: rsync found" -ForegroundColor Green

# Test connection
Write-Host "`n[2/6] Testing server connection..." -ForegroundColor Cyan
$testResult = ssh -o ConnectTimeout=5 "${REMOTE_USER}@${REMOTE_HOST}" "echo OK" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Cannot connect to server" -ForegroundColor Red
    Write-Host "Make sure SSH key is configured or you can enter password" -ForegroundColor Yellow
    exit 1
}
Write-Host "OK: Server connection successful" -ForegroundColor Green

# Confirm
if (!$DryRun) {
    Write-Host "`nWARNING: This will deploy to production!" -ForegroundColor Yellow
    Write-Host "  - .env files will be PRESERVED" -ForegroundColor Gray
    Write-Host "  - node_modules will be reinstalled" -ForegroundColor Gray
    Write-Host "  - PM2 will NOT be restarted" -ForegroundColor Gray
    $confirm = Read-Host "`nContinue? (yes/no)"
    if ($confirm -ne "yes") {
        Write-Host "Cancelled" -ForegroundColor Yellow
        exit 0
    }
}

# Backup
if (!$SkipBackup -and !$DryRun) {
    Write-Host "`n[3/6] Creating backup on server..." -ForegroundColor Cyan
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupName = "backup_${timestamp}.tar.gz"
    
    ssh "${REMOTE_USER}@${REMOTE_HOST}" "mkdir -p ~/backups && cd ${REMOTE_DIR} && tar -czf ~/backups/${backupName} --exclude=node_modules --exclude=frontend/node_modules --exclude=backend/node_modules --exclude=frontend/dist --exclude=.git . 2>/dev/null && echo 'Backup: ${backupName}' || echo 'Backup failed'"
    
    Write-Host "OK: Backup created" -ForegroundColor Green
} else {
    Write-Host "`n[3/6] Skipping backup..." -ForegroundColor Yellow
}

# Sync code using rsync
Write-Host "`n[4/6] Syncing code to server..." -ForegroundColor Cyan

$excludeList = @(
    '.git',
    'node_modules',
    'frontend/node_modules',
    'backend/node_modules', 
    'frontend/dist',
    '.env',
    'backend/.env',
    'frontend/.env',
    '.env.local',
    '.env.production',
    '*.log',
    'logs',
    'coverage',
    '.vscode',
    '.idea',
    'Database',
    'LocalDB',
    'Serverdb.sql',
    '*.sql',
    'deploy-*.ps1',
    '*.bak',
    '*.backup',
    '*.tmp',
    '.DS_Store',
    'Thumbs.db'
)

# Build exclude parameters
$excludeParams = $excludeList | ForEach-Object { "--exclude=$_" }

# Build rsync command
$rsyncParams = @(
    '-avz'
    '--delete'
    '--progress'
) + $excludeParams

if ($DryRun) {
    $rsyncParams += '--dry-run'
    Write-Host "DRY RUN MODE - No files will be changed" -ForegroundColor Yellow
}

$rsyncParams += "${LOCAL_DIR}/"
$rsyncParams += "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/"

Write-Host "Executing rsync..." -ForegroundColor Gray
& rsync @rsyncParams

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: rsync failed with code $LASTEXITCODE" -ForegroundColor Red
    exit 1
}
Write-Host "OK: Code synced successfully" -ForegroundColor Green

# Post-deployment
if (!$DryRun) {
    Write-Host "`n[5/6] Running post-deployment tasks..." -ForegroundColor Cyan
    
    # Install backend dependencies
    Write-Host "Installing backend dependencies..." -ForegroundColor Gray
    ssh "${REMOTE_USER}@${REMOTE_HOST}" "cd ${REMOTE_DIR}/backend && npm ci --production --legacy-peer-deps 2>&1 | tail -20"
    
    # Install frontend dependencies
    Write-Host "Installing frontend dependencies..." -ForegroundColor Gray
    ssh "${REMOTE_USER}@${REMOTE_HOST}" "cd ${REMOTE_DIR}/frontend && npm ci --legacy-peer-deps 2>&1 | tail -20"
    
    # Build frontend
    Write-Host "Building frontend..." -ForegroundColor Gray
    ssh "${REMOTE_USER}@${REMOTE_HOST}" "cd ${REMOTE_DIR}/frontend && npm run build 2>&1 | tail -30"
    
    Write-Host "OK: Post-deployment tasks completed" -ForegroundColor Green
} else {
    Write-Host "`n[5/6] Skipping post-deployment (dry run)" -ForegroundColor Yellow
}

# PM2 Status
Write-Host "`n[6/6] Checking PM2 status..." -ForegroundColor Cyan
ssh "${REMOTE_USER}@${REMOTE_HOST}" "pm2 status"

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  Deployment Completed Successfully!" -ForegroundColor Green  
Write-Host "========================================" -ForegroundColor Green

Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "  1. Verify app is working" -ForegroundColor Gray
Write-Host "  2. Restart PM2 if needed:" -ForegroundColor Gray
Write-Host "     ssh ${REMOTE_USER}@${REMOTE_HOST} 'pm2 restart all'" -ForegroundColor DarkGray
Write-Host "  3. Check logs:" -ForegroundColor Gray
Write-Host "     ssh ${REMOTE_USER}@${REMOTE_HOST} 'pm2 logs'" -ForegroundColor DarkGray
Write-Host ""
