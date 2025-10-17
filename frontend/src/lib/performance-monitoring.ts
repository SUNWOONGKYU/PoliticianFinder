/**
 * Performance Monitoring Utilities
 * P4F1: Frontend Performance Optimization
 *
 * Monitors Web Vitals and custom performance metrics
 */

export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  navigationType: string;
}

export interface WebVitalsMetric {
  id: string;
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  navigationType: 'navigate' | 'reload' | 'back-forward' | 'back-forward-cache' | 'prerender' | 'restore';
}

/**
 * Thresholds for Web Vitals metrics (in milliseconds)
 */
const METRIC_THRESHOLDS = {
  // Largest Contentful Paint
  LCP: { good: 2500, poor: 4000 },
  // First Input Delay
  FID: { good: 100, poor: 300 },
  // Cumulative Layout Shift (unitless)
  CLS: { good: 0.1, poor: 0.25 },
  // First Contentful Paint
  FCP: { good: 1800, poor: 3000 },
  // Time to First Byte
  TTFB: { good: 800, poor: 1800 },
  // Interaction to Next Paint
  INP: { good: 200, poor: 500 },
} as const;

/**
 * Get rating for a metric value
 */
function getRating(
  name: keyof typeof METRIC_THRESHOLDS,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = METRIC_THRESHOLDS[name];
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Report Web Vitals to analytics service
 */
export function reportWebVitals(metric: WebVitalsMetric): void {
  const { name, value, id, rating } = metric;

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${name}:`, {
      value: Math.round(name === 'CLS' ? value * 1000 : value),
      rating,
      id,
    });
  }

  // Send to analytics in production
  if (process.env.NODE_ENV === 'production') {
    // TODO: Integrate with analytics service (Google Analytics, Vercel Analytics, etc.)
    // Example for Google Analytics:
    /*
    if (window.gtag) {
      window.gtag('event', name, {
        event_category: 'Web Vitals',
        value: Math.round(name === 'CLS' ? value * 1000 : value),
        event_label: id,
        non_interaction: true,
      });
    }
    */

    // Example for custom analytics endpoint:
    /*
    fetch('/api/analytics/web-vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metric: name,
        value,
        rating,
        id,
        url: window.location.href,
        timestamp: Date.now(),
      }),
    }).catch(console.error);
    */
  }

  // Store in sessionStorage for debugging
  if (typeof window !== 'undefined') {
    const metrics = JSON.parse(sessionStorage.getItem('webVitals') || '[]');
    metrics.push({ name, value, rating, timestamp: Date.now() });
    sessionStorage.setItem('webVitals', JSON.stringify(metrics));
  }
}

/**
 * Performance Observer for custom metrics
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private observers: PerformanceObserver[] = [];

  private constructor() {
    if (typeof window === 'undefined') return;
    this.initObservers();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private initObservers(): void {
    // Observe long tasks (> 50ms)
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              console.warn('[Performance] Long Task detected:', {
                duration: Math.round(entry.duration),
                name: entry.name,
                startTime: Math.round(entry.startTime),
              });
            }
          }
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(longTaskObserver);
      } catch (e) {
        // Long tasks not supported in all browsers
      }

      // Observe layout shifts
      try {
        const layoutShiftObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if ((entry as any).hadRecentInput) continue;
            const value = (entry as any).value;
            if (value > 0.1) {
              console.warn('[Performance] Layout Shift detected:', {
                value: value.toFixed(4),
                sources: (entry as any).sources,
              });
            }
          }
        });
        layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(layoutShiftObserver);
      } catch (e) {
        // Layout shift not supported in all browsers
      }
    }
  }

  /**
   * Mark custom performance metric
   */
  mark(name: string): void {
    if (typeof window !== 'undefined' && performance.mark) {
      performance.mark(name);
    }
  }

  /**
   * Measure time between two marks
   */
  measure(name: string, startMark: string, endMark?: string): number | null {
    if (typeof window === 'undefined' || !performance.measure) return null;

    try {
      if (endMark) {
        performance.measure(name, startMark, endMark);
      } else {
        performance.measure(name, startMark);
      }

      const measures = performance.getEntriesByName(name, 'measure');
      const lastMeasure = measures[measures.length - 1];

      if (lastMeasure) {
        const duration = Math.round(lastMeasure.duration);

        if (process.env.NODE_ENV === 'development') {
          console.log(`[Performance] ${name}:`, `${duration}ms`);
        }

        return duration;
      }
    } catch (e) {
      console.error('[Performance] Measurement error:', e);
    }

    return null;
  }

  /**
   * Get navigation timing metrics
   */
  getNavigationTiming(): Record<string, number> | null {
    if (typeof window === 'undefined') return null;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (!navigation) return null;

    return {
      // DNS lookup
      dns: Math.round(navigation.domainLookupEnd - navigation.domainLookupStart),
      // TCP connection
      tcp: Math.round(navigation.connectEnd - navigation.connectStart),
      // Time to first byte
      ttfb: Math.round(navigation.responseStart - navigation.requestStart),
      // Response download
      download: Math.round(navigation.responseEnd - navigation.responseStart),
      // DOM processing
      domProcessing: Math.round(navigation.domComplete - navigation.domInteractive),
      // Total load time
      loadComplete: Math.round(navigation.loadEventEnd - navigation.fetchStart),
    };
  }

  /**
   * Get resource timing summary
   */
  getResourceTiming(): { count: number; totalSize: number; totalDuration: number } | null {
    if (typeof window === 'undefined') return null;

    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

    const summary = resources.reduce(
      (acc, resource) => {
        acc.count++;
        acc.totalSize += resource.transferSize || 0;
        acc.totalDuration += resource.duration || 0;
        return acc;
      },
      { count: 0, totalSize: 0, totalDuration: 0 }
    );

    return {
      count: summary.count,
      totalSize: Math.round(summary.totalSize / 1024), // KB
      totalDuration: Math.round(summary.totalDuration),
    };
  }

  /**
   * Cleanup observers
   */
  disconnect(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

/**
 * Log performance summary to console
 */
export function logPerformanceSummary(): void {
  if (typeof window === 'undefined') return;

  const monitor = PerformanceMonitor.getInstance();

  console.group('📊 Performance Summary');

  // Navigation timing
  const navTiming = monitor.getNavigationTiming();
  if (navTiming) {
    console.log('Navigation Timing:', navTiming);
  }

  // Resource timing
  const resourceTiming = monitor.getResourceTiming();
  if (resourceTiming) {
    console.log('Resources:', resourceTiming);
  }

  // Web Vitals from sessionStorage
  const webVitals = JSON.parse(sessionStorage.getItem('webVitals') || '[]');
  if (webVitals.length > 0) {
    console.log('Web Vitals:', webVitals);
  }

  console.groupEnd();
}

/**
 * Hook for component render performance tracking
 */
export function trackComponentRender(componentName: string): () => void {
  const startTime = performance.now();

  return () => {
    const duration = performance.now() - startTime;

    if (duration > 16) { // More than one frame (60fps)
      console.warn(`[Performance] Slow render: ${componentName} took ${Math.round(duration)}ms`);
    }
  };
}
