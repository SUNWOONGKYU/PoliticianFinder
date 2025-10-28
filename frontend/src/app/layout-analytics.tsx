/**
 * Analytics Component for Root Layout
 *
 * Handles client-side analytics initialization
 */

'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { initializeAnalytics, trackPageView } from '@/lib/monitoring/analytics';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Initialize analytics on mount
    initializeAnalytics();
  }, []);

  useEffect(() => {
    // Track page views on route changes
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    trackPageView(url);
  }, [pathname, searchParams]);

  return <>{children}</>;
}
