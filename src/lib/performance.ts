/**
 * Performance Utility Functions
 * P4F1: Frontend Performance Optimization
 */

/**
 * Debounce function - delays execution until after wait milliseconds
 * @param func Function to debounce
 * @param wait Delay in milliseconds
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function - limits execution to once per wait milliseconds
 * @param func Function to throttle
 * @param wait Minimum time between executions
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  let lastResult: ReturnType<T>;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      inThrottle = true;
      lastResult = func(...args);

      setTimeout(() => {
        inThrottle = false;
      }, wait);
    }

    return lastResult;
  };
}

/**
 * Lazy load images with Intersection Observer
 * @param selector CSS selector for images to lazy load
 */
export function lazyLoadImages(selector: string = 'img[data-src]'): void {
  if (typeof window === 'undefined') return;

  const images = document.querySelectorAll(selector);

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        const src = img.getAttribute('data-src');

        if (src) {
          img.src = src;
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      }
    });
  });

  images.forEach((img) => imageObserver.observe(img));
}

/**
 * Performance metrics reporter
 */
export function reportWebVitals(metric: {
  id: string;
  name: string;
  value: number;
  label: string;
}): void {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Performance]', metric.name, metric.value);
  }

  // Send to analytics in production
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to analytics service
    // Example: sendToAnalytics(metric)
  }
}

/**
 * Memoization helper for expensive computations
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);

    return result;
  }) as T;
}

/**
 * Prefetch resources for better perceived performance
 */
export function prefetchResources(urls: string[]): void {
  if (typeof window === 'undefined') return;

  urls.forEach((url) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  });
}

/**
 * Check if browser supports WebP
 */
export async function supportsWebP(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
}
