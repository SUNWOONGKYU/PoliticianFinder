/**
 * @file Structured Logging System
 * @description 보안 강화된 로깅 시스템 - 민감정보 제거 및 구조화
 * @created 2026-01-19
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  requestId?: string;
  userId?: string;
  action?: string;
  resource?: string;
  [key: string]: any;
}

/**
 * 민감한 키 패턴 (로그에서 제거)
 */
const SENSITIVE_KEYS = [
  'password',
  'password_confirm',
  'token',
  'accessToken',
  'refreshToken',
  'secret',
  'apiKey',
  'api_key',
  'serviceRoleKey',
  'authorization',
  'cookie',
  'session',
  'csrf',
];

/**
 * 민감한 정보를 제거하는 함수
 */
function sanitize(data: any): any {
  if (data === null || data === undefined) {
    return data;
  }

  // 문자열인 경우
  if (typeof data === 'string') {
    // 이메일 마스킹 (앞 3자만 표시)
    if (data.includes('@')) {
      const [local, domain] = data.split('@');
      return `${local.substring(0, 3)}***@${domain}`;
    }
    return data;
  }

  // 배열인 경우
  if (Array.isArray(data)) {
    return data.map(item => sanitize(item));
  }

  // 객체인 경우
  if (typeof data === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase();

      // 민감한 키는 [REDACTED]로 대체
      if (SENSITIVE_KEYS.some(sensitive => lowerKey.includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
      // 이메일 필드는 마스킹
      else if (lowerKey === 'email' && typeof value === 'string') {
        const [local, domain] = value.split('@');
        sanitized[key] = `${local.substring(0, 3)}***@${domain}`;
      }
      // 재귀적으로 처리
      else {
        sanitized[key] = sanitize(value);
      }
    }
    return sanitized;
  }

  return data;
}

/**
 * 에러 객체를 안전한 형태로 변환
 */
function sanitizeError(error: any): any {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      // stack은 production에서는 제외
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    };
  }
  return sanitize(error);
}

/**
 * 구조화된 로그 출력
 */
function log(level: LogLevel, message: string, context?: LogContext, error?: any) {
  const timestamp = new Date().toISOString();

  const logEntry = {
    timestamp,
    level,
    message,
    ...(context && { context: sanitize(context) }),
    ...(error && { error: sanitizeError(error) }),
    environment: process.env.NODE_ENV || 'development',
  };

  // Production 환경에서는 구조화된 JSON 로그
  if (process.env.NODE_ENV === 'production') {
    const logString = JSON.stringify(logEntry);

    switch (level) {
      case 'error':
        console.error(logString);
        break;
      case 'warn':
        console.warn(logString);
        break;
      case 'info':
        console.info(logString);
        break;
      case 'debug':
        // Production에서는 debug 로그 출력 안함
        break;
    }
  }
  // Development 환경에서는 가독성 있게 출력
  else {
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    switch (level) {
      case 'error':
        console.error(prefix, message);
        if (context) console.error('Context:', sanitize(context));
        if (error) console.error('Error:', sanitizeError(error));
        break;
      case 'warn':
        console.warn(prefix, message);
        if (context) console.warn('Context:', sanitize(context));
        break;
      case 'info':
        console.info(prefix, message);
        if (context) console.info('Context:', sanitize(context));
        break;
      case 'debug':
        console.debug(prefix, message);
        if (context) console.debug('Context:', sanitize(context));
        break;
    }
  }
}

/**
 * Logger 인스턴스
 */
export const logger = {
  debug: (message: string, context?: LogContext) => log('debug', message, context),
  info: (message: string, context?: LogContext) => log('info', message, context),
  warn: (message: string, context?: LogContext) => log('warn', message, context),
  error: (message: string, context?: LogContext, error?: any) => log('error', message, context, error),
};

/**
 * API 요청 로깅 헬퍼
 */
export function logApiRequest(
  method: string,
  path: string,
  statusCode: number,
  duration?: number,
  userId?: string
) {
  logger.info('API Request', {
    action: 'api_request',
    method,
    path,
    statusCode,
    ...(duration && { duration: `${duration}ms` }),
    ...(userId && { userId }),
  });
}

/**
 * API 에러 로깅 헬퍼
 */
export function logApiError(
  method: string,
  path: string,
  error: any,
  userId?: string
) {
  logger.error('API Error', {
    action: 'api_error',
    method,
    path,
    ...(userId && { userId }),
  }, error);
}

/**
 * 보안 이벤트 로깅 헬퍼
 */
export function logSecurityEvent(
  eventType: string,
  details: LogContext,
  severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
) {
  logger.warn('Security Event', {
    action: 'security_event',
    eventType,
    severity,
    ...details,
  });
}
