#!/bin/bash

# CORS Testing Script for PoliticianFinder
# This script tests various CORS scenarios to ensure proper configuration

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:8000}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  CORS Configuration Testing Suite${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "API URL: ${YELLOW}${API_URL}${NC}"
echo -e "Frontend URL: ${YELLOW}${FRONTEND_URL}${NC}"
echo ""

# Test counter
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run a test
run_test() {
    local test_name=$1
    local expected_result=$2
    shift 2
    local command="$@"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "${BLUE}Test ${TOTAL_TESTS}:${NC} ${test_name}"

    # Run the command and capture output
    response=$(eval $command 2>&1)
    exit_code=$?

    # Check result
    if [ "$expected_result" = "success" ] && [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✓ PASSED${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    elif [ "$expected_result" = "fail" ] && [ $exit_code -ne 0 ]; then
        echo -e "${GREEN}✓ PASSED${NC} (Expected failure)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗ FAILED${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        echo -e "${YELLOW}Response:${NC} $response"
    fi
    echo ""
}

# Test 1: Health check without origin (same-origin request)
echo -e "${YELLOW}=== Basic Connectivity Tests ===${NC}"
run_test "Health check without origin" "success" \
    "curl -s -o /dev/null -w '%{http_code}' ${API_URL}/health | grep -q '200'"

# Test 2: Health check with allowed origin
run_test "Health check with allowed origin" "success" \
    "curl -s -H 'Origin: ${FRONTEND_URL}' ${API_URL}/health -I | grep -q 'access-control-allow-origin: ${FRONTEND_URL}'"

# Test 3: Health check with disallowed origin
echo -e "${YELLOW}=== CORS Security Tests ===${NC}"
run_test "Blocked origin returns 403 on preflight" "success" \
    "curl -s -w '%{http_code}' -X OPTIONS -H 'Origin: https://malicious-site.com' ${API_URL}/api/v1/politicians | grep -q '403'"

# Test 4: Preflight request with allowed origin
run_test "Preflight with allowed origin" "success" \
    "curl -s -X OPTIONS -H 'Origin: ${FRONTEND_URL}' -H 'Access-Control-Request-Method: POST' ${API_URL}/api/v1/politicians -I | grep -q 'access-control-allow-origin'"

# Test 5: Check for CORS headers in preflight
run_test "Preflight includes allowed methods" "success" \
    "curl -s -X OPTIONS -H 'Origin: ${FRONTEND_URL}' ${API_URL}/api/v1/politicians -I | grep -q 'access-control-allow-methods'"

run_test "Preflight includes allowed headers" "success" \
    "curl -s -X OPTIONS -H 'Origin: ${FRONTEND_URL}' ${API_URL}/api/v1/politicians -I | grep -q 'access-control-allow-headers'"

run_test "Preflight includes max-age" "success" \
    "curl -s -X OPTIONS -H 'Origin: ${FRONTEND_URL}' ${API_URL}/api/v1/politicians -I | grep -q 'access-control-max-age'"

# Test 6: Credentials support
echo -e "${YELLOW}=== Credentials Tests ===${NC}"
run_test "Credentials enabled in response" "success" \
    "curl -s -H 'Origin: ${FRONTEND_URL}' ${API_URL}/health -I | grep -q 'access-control-allow-credentials: true'"

# Test 7: Security headers
echo -e "${YELLOW}=== Security Headers Tests ===${NC}"
run_test "X-Frame-Options header present" "success" \
    "curl -s ${API_URL}/health -I | grep -q -i 'x-frame-options'"

run_test "X-Content-Type-Options header present" "success" \
    "curl -s ${API_URL}/health -I | grep -q -i 'x-content-type-options'"

run_test "X-XSS-Protection header present" "success" \
    "curl -s ${API_URL}/health -I | grep -q -i 'x-xss-protection'"

run_test "Referrer-Policy header present" "success" \
    "curl -s ${API_URL}/health -I | grep -q -i 'referrer-policy'"

# Test 8: Wildcard checks (should NOT be present)
echo -e "${YELLOW}=== Wildcard Prevention Tests ===${NC}"
run_test "No wildcard origin with credentials" "success" \
    "! curl -s -H 'Origin: ${FRONTEND_URL}' ${API_URL}/health -I | grep -q 'access-control-allow-origin: \*'"

# Test 9: Null origin (should be rejected)
echo -e "${YELLOW}=== Null Origin Tests ===${NC}"
run_test "Null origin rejected" "success" \
    "curl -s -w '%{http_code}' -X OPTIONS -H 'Origin: null' ${API_URL}/api/v1/politicians | grep -q '403'"

# Test 10: Different HTTP methods
echo -e "${YELLOW}=== HTTP Methods Tests ===${NC}"
run_test "GET request with CORS" "success" \
    "curl -s -H 'Origin: ${FRONTEND_URL}' ${API_URL}/health -I | grep -q 'access-control-allow-origin'"

run_test "POST preflight" "success" \
    "curl -s -w '%{http_code}' -X OPTIONS -H 'Origin: ${FRONTEND_URL}' -H 'Access-Control-Request-Method: POST' ${API_URL}/api/v1/politicians | grep -q '200'"

run_test "PUT preflight" "success" \
    "curl -s -w '%{http_code}' -X OPTIONS -H 'Origin: ${FRONTEND_URL}' -H 'Access-Control-Request-Method: PUT' ${API_URL}/api/v1/politicians/1 | grep -q '200'"

run_test "DELETE preflight" "success" \
    "curl -s -w '%{http_code}' -X OPTIONS -H 'Origin: ${FRONTEND_URL}' -H 'Access-Control-Request-Method: DELETE' ${API_URL}/api/v1/politicians/1 | grep -q '200'"

# Test 11: Complex headers
echo -e "${YELLOW}=== Complex Headers Tests ===${NC}"
run_test "Authorization header allowed" "success" \
    "curl -s -X OPTIONS -H 'Origin: ${FRONTEND_URL}' -H 'Access-Control-Request-Headers: Authorization' ${API_URL}/api/v1/politicians -I | grep -q 'access-control-allow-headers'"

run_test "Content-Type header allowed" "success" \
    "curl -s -X OPTIONS -H 'Origin: ${FRONTEND_URL}' -H 'Access-Control-Request-Headers: Content-Type' ${API_URL}/api/v1/politicians -I | grep -q 'access-control-allow-headers'"

run_test "Multiple headers allowed" "success" \
    "curl -s -X OPTIONS -H 'Origin: ${FRONTEND_URL}' -H 'Access-Control-Request-Headers: Content-Type,Authorization,X-Request-ID' ${API_URL}/api/v1/politicians -I | grep -q 'access-control-allow-headers'"

# Test 12: Exposed headers
echo -e "${YELLOW}=== Exposed Headers Tests ===${NC}"
run_test "Expose headers present" "success" \
    "curl -s -H 'Origin: ${FRONTEND_URL}' ${API_URL}/health -I | grep -q 'access-control-expose-headers'"

# Print summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Test Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Total Tests: ${TOTAL_TESTS}"
echo -e "${GREEN}Passed: ${PASSED_TESTS}${NC}"
echo -e "${RED}Failed: ${FAILED_TESTS}${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}All tests passed! ✓${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed. Please review the output above.${NC}"
    exit 1
fi
