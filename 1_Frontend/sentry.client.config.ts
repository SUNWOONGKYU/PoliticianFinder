// Task: Production Checklist E2
// Sentry Client Configuration
// Updated: 2025-12-15

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 프로덕션에서만 활성화
  enabled: process.env.NODE_ENV === "production",

  // 샘플링 비율
  tracesSampleRate: 0.1, // 성능 모니터링 10%

  // 세션 리플레이 설정
  replaysSessionSampleRate: 0.1, // 일반 세션 10%
  replaysOnErrorSampleRate: 1.0, // 에러 발생 시 100%

  // 환경 설정
  environment: process.env.NODE_ENV || "development",

  // 릴리즈 버전
  release: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",

  // 민감한 정보 필터링
  beforeSend(event) {
    // 개발 환경에서는 전송하지 않음
    if (process.env.NODE_ENV === "development") {
      return null;
    }

    // 민감한 사용자 데이터 필터링
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }

    return event;
  },

  // 무시할 에러 패턴
  ignoreErrors: [
    // 브라우저 확장 프로그램 에러
    "top.GLOBALS",
    "ResizeObserver loop limit exceeded",
    "ResizeObserver loop completed with undelivered notifications",
    // 네트워크 에러 (사용자 연결 문제)
    "Failed to fetch",
    "NetworkError",
    "Network request failed",
    "Load failed",
    // 취소된 요청
    "AbortError",
    // 랜덤 플러그인/확장
    "Non-Error promise rejection captured",
  ],

  integrations: [
    Sentry.replayIntegration({
      // 세션 리플레이에서 민감한 정보 마스킹
      maskAllText: true,
      maskAllInputs: true,
      blockAllMedia: true,
    }),
  ],
});
