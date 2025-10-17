# Database Backup Scripts

This directory contains automated database backup and restore scripts for the PoliticianFinder project.

## Scripts Overview

### Core Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `backup-db.sh` | Create database backups | `./backup-db.sh` |
| `restore-db.sh` | Restore database from backup | `./restore-db.sh` |
| `test-backup.sh` | Test backup functionality | `./test-backup.sh` |
| `list-backups.sh` | List available backups | `./list-backups.sh` |
| `cleanup-backups.sh` | Clean up old backups | `./cleanup-backups.sh` |

## Quick Start

### 1. Setup Environment

```bash
# Set database connection
export SUPABASE_DB_URL="postgresql://user:password@host:port/database"

# Set backup directory (optional)
export BACKUP_DIR="./backups"
```

### 2. Create a Backup

```bash
# Basic backup
./scripts/backup-db.sh

# Encrypted backup
export ENCRYPTION_ENABLED="true"
export ENCRYPTION_PASSWORD="your-secure-password"
./scripts/backup-db.sh
```

### 3. List Backups

```bash
./scripts/list-backups.sh
```

### 4. Restore from Backup

```bash
# Interactive restore
./scripts/restore-db.sh

# Restore specific backup
./scripts/restore-db.sh -b politicianfinder_daily_20250117_000000.sql.gz

# Dry run (test without changes)
./scripts/restore-db.sh --dry-run
```

### 5. Test Backup System

```bash
./scripts/test-backup.sh
```

### 6. Cleanup Old Backups

```bash
# Dry run to see what would be deleted
./scripts/cleanup-backups.sh --dry-run

# Delete backups older than 30 days
./scripts/cleanup-backups.sh --days 30
```

## Script Details

### backup-db.sh

Creates compressed database backups with optional encryption.

**Features:**
- Full PostgreSQL database dump
- Gzip compression
- Optional AES-256 encryption
- Automated cleanup of old backups
- Detailed logging

**Environment Variables:**
- `SUPABASE_DB_URL` (required) - Database connection URL
- `BACKUP_DIR` (optional) - Backup directory, default: `./backups`
- `BACKUP_TYPE` (optional) - Backup type: `daily`, `weekly`, `manual`
- `BACKUP_RETENTION_DAYS` (optional) - Days to keep backups, default: 30
- `ENCRYPTION_ENABLED` (optional) - Enable encryption, default: `false`
- `ENCRYPTION_PASSWORD` (optional) - Encryption password

**Example:**
```bash
export SUPABASE_DB_URL="postgresql://..."
export BACKUP_TYPE="manual"
export ENCRYPTION_ENABLED="true"
export ENCRYPTION_PASSWORD="SecurePass123"
./scripts/backup-db.sh
```

### restore-db.sh

Restores database from backup files with safety checks.

**Features:**
- Interactive backup selection
- Decryption support
- Integrity verification
- Multiple confirmation prompts
- Dry-run mode

**Options:**
- `-h, --help` - Show help
- `-l, --list` - List available backups
- `-d, --dry-run` - Dry run without changes
- `-f, --force` - Skip confirmations
- `-b, --backup FILE` - Specify backup file

**Example:**
```bash
# Interactive restore
./scripts/restore-db.sh

# Restore specific file
./scripts/restore-db.sh -b backup.sql.gz

# Dry run test
./scripts/restore-db.sh --dry-run -b backup.sql.gz
```

### test-backup.sh

Tests the entire backup system functionality.

**Tests:**
1. Check script existence
2. Verify dependencies (pg_dump, psql, gzip)
3. Check environment variables
4. Test database connection
5. Create test backup
6. Verify backup file exists
7. Verify backup integrity
8. Verify backup content
9. Check backup logs

**Example:**
```bash
export SUPABASE_DB_URL="postgresql://..."
./scripts/test-backup.sh
```

### list-backups.sh

Lists all available backup files with details.

**Information Shown:**
- Filename
- File size
- Backup type (daily/weekly/manual)
- Creation date
- Encryption status

**Statistics:**
- Total backup count
- Total size
- Count by type
- Encrypted backup count

**Example:**
```bash
./scripts/list-backups.sh
```

### cleanup-backups.sh

Removes old backup files based on retention policy.

**Features:**
- Different retention for daily/weekly backups
- Dry-run mode
- Interactive confirmations
- Detailed deletion report

**Options:**
- `-h, --help` - Show help
- `-d, --days DAYS` - Daily backup retention (default: 30)
- `-w, --weekly-days DAYS` - Weekly backup retention (default: 90)
- `-n, --dry-run` - Show what would be deleted
- `-f, --force` - Skip confirmations

**Example:**
```bash
# Preview cleanup
./scripts/cleanup-backups.sh --dry-run

# Delete old backups
./scripts/cleanup-backups.sh --days 30 --weekly-days 90

# Non-interactive cleanup
./scripts/cleanup-backups.sh --force
```

## Automated Backups

Backups are automatically created via GitHub Actions:

- **Daily**: Every day at 00:00 UTC
- **Weekly**: Every Sunday at 00:00 UTC
- **Manual**: Triggered via GitHub Actions UI

See `.github/workflows/backup.yml` for workflow configuration.

## Backup File Format

```
politicianfinder_{type}_{timestamp}.sql.gz[.enc]
```

Examples:
- `politicianfinder_daily_20250117_000000.sql.gz`
- `politicianfinder_weekly_20250117_000000.sql.gz.enc` (encrypted)

## Security

### Database Credentials

- Use environment variables for connection strings
- Never commit credentials to version control
- Use GitHub Secrets for CI/CD workflows

### Encryption

Backups can be encrypted with AES-256-CBC:

```bash
export ENCRYPTION_ENABLED="true"
export ENCRYPTION_PASSWORD="your-secure-password"
./scripts/backup-db.sh
```

To restore encrypted backups:

```bash
export ENCRYPTION_PASSWORD="your-secure-password"
./scripts/restore-db.sh -b backup.sql.gz.enc
```

**Warning:** Lost encryption passwords cannot be recovered!

## Troubleshooting

### Common Issues

**1. "pg_dump: command not found"**
```bash
# Install PostgreSQL client tools
sudo apt-get install postgresql-client  # Ubuntu/Debian
brew install postgresql                  # macOS
```

**2. "Connection refused"**
```bash
# Verify database URL
echo $SUPABASE_DB_URL

# Test connection
psql "$SUPABASE_DB_URL" -c "SELECT version();"
```

**3. "Permission denied"**
```bash
# Make scripts executable
chmod +x scripts/*.sh
```

**4. "Backup file corrupted"**
```bash
# Verify integrity
gzip -t backup.sql.gz

# Re-create backup
./scripts/backup-db.sh
```

### Debug Mode

Enable verbose logging:

```bash
set -x  # Add to script
./scripts/backup-db.sh 2>&1 | tee debug.log
```

## Prerequisites

### Required Tools

- PostgreSQL client tools (`pg_dump`, `psql`)
- gzip/gunzip
- Bash 4.0+

### Optional Tools

- OpenSSL (for encryption)
- `stat` command (for file info)

### Installation

**Ubuntu/Debian:**
```bash
sudo apt-get install postgresql-client gzip openssl
```

**macOS:**
```bash
brew install postgresql gzip openssl
```

**Windows (MSYS2/Git Bash):**
```bash
pacman -S mingw-w64-x86_64-postgresql
```

## Best Practices

1. **Regular Testing**: Test restore procedures monthly
2. **Multiple Locations**: Store backups in multiple locations
3. **Encryption**: Use encryption for sensitive data
4. **Monitoring**: Set up alerts for failed backups
5. **Documentation**: Keep backup procedures documented
6. **Retention**: Follow 3-2-1 backup rule
7. **Verification**: Always verify backup integrity

## Support

For detailed documentation, see:
- [BACKUP_GUIDE.md](../BACKUP_GUIDE.md) - Complete backup guide
- [GitHub Actions Workflow](../.github/workflows/backup.yml) - Automated backup workflow

For issues:
- Check script logs in `backups/*.log`
- Review GitHub Actions logs
- Create an issue in the repository

## Maintenance

### Weekly Tasks
- [ ] Review backup logs
- [ ] Verify backup integrity
- [ ] Check available storage

### Monthly Tasks
- [ ] Test restore procedure
- [ ] Review retention policy
- [ ] Update documentation

### Quarterly Tasks
- [ ] Full disaster recovery drill
- [ ] Review and update scripts
- [ ] Audit backup security

## License

These scripts are part of the PoliticianFinder project.

---

**Last Updated**: 2025-01-17
