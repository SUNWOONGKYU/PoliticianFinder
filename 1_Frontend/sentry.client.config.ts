// Task: P6O3
// Sentry Client Configuration
// Generated: 2025-11-10
// Agent: devops-engineer

// NOTE: Install @sentry/nextjs with: npm install @sentry/nextjs
// Uncomment the following line after installing the package
// import * as Sentry from '@sentry/nextjs';

// Temporary type-safe stub until Sentry is installed
{
  const SentryClient = {
    init: (config: any) => {
      if (process.env.NODE_ENV !== 'development') {
        console.log('[Sentry] Would initialize with config:', config);
      }
    },
    BrowserTracing: class {},
    Replay: class {
      constructor(config: any) {}
    },
  } as any;

  SentryClient.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Capture Replay for 10% of all sessions,
    // plus for 100% of sessions with an error
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Set environment
    environment: process.env.NODE_ENV || 'development',

    // Configure integrations
    integrations: [
      new SentryClient.BrowserTracing(),
      new SentryClient.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Filter out sensitive information
    beforeSend(event: any, hint: any) {
      // Don't send events in development
      if (process.env.NODE_ENV === 'development') {
        return null;
      }

      // Filter out sensitive user data
      if (event.user) {
        delete event.user.email;
        delete event.user.ip_address;
      }

      return event;
    },

    // Ignore certain errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      // Network errors
      'NetworkError',
      'Network request failed',
      // Random plugins/extensions
      'Non-Error promise rejection captured',
    ],
  });
}
