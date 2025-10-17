# P5D2: Production Migration Checklist

## Overview
Complete checklist for executing safe production database migrations for PoliticianFinder. This checklist ensures zero-downtime deployments with comprehensive rollback capabilities.

---

## Pre-Migration Phase (T-48 hours)

### Communication & Planning
- [ ] **Notify stakeholders** of planned migration window
- [ ] **Schedule maintenance window** (prefer low-traffic period)
- [ ] **Assign roles**: Migration lead, backup operator, monitoring team
- [ ] **Prepare communication templates** for users (if downtime expected)
- [ ] **Review migration scripts** with team (code review completed)

### Environment Preparation
- [ ] **Verify staging environment** matches production
- [ ] **Test migration on staging** successfully
- [ ] **Document staging test results** with performance metrics
- [ ] **Review rollback procedures** with team
- [ ] **Ensure on-call team availability** during migration window

### Backup Verification (P5D1)
- [ ] **Execute P5D1 backup script** (20251018_P5D1_backup_script.sql)
- [ ] **Verify Supabase automated backups** are current (< 24 hours old)
- [ ] **Create manual pg_dump backup**: `pg_dump > backup_pre_P5D2_$(date +%Y%m%d).sql`
- [ ] **Export critical data to CSV** (profiles, politicians, ratings, posts)
- [ ] **Test backup restoration** on staging environment
- [ ] **Store backups in secure location** (cloud storage + local)
- [ ] **Verify backup file integrity** (non-zero size, readable)
- [ ] **Document backup metadata** (timestamp, size, row counts)

### Pre-Flight Checks
- [ ] **Database health check**: No replication lag, no long-running queries
- [ ] **Connection pool status**: < 50% utilization
- [ ] **Disk space**: > 30% free space available
- [ ] **CPU/Memory**: < 70% average utilization
- [ ] **Review recent error logs**: No critical errors in past 24 hours

---

## Migration Phase (T-0 hours)

### Pre-Migration Snapshot (T-0:00)
- [ ] **Application status**: Record current traffic and active users
- [ ] **Database statistics**:
  ```sql
  SELECT COUNT(*) FROM public.profiles;
  SELECT COUNT(*) FROM public.politicians;
  SELECT COUNT(*) FROM public.posts;
  SELECT COUNT(*) FROM public.comments;
  SELECT COUNT(*) FROM public.ratings;
  ```
- [ ] **Performance baseline**: Execute and record current query times
- [ ] **Active connections**: Record current connection count
- [ ] **Replication status**: Verify all replicas are in sync

### Maintenance Mode (Optional, T-0:05)
- [ ] **Enable read-only mode** (if zero-downtime not possible)
  ```sql
  ALTER DATABASE postgres SET default_transaction_read_only = on;
  ```
- [ ] **Display maintenance banner** on frontend
- [ ] **Disable background jobs** (cron, scheduled tasks)
- [ ] **Notify users** via in-app notification

### Execute Migration (T-0:10)
- [ ] **Begin transaction log**
- [ ] **Execute migration script**: `20251018_P5D2_production_migration.sql`
- [ ] **Monitor execution**: Watch for errors or warnings
- [ ] **Record migration duration**
- [ ] **Capture any error messages** for documentation

### Post-Migration Validation (T-0:20)
- [ ] **Run validation queries** from migration script
- [ ] **Verify table existence**:
  ```sql
  SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
  ```
- [ ] **Check row counts** match pre-migration (or expected changes)
- [ ] **Verify RLS policies active**:
  ```sql
  SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
  ```
- [ ] **Test index performance**:
  ```sql
  EXPLAIN ANALYZE SELECT * FROM politicians WHERE avg_rating > 4;
  ```
- [ ] **Check for orphaned records** (foreign key integrity)
- [ ] **Verify constraints** are enforced

### Application Validation (T-0:30)
- [ ] **Restart application servers** (clear connection pools)
- [ ] **Clear application caches** (Redis, in-memory)
- [ ] **Run health check endpoints**:
  - [ ] `/api/health` - returns 200 OK
  - [ ] `/api/auth/session` - authentication works
  - [ ] `/api/politicians` - data retrieval works
- [ ] **Test critical user flows**:
  - [ ] User registration and login
  - [ ] View politician profiles
  - [ ] Submit rating/review
  - [ ] Create post/comment
  - [ ] Search functionality
- [ ] **Monitor error rates**: No spike in application errors

### Performance Verification (T-0:40)
- [ ] **Compare query performance** to baseline (< 20% slower acceptable)
- [ ] **Check database CPU**: Should be < 80%
- [ ] **Monitor connection pool**: No connection exhaustion
- [ ] **Review slow query log**: No new slow queries introduced
- [ ] **Test concurrent user load**: Simulate normal traffic

### Disable Maintenance Mode (T-0:50)
- [ ] **Re-enable write access**:
  ```sql
  ALTER DATABASE postgres SET default_transaction_read_only = off;
  ```
- [ ] **Remove maintenance banner** from frontend
- [ ] **Re-enable background jobs**
- [ ] **Announce migration completion** to stakeholders

---

## Post-Migration Phase (T+1 hour to T+24 hours)

### Immediate Monitoring (T+1 to T+4 hours)
- [ ] **Monitor error logs**: Watch for application/database errors
- [ ] **Track user reports**: Support tickets, bug reports
- [ ] **Database metrics**: CPU, memory, connection count, query latency
- [ ] **Application metrics**: Response times, error rates, active users
- [ ] **Supabase dashboard**: Review realtime metrics and alerts

### Extended Monitoring (T+4 to T+24 hours)
- [ ] **Review daily reports**: Check for anomalies in usage patterns
- [ ] **Verify data consistency**: Run integrity checks periodically
- [ ] **Monitor background jobs**: Ensure scheduled tasks running correctly
- [ ] **Check backup schedule**: Verify post-migration backups succeeded
- [ ] **Performance trends**: Compare to pre-migration baseline

### Documentation (T+24 hours)
- [ ] **Complete migration report**:
  - Start/end times
  - Duration (planned vs actual)
  - Issues encountered
  - Rollback actions (if any)
  - Performance impact
- [ ] **Update runbook** with lessons learned
- [ ] **Document any workarounds** or manual fixes applied
- [ ] **Archive migration artifacts** (logs, scripts, backups)
- [ ] **Share results** with stakeholders

### Cleanup (T+48 hours)
- [ ] **Remove old backups** (keep only required retention)
- [ ] **Archive migration logs**
- [ ] **Update documentation** if procedures changed
- [ ] **Schedule next migration** if needed

---

## Rollback Procedures (If Migration Fails)

### Immediate Rollback Triggers
Execute rollback immediately if:
- [ ] Data corruption detected
- [ ] Authentication system non-functional
- [ ] Critical application errors > 10% of requests
- [ ] Database performance degraded > 200%
- [ ] RLS policies blocking legitimate user access

### Rollback Execution
1. **Decision Point** (within 5 minutes of issue detection)
   - [ ] Assess severity and impact
   - [ ] Notify migration lead and stakeholders
   - [ ] Document reason for rollback

2. **Execute Rollback** (Method selection)
   - [ ] **Method A**: Supabase Point-in-Time Restore (recommended)
     - Dashboard > Database > Backups > Select backup > Restore
   - [ ] **Method B**: pg_restore from manual backup
     - `psql < backup_pre_P5D2_YYYYMMDD.sql`
   - [ ] **Method C**: Selective table restore from CSV
     - See `20251018_P5D2_rollback_plan.sql` section 4C
   - [ ] **Method D**: Revert migration SQL
     - See `20251018_P5D2_rollback_plan.sql` section 4D

3. **Post-Rollback Validation**
   - [ ] Execute validation queries from rollback script
   - [ ] Verify data integrity
   - [ ] Test critical application features
   - [ ] Monitor for issues

4. **Application Recovery**
   - [ ] Restart application servers
   - [ ] Clear all caches
   - [ ] Run health checks
   - [ ] Monitor error rates

5. **Incident Documentation**
   - [ ] Fill out incident report template
   - [ ] Schedule post-mortem meeting
   - [ ] Update migration procedures
   - [ ] Communicate to stakeholders

---

## Migration Script References

| Script | Purpose | Location |
|--------|---------|----------|
| P5D1 Backup Script | Create pre-migration backups | `20251018_P5D1_backup_script.sql` |
| P5D1 Documentation | Backup procedures and strategy | `P5D1_BACKUP_DOCUMENTATION.md` |
| P5D2 Migration Script | Execute production migration | `20251018_P5D2_production_migration.sql` |
| P5D2 Rollback Plan | Emergency rollback procedures | `20251018_P5D2_rollback_plan.sql` |
| P5D2 Checklist | This document | `P5D2_PRODUCTION_MIGRATION_CHECKLIST.md` |

---

## Success Criteria

Migration considered successful when ALL of the following are met:
- [ ] Zero data loss
- [ ] All post-migration validations passed
- [ ] Application error rate < 1%
- [ ] Database performance within 20% of baseline
- [ ] All critical features operational
- [ ] No user-reported critical issues within 24 hours
- [ ] Backups completed successfully post-migration

---

## Emergency Contacts

### Internal Team
- **Migration Lead**: [Name] - [Email] - [Phone]
- **Database Admin**: [Name] - [Email] - [Phone]
- **DevOps Lead**: [Name] - [Email] - [Phone]
- **On-Call Engineer**: [Emergency Number]

### External Support
- **Supabase Support**: support@supabase.com
- **Supabase Dashboard**: https://app.supabase.com/project/[PROJECT_ID]
- **Supabase Status**: https://status.supabase.com

### Communication Channels
- **Slack**: #production-migrations
- **Incident Channel**: #incidents
- **Status Page**: [Your status page URL]

---

## Notes

### Best Practices
1. **Always test on staging first** - No exceptions
2. **Have rollback plan ready** - Practice rollback procedures
3. **Monitor actively during migration** - Don't walk away
4. **Keep backups for 30 days** - Minimum retention period
5. **Document everything** - Future migrations will thank you

### Common Pitfalls to Avoid
- ❌ Skipping backup verification
- ❌ Not testing rollback procedures
- ❌ Migrating during peak traffic hours
- ❌ Ignoring warning signs in validation
- ❌ Insufficient monitoring post-migration

### Performance Considerations
- Migrations may temporarily lock tables (< 1 second)
- Index creation can be CPU intensive
- RLS policy changes affect query planning
- Connection pool may need tuning after migration

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | 2025-10-18 | Initial production migration checklist | Database Team |

---

## Approval Sign-off

Before executing this migration in production:

- [ ] **Database Administrator**: _________________ Date: _______
- [ ] **DevOps Lead**: _________________ Date: _______
- [ ] **Project Manager**: _________________ Date: _______
- [ ] **Technical Lead**: _________________ Date: _______

---

**Remember**: Measure twice, cut once. When in doubt, rollback and reassess.
