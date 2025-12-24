# PowerShell Deployment Script for Ads Reporting Software
# Target Server: 77.42.45.79
# Note: This server also runs HRMS application

param(
    [switch]$BuildOnly,
    [switch]$UploadOnly,
    [switch]$DeployOnly,
    [switch]$FullDeploy
)

$ErrorActionPreference = "Stop"

# Configuration
$SERVER_IP = "77.42.45.79"
$SERVER_USER = "root"
$SERVER_PASSWORD = "Fasahaty@#786"
$APP_DIR = "/var/www/ads-reporting"
$LOCAL_PATH = $PSScriptRoot

Write-Host "=========================================="  -ForegroundColor Cyan
Write-Host "Ads Reporting Software - Deployment Tool" -ForegroundColor Cyan
Write-Host "Server: $SERVER_IP" -ForegroundColor Cyan
Write-Host "=========================================="  -ForegroundColor Cyan
Write-Host ""

# Function to build frontend
function Build-Frontend {
    Write-Host "Building frontend..." -ForegroundColor Yellow
    
    Push-Location "$LOCAL_PATH\frontend"
    
    try {
        # Check if node_modules exists, install if not
        if (-not (Test-Path "node_modules")) {
            Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
            npm install
        }
        
        # Build the frontend
        Write-Host "Running production build..." -ForegroundColor Yellow
        npm run build
        
        if (Test-Path "dist") {
            Write-Host "Frontend built successfully!" -ForegroundColor Green
        } else {
            throw "Build failed - dist folder not created"
        }
    }
    finally {
        Pop-Location
    }
}

# Function to create deployment package
function Create-DeploymentPackage {
    Write-Host "Creating deployment package..." -ForegroundColor Yellow
    
    $packagePath = "$LOCAL_PATH\deployment-package"
    
    # Clean and create package directory
    if (Test-Path $packagePath) {
        Remove-Item $packagePath -Recurse -Force
    }
    New-Item -ItemType Directory -Path $packagePath | Out-Null
    
    # Copy necessary files and folders
    Write-Host "Copying files..." -ForegroundColor Yellow
    
    # Backend files
    $backendFiles = @(
        "server.js",
        "app.js",
        "package.json",
        "package-lock.json",
        ".env.production",
        "ecosystem.config.production.js",
        "nginx-ads-reporting.conf",
        "deploy-to-production.sh"
    )
    
    foreach ($file in $backendFiles) {
        if (Test-Path "$LOCAL_PATH\$file") {
            Copy-Item "$LOCAL_PATH\$file" -Destination $packagePath -Force
            Write-Host "  Copied: $file" -ForegroundColor Gray
        }
    }
    
    # Backend folders
    $backendFolders = @(
        "routes",
        "controllers",
        "models",
        "middleware",
        "services",
        "utils",
        "config"
    )
    
    foreach ($folder in $backendFolders) {
        if (Test-Path "$LOCAL_PATH\$folder") {
            Copy-Item "$LOCAL_PATH\$folder" -Destination $packagePath -Recurse -Force
            Write-Host "  Copied folder: $folder" -ForegroundColor Gray
        }
    }
    
    # Frontend dist
    if (Test-Path "$LOCAL_PATH\frontend\dist") {
        New-Item -ItemType Directory -Path "$packagePath\frontend" -Force | Out-Null
        Copy-Item "$LOCAL_PATH\frontend\dist" -Destination "$packagePath\frontend" -Recurse -Force
        Write-Host "  Copied: frontend/dist" -ForegroundColor Gray
    } else {
        Write-Host "  Warning: frontend/dist not found. Run with -BuildOnly first." -ForegroundColor Red
    }
    
    # Create logs and uploads directories
    New-Item -ItemType Directory -Path "$packagePath\logs" -Force | Out-Null
    New-Item -ItemType Directory -Path "$packagePath\uploads" -Force | Out-Null
    
    Write-Host "Deployment package created at: $packagePath" -ForegroundColor Green
    return $packagePath
}

# Function to upload to server using SCP
function Upload-ToServer {
    param([string]$packagePath)
    
    Write-Host "Uploading to server..." -ForegroundColor Yellow
    Write-Host "Note: You'll need to install and configure SSH/SCP client" -ForegroundColor Yellow
    
    # Check if WinSCP or pscp is available
    $scpAvailable = $false
    
    if (Get-Command "pscp" -ErrorAction SilentlyContinue) {
        $scpAvailable = $true
        Write-Host "Using PSCP for file transfer..." -ForegroundColor Green
        
        # Create a temporary password file for pscp
        $pwFile = "$env:TEMP\pscp_pw.txt"
        $SERVER_PASSWORD | Out-File -FilePath $pwFile -Encoding ASCII
        
        try {
            # Upload the package
            pscp -r -pw $SERVER_PASSWORD "$packagePath\*" "${SERVER_USER}@${SERVER_IP}:${APP_DIR}/"
            Write-Host "Files uploaded successfully!" -ForegroundColor Green
        }
        finally {
            Remove-Item $pwFile -Force -ErrorAction SilentlyContinue
        }
    } else {
        Write-Host "SCP client not found. Please upload files manually:" -ForegroundColor Yellow
        Write-Host "1. Install WinSCP or PuTTY (includes pscp)" -ForegroundColor White
        Write-Host "2. Or use this command after installing:" -ForegroundColor White
        Write-Host "   pscp -r $packagePath\* ${SERVER_USER}@${SERVER_IP}:${APP_DIR}/" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Alternatively, use WinSCP GUI:" -ForegroundColor White
        Write-Host "   Host: $SERVER_IP" -ForegroundColor Cyan
        Write-Host "   User: $SERVER_USER" -ForegroundColor Cyan
        Write-Host "   Password: $SERVER_PASSWORD" -ForegroundColor Cyan
        Write-Host "   Upload to: $APP_DIR" -ForegroundColor Cyan
    }
}

# Function to execute commands on server
function Invoke-ServerCommand {
    param([string]$command)
    
    Write-Host "Executing on server: $command" -ForegroundColor Yellow
    
    # Check if plink (PuTTY) is available
    if (Get-Command "plink" -ErrorAction SilentlyContinue) {
        plink -ssh -batch -pw $SERVER_PASSWORD "${SERVER_USER}@${SERVER_IP}" $command
    } else {
        Write-Host "SSH client not found. Please run these commands manually:" -ForegroundColor Yellow
        Write-Host "SSH to: ssh ${SERVER_USER}@${SERVER_IP}" -ForegroundColor Cyan
        Write-Host "Then run: $command" -ForegroundColor Cyan
        Write-Host ""
        Read-Host "Press Enter when done to continue"
    }
}

# Function to deploy on server
function Deploy-OnServer {
    Write-Host "Deploying on server..." -ForegroundColor Yellow
    
    $deployScript = @"
cd $APP_DIR
chmod +x deploy-to-production.sh
bash deploy-to-production.sh remote
"@
    
    Invoke-ServerCommand $deployScript
}

# Main execution
try {
    if ($BuildOnly -or $FullDeploy) {
        Build-Frontend
    }
    
    if ($UploadOnly -or $FullDeploy) {
        $packagePath = Create-DeploymentPackage
        Upload-ToServer -packagePath $packagePath
    }
    
    if ($DeployOnly -or $FullDeploy) {
        Deploy-OnServer
    }
    
    if (-not ($BuildOnly -or $UploadOnly -or $DeployOnly -or $FullDeploy)) {
        Write-Host "Usage:" -ForegroundColor Yellow
        Write-Host "  .\deploy-production.ps1 -BuildOnly      # Build frontend only" -ForegroundColor White
        Write-Host "  .\deploy-production.ps1 -UploadOnly     # Create package and upload" -ForegroundColor White
        Write-Host "  .\deploy-production.ps1 -DeployOnly     # Deploy on server" -ForegroundColor White
        Write-Host "  .\deploy-production.ps1 -FullDeploy     # Do everything" -ForegroundColor White
        Write-Host ""
        Write-Host "Recommended steps:" -ForegroundColor Cyan
        Write-Host "1. First run: .\deploy-production.ps1 -BuildOnly" -ForegroundColor White
        Write-Host "2. Then run:  .\deploy-production.ps1 -FullDeploy" -ForegroundColor White
    }
    
    Write-Host ""
    Write-Host "=========================================="  -ForegroundColor Green
    Write-Host "Operation completed!" -ForegroundColor Green
    Write-Host "=========================================="  -ForegroundColor Green
    Write-Host ""
    Write-Host "Access your application at:" -ForegroundColor Cyan
    Write-Host "  Frontend: http://77.42.45.79:8080" -ForegroundColor White
    Write-Host "  Backend API: http://77.42.45.79:5000" -ForegroundColor White
    Write-Host ""
    Write-Host "HRMS remains on default ports (80/443)" -ForegroundColor Yellow
}
catch {
    Write-Host "Error occurred: $_" -ForegroundColor Red
    exit 1
}
