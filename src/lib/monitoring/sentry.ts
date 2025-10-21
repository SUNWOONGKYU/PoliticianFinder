/**
 * P3V2: Sentry Error Tracking Configuration
 *
 * Centralized error tracking and monitoring setup
 */

// This file provides the configuration structure for Sentry
// Actual Sentry SDK should be installed via: npm install @sentry/nextjs

interface SentryConfig {
  dsn: string;
  environment: string;
  tracesSampleRate: number;
  replaysSessionSampleRate: number;
  replaysOnErrorSampleRate: number;
  beforeSend?: (event: any, hint: any) => any;
}

/**
 * Get Sentry configuration based on environment
 */
export function getSentryConfig(): SentryConfig {
  return {
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
    environment: process.env.NODE_ENV || 'development',

    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of errors

    // Filter out sensitive information
    beforeSend: (event, hint) => {
      // Remove sensitive data from error events
      if (event.request) {
        delete event.request.cookies;

        // Redact sensitive headers
        if (event.request.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
        }

        // Redact sensitive query params
        if (event.request.query_string) {
          const sensitiveParams = ['token', 'api_key', 'password', 'secret'];
          let queryString = event.request.query_string;

          sensitiveParams.forEach(param => {
            const regex = new RegExp(`${param}=[^&]*`, 'gi');
            queryString = queryString.replace(regex, `${param}=[REDACTED]`);
          });

          event.request.query_string = queryString;
        }
      }

      // Remove user email from user context (keep user ID)
      if (event.user?.email) {
        event.user.email = '[REDACTED]';
      }

      return event;
    },
  };
}

/**
 * Custom error capture with context
 */
export function captureError(
  error: Error,
  context?: {
    tags?: Record<string, string>;
    level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
    extra?: Record<string, any>;
  }
) {
  // In production with Sentry installed, this would call:
  // Sentry.captureException(error, { tags, level, extra });

  console.error('[Error Tracking]', {
    error: error.message,
    stack: error.stack,
    ...context,
    timestamp: new Date().toISOString(),
  });

  // Development fallback
  if (process.env.NODE_ENV === 'development') {
    console.error(error);
  }
}

/**
 * Capture custom message/event
 */
export function captureMessage(
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
  context?: Record<string, any>
) {
  console.log('[Monitoring]', {
    message,
    level,
    ...context,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Set user context for error tracking
 */
export function setUserContext(user: {
  id: string;
  username?: string;
  email?: string;
}) {
  // In production with Sentry: Sentry.setUser({ id, username });
  console.log('[User Context Set]', {
    userId: user.id,
    username: user.username,
  });
}

/**
 * Clear user context (e.g., on logout)
 */
export function clearUserContext() {
  // In production with Sentry: Sentry.setUser(null);
  console.log('[User Context Cleared]');
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(
  message: string,
  category: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
  data?: Record<string, any>
) {
  // In production with Sentry: Sentry.addBreadcrumb({ message, category, level, data });
  console.debug('[Breadcrumb]', {
    message,
    category,
    level,
    data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Start transaction for performance monitoring
 */
export function startTransaction(name: string, op: string) {
  // In production with Sentry: Sentry.startTransaction({ name, op });
  const start = Date.now();

  return {
    name,
    op,
    start,
    finish: () => {
      const duration = Date.now() - start;
      console.debug('[Performance]', {
        name,
        op,
        duration: `${duration}ms`,
      });
    },
  };
}

/**
 * Error boundary integration helper
 */
export function withErrorBoundary<T extends React.ComponentType<any>>(
  Component: T,
  options?: {
    fallback?: React.ReactElement;
    showDialog?: boolean;
  }
): T {
  // In production, this would wrap with Sentry's ErrorBoundary
  return Component;
}

// Export configuration for initialization
export const sentryConfig = getSentryConfig();
