#!/bin/bash

##############################################################################
# Database Restore Script for PoliticianFinder
#
# This script restores the Supabase PostgreSQL database from backup files
# Features:
# - Restore from compressed backup files
# - Decryption support (optional)
# - Pre-restore validation
# - Confirmation prompts
# - Dry-run mode
##############################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable
set -o pipefail  # Exit on pipe failure

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
LOG_FILE="${BACKUP_DIR}/restore.log"
DRY_RUN="${DRY_RUN:-false}"
FORCE="${FORCE:-false}"
ENCRYPTION_PASSWORD="${ENCRYPTION_PASSWORD:-}"

# Supabase connection details
DB_URL="${SUPABASE_DB_URL:-}"
DB_HOST=""
DB_PORT=""
DB_NAME=""
DB_USER=""
DB_PASSWORD=""

# Function to log messages
log() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" | tee -a "$LOG_FILE"
}

# Function to log colored messages to console
log_info() {
    echo -e "${GREEN}[INFO]${NC} $@"
    log "INFO" "$@"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $@"
    log "WARN" "$@"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $@"
    log "ERROR" "$@"
}

log_question() {
    echo -e "${BLUE}[QUESTION]${NC} $@"
}

# Parse database URL
parse_db_url() {
    if [ -z "$DB_URL" ]; then
        log_error "SUPABASE_DB_URL is not set"
        exit 1
    fi

    # Parse PostgreSQL connection string
    DB_USER=$(echo "$DB_URL" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
    DB_PASSWORD=$(echo "$DB_URL" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
    DB_HOST=$(echo "$DB_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo "$DB_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    DB_NAME=$(echo "$DB_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')

    if [ -z "$DB_USER" ] || [ -z "$DB_HOST" ] || [ -z "$DB_NAME" ]; then
        log_error "Failed to parse database URL"
        exit 1
    fi

    log_info "Database connection parsed successfully"
}

# Check if psql is available
check_dependencies() {
    if ! command -v psql &> /dev/null; then
        log_error "psql is not installed. Please install PostgreSQL client tools."
        exit 1
    fi

    if ! command -v gunzip &> /dev/null; then
        log_error "gunzip is not installed. Please install gzip."
        exit 1
    fi

    log_info "All dependencies are available"
}

# List available backups
list_backups() {
    log_info "Available backups in ${BACKUP_DIR}:"
    echo ""

    local count=0
    while IFS= read -r file; do
        ((count++))
        local filename=$(basename "$file")
        local size=$(du -h "$file" | cut -f1)
        local date=$(stat -c '%y' "$file" 2>/dev/null | cut -d' ' -f1 || stat -f '%Sm' -t '%Y-%m-%d' "$file" 2>/dev/null || echo "unknown")
        printf "  %2d) %-50s %8s  %s\n" "$count" "$filename" "$size" "$date"
    done < <(find "$BACKUP_DIR" -name "politicianfinder_*.sql.gz*" -type f -printf '%T@ %p\n' 2>/dev/null | sort -rn | cut -d' ' -f2- || \
             find "$BACKUP_DIR" -name "politicianfinder_*.sql.gz*" -type f 2>/dev/null)

    echo ""

    if [ $count -eq 0 ]; then
        log_warn "No backup files found"
        exit 1
    fi

    return $count
}

# Select backup file
select_backup() {
    local backup_file="$1"

    if [ -n "$backup_file" ]; then
        # Backup file provided as argument
        if [ ! -f "$backup_file" ]; then
            # Try to find it in backup directory
            backup_file="${BACKUP_DIR}/${backup_file}"
            if [ ! -f "$backup_file" ]; then
                log_error "Backup file not found: $1"
                exit 1
            fi
        fi
    else
        # Interactive selection
        list_backups

        log_question "Enter the number of the backup to restore (or 'q' to quit): "
        read -r selection

        if [ "$selection" = "q" ]; then
            log_info "Restore cancelled by user"
            exit 0
        fi

        # Get the selected file
        backup_file=$(find "$BACKUP_DIR" -name "politicianfinder_*.sql.gz*" -type f -printf '%T@ %p\n' 2>/dev/null | sort -rn | cut -d' ' -f2- | sed -n "${selection}p" || \
                      find "$BACKUP_DIR" -name "politicianfinder_*.sql.gz*" -type f 2>/dev/null | sed -n "${selection}p")

        if [ -z "$backup_file" ] || [ ! -f "$backup_file" ]; then
            log_error "Invalid selection"
            exit 1
        fi
    fi

    echo "$backup_file"
}

# Decrypt backup if encrypted
decrypt_backup() {
    local encrypted_file=$1
    local decrypted_file="${encrypted_file%.enc}"

    if [[ "$encrypted_file" != *.enc ]]; then
        # Not encrypted
        echo "$encrypted_file"
        return
    fi

    log_info "Backup is encrypted. Decrypting..."

    if [ -z "$ENCRYPTION_PASSWORD" ]; then
        log_error "Encrypted backup requires ENCRYPTION_PASSWORD to be set"
        exit 1
    fi

    if ! command -v openssl &> /dev/null; then
        log_error "OpenSSL is required for decryption but not installed"
        exit 1
    fi

    if openssl enc -aes-256-cbc -d -pbkdf2 -in "$encrypted_file" -out "$decrypted_file" -pass pass:"$ENCRYPTION_PASSWORD"; then
        log_info "Backup decrypted successfully"
        echo "$decrypted_file"
    else
        log_error "Failed to decrypt backup"
        exit 1
    fi
}

# Verify backup integrity
verify_backup() {
    local backup_file=$1

    log_info "Verifying backup integrity..."

    if gzip -t "$backup_file" 2>/dev/null; then
        log_info "Backup integrity verified"
        return 0
    else
        log_error "Backup file is corrupted"
        return 1
    fi
}

# Get database size before restore
get_database_info() {
    export PGPASSWORD="$DB_PASSWORD"

    local table_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ' || echo "0")
    local db_size=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));" 2>/dev/null | tr -d ' ' || echo "unknown")

    unset PGPASSWORD

    echo "Tables: $table_count, Size: $db_size"
}

# Confirm restore operation
confirm_restore() {
    local backup_file=$1

    if [ "$FORCE" = "true" ]; then
        return 0
    fi

    log_warn "=========================================="
    log_warn "WARNING: Database Restore Operation"
    log_warn "=========================================="
    log_warn "This will DROP and RECREATE all database objects!"
    log_warn "All current data will be PERMANENTLY LOST!"
    log_warn ""
    log_warn "Database: ${DB_NAME}"
    log_warn "Host: ${DB_HOST}"
    log_warn "Backup: $(basename $backup_file)"
    log_warn "Current database info: $(get_database_info)"
    log_warn "=========================================="

    log_question "Are you ABSOLUTELY SURE you want to continue? Type 'yes' to proceed: "
    read -r confirmation

    if [ "$confirmation" != "yes" ]; then
        log_info "Restore cancelled by user"
        exit 0
    fi

    log_question "Please type the database name '${DB_NAME}' to confirm: "
    read -r db_confirmation

    if [ "$db_confirmation" != "$DB_NAME" ]; then
        log_error "Database name mismatch. Restore cancelled."
        exit 1
    fi

    log_info "Restore confirmed by user"
}

# Perform database restore
perform_restore() {
    local backup_file=$1
    local temp_sql_file="${BACKUP_DIR}/temp_restore_$$.sql"

    log_info "Starting database restore..."
    log_info "Backup file: $(basename $backup_file)"

    if [ "$DRY_RUN" = "true" ]; then
        log_info "DRY RUN MODE - No changes will be made"
        log_info "Would restore from: $backup_file"
        return 0
    fi

    # Decompress backup
    log_info "Decompressing backup..."
    if gunzip -c "$backup_file" > "$temp_sql_file"; then
        log_info "Backup decompressed successfully"
    else
        log_error "Failed to decompress backup"
        rm -f "$temp_sql_file"
        exit 1
    fi

    # Set password for psql
    export PGPASSWORD="$DB_PASSWORD"

    # Perform restore
    log_info "Restoring database (this may take several minutes)..."
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$temp_sql_file" 2>> "$LOG_FILE"; then
        log_info "Database restore completed successfully"
    else
        log_error "Database restore failed. Check log file: $LOG_FILE"
        unset PGPASSWORD
        rm -f "$temp_sql_file"
        exit 1
    fi

    # Unset password
    unset PGPASSWORD

    # Cleanup temporary file
    rm -f "$temp_sql_file"
    log_info "Cleaned up temporary files"
}

# Verify restore
verify_restore() {
    log_info "Verifying restore..."

    export PGPASSWORD="$DB_PASSWORD"

    local table_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ')

    unset PGPASSWORD

    log_info "Restored database contains $table_count tables"

    if [ "$table_count" -gt 0 ]; then
        log_info "Restore verification successful"
    else
        log_warn "No tables found in restored database. This might indicate an issue."
    fi
}

# Generate restore report
generate_report() {
    local backup_file=$1
    local end_time=$(date '+%Y-%m-%d %H:%M:%S')

    cat << EOF

========================================
Database Restore Report
========================================
Database: ${DB_NAME}
Host: ${DB_HOST}
Backup File: $(basename $backup_file)
Restored At: ${end_time}
Status: SUCCESS
Current database info: $(get_database_info)
========================================

EOF
}

# Usage information
usage() {
    cat << EOF
Usage: $0 [OPTIONS] [BACKUP_FILE]

Restore PoliticianFinder database from backup

OPTIONS:
    -h, --help              Show this help message
    -l, --list              List available backups
    -d, --dry-run           Perform dry run (no changes)
    -f, --force             Skip confirmation prompts
    -b, --backup FILE       Specify backup file to restore

ENVIRONMENT VARIABLES:
    SUPABASE_DB_URL         Database connection URL (required)
    BACKUP_DIR              Backup directory (default: ./backups)
    ENCRYPTION_PASSWORD     Password for encrypted backups
    DRY_RUN                 Set to 'true' for dry run
    FORCE                   Set to 'true' to skip confirmations

EXAMPLES:
    # Interactive restore (select from list)
    $0

    # Restore specific backup
    $0 -b politicianfinder_daily_20250117_120000.sql.gz

    # List available backups
    $0 --list

    # Dry run
    $0 --dry-run -b backup.sql.gz

EOF
}

# Main execution
main() {
    local backup_file=""

    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                usage
                exit 0
                ;;
            -l|--list)
                parse_db_url
                list_backups
                exit 0
                ;;
            -d|--dry-run)
                DRY_RUN=true
                shift
                ;;
            -f|--force)
                FORCE=true
                shift
                ;;
            -b|--backup)
                backup_file="$2"
                shift 2
                ;;
            *)
                backup_file="$1"
                shift
                ;;
        esac
    done

    log_info "=========================================="
    log_info "Starting Database Restore Process"
    log_info "=========================================="

    # Check dependencies
    check_dependencies

    # Parse database URL
    parse_db_url

    # Select backup file
    backup_file=$(select_backup "$backup_file")
    log_info "Selected backup: $(basename $backup_file)"

    # Decrypt if necessary
    backup_file=$(decrypt_backup "$backup_file")

    # Verify backup integrity
    verify_backup "$backup_file"

    # Confirm restore
    confirm_restore "$backup_file"

    # Perform restore
    perform_restore "$backup_file"

    # Verify restore
    if [ "$DRY_RUN" != "true" ]; then
        verify_restore
    fi

    # Generate report
    generate_report "$backup_file"

    log_info "Restore process completed successfully"
    log_info "=========================================="

    exit 0
}

# Trap errors
trap 'log_error "Restore failed with error on line $LINENO"; exit 1' ERR

# Run main function
main "$@"
