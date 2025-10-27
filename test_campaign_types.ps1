# PowerShell script to test campaign types creation
Write-Host "🚀 Testing Campaign Types Creation with Debug Logging" -ForegroundColor Green
Write-Host "=" * 60

try {
    # Step 1: Login
    Write-Host "`n📝 Step 1: Logging in as admin..." -ForegroundColor Yellow
    $loginBody = @{
        username = "admin"
        password = "password"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    Write-Host "✅ Login successful, token received" -ForegroundColor Green
    Write-Host "   Token preview: $($token.Substring(0, 30))..." -ForegroundColor Gray

    # Step 2: Test GET (should work)
    Write-Host "`n📝 Step 2: Testing GET /api/campaign-types..." -ForegroundColor Yellow
    $headers = @{ Authorization = "Bearer $token" }
    
    # Try GET request
    try {
        $getResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/campaign-types" -Method GET -Headers $headers
        Write-Host "✅ GET request successful, existing campaign types: $($getResponse.data.Count)" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  GET request failed: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "   But continuing with POST test anyway..." -ForegroundColor Gray
    }

    # Step 3: Test POST (the problematic request)
    Write-Host "`n📝 Step 3: Testing POST /api/campaign-types..." -ForegroundColor Yellow
    Write-Host "   This request should trigger extensive debug logging in the backend" -ForegroundColor Gray

    $testCampaignType = @{
        name = "Debug Test Campaign Type $(Get-Date -Format 'yyyyMMdd-HHmmss')"
        description = "This is a test campaign type for debugging purposes"
        is_active = $true
    } | ConvertTo-Json

    Write-Host "   Request data: $testCampaignType" -ForegroundColor Gray
    Write-Host "`n⚠️  Watch the backend console for detailed debug logs now...`n" -ForegroundColor Magenta

    $headers["Content-Type"] = "application/json"
    $createResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/campaign-types" -Method POST -Body $testCampaignType -Headers $headers

    Write-Host "✅ POST request successful!" -ForegroundColor Green
    Write-Host "   Response: $($createResponse | ConvertTo-Json)" -ForegroundColor Gray

} catch {
    Write-Host "`n❌ Error occurred:" -ForegroundColor Red
    Write-Host "   Exception: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
        Write-Host "   Response Body: $responseBody" -ForegroundColor Red
        
        if ($_.Exception.Response.StatusCode -eq "Forbidden") {
            Write-Host "`n🔍 403 Forbidden Error Analysis:" -ForegroundColor Yellow
            Write-Host "   - This suggests the request reached the server but was denied" -ForegroundColor Gray
            Write-Host "   - Check if the requireSuperAdmin middleware logs appeared in backend console" -ForegroundColor Gray
            Write-Host "   - Verify the user authentication and role assignment" -ForegroundColor Gray
        }
    }
}
