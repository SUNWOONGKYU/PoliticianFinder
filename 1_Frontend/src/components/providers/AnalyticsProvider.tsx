// Task: Production Checklist E3
// Analytics Provider - GA 초기화 및 페이지뷰 추적
// Created: 2025-12-15

"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { initGA, logPageView } from "@/lib/monitoring/analytics";

function AnalyticsTracking() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // GA 초기화 (마운트 시 1회)
  useEffect(() => {
    initGA();
  }, []);

  // 페이지뷰 추적 (라우트 변경 시)
  useEffect(() => {
    if (pathname) {
      const params = searchParams?.toString();
      const url = params ? `${pathname}?${params}` : pathname;
      logPageView(url);
    }
  }, [pathname, searchParams]);

  return null;
}

export default function AnalyticsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense fallback={null}>
        <AnalyticsTracking />
      </Suspense>
      {children}
    </>
  );
}
