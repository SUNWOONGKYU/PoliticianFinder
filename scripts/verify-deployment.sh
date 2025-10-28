#!/bin/bash

################################################################################
# Deployment Verification Script
# PoliticianFinder - Phase 5
################################################################################

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
DOMAIN=${1:-""}
VERIFICATION_LOG="verification-$(date +%Y%m%d-%H%M%S).log"

################################################################################
# Helper Functions
################################################################################

log() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$VERIFICATION_LOG"
}

success() {
    echo -e "${GREEN}[PASS]${NC} $1" | tee -a "$VERIFICATION_LOG"
}

warning() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$VERIFICATION_LOG"
}

error() {
    echo -e "${RED}[FAIL]${NC} $1" | tee -a "$VERIFICATION_LOG"
}

check_command() {
    if ! command -v "$1" &> /dev/null; then
        warning "$1 not installed, skipping related checks"
        return 1
    fi
    return 0
}

################################################################################
# Verification Tests
################################################################################

# Test 1: Domain Resolution
test_dns_resolution() {
    log "Testing DNS resolution..."

    if [ -z "$DOMAIN" ]; then
        warning "No domain provided, skipping DNS tests"
        return
    fi

    if check_command "dig"; then
        # Check A record
        A_RECORD=$(dig +short "$DOMAIN" @8.8.8.8 | head -1)
        if [ -n "$A_RECORD" ]; then
            success "DNS resolution successful: $DOMAIN → $A_RECORD"
        else
            error "DNS resolution failed for $DOMAIN"
        fi

        # Check WWW
        WWW_RECORD=$(dig +short "www.$DOMAIN" @8.8.8.8 | head -1)
        if [ -n "$WWW_RECORD" ]; then
            success "WWW subdomain resolves: www.$DOMAIN → $WWW_RECORD"
        else
            warning "WWW subdomain not configured"
        fi
    else
        warning "dig not available, skipping DNS checks"
    fi
}

# Test 2: HTTP to HTTPS Redirect
test_https_redirect() {
    log "Testing HTTPS redirect..."

    if [ -z "$DOMAIN" ]; then
        warning "No domain provided, skipping HTTPS redirect test"
        return
    fi

    if check_command "curl"; then
        HTTP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -L "http://$DOMAIN")
        REDIRECT_URL=$(curl -s -I "http://$DOMAIN" | grep -i "location:" | awk '{print $2}' | tr -d '\r')

        if [[ "$REDIRECT_URL" == https://* ]]; then
            success "HTTP redirects to HTTPS: $REDIRECT_URL"
        else
            error "HTTP does not redirect to HTTPS"
        fi
    fi
}

# Test 3: SSL Certificate
test_ssl_certificate() {
    log "Testing SSL certificate..."

    if [ -z "$DOMAIN" ]; then
        warning "No domain provided, skipping SSL tests"
        return
    fi

    if check_command "openssl"; then
        # Check certificate validity
        CERT_INFO=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)

        if [ $? -eq 0 ]; then
            success "SSL certificate is valid"

            # Extract expiration date
            EXPIRY=$(echo "$CERT_INFO" | grep "notAfter" | cut -d= -f2)
            EXPIRY_EPOCH=$(date -d "$EXPIRY" +%s 2>/dev/null || date -j -f "%b %d %H:%M:%S %Y %Z" "$EXPIRY" +%s 2>/dev/null)
            NOW_EPOCH=$(date +%s)
            DAYS_LEFT=$(( ($EXPIRY_EPOCH - $NOW_EPOCH) / 86400 ))

            if [ $DAYS_LEFT -gt 30 ]; then
                success "Certificate expires in $DAYS_LEFT days"
            else
                warning "Certificate expires soon: $DAYS_LEFT days"
            fi
        else
            error "SSL certificate is invalid or not found"
        fi

        # Check TLS version
        TLS_VERSION=$(echo | openssl s_client -servername "$DOMAIN" -connect "$DOMAIN:443" 2>/dev/null | grep "Protocol" | awk '{print $3}')
        if [[ "$TLS_VERSION" == "TLSv1.3" ]] || [[ "$TLS_VERSION" == "TLSv1.2" ]]; then
            success "Using secure TLS version: $TLS_VERSION"
        else
            warning "Using older TLS version: $TLS_VERSION"
        fi
    fi
}

# Test 4: Security Headers
test_security_headers() {
    log "Testing security headers..."

    if [ -z "$DOMAIN" ]; then
        warning "No domain provided, skipping security header tests"
        return
    fi

    if check_command "curl"; then
        HEADERS=$(curl -s -I "https://$DOMAIN" 2>/dev/null)

        # Check for important headers
        declare -A REQUIRED_HEADERS=(
            ["X-Content-Type-Options"]="nosniff"
            ["X-Frame-Options"]="(DENY|SAMEORIGIN)"
            ["X-XSS-Protection"]="1"
            ["Referrer-Policy"]="strict-origin"
            ["Strict-Transport-Security"]="max-age"
        )

        for header in "${!REQUIRED_HEADERS[@]}"; do
            if echo "$HEADERS" | grep -qi "$header"; then
                success "Security header present: $header"
            else
                warning "Security header missing: $header"
            fi
        done
    fi
}

# Test 5: Application Response
test_application_response() {
    log "Testing application response..."

    if [ -z "$DOMAIN" ]; then
        warning "No domain provided, skipping application tests"
        return
    fi

    if check_command "curl"; then
        # Test homepage
        HOME_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN")
        HOME_TIME=$(curl -s -o /dev/null -w "%{time_total}" "https://$DOMAIN")

        if [ "$HOME_STATUS" == "200" ]; then
            success "Homepage returns 200 OK"
            if (( $(echo "$HOME_TIME < 3.0" | bc -l) )); then
                success "Homepage loads in ${HOME_TIME}s (< 3s)"
            else
                warning "Homepage loads slowly: ${HOME_TIME}s"
            fi
        else
            error "Homepage returns HTTP $HOME_STATUS"
        fi

        # Test API endpoint
        API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/api/health" 2>/dev/null)
        if [ "$API_STATUS" == "200" ] || [ "$API_STATUS" == "404" ]; then
            log "API endpoint check: HTTP $API_STATUS"
        fi

        # Check for errors in response
        RESPONSE=$(curl -s "https://$DOMAIN")
        if echo "$RESPONSE" | grep -q "500\|error\|Error"; then
            warning "Possible errors found in page content"
        else
            success "No obvious errors in page content"
        fi
    fi
}

# Test 6: Content Verification
test_content() {
    log "Testing page content..."

    if [ -z "$DOMAIN" ]; then
        warning "No domain provided, skipping content tests"
        return
    fi

    if check_command "curl"; then
        CONTENT=$(curl -s "https://$DOMAIN")

        # Check for expected content
        if echo "$CONTENT" | grep -q "PoliticianFinder\|politician"; then
            success "Page contains expected content"
        else
            warning "Page may not contain expected content"
        fi

        # Check for Next.js indicators
        if echo "$CONTENT" | grep -q "_next"; then
            success "Next.js application detected"
        else
            warning "Next.js indicators not found"
        fi

        # Check for meta tags
        if echo "$CONTENT" | grep -q "<meta"; then
            success "Meta tags present"
        else
            warning "Meta tags missing"
        fi
    fi
}

# Test 7: Performance
test_performance() {
    log "Testing performance metrics..."

    if [ -z "$DOMAIN" ]; then
        warning "No domain provided, skipping performance tests"
        return
    fi

    if check_command "curl"; then
        # Measure response time
        RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" "https://$DOMAIN")

        if (( $(echo "$RESPONSE_TIME < 1.0" | bc -l) )); then
            success "Excellent response time: ${RESPONSE_TIME}s"
        elif (( $(echo "$RESPONSE_TIME < 3.0" | bc -l) )); then
            success "Good response time: ${RESPONSE_TIME}s"
        else
            warning "Slow response time: ${RESPONSE_TIME}s"
        fi

        # Check Content-Encoding
        if curl -s -I "https://$DOMAIN" | grep -qi "content-encoding: gzip\|content-encoding: br"; then
            success "Content compression enabled"
        else
            warning "Content compression not detected"
        fi
    fi
}

# Test 8: Mobile Responsiveness
test_mobile() {
    log "Testing mobile user-agent..."

    if [ -z "$DOMAIN" ]; then
        warning "No domain provided, skipping mobile tests"
        return
    fi

    if check_command "curl"; then
        MOBILE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -A "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)" "https://$DOMAIN")

        if [ "$MOBILE_STATUS" == "200" ]; then
            success "Mobile user-agent returns 200 OK"
        else
            error "Mobile user-agent returns HTTP $MOBILE_STATUS"
        fi
    fi
}

# Test 9: Vercel Deployment
test_vercel_deployment() {
    log "Checking Vercel deployment..."

    if check_command "vercel"; then
        # Check if in correct directory
        if [ ! -d "frontend" ]; then
            warning "Not in project root, skipping Vercel checks"
            return
        fi

        cd frontend

        # List deployments
        DEPLOYMENTS=$(vercel ls --prod 2>/dev/null | head -5)
        if [ -n "$DEPLOYMENTS" ]; then
            success "Vercel production deployment found"
        else
            warning "Could not verify Vercel deployment"
        fi

        cd ..
    else
        warning "Vercel CLI not installed, skipping Vercel checks"
    fi
}

# Test 10: Environment Variables
test_environment_variables() {
    log "Checking environment variables..."

    if [ ! -d "frontend" ]; then
        warning "Frontend directory not found, skipping env check"
        return
    fi

    cd frontend

    if [ -f ".env.example" ]; then
        success ".env.example file exists"

        # Check for required variables in example
        REQUIRED_VARS=("NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_ANON_KEY")
        for var in "${REQUIRED_VARS[@]}"; do
            if grep -q "$var" .env.example; then
                success "Required variable documented: $var"
            else
                warning "Required variable not in example: $var"
            fi
        done
    else
        warning ".env.example file not found"
    fi

    cd ..
}

################################################################################
# Summary
################################################################################

generate_summary() {
    echo ""
    echo "========================================================================"
    echo -e "${BLUE}Deployment Verification Summary${NC}"
    echo "========================================================================"
    echo "Domain: ${DOMAIN:-'Not provided'}"
    echo "Date: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
    echo "Log file: $VERIFICATION_LOG"
    echo ""

    # Count results
    PASS_COUNT=$(grep -c "\\[PASS\\]" "$VERIFICATION_LOG" 2>/dev/null || echo 0)
    WARN_COUNT=$(grep -c "\\[WARN\\]" "$VERIFICATION_LOG" 2>/dev/null || echo 0)
    FAIL_COUNT=$(grep -c "\\[FAIL\\]" "$VERIFICATION_LOG" 2>/dev/null || echo 0)

    echo "Results:"
    echo -e "  ${GREEN}Passed:${NC} $PASS_COUNT"
    echo -e "  ${YELLOW}Warnings:${NC} $WARN_COUNT"
    echo -e "  ${RED}Failed:${NC} $FAIL_COUNT"
    echo ""

    if [ $FAIL_COUNT -eq 0 ] && [ $WARN_COUNT -eq 0 ]; then
        echo -e "${GREEN}✓ All checks passed!${NC}"
        echo "Your deployment is working perfectly."
    elif [ $FAIL_COUNT -eq 0 ]; then
        echo -e "${YELLOW}⚠ Deployment working with warnings${NC}"
        echo "Review warnings and fix if necessary."
    else
        echo -e "${RED}✗ Deployment has issues${NC}"
        echo "Review failed checks and fix issues."
    fi

    echo "========================================================================"
}

################################################################################
# Main
################################################################################

main() {
    echo ""
    echo "========================================================================"
    echo -e "${BLUE}PoliticianFinder - Deployment Verification${NC}"
    echo "========================================================================"
    echo ""

    if [ -z "$DOMAIN" ]; then
        log "No domain provided. Running basic checks only."
        log "Usage: $0 <domain>"
        echo ""
    fi

    log "Starting verification tests..."
    log "Logging to: $VERIFICATION_LOG"
    echo ""

    # Run all tests
    test_dns_resolution
    echo ""
    test_https_redirect
    echo ""
    test_ssl_certificate
    echo ""
    test_security_headers
    echo ""
    test_application_response
    echo ""
    test_content
    echo ""
    test_performance
    echo ""
    test_mobile
    echo ""
    test_vercel_deployment
    echo ""
    test_environment_variables
    echo ""

    # Generate summary
    generate_summary
}

# Run main function
main "$@"
