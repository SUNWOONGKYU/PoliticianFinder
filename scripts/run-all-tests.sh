#!/bin/bash

# Run All Tests Script - P4T1, P4T2, P4T4
# Executes unit tests, E2E tests, and performance tests

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
RESULTS_DIR="$PROJECT_ROOT/test-results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "======================================"
echo "  PoliticianFinder - Test Suite"
echo "======================================"
echo ""

# Create results directory
mkdir -p "$RESULTS_DIR"

# Function to print section header
print_header() {
    echo ""
    echo -e "${YELLOW}======================================"
    echo "  $1"
    echo -e "======================================${NC}"
    echo ""
}

# Function to check command success
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $1 passed${NC}"
        return 0
    else
        echo -e "${RED}✗ $1 failed${NC}"
        return 1
    fi
}

# Track overall status
UNIT_TEST_STATUS=0
E2E_TEST_STATUS=0
PERF_TEST_STATUS=0

# ===================================
# Unit Tests (P4T1)
# ===================================
print_header "Running Unit Tests (Jest)"

cd "$FRONTEND_DIR"

if npm run test:coverage; then
    check_status "Unit tests"
    UNIT_TEST_STATUS=0
else
    check_status "Unit tests"
    UNIT_TEST_STATUS=1
fi

# Copy coverage report
if [ -d "coverage" ]; then
    cp -r coverage "$RESULTS_DIR/coverage-$TIMESTAMP"
    echo "Coverage report saved to: $RESULTS_DIR/coverage-$TIMESTAMP"
fi

# ===================================
# E2E Tests (P4T2)
# ===================================
print_header "Running E2E Tests (Playwright)"

cd "$FRONTEND_DIR"

# Check if dev server is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "Starting development server..."
    npm run dev &
    DEV_SERVER_PID=$!
    echo "Waiting for server to start..."
    sleep 10
fi

# Run E2E tests
if npm run test:e2e; then
    check_status "E2E tests"
    E2E_TEST_STATUS=0
else
    check_status "E2E tests"
    E2E_TEST_STATUS=1
fi

# Stop dev server if we started it
if [ ! -z "$DEV_SERVER_PID" ]; then
    echo "Stopping development server..."
    kill $DEV_SERVER_PID 2>/dev/null || true
fi

# Copy E2E results
if [ -d "playwright-report" ]; then
    cp -r playwright-report "$RESULTS_DIR/e2e-report-$TIMESTAMP"
    echo "E2E report saved to: $RESULTS_DIR/e2e-report-$TIMESTAMP"
fi

# ===================================
# Performance Tests (P4T4)
# ===================================
print_header "Running Performance Tests (K6)"

cd "$PROJECT_ROOT/performance"

# Check if K6 is installed
if ! command -v k6 &> /dev/null; then
    echo -e "${YELLOW}K6 not found. Skipping performance tests.${NC}"
    echo "Install K6: https://k6.io/docs/getting-started/installation"
    PERF_TEST_STATUS=2
else
    # Run load test
    echo "Running load test..."
    if k6 run --out json="$RESULTS_DIR/load-test-$TIMESTAMP.json" k6-load-test.js; then
        check_status "Load test"
        PERF_TEST_STATUS=0
    else
        check_status "Load test"
        PERF_TEST_STATUS=1
    fi
fi

# ===================================
# Generate Summary Report
# ===================================
print_header "Test Summary"

REPORT_FILE="$RESULTS_DIR/test-summary-$TIMESTAMP.txt"

cat > "$REPORT_FILE" << EOF
====================================
  PoliticianFinder Test Summary
====================================

Timestamp: $(date)

Test Results:
-------------
EOF

if [ $UNIT_TEST_STATUS -eq 0 ]; then
    echo "✓ Unit Tests: PASSED" >> "$REPORT_FILE"
    echo -e "${GREEN}✓ Unit Tests: PASSED${NC}"
else
    echo "✗ Unit Tests: FAILED" >> "$REPORT_FILE"
    echo -e "${RED}✗ Unit Tests: FAILED${NC}"
fi

if [ $E2E_TEST_STATUS -eq 0 ]; then
    echo "✓ E2E Tests: PASSED" >> "$REPORT_FILE"
    echo -e "${GREEN}✓ E2E Tests: PASSED${NC}"
else
    echo "✗ E2E Tests: FAILED" >> "$REPORT_FILE"
    echo -e "${RED}✗ E2E Tests: FAILED${NC}"
fi

if [ $PERF_TEST_STATUS -eq 0 ]; then
    echo "✓ Performance Tests: PASSED" >> "$REPORT_FILE"
    echo -e "${GREEN}✓ Performance Tests: PASSED${NC}"
elif [ $PERF_TEST_STATUS -eq 2 ]; then
    echo "⊘ Performance Tests: SKIPPED" >> "$REPORT_FILE"
    echo -e "${YELLOW}⊘ Performance Tests: SKIPPED${NC}"
else
    echo "✗ Performance Tests: FAILED" >> "$REPORT_FILE"
    echo -e "${RED}✗ Performance Tests: FAILED${NC}"
fi

echo "" >> "$REPORT_FILE"
echo "Report Locations:" >> "$REPORT_FILE"
echo "  - Coverage: $RESULTS_DIR/coverage-$TIMESTAMP" >> "$REPORT_FILE"
echo "  - E2E Report: $RESULTS_DIR/e2e-report-$TIMESTAMP" >> "$REPORT_FILE"
echo "  - Performance: $RESULTS_DIR/load-test-$TIMESTAMP.json" >> "$REPORT_FILE"

echo ""
echo "Test summary saved to: $REPORT_FILE"

# ===================================
# Exit with appropriate code
# ===================================
if [ $UNIT_TEST_STATUS -ne 0 ] || [ $E2E_TEST_STATUS -ne 0 ] || [ $PERF_TEST_STATUS -eq 1 ]; then
    echo ""
    echo -e "${RED}Some tests failed. Please check the reports.${NC}"
    exit 1
else
    echo ""
    echo -e "${GREEN}All tests passed successfully!${NC}"
    exit 0
fi
