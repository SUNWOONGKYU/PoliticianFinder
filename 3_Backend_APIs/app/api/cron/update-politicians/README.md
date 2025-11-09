# Politician Data Update Cron Job

Task: **P4O1 - 크롤링 스케줄러**

## Overview

Automated cron job for updating politician data from the National Election Commission (NEC) website using Vercel Cron Jobs.

## Features

- ✅ Automated daily execution at 6:00 AM
- ✅ NEC website crawling integration
- ✅ UPSERT logic (Insert new, Update existing)
- ✅ Execution logging and statistics
- ✅ Error handling and retry support
- ✅ Manual trigger capability for testing
- ✅ Security with CRON_SECRET authentication

## Schedule

**Default Schedule**: `0 6 * * *` (Daily at 6:00 AM UTC)

Alternative schedules (configurable in `vercel.json`):
- Weekly (Monday 6 AM): `0 6 * * 1`
- Twice daily: `0 6,18 * * *`
- Every 6 hours: `0 */6 * * *`

## API Endpoints

### GET /api/cron/update-politicians

Returns cron job information and status.

**Request**:
```bash
curl https://your-domain.com/api/cron/update-politicians
```

**Response**:
```json
{
  "service": "Politician Data Update Cron",
  "description": "정치인 데이터 자동 업데이트 크론 잡",
  "schedule": "0 6 * * * (매일 오전 6시)",
  "endpoints": {
    "GET": {
      "description": "Get cron job information",
      "auth": "Not required"
    },
    "POST": {
      "description": "Manually trigger cron job",
      "auth": "Required (CRON_SECRET header)"
    }
  },
  "status": "active",
  "version": "1.0.0"
}
```

### POST /api/cron/update-politicians

Executes the cron job. Called automatically by Vercel or manually for testing.

**Automatic Execution** (by Vercel):
- No authentication required
- Triggered by Vercel Cron scheduler
- User-Agent includes "vercel-cron"

**Manual Execution** (for testing):
```bash
curl -X POST https://your-domain.com/api/cron/update-politicians \
  -H "x-cron-secret: your-cron-secret-here"
```

**Response (Success)**:
```json
{
  "success": true,
  "message": "Cron job completed. Found: 150, Inserted: 10, Updated: 140, Failed: 0",
  "stats": {
    "startTime": "2025-11-09T06:00:00.000Z",
    "endTime": "2025-11-09T06:02:30.000Z",
    "duration": "150000ms",
    "crawlSuccessful": true,
    "itemsFound": 150,
    "itemsInserted": 10,
    "itemsUpdated": 140,
    "itemsFailed": 0,
    "errors": []
  }
}
```

**Response (Error)**:
```json
{
  "success": false,
  "error": "Cron job failed with unexpected error",
  "details": "Network timeout",
  "stats": {
    "startTime": "2025-11-09T06:00:00.000Z",
    "endTime": "2025-11-09T06:00:30.000Z",
    "duration": "30000ms",
    "errors": ["Crawler failed: Network timeout"]
  }
}
```

## Configuration

### Environment Variables

Create or update `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Cron Job Security
CRON_SECRET=your-secure-random-string
```

### Vercel Configuration

File: `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/update-politicians",
      "schedule": "0 6 * * *"
    }
  ]
}
```

**Schedule Format** (cron expression):
```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6) (Sunday to Saturday)
│ │ │ │ │
│ │ │ │ │
* * * * *
```

## Implementation Details

### Workflow

1. **Authentication**: Verify request is from Vercel Cron or has valid CRON_SECRET
2. **Crawl**: Execute NEC crawler to fetch latest politician data
3. **Transform**: Convert crawled data to database schema format
4. **Upsert**: Insert new politicians or update existing ones
5. **Log**: Record execution statistics for monitoring
6. **Response**: Return execution results

### UPSERT Logic

```typescript
// For each crawled politician:
1. Search for existing politician by name and party
2. If exists:
   - Update phone, email, updated_at
   - Update career_history in politician_details
3. If not exists:
   - Insert new politician record
   - Insert politician_details with career data
```

### Error Handling

- **Crawler Failures**: Logged but job continues to save execution record
- **Upsert Failures**: Individual failures don't stop batch processing
- **Logging Failures**: Logged to console only, doesn't fail job
- **Unexpected Errors**: Caught and returned with 500 status

## Testing

### Local Development

1. Start development server:
```bash
cd C:\Development_PoliticianFinder_copy\Developement_Real_PoliticianFinder\1_Frontend
npm run dev
```

2. Test GET endpoint:
```bash
curl http://localhost:3000/api/cron/update-politicians
```

3. Test POST endpoint (manual trigger):
```bash
curl -X POST http://localhost:3000/api/cron/update-politicians \
  -H "x-cron-secret: development-secret"
```

### Production Testing

1. Deploy to Vercel
2. Manually trigger via Vercel Dashboard:
   - Go to "Deployments" → "Cron Jobs"
   - Click "Trigger" next to update-politicians job

3. Or use curl with production URL:
```bash
curl -X POST https://your-domain.vercel.app/api/cron/update-politicians \
  -H "x-cron-secret: your-production-secret"
```

## Monitoring

### Execution Logs

Logs are stored in `cron_execution_logs` table (if exists):

```sql
CREATE TABLE cron_execution_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_name TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  status TEXT NOT NULL,
  items_found INTEGER DEFAULT 0,
  items_inserted INTEGER DEFAULT 0,
  items_updated INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  errors TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Vercel Logs

View execution logs in Vercel Dashboard:
1. Go to your project
2. Click "Logs" tab
3. Filter by `/api/cron/update-politicians`

### Key Metrics

Monitor these metrics:
- **Execution Time**: Should complete within 60 seconds
- **Success Rate**: Should be > 95%
- **Items Updated**: Track data freshness
- **Error Rate**: Should be < 5%

## Deployment

### Prerequisites

1. Vercel Pro plan or higher (required for Cron Jobs)
2. Supabase project with proper tables
3. Environment variables configured

### Deploy Steps

1. Push code to Git repository
2. Connect repository to Vercel
3. Configure environment variables in Vercel Dashboard
4. Deploy project
5. Verify cron job in Vercel Dashboard → Cron Jobs

### Verify Deployment

```bash
# Check cron job info
curl https://your-domain.vercel.app/api/cron/update-politicians

# Manually trigger (optional)
curl -X POST https://your-domain.vercel.app/api/cron/update-politicians \
  -H "x-cron-secret: your-secret"
```

## Troubleshooting

### Issue: Cron job not executing

**Solution**:
- Verify Vercel plan supports Cron Jobs (Pro or higher)
- Check `vercel.json` is in project root
- Verify deployment was successful
- Check Vercel Dashboard → Cron Jobs for status

### Issue: Crawler timeout

**Solution**:
- Increase `maxDuration` in route.ts (up to plan limit)
- Optimize crawler timeout settings
- Consider splitting into smaller batches

### Issue: Unauthorized error

**Solution**:
- Verify CRON_SECRET environment variable is set
- Check header name is exactly `x-cron-secret`
- For Vercel cron, no secret needed (auto-authenticated)

### Issue: Database errors

**Solution**:
- Verify SUPABASE_SERVICE_ROLE_KEY is correct
- Check table schemas match expected format
- Review Supabase logs for specific errors
- Ensure RLS policies allow service role access

## Performance Optimization

### Tips

1. **Batch Processing**: Process politicians in batches of 100
2. **Caching**: Cache party/constituency ID mappings
3. **Parallel Processing**: Use Promise.all for independent operations
4. **Database Indexing**: Index name, party, and district columns
5. **Monitoring**: Set up alerts for failures or slow executions

### Expected Performance

- **Crawl Time**: 30-60 seconds for 150-300 politicians
- **Upsert Time**: 10-30 seconds for batch processing
- **Total Time**: < 90 seconds (within Vercel Pro limits)

## Security Considerations

1. **CRON_SECRET**: Use strong random string (32+ characters)
2. **Service Role Key**: Never expose in client-side code
3. **Rate Limiting**: Crawler includes delays to avoid blocking
4. **Error Messages**: Don't expose sensitive data in errors
5. **Logs**: Sanitize before logging to external services

## Future Enhancements

- [ ] Add email notifications for failures
- [ ] Implement incremental updates (only changed data)
- [ ] Add Sentry integration for error tracking
- [ ] Support multiple data sources
- [ ] Add data validation before upsert
- [ ] Implement rollback on partial failures
- [ ] Add Slack/Discord webhooks for monitoring

## Related Files

**Implementation**:
- `3_Backend_APIs/app/api/cron/update-politicians/route.ts` - Main cron job
- `1_Frontend/vercel.json` - Vercel cron configuration
- `1_Frontend/src/lib/crawlers/nec-crawler.ts` - NEC crawler

**Documentation**:
- `1_Frontend/src/lib/crawlers/README.md` - Crawler documentation
- `1_Frontend/src/lib/crawlers/API_DOCUMENTATION.md` - Crawler API docs

## Support

For issues or questions:
1. Check Vercel documentation: https://vercel.com/docs/cron-jobs
2. Review crawler implementation in `src/lib/crawlers/`
3. Check execution logs in Vercel Dashboard
4. Review Supabase logs for database errors

---

**Task**: P4O1 - 크롤링 스케줄러
**Phase**: Phase 4 - Operations
**Generated**: 2025-11-09
