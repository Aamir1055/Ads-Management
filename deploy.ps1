param(
    [string]$remote_host = "65.20.84.140",
    [string]$remote_user = "deployer",
    [string]$remote_dir = "~/Ads-Management-Fresh",
    [switch]$DryRun,
    [switch]$Force
)

Write-Host "Starting deployment process (archive-based)..." -ForegroundColor Green

# Basic prerequisites check
if (!(Get-Command ssh -ErrorAction SilentlyContinue)) {
    Write-Host "Error: 'ssh' is not available in PATH." -ForegroundColor Red
    exit 1
}
if (!(Get-Command scp -ErrorAction SilentlyContinue)) {
    Write-Host "Error: 'scp' is not available in PATH." -ForegroundColor Red
    exit 1
}

# Files/folders to exclude from the archive (keeps server env intact)
$excludes = @(
    '\.git',
    'node_modules',
    '\.env',
    'package-lock.json',
    '\.gitignore',
    '\.vscode',
    'dist',
    'build',
    'tmp',
    'frontend\\node_modules',
    'frontend\\dist\\assets',
    'frontend\\package-lock.json',
    '\.sql$'
)

function Is-ExcludedPath($fullPath) {
    foreach ($ex in $excludes) {
        if ($fullPath -like "*$ex*") { return $true }
    }
    return $false
}

# Gather files to include
Write-Host "Scanning project files..." -ForegroundColor Yellow
$files = Get-ChildItem -Recurse -File | Where-Object { -not (Is-ExcludedPath $_.FullName) }

if (-not $files) {
    Write-Host "No files found to deploy after exclusions." -ForegroundColor Yellow
    exit 0
}

$archiveName = "deploy_$(Get-Date -Format yyyyMMdd_HHmmss).zip"
$archivePath = Join-Path $env:TEMP $archiveName

Write-Host "Files to include: $($files.Count)" -ForegroundColor Cyan
if ($DryRun) {
    $files | ForEach-Object { Write-Host "  $_.FullName" }
    Write-Host "Dry run enabled — no archive will be created or uploaded." -ForegroundColor Green
    exit 0
}

if (-not $Force) {
    $prompt = "Proceed to create archive '$archiveName' and deploy to ${remote_user}@${remote_host}:$remote_dir? (y/N)"
    $confirm = Read-Host $prompt
    if ($confirm -ne 'y' -and $confirm -ne 'Y') {
        Write-Host "Aborted by user." -ForegroundColor Yellow
        exit 0
    }
}

Write-Host "Creating archive $archivePath ..." -ForegroundColor Yellow
try {
    $paths = $files | Select-Object -ExpandProperty FullName
    Compress-Archive -Path $paths -DestinationPath $archivePath -Force
} catch {
    Write-Host "Archive creation failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host "Uploading archive to server..." -ForegroundColor Yellow
try {
    scp $archivePath "${remote_user}@${remote_host}:/tmp/$archiveName"
} catch {
    Write-Host "Upload failed: $_" -ForegroundColor Red
    Remove-Item -LiteralPath $archivePath -ErrorAction SilentlyContinue
    exit 1
}

# Remote extraction and deploy steps (will not alter global server env)
$remote_commands = @'
mkdir -p __REMOTE_DIR__
if command -v unzip >/dev/null 2>&1; then
    unzip -o /tmp/__ARCHIVE__ -d __REMOTE_DIR__
else
    echo 'ERROR: unzip not found on server. Please install unzip and re-run.' >&2
    exit 2
fi
rm -f /tmp/__ARCHIVE__
cd __REMOTE_DIR__
pm2 reload all || pm2 restart all || (echo 'PM2 not found or restart failed' >&2; exit 3)
pm2 save || true
'@

$remote_commands = $remote_commands -replace '__REMOTE_DIR__', $remote_dir
$remote_commands = $remote_commands -replace '__ARCHIVE__', $archiveName

Write-Host "Running remote extraction and restart..." -ForegroundColor Yellow
try {
        ssh "${remote_user}@${remote_host}" $remote_commands
} catch {
        Write-Host "Remote deployment step failed: $_" -ForegroundColor Red
        Remove-Item -LiteralPath $archivePath -ErrorAction SilentlyContinue
        exit 1
}

# Clean up local archive
Remove-Item -LiteralPath $archivePath -ErrorAction SilentlyContinue

Write-Host "Deployment completed successfully!" -ForegroundColor Green