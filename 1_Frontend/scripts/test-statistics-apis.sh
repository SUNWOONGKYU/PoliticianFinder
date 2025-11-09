#!/bin/bash
# P3BA4: Statistics API Testing Script
# Tests all implemented statistics and health check endpoints

echo "========================================="
echo "P3BA4: Statistics API Testing"
echo "========================================="
echo ""

BASE_URL="${1:-http://localhost:3000}"

echo "Testing against: $BASE_URL"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

test_endpoint() {
  local name=$1
  local endpoint=$2

  echo -n "Testing $name... "

  response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  if [ "$http_code" = "200" ] || [ "$http_code" = "503" ]; then
    echo -e "${GREEN}✓ $http_code${NC}"
    echo "$body" | jq -r '.success, .timestamp' 2>/dev/null || echo "Response received"
  else
    echo -e "${RED}✗ $http_code${NC}"
    echo "$body"
  fi
  echo ""
}

# Test Health Check
echo "1. Health Check Endpoint"
echo "------------------------"
test_endpoint "Health Check" "/api/health"

# Test Overview Statistics
echo "2. Overview Statistics"
echo "----------------------"
test_endpoint "Overview Stats" "/api/statistics/overview"

# Test Community Statistics
echo "3. Community Statistics"
echo "-----------------------"
test_endpoint "Community Stats (30d)" "/api/statistics/community"
test_endpoint "Community Stats (60d)" "/api/statistics/community?period=60"

# Test Politicians Statistics
echo "4. Politicians Statistics"
echo "-------------------------"
test_endpoint "Politicians Stats" "/api/statistics/politicians-stats"

# Test Payment Statistics
echo "5. Payment Statistics"
echo "---------------------"
test_endpoint "Payment Stats" "/api/statistics/payments"

echo "========================================="
echo "Testing Complete"
echo "========================================="
echo ""
echo "Note: If tests fail with connection errors,"
echo "make sure the development server is running:"
echo "  npm run dev"
echo ""
