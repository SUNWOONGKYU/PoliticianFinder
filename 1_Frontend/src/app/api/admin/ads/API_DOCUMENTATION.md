# Advertisement Management API Documentation

**Task ID**: P4BA9
**Created**: 2025-11-09
**Status**: Completed

## Overview

The Advertisement Management API provides comprehensive endpoints for managing advertisements in the PoliticianFinder platform. This includes admin-only endpoints for CRUD operations and public endpoints for displaying and tracking ads.

---

## API Endpoints

### Admin Endpoints (Authentication Required)

#### 1. List Advertisements
**GET** `/api/admin/ads`

Get a paginated list of all advertisements.

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `placement` (optional): Filter by placement (main, sidebar, post_top, post_bottom)
- `is_active` (optional): Filter by active status (true/false)
- `sort` (optional): Sort field (default: -created_at)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "광고 제목",
      "image_url": "https://example.com/ad-image.jpg",
      "link_url": "https://example.com/landing",
      "placement": "main",
      "start_date": "2025-01-01T00:00:00Z",
      "end_date": "2025-12-31T23:59:59Z",
      "impressions": 1000,
      "clicks": 50,
      "is_active": true,
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  },
  "timestamp": "2025-11-09T00:00:00Z"
}
```

---

#### 2. Create Advertisement
**POST** `/api/admin/ads`

Create a new advertisement.

**Request Body**:
```json
{
  "title": "광고 제목",
  "image_url": "https://example.com/ad-image.jpg",
  "link_url": "https://example.com/landing",
  "placement": "main",
  "start_date": "2025-01-01T00:00:00Z",
  "end_date": "2025-12-31T23:59:59Z",
  "is_active": true
}
```

**Validation Rules**:
- `title`: 1-100 characters
- `image_url`: Valid URL
- `link_url`: Valid URL
- `placement`: One of: main, sidebar, post_top, post_bottom
- `start_date`: Valid ISO date string
- `end_date`: Valid ISO date string, must be after start_date
- `is_active`: Boolean (optional, default: true)

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "광고 제목",
    "image_url": "https://example.com/ad-image.jpg",
    "link_url": "https://example.com/landing",
    "placement": "main",
    "start_date": "2025-01-01T00:00:00Z",
    "end_date": "2025-12-31T23:59:59Z",
    "impressions": 0,
    "clicks": 0,
    "is_active": true,
    "created_at": "2025-11-09T00:00:00Z",
    "updated_at": "2025-11-09T00:00:00Z"
  },
  "message": "광고가 성공적으로 등록되었습니다."
}
```

---

#### 3. Get Advertisement Details
**GET** `/api/admin/ads/[id]`

Get detailed information about a specific advertisement.

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "광고 제목",
    "image_url": "https://example.com/ad-image.jpg",
    "link_url": "https://example.com/landing",
    "placement": "main",
    "start_date": "2025-01-01T00:00:00Z",
    "end_date": "2025-12-31T23:59:59Z",
    "impressions": 1000,
    "clicks": 50,
    "ctr": 5.0,
    "is_active": true,
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  },
  "timestamp": "2025-11-09T00:00:00Z"
}
```

---

#### 4. Update Advertisement
**PATCH** `/api/admin/ads/[id]`

Update an existing advertisement.

**Request Body** (all fields optional):
```json
{
  "title": "수정된 광고 제목",
  "image_url": "https://example.com/new-image.jpg",
  "link_url": "https://example.com/new-landing",
  "placement": "sidebar",
  "start_date": "2025-01-01T00:00:00Z",
  "end_date": "2025-12-31T23:59:59Z",
  "is_active": false
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "수정된 광고 제목",
    ...
  },
  "message": "광고가 성공적으로 수정되었습니다."
}
```

---

#### 5. Delete Advertisement (Soft Delete)
**DELETE** `/api/admin/ads/[id]`

Soft delete an advertisement by setting `is_active` to false.

**Response** (200 OK):
```json
{
  "success": true,
  "message": "광고가 성공적으로 삭제되었습니다."
}
```

---

#### 6. Get Advertisement Statistics
**GET** `/api/admin/ads/stats`

Get comprehensive statistics about advertisements.

**Query Parameters**:
- `placement` (optional): Filter by placement
- `start_date` (optional): Filter by creation date (from)
- `end_date` (optional): Filter by creation date (to)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalAds": 50,
      "activeAds": 30,
      "inactiveAds": 20,
      "totalImpressions": 100000,
      "totalClicks": 5000,
      "avgCTR": 5.0
    },
    "byPlacement": [
      {
        "placement": "main",
        "totalAds": 15,
        "activeAds": 10,
        "impressions": 50000,
        "clicks": 2500,
        "ctr": 5.0
      },
      {
        "placement": "sidebar",
        "totalAds": 20,
        "activeAds": 12,
        "impressions": 30000,
        "clicks": 1500,
        "ctr": 5.0
      },
      {
        "placement": "post_top",
        "totalAds": 10,
        "activeAds": 5,
        "impressions": 15000,
        "clicks": 750,
        "ctr": 5.0
      },
      {
        "placement": "post_bottom",
        "totalAds": 5,
        "activeAds": 3,
        "impressions": 5000,
        "clicks": 250,
        "ctr": 5.0
      }
    ],
    "topPerforming": [
      {
        "id": "uuid",
        "title": "최고 성과 광고",
        "placement": "main",
        "impressions": 10000,
        "clicks": 800,
        "ctr": 8.0
      }
    ]
  },
  "timestamp": "2025-11-09T00:00:00Z"
}
```

---

### Public Endpoints (No Authentication)

#### 7. Get Active Advertisements
**GET** `/api/ads?placement={placement}`

Get active advertisements for a specific placement.

**Query Parameters**:
- `placement` (required): Placement location (main, sidebar, post_top, post_bottom)

**Response** (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "광고 제목",
      "image_url": "https://example.com/ad-image.jpg",
      "link_url": "https://example.com/landing",
      "placement": "main",
      "start_date": "2025-01-01T00:00:00Z",
      "end_date": "2025-12-31T23:59:59Z",
      "impressions": 1000,
      "clicks": 50,
      "is_active": true,
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

**Cache Headers**: `Cache-Control: public, s-maxage=60, stale-while-revalidate=120`

---

#### 8. Track Advertisement Event
**POST** `/api/ads/track`

Track an advertisement impression or click.

**Request Body**:
```json
{
  "ad_id": "uuid",
  "event": "impression"
}
```

**Event Types**:
- `impression`: Ad was displayed to user
- `click`: User clicked on the ad

**Response** (200 OK):
```json
{
  "success": true,
  "message": "추적 완료"
}
```

---

## Error Responses

All endpoints follow a consistent error response format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": []
  }
}
```

### Error Codes

- `UNAUTHORIZED` (401): Not authenticated
- `FORBIDDEN` (403): Not authorized (admin required)
- `VALIDATION_ERROR` (400): Invalid input data
- `NOT_FOUND` (404): Resource not found
- `DATABASE_ERROR` (500): Database operation failed
- `INTERNAL_SERVER_ERROR` (500): Unexpected server error

---

## Advertisement Placements

### Available Placements

1. **main**: Main page banner (prominent position)
2. **sidebar**: Sidebar ads (consistent across pages)
3. **post_top**: Top of post content
4. **post_bottom**: Bottom of post content

### Placement Guidelines

- **main**: High-traffic area, best for brand awareness
- **sidebar**: Persistent visibility, good for retargeting
- **post_top**: Contextual placement, high engagement
- **post_bottom**: End of content, good for conversion

---

## Database Schema

### advertisements Table

```sql
CREATE TABLE advertisements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(100) NOT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT NOT NULL,
  placement VARCHAR(50) NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Indexes

- `idx_ads_placement`: Fast lookup by placement
- `idx_ads_active`: Filter active ads
- `idx_ads_dates`: Date range queries
- `idx_ads_created_at`: Sorting by creation date

---

## Usage Examples

### Admin: Create an Ad Campaign

```typescript
const response = await fetch('/api/admin/ads', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: '2025 선거 특집 광고',
    image_url: 'https://cdn.example.com/election-2025.jpg',
    link_url: 'https://example.com/election-2025',
    placement: 'main',
    start_date: '2025-01-01T00:00:00Z',
    end_date: '2025-12-31T23:59:59Z',
    is_active: true,
  }),
});
```

### Frontend: Display Ads

```typescript
// Fetch ads for sidebar
const response = await fetch('/api/ads?placement=sidebar');
const { data: ads } = await response.json();

// Display first ad
const ad = ads[0];

// Track impression
await fetch('/api/ads/track', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ad_id: ad.id,
    event: 'impression',
  }),
});

// Track click when user clicks ad
handleAdClick = async () => {
  await fetch('/api/ads/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ad_id: ad.id,
      event: 'click',
    }),
  });
  window.open(ad.link_url, '_blank');
};
```

---

## Security

### Authentication

- Admin endpoints require authentication via `requireAdmin()` helper
- Public endpoints are accessible without authentication
- RLS policies enforce admin-only access to modifications

### Rate Limiting

- Consider implementing rate limiting on tracking endpoints to prevent abuse
- Recommended: 100 requests per minute per IP for tracking endpoints

### Input Validation

- All inputs are validated using Zod schemas
- URL validation prevents XSS attacks
- UUID validation prevents SQL injection

---

## Performance Considerations

### Caching

- Public ad endpoints use cache headers (60s cache, 120s stale-while-revalidate)
- Stats endpoint can be cached for 5 minutes
- Consider CDN caching for ad images

### Database Optimization

- Indexes on `placement`, `is_active`, and date fields for fast queries
- Database functions for atomic impression/click increments
- Consider archiving old inactive ads

### Monitoring

- Track CTR (Click-Through Rate) metrics
- Monitor API response times
- Alert on unusual traffic patterns

---

## Future Enhancements

1. **A/B Testing**: Support multiple ads per placement with rotation
2. **Targeting**: User-based targeting (demographics, interests)
3. **Scheduling**: Advanced scheduling with time-of-day targeting
4. **Reporting**: Enhanced analytics and reporting dashboard
5. **Ad Formats**: Support for video ads, carousel ads
6. **Budget Management**: Cost-per-click (CPC) and budget tracking

---

**Last Updated**: 2025-11-09
**API Version**: v1.0
**Maintainer**: api-designer (P4BA9)
