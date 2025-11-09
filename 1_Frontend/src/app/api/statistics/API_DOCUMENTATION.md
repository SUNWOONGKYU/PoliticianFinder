# Statistics & Health Check API Documentation

## Overview

This document describes the Real API implementations for statistics and health check endpoints, integrated with Supabase database.

**Task ID**: P3BA4
**Implementation Date**: 2025-11-07
**Database**: Supabase PostgreSQL
**Framework**: Next.js 14 App Router

---

## Endpoints

### 1. Overview Statistics

**Endpoint**: `GET /api/statistics/overview`

**Description**: Returns comprehensive platform-wide statistics including politicians, users, posts, comments, and engagement metrics.

**Response Structure**:
```json
{
  "success": true,
  "data": {
    "total": {
      "politicians": 0,
      "users": 0,
      "posts": 0,
      "comments": 0,
      "ratings": 0
    },
    "politicians": {
      "total": 0,
      "active": 0,
      "verified": 0,
      "verificationRate": 0
    },
    "community": {
      "totalUsers": 0,
      "totalPosts": 0,
      "totalComments": 0,
      "recentPosts30d": 0,
      "recentUsers30d": 0
    },
    "engagement": {
      "avgPostsPerUser": 0,
      "avgRatingsPerPolitician": 0
    }
  },
  "timestamp": "2025-11-07T00:00:00.000Z"
}
```

**Cache**: 5 minutes (s-maxage=300)

---

### 2. Community Statistics

**Endpoint**: `GET /api/statistics/community?period=30`

**Description**: Returns detailed community activity statistics including user engagement, posts, comments, and activity trends.

**Query Parameters**:
- `period` (optional): Number of days to analyze (default: 30)

**Response Structure**:
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 0,
      "active": 0,
      "new": 0,
      "activeRate": 0,
      "topUsers": []
    },
    "posts": {
      "total": 0,
      "approved": 0,
      "recent": 0,
      "byCategory": {},
      "topPosts": [],
      "approvalRate": 0
    },
    "comments": {
      "total": 0,
      "recent": 0,
      "avgPerPost": 0
    },
    "activity": {
      "period": 30,
      "trend": [],
      "avgDailyPosts": 0
    }
  },
  "timestamp": "2025-11-07T00:00:00.000Z"
}
```

**Cache**: 5 minutes (s-maxage=300)

---

### 3. Politicians Statistics

**Endpoint**: `GET /api/statistics/politicians-stats`

**Description**: Returns comprehensive politician-related statistics including distribution by party, region, position, and rankings.

**Response Structure**:
```json
{
  "success": true,
  "data": {
    "summary": {
      "total": 0,
      "verified": 0,
      "active": 0,
      "verificationRate": 0
    },
    "distribution": {
      "byParty": [],
      "byRegion": [],
      "byPosition": []
    },
    "averages": {
      "viewCount": 0,
      "favoriteCount": 0,
      "evaluationScore": 0
    },
    "rankings": {
      "topByViews": [],
      "topByFavorites": [],
      "topByRating": [],
      "recent": []
    }
  },
  "timestamp": "2025-11-07T00:00:00.000Z"
}
```

**Cache**: 5 minutes (s-maxage=300)

---

### 4. Payment Statistics

**Endpoint**: `GET /api/statistics/payments`

**Description**: Returns payment and revenue statistics including daily trends and aggregated metrics.

**Response Structure**:
```json
{
  "success": true,
  "data": {
    "totalRevenue": 0,
    "totalTransactions": 0,
    "averageAmount": 0,
    "monthlyRevenue": 0,
    "dailyStats": []
  },
  "timestamp": "2025-11-07T00:00:00.000Z"
}
```

**Cache**: 5 minutes (s-maxage=300)

---

### 5. Health Check

**Endpoint**: `GET /api/health`

**Description**: Returns system health status including database connectivity, environment validation, and response latency.

**Response Structure**:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-11-07T00:00:00.000Z",
  "uptime": 123.456,
  "latency": 45,
  "checks": {
    "api": {
      "status": "healthy",
      "latency": 0
    },
    "database": {
      "status": "healthy",
      "latency": 42
    },
    "environment": {
      "status": "healthy"
    }
  },
  "version": "1.0.0",
  "environment": "development"
}
```

**Cache**: No cache (must-revalidate)

**Status Codes**:
- `200`: System is healthy
- `503`: System is unhealthy or degraded

---

## Security Considerations

1. **Database Access**: All APIs use Row Level Security (RLS) policies via Supabase
2. **Authentication**: Server-side Supabase client with proper cookie handling
3. **Rate Limiting**: Recommended to add rate limiting middleware
4. **Input Validation**: Query parameters are validated and sanitized
5. **Error Handling**: Sensitive information is not exposed in error messages

---

## Performance Optimizations

1. **Caching Strategy**:
   - Statistics endpoints: 5-minute cache with stale-while-revalidate
   - Health check: No cache for real-time status

2. **Database Queries**:
   - Parallel queries using Promise.all()
   - Indexed columns (view_count, favorite_count, created_at)
   - Count-only queries where possible (head: true)

3. **Response Size**:
   - Limited result sets (Top 10 rankings)
   - Aggregated data to reduce payload size

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed error description"
}
```

**Common Status Codes**:
- `200`: Success
- `500`: Internal server error
- `503`: Service unavailable (health check only)

---

## Testing

Test file location: `src/app/api/statistics/__tests__/statistics.test.ts`

Run tests:
```bash
npm test -- statistics.test.ts
```

---

## Database Dependencies

The following Supabase tables are required:
- `users`
- `politicians`
- `posts`
- `comments` (optional, gracefully handled if missing)
- `ratings` (optional, gracefully handled if missing)
- `payments`

---

## Next Steps

1. Implement rate limiting middleware
2. Add request logging for analytics
3. Create Supabase Edge Functions for complex aggregations
4. Add real-time subscriptions for live statistics
5. Implement data export functionality

---

## References

- Supabase Client: `src/lib/supabase/server.ts`
- Database Types: `src/lib/database.types.ts`
- Migration Files: `src/0-4_Database/Supabase/migrations/`
