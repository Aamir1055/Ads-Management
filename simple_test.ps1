# Simple PowerShell script to test campaign types creation
Write-Host "🚀 Testing Campaign Types Creation" -ForegroundColor Green

# Step 1: Login
Write-Host "`n📝 Step 1: Logging in..." -ForegroundColor Yellow
$loginBody = @{
    username = "admin"
    password = "password"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$token = $loginResponse.token
Write-Host "✅ Login successful" -ForegroundColor Green

# Step 2: Test POST /campaign-types
Write-Host "`n📝 Step 2: Testing POST /api/campaign-types..." -ForegroundColor Yellow
Write-Host "⚠️ Watch the backend console for debug logs now..." -ForegroundColor Magenta

$testData = @{
    name = "Test Campaign Type $(Get-Date -Format 'HHmmss')"
    description = "Test campaign type"
    is_active = $true
} | ConvertTo-Json

$headers = @{
    Authorization = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/campaign-types" -Method POST -Body $testData -Headers $headers
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host $($response | ConvertTo-Json)
} catch {
    Write-Host "❌ Failed!" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $responseBody = $reader.ReadToEnd()
    Write-Host "Response: $responseBody" -ForegroundColor Red
}
