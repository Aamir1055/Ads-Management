param(
    [string]$remote_host = "65.20.84.140",
    [string]$remote_user = "deployer",
    [string]$remote_dir = "~/Ads-Management-Fresh",
    [string]$db_name = "ads_reporting",
    [string]$db_user = "deployer",
    [Parameter(Mandatory=$true)]
    [string]$db_password
)

# Function to run SQL file on remote server
function Execute-RemoteSQL {
    param(
        [string]$sqlFile,
}

try {
    # Step 1: Create a list of files to exclude from deployment
    $excludedFiles = @(
        '.git',
        'node_modules',
        '*.log',
        'deploy.ps1',
        '.env',
        '.env.*',
        'config/*.json',
        'package-lock.json',
        '.gitignore',
        '.vscode',
        'dist',
        'build',
        'tmp',
        '*.local',
        '*.development',
        '*.test'
    )

    # Step 2: Sync files to server
    Write-Host "Uploading files to server..." -ForegroundColor Yellow
    
    # Create the remote directory if it doesn't exist
    ssh "$remote_user@$remote_host" "mkdir -p $remote_dir"

    # Use filtered copy to server, excluding sensitive and environment-specific files
    Get-ChildItem -Exclude $excludedFiles | 
    Where-Object {
        $item = $_
        -not ($excludedFiles | Where-Object { $item.Name -like $_ })
    } | 
    ForEach-Object {
        Write-Host "Copying $($_.Name)..." -ForegroundColor Cyan
        scp -r $_.FullName "$remote_user@$remote_host:$remote_dir/"
    
    # Step 4: Restart the application
    Write-Host "Restarting application on server..." -ForegroundColor Yellow
    $remote_commands = @"
        cd $remote_dir
        pm2 reload all || pm2 restart all
        pm2 save
"@

    ssh "$remote_user@$remote_host" $remote_commands

    Write-Host "Deployment completed successfully!" -ForegroundColor Green

} catch {
    Write-Host "Deployment failed: $_" -ForegroundColor Red
    exit 1
}