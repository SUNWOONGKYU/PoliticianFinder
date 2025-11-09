#!/bin/bash
# Task: P4O1 - Test script for cron job

echo "========================================="
echo "Testing Cron Job: update-politicians"
echo "========================================="
echo ""

# Configuration
BASE_URL="${1:-http://localhost:3000}"
CRON_SECRET="${CRON_SECRET:-development-secret}"

echo "Base URL: $BASE_URL"
echo "Cron Secret: $CRON_SECRET"
echo ""

# Test 1: GET endpoint (info)
echo "Test 1: GET /api/cron/update-politicians"
echo "-----------------------------------------"
curl -s "$BASE_URL/api/cron/update-politicians" | jq .
echo ""
echo ""

# Test 2: POST endpoint (manual trigger)
echo "Test 2: POST /api/cron/update-politicians (Manual Trigger)"
echo "-----------------------------------------------------------"
curl -s -X POST "$BASE_URL/api/cron/update-politicians" \
  -H "x-cron-secret: $CRON_SECRET" \
  -H "Content-Type: application/json" | jq .
echo ""
echo ""

# Test 3: Unauthorized access (should fail)
echo "Test 3: POST without secret (Should return 401)"
echo "------------------------------------------------"
curl -s -X POST "$BASE_URL/api/cron/update-politicians" \
  -H "Content-Type: application/json" | jq .
echo ""
echo ""

echo "========================================="
echo "Tests completed!"
echo "========================================="
