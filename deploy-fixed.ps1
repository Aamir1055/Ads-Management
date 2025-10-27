param(
    [string]$remote_host,
    [string]$remote_user = "deployer",
    [string]$remote_dir = "~/Ads-Management-Fresh",
    [switch]$DryRun,
    [switch]$Force
)

Write-Host "Starting deployment process..." -ForegroundColor "Green"

# Check for SSH and SCP
if (!(Get-Command ssh -ErrorAction SilentlyContinue)) {
    Write-Host "Error: 'ssh' is not available in PATH." -ForegroundColor "Red"
    exit 1
}
if (!(Get-Command scp -ErrorAction SilentlyContinue)) {
    Write-Host "Error: 'scp' is not available in PATH." -ForegroundColor "Red"
    exit 1
}

# Prompt for remote host if not provided
if (-not $remote_host) {
    $remote_host = Read-Host "Enter remote host (IP or hostname)"
    if (-not $remote_host) {
        Write-Host "Remote host is required. Aborting." -ForegroundColor "Red"
        exit 1
    }
}

# Files to exclude
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

# Gather files
Write-Host "Scanning project files..." -ForegroundColor "Yellow"
$files = Get-ChildItem -Recurse -File | Where-Object { -not (Is-ExcludedPath $_.FullName) }

if (-not $files) {
    Write-Host "No files found to deploy after exclusions." -ForegroundColor "Yellow"
    exit 0
}

$archiveName = "deploy_$(Get-Date -Format yyyyMMdd_HHmmss).zip"
$archivePath = Join-Path $env:TEMP $archiveName

Write-Host "Files to include: $($files.Count)" -ForegroundColor "Cyan"
if ($DryRun) {
    $files | ForEach-Object { Write-Host "  $($_.FullName)" }
    Write-Host "Dry run complete - no files were transferred." -ForegroundColor "Green"
    exit 0
}

if (-not $Force) {
    $prompt = "Proceed with deployment to ${remote_user}@${remote_host}:$remote_dir? (y/N)"
    $confirm = Read-Host $prompt
    if ($confirm -ne 'y' -and $confirm -ne 'Y') {
        Write-Host "Deployment aborted by user." -ForegroundColor "Yellow"
        exit 0
    }
}

Write-Host "Creating deployment archive..." -ForegroundColor "Yellow"
try {
    $paths = $files | Select-Object -ExpandProperty FullName
    Compress-Archive -Path $paths -DestinationPath $archivePath -Force
} catch {
    Write-Host "Failed to create archive: $_" -ForegroundColor "Red"
    exit 1
}

Write-Host "Uploading to server..." -ForegroundColor "Yellow"
try {
    scp $archivePath "${remote_user}@${remote_host}:/tmp/$archiveName"
} catch {
    Write-Host "Upload failed: $_" -ForegroundColor "Red"
    Remove-Item -LiteralPath $archivePath -ErrorAction SilentlyContinue
    exit 1
}

# Remote commands with environment preservation
$remote_commands = @'
cd /tmp && \
mkdir -p __REMOTE_DIR__ && \
unzip -o __ARCHIVE_NAME__ -d __REMOTE_DIR__ && \
rm -f __ARCHIVE_NAME__ && \
cd __REMOTE_DIR__ && \
pm2 reload all || pm2 restart all || echo "Warning: PM2 reload failed" && \
pm2 save || true
'@

$remote_commands = $remote_commands.Replace('__REMOTE_DIR__', $remote_dir)
$remote_commands = $remote_commands.Replace('__ARCHIVE_NAME__', $archiveName)

Write-Host "Deploying on remote server..." -ForegroundColor "Yellow"
try {
    ssh "${remote_user}@${remote_host}" "bash -c '$remote_commands'"
} catch {
    Write-Host "Remote deployment failed: $_" -ForegroundColor "Red"
    Remove-Item -LiteralPath $archivePath -ErrorAction SilentlyContinue
    exit 1
}

# Cleanup
Remove-Item -LiteralPath $archivePath -ErrorAction SilentlyContinue

Write-Host "Deployment completed successfully!" -ForegroundColor "Green"