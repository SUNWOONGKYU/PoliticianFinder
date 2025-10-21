/**
 * React Optimization Utilities
 * P4F1: Frontend Performance Optimization
 *
 * Helpers for optimizing React components
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Deep comparison for useMemo and useCallback dependencies
 * Use sparingly - shallow comparison is usually sufficient
 */
export function useDeepCompareMemo<T>(factory: () => T, deps: any[]): T {
  const ref = useRef<any[]>(deps);
  const signalRef = useRef<number>(0);

  if (!deepEqual(deps, ref.current)) {
    ref.current = deps;
    signalRef.current += 1;
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, [signalRef.current]);
}

/**
 * Deep equality check (simple implementation)
 */
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== 'object' || typeof b !== 'object') return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!keysB.includes(key) || !deepEqual(a[key], b[key])) {
      return false;
    }
  }

  return true;
}

/**
 * Debounced value hook
 * Delays updating value until after delay ms
 */
export function useDebounceValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Throttled callback hook
 * Limits execution to once per delay ms
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCallRef = useRef<number>(0);

  return useCallback(
    ((...args: any[]) => {
      const now = Date.now();
      const timeSinceLastCall = now - lastCallRef.current;

      if (timeSinceLastCall >= delay) {
        lastCallRef.current = now;
        callback(...args);
      } else {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(() => {
          lastCallRef.current = Date.now();
          callback(...args);
        }, delay - timeSinceLastCall);
      }
    }) as T,
    [callback, delay]
  );
}

/**
 * Previous value hook
 * Returns the previous value of a variable
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

/**
 * Mounted state hook
 * Tracks if component is mounted
 */
export function useIsMounted(): () => boolean {
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  return useCallback(() => isMounted.current, []);
}

/**
 * Safe async callback
 * Only executes callback if component is still mounted
 */
export function useSafeAsync<T extends (...args: any[]) => Promise<any>>(
  asyncFn: T
): T {
  const isMounted = useIsMounted();

  return useCallback(
    (async (...args: any[]) => {
      const result = await asyncFn(...args);
      if (isMounted()) {
        return result;
      }
      return undefined;
    }) as T,
    [asyncFn, isMounted]
  );
}

/**
 * Intersection Observer hook for lazy loading
 */
export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options?: IntersectionObserverInit
): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [ref, options]);

  return isIntersecting;
}

/**
 * Window size hook with debouncing
 */
export function useWindowSize(delay: number = 200): {
  width: number;
  height: number;
} {
  const [size, setSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timeoutId: NodeJS.Timeout;

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }, delay);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [delay]);

  return size;
}

/**
 * Local storage hook with SSR safety
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('[useLocalStorage] Error reading:', error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T) => {
      try {
        setStoredValue(value);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(value));
        }
      } catch (error) {
        console.error('[useLocalStorage] Error saving:', error);
      }
    },
    [key]
  );

  return [storedValue, setValue];
}

/**
 * Idle callback hook
 * Runs callback when browser is idle
 */
export function useIdleCallback(
  callback: () => void,
  deps: any[] = []
): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handle = 'requestIdleCallback' in window
      ? requestIdleCallback(callback, { timeout: 2000 })
      : setTimeout(callback, 1);

    return () => {
      if ('requestIdleCallback' in window) {
        cancelIdleCallback(handle as number);
      } else {
        clearTimeout(handle as NodeJS.Timeout);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * Media query hook
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', listener);

    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

/**
 * Prefetch component data
 * Preload data for better perceived performance
 */
export function usePrefetch<T>(
  fetchFn: () => Promise<T>,
  shouldPrefetch: boolean = false
): void {
  useEffect(() => {
    if (!shouldPrefetch) return;

    // Use requestIdleCallback to prefetch during idle time
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        fetchFn().catch(console.error);
      }, { timeout: 2000 });
    } else {
      setTimeout(() => {
        fetchFn().catch(console.error);
      }, 1000);
    }
  }, [fetchFn, shouldPrefetch]);
}
