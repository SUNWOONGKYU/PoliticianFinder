/**
 * Web Vitals Reporter Component
 * P4F1: Frontend Performance Optimization
 *
 * Measures and reports Core Web Vitals metrics
 */

'use client';

import { useEffect } from 'react';
import { useReportWebVitals } from 'next/web-vitals';
import { reportWebVitals, PerformanceMonitor } from '@/lib/performance-monitoring';

export function WebVitalsReporter() {
  // Use Next.js built-in Web Vitals reporting
  useReportWebVitals((metric) => {
    reportWebVitals(metric);
  });

  useEffect(() => {
    // Initialize performance monitor
    const monitor = PerformanceMonitor.getInstance();

    // Mark app initialization
    monitor.mark('app-init');

    // Log performance summary after page load
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        setTimeout(() => {
          monitor.measure('app-ready', 'app-init');

          if (process.env.NODE_ENV === 'development') {
            // Log summary in development
            const navTiming = monitor.getNavigationTiming();
            const resourceTiming = monitor.getResourceTiming();

            console.group('📊 Performance Metrics');
            console.log('Navigation:', navTiming);
            console.log('Resources:', resourceTiming);
            console.groupEnd();
          }
        }, 0);
      });
    }

    // Cleanup on unmount
    return () => {
      monitor.disconnect();
    };
  }, []);

  return null;
}
