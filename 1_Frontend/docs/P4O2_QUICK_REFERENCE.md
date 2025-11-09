# P4O2 Quick Reference: Trending Posts Cron Job

## Quick Start

### Local Testing
```bash
# 1. Set environment variable
echo "CRON_SECRET=dev-secret-123" >> .env.local

# 2. Start dev server
npm run dev

# 3. Test the endpoint
curl -X POST http://localhost:3002/api/cron/aggregate-trending \
  -H "Authorization: Bearer dev-secret-123" \
  -H "Content-Type: application/json"
```

### Production Deployment

1. **Set Environment Variables** (Vercel Dashboard):
   - `CRON_SECRET`: Generate with `openssl rand -hex 32`
   - `SUPABASE_SERVICE_ROLE_KEY`: From Supabase Dashboard

2. **Run Database Migration**:
   - Execute `042_create_trending_posts_cache.sql` in Supabase SQL Editor

3. **Deploy**:
   ```bash
   git push origin main
   ```

4. **Verify**:
   - Vercel Dashboard > Deployments > Cron Jobs
   - Check logs after first hourly run

## File Locations

```
1_Frontend/
├── src/app/api/cron/aggregate-trending/route.ts  # Cron API endpoint
├── vercel.json                                    # Cron schedule config
├── .env.example                                   # CRON_SECRET template
└── scripts/test-cron-trending.sh                  # Test script

0-4_Database/Supabase/migrations/
└── 042_create_trending_posts_cache.sql            # Cache table migration
```

## Trending Score Formula

```javascript
score = (likes × 3) + (comments × 5) + (views × 0.1) - (age_hours × 2)
```

**Example**:
- Post: 50 likes, 12 comments, 1000 views, 3 hours old
- Score: (50×3) + (12×5) + (1000×0.1) - (3×2) = 150 + 60 + 100 - 6 = 304

## Schedule

- **Frequency**: Every hour at :00 minutes
- **Cron Expression**: `0 * * * *`
- **Timezone**: UTC
- **Expected Runtime**: 200-500ms

## Cache Table Schema

```sql
CREATE TABLE trending_posts_cache (
  id UUID PRIMARY KEY,
  post_id UUID REFERENCES posts(id),
  rank INTEGER,              -- 1-100
  trend_score NUMERIC,       -- Calculated score
  snapshot_data JSONB,       -- Post data at calculation time
  calculated_at TIMESTAMPTZ  -- When calculated
);
```

## Helper Functions

### Get Latest Trending Posts
```sql
SELECT * FROM get_latest_trending_posts(10);
```

### Cleanup Old Cache
```sql
SELECT cleanup_old_trending_cache();
```

## API Response Examples

### Success (200)
```json
{
  "success": true,
  "data": {
    "processed": 150,
    "cached": 100,
    "top_10": [
      {
        "rank": 1,
        "id": "post-uuid",
        "title": "Post Title",
        "score": 304.5,
        "likes": 50,
        "comments": 12,
        "views": 1000,
        "age_hours": 3
      }
    ],
    "duration_ms": 234,
    "calculated_at": "2025-11-09T10:00:00Z"
  }
}
```

### Error (401)
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid cron secret"
  }
}
```

## Common Issues

### Issue: Cron not running
**Solution**:
- Check Vercel Dashboard > Cron Jobs
- Verify `vercel.json` deployed correctly
- Check project has Pro plan (required for cron)

### Issue: Authentication failed
**Solution**:
- Verify `CRON_SECRET` set in Vercel env vars
- Match secret in test requests
- Check header name (`x-vercel-cron-secret` in prod)

### Issue: Cache table not found
**Solution**:
- Run migration: `042_create_trending_posts_cache.sql`
- Check Supabase Dashboard > Table Editor
- Verify RLS policies enabled

### Issue: No posts cached
**Solution**:
- Check if posts exist in last 7 days
- Verify posts have `moderation_status = 'approved'`
- Check if trending scores > 0

## Monitoring

### Check Last Execution
```sql
SELECT
  calculated_at,
  COUNT(*) as posts_cached,
  MAX(trend_score) as highest_score
FROM trending_posts_cache
GROUP BY calculated_at
ORDER BY calculated_at DESC
LIMIT 5;
```

### View Top Trending
```sql
SELECT
  rank,
  snapshot_data->>'title' as title,
  trend_score,
  snapshot_data->>'like_count' as likes,
  snapshot_data->>'comment_count' as comments
FROM trending_posts_cache
WHERE calculated_at = (SELECT MAX(calculated_at) FROM trending_posts_cache)
ORDER BY rank ASC
LIMIT 10;
```

## Performance Benchmarks

| Metric | Target | Typical |
|--------|--------|---------|
| Execution Time | < 1000ms | 200-500ms |
| Posts Processed | - | 100-500 |
| Posts Cached | 100 | 100 |
| Database Queries | 3 | 3 (1 read, 2 write) |

## Security Checklist

- ✅ CRON_SECRET set (32+ character random string)
- ✅ Service role key stored in env vars (not code)
- ✅ Production checks CRON_SECRET header
- ✅ Development mode allows testing
- ✅ GET requests blocked in production
- ✅ Cache table has RLS enabled
- ✅ Public read-only access

## Next Steps

After implementation:

1. **Create Consumer Endpoint**:
   - `GET /api/posts/trending` - Fetch from cache
   - Uses `get_latest_trending_posts()` function

2. **Frontend Integration**:
   - Display trending posts on homepage
   - Add trending badge/indicator
   - Show trending score/rank

3. **Analytics**:
   - Track trending post performance
   - Monitor score distribution
   - A/B test different formulas

## Support

For issues or questions:
1. Check logs in Vercel Dashboard
2. Query `trending_posts_cache` table directly
3. Run test script: `./scripts/test-cron-trending.sh`
4. Review implementation: `P4O2_IMPLEMENTATION_SUMMARY.md`
