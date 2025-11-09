/**
 * P1BI2: Backend Infrastructure - Error Handling & Logging
 * 작업일: 2025-11-03
 * 설명: 에러 처리 및 로깅 시스템
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * 로그 레벨 정의
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

/**
 * 로그 레코드 인터페이스
 */
export interface LogRecord {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * 로거 클래스
 */
export class Logger {
  private static instance: Logger;
  private logs: LogRecord[] = [];
  private maxLogs = 1000;

  private constructor() {}

  /**
   * 싱글톤 인스턴스 획득
   */
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * 로그 기록
   */
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): void {
    const record: LogRecord = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error: error && {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    };

    this.logs.push(record);

    // Keep logs size manageable
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output for development
    this.consoleLog(record);

    // Send to external service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalService(record);
    }
  }

  /**
   * DEBUG 레벨 로깅
   */
  public debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * INFO 레벨 로깅
   */
  public info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * WARN 레벨 로깅
   */
  public warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * ERROR 레벨 로깅
   */
  public error(
    message: string,
    error?: Error,
    context?: Record<string, any>
  ): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  /**
   * CRITICAL 레벨 로깅
   */
  public critical(
    message: string,
    error?: Error,
    context?: Record<string, any>
  ): void {
    this.log(LogLevel.CRITICAL, message, context, error);
  }

  /**
   * 콘솔 출력
   */
  private consoleLog(record: LogRecord): void {
    const prefix = `[${record.timestamp}] [${record.level}]`;
    const message = `${prefix} ${record.message}`;

    switch (record.level) {
      case LogLevel.DEBUG:
        console.debug(message, record.context);
        break;
      case LogLevel.INFO:
        console.info(message, record.context);
        break;
      case LogLevel.WARN:
        console.warn(message, record.context);
        break;
      case LogLevel.ERROR:
        console.error(message, record.context, record.error);
        break;
      case LogLevel.CRITICAL:
        console.error('🚨 CRITICAL:', message, record.context, record.error);
        break;
    }
  }

  /**
   * 외부 서비스로 로그 전송 (예: Sentry, LogRocket)
   */
  private async sendToExternalService(record: LogRecord): Promise<void> {
    try {
      // TODO: Implement external logging service integration
      // Example: Sentry, LogRocket, Datadog, etc.
      if (process.env.EXTERNAL_LOG_URL) {
        await fetch(process.env.EXTERNAL_LOG_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(record),
        });
      }
    } catch (error) {
      console.error('Failed to send log to external service:', error);
    }
  }

  /**
   * 모든 로그 조회
   */
  public getLogs(): LogRecord[] {
    return [...this.logs];
  }

  /**
   * 로그 필터링
   */
  public filterLogs(predicate: (log: LogRecord) => boolean): LogRecord[] {
    return this.logs.filter(predicate);
  }

  /**
   * 로그 초기화
   */
  public clear(): void {
    this.logs = [];
  }
}

/**
 * 에러 핸들러 미들웨어
 */
export function errorHandler(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const logger = Logger.getInstance();
    const startTime = Date.now();

    try {
      const response = await handler(req);
      const duration = Date.now() - startTime;

      logger.debug(`${req.method} ${req.nextUrl.pathname}`, {
        status: response.status,
        duration,
      });

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorObj = error instanceof Error ? error : new Error(String(error));

      logger.error(`${req.method} ${req.nextUrl.pathname}`, errorObj, {
        duration,
        url: req.nextUrl.toString(),
      });

      // Return error response
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An internal server error occurred',
            details:
              process.env.NODE_ENV === 'development'
                ? errorObj.message
                : undefined,
          },
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }
  };
}

/**
 * 요청 로깅 미들웨어
 */
export function requestLogger(req: NextRequest): void {
  const logger = Logger.getInstance();
  const headers = Object.fromEntries(req.headers);

  logger.info(`${req.method} ${req.nextUrl.pathname}`, {
    method: req.method,
    path: req.nextUrl.pathname,
    ip: req.headers.get('x-forwarded-for') || 'unknown',
    userAgent: req.headers.get('user-agent'),
  });
}

/**
 * 성능 모니터링
 */
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  /**
   * 메트릭 기록
   */
  public record(name: string, duration: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(duration);
  }

  /**
   * 평균 시간 계산
   */
  public getAverage(name: string): number {
    const values = this.metrics.get(name) || [];
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * 최대값
   */
  public getMax(name: string): number {
    const values = this.metrics.get(name) || [];
    return values.length > 0 ? Math.max(...values) : 0;
  }

  /**
   * 최소값
   */
  public getMin(name: string): number {
    const values = this.metrics.get(name) || [];
    return values.length > 0 ? Math.min(...values) : 0;
  }

  /**
   * 모든 메트릭 조회
   */
  public getMetrics(): Record<string, any> {
    const result: Record<string, any> = {};

    for (const [name, values] of this.metrics) {
      result[name] = {
        count: values.length,
        average: this.getAverage(name),
        min: this.getMin(name),
        max: this.getMax(name),
      };
    }

    return result;
  }
}

/**
 * 글로벌 성능 모니터 인스턴스
 */
export const performanceMonitor = new PerformanceMonitor();

/**
 * 에러 경계 HOC
 */
export function withErrorBoundary(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return errorHandler(handler);
}

/**
 * 에러 타입 정의
 */
export class ValidationError extends Error {
  constructor(
    public field: string,
    message: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Authorization failed') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error {
  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  constructor(message: string = 'Resource already exists') {
    super(message);
    this.name = 'ConflictError';
  }
}
