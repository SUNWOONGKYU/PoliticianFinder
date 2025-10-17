################################################################################
# Production Deployment Script (PowerShell)
# PoliticianFinder - Phase 5
################################################################################

param(
    [switch]$SkipTests,
    [switch]$SkipBackup,
    [switch]$SkipConfirm,
    [switch]$Help
)

# Configuration
$PROJECT_NAME = "PoliticianFinder"
$FRONTEND_DIR = "frontend"
$DEPLOYMENT_LOG = "deployment-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

################################################################################
# Helper Functions
################################################################################

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")

    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $color = switch ($Level) {
        "SUCCESS" { "Green" }
        "WARNING" { "Yellow" }
        "ERROR" { "Red" }
        default { "Cyan" }
    }

    $logMessage = "[$timestamp] [$Level] $Message"
    Write-Host $logMessage -ForegroundColor $color
    Add-Content -Path $DEPLOYMENT_LOG -Value $logMessage
}

function Test-Command {
    param([string]$Command)

    $exists = $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
    if (-not $exists) {
        Write-Log "$Command is not installed. Please install it first." "ERROR"
        exit 1
    }
    return $exists
}

function Confirm-Action {
    param([string]$Message)

    if ($SkipConfirm) {
        return $true
    }

    $response = Read-Host "$Message (y/N)"
    return $response -match '^[Yy]$'
}

function Show-Help {
    Write-Host @"
Production Deployment Script - PoliticianFinder

Usage:
    .\deploy-production.ps1 [OPTIONS]

Options:
    -SkipTests      Skip running tests
    -SkipBackup     Skip database backup
    -SkipConfirm    Skip confirmation prompts (use with caution!)
    -Help           Show this help message

Examples:
    .\deploy-production.ps1
    .\deploy-production.ps1 -SkipTests
    .\deploy-production.ps1 -SkipBackup -SkipConfirm

"@ -ForegroundColor Cyan
    exit 0
}

################################################################################
# Pre-Deployment Checks
################################################################################

function Test-PreDeployment {
    Write-Log "Starting pre-deployment checks..." "INFO"

    # Check required commands
    Test-Command "git"
    Test-Command "node"
    Test-Command "npm"
    Test-Command "vercel"

    # Check if we're in the correct directory
    if (-not (Test-Path $FRONTEND_DIR)) {
        Write-Log "Frontend directory not found. Please run this script from the project root." "ERROR"
        exit 1
    }

    # Check git status
    $gitStatus = git status --porcelain
    if ($gitStatus) {
        Write-Log "You have uncommitted changes." "WARNING"
        if (-not (Confirm-Action "Continue with deployment anyway?")) {
            exit 0
        }
    }

    # Check current branch
    $currentBranch = git branch --show-current
    Write-Log "Current branch: $currentBranch" "INFO"

    if ($currentBranch -notin @("main", "master")) {
        Write-Log "You are not on the main branch." "WARNING"
        if (-not (Confirm-Action "Continue deployment from $currentBranch?")) {
            exit 0
        }
    }

    Write-Log "Pre-deployment checks passed!" "SUCCESS"
}

################################################################################
# Environment Variables Check
################################################################################

function Test-EnvironmentVariables {
    Write-Log "Checking environment variables..." "INFO"

    Push-Location $FRONTEND_DIR

    # Check if .env.local exists
    if (-not (Test-Path ".env.local")) {
        Write-Log ".env.local not found. Make sure environment variables are set in Vercel." "WARNING"
    }

    # List required environment variables
    $requiredVars = @(
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    )

    Write-Log "Required environment variables for Vercel:" "INFO"
    foreach ($var in $requiredVars) {
        Write-Host "  - $var" -ForegroundColor White
    }

    if (-not (Confirm-Action "Have you verified all environment variables are set in Vercel dashboard?")) {
        Pop-Location
        exit 0
    }

    Pop-Location

    Write-Log "Environment variables check completed!" "SUCCESS"
}

################################################################################
# Run Tests
################################################################################

function Invoke-Tests {
    if ($SkipTests) {
        Write-Log "Skipping tests (SkipTests flag set)..." "WARNING"
        return
    }

    Write-Log "Running tests..." "INFO"

    Push-Location $FRONTEND_DIR

    # Install dependencies if needed
    if (-not (Test-Path "node_modules")) {
        Write-Log "Installing dependencies..." "INFO"
        npm install
    }

    # Run linting
    Write-Log "Running linter..." "INFO"
    $lintResult = npm run lint 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Log "Linting passed!" "SUCCESS"
    } else {
        Write-Log "Linting failed!" "WARNING"
        if (-not (Confirm-Action "Continue with deployment despite linting errors?")) {
            Pop-Location
            exit 1
        }
    }

    # Run unit tests
    if ((Test-Path "jest.config.js") -or (Test-Path "jest.config.ts")) {
        Write-Log "Running unit tests..." "INFO"
        $testResult = npm run test:ci 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Log "Unit tests passed!" "SUCCESS"
        } else {
            Write-Log "Unit tests failed!" "WARNING"
            if (-not (Confirm-Action "Continue with deployment despite test failures?")) {
                Pop-Location
                exit 1
            }
        }
    }

    Pop-Location

    Write-Log "Tests completed!" "SUCCESS"
}

################################################################################
# Build Test
################################################################################

function Test-Build {
    Write-Log "Testing production build..." "INFO"

    Push-Location $FRONTEND_DIR

    # Run production build
    Write-Log "Building application..." "INFO"
    $buildResult = npm run build 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Log "Build successful!" "SUCCESS"
    } else {
        Write-Log "Build failed! Please fix errors before deploying." "ERROR"
        Pop-Location
        exit 1
    }

    Pop-Location

    Write-Log "Build test completed!" "SUCCESS"
}

################################################################################
# Database Backup
################################################################################

function New-Backup {
    if ($SkipBackup) {
        Write-Log "Skipping database backup (SkipBackup flag set)..." "WARNING"
        return
    }

    Write-Log "Creating database backup..." "INFO"

    if (Test-Path "scripts\backup-db.sh") {
        Write-Log "Running backup script..." "INFO"
        bash scripts/backup-db.sh
        if ($LASTEXITCODE -eq 0) {
            Write-Log "Database backup created!" "SUCCESS"
        } else {
            Write-Log "Database backup failed!" "WARNING"
            if (-not (Confirm-Action "Continue with deployment without backup?")) {
                exit 1
            }
        }
    } else {
        Write-Log "Backup script not found at scripts\backup-db.sh" "WARNING"
        if (-not (Confirm-Action "Continue with deployment without backup?")) {
            exit 1
        }
    }
}

################################################################################
# Git Tag
################################################################################

function New-GitTag {
    Write-Log "Creating Git tag..." "INFO"

    # Get version from package.json
    $packageJson = Get-Content "$FRONTEND_DIR\package.json" -Raw | ConvertFrom-Json
    $version = $packageJson.version
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $tag = "v$version-$timestamp"

    Write-Log "Creating tag: $tag" "INFO"

    git tag -a $tag -m "Production deployment $tag"
    if ($LASTEXITCODE -eq 0) {
        Write-Log "Git tag created: $tag" "SUCCESS"

        if (Confirm-Action "Push tag to remote?") {
            git push origin $tag
            Write-Log "Tag pushed to remote!" "SUCCESS"
        }
    } else {
        Write-Log "Failed to create Git tag." "WARNING"
    }
}

################################################################################
# Deploy to Vercel
################################################################################

function Deploy-ToVercel {
    Write-Log "Deploying to Vercel..." "INFO"

    Push-Location $FRONTEND_DIR

    # Show current Vercel project
    Write-Log "Current Vercel project:" "INFO"
    vercel ls 2>$null

    if (-not (Confirm-Action "Deploy to Vercel production?")) {
        Pop-Location
        exit 0
    }

    # Deploy to production
    Write-Log "Starting production deployment..." "INFO"
    vercel --prod --yes
    if ($LASTEXITCODE -eq 0) {
        Write-Log "Deployment to Vercel successful!" "SUCCESS"
    } else {
        Write-Log "Deployment to Vercel failed!" "ERROR"
        Pop-Location
        exit 1
    }

    Pop-Location
}

################################################################################
# Post-Deployment Verification
################################################################################

function Test-PostDeployment {
    Write-Log "Starting post-deployment verification..." "INFO"

    Push-Location $FRONTEND_DIR

    # Get deployment URL
    $deploymentInfo = vercel ls --prod 2>$null | Select-String -Pattern 'https://[^\s]+'
    if ($deploymentInfo) {
        $deploymentUrl = $deploymentInfo.Matches[0].Value
        Write-Log "Deployment URL: $deploymentUrl" "INFO"

        # Test health check
        Write-Log "Testing deployment health..." "INFO"
        try {
            $response = Invoke-WebRequest -Uri $deploymentUrl -Method Head -TimeoutSec 10
            if ($response.StatusCode -eq 200) {
                Write-Log "Health check passed!" "SUCCESS"
            } else {
                Write-Log "Health check failed! Please verify deployment manually." "WARNING"
            }
        } catch {
            Write-Log "Health check failed! Please verify deployment manually." "WARNING"
        }

        # Open deployment in browser
        if (Confirm-Action "Open deployment in browser?") {
            Start-Process $deploymentUrl
        }
    } else {
        Write-Log "Could not retrieve deployment URL." "WARNING"
    }

    Pop-Location
}

################################################################################
# Deployment Summary
################################################################################

function Show-DeploymentSummary {
    $currentBranch = git branch --show-current
    $commitHash = git rev-parse --short HEAD
    $userName = git config user.name

    Write-Host ""
    Write-Host "========================================================================" -ForegroundColor Green
    Write-Host "Deployment Summary" -ForegroundColor Green
    Write-Host "========================================================================" -ForegroundColor Green
    Write-Host "Project: $PROJECT_NAME"
    Write-Host "Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    Write-Host "Branch: $currentBranch"
    Write-Host "Commit: $commitHash"
    Write-Host "Deployed by: $userName"
    Write-Host ""
    Write-Host "Deployment log saved to: $DEPLOYMENT_LOG"
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "  1. Verify application is working correctly"
    Write-Host "  2. Monitor error rates and performance"
    Write-Host "  3. Check Vercel dashboard for deployment status"
    Write-Host "  4. Update documentation if necessary"
    Write-Host ""
    Write-Host "Rollback instructions:"
    Write-Host "  - Go to Vercel dashboard > Deployments"
    Write-Host "  - Select previous deployment"
    Write-Host "  - Click 'Promote to Production'"
    Write-Host "========================================================================" -ForegroundColor Green

    Write-Log "Deployment completed successfully!" "SUCCESS"
}

################################################################################
# Main Deployment Flow
################################################################################

function Main {
    if ($Help) {
        Show-Help
    }

    Write-Host ""
    Write-Host "========================================================================" -ForegroundColor Cyan
    Write-Host "$PROJECT_NAME - Production Deployment" -ForegroundColor Cyan
    Write-Host "========================================================================" -ForegroundColor Cyan
    Write-Host ""

    Write-Log "Starting deployment process..." "INFO"
    Write-Log "Logging to: $DEPLOYMENT_LOG" "INFO"

    # Confirm deployment
    if (-not (Confirm-Action "Start production deployment?")) {
        exit 0
    }

    try {
        # Run deployment steps
        Test-PreDeployment
        Test-EnvironmentVariables
        Invoke-Tests
        Test-Build
        New-Backup
        New-GitTag
        Deploy-ToVercel
        Test-PostDeployment
        Show-DeploymentSummary
    } catch {
        Write-Log "Deployment failed: $_" "ERROR"
        exit 1
    }
}

# Run main function
Main
