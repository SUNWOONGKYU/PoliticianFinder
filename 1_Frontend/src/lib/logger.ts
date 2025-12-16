// Task: Production Checklist E4
// Structured Logging System with pino
// Created: 2025-12-15

import pino from "pino";

// 로그 레벨 타입
type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

// 환경에 따른 로그 레벨 설정
const getLogLevel = (): LogLevel => {
  if (process.env.NODE_ENV === "production") {
    return "info";
  }
  if (process.env.NODE_ENV === "test") {
    return "warn";
  }
  return "debug";
};

// 기본 로거 설정
const baseConfig: pino.LoggerOptions = {
  level: process.env.LOG_LEVEL || getLogLevel(),
  
  // 타임스탬프 포맷
  timestamp: pino.stdTimeFunctions.isoTime,
  
  // 기본 메타데이터
  base: {
    env: process.env.NODE_ENV || "development",
    service: "politicianfinder",
  },

  // 민감한 정보 제거
  redact: {
    paths: [
      "password",
      "token",
      "accessToken",
      "refreshToken",
      "authorization",
      "cookie",
      "*.password",
      "*.token",
      "req.headers.authorization",
      "req.headers.cookie",
    ],
    censor: "[REDACTED]",
  },
};

// 개발 환경에서는 pretty print
const devConfig: pino.LoggerOptions = {
  ...baseConfig,
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
      ignore: "pid,hostname",
    },
  },
};

// 프로덕션 환경에서는 JSON 포맷
const prodConfig: pino.LoggerOptions = {
  ...baseConfig,
  // Vercel에서는 console로 출력하면 자동 수집
  formatters: {
    level: (label) => ({ level: label }),
  },
};

// 환경에 따른 설정 선택
const config = process.env.NODE_ENV === "production" ? prodConfig : devConfig;

// 메인 로거 인스턴스
export const logger = pino(config);

// 하위 로거 생성 헬퍼
export const createLogger = (module: string) => {
  return logger.child({ module });
};

// API 요청 로깅용 유틸리티
export const logApiRequest = (
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  userId?: string
) => {
  const logData = {
    type: "api_request",
    method,
    path,
    statusCode,
    duration,
    userId,
  };

  if (statusCode >= 500) {
    logger.error(logData, "API Server Error");
  } else if (statusCode >= 400) {
    logger.warn(logData, "API Client Error");
  } else {
    logger.info(logData, "API Request");
  }
};

// 에러 로깅용 유틸리티
export const logError = (
  error: Error,
  context?: Record<string, unknown>
) => {
  logger.error(
    {
      err: {
        message: error.message,
        name: error.name,
        stack: error.stack,
      },
      ...context,
    },
    error.message
  );
};

// 이벤트 로깅용 유틸리티
export const logEvent = (
  eventName: string,
  data?: Record<string, unknown>
) => {
  logger.info(
    {
      type: "event",
      event: eventName,
      ...data,
    },
    eventName
  );
};

// 성능 로깅용 유틸리티
export const logPerformance = (
  operation: string,
  duration: number,
  metadata?: Record<string, unknown>
) => {
  logger.info(
    {
      type: "performance",
      operation,
      duration,
      ...metadata,
    },
    `${operation} completed in ${duration}ms`
  );
};

// 보안 이벤트 로깅
export const logSecurity = (
  event: string,
  details: Record<string, unknown>
) => {
  logger.warn(
    {
      type: "security",
      event,
      ...details,
    },
    `Security event: ${event}`
  );
};

export default logger;
