#!/bin/bash

##############################################################################
# Backup Test Script for PoliticianFinder
#
# This script tests the backup and restore functionality
# - Creates a test backup
# - Verifies backup integrity
# - Tests restore to temporary database (optional)
##############################################################################

set -e

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${BACKUP_DIR:-./backups}"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Backup System Test${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Test 1: Check script existence
echo -e "${YELLOW}Test 1: Checking backup scripts...${NC}"
if [ -f "$SCRIPT_DIR/backup-db.sh" ]; then
    echo -e "${GREEN}✓ backup-db.sh found${NC}"
else
    echo -e "${RED}✗ backup-db.sh not found${NC}"
    exit 1
fi

if [ -f "$SCRIPT_DIR/restore-db.sh" ]; then
    echo -e "${GREEN}✓ restore-db.sh found${NC}"
else
    echo -e "${RED}✗ restore-db.sh not found${NC}"
    exit 1
fi
echo ""

# Test 2: Check dependencies
echo -e "${YELLOW}Test 2: Checking dependencies...${NC}"
for cmd in pg_dump psql gzip gunzip; do
    if command -v $cmd &> /dev/null; then
        echo -e "${GREEN}✓ $cmd available${NC}"
    else
        echo -e "${RED}✗ $cmd not found${NC}"
        exit 1
    fi
done
echo ""

# Test 3: Check environment variables
echo -e "${YELLOW}Test 3: Checking environment variables...${NC}"
if [ -n "$SUPABASE_DB_URL" ]; then
    echo -e "${GREEN}✓ SUPABASE_DB_URL is set${NC}"
else
    echo -e "${RED}✗ SUPABASE_DB_URL is not set${NC}"
    echo "Please set SUPABASE_DB_URL environment variable"
    exit 1
fi
echo ""

# Test 4: Test database connection
echo -e "${YELLOW}Test 4: Testing database connection...${NC}"
if psql "$SUPABASE_DB_URL" -c "SELECT 1;" &>/dev/null; then
    echo -e "${GREEN}✓ Database connection successful${NC}"
else
    echo -e "${RED}✗ Database connection failed${NC}"
    exit 1
fi
echo ""

# Test 5: Create test backup
echo -e "${YELLOW}Test 5: Creating test backup...${NC}"
export BACKUP_TYPE="test"
if "$SCRIPT_DIR/backup-db.sh"; then
    echo -e "${GREEN}✓ Test backup created successfully${NC}"
else
    echo -e "${RED}✗ Test backup failed${NC}"
    exit 1
fi
echo ""

# Test 6: Verify backup file exists
echo -e "${YELLOW}Test 6: Verifying backup file...${NC}"
LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/politicianfinder_test_*.sql.gz 2>/dev/null | head -1)
if [ -f "$LATEST_BACKUP" ]; then
    echo -e "${GREEN}✓ Backup file exists: $(basename $LATEST_BACKUP)${NC}"
    BACKUP_SIZE=$(du -h "$LATEST_BACKUP" | cut -f1)
    echo -e "  Size: $BACKUP_SIZE"
else
    echo -e "${RED}✗ Backup file not found${NC}"
    exit 1
fi
echo ""

# Test 7: Verify backup integrity
echo -e "${YELLOW}Test 7: Verifying backup integrity...${NC}"
if gzip -t "$LATEST_BACKUP" 2>/dev/null; then
    echo -e "${GREEN}✓ Backup file integrity verified${NC}"
else
    echo -e "${RED}✗ Backup file is corrupted${NC}"
    exit 1
fi
echo ""

# Test 8: Verify backup content
echo -e "${YELLOW}Test 8: Verifying backup content...${NC}"
if gunzip -c "$LATEST_BACKUP" | grep -q "PostgreSQL database dump"; then
    echo -e "${GREEN}✓ Backup contains valid PostgreSQL dump${NC}"
else
    echo -e "${RED}✗ Backup does not contain valid PostgreSQL dump${NC}"
    exit 1
fi
echo ""

# Test 9: Check backup logs
echo -e "${YELLOW}Test 9: Checking backup logs...${NC}"
if [ -f "$BACKUP_DIR/backup.log" ]; then
    echo -e "${GREEN}✓ Backup log file exists${NC}"
    echo "  Last 5 log entries:"
    tail -5 "$BACKUP_DIR/backup.log" | sed 's/^/  /'
else
    echo -e "${YELLOW}⚠ Backup log file not found${NC}"
fi
echo ""

# Summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}All tests passed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Backup system is working correctly."
echo "Test backup file: $LATEST_BACKUP"
echo ""
echo "To test restore functionality, run:"
echo "  ./scripts/restore-db.sh --dry-run -b $LATEST_BACKUP"
echo ""
