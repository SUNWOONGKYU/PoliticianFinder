// Task: P6O3
// Sentry Server Configuration
// Generated: 2025-11-10
// Agent: devops-engineer

// NOTE: Install @sentry/nextjs with: npm install @sentry/nextjs
// Uncomment the following line after installing the package
// import * as Sentry from '@sentry/nextjs';

// Temporary type-safe stub until Sentry is installed
{
  const SentryServer = {
    init: (config: any) => {
      if (process.env.NODE_ENV !== 'development') {
        console.log('[Sentry Server] Would initialize with config:', config);
      }
    },
    Integrations: {
      Http: class {
        constructor(config: any) {}
      },
    },
  } as any;

  SentryServer.init({
    dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

    // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Set environment
    environment: process.env.NODE_ENV || 'development',

    // Configure integrations
    integrations: [
      new SentryServer.Integrations.Http({ tracing: true }),
    ],

    // Filter out sensitive information
    beforeSend(event: any, hint: any) {
      // Don't send events in development
      if (process.env.NODE_ENV === 'development') {
        return null;
      }

      // Filter out sensitive data from request
      if (event.request) {
        // Remove sensitive headers
        if (event.request.headers) {
          delete event.request.headers['authorization'];
          delete event.request.headers['cookie'];
        }

        // Remove sensitive query parameters
        if (event.request.query_string) {
          const params = new URLSearchParams(event.request.query_string);
          params.delete('token');
          params.delete('api_key');
          event.request.query_string = params.toString();
        }
      }

      return event;
    },

    // Ignore certain errors
    ignoreErrors: [
      // Expected errors
      'ZodError',
      // Supabase connection errors in development
      'ECONNREFUSED',
    ],
  });
}
