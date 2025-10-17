#!/bin/bash

##############################################################################
# Database Backup Script for PoliticianFinder
#
# This script performs automated backups of the Supabase PostgreSQL database
# Features:
# - Full database dump
# - Compression (gzip)
# - Date-stamped backup files
# - Error handling and logging
# - Encryption support (optional)
##############################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable
set -o pipefail  # Exit on pipe failure

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_TYPE="${BACKUP_TYPE:-daily}"  # daily, weekly, manual
BACKUP_FILENAME="politicianfinder_${BACKUP_TYPE}_${TIMESTAMP}.sql"
COMPRESSED_FILENAME="${BACKUP_FILENAME}.gz"
LOG_FILE="${BACKUP_DIR}/backup.log"
ENCRYPTION_ENABLED="${ENCRYPTION_ENABLED:-false}"
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

# Parse database URL
parse_db_url() {
    if [ -z "$DB_URL" ]; then
        log_error "SUPABASE_DB_URL is not set"
        exit 1
    fi

    # Parse PostgreSQL connection string
    # Format: postgresql://user:password@host:port/database

    # Extract using regex-like parsing
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

# Create backup directory if it doesn't exist
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        log_info "Created backup directory: $BACKUP_DIR"
    fi
}

# Check if pg_dump is available
check_dependencies() {
    if ! command -v pg_dump &> /dev/null; then
        log_error "pg_dump is not installed. Please install PostgreSQL client tools."
        exit 1
    fi

    if ! command -v gzip &> /dev/null; then
        log_error "gzip is not installed. Please install gzip."
        exit 1
    fi

    log_info "All dependencies are available"
}

# Perform database backup
perform_backup() {
    local backup_path="${BACKUP_DIR}/${BACKUP_FILENAME}"
    local compressed_path="${BACKUP_DIR}/${COMPRESSED_FILENAME}"

    log_info "Starting ${BACKUP_TYPE} backup..."
    log_info "Backup file: ${COMPRESSED_FILENAME}"

    # Set password for pg_dump
    export PGPASSWORD="$DB_PASSWORD"

    # Perform backup with pg_dump
    if pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --verbose \
        --no-owner \
        --no-acl \
        --clean \
        --if-exists \
        --format=plain \
        --file="$backup_path" 2>> "$LOG_FILE"; then

        log_info "Database dump completed successfully"
    else
        log_error "Database dump failed"
        unset PGPASSWORD
        exit 1
    fi

    # Unset password
    unset PGPASSWORD

    # Compress backup
    log_info "Compressing backup..."
    if gzip -f "$backup_path"; then
        log_info "Backup compressed successfully"
    else
        log_error "Backup compression failed"
        exit 1
    fi

    # Encrypt backup if enabled
    if [ "$ENCRYPTION_ENABLED" = "true" ]; then
        encrypt_backup "$compressed_path"
    fi

    # Get file size
    local file_size=$(du -h "$compressed_path" 2>/dev/null | cut -f1 || echo "unknown")
    log_info "Backup completed: ${COMPRESSED_FILENAME} (${file_size})"

    echo "$compressed_path"
}

# Encrypt backup file
encrypt_backup() {
    local file_path=$1
    local encrypted_path="${file_path}.enc"

    if [ -z "$ENCRYPTION_PASSWORD" ]; then
        log_warn "Encryption enabled but no password set. Skipping encryption."
        return
    fi

    log_info "Encrypting backup..."

    if command -v openssl &> /dev/null; then
        if openssl enc -aes-256-cbc -salt -pbkdf2 -in "$file_path" -out "$encrypted_path" -pass pass:"$ENCRYPTION_PASSWORD"; then
            rm "$file_path"
            log_info "Backup encrypted successfully: $(basename $encrypted_path)"
        else
            log_error "Backup encryption failed"
            return 1
        fi
    else
        log_warn "OpenSSL not available. Skipping encryption."
    fi
}

# Verify backup integrity
verify_backup() {
    local backup_path=$1

    log_info "Verifying backup integrity..."

    if [ -f "$backup_path" ]; then
        if gzip -t "$backup_path" 2>/dev/null; then
            log_info "Backup integrity verified successfully"
            return 0
        else
            log_error "Backup integrity check failed"
            return 1
        fi
    else
        log_error "Backup file not found: $backup_path"
        return 1
    fi
}

# Cleanup old backups
cleanup_old_backups() {
    local retention_days=${BACKUP_RETENTION_DAYS:-30}

    log_info "Cleaning up backups older than ${retention_days} days..."

    # Find and delete old backup files
    local deleted_count=0
    while IFS= read -r -d '' file; do
        rm "$file"
        log_info "Deleted old backup: $(basename $file)"
        ((deleted_count++))
    done < <(find "$BACKUP_DIR" -name "politicianfinder_*.sql.gz*" -type f -mtime +${retention_days} -print0 2>/dev/null)

    if [ $deleted_count -eq 0 ]; then
        log_info "No old backups to delete"
    else
        log_info "Deleted $deleted_count old backup(s)"
    fi
}

# Generate backup report
generate_report() {
    local backup_path=$1
    local backup_size=$(du -h "$backup_path" 2>/dev/null | cut -f1 || echo "unknown")
    local end_time=$(date '+%Y-%m-%d %H:%M:%S')

    cat << EOF

========================================
Database Backup Report
========================================
Backup Type: ${BACKUP_TYPE}
Timestamp: ${TIMESTAMP}
Database: ${DB_NAME}
Host: ${DB_HOST}
Backup File: ${COMPRESSED_FILENAME}
File Size: ${backup_size}
Encryption: ${ENCRYPTION_ENABLED}
Completed At: ${end_time}
Status: SUCCESS
========================================

EOF
}

# Main execution
main() {
    log_info "=========================================="
    log_info "Starting Database Backup Process"
    log_info "=========================================="

    # Create backup directory
    create_backup_dir

    # Check dependencies
    check_dependencies

    # Parse database URL
    parse_db_url

    # Perform backup
    backup_path=$(perform_backup)

    # Verify backup (skip if encrypted)
    if [ "$ENCRYPTION_ENABLED" != "true" ]; then
        verify_backup "$backup_path"
    fi

    # Cleanup old backups
    cleanup_old_backups

    # Generate report
    generate_report "$backup_path"

    log_info "Backup process completed successfully"
    log_info "=========================================="

    # Exit with success
    exit 0
}

# Trap errors
trap 'log_error "Backup failed with error on line $LINENO"; exit 1' ERR

# Run main function
main "$@"
