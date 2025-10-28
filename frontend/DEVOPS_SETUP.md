# DevOps & Monitoring Setup Guide

This document provides comprehensive setup instructions for Phase 3 DevOps tasks (P3V1-P3V3).

## Table of Contents

1. [Vercel Analytics Setup (P3V1)](#vercel-analytics-setup)
2. [Sentry Error Tracking (P3V2)](#sentry-error-tracking)
3. [Uptime Monitoring (P3V3)](#uptime-monitoring)
4. [Health Check Endpoint](#health-check-endpoint)
5. [CI/CD Integration](#cicd-integration)

---

## Vercel Analytics Setup (P3V1)

### Installation

```bash
npm install @vercel/analytics
```

### Configuration

1. **Add Analytics to Root Layout**

Update `src/app/layout.tsx`:

```typescript
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

2. **Enable Vercel Analytics in Dashboard**

- Go to your project in Vercel Dashboard
- Navigate to Settings > Analytics
- Enable Analytics
- Copy the Analytics ID (if required)

3. **Custom Event Tracking**

The analytics library is already configured in `src/lib/monitoring/analytics.ts`. Use it like:

```typescript
import { analytics } from '@/lib/monitoring/analytics';

// Track events
analytics.politicianView(politicianId);
analytics.ratingSubmit(politicianId, rating);
analytics.commentSubmit(politicianId);
```

### Web Vitals Integration

Add to `src/app/layout.tsx`:

```typescript
import { reportWebVitals } from '@/lib/monitoring/analytics';

export { reportWebVitals };
```

---

## Sentry Error Tracking (P3V2)

### Installation

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

### Configuration Files

1. **Environment Variables**

Add to `.env.local`:

```env
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
SENTRY_ORG=your_org
SENTRY_PROJECT=politician-finder
SENTRY_AUTH_TOKEN=your_auth_token
```

2. **Sentry Configuration**

The wizard will create:
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`

Example configuration:

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';
import { getSentryConfig } from './src/lib/monitoring/sentry';

Sentry.init({
  ...getSentryConfig(),

  // Browser-specific options
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
```

3. **Using Sentry in Code**

```typescript
import { captureError, captureMessage } from '@/lib/monitoring/sentry';

try {
  // Your code
} catch (error) {
  captureError(error, {
    tags: { component: 'PoliticianList' },
    level: 'error',
    extra: { politicianId: id },
  });
}
```

### Error Boundary

Create an error boundary component:

```typescript
'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <h2>Something went wrong!</h2>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  );
}
```

---

## Uptime Monitoring (P3V3)

### Option 1: UptimeRobot (Free)

1. **Sign up**: https://uptimerobot.com/
2. **Add Monitor**:
   - Monitor Type: HTTP(s)
   - URL: `https://your-domain.com/api/health`
   - Monitoring Interval: 5 minutes
   - Monitor Timeout: 30 seconds
   - Alert Contacts: Add your email/Slack

3. **Configure Alerts**:
   - Email notifications
   - Slack integration
   - SMS (paid)

### Option 2: Better Uptime

1. **Sign up**: https://betteruptime.com/
2. **Create Monitor**:
   - URL: `https://your-domain.com/api/health`
   - Check frequency: 30 seconds
   - Expected status code: 200
   - Timeout: 30 seconds

3. **Alert Channels**:
   - Email
   - Slack
   - Discord
   - PagerDuty

### Option 3: Vercel Monitoring

Vercel provides built-in monitoring:
- Go to Vercel Dashboard > Your Project > Monitoring
- View deployment status, build times, and errors
- Set up alerts for deployment failures

---

## Health Check Endpoint

### Implementation

The health check endpoint is implemented at `src/app/api/health/route.ts`.

### Endpoints

1. **GET /api/health** - Full health status

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-17T10:00:00Z",
  "uptime": 3600,
  "checks": {
    "database": {
      "status": "ok",
      "responseTime": 45
    },
    "api": {
      "status": "ok",
      "responseTime": 12
    }
  },
  "version": "1.0.0",
  "environment": "production"
}
```

2. **HEAD /api/health** - Simple ping

Returns 200 OK if service is up.

### Testing Health Endpoint

```bash
# Full health check
curl https://your-domain.com/api/health

# Simple ping
curl -I https://your-domain.com/api/health
```

---

## CI/CD Integration

### GitHub Actions - Monitoring Integration

Update `.github/workflows/cd.yml` to include health checks:

```yaml
- name: Health Check After Deployment
  run: |
    sleep 10
    response=$(curl -s -o /dev/null -w "%{http_code}" https://your-domain.com/api/health)
    if [ $response -ne 200 ]; then
      echo "Health check failed with status $response"
      exit 1
    fi
```

### Vercel Deployment Notifications

Add to `vercel.json`:

```json
{
  "github": {
    "enabled": true,
    "autoAlias": true,
    "silent": false
  }
}
```

---

## Monitoring Dashboard URLs

After setup, you'll have access to:

1. **Vercel Analytics**
   - URL: `https://vercel.com/your-org/politician-finder/analytics`
   - Metrics: Page views, user sessions, Web Vitals

2. **Sentry Dashboard**
   - URL: `https://sentry.io/organizations/your-org/issues/`
   - Metrics: Errors, performance, releases

3. **Uptime Monitor**
   - UptimeRobot: `https://stats.uptimerobot.com/your-status-page`
   - Better Uptime: `https://your-domain.betteruptime.com`

---

## Environment Variables Summary

Add these to Vercel project settings and `.env.local`:

```env
# Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your_analytics_id

# Sentry
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
SENTRY_ORG=your_org
SENTRY_PROJECT=politician-finder
SENTRY_AUTH_TOKEN=your_auth_token

# App Version (for health check)
NEXT_PUBLIC_APP_VERSION=1.0.0

# Environment
NODE_ENV=production
```

---

## Testing the Setup

### 1. Test Health Check

```bash
npm run dev
curl http://localhost:3000/api/health
```

Expected: 200 OK with health status JSON

### 2. Test Error Tracking

Create a test error:

```typescript
// In any component
throw new Error('Test error for Sentry');
```

Check Sentry dashboard for the error.

### 3. Test Analytics

```typescript
import { analytics } from '@/lib/monitoring/analytics';

analytics.userLogin();
```

Check Vercel Analytics dashboard.

### 4. Test Uptime Monitor

- Deploy to Vercel
- Add monitor URL
- Wait for first check (5 minutes)
- Verify status is "Up"

---

## Troubleshooting

### Analytics Not Showing

- Verify `@vercel/analytics` is installed
- Check Analytics is enabled in Vercel dashboard
- Clear cache and redeploy
- Wait 5-10 minutes for data to appear

### Sentry Not Capturing Errors

- Verify DSN is correct in environment variables
- Check Sentry project settings
- Ensure errors are thrown in client components
- Check browser console for Sentry initialization

### Health Check Failing

- Check database connection (Supabase credentials)
- Verify Next.js server is running
- Check for firewall/networking issues
- Review logs: `vercel logs your-deployment-url`

---

## Maintenance

### Regular Tasks

1. **Weekly**:
   - Review Sentry error reports
   - Check uptime statistics
   - Analyze Web Vitals trends

2. **Monthly**:
   - Review analytics reports
   - Update monitoring thresholds
   - Test alert notifications

3. **Quarterly**:
   - Audit error tracking configuration
   - Review and optimize performance metrics
   - Update monitoring documentation

---

## Additional Resources

- [Vercel Analytics Docs](https://vercel.com/docs/analytics)
- [Sentry Next.js Guide](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [UptimeRobot API](https://uptimerobot.com/api/)
- [Better Uptime Docs](https://betteruptime.com/docs)

---

**Last Updated**: 2025-10-17
**Maintained By**: DevOps Team
**Version**: 1.0.0
