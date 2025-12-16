// Task: Production Checklist E2
// Sentry Server Configuration
// Updated: 2025-12-15

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 프로덕션에서만 활성화
  enabled: process.env.NODE_ENV === "production",

  // 샘플링 비율
  tracesSampleRate: 0.1, // 성능 모니터링 10%

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

    // 민감한 요청 데이터 필터링
    if (event.request) {
      // 민감한 헤더 제거
      if (event.request.headers) {
        delete event.request.headers["authorization"];
        delete event.request.headers["cookie"];
        delete event.request.headers["x-api-key"];
      }

      // 민감한 쿼리 파라미터 제거
      if (event.request.query_string) {
        const params = new URLSearchParams(event.request.query_string);
        params.delete("token");
        params.delete("api_key");
        params.delete("password");
        event.request.query_string = params.toString();
      }
    }

    return event;
  },

  // 무시할 에러 패턴
  ignoreErrors: [
    // 예상된 에러
    "ZodError",
    // 연결 에러 (네트워크 문제)
    "ECONNREFUSED",
    "ECONNRESET",
    "ETIMEDOUT",
  ],
});
