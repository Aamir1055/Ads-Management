Write-Host "Starting deployment dry run..." -ForegroundColor "Green"

# Files/folders to exclude
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
Write-Host "Scanning project files..." -ForegroundColor "Yellow"
$files = Get-ChildItem -Recurse -File | Where-Object { -not (Is-ExcludedPath $_.FullName) }

if (-not $files) {
    Write-Host "No files found to deploy after exclusions." -ForegroundColor "Yellow"
    exit 0
}

Write-Host "`nFiles that would be included in deployment ($($files.Count) total):" -ForegroundColor "Cyan"
$files | ForEach-Object { Write-Host "  $($_.FullName)" }
Write-Host "`nDry run complete - no files were actually transferred." -ForegroundColor "Green"