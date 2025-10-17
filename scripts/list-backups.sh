#!/bin/bash

##############################################################################
# List Backups Script for PoliticianFinder
#
# This script lists all available backups with detailed information
##############################################################################

set -e

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

BACKUP_DIR="${BACKUP_DIR:-./backups}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Available Database Backups${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${YELLOW}Backup directory does not exist: $BACKUP_DIR${NC}"
    exit 0
fi

# Find all backup files
BACKUP_FILES=$(find "$BACKUP_DIR" -name "politicianfinder_*.sql.gz*" -type f 2>/dev/null | sort -r)

if [ -z "$BACKUP_FILES" ]; then
    echo "No backup files found in $BACKUP_DIR"
    exit 0
fi

# Display header
printf "%-4s %-50s %-10s %-12s %-20s\n" "No." "Filename" "Size" "Type" "Date"
echo "--------------------------------------------------------------------------------------------------------"

# List backups
COUNT=0
while IFS= read -r file; do
    ((COUNT++))
    FILENAME=$(basename "$file")
    SIZE=$(du -h "$file" | cut -f1)

    # Extract backup type from filename
    if [[ $FILENAME =~ _daily_ ]]; then
        TYPE="Daily"
    elif [[ $FILENAME =~ _weekly_ ]]; then
        TYPE="Weekly"
    elif [[ $FILENAME =~ _manual_ ]]; then
        TYPE="Manual"
    elif [[ $FILENAME =~ _test_ ]]; then
        TYPE="Test"
    else
        TYPE="Unknown"
    fi

    # Get file modification date
    if [[ "$OSTYPE" == "darwin"* ]]; then
        DATE=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M" "$file")
    else
        DATE=$(stat -c '%y' "$file" 2>/dev/null | cut -d' ' -f1,2 | cut -d. -f1 || echo "unknown")
    fi

    # Check if encrypted
    if [[ $FILENAME == *.enc ]]; then
        ENCRYPTED=" (encrypted)"
    else
        ENCRYPTED=""
    fi

    printf "%-4s %-50s %-10s %-12s %-20s%s\n" "$COUNT" "${FILENAME:0:50}" "$SIZE" "$TYPE" "$DATE" "$ENCRYPTED"
done <<< "$BACKUP_FILES"

echo ""
echo -e "${GREEN}Total backups: $COUNT${NC}"

# Calculate total size
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
echo -e "${GREEN}Total size: $TOTAL_SIZE${NC}"

# Show backup statistics
echo ""
echo -e "${BLUE}Backup Statistics:${NC}"
DAILY_COUNT=$(echo "$BACKUP_FILES" | grep -c "_daily_" || echo "0")
WEEKLY_COUNT=$(echo "$BACKUP_FILES" | grep -c "_weekly_" || echo "0")
MANUAL_COUNT=$(echo "$BACKUP_FILES" | grep -c "_manual_" || echo "0")
ENCRYPTED_COUNT=$(echo "$BACKUP_FILES" | grep -c "\.enc$" || echo "0")

echo "  Daily backups:     $DAILY_COUNT"
echo "  Weekly backups:    $WEEKLY_COUNT"
echo "  Manual backups:    $MANUAL_COUNT"
echo "  Encrypted backups: $ENCRYPTED_COUNT"

echo ""
echo -e "${BLUE}Commands:${NC}"
echo "  View backup:    gunzip -c <filename> | less"
echo "  Verify backup:  gzip -t <filename>"
echo "  Restore backup: ./scripts/restore-db.sh -b <filename>"
echo ""
