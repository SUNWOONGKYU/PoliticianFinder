/**
 * P3V1: Analytics and Monitoring Configuration
 *
 * Vercel Analytics and custom event tracking
 */

/**
 * Track custom events for analytics
 */
export function trackEvent(
  eventName: string,
  properties?: Record<string, any>
) {
  // Vercel Analytics
  if (typeof window !== 'undefined' && (window as any).va) {
    (window as any).va('event', eventName, properties);
  }

  // Console logging for development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics Event]', {
      event: eventName,
      properties,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Track page views
 */
export function trackPageView(url: string, title?: string) {
  trackEvent('page_view', {
    url,
    title: title || document.title,
    referrer: document.referrer,
  });
}

/**
 * Track user interactions
 */
export const analytics = {
  // User actions
  userSignUp: () => trackEvent('user_signup'),
  userLogin: () => trackEvent('user_login'),
  userLogout: () => trackEvent('user_logout'),

  // Content interactions
  politicianView: (politicianId: number) =>
    trackEvent('politician_view', { politician_id: politicianId }),

  ratingSubmit: (politicianId: number, rating: number) =>
    trackEvent('rating_submit', { politician_id: politicianId, rating }),

  commentSubmit: (politicianId: number) =>
    trackEvent('comment_submit', { politician_id: politicianId }),

  replySubmit: (commentId: number) =>
    trackEvent('reply_submit', { comment_id: commentId }),

  likeAction: (targetType: 'comment' | 'rating', targetId: number) =>
    trackEvent('like_action', { target_type: targetType, target_id: targetId }),

  bookmarkToggle: (politicianId: number, action: 'add' | 'remove') =>
    trackEvent('bookmark_toggle', { politician_id: politicianId, action }),

  // Search and filter
  search: (query: string, resultsCount: number) =>
    trackEvent('search', { query, results_count: resultsCount }),

  filterApply: (filters: Record<string, any>) =>
    trackEvent('filter_apply', { filters }),

  sortChange: (sortBy: string, sortOrder: string) =>
    trackEvent('sort_change', { sort_by: sortBy, sort_order: sortOrder }),

  // Notifications
  notificationClick: (notificationType: string) =>
    trackEvent('notification_click', { notification_type: notificationType }),

  notificationMarkRead: (count: number) =>
    trackEvent('notification_mark_read', { count }),

  // Errors (non-critical)
  formError: (formName: string, errorType: string) =>
    trackEvent('form_error', { form_name: formName, error_type: errorType }),

  apiError: (endpoint: string, statusCode: number) =>
    trackEvent('api_error', { endpoint, status_code: statusCode }),

  // Performance metrics
  pageLoadTime: (duration: number) =>
    trackEvent('page_load_time', { duration }),

  apiResponseTime: (endpoint: string, duration: number) =>
    trackEvent('api_response_time', { endpoint, duration }),
};

/**
 * Initialize analytics
 */
export function initializeAnalytics() {
  if (typeof window === 'undefined') return;

  // Track page load performance
  if (window.performance && window.performance.timing) {
    const loadTime =
      window.performance.timing.loadEventEnd -
      window.performance.timing.navigationStart;

    if (loadTime > 0) {
      analytics.pageLoadTime(loadTime);
    }
  }

  // Track initial page view
  trackPageView(window.location.pathname + window.location.search);

  console.log('[Analytics] Initialized');
}

/**
 * Web Vitals tracking (Core Web Vitals for Vercel)
 */
export function reportWebVitals(metric: {
  id: string;
  name: string;
  value: number;
  label: string;
}) {
  // Send to Vercel Analytics
  if (typeof window !== 'undefined' && (window as any).va) {
    (window as any).va('event', 'web_vitals', {
      metric_name: metric.name,
      metric_value: metric.value,
      metric_label: metric.label,
    });
  }

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Web Vitals]', {
      name: metric.name,
      value: metric.value,
      label: metric.label,
    });
  }
}

/**
 * Custom performance monitoring
 */
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();

  start(label: string) {
    this.marks.set(label, Date.now());
  }

  end(label: string, logToAnalytics = true) {
    const startTime = this.marks.get(label);
    if (!startTime) {
      console.warn(`[Performance] No start mark found for: ${label}`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.marks.delete(label);

    if (logToAnalytics) {
      trackEvent('performance_metric', {
        label,
        duration,
      });
    }

    return duration;
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();
