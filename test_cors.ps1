# CORS Testing Script for PoliticianFinder (PowerShell)
# This script tests various CORS scenarios to ensure proper configuration

param(
    [string]$ApiUrl = "http://localhost:8000",
    [string]$FrontendUrl = "http://localhost:3000"
)

# Configuration
$ErrorActionPreference = "Continue"
$TotalTests = 0
$PassedTests = 0
$FailedTests = 0

# Colors
function Write-TestHeader {
    param([string]$Message)
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "  $Message" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
}

function Write-TestSection {
    param([string]$Message)
    Write-Host "`n=== $Message ===" -ForegroundColor Yellow
}

function Write-TestResult {
    param(
        [string]$TestName,
        [bool]$Passed,
        [string]$Details = ""
    )

    $script:TotalTests++

    Write-Host "Test $script:TotalTests`: " -NoNewline -ForegroundColor Blue
    Write-Host "$TestName" -ForegroundColor White

    if ($Passed) {
        Write-Host "  ✓ PASSED" -ForegroundColor Green
        $script:PassedTests++
    } else {
        Write-Host "  ✗ FAILED" -ForegroundColor Red
        $script:FailedTests++
        if ($Details) {
            Write-Host "  Details: $Details" -ForegroundColor Yellow
        }
    }
}

# Test helper function
function Test-CorsEndpoint {
    param(
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [string]$ExpectedHeader = "",
        [string]$ExpectedValue = "",
        [int]$ExpectedStatusCode = 200
    )

    try {
        $response = Invoke-WebRequest -Uri $Url -Method $Method -Headers $Headers -UseBasicParsing -ErrorAction Stop

        # Check status code
        if ($ExpectedStatusCode -and $response.StatusCode -ne $ExpectedStatusCode) {
            return @{
                Success = $false
                Details = "Expected status $ExpectedStatusCode, got $($response.StatusCode)"
            }
        }

        # Check for expected header
        if ($ExpectedHeader) {
            $headerValue = $response.Headers[$ExpectedHeader]
            if (-not $headerValue) {
                return @{
                    Success = $false
                    Details = "Header '$ExpectedHeader' not found"
                }
            }

            if ($ExpectedValue -and $headerValue -notmatch $ExpectedValue) {
                return @{
                    Success = $false
                    Details = "Header '$ExpectedHeader' value '$headerValue' does not match expected '$ExpectedValue'"
                }
            }
        }

        return @{
            Success = $true
            Details = ""
        }
    }
    catch {
        # For tests expecting failure
        if ($ExpectedStatusCode -eq 403 -and $_.Exception.Response.StatusCode -eq 403) {
            return @{
                Success = $true
                Details = ""
            }
        }

        return @{
            Success = $false
            Details = $_.Exception.Message
        }
    }
}

# Start testing
Write-TestHeader "CORS Configuration Testing Suite"
Write-Host "`nAPI URL: $ApiUrl" -ForegroundColor Yellow
Write-Host "Frontend URL: $FrontendUrl`n" -ForegroundColor Yellow

# Test 1: Basic Connectivity
Write-TestSection "Basic Connectivity Tests"

$result = Test-CorsEndpoint -Url "$ApiUrl/health"
Write-TestResult "Health check without origin" $result.Success $result.Details

$result = Test-CorsEndpoint -Url "$ApiUrl/health" -Headers @{"Origin" = $FrontendUrl} -ExpectedHeader "Access-Control-Allow-Origin"
Write-TestResult "Health check with allowed origin" $result.Success $result.Details

# Test 2: CORS Security
Write-TestSection "CORS Security Tests"

try {
    $response = Invoke-WebRequest -Uri "$ApiUrl/api/v1/politicians" -Method OPTIONS -Headers @{"Origin" = "https://malicious-site.com"} -UseBasicParsing -ErrorAction Stop
    Write-TestResult "Blocked origin returns 403" $false "Expected 403, got $($response.StatusCode)"
}
catch {
    $passed = $_.Exception.Response.StatusCode -eq 403
    Write-TestResult "Blocked origin returns 403" $passed
}

$result = Test-CorsEndpoint -Url "$ApiUrl/api/v1/politicians" -Method "OPTIONS" -Headers @{
    "Origin" = $FrontendUrl
    "Access-Control-Request-Method" = "POST"
} -ExpectedHeader "Access-Control-Allow-Origin"
Write-TestResult "Preflight with allowed origin" $result.Success $result.Details

# Test 3: CORS Headers
Write-TestSection "CORS Headers Tests"

$result = Test-CorsEndpoint -Url "$ApiUrl/api/v1/politicians" -Method "OPTIONS" -Headers @{"Origin" = $FrontendUrl} -ExpectedHeader "Access-Control-Allow-Methods"
Write-TestResult "Preflight includes allowed methods" $result.Success $result.Details

$result = Test-CorsEndpoint -Url "$ApiUrl/api/v1/politicians" -Method "OPTIONS" -Headers @{"Origin" = $FrontendUrl} -ExpectedHeader "Access-Control-Allow-Headers"
Write-TestResult "Preflight includes allowed headers" $result.Success $result.Details

$result = Test-CorsEndpoint -Url "$ApiUrl/api/v1/politicians" -Method "OPTIONS" -Headers @{"Origin" = $FrontendUrl} -ExpectedHeader "Access-Control-Max-Age"
Write-TestResult "Preflight includes max-age" $result.Success $result.Details

# Test 4: Credentials
Write-TestSection "Credentials Tests"

$result = Test-CorsEndpoint -Url "$ApiUrl/health" -Headers @{"Origin" = $FrontendUrl} -ExpectedHeader "Access-Control-Allow-Credentials" -ExpectedValue "true"
Write-TestResult "Credentials enabled in response" $result.Success $result.Details

# Test 5: Security Headers
Write-TestSection "Security Headers Tests"

$result = Test-CorsEndpoint -Url "$ApiUrl/health" -ExpectedHeader "X-Frame-Options"
Write-TestResult "X-Frame-Options header present" $result.Success $result.Details

$result = Test-CorsEndpoint -Url "$ApiUrl/health" -ExpectedHeader "X-Content-Type-Options"
Write-TestResult "X-Content-Type-Options header present" $result.Success $result.Details

$result = Test-CorsEndpoint -Url "$ApiUrl/health" -ExpectedHeader "X-XSS-Protection"
Write-TestResult "X-XSS-Protection header present" $result.Success $result.Details

$result = Test-CorsEndpoint -Url "$ApiUrl/health" -ExpectedHeader "Referrer-Policy"
Write-TestResult "Referrer-Policy header present" $result.Success $result.Details

# Test 6: Wildcard Prevention
Write-TestSection "Wildcard Prevention Tests"

try {
    $response = Invoke-WebRequest -Uri "$ApiUrl/health" -Headers @{"Origin" = $FrontendUrl} -UseBasicParsing -ErrorAction Stop
    $allowOrigin = $response.Headers["Access-Control-Allow-Origin"]
    $passed = $allowOrigin -ne "*"
    Write-TestResult "No wildcard origin with credentials" $passed $(if (-not $passed) { "Found wildcard: $allowOrigin" } else { "" })
}
catch {
    Write-TestResult "No wildcard origin with credentials" $false $_.Exception.Message
}

# Test 7: Null Origin
Write-TestSection "Null Origin Tests"

try {
    $response = Invoke-WebRequest -Uri "$ApiUrl/api/v1/politicians" -Method OPTIONS -Headers @{"Origin" = "null"} -UseBasicParsing -ErrorAction Stop
    Write-TestResult "Null origin rejected" $false "Expected 403, got $($response.StatusCode)"
}
catch {
    $passed = $_.Exception.Response.StatusCode -eq 403
    Write-TestResult "Null origin rejected" $passed
}

# Test 8: HTTP Methods
Write-TestSection "HTTP Methods Tests"

$result = Test-CorsEndpoint -Url "$ApiUrl/health" -Headers @{"Origin" = $FrontendUrl} -ExpectedHeader "Access-Control-Allow-Origin"
Write-TestResult "GET request with CORS" $result.Success $result.Details

$result = Test-CorsEndpoint -Url "$ApiUrl/api/v1/politicians" -Method "OPTIONS" -Headers @{
    "Origin" = $FrontendUrl
    "Access-Control-Request-Method" = "POST"
}
Write-TestResult "POST preflight" $result.Success $result.Details

$result = Test-CorsEndpoint -Url "$ApiUrl/api/v1/politicians/1" -Method "OPTIONS" -Headers @{
    "Origin" = $FrontendUrl
    "Access-Control-Request-Method" = "PUT"
}
Write-TestResult "PUT preflight" $result.Success $result.Details

$result = Test-CorsEndpoint -Url "$ApiUrl/api/v1/politicians/1" -Method "OPTIONS" -Headers @{
    "Origin" = $FrontendUrl
    "Access-Control-Request-Method" = "DELETE"
}
Write-TestResult "DELETE preflight" $result.Success $result.Details

# Test 9: Complex Headers
Write-TestSection "Complex Headers Tests"

$result = Test-CorsEndpoint -Url "$ApiUrl/api/v1/politicians" -Method "OPTIONS" -Headers @{
    "Origin" = $FrontendUrl
    "Access-Control-Request-Headers" = "Authorization"
} -ExpectedHeader "Access-Control-Allow-Headers"
Write-TestResult "Authorization header allowed" $result.Success $result.Details

$result = Test-CorsEndpoint -Url "$ApiUrl/api/v1/politicians" -Method "OPTIONS" -Headers @{
    "Origin" = $FrontendUrl
    "Access-Control-Request-Headers" = "Content-Type"
} -ExpectedHeader "Access-Control-Allow-Headers"
Write-TestResult "Content-Type header allowed" $result.Success $result.Details

# Test 10: Exposed Headers
Write-TestSection "Exposed Headers Tests"

$result = Test-CorsEndpoint -Url "$ApiUrl/health" -Headers @{"Origin" = $FrontendUrl} -ExpectedHeader "Access-Control-Expose-Headers"
Write-TestResult "Expose headers present" $result.Success $result.Details

# Summary
Write-TestHeader "Test Summary"
Write-Host "Total Tests: $TotalTests" -ForegroundColor White
Write-Host "Passed: $PassedTests" -ForegroundColor Green
Write-Host "Failed: $FailedTests" -ForegroundColor Red

if ($FailedTests -eq 0) {
    Write-Host "`nAll tests passed! ✓`n" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`nSome tests failed. Please review the output above.`n" -ForegroundColor Red
    exit 1
}
