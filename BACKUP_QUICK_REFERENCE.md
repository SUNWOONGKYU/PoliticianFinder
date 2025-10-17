# Database Backup - Quick Reference

## Quick Start Commands

### Create Backup
```bash
export SUPABASE_DB_URL="postgresql://user:pass@host:5432/db"
./scripts/backup-db.sh
```

### List Backups
```bash
./scripts/list-backups.sh
```

### Restore Database
```bash
./scripts/restore-db.sh
```

### Test System
```bash
./scripts/test-backup.sh
```

### Cleanup Old Backups
```bash
./scripts/cleanup-backups.sh --dry-run
./scripts/cleanup-backups.sh --days 30
```

## Environment Variables

### Required
- `SUPABASE_DB_URL` - Database connection URL

### Optional
- `BACKUP_DIR` - Backup directory (default: ./backups)
- `BACKUP_TYPE` - daily/weekly/manual (default: daily)
- `ENCRYPTION_ENABLED` - true/false (default: false)
- `ENCRYPTION_PASSWORD` - Encryption password
- `BACKUP_RETENTION_DAYS` - Days to keep backups (default: 30)

## GitHub Actions

### Manual Trigger
1. Go to: Actions > Database Backup
2. Click: "Run workflow"
3. Select: Backup type and encryption
4. Click: "Run workflow"

### View Backups
1. Actions > Database Backup
2. Select workflow run
3. Download from Artifacts section

## Scheduled Backups

- **Daily**: 00:00 UTC (9:00 AM KST)
- **Weekly**: Sunday 00:00 UTC (9:00 AM KST)

## Common Tasks

### Encrypted Backup
```bash
export ENCRYPTION_ENABLED="true"
export ENCRYPTION_PASSWORD="SecurePass123"
./scripts/backup-db.sh
```

### Dry Run Restore
```bash
./scripts/restore-db.sh --dry-run -b backup.sql.gz
```

### Verify Backup
```bash
gzip -t backups/politicianfinder_*.sql.gz
```

### View Backup Content
```bash
gunzip -c backups/backup.sql.gz | less
```

## Troubleshooting

### Install PostgreSQL Client
```bash
# Ubuntu/Debian
sudo apt-get install postgresql-client

# macOS
brew install postgresql
```

### Test Connection
```bash
psql "$SUPABASE_DB_URL" -c "SELECT version();"
```

### Check Logs
```bash
cat backups/backup.log
cat backups/restore.log
```

## File Locations

- Scripts: `scripts/`
- Backups: `backups/`
- Workflow: `.github/workflows/backup.yml`
- Guide: `BACKUP_GUIDE.md`
- Report: `P2V3_BACKUP_IMPLEMENTATION_REPORT.md`

## Support

Full documentation: [BACKUP_GUIDE.md](BACKUP_GUIDE.md)
