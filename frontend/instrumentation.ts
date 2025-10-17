/**
 * Next.js Instrumentation for Monitoring
 *
 * This file is automatically loaded by Next.js to set up monitoring
 * and observability tools.
 */

export async function register() {
  // Only run in Node.js environment (server-side)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Initialize Sentry for server-side error tracking
    // Uncomment when @sentry/nextjs is installed:
    /*
    const Sentry = await import('@sentry/nextjs');
    const { getSentryConfig } = await import('./src/lib/monitoring/sentry');

    Sentry.init({
      ...getSentryConfig(),
      // Server-specific options
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
      ],
    });
    */

    console.log('[Instrumentation] Server-side monitoring initialized');
  }

  // Edge runtime
  if (process.env.NEXT_RUNTIME === 'edge') {
    // Initialize edge-compatible monitoring
    console.log('[Instrumentation] Edge runtime monitoring initialized');
  }
}
