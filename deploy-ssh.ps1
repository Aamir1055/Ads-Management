# Safe deployment script for Ads-Management project (SSH+tar method)
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

# Check SSH
Write-Host "[1/7] Checking prerequisites..." -ForegroundColor Cyan
if (!(Get-Command ssh -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: SSH not found in PATH" -ForegroundColor Red
    exit 1
}
if (!(Get-Command scp -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: SCP not found in PATH" -ForegroundColor Red
    exit 1
}
Write-Host "OK: SSH and SCP found" -ForegroundColor Green

# Test connection
Write-Host "`n[2/7] Testing server connection..." -ForegroundColor Cyan
ssh -o ConnectTimeout=5 "${REMOTE_USER}@${REMOTE_HOST}" "echo OK" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Cannot connect to server" -ForegroundColor Red
    Write-Host "Trying with password prompt..." -ForegroundColor Yellow
    ssh "${REMOTE_USER}@${REMOTE_HOST}" "echo OK"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Connection failed" -ForegroundColor Red
        exit 1
    }
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
    Write-Host "`n[3/7] Creating backup on server..." -ForegroundColor Cyan
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupName = "backup_${timestamp}.tar.gz"
    
    ssh "${REMOTE_USER}@${REMOTE_HOST}" "mkdir -p ~/backups && cd ${REMOTE_DIR} && tar -czf ~/backups/${backupName} --exclude=node_modules --exclude=frontend/node_modules --exclude=backend/node_modules --exclude=frontend/dist --exclude=.git . 2>/dev/null && echo 'Backup: ${backupName}' || echo 'Backup failed'"
    
    Write-Host "OK: Backup created as $backupName" -ForegroundColor Green
} else {
    Write-Host "`n[3/7] Skipping backup..." -ForegroundColor Yellow
}

# Create local archive
Write-Host "`n[4/7] Creating deployment archive..." -ForegroundColor Cyan

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$archiveName = "deploy_${timestamp}.zip"
$archivePath = Join-Path $env:TEMP $archiveName

# Files to exclude
$excludePatterns = @(
    '\.git',
    'node_modules',
    'frontend\\node_modules',
    'backend\\node_modules',
    'frontend\\dist',
    '\.env',
    'backend\\\.env',
    'frontend\\\.env',
    '\.env\.local',
    '\.env\.production',
    '\.log$',
    'logs',
    'coverage',
    '\.vscode',
    '\.idea',
    'Database',
    'LocalDB',
    'Serverdb\.sql',
    '\.sql$',
    'deploy-.*\.ps1',
    '\.bak$',
    '\.backup$',
    '\.tmp$',
    '\.DS_Store',
    'Thumbs\.db',
    'package-lock\.json'
)

# Get all files
$allFiles = Get-ChildItem -Path $LOCAL_DIR -Recurse -File

# Filter out excluded files
$filesToInclude = $allFiles | Where-Object {
    $file = $_
    $relativePath = $file.FullName.Substring($LOCAL_DIR.Length + 1)
    
    # Check if file matches any exclude pattern
    $excluded = $false
    foreach ($pattern in $excludePatterns) {
        if ($relativePath -match $pattern) {
            $excluded = $true
            break
        }
    }
    
    -not $excluded
}

Write-Host "Files to deploy: $($filesToInclude.Count)" -ForegroundColor Gray

if ($DryRun) {
    Write-Host "DRY RUN - Would deploy these files:" -ForegroundColor Yellow
    $filesToInclude | Select-Object -First 20 | ForEach-Object { 
        Write-Host "  $($_.FullName.Substring($LOCAL_DIR.Length + 1))" -ForegroundColor DarkGray
    }
    if ($filesToInclude.Count -gt 20) {
        Write-Host "  ... and $($filesToInclude.Count - 20) more files" -ForegroundColor DarkGray
    }
    Write-Host "`nDRY RUN complete - no changes made" -ForegroundColor Yellow
    exit 0
}

# Create archive
try {
    Compress-Archive -Path ($filesToInclude | Select-Object -ExpandProperty FullName) -DestinationPath $archivePath -Force
    Write-Host "OK: Archive created ($([math]::Round((Get-Item $archivePath).Length / 1MB, 2)) MB)" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to create archive: $_" -ForegroundColor Red
    exit 1
}

# Upload archive
Write-Host "`n[5/7] Uploading to server..." -ForegroundColor Cyan
scp $archivePath "${REMOTE_USER}@${REMOTE_HOST}:/tmp/$archiveName"

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Upload failed" -ForegroundColor Red
    Remove-Item $archivePath -ErrorAction SilentlyContinue
    exit 1
}
Write-Host "OK: Archive uploaded" -ForegroundColor Green

# Extract on server
Write-Host "`n[6/7] Extracting on server..." -ForegroundColor Cyan
ssh "${REMOTE_USER}@${REMOTE_HOST}" @"
cd ${REMOTE_DIR} &&
unzip -o /tmp/${archiveName} &&
rm /tmp/${archiveName} &&
echo 'Extraction complete'
"@

if ($LASTEXITCODE -eq 0) {
    Write-Host "OK: Code deployed successfully" -ForegroundColor Green
} else {
    Write-Host "ERROR: Extraction failed" -ForegroundColor Red
    Remove-Item $archivePath -ErrorAction SilentlyContinue
    exit 1
}

# Clean up local archive
Remove-Item $archivePath -ErrorAction SilentlyContinue

# Post-deployment
Write-Host "`n[7/7] Running post-deployment tasks..." -ForegroundColor Cyan

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

# PM2 Status
Write-Host "`nPM2 Status:" -ForegroundColor Cyan
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
