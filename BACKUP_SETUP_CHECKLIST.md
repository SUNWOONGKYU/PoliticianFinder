# Database Backup System - Setup Checklist

Use this checklist to set up and verify the database backup system.

## Prerequisites

### Required Tools

- [ ] PostgreSQL client tools installed (`pg_dump`, `psql`)
- [ ] Gzip/gunzip installed
- [ ] Bash 4.0+ available
- [ ] Git installed
- [ ] GitHub repository access

### Optional Tools

- [ ] OpenSSL (for encryption)
- [ ] stat command (for file metadata)

## Initial Setup

### 1. GitHub Configuration

- [ ] Navigate to repository Settings
- [ ] Go to Secrets and variables > Actions
- [ ] Add `SUPABASE_DB_URL` secret
  - Format: `postgresql://user:password@host:5432/database`
  - Get from: Supabase Dashboard > Project Settings > Database
- [ ] (Optional) Add `BACKUP_ENCRYPTION_PASSWORD` secret
  - Use a strong, unique password
  - Store password securely (you'll need it to decrypt backups)

### 2. Local Environment Setup

- [ ] Clone repository to local machine
- [ ] Navigate to project directory
- [ ] Copy `.env.backup.example` to `.env.backup`
  ```bash
  cp .env.backup.example .env.backup
  ```
- [ ] Edit `.env.backup` with your database URL
- [ ] Source environment variables
  ```bash
  source .env.backup
  ```

### 3. Script Permissions

- [ ] Make all scripts executable
  ```bash
  chmod +x scripts/*.sh
  ```
- [ ] Verify permissions
  ```bash
  ls -la scripts/*.sh
  ```

## Testing

### 4. Local Testing

- [ ] Test database connection
  ```bash
  psql "$SUPABASE_DB_URL" -c "SELECT version();"
  ```
- [ ] Run backup system test
  ```bash
  ./scripts/test-backup.sh
  ```
- [ ] Verify test backup created
  ```bash
  ./scripts/list-backups.sh
  ```
- [ ] Test restore in dry-run mode
  ```bash
  ./scripts/restore-db.sh --dry-run
  ```

### 5. Manual Backup Test

- [ ] Create manual backup
  ```bash
  export BACKUP_TYPE="manual"
  ./scripts/backup-db.sh
  ```
- [ ] Verify backup file exists
  ```bash
  ls -lh backups/
  ```
- [ ] Check backup integrity
  ```bash
  gzip -t backups/politicianfinder_manual_*.sql.gz
  ```
- [ ] View backup log
  ```bash
  cat backups/backup.log
  ```

### 6. Encryption Test (Optional)

- [ ] Create encrypted backup
  ```bash
  export ENCRYPTION_ENABLED="true"
  export ENCRYPTION_PASSWORD="TestPassword123"
  ./scripts/backup-db.sh
  ```
- [ ] Verify encrypted file created (`.enc` extension)
- [ ] Test decryption
  ```bash
  ./scripts/restore-db.sh --dry-run -b backups/*.enc
  ```

## GitHub Actions Verification

### 7. Workflow Validation

- [ ] Check workflow file syntax
  ```bash
  cat .github/workflows/backup.yml
  ```
- [ ] Verify workflow appears in Actions tab
- [ ] Check workflow permissions
  - Settings > Actions > General
  - Ensure "Read and write permissions" enabled

### 8. Manual Workflow Trigger

- [ ] Go to Actions > Database Backup
- [ ] Click "Run workflow"
- [ ] Select:
  - Backup type: `manual`
  - Encryption: `false` (or `true` if configured)
- [ ] Click "Run workflow" button
- [ ] Wait for workflow to complete
- [ ] Check workflow status (should be green ✓)

### 9. Verify Workflow Results

- [ ] Workflow completed successfully
- [ ] Backup artifact uploaded
  - Actions > Workflow run > Artifacts section
- [ ] Download and verify backup artifact
- [ ] Check workflow logs for any warnings
- [ ] Verify backup integrity test passed

## Production Readiness

### 10. Scheduled Backup Verification

- [ ] Wait for first scheduled backup (00:00 UTC)
- [ ] Check Actions tab for automatic run
- [ ] Verify daily backup artifact created
- [ ] Check backup notification (if configured)

### 11. Monitoring Setup

- [ ] Enable GitHub Actions notifications
  - Settings > Notifications > Actions
- [ ] Set up failure alerts
  - Issues will be auto-created on failure
- [ ] Subscribe to workflow notifications
- [ ] Test failure notification (optional)

### 12. Documentation Review

- [ ] Read `BACKUP_GUIDE.md` thoroughly
- [ ] Review `BACKUP_QUICK_REFERENCE.md`
- [ ] Understand restore procedures
- [ ] Familiarize with troubleshooting guide
- [ ] Review security considerations

## Operational Procedures

### 13. Backup Management

- [ ] Schedule monthly backup verification
- [ ] Set up calendar reminder for restore testing
- [ ] Document backup locations
- [ ] Establish backup retention policy
- [ ] Create runbook for backup operations

### 14. Disaster Recovery

- [ ] Test full restore procedure
  - Use test database
  - Restore from backup
  - Verify data integrity
- [ ] Document recovery time objectives (RTO)
- [ ] Document recovery point objectives (RPO)
- [ ] Create disaster recovery runbook
- [ ] Conduct disaster recovery drill

### 15. Security Audit

- [ ] Verify no credentials in version control
  ```bash
  git log --all -p | grep -i "password\|secret\|key" | grep -v "SUPABASE_DB_URL"
  ```
- [ ] Confirm `.gitignore` excludes backup files
- [ ] Review GitHub Secrets access
- [ ] Audit backup file permissions
- [ ] Review encryption settings
- [ ] Implement access controls

## Maintenance Tasks

### 16. Weekly Tasks

- [ ] Review backup logs
  ```bash
  tail -50 backups/backup.log
  ```
- [ ] Verify latest backup exists
  ```bash
  ./scripts/list-backups.sh
  ```
- [ ] Check backup file sizes
- [ ] Review GitHub Actions status

### 17. Monthly Tasks

- [ ] Test restore procedure
- [ ] Run backup system test
  ```bash
  ./scripts/test-backup.sh
  ```
- [ ] Review retention policy
- [ ] Clean up old test backups
  ```bash
  ./scripts/cleanup-backups.sh --dry-run
  ```
- [ ] Update documentation if needed

### 18. Quarterly Tasks

- [ ] Full disaster recovery drill
- [ ] Review and update scripts
- [ ] Security audit
- [ ] Rotate encryption passwords (if used)
- [ ] Review backup storage usage
- [ ] Update runbooks

## Advanced Configuration (Optional)

### 19. Encryption Setup

- [ ] Generate strong encryption password
  ```bash
  openssl rand -base64 32
  ```
- [ ] Store password securely (password manager)
- [ ] Add to GitHub Secrets
- [ ] Test encrypted backup/restore
- [ ] Document encryption procedures

### 20. Custom Retention Policy

- [ ] Determine retention requirements
- [ ] Update `BACKUP_RETENTION_DAYS` in workflow
- [ ] Update `WEEKLY_RETENTION_DAYS` if needed
- [ ] Test cleanup script with new retention
  ```bash
  ./scripts/cleanup-backups.sh --dry-run --days 60
  ```
- [ ] Update documentation

### 21. External Storage (Future Enhancement)

- [ ] Evaluate external storage options (S3, GCS, Azure)
- [ ] Configure external storage credentials
- [ ] Modify backup script for upload
- [ ] Test external backup storage
- [ ] Document external storage procedures

## Troubleshooting

### 22. Common Issues Resolution

- [ ] Test all troubleshooting procedures from guide
- [ ] Document any issues encountered
- [ ] Update troubleshooting guide if needed
- [ ] Create issues for bugs found
- [ ] Test all documented solutions

## Sign-off

### 23. Final Verification

- [ ] All scripts working correctly
- [ ] GitHub Actions workflow operational
- [ ] Documentation complete and accurate
- [ ] Team trained on backup procedures
- [ ] Runbooks created and reviewed
- [ ] Monitoring and alerts configured
- [ ] First scheduled backup successful
- [ ] Restore procedure tested and verified

### 24. Production Approval

- [ ] Technical review completed
- [ ] Security review completed
- [ ] Backup procedures approved
- [ ] Disaster recovery plan approved
- [ ] System marked as production-ready

---

## Completion Signature

**Setup completed by**: ___________________

**Date**: ___________________

**Verified by**: ___________________

**Date**: ___________________

---

## Notes

Use this space to document any issues, deviations, or special configurations:

```
[Your notes here]
```

---

**Reference Documents**:
- [BACKUP_GUIDE.md](BACKUP_GUIDE.md) - Complete backup guide
- [BACKUP_QUICK_REFERENCE.md](BACKUP_QUICK_REFERENCE.md) - Quick reference
- [P2V3_BACKUP_IMPLEMENTATION_REPORT.md](P2V3_BACKUP_IMPLEMENTATION_REPORT.md) - Implementation report
- [scripts/README.md](scripts/README.md) - Scripts documentation
