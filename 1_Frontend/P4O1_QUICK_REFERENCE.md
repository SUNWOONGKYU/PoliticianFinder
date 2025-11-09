# P4O1 Quick Reference - 크롤링 스케줄러

## Quick Start

### Local Testing
```bash
cd C:\Development_PoliticianFinder_copy\Developement_Real_PoliticianFinder\1_Frontend

# Start dev server
npm run dev

# Test GET endpoint
curl http://localhost:3000/api/cron/update-politicians

# Test POST endpoint (manual trigger)
curl -X POST http://localhost:3000/api/cron/update-politicians \
  -H "x-cron-secret: development-secret"
```

### Production Deployment
```bash
# 1. Configure environment variables in Vercel Dashboard:
#    - NEXT_PUBLIC_SUPABASE_URL
#    - NEXT_PUBLIC_SUPABASE_ANON_KEY
#    - SUPABASE_SERVICE_ROLE_KEY
#    - CRON_SECRET

# 2. Deploy
git push origin main
# or: vercel --prod

# 3. Verify
curl https://your-domain.vercel.app/api/cron/update-politicians
```

## File Locations

### Core Files
```
src/app/api/cron/update-politicians/route.ts   - Main API route
vercel.json                                     - Cron configuration
```

### Documentation
```
src/app/api/cron/update-politicians/README.md  - API docs
P4O1_IMPLEMENTATION_SUMMARY.md                 - Implementation
P4O1_COMPLETION_REPORT.md                      - Full report
```

### Testing
```
3_Backend_APIs/__tests__/cron/update-politicians.test.ts - Tests
scripts/test-cron.sh                                     - Manual test
```

## API Endpoints

### GET /api/cron/update-politicians
Returns cron job information
```bash
curl http://localhost:3000/api/cron/update-politicians
```

### POST /api/cron/update-politicians
Execute cron job (requires authentication)
```bash
# Manual trigger
curl -X POST http://localhost:3000/api/cron/update-politicians \
  -H "x-cron-secret: your-secret"

# Vercel Cron (automatic - no auth needed)
# Runs daily at 6:00 AM UTC
```

## Configuration

### Environment Variables
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CRON_SECRET=your-secure-random-string
```

### Cron Schedule
```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/update-politicians",
    "schedule": "0 6 * * *"  // Daily at 6:00 AM UTC
  }]
}
```

## Common Commands

### Testing
```bash
# Run automated tests
npm test -- __tests__/cron/update-politicians.test.ts

# Run manual test script
./scripts/test-cron.sh http://localhost:3000

# Type check
npm run type-check
```

### Monitoring
```bash
# View Vercel logs
vercel logs

# Query execution logs (Supabase)
SELECT * FROM cron_execution_logs
ORDER BY started_at DESC
LIMIT 10;
```

## Troubleshooting

### Cron not executing
- Check Vercel plan (Pro+ required)
- Verify vercel.json in root
- Check Vercel Dashboard → Cron Jobs

### Crawler timeout
- Increase maxDuration in route.ts
- Check NEC website availability
- Review network connectivity

### Database errors
- Verify SUPABASE_SERVICE_ROLE_KEY
- Check table schemas
- Review Supabase logs

### 401 Unauthorized
- Verify CRON_SECRET matches
- Check header: x-cron-secret
- For Vercel cron, no secret needed

## Key Metrics

| Metric | Expected | Alert If |
|--------|----------|----------|
| Success Rate | > 95% | < 90% |
| Execution Time | 30-90s | > 120s |
| Items Found | 100-300 | < 50 |
| Items Updated | 50-250 | < 25 |

## Important Notes

- Requires Vercel Pro plan or higher
- Runs daily at 6:00 AM UTC
- Uses P4BA1 NEC crawler
- UPSERT logic: Insert new, Update existing
- Execution logs stored in database
- Manual trigger requires CRON_SECRET

## Support

**Documentation**:
- Full API docs: `src/app/api/cron/update-politicians/README.md`
- Implementation: `P4O1_IMPLEMENTATION_SUMMARY.md`
- Complete report: `P4O1_COMPLETION_REPORT.md`

**External Links**:
- Vercel Cron: https://vercel.com/docs/cron-jobs
- Cron expressions: https://crontab.guru/

---

**Task**: P4O1 - 크롤링 스케줄러
**Status**: ✅ COMPLETED
**Date**: 2025-11-09
