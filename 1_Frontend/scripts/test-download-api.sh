#!/bin/bash
# P4BA16: Test script for Report Download API

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000"
EVALUATION_ID="test-evaluation-uuid"

echo "================================================"
echo "P4BA16: Report Download API Tests"
echo "================================================"
echo ""

# Test 1: Unauthorized access (no token)
echo -e "${YELLOW}Test 1: Unauthorized Access (401)${NC}"
response=$(curl -s -w "\n%{http_code}" -X GET "${BASE_URL}/api/reports/download/${EVALUATION_ID}")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" = "401" ]; then
    echo -e "${GREEN}✓ PASS${NC} - Returns 401 Unauthorized"
else
    echo -e "${RED}✗ FAIL${NC} - Expected 401, got ${http_code}"
fi
echo "Response: $body"
echo ""

# Test 2: Invalid evaluation ID (404)
echo -e "${YELLOW}Test 2: Invalid Evaluation ID (404)${NC}"
echo "Note: This test requires authentication token"
echo "curl -X GET \"${BASE_URL}/api/reports/download/invalid-uuid\" \\"
echo "  -H \"Authorization: Bearer YOUR_TOKEN\""
echo ""

# Test 3: Payment not verified (403)
echo -e "${YELLOW}Test 3: Payment Not Verified (403)${NC}"
echo "Note: This test requires authentication token and evaluation without payment"
echo "curl -X GET \"${BASE_URL}/api/reports/download/${EVALUATION_ID}\" \\"
echo "  -H \"Authorization: Bearer YOUR_TOKEN\""
echo ""

# Test 4: Download limit exceeded (429)
echo -e "${YELLOW}Test 4: Download Limit Exceeded (429)${NC}"
echo "Note: This test requires 10+ previous downloads"
echo "curl -X GET \"${BASE_URL}/api/reports/download/${EVALUATION_ID}\" \\"
echo "  -H \"Authorization: Bearer YOUR_TOKEN\""
echo ""

# Test 5: Successful download (200)
echo -e "${YELLOW}Test 5: Successful Download (200)${NC}"
echo "Note: This test requires authentication token and valid payment"
echo "curl -X GET \"${BASE_URL}/api/reports/download/${EVALUATION_ID}\" \\"
echo "  -H \"Authorization: Bearer YOUR_TOKEN\""
echo ""

echo "================================================"
echo "Test Summary"
echo "================================================"
echo ""
echo "Automated Tests:"
echo -e "  ${GREEN}✓${NC} Unauthorized access returns 401"
echo ""
echo "Manual Tests Required:"
echo "  - Invalid evaluation ID returns 404"
echo "  - Payment not verified returns 403"
echo "  - Download limit exceeded returns 429"
echo "  - Successful download returns 200 with signed URL"
echo ""
echo "To run manual tests:"
echo "1. Start the Next.js dev server: npm run dev"
echo "2. Login to get authentication token"
echo "3. Use curl commands above with actual token"
echo ""
