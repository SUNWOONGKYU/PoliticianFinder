# Run All Tests Script - Windows PowerShell Version
# P4T1, P4T2, P4T4

param(
    [switch]$SkipUnit,
    [switch]$SkipE2E,
    [switch]$SkipPerf
)

$ErrorActionPreference = "Continue"

# Configuration
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$FrontendDir = Join-Path $ProjectRoot "frontend"
$ResultsDir = Join-Path $ProjectRoot "test-results"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

Write-Host "======================================" -ForegroundColor Yellow
Write-Host "  PoliticianFinder - Test Suite" -ForegroundColor Yellow
Write-Host "======================================" -ForegroundColor Yellow
Write-Host ""

# Create results directory
New-Item -ItemType Directory -Force -Path $ResultsDir | Out-Null

# Track status
$UnitTestStatus = 0
$E2ETestStatus = 0
$PerfTestStatus = 0

# ===================================
# Unit Tests (P4T1)
# ===================================
if (-not $SkipUnit) {
    Write-Host ""
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host "  Running Unit Tests (Jest)" -ForegroundColor Cyan
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host ""

    Set-Location $FrontendDir

    npm run test:coverage
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Unit tests passed" -ForegroundColor Green
        $UnitTestStatus = 0
    } else {
        Write-Host "✗ Unit tests failed" -ForegroundColor Red
        $UnitTestStatus = 1
    }

    # Copy coverage report
    $CoverageDir = Join-Path $FrontendDir "coverage"
    if (Test-Path $CoverageDir) {
        $DestDir = Join-Path $ResultsDir "coverage-$Timestamp"
        Copy-Item -Recurse $CoverageDir $DestDir
        Write-Host "Coverage report saved to: $DestDir"
    }
}

# ===================================
# E2E Tests (P4T2)
# ===================================
if (-not $SkipE2E) {
    Write-Host ""
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host "  Running E2E Tests (Playwright)" -ForegroundColor Cyan
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host ""

    Set-Location $FrontendDir

    # Check if dev server is running
    $DevServerRunning = $false
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 2 -ErrorAction SilentlyContinue
        $DevServerRunning = $true
    } catch {
        Write-Host "Development server not running. Starting..."
        Start-Process -FilePath "npm" -ArgumentList "run", "dev" -NoNewWindow
        Write-Host "Waiting for server to start..."
        Start-Sleep -Seconds 10
    }

    # Run E2E tests
    npm run test:e2e
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ E2E tests passed" -ForegroundColor Green
        $E2ETestStatus = 0
    } else {
        Write-Host "✗ E2E tests failed" -ForegroundColor Red
        $E2ETestStatus = 1
    }

    # Copy E2E results
    $E2EReportDir = Join-Path $FrontendDir "playwright-report"
    if (Test-Path $E2EReportDir) {
        $DestDir = Join-Path $ResultsDir "e2e-report-$Timestamp"
        Copy-Item -Recurse $E2EReportDir $DestDir
        Write-Host "E2E report saved to: $DestDir"
    }
}

# ===================================
# Performance Tests (P4T4)
# ===================================
if (-not $SkipPerf) {
    Write-Host ""
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host "  Running Performance Tests (K6)" -ForegroundColor Cyan
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host ""

    $PerfDir = Join-Path $ProjectRoot "performance"
    Set-Location $PerfDir

    # Check if K6 is installed
    $K6Installed = Get-Command k6 -ErrorAction SilentlyContinue
    if (-not $K6Installed) {
        Write-Host "K6 not found. Skipping performance tests." -ForegroundColor Yellow
        Write-Host "Install K6: https://k6.io/docs/getting-started/installation"
        $PerfTestStatus = 2
    } else {
        # Run load test
        Write-Host "Running load test..."
        $OutputFile = Join-Path $ResultsDir "load-test-$Timestamp.json"
        k6 run --out "json=$OutputFile" k6-load-test.js

        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Load test passed" -ForegroundColor Green
            $PerfTestStatus = 0
        } else {
            Write-Host "✗ Load test failed" -ForegroundColor Red
            $PerfTestStatus = 1
        }
    }
}

# ===================================
# Generate Summary Report
# ===================================
Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  Test Summary" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$ReportFile = Join-Path $ResultsDir "test-summary-$Timestamp.txt"

$ReportContent = @"
====================================
  PoliticianFinder Test Summary
====================================

Timestamp: $(Get-Date)

Test Results:
-------------
"@

if ($UnitTestStatus -eq 0) {
    $ReportContent += "`n✓ Unit Tests: PASSED"
    Write-Host "✓ Unit Tests: PASSED" -ForegroundColor Green
} else {
    $ReportContent += "`n✗ Unit Tests: FAILED"
    Write-Host "✗ Unit Tests: FAILED" -ForegroundColor Red
}

if ($E2ETestStatus -eq 0) {
    $ReportContent += "`n✓ E2E Tests: PASSED"
    Write-Host "✓ E2E Tests: PASSED" -ForegroundColor Green
} else {
    $ReportContent += "`n✗ E2E Tests: FAILED"
    Write-Host "✗ E2E Tests: FAILED" -ForegroundColor Red
}

if ($PerfTestStatus -eq 0) {
    $ReportContent += "`n✓ Performance Tests: PASSED"
    Write-Host "✓ Performance Tests: PASSED" -ForegroundColor Green
} elseif ($PerfTestStatus -eq 2) {
    $ReportContent += "`n⊘ Performance Tests: SKIPPED"
    Write-Host "⊘ Performance Tests: SKIPPED" -ForegroundColor Yellow
} else {
    $ReportContent += "`n✗ Performance Tests: FAILED"
    Write-Host "✗ Performance Tests: FAILED" -ForegroundColor Red
}

$ReportContent += @"

Report Locations:
  - Coverage: $ResultsDir\coverage-$Timestamp
  - E2E Report: $ResultsDir\e2e-report-$Timestamp
  - Performance: $ResultsDir\load-test-$Timestamp.json
"@

Set-Content -Path $ReportFile -Value $ReportContent
Write-Host ""
Write-Host "Test summary saved to: $ReportFile"

# ===================================
# Exit with appropriate code
# ===================================
if ($UnitTestStatus -ne 0 -or $E2ETestStatus -ne 0 -or $PerfTestStatus -eq 1) {
    Write-Host ""
    Write-Host "Some tests failed. Please check the reports." -ForegroundColor Red
    exit 1
} else {
    Write-Host ""
    Write-Host "All tests passed successfully!" -ForegroundColor Green
    exit 0
}
