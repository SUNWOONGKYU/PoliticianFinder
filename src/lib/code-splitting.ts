/**
 * Code Splitting Utilities
 * P4F1: Frontend Performance Optimization
 *
 * Dynamic import helpers for lazy loading components
 */

import dynamic from 'next/dynamic';
import React from 'react';

/**
 * Loading fallback component
 */
export const DefaultLoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

/**
 * Error fallback component
 */
export const DefaultErrorFallback = ({ error }: { error: Error }) => (
  <div className="flex items-center justify-center p-8">
    <div className="text-center">
      <p className="text-red-600 mb-2">컴포넌트 로딩 실패</p>
      <p className="text-sm text-gray-500">{error.message}</p>
    </div>
  </div>
);

/**
 * Create a lazy-loaded component with custom loading state
 */
export function createLazyComponent<P extends Record<string, any>>(
  importFn: () => Promise<{ default: React.ComponentType<P> }>,
  options?: {
    loading?: React.ComponentType;
    ssr?: boolean;
  }
) {
  return dynamic(importFn, {
    loading: options?.loading || DefaultLoadingFallback,
    ssr: options?.ssr ?? true,
  });
}

/**
 * Preload a component for better UX
 * Call this on hover or when user is likely to navigate
 */
export function preloadComponent<P extends Record<string, any>>(
  importFn: () => Promise<{ default: React.ComponentType<P> }>
): void {
  // Prefetch the component
  importFn().catch(error => {
    console.error('[Code Splitting] Preload failed:', error);
  });
}

/**
 * Route-based code splitting helpers
 */
export const LazyComponents = {
  /**
   * Heavy UI components that can be loaded on demand
   */

  // Comment section (only load when needed)
  CommentSection: createLazyComponent(
    () => import('@/components/community/CommentSection'),
    { ssr: false } // Don't render comments on server
  ),

  // Charts and visualizations (heavy libraries)
  Charts: createLazyComponent(
    () => import('@/components/features/Charts').catch(() => ({
      default: () => <div>차트를 불러올 수 없습니다</div>
    })),
    { ssr: false }
  ),

  // Profile settings (only for authenticated users)
  ProfileSettings: createLazyComponent(
    () => import('@/components/features/ProfileSettings').catch(() => ({
      default: () => <div>설정을 불러올 수 없습니다</div>
    })),
    { ssr: false }
  ),

  // Advanced search filters
  AdvancedFilters: createLazyComponent(
    () => import('@/components/features/AdvancedFilters').catch(() => ({
      default: () => <div>필터를 불러올 수 없습니다</div>
    })),
    { ssr: false }
  ),
};

/**
 * Preload strategy for better perceived performance
 */
export const preloadStrategies = {
  /**
   * Preload on mouse enter (hover)
   */
  onHover: <P extends Record<string, any>>(
    importFn: () => Promise<{ default: React.ComponentType<P> }>
  ) => {
    return {
      onMouseEnter: () => preloadComponent(importFn),
      onTouchStart: () => preloadComponent(importFn),
    };
  },

  /**
   * Preload when element is visible (intersection observer)
   */
  onVisible: <P extends Record<string, any>>(
    importFn: () => Promise<{ default: React.ComponentType<P> }>,
    threshold = 0.1
  ) => {
    if (typeof window === 'undefined') return {};

    return {
      ref: (element: HTMLElement | null) => {
        if (!element) return;

        const observer = new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting) {
              preloadComponent(importFn);
              observer.disconnect();
            }
          },
          { threshold }
        );

        observer.observe(element);
      },
    };
  },

  /**
   * Preload after idle (requestIdleCallback)
   */
  onIdle: <P extends Record<string, any>>(
    importFn: () => Promise<{ default: React.ComponentType<P> }>
  ) => {
    if (typeof window === 'undefined') return;

    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => preloadComponent(importFn), { timeout: 2000 });
    } else {
      setTimeout(() => preloadComponent(importFn), 2000);
    }
  },

  /**
   * Preload on route change intent
   */
  onRouteIntent: <P extends Record<string, any>>(
    importFn: () => Promise<{ default: React.ComponentType<P> }>,
    targetRoute: string
  ) => {
    if (typeof window === 'undefined') return {};

    return {
      onMouseEnter: () => {
        // Only preload if we're navigating to the target route
        const links = document.querySelectorAll(`a[href="${targetRoute}"]`);
        if (links.length > 0) {
          preloadComponent(importFn);
        }
      },
    };
  },
};

/**
 * Bundle size optimization - Split by route
 */
export const routeBasedSplits = {
  // Politicians listing page
  politiciansPage: () => import('@/app/politicians/page'),

  // Politician detail page
  politicianDetailPage: (id: string) => import(`@/app/politicians/[id]/page`),

  // Profile page
  profilePage: () => import('@/app/profile/page').catch(() => ({
    default: () => <div>프로필 페이지를 불러올 수 없습니다</div>
  })),

  // Settings page
  settingsPage: () => import('@/app/settings/page').catch(() => ({
    default: () => <div>설정 페이지를 불러올 수 없습니다</div>
  })),
};

/**
 * Check if code splitting is supported
 */
export function isCodeSplittingSupported(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    // Check if dynamic import is supported
    return typeof Promise !== 'undefined' && 'import' in Function.prototype;
  } catch {
    return false;
  }
}

/**
 * Get chunk loading statistics
 */
export function getChunkStats(): {
  loaded: number;
  failed: number;
} | null {
  if (typeof window === 'undefined') return null;

  // This is a simplified version - in production, you'd track this via webpack/next.js stats
  return {
    loaded: performance.getEntriesByType('resource').filter(r =>
      r.name.includes('_next/static/chunks')
    ).length,
    failed: 0, // Would need custom tracking
  };
}
