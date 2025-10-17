#!/bin/bash

################################################################################
# Production Deployment Script
# PoliticianFinder - Phase 5
################################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="PoliticianFinder"
FRONTEND_DIR="frontend"
DEPLOYMENT_LOG="deployment-$(date +%Y%m%d-%H%M%S).log"

################################################################################
# Helper Functions
################################################################################

log() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$DEPLOYMENT_LOG"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$DEPLOYMENT_LOG"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$DEPLOYMENT_LOG"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$DEPLOYMENT_LOG"
    exit 1
}

check_command() {
    if ! command -v "$1" &> /dev/null; then
        error "$1 is not installed. Please install it first."
    fi
}

confirm() {
    read -p "$(echo -e ${YELLOW}$1${NC}) (y/N): " -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        warning "Operation cancelled by user."
        exit 0
    fi
}

################################################################################
# Pre-Deployment Checks
################################################################################

pre_deployment_checks() {
    log "Starting pre-deployment checks..."

    # Check required commands
    check_command "git"
    check_command "node"
    check_command "npm"
    check_command "vercel"

    # Check if we're in the correct directory
    if [ ! -d "$FRONTEND_DIR" ]; then
        error "Frontend directory not found. Please run this script from the project root."
    fi

    # Check git status
    if ! git diff-index --quiet HEAD --; then
        warning "You have uncommitted changes."
        confirm "Continue with deployment anyway?"
    fi

    # Check current branch
    CURRENT_BRANCH=$(git branch --show-current)
    log "Current branch: $CURRENT_BRANCH"

    if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ]; then
        warning "You are not on the main branch."
        confirm "Continue deployment from $CURRENT_BRANCH?"
    fi

    success "Pre-deployment checks passed!"
}

################################################################################
# Environment Variables Check
################################################################################

check_environment_variables() {
    log "Checking environment variables..."

    cd "$FRONTEND_DIR"

    # Check if .env.local exists
    if [ ! -f ".env.local" ]; then
        warning ".env.local not found. Make sure environment variables are set in Vercel."
    fi

    # List required environment variables
    REQUIRED_VARS=(
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    )

    log "Required environment variables for Vercel:"
    for var in "${REQUIRED_VARS[@]}"; do
        echo "  - $var"
    done

    confirm "Have you verified all environment variables are set in Vercel dashboard?"

    cd ..

    success "Environment variables check completed!"
}

################################################################################
# Run Tests
################################################################################

run_tests() {
    log "Running tests..."

    cd "$FRONTEND_DIR"

    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        log "Installing dependencies..."
        npm install
    fi

    # Run linting
    log "Running linter..."
    if npm run lint; then
        success "Linting passed!"
    else
        warning "Linting failed!"
        confirm "Continue with deployment despite linting errors?"
    fi

    # Run unit tests
    if [ -f "jest.config.js" ] || [ -f "jest.config.ts" ]; then
        log "Running unit tests..."
        if npm run test:ci 2>/dev/null || npm test -- --passWithNoTests; then
            success "Unit tests passed!"
        else
            warning "Unit tests failed!"
            confirm "Continue with deployment despite test failures?"
        fi
    fi

    cd ..

    success "Tests completed!"
}

################################################################################
# Build Test
################################################################################

build_test() {
    log "Testing production build..."

    cd "$FRONTEND_DIR"

    # Run production build
    log "Building application..."
    if npm run build; then
        success "Build successful!"
    else
        error "Build failed! Please fix errors before deploying."
    fi

    cd ..

    success "Build test completed!"
}

################################################################################
# Database Backup
################################################################################

create_backup() {
    log "Creating database backup..."

    if [ -f "scripts/backup-db.sh" ]; then
        log "Running backup script..."
        if bash scripts/backup-db.sh; then
            success "Database backup created!"
        else
            warning "Database backup failed!"
            confirm "Continue with deployment without backup?"
        fi
    else
        warning "Backup script not found at scripts/backup-db.sh"
        confirm "Continue with deployment without backup?"
    fi
}

################################################################################
# Git Tag
################################################################################

create_git_tag() {
    log "Creating Git tag..."

    # Get version from package.json
    VERSION=$(node -p "require('./frontend/package.json').version")
    TAG="v$VERSION-$(date +%Y%m%d-%H%M%S)"

    log "Creating tag: $TAG"

    if git tag -a "$TAG" -m "Production deployment $TAG"; then
        success "Git tag created: $TAG"

        read -p "$(echo -e ${YELLOW}Push tag to remote?${NC}) (y/N): " -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git push origin "$TAG"
            success "Tag pushed to remote!"
        fi
    else
        warning "Failed to create Git tag."
    fi
}

################################################################################
# Deploy to Vercel
################################################################################

deploy_to_vercel() {
    log "Deploying to Vercel..."

    cd "$FRONTEND_DIR"

    # Show current Vercel project
    log "Current Vercel project:"
    vercel ls 2>/dev/null || log "No existing deployments found."

    confirm "Deploy to Vercel production?"

    # Deploy to production
    log "Starting production deployment..."
    if vercel --prod --yes; then
        success "Deployment to Vercel successful!"
    else
        error "Deployment to Vercel failed!"
    fi

    cd ..
}

################################################################################
# Post-Deployment Verification
################################################################################

post_deployment_verification() {
    log "Starting post-deployment verification..."

    cd "$FRONTEND_DIR"

    # Get deployment URL
    DEPLOYMENT_URL=$(vercel ls --prod 2>/dev/null | grep -o 'https://[^ ]*' | head -1)

    if [ -n "$DEPLOYMENT_URL" ]; then
        log "Deployment URL: $DEPLOYMENT_URL"

        # Test health check
        log "Testing deployment health..."
        if curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL" | grep -q "200"; then
            success "Health check passed!"
        else
            warning "Health check failed! Please verify deployment manually."
        fi

        # Open deployment in browser
        read -p "$(echo -e ${YELLOW}Open deployment in browser?${NC}) (y/N): " -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            if command -v xdg-open &> /dev/null; then
                xdg-open "$DEPLOYMENT_URL"
            elif command -v open &> /dev/null; then
                open "$DEPLOYMENT_URL"
            else
                log "Please open manually: $DEPLOYMENT_URL"
            fi
        fi
    else
        warning "Could not retrieve deployment URL."
    fi

    cd ..
}

################################################################################
# Deployment Summary
################################################################################

deployment_summary() {
    echo ""
    echo "========================================================================"
    echo -e "${GREEN}Deployment Summary${NC}"
    echo "========================================================================"
    echo "Project: $PROJECT_NAME"
    echo "Date: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "Branch: $(git branch --show-current)"
    echo "Commit: $(git rev-parse --short HEAD)"
    echo "Deployed by: $(git config user.name)"
    echo ""
    echo "Deployment log saved to: $DEPLOYMENT_LOG"
    echo ""
    echo "Next steps:"
    echo "  1. Verify application is working correctly"
    echo "  2. Monitor error rates and performance"
    echo "  3. Check Vercel dashboard for deployment status"
    echo "  4. Update documentation if necessary"
    echo ""
    echo "Rollback instructions:"
    echo "  - Go to Vercel dashboard > Deployments"
    echo "  - Select previous deployment"
    echo "  - Click 'Promote to Production'"
    echo "========================================================================"

    success "Deployment completed successfully!"
}

################################################################################
# Main Deployment Flow
################################################################################

main() {
    echo ""
    echo "========================================================================"
    echo -e "${BLUE}$PROJECT_NAME - Production Deployment${NC}"
    echo "========================================================================"
    echo ""

    log "Starting deployment process..."
    log "Logging to: $DEPLOYMENT_LOG"

    # Confirm deployment
    confirm "Start production deployment?"

    # Run deployment steps
    pre_deployment_checks
    check_environment_variables
    run_tests
    build_test
    create_backup
    create_git_tag
    deploy_to_vercel
    post_deployment_verification
    deployment_summary
}

# Run main function
main "$@"
