# P4O3: User Rank Recalculation Cron Job

## Overview

This is a Vercel Cron Job that automatically recalculates all user levels based on their activity points daily at 3:00 AM (KST).

## Schedule

- **Cron Expression**: `0 3 * * *`
- **Frequency**: Daily at 3:00 AM
- **Endpoint**: `/api/cron/recalculate-ranks`

## Points System

### Activity Points

| Activity | Points |
|----------|--------|
| Post Created | +10 |
| Comment Created | +5 |
| Like Received | +2 |
| Comment Received on Post | +3 |
| Report (Accepted/Resolved) | -50 |

### Level Thresholds

| Level | Points Range | Name |
|-------|--------------|------|
| 1 | 0 - 99 | 새싹 (Sprout) |
| 2 | 100 - 499 | 일반 (Regular) |
| 3 | 500 - 1,999 | 활동가 (Activist) |
| 4 | 2,000 - 4,999 | 전문가 (Expert) |
| 5 | 5,000+ | 명예 (Honor) |

## Calculation Logic

For each user, the system:

1. **Counts Posts**: All posts created by the user
2. **Counts Comments**: All comments created by the user
3. **Counts Likes Received**: Likes on user's posts and comments
4. **Counts Comments Received**: Comments on user's posts (excluding own comments)
5. **Counts Reports**: Accepted or resolved reports against the user

Total points = (posts × 10) + (comments × 5) + (likes × 2) + (comments_received × 3) + (reports × -50)

Points are capped at 0 minimum (cannot go negative).

## Level Change Notifications

When a user's level changes, the system automatically creates a notification:

- **Level Up**: "축하합니다! 레벨 {old} 에서 레벨 {new} ({name})로 승급하셨습니다!"
- **Level Down**: "레벨이 {old}에서 레벨 {new} ({name})로 변경되었습니다."

Notifications link to the user's profile page.

## Security

The cron job is protected by Vercel's cron secret authentication:

```typescript
Authorization: Bearer {CRON_SECRET}
```

Set the `CRON_SECRET` environment variable in Vercel to enable authentication.

## Environment Variables

Required environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key (bypasses RLS)
- `CRON_SECRET`: (Optional) Secret for cron authentication

## Database Tables Used

- `users`: User accounts with points and level
- `posts`: Community posts
- `comments`: Comments on posts
- `post_likes`: Likes on posts
- `comment_likes`: Likes on comments
- `reports`: User reports
- `notifications`: System notifications

## Response Format

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
    "code": "UNAUTHORIZED|DATABASE_ERROR|CONFIGURATION_ERROR|INTERNAL_SERVER_ERROR",
    "message": "Error description"
  }
}
```

## Testing

Run the test suite:

```bash
npm test src/app/api/cron/recalculate-ranks/__tests__/recalculate-ranks.test.ts
```

## Manual Trigger (Development)

To manually trigger the cron job for testing:

```bash
curl -X GET http://localhost:3000/api/cron/recalculate-ranks \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Monitoring

Check logs in Vercel dashboard:

1. Go to your project in Vercel
2. Navigate to "Deployments" > "Functions"
3. Find the cron execution logs
4. Look for `[Cron]` prefixed messages

## Performance Considerations

- Uses Supabase Service Role Key to bypass RLS for efficiency
- Processes users sequentially to avoid database overload
- Batch operations where possible (likes, comments counting)
- Graceful error handling per user (continues on individual failures)

## Future Improvements

- [ ] Add metrics tracking (execution time, error rate)
- [ ] Implement batch updates for better performance
- [ ] Add Sentry error tracking integration
- [ ] Cache frequently accessed data
- [ ] Add admin dashboard for monitoring
