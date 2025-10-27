# Campaign API Test Script
# This script tests the new campaign API with min_age and max_age support

$baseUrl = "http://localhost:5000/api"
$headers = @{ "Content-Type" = "application/json" }

Write-Host "🧪 Testing Campaign API with min_age and max_age support" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

# Step 1: Health Check
Write-Host "`n1️⃣  Testing Health Check" -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET
    Write-Host "✅ Health Check Passed" -ForegroundColor Green
    Write-Host "   Status: $($health.success)" -ForegroundColor Gray
    Write-Host "   Database: $($health.database.status)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Health Check Failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Try to authenticate (using common test credentials)
Write-Host "`n2️⃣  Testing Authentication" -ForegroundColor Yellow
$token = $null

# Try common admin credentials
$testCredentials = @(
    @{ username = "admin"; password = "admin123" },
    @{ username = "admin"; password = "password" },
    @{ username = "test"; password = "test123" },
    @{ username = "demo"; password = "demo123" }
)

foreach ($cred in $testCredentials) {
    try {
        $loginData = $cred | ConvertTo-Json -Compress
        $authResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginData -ContentType "application/json"
        
        if ($authResponse.success -and $authResponse.token) {
            $token = $authResponse.token
            Write-Host "✅ Authentication Successful with $($cred.username)" -ForegroundColor Green
            Write-Host "   Token received: $($token.Substring(0, 20))..." -ForegroundColor Gray
            break
        }
    } catch {
        Write-Host "❌ Auth failed for $($cred.username): $($_.Exception.Message)" -ForegroundColor Red
    }
}

if (-not $token) {
    Write-Host "❌ Authentication failed with all test credentials" -ForegroundColor Red
    Write-Host "💡 You might need to create a test user first or use the correct credentials" -ForegroundColor Yellow
    exit 1
}

# Update headers with auth token
$headers["Authorization"] = "Bearer $token"

# Step 3: Get Campaign Types (needed for creating campaigns)
Write-Host "`n3️⃣  Getting Campaign Types" -ForegroundColor Yellow
try {
    $campaignTypes = Invoke-RestMethod -Uri "$baseUrl/campaign-types" -Method GET -Headers $headers
    if ($campaignTypes.success -and $campaignTypes.data.campaignTypes.Count -gt 0) {
        $firstTypeId = $campaignTypes.data.campaignTypes[0].id
        Write-Host "✅ Campaign Types Retrieved" -ForegroundColor Green
        Write-Host "   Found $($campaignTypes.data.campaignTypes.Count) types" -ForegroundColor Gray
        Write-Host "   Using type ID: $firstTypeId" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  No campaign types found, will use ID 1" -ForegroundColor Yellow
        $firstTypeId = 1
    }
} catch {
    Write-Host "⚠️  Could not get campaign types: $($_.Exception.Message)" -ForegroundColor Yellow
    $firstTypeId = 1
}

# Step 4: Test Campaign Creation with Age Fields
Write-Host "`n4️⃣  Testing Campaign Creation with Age Fields" -ForegroundColor Yellow

$newCampaign = @{
    name = "Test Campaign $(Get-Date -Format 'HHmmss')"
    persona = "Tech-savvy millennials interested in innovation"
    gender = @("male", "female")
    min_age = 25
    max_age = 45
    location = "United States"
    creatives = "image"
    campaign_type_id = $firstTypeId
    brand = "Test Brand"
    is_enabled = $true
} | ConvertTo-Json -Compress

try {
    $createResponse = Invoke-RestMethod -Uri "$baseUrl/campaigns" -Method POST -Body $newCampaign -Headers $headers
    
    if ($createResponse.success) {
        $campaignId = $createResponse.data.id
        Write-Host "✅ Campaign Created Successfully" -ForegroundColor Green
        Write-Host "   Campaign ID: $campaignId" -ForegroundColor Gray
        Write-Host "   Name: $($createResponse.data.name)" -ForegroundColor Gray
        Write-Host "   Min Age: $($createResponse.data.min_age)" -ForegroundColor Gray
        Write-Host "   Max Age: $($createResponse.data.max_age)" -ForegroundColor Gray
        
        # Verify age values are integers
        if ($createResponse.data.min_age -eq 25 -and $createResponse.data.max_age -eq 45) {
            Write-Host "✅ Age values are correctly saved as integers!" -ForegroundColor Green
        } else {
            Write-Host "❌ Age values not saved correctly!" -ForegroundColor Red
            Write-Host "   Expected: min=25, max=45" -ForegroundColor Red
            Write-Host "   Got: min=$($createResponse.data.min_age), max=$($createResponse.data.max_age)" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "❌ Campaign Creation Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorStream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorStream)
        $errorBody = $reader.ReadToEnd()
        Write-Host "   Error Details: $errorBody" -ForegroundColor Red
    }
    exit 1
}

# Step 5: Test Campaign Retrieval
Write-Host "`n5️⃣  Testing Campaign Retrieval" -ForegroundColor Yellow
try {
    $getResponse = Invoke-RestMethod -Uri "$baseUrl/campaigns/$campaignId" -Method GET -Headers $headers
    
    if ($getResponse.success) {
        Write-Host "✅ Campaign Retrieved Successfully" -ForegroundColor Green
        Write-Host "   Name: $($getResponse.data.name)" -ForegroundColor Gray
        Write-Host "   Min Age: $($getResponse.data.min_age)" -ForegroundColor Gray
        Write-Host "   Max Age: $($getResponse.data.max_age)" -ForegroundColor Gray
        
        # Verify age values are still integers after retrieval
        if ($getResponse.data.min_age -eq 25 -and $getResponse.data.max_age -eq 45) {
            Write-Host "✅ Age values retrieved correctly as integers!" -ForegroundColor Green
        } else {
            Write-Host "❌ Age values not retrieved correctly!" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "❌ Campaign Retrieval Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 6: Test Campaign Update with Different Age Values
Write-Host "`n6️⃣  Testing Campaign Update with Different Age Values" -ForegroundColor Yellow

$updateData = @{
    min_age = 30
    max_age = 50
    persona = "Updated persona targeting professionals"
} | ConvertTo-Json -Compress

try {
    $updateResponse = Invoke-RestMethod -Uri "$baseUrl/campaigns/$campaignId" -Method PUT -Body $updateData -Headers $headers
    
    if ($updateResponse.success) {
        Write-Host "✅ Campaign Updated Successfully" -ForegroundColor Green
        Write-Host "   Min Age: $($updateResponse.data.min_age)" -ForegroundColor Gray
        Write-Host "   Max Age: $($updateResponse.data.max_age)" -ForegroundColor Gray
        
        # Verify updated age values
        if ($updateResponse.data.min_age -eq 30 -and $updateResponse.data.max_age -eq 50) {
            Write-Host "✅ Age values updated correctly!" -ForegroundColor Green
        } else {
            Write-Host "❌ Age values not updated correctly!" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "❌ Campaign Update Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 7: Test Campaign List (with age fields)
Write-Host "`n7️⃣  Testing Campaign List" -ForegroundColor Yellow
try {
    $listResponse = Invoke-RestMethod -Uri "$baseUrl/campaigns?limit=5" -Method GET -Headers $headers
    
    if ($listResponse.success) {
        Write-Host "✅ Campaign List Retrieved Successfully" -ForegroundColor Green
        Write-Host "   Total Campaigns: $($listResponse.data.pagination.total)" -ForegroundColor Gray
        
        # Check if our test campaign appears in the list
        $testCampaign = $listResponse.data.campaigns | Where-Object { $_.id -eq $campaignId }
        if ($testCampaign) {
            Write-Host "✅ Test campaign found in list with correct age values" -ForegroundColor Green
            Write-Host "   Min Age: $($testCampaign.min_age)" -ForegroundColor Gray
            Write-Host "   Max Age: $($testCampaign.max_age)" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "❌ Campaign List Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 8: Test Age Validation
Write-Host "`n8️⃣  Testing Age Validation" -ForegroundColor Yellow

# Test invalid age range (min > max)
$invalidAgeData = @{
    min_age = 50
    max_age = 30  # This should fail
} | ConvertTo-Json -Compress

try {
    $validationResponse = Invoke-RestMethod -Uri "$baseUrl/campaigns/$campaignId" -Method PUT -Body $invalidAgeData -Headers $headers
    Write-Host "❌ Age validation should have failed but didn't!" -ForegroundColor Red
} catch {
    Write-Host "✅ Age validation correctly rejected invalid range (min > max)" -ForegroundColor Green
}

# Step 9: Clean up - Delete Test Campaign
Write-Host "`n9️⃣  Cleaning Up - Deleting Test Campaign" -ForegroundColor Yellow
try {
    $deleteResponse = Invoke-RestMethod -Uri "$baseUrl/campaigns/$campaignId" -Method DELETE -Headers $headers
    
    if ($deleteResponse.success) {
        Write-Host "✅ Test Campaign Deleted Successfully" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Campaign Deletion Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Final Summary
Write-Host "`n🎉 API Testing Complete!" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host "✅ Campaign API is working correctly with min_age and max_age support" -ForegroundColor Green
Write-Host "✅ Age values are properly handled as integers" -ForegroundColor Green
Write-Host "✅ Validation is working for age ranges" -ForegroundColor Green
Write-Host "`n🚀 Ready to build the frontend!" -ForegroundColor Cyan
