#!/bin/bash

##############################################################################
# Backup Cleanup Script for PoliticianFinder
#
# This script cleans up old backup files based on retention policy
# - Removes backups older than specified days
# - Preserves weekly backups longer
# - Interactive and dry-run modes
##############################################################################

set -e

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
WEEKLY_RETENTION_DAYS="${WEEKLY_RETENTION_DAYS:-90}"
DRY_RUN="${DRY_RUN:-false}"
INTERACTIVE="${INTERACTIVE:-true}"

log_info() {
    echo -e "${GREEN}[INFO]${NC} $@"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $@"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $@"
}

usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Cleanup old database backup files

OPTIONS:
    -h, --help                  Show this help message
    -d, --days DAYS             Retention days for daily backups (default: 30)
    -w, --weekly-days DAYS      Retention days for weekly backups (default: 90)
    -n, --dry-run               Show what would be deleted without deleting
    -f, --force                 Skip confirmation prompts
    -y, --yes                   Answer yes to all prompts

EXAMPLES:
    # Dry run to see what would be deleted
    $0 --dry-run

    # Delete backups older than 30 days
    $0 --days 30

    # Keep weekly backups for 90 days, daily for 30 days
    $0 --days 30 --weekly-days 90

    # Non-interactive cleanup
    $0 --force

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            usage
            exit 0
            ;;
        -d|--days)
            RETENTION_DAYS="$2"
            shift 2
            ;;
        -w|--weekly-days)
            WEEKLY_RETENTION_DAYS="$2"
            shift 2
            ;;
        -n|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -f|--force|-y|--yes)
            INTERACTIVE=false
            shift
            ;;
        *)
            echo "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Backup Cleanup${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

if [ ! -d "$BACKUP_DIR" ]; then
    log_error "Backup directory does not exist: $BACKUP_DIR"
    exit 1
fi

log_info "Backup directory: $BACKUP_DIR"
log_info "Daily backup retention: $RETENTION_DAYS days"
log_info "Weekly backup retention: $WEEKLY_RETENTION_DAYS days"

if [ "$DRY_RUN" = "true" ]; then
    log_warn "DRY RUN MODE - No files will be deleted"
fi
echo ""

# Find files to delete
DAILY_DELETE_COUNT=0
WEEKLY_DELETE_COUNT=0
TOTAL_SIZE=0

echo -e "${YELLOW}Scanning for old backups...${NC}"
echo ""

# Daily backups
echo "Daily backups older than $RETENTION_DAYS days:"
while IFS= read -r -d '' file; do
    if [[ $(basename "$file") =~ _daily_ ]]; then
        SIZE=$(stat -c%s "$file" 2>/dev/null || stat -f%z "$file" 2>/dev/null || echo "0")
        TOTAL_SIZE=$((TOTAL_SIZE + SIZE))
        ((DAILY_DELETE_COUNT++))
        echo "  - $(basename "$file") ($(du -h "$file" | cut -f1))"
    fi
done < <(find "$BACKUP_DIR" -name "politicianfinder_*_daily_*.sql.gz*" -type f -mtime +${RETENTION_DAYS} -print0 2>/dev/null)

if [ $DAILY_DELETE_COUNT -eq 0 ]; then
    echo "  None found"
fi
echo ""

# Weekly backups
echo "Weekly backups older than $WEEKLY_RETENTION_DAYS days:"
while IFS= read -r -d '' file; do
    if [[ $(basename "$file") =~ _weekly_ ]]; then
        SIZE=$(stat -c%s "$file" 2>/dev/null || stat -f%z "$file" 2>/dev/null || echo "0")
        TOTAL_SIZE=$((TOTAL_SIZE + SIZE))
        ((WEEKLY_DELETE_COUNT++))
        echo "  - $(basename "$file") ($(du -h "$file" | cut -f1))"
    fi
done < <(find "$BACKUP_DIR" -name "politicianfinder_*_weekly_*.sql.gz*" -type f -mtime +${WEEKLY_RETENTION_DAYS} -print0 2>/dev/null)

if [ $WEEKLY_DELETE_COUNT -eq 0 ]; then
    echo "  None found"
fi
echo ""

# Manual/test backups (same retention as daily)
MANUAL_DELETE_COUNT=0
echo "Manual/test backups older than $RETENTION_DAYS days:"
while IFS= read -r -d '' file; do
    if [[ $(basename "$file") =~ _(manual|test)_ ]]; then
        SIZE=$(stat -c%s "$file" 2>/dev/null || stat -f%z "$file" 2>/dev/null || echo "0")
        TOTAL_SIZE=$((TOTAL_SIZE + SIZE))
        ((MANUAL_DELETE_COUNT++))
        echo "  - $(basename "$file") ($(du -h "$file" | cut -f1))"
    fi
done < <(find "$BACKUP_DIR" -name "politicianfinder_*.sql.gz*" -type f -mtime +${RETENTION_DAYS} -print0 2>/dev/null)

if [ $MANUAL_DELETE_COUNT -eq 0 ]; then
    echo "  None found"
fi
echo ""

# Summary
TOTAL_DELETE_COUNT=$((DAILY_DELETE_COUNT + WEEKLY_DELETE_COUNT + MANUAL_DELETE_COUNT))

echo -e "${BLUE}Summary:${NC}"
echo "  Daily backups to delete:  $DAILY_DELETE_COUNT"
echo "  Weekly backups to delete: $WEEKLY_DELETE_COUNT"
echo "  Manual backups to delete: $MANUAL_DELETE_COUNT"
echo "  Total files to delete:    $TOTAL_DELETE_COUNT"

if [ $TOTAL_SIZE -gt 0 ]; then
    TOTAL_SIZE_HUMAN=$(echo $TOTAL_SIZE | awk '{
        split("B KB MB GB TB", units);
        for (i=5; i>1; i--) {
            if ($1 >= 1024^(i-1)) {
                printf "%.2f %s", $1/(1024^(i-1)), units[i];
                exit;
            }
        }
        printf "%.2f %s", $1, units[1];
    }')
    echo "  Space to be freed:        $TOTAL_SIZE_HUMAN"
fi
echo ""

if [ $TOTAL_DELETE_COUNT -eq 0 ]; then
    log_info "No old backups to delete"
    exit 0
fi

if [ "$DRY_RUN" = "true" ]; then
    log_warn "DRY RUN - No files were deleted"
    exit 0
fi

# Confirmation
if [ "$INTERACTIVE" = "true" ]; then
    echo -e "${YELLOW}Are you sure you want to delete these $TOTAL_DELETE_COUNT backup file(s)?${NC}"
    read -p "Type 'yes' to confirm: " confirmation

    if [ "$confirmation" != "yes" ]; then
        log_info "Cleanup cancelled"
        exit 0
    fi
    echo ""
fi

# Perform deletion
log_info "Deleting old backups..."

DELETED_COUNT=0
FAILED_COUNT=0

# Delete daily backups
while IFS= read -r -d '' file; do
    if [[ $(basename "$file") =~ _daily_ ]]; then
        if rm "$file" 2>/dev/null; then
            ((DELETED_COUNT++))
            log_info "Deleted: $(basename "$file")"
        else
            ((FAILED_COUNT++))
            log_error "Failed to delete: $(basename "$file")"
        fi
    fi
done < <(find "$BACKUP_DIR" -name "politicianfinder_*_daily_*.sql.gz*" -type f -mtime +${RETENTION_DAYS} -print0 2>/dev/null)

# Delete weekly backups
while IFS= read -r -d '' file; do
    if [[ $(basename "$file") =~ _weekly_ ]]; then
        if rm "$file" 2>/dev/null; then
            ((DELETED_COUNT++))
            log_info "Deleted: $(basename "$file")"
        else
            ((FAILED_COUNT++))
            log_error "Failed to delete: $(basename "$file")"
        fi
    fi
done < <(find "$BACKUP_DIR" -name "politicianfinder_*_weekly_*.sql.gz*" -type f -mtime +${WEEKLY_RETENTION_DAYS} -print0 2>/dev/null)

# Delete manual/test backups
while IFS= read -r -d '' file; do
    if [[ $(basename "$file") =~ _(manual|test)_ ]]; then
        if rm "$file" 2>/dev/null; then
            ((DELETED_COUNT++))
            log_info "Deleted: $(basename "$file")"
        else
            ((FAILED_COUNT++))
            log_error "Failed to delete: $(basename "$file")"
        fi
    fi
done < <(find "$BACKUP_DIR" -name "politicianfinder_*.sql.gz*" -type f -mtime +${RETENTION_DAYS} -print0 2>/dev/null)

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Cleanup completed${NC}"
echo -e "${GREEN}========================================${NC}"
echo "  Files deleted:  $DELETED_COUNT"
if [ $FAILED_COUNT -gt 0 ]; then
    echo -e "  ${RED}Files failed:   $FAILED_COUNT${NC}"
fi
echo ""
