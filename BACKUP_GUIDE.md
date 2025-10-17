# Database Backup Guide

## Overview

This guide explains the automated database backup system for the PoliticianFinder project. The system provides reliable, scheduled backups of your Supabase PostgreSQL database with encryption support, automated cleanup, and easy restoration.

## Table of Contents

- [Backup System Architecture](#backup-system-architecture)
- [Setup Instructions](#setup-instructions)
- [Automated Backups](#automated-backups)
- [Manual Backups](#manual-backups)
- [Restoring from Backup](#restoring-from-backup)
- [Backup Management](#backup-management)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)

## Backup System Architecture

### Components

1. **Backup Script** (`scripts/backup-db.sh`)
   - Performs PostgreSQL database dumps
   - Compresses backup files with gzip
   - Optional encryption with AES-256
   - Cleanup of old backups
   - Detailed logging

2. **Restore Script** (`scripts/restore-db.sh`)
   - Interactive backup selection
   - Decryption of encrypted backups
   - Integrity verification
   - Safe restore with confirmations

3. **GitHub Actions Workflow** (`.github/workflows/backup.yml`)
   - Daily automated backups (midnight UTC)
   - Weekly full backups (Sunday midnight UTC)
   - Manual trigger capability
   - Backup integrity testing
   - Automated notifications

### Backup Naming Convention

```
politicianfinder_{type}_{timestamp}.sql.gz[.enc]
```

Examples:
- `politicianfinder_daily_20250117_000000.sql.gz`
- `politicianfinder_weekly_20250117_000000.sql.gz`
- `politicianfinder_manual_20250117_143000.sql.gz.enc` (encrypted)

## Setup Instructions

### 1. Prerequisites

- PostgreSQL client tools (`pg_dump`, `psql`)
- gzip/gunzip
- OpenSSL (for encryption, optional)
- Bash 4.0+

### 2. Environment Configuration

Create or update your environment variables:

```bash
# Required
export SUPABASE_DB_URL="postgresql://user:password@host:port/database"

# Optional
export BACKUP_DIR="./backups"                    # Default: ./backups
export BACKUP_RETENTION_DAYS="30"                # Default: 30 days
export ENCRYPTION_ENABLED="false"                # Default: false
export ENCRYPTION_PASSWORD="your-secure-password" # Required if encryption is enabled
```

### 3. GitHub Secrets Configuration

Add the following secrets to your GitHub repository:

1. Go to Settings > Secrets and variables > Actions
2. Add new repository secrets:

   - `SUPABASE_DB_URL` (Required)
     ```
     postgresql://postgres:your-password@db.your-project.supabase.co:5432/postgres
     ```

   - `BACKUP_ENCRYPTION_PASSWORD` (Optional, for encrypted backups)
     ```
     your-very-secure-encryption-password
     ```

### 4. Script Permissions

Make scripts executable:

```bash
chmod +x scripts/backup-db.sh
chmod +x scripts/restore-db.sh
```

### 5. Test Installation

Run a test backup:

```bash
cd "G:\내 드라이브\Developement\PoliticianFinder"
export SUPABASE_DB_URL="your-database-url"
export BACKUP_TYPE="manual"
./scripts/backup-db.sh
```

## Automated Backups

### Schedule

- **Daily Backups**: Every day at 00:00 UTC (9:00 AM KST)
- **Weekly Backups**: Every Sunday at 00:00 UTC (9:00 AM KST)

### Backup Retention

- **GitHub Artifacts**: 30 days
- **Weekly Release Backups**: Indefinite (until manually deleted)
- **Old Local Backups**: Auto-deleted after 30 days

### Monitoring

1. **GitHub Actions**
   - Navigate to Actions tab
   - Look for "Database Backup" workflow
   - Check recent runs for status

2. **Notifications**
   - Failed backups automatically create GitHub issues
   - Issue includes error details and action items

3. **Artifacts**
   - Backup files stored as GitHub artifacts
   - Download from Actions > Workflow Run > Artifacts

## Manual Backups

### Via GitHub Actions

1. Go to Actions > Database Backup
2. Click "Run workflow"
3. Select options:
   - Backup type: `daily`, `weekly`, or `manual`
   - Encryption: Enable/disable
4. Click "Run workflow"

### Via Command Line

#### Basic Backup

```bash
export SUPABASE_DB_URL="your-database-url"
export BACKUP_TYPE="manual"
./scripts/backup-db.sh
```

#### Encrypted Backup

```bash
export SUPABASE_DB_URL="your-database-url"
export BACKUP_TYPE="manual"
export ENCRYPTION_ENABLED="true"
export ENCRYPTION_PASSWORD="your-secure-password"
./scripts/backup-db.sh
```

#### Custom Backup Directory

```bash
export SUPABASE_DB_URL="your-database-url"
export BACKUP_DIR="/path/to/custom/backup/directory"
./scripts/backup-db.sh
```

## Restoring from Backup

### Interactive Restore (Recommended)

```bash
export SUPABASE_DB_URL="your-database-url"
./scripts/restore-db.sh
```

The script will:
1. Display available backups
2. Prompt you to select a backup
3. Ask for confirmation (includes database name verification)
4. Restore the database
5. Verify the restoration

### Restore Specific Backup

```bash
export SUPABASE_DB_URL="your-database-url"
./scripts/restore-db.sh -b politicianfinder_daily_20250117_000000.sql.gz
```

### Restore Encrypted Backup

```bash
export SUPABASE_DB_URL="your-database-url"
export ENCRYPTION_PASSWORD="your-encryption-password"
./scripts/restore-db.sh -b politicianfinder_daily_20250117_000000.sql.gz.enc
```

### Dry Run (Test Mode)

Test restore without making changes:

```bash
export SUPABASE_DB_URL="your-database-url"
./scripts/restore-db.sh --dry-run -b backup.sql.gz
```

### Force Restore (Skip Confirmations)

**WARNING**: Use with extreme caution!

```bash
export SUPABASE_DB_URL="your-database-url"
export FORCE="true"
./scripts/restore-db.sh -b backup.sql.gz
```

## Backup Management

### List Available Backups

```bash
./scripts/restore-db.sh --list
```

### Download Backup from GitHub

1. Go to Actions > Database Backup workflow
2. Select a workflow run
3. Scroll to Artifacts section
4. Download the backup artifact

### Manual Cleanup

Delete backups older than 30 days:

```bash
find backups/ -name "politicianfinder_*.sql.gz*" -type f -mtime +30 -delete
```

### Verify Backup Integrity

```bash
# Test gzip integrity
gzip -t backups/politicianfinder_daily_20250117_000000.sql.gz

# View backup contents
gunzip -c backups/politicianfinder_daily_20250117_000000.sql.gz | less
```

## Security Considerations

### 1. Database Credentials

- **Never commit** database URLs or passwords to version control
- Use GitHub Secrets for CI/CD
- Use environment variables for local operations
- Rotate credentials regularly

### 2. Backup Encryption

Encrypted backups provide additional security:

```bash
# Enable encryption
export ENCRYPTION_ENABLED="true"
export ENCRYPTION_PASSWORD="complex-secure-password-123"
```

**Encryption Algorithm**: AES-256-CBC with PBKDF2

**Important**: Store encryption password securely. Lost passwords cannot be recovered!

### 3. Access Control

- Limit access to backup files
- Use GitHub repository permissions
- Implement least-privilege principle
- Audit backup access regularly

### 4. Backup Storage

- GitHub Artifacts: Encrypted at rest
- Local backups: Store in secure directory
- Consider off-site backup storage
- Implement backup redundancy

### 5. Supabase Built-in Backups

Supabase provides automatic backups:
- **Free Plan**: Daily backups, 7-day retention
- **Pro Plan**: Daily backups, 30-day retention
- **Team/Enterprise**: Customizable retention

Access via:
1. Supabase Dashboard
2. Project Settings > Backups
3. Download or restore directly

**Best Practice**: Use both Supabase backups AND this automated system for redundancy.

## Troubleshooting

### Common Issues

#### 1. "pg_dump: command not found"

**Solution**: Install PostgreSQL client tools

```bash
# Ubuntu/Debian
sudo apt-get install postgresql-client

# macOS
brew install postgresql

# Windows (via MSYS2/Git Bash)
pacman -S mingw-w64-x86_64-postgresql
```

#### 2. "Failed to parse database URL"

**Solution**: Check SUPABASE_DB_URL format

```bash
# Correct format
postgresql://postgres:password@db.project.supabase.co:5432/postgres

# Common mistakes
postgres://...  # Should be postgresql://
missing :5432   # Include port number
```

#### 3. "Connection refused"

**Solution**: Verify database connectivity

```bash
# Test connection
psql "$SUPABASE_DB_URL" -c "SELECT version();"

# Check firewall/network
ping db.your-project.supabase.co

# Verify Supabase project is running
# Check Supabase Dashboard
```

#### 4. "Permission denied"

**Solution**: Check database user permissions

```bash
# User needs these permissions:
# - SELECT on all tables
# - USAGE on schemas
# - For restore: CREATE, DROP privileges

# Grant permissions (as superuser)
GRANT ALL PRIVILEGES ON DATABASE dbname TO username;
```

#### 5. "Backup file corrupted"

**Solution**: Verify integrity and re-run backup

```bash
# Test integrity
gzip -t backup.sql.gz

# If corrupted, run new backup
./scripts/backup-db.sh
```

#### 6. "Decryption failed"

**Solution**: Verify encryption password

```bash
# Ensure correct password
export ENCRYPTION_PASSWORD="exact-password-used-for-encryption"

# Test decryption manually
openssl enc -aes-256-cbc -d -pbkdf2 \
  -in backup.sql.gz.enc \
  -out backup.sql.gz \
  -pass pass:"$ENCRYPTION_PASSWORD"
```

#### 7. GitHub Actions workflow fails

**Solution**: Check workflow logs and secrets

1. Verify `SUPABASE_DB_URL` secret is set correctly
2. Check workflow logs for specific error
3. Test backup script locally
4. Verify PostgreSQL client is installed in workflow

### Debug Mode

Enable verbose logging:

```bash
# Add to script
set -x  # Enable debug mode

# Run with explicit logging
./scripts/backup-db.sh 2>&1 | tee backup-debug.log
```

### Log Files

- Backup logs: `backups/backup.log`
- Restore logs: `backups/restore.log`
- GitHub Actions logs: Actions > Workflow Run > View logs

### Getting Help

If you encounter persistent issues:

1. Check logs for error messages
2. Review this troubleshooting section
3. Verify all prerequisites are installed
4. Test database connectivity
5. Create a GitHub issue with:
   - Error message
   - Log file excerpts
   - Steps to reproduce
   - Environment details

## Backup Testing

### Regular Test Schedule

Perform restore tests regularly (recommended: monthly)

```bash
# 1. Create test database
createdb politician_test

# 2. Modify DB_URL to test database
export SUPABASE_DB_URL="postgresql://...politician_test"

# 3. Restore to test database
./scripts/restore-db.sh -b latest-backup.sql.gz

# 4. Verify data
psql "$SUPABASE_DB_URL" -c "SELECT COUNT(*) FROM politicians;"

# 5. Clean up
dropdb politician_test
```

### Automated Testing

The GitHub Actions workflow includes automated integrity testing:

- Gzip integrity check
- SQL content verification
- Runs after each backup

## Best Practices

1. **Regular Testing**: Test restore procedures monthly
2. **Multiple Backup Locations**: Use both local and cloud storage
3. **Version Control**: Keep backup scripts in version control
4. **Documentation**: Update this guide when making changes
5. **Monitoring**: Set up alerts for failed backups
6. **Encryption**: Use encryption for sensitive data
7. **Retention Policy**: Follow the 3-2-1 rule
   - 3 copies of data
   - 2 different storage types
   - 1 off-site backup
8. **Access Control**: Limit who can access backups
9. **Audit Trail**: Keep logs of backup operations
10. **Disaster Recovery Plan**: Document full recovery procedures

## Backup Restoration Checklist

Use this checklist when performing a restore:

- [ ] Identify the correct backup file
- [ ] Verify backup integrity (`gzip -t`)
- [ ] Create backup of current database (backup before restore)
- [ ] Notify team about upcoming restore
- [ ] Put application in maintenance mode
- [ ] Set environment variables correctly
- [ ] Run restore script
- [ ] Verify restoration success
- [ ] Test critical functionality
- [ ] Remove maintenance mode
- [ ] Monitor application logs
- [ ] Document restore operation

## Additional Resources

- [Supabase Backup Documentation](https://supabase.com/docs/guides/platform/backups)
- [PostgreSQL Backup Documentation](https://www.postgresql.org/docs/current/backup.html)
- [GitHub Actions Artifacts](https://docs.github.com/en/actions/using-workflows/storing-workflow-data-as-artifacts)

## Contact

For questions or issues:

- Create an issue in the GitHub repository
- Check existing issues for similar problems
- Review workflow logs in GitHub Actions

---

**Last Updated**: 2025-01-17
**Version**: 1.0.0
