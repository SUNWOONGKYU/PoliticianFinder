################################################################################
# Deployment Verification Script (PowerShell)
# PoliticianFinder - Phase 5
################################################################################

param(
    [string]$Domain = "",
    [switch]$Help
)

# Configuration
$VERIFICATION_LOG = "verification-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
$Script:PassCount = 0
$Script:WarnCount = 0
$Script:FailCount = 0

################################################################################
# Helper Functions
################################################################################

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")

    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $color = switch ($Level) {
        "PASS" { "Green" }
        "WARN" { "Yellow" }
        "FAIL" { "Red" }
        default { "Cyan" }
    }

    $logMessage = "[$timestamp] [$Level] $Message"
    Write-Host $logMessage -ForegroundColor $color
    Add-Content -Path $VERIFICATION_LOG -Value $logMessage

    # Update counters
    switch ($Level) {
        "PASS" { $Script:PassCount++ }
        "WARN" { $Script:WarnCount++ }
        "FAIL" { $Script:FailCount++ }
    }
}

function Test-Command {
    param([string]$Command)
    return $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

function Show-Help {
    Write-Host @"
Deployment Verification Script

Usage:
    .\verify-deployment.ps1 [DOMAIN]
    .\verify-deployment.ps1 -Domain yourdomain.com
    .\verify-deployment.ps1 -Help

Examples:
    .\verify-deployment.ps1 politicianfinder.com
    .\verify-deployment.ps1

"@ -ForegroundColor Cyan
    exit 0
}

################################################################################
# Verification Tests
################################################################################

function Test-DnsResolution {
    Write-Log "Testing DNS resolution..." "INFO"

    if ([string]::IsNullOrEmpty($Domain)) {
        Write-Log "No domain provided, skipping DNS tests" "WARN"
        return
    }

    try {
        $dnsResult = Resolve-DnsName -Name $Domain -Type A -ErrorAction Stop
        if ($dnsResult) {
            $ip = $dnsResult.IPAddress
            Write-Log "DNS resolution successful: $Domain → $ip" "PASS"
        }
    } catch {
        Write-Log "DNS resolution failed for $Domain" "FAIL"
    }

    # Check WWW
    try {
        $wwwResult = Resolve-DnsName -Name "www.$Domain" -ErrorAction Stop
        if ($wwwResult) {
            Write-Log "WWW subdomain resolves: www.$Domain" "PASS"
        }
    } catch {
        Write-Log "WWW subdomain not configured" "WARN"
    }
}

function Test-HttpsRedirect {
    Write-Log "Testing HTTPS redirect..." "INFO"

    if ([string]::IsNullOrEmpty($Domain)) {
        Write-Log "No domain provided, skipping HTTPS redirect test" "WARN"
        return
    }

    try {
        $response = Invoke-WebRequest -Uri "http://$Domain" -MaximumRedirection 0 -ErrorAction SilentlyContinue
        $location = $response.Headers.Location

        if ($location -and $location.StartsWith("https://")) {
            Write-Log "HTTP redirects to HTTPS: $location" "PASS"
        } else {
            Write-Log "HTTP does not redirect to HTTPS" "FAIL"
        }
    } catch {
        if ($_.Exception.Response.Headers.Location -and $_.Exception.Response.Headers.Location.AbsoluteUri.StartsWith("https://")) {
            Write-Log "HTTP redirects to HTTPS" "PASS"
        } else {
            Write-Log "Could not verify HTTPS redirect" "WARN"
        }
    }
}

function Test-SslCertificate {
    Write-Log "Testing SSL certificate..." "INFO"

    if ([string]::IsNullOrEmpty($Domain)) {
        Write-Log "No domain provided, skipping SSL tests" "WARN"
        return
    }

    try {
        $req = [Net.HttpWebRequest]::Create("https://$Domain")
        $req.Timeout = 10000
        $req.AllowAutoRedirect = $false

        try {
            $response = $req.GetResponse()
            $cert = $req.ServicePoint.Certificate

            if ($cert) {
                Write-Log "SSL certificate is valid" "PASS"

                $expiry = [DateTime]::Parse($cert.GetExpirationDateString())
                $daysLeft = ($expiry - (Get-Date)).Days

                if ($daysLeft -gt 30) {
                    Write-Log "Certificate expires in $daysLeft days" "PASS"
                } else {
                    Write-Log "Certificate expires soon: $daysLeft days" "WARN"
                }
            } else {
                Write-Log "SSL certificate not found" "FAIL"
            }

            $response.Close()
        } catch {
            Write-Log "SSL certificate validation failed" "FAIL"
        }
    } catch {
        Write-Log "Could not connect to verify SSL" "FAIL"
    }
}

function Test-SecurityHeaders {
    Write-Log "Testing security headers..." "INFO"

    if ([string]::IsNullOrEmpty($Domain)) {
        Write-Log "No domain provided, skipping security header tests" "WARN"
        return
    }

    try {
        $response = Invoke-WebRequest -Uri "https://$Domain" -Method Head -ErrorAction Stop

        $requiredHeaders = @(
            "X-Content-Type-Options",
            "X-Frame-Options",
            "X-XSS-Protection",
            "Referrer-Policy"
        )

        foreach ($header in $requiredHeaders) {
            if ($response.Headers[$header]) {
                Write-Log "Security header present: $header" "PASS"
            } else {
                Write-Log "Security header missing: $header" "WARN"
            }
        }

        if ($response.Headers["Strict-Transport-Security"]) {
            Write-Log "HSTS header present" "PASS"
        } else {
            Write-Log "HSTS header missing" "WARN"
        }
    } catch {
        Write-Log "Could not retrieve headers: $_" "FAIL"
    }
}

function Test-ApplicationResponse {
    Write-Log "Testing application response..." "INFO"

    if ([string]::IsNullOrEmpty($Domain)) {
        Write-Log "No domain provided, skipping application tests" "WARN"
        return
    }

    try {
        $sw = [System.Diagnostics.Stopwatch]::StartNew()
        $response = Invoke-WebRequest -Uri "https://$Domain" -ErrorAction Stop
        $sw.Stop()

        $statusCode = [int]$response.StatusCode
        $loadTime = $sw.Elapsed.TotalSeconds

        if ($statusCode -eq 200) {
            Write-Log "Homepage returns 200 OK" "PASS"

            if ($loadTime -lt 3.0) {
                Write-Log "Homepage loads in $([math]::Round($loadTime, 2))s (< 3s)" "PASS"
            } else {
                Write-Log "Homepage loads slowly: $([math]::Round($loadTime, 2))s" "WARN"
            }
        } else {
            Write-Log "Homepage returns HTTP $statusCode" "FAIL"
        }

        # Check for errors in content
        $content = $response.Content
        if ($content -match "500|error|Error") {
            Write-Log "Possible errors found in page content" "WARN"
        } else {
            Write-Log "No obvious errors in page content" "PASS"
        }
    } catch {
        Write-Log "Could not access homepage: $_" "FAIL"
    }
}

function Test-Content {
    Write-Log "Testing page content..." "INFO"

    if ([string]::IsNullOrEmpty($Domain)) {
        Write-Log "No domain provided, skipping content tests" "WARN"
        return
    }

    try {
        $response = Invoke-WebRequest -Uri "https://$Domain" -ErrorAction Stop
        $content = $response.Content

        # Check for expected content
        if ($content -match "PoliticianFinder|politician") {
            Write-Log "Page contains expected content" "PASS"
        } else {
            Write-Log "Page may not contain expected content" "WARN"
        }

        # Check for Next.js indicators
        if ($content -match "_next") {
            Write-Log "Next.js application detected" "PASS"
        } else {
            Write-Log "Next.js indicators not found" "WARN"
        }

        # Check for meta tags
        if ($content -match "<meta") {
            Write-Log "Meta tags present" "PASS"
        } else {
            Write-Log "Meta tags missing" "WARN"
        }
    } catch {
        Write-Log "Could not retrieve content" "FAIL"
    }
}

function Test-Performance {
    Write-Log "Testing performance metrics..." "INFO"

    if ([string]::IsNullOrEmpty($Domain)) {
        Write-Log "No domain provided, skipping performance tests" "WARN"
        return
    }

    try {
        $sw = [System.Diagnostics.Stopwatch]::StartNew()
        $response = Invoke-WebRequest -Uri "https://$Domain" -ErrorAction Stop
        $sw.Stop()

        $responseTime = $sw.Elapsed.TotalSeconds

        if ($responseTime -lt 1.0) {
            Write-Log "Excellent response time: $([math]::Round($responseTime, 2))s" "PASS"
        } elseif ($responseTime -lt 3.0) {
            Write-Log "Good response time: $([math]::Round($responseTime, 2))s" "PASS"
        } else {
            Write-Log "Slow response time: $([math]::Round($responseTime, 2))s" "WARN"
        }

        # Check compression
        if ($response.Headers["Content-Encoding"] -match "gzip|br") {
            Write-Log "Content compression enabled" "PASS"
        } else {
            Write-Log "Content compression not detected" "WARN"
        }
    } catch {
        Write-Log "Could not test performance" "FAIL"
    }
}

function Test-MobileResponse {
    Write-Log "Testing mobile user-agent..." "INFO"

    if ([string]::IsNullOrEmpty($Domain)) {
        Write-Log "No domain provided, skipping mobile tests" "WARN"
        return
    }

    try {
        $userAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15"
        $response = Invoke-WebRequest -Uri "https://$Domain" -UserAgent $userAgent -ErrorAction Stop

        if ($response.StatusCode -eq 200) {
            Write-Log "Mobile user-agent returns 200 OK" "PASS"
        } else {
            Write-Log "Mobile user-agent returns HTTP $($response.StatusCode)" "FAIL"
        }
    } catch {
        Write-Log "Mobile user-agent test failed" "FAIL"
    }
}

function Test-VercelDeployment {
    Write-Log "Checking Vercel deployment..." "INFO"

    if (-not (Test-Command "vercel")) {
        Write-Log "Vercel CLI not installed, skipping Vercel checks" "WARN"
        return
    }

    if (-not (Test-Path "frontend")) {
        Write-Log "Not in project root, skipping Vercel checks" "WARN"
        return
    }

    Push-Location frontend

    try {
        $deployments = vercel ls --prod 2>$null
        if ($deployments) {
            Write-Log "Vercel production deployment found" "PASS"
        } else {
            Write-Log "Could not verify Vercel deployment" "WARN"
        }
    } catch {
        Write-Log "Vercel check failed" "WARN"
    }

    Pop-Location
}

function Test-EnvironmentVariables {
    Write-Log "Checking environment variables..." "INFO"

    if (-not (Test-Path "frontend")) {
        Write-Log "Frontend directory not found, skipping env check" "WARN"
        return
    }

    Push-Location frontend

    if (Test-Path ".env.example") {
        Write-Log ".env.example file exists" "PASS"

        $exampleContent = Get-Content ".env.example" -Raw

        $requiredVars = @(
            "NEXT_PUBLIC_SUPABASE_URL",
            "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        )

        foreach ($var in $requiredVars) {
            if ($exampleContent -match $var) {
                Write-Log "Required variable documented: $var" "PASS"
            } else {
                Write-Log "Required variable not in example: $var" "WARN"
            }
        }
    } else {
        Write-Log ".env.example file not found" "WARN"
    }

    Pop-Location
}

################################################################################
# Summary
################################################################################

function Show-Summary {
    Write-Host ""
    Write-Host "========================================================================" -ForegroundColor Cyan
    Write-Host "Deployment Verification Summary" -ForegroundColor Cyan
    Write-Host "========================================================================" -ForegroundColor Cyan
    Write-Host "Domain: $(if ($Domain) { $Domain } else { 'Not provided' })"
    Write-Host "Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    Write-Host ""
    Write-Host "Log file: $VERIFICATION_LOG"
    Write-Host ""
    Write-Host "Results:"
    Write-Host "  Passed: $Script:PassCount" -ForegroundColor Green
    Write-Host "  Warnings: $Script:WarnCount" -ForegroundColor Yellow
    Write-Host "  Failed: $Script:FailCount" -ForegroundColor Red
    Write-Host ""

    if ($Script:FailCount -eq 0 -and $Script:WarnCount -eq 0) {
        Write-Host "✓ All checks passed!" -ForegroundColor Green
        Write-Host "Your deployment is working perfectly."
    } elseif ($Script:FailCount -eq 0) {
        Write-Host "⚠ Deployment working with warnings" -ForegroundColor Yellow
        Write-Host "Review warnings and fix if necessary."
    } else {
        Write-Host "✗ Deployment has issues" -ForegroundColor Red
        Write-Host "Review failed checks and fix issues."
    }

    Write-Host "========================================================================" -ForegroundColor Cyan
}

################################################################################
# Main
################################################################################

function Main {
    if ($Help) {
        Show-Help
    }

    Write-Host ""
    Write-Host "========================================================================" -ForegroundColor Cyan
    Write-Host "PoliticianFinder - Deployment Verification" -ForegroundColor Cyan
    Write-Host "========================================================================" -ForegroundColor Cyan
    Write-Host ""

    if ([string]::IsNullOrEmpty($Domain)) {
        Write-Log "No domain provided. Running basic checks only." "INFO"
        Write-Host "Usage: .\verify-deployment.ps1 <domain>" -ForegroundColor Yellow
        Write-Host ""
    }

    Write-Log "Starting verification tests..." "INFO"
    Write-Log "Logging to: $VERIFICATION_LOG" "INFO"
    Write-Host ""

    # Run all tests
    Test-DnsResolution
    Write-Host ""
    Test-HttpsRedirect
    Write-Host ""
    Test-SslCertificate
    Write-Host ""
    Test-SecurityHeaders
    Write-Host ""
    Test-ApplicationResponse
    Write-Host ""
    Test-Content
    Write-Host ""
    Test-Performance
    Write-Host ""
    Test-MobileResponse
    Write-Host ""
    Test-VercelDeployment
    Write-Host ""
    Test-EnvironmentVariables
    Write-Host ""

    # Show summary
    Show-Summary
}

# Run main function
Main
