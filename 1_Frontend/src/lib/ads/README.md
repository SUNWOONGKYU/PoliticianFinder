# Advertisement System - Quick Reference

**Task ID**: P4BA9
**Module**: Advertisement Management

## Quick Start

### Display Ads on Your Page

```typescript
import { getActiveAdsForPlacement } from '@/lib/ads/placement-manager';

// In your component
const ads = await getActiveAdsForPlacement('sidebar');
const randomAd = ads[Math.floor(Math.random() * ads.length)];
```

### Track Ad Events

```typescript
import { recordAdImpression, recordAdClick } from '@/lib/ads/placement-manager';

// Track impression when ad is displayed
await recordAdImpression(ad.id);

// Track click when user clicks ad
await recordAdClick(ad.id);
```

## Available Placements

- `main` - Main page banner (prominent)
- `sidebar` - Sidebar ads (persistent)
- `post_top` - Top of post content
- `post_bottom` - Bottom of post content

## API Endpoints

### Public Endpoints

```typescript
// Get active ads
GET /api/ads?placement=sidebar

// Track events
POST /api/ads/track
{
  "ad_id": "uuid",
  "event": "impression" | "click"
}
```

### Admin Endpoints

```typescript
// List ads
GET /api/admin/ads?page=1&limit=20&placement=main

// Create ad
POST /api/admin/ads
{
  "title": "Ad Title",
  "image_url": "https://...",
  "link_url": "https://...",
  "placement": "main",
  "start_date": "2025-01-01T00:00:00Z",
  "end_date": "2025-12-31T23:59:59Z"
}

// Update ad
PATCH /api/admin/ads/[id]
{ "is_active": false }

// Delete ad
DELETE /api/admin/ads/[id]

// Get statistics
GET /api/admin/ads/stats
```

## Example: Ad Component

```tsx
'use client';

import { useState, useEffect } from 'react';

export function AdBanner({ placement }: { placement: string }) {
  const [ad, setAd] = useState(null);

  useEffect(() => {
    fetchAndDisplayAd();
  }, []);

  const fetchAndDisplayAd = async () => {
    const res = await fetch(`/api/ads?placement=${placement}`);
    const { data: ads } = await res.json();

    if (ads.length > 0) {
      const randomAd = ads[Math.floor(Math.random() * ads.length)];
      setAd(randomAd);

      // Track impression
      await fetch('/api/ads/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ad_id: randomAd.id,
          event: 'impression',
        }),
      });
    }
  };

  const handleClick = async () => {
    if (!ad) return;

    // Track click
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

  if (!ad) return null;

  return (
    <div className="ad-banner" onClick={handleClick}>
      <img src={ad.image_url} alt={ad.title} />
    </div>
  );
}
```

## Database Schema

```sql
CREATE TABLE advertisements (
  id UUID PRIMARY KEY,
  title VARCHAR(100),
  image_url TEXT,
  link_url TEXT,
  placement VARCHAR(50),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE
);
```

## Helper Functions

```typescript
// Check if ad is currently active
isAdActive(ad: Advertisement): boolean

// Calculate click-through rate
calculateCTR(ad: Advertisement): number

// Validate placement type
isValidPlacement(placement: string): boolean
```

## Best Practices

1. **Always track impressions** when displaying ads
2. **Always track clicks** when user clicks
3. **Use caching** for public endpoints (already implemented)
4. **Rotate ads** for better engagement
5. **Monitor CTR** to optimize performance

## See Also

- Full API Documentation: `src/app/api/admin/ads/API_DOCUMENTATION.md`
- Implementation Summary: `P4BA9_IMPLEMENTATION_SUMMARY.md`
- Tests: `src/app/api/admin/ads/__tests__/ads.test.ts`
