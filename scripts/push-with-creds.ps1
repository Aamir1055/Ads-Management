<#
Small helper to push current branch to origin using HTTPS and interactive credentials.
This script will:
 - prompt for your GitHub username
 - prompt for a Personal Access Token (PAT) securely
 - temporarily push to an URL that includes credentials (so you don't have to enter them multiple times)
 - restore the original origin URL afterwards

Security notes:
 - A GitHub PAT (not your account password) is required. Create one at https://github.com/settings/tokens (repo permissions).
 - The script avoids storing credentials in the repo, but the command may be visible to processes while running. Use on a trusted machine.
 - For long-term convenience, prefer the Git Credential Manager or SSH keys instead of embedding credentials.
#>

param(
    [string]$remoteName = 'origin',
    [string]$repo = 'Aamir1055/Ads-Management.git',
    [string]$branch = 'master'
)

function UrlEncode([string]$s) {
    return [System.Uri]::EscapeDataString($s)
}

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Error "git is not installed or not in PATH. Install Git and retry."
    exit 1
}

# Read credentials
$username = Read-Host "GitHub username"
if (-not $username) { Write-Error "Username is required"; exit 1 }

Write-Host "Enter GitHub Personal Access Token (PAT). It will not be shown on screen." -ForegroundColor Yellow
$securePat = Read-Host -AsSecureString "Personal Access Token"
if (-not $securePat) { Write-Error "PAT is required"; exit 1 }
$pat = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePat))

# Save original remote URL
$origUrl = git remote get-url $remoteName 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to get remote '$remoteName'. Make sure you're in the git repo and remote exists."
    exit 1
}

# Build URL with credentials (URL-encode the token)
$encPat = UrlEncode($pat)
$pushUrl = "https://$username:$encPat@github.com/$repo"

Write-Host "Pushing branch '$branch' to $repo using HTTPS..." -ForegroundColor Cyan

# Run push
$pushCmd = "git push $pushUrl $branch"
try {
    $pushOutput = & git push $pushUrl $branch 2>&1
    $exit = $LASTEXITCODE
    Write-Host $pushOutput
} catch {
    Write-Error "Push failed: $_"
    $exit = 1
}

# Clear sensitive variable
$pat = $null
[GC]::Collect(); [GC]::WaitForPendingFinalizers()

if ($exit -eq 0) {
    Write-Host "Push succeeded." -ForegroundColor Green
} else {
    Write-Error "Push failed with exit code $exit"
}

exit $exit
