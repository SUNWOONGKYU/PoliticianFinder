#!/bin/bash
# P4O2: Test script for aggregate-trending cron job
# Tests the trending posts aggregation endpoint locally

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Testing Trending Posts Aggregation Cron${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo -e "${RED}Error: .env.local file not found${NC}"
  echo "Please create .env.local from .env.example and set CRON_SECRET"
  exit 1
fi

# Load environment variables
source .env.local

# Set default CRON_SECRET if not set
CRON_SECRET=${CRON_SECRET:-"dev-secret"}

# API endpoint
ENDPOINT="http://localhost:3002/api/cron/aggregate-trending"

echo -e "${YELLOW}Testing POST request with authentication...${NC}"
echo "Endpoint: $ENDPOINT"
echo "Authorization: Bearer $CRON_SECRET"
echo ""

# Make the request
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$ENDPOINT" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CRON_SECRET")

# Extract HTTP status code (last line)
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
# Extract response body (all but last line)
BODY=$(echo "$RESPONSE" | sed '$d')

echo -e "${YELLOW}Response:${NC}"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

# Check status code
if [ "$HTTP_CODE" -eq 200 ]; then
  echo -e "${GREEN}✓ Success! HTTP Status: $HTTP_CODE${NC}"

  # Parse and display key metrics
  SUCCESS=$(echo "$BODY" | jq -r '.success' 2>/dev/null)
  PROCESSED=$(echo "$BODY" | jq -r '.data.processed' 2>/dev/null)
  CACHED=$(echo "$BODY" | jq -r '.data.cached' 2>/dev/null)
  DURATION=$(echo "$BODY" | jq -r '.data.duration_ms' 2>/dev/null)

  echo ""
  echo -e "${GREEN}Metrics:${NC}"
  echo "  - Success: $SUCCESS"
  echo "  - Posts Processed: $PROCESSED"
  echo "  - Posts Cached: $CACHED"
  echo "  - Duration: ${DURATION}ms"

  # Display top 5 trending posts
  echo ""
  echo -e "${GREEN}Top 5 Trending Posts:${NC}"
  echo "$BODY" | jq -r '.data.top_10[:5] | .[] | "  \(.rank). \(.title) (Score: \(.score))"' 2>/dev/null
else
  echo -e "${RED}✗ Failed! HTTP Status: $HTTP_CODE${NC}"

  # Try to extract error message
  ERROR=$(echo "$BODY" | jq -r '.error.message' 2>/dev/null)
  if [ "$ERROR" != "null" ] && [ -n "$ERROR" ]; then
    echo -e "${RED}Error: $ERROR${NC}"
  fi
fi

echo ""
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Testing GET request (dev mode only)...${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

# Test GET request
GET_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$ENDPOINT" \
  -H "Authorization: Bearer $CRON_SECRET")

GET_HTTP_CODE=$(echo "$GET_RESPONSE" | tail -n 1)
GET_BODY=$(echo "$GET_RESPONSE" | sed '$d')

echo -e "${YELLOW}Response:${NC}"
echo "$GET_BODY" | jq '.' 2>/dev/null || echo "$GET_BODY"
echo ""

if [ "$GET_HTTP_CODE" -eq 200 ] || [ "$GET_HTTP_CODE" -eq 405 ]; then
  echo -e "${GREEN}✓ GET endpoint behaves as expected (Status: $GET_HTTP_CODE)${NC}"
else
  echo -e "${RED}✗ Unexpected status for GET: $GET_HTTP_CODE${NC}"
fi

echo ""
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Test completed!${NC}"
echo -e "${YELLOW}========================================${NC}"
