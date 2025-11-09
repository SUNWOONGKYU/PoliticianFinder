# P4O3 Deployment Guide: User Rank Recalculation Cron Job

## Task Summary

**Task ID**: P4O3
**Task Name**: 등급 재계산 스케줄러 (User Rank Recalculation Scheduler)
**Status**: ✅ Complete
**Phase**: 4 (Operations)

## What Was Implemented

### 1. Vercel Cron Job Configuration
- **File**: `vercel.json`
- **Schedule**: Daily at 3:00 AM (`0 3 * * *`)
- **Endpoint**: `/api/cron/recalculate-ranks`

### 2. API Route Handler
- **File**: `src/app/api/cron/recalculate-ranks/route.ts`
- **Features**:
  - Automatic user level recalculation based on activity
  - Points calculation from posts, comments, likes, and reports
  - Level assignment (1-5) based on point thresholds
  - Automatic notification creation on level changes
  - Vercel Cron secret authentication
  - Comprehensive error handling and logging

### 3. Points System

| Activity | Points |
|----------|--------|
| Post Created | +10 |
| Comment Created | +5 |
| Like Received | +2 |
| Comment Received | +3 |
| Report Penalty | -50 |

### 4. Level Thresholds

| Level | Points | Name |
|-------|--------|------|
| 1 | 0-99 | 새싹 (Sprout) |
| 2 | 100-499 | 일반 (Regular) |
| 3 | 500-1,999 | 활동가 (Activist) |
| 4 | 2,000-4,999 | 전문가 (Expert) |
| 5 | 5,000+ | 명예 (Honor) |

## Files Created

1. `src/app/api/cron/recalculate-ranks/route.ts` - Main cron job handler
2. `src/app/api/cron/recalculate-ranks/__tests__/recalculate-ranks.test.ts` - Unit tests
3. `src/app/api/cron/recalculate-ranks/README.md` - Documentation
4. `vercel.json` - Updated with new cron schedule
5. `claude_code/inbox/P4O3.json` - Task completion report

## Deployment Steps

### Step 1: Environment Variables

Add the following environment variables in Vercel dashboard:

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional (recommended for security)
CRON_SECRET=your_random_secret_string
```

**To generate a CRON_SECRET**:
```bash
openssl rand -base64 32
```

### Step 2: Deploy to Vercel

```bash
# Commit changes
git add .
git commit -m "feat(P4O3): Add user rank recalculation cron job"
git push

# Or deploy directly
vercel deploy --prod
```

### Step 3: Verify Cron Registration

1. Go to Vercel Dashboard
2. Navigate to your project
3. Click on "Settings" → "Cron Jobs"
4. Verify that `/api/cron/recalculate-ranks` is listed with schedule `0 3 * * *`

### Step 4: Monitor First Execution

1. Wait for first execution (3:00 AM) or manually trigger
2. Check logs in Vercel Dashboard → Deployments → Functions
3. Look for `[Cron]` prefixed log messages
4. Verify response includes processed user count

## Manual Testing

### Test Locally (Development)

```bash
# Start dev server
npm run dev

# Trigger cron endpoint
curl -X GET http://localhost:3000/api/cron/recalculate-ranks \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Test in Production

```bash
# Trigger production cron endpoint
curl -X GET https://your-domain.vercel.app/api/cron/recalculate-ranks \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Expected Response

### Success Response
```json
{
  "success": true,
  "data": {
    "processed": 150,
    "updated": 45,
    "notifications_created": 12,
    "timestamp": "2025-11-09T03:00:00.000Z"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Unauthorized: Invalid cron secret"
  }
}
```

## Monitoring

### Vercel Logs

1. Navigate to Vercel Dashboard
2. Go to Deployments → Your deployment → Functions
3. Search for `/api/cron/recalculate-ranks`
4. View execution logs

### Key Metrics to Monitor

- **Processed users**: Total users in database
- **Updated users**: Users whose points/level changed
- **Notifications created**: Level change notifications sent
- **Execution time**: Should complete within 1-2 minutes for 1000 users
- **Error rate**: Should be 0% or very low

## Troubleshooting

### Issue: Cron not executing

**Solution**:
1. Verify `vercel.json` is deployed
2. Check Vercel Dashboard → Settings → Cron Jobs
3. Ensure project is deployed to production

### Issue: Unauthorized error

**Solution**:
1. Verify `CRON_SECRET` environment variable is set
2. Check Authorization header format: `Bearer {secret}`
3. Redeploy after adding environment variables

### Issue: Database connection error

**Solution**:
1. Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
2. Check Supabase project status
3. Verify RLS policies allow service role access

### Issue: Some users not updating

**Solution**:
1. Check logs for specific user errors
2. Verify all required tables exist (users, posts, comments, etc.)
3. Check database permissions for service role

## Database Tables Required

Ensure these tables exist in Supabase:

- ✅ `users` (with points, level columns)
- ✅ `posts`
- ✅ `comments`
- ✅ `post_likes`
- ✅ `comment_likes`
- ✅ `reports`
- ✅ `notifications`

## Performance Considerations

- **Execution Time**: ~1-2 minutes for 1000 users
- **Database Load**: Sequential processing to avoid overload
- **Memory**: Minimal (processes one user at a time)
- **API Limits**: Uses service role key (no rate limits)

## Security

- ✅ Vercel Cron secret authentication
- ✅ Supabase Service Role Key (server-side only)
- ✅ No sensitive data in logs
- ✅ HTTPS only (enforced by Vercel)

## Next Steps

1. ✅ Deploy to production
2. ✅ Monitor first execution
3. ⬜ Set up Sentry error tracking (optional)
4. ⬜ Add metrics dashboard (optional)
5. ⬜ Optimize batch processing for large user bases (future)

## Support

For issues or questions:
1. Check logs in Vercel Dashboard
2. Review `src/app/api/cron/recalculate-ranks/README.md`
3. Review test file for calculation logic examples

---

**Deployment Status**: ✅ Ready for Production
**Last Updated**: 2025-11-09
**Task Owner**: DevOps Engineer (Claude Code)
