// Task: Production Checklist E2
// Sentry Edge Configuration
// Updated: 2025-12-15

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 프로덕션에서만 활성화
  enabled: process.env.NODE_ENV === "production",

  // 샘플링 비율
  tracesSampleRate: 0.1,

  // 환경 설정
  environment: process.env.NODE_ENV || "development",
});
