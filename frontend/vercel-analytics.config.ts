/**
 * Vercel Analytics Configuration
 * P4V1: Monitoring System Setup
 *
 * This configuration enables Vercel Analytics and Speed Insights
 * for production monitoring and performance tracking.
 */

export const analyticsConfig = {
  // Enable Vercel Analytics
  enabled: process.env.NODE_ENV === 'production',

  // Enable debug mode in development
  debug: process.env.NODE_ENV === 'development',

  // Custom events to track
  customEvents: {
    // User interactions
    politician_search: 'politician_search',
    politician_view: 'politician_view',
    comment_posted: 'comment_posted',
    bookmark_added: 'bookmark_added',
    notification_clicked: 'notification_clicked',

    // Performance events
    api_error: 'api_error',
    slow_response: 'slow_response',

    // Security events
    rate_limit_hit: 'rate_limit_hit',
    auth_failure: 'auth_failure',
  },

  // Speed Insights configuration
  speedInsights: {
    enabled: true,
    // Sample rate (1.0 = 100%)
    sampleRate: 1.0,
  },

  // Web Vitals tracking
  webVitals: {
    enabled: true,
    // Track all Core Web Vitals
    metrics: ['CLS', 'FID', 'FCP', 'LCP', 'TTFB', 'INP'],
  },
} as const;

export type AnalyticsEventName = keyof typeof analyticsConfig.customEvents;
