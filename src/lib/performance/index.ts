/**
 * Performance Optimization - Main Export
 * P4F1: Frontend Performance Optimization
 *
 * Centralized exports for all performance utilities
 */

// Performance Monitoring
export {
  PerformanceMonitor,
  reportWebVitals,
  logPerformanceSummary,
  trackComponentRender,
  type PerformanceMetric,
  type WebVitalsMetric,
} from '../performance-monitoring';

// Code Splitting
export {
  createLazyComponent,
  preloadComponent,
  LazyComponents,
  preloadStrategies,
  routeBasedSplits,
  isCodeSplittingSupported,
  getChunkStats,
  DefaultLoadingFallback,
  DefaultErrorFallback,
} from '../code-splitting';

// React Optimization Hooks
export {
  useDeepCompareMemo,
  useDebounceValue,
  useThrottle,
  usePrevious,
  useIsMounted,
  useSafeAsync,
  useIntersectionObserver,
  useWindowSize,
  useLocalStorage,
  useIdleCallback,
  useMediaQuery,
  usePrefetch,
} from '../react-optimization';

// Optimized Components
export {
  OptimizedImage,
  OptimizedAvatar,
} from '../../components/common/OptimizedImage';

// Re-export commonly used performance utilities
export { debounce, throttle, memoize } from '../performance';
