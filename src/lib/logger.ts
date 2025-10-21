/**
 * P4B5: Centralized Error Logging System
 *
 * Structured logging utility for consistent error tracking across the application.
 * Integrates with Sentry for production error tracking.
 *
 * Features:
 * - Multiple log levels (error, warn, info, debug)
 * - Environment-aware logging (verbose in dev, structured in prod)
 * - Context enrichment (user, endpoint, timestamp, trace ID)
 * - Sentry integration ready
 * - Performance metrics tracking
 */

import { captureError, captureMessage } from '@/lib/monitoring/sentry'

// ============================================================================
// Types & Interfaces
// ============================================================================

export type LogLevel = 'error' | 'warn' | 'info' | 'debug'

export interface LogContext {
  // Request context
  endpoint?: string
  method?: string
  userId?: string
  userEmail?: string
  sessionId?: string

  // Error context
  errorCode?: string
  errorType?: string
  statusCode?: number

  // Performance context
  duration?: number
  queryTime?: number

  // Additional metadata
  metadata?: Record<string, any>

  // Stack trace (for errors)
  stack?: string
}

export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  environment: string
  context?: LogContext
  traceId?: string
}

// ============================================================================
// Configuration
// ============================================================================

const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'
const isTest = process.env.NODE_ENV === 'test'

// Minimum log level to output (configurable per environment)
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const MINIMUM_LOG_LEVEL: LogLevel = isProduction ? 'info' : 'debug'

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a trace ID for request tracking
 */
function generateTraceId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Check if a log level should be output
 */
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[MINIMUM_LOG_LEVEL]
}

/**
 * Sanitize sensitive data from context
 */
function sanitizeContext(context?: LogContext): LogContext | undefined {
  if (!context) return undefined

  const sanitized = { ...context }

  // Remove sensitive fields
  if (sanitized.userEmail) {
    sanitized.userEmail = sanitized.userEmail.replace(
      /(.{2})(.*)(@.*)/,
      '$1***$3'
    )
  }

  // Sanitize metadata
  if (sanitized.metadata) {
    const { password, token, apiKey, secret, ...safeMeta } = sanitized.metadata
    sanitized.metadata = safeMeta
  }

  return sanitized
}

/**
 * Format log entry for console output
 */
function formatConsoleLog(entry: LogEntry): string {
  const { level, message, timestamp, context, traceId } = entry

  if (isDevelopment) {
    // Verbose format for development
    const parts = [
      `[${timestamp}]`,
      `[${level.toUpperCase()}]`,
      traceId ? `[${traceId}]` : '',
      message,
      context ? `\n${JSON.stringify(context, null, 2)}` : '',
    ]
    return parts.filter(Boolean).join(' ')
  }

  // Structured JSON format for production
  return JSON.stringify(entry)
}

/**
 * Get console method based on log level
 */
function getConsoleMethod(level: LogLevel): (...args: any[]) => void {
  switch (level) {
    case 'error':
      return console.error
    case 'warn':
      return console.warn
    case 'info':
      return console.info
    case 'debug':
      return console.debug
    default:
      return console.log
  }
}

// ============================================================================
// Core Logging Functions
// ============================================================================

/**
 * Create a log entry
 */
function createLogEntry(
  level: LogLevel,
  message: string,
  context?: LogContext
): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    context: sanitizeContext(context),
    traceId: generateTraceId(),
  }
}

/**
 * Write log entry to appropriate outputs
 */
function writeLog(entry: LogEntry): void {
  if (!shouldLog(entry.level)) return

  // Skip logging in test environment unless it's an error
  if (isTest && entry.level !== 'error') return

  // Console output
  const consoleMethod = getConsoleMethod(entry.level)
  consoleMethod(formatConsoleLog(entry))

  // Send to Sentry in production
  if (isProduction) {
    if (entry.level === 'error') {
      // For errors, send to Sentry with full context
      const error = new Error(entry.message)
      if (entry.context?.stack) {
        error.stack = entry.context.stack
      }

      captureError(error, {
        level: 'error',
        tags: {
          endpoint: entry.context?.endpoint || 'unknown',
          errorCode: entry.context?.errorCode || 'unknown',
        },
        extra: entry.context,
      })
    } else if (entry.level === 'warn') {
      // Send warnings as messages
      captureMessage(entry.message, 'warning', entry.context)
    }
  }
}

// ============================================================================
// Public Logger API
// ============================================================================

export const logger = {
  /**
   * Log an error with context
   *
   * @example
   * ```typescript
   * try {
   *   await riskyOperation()
   * } catch (error) {
   *   logger.error('Database query failed', {
   *     endpoint: '/api/politicians',
   *     userId: user.id,
   *     errorCode: 'DB_QUERY_ERROR',
   *     metadata: { query: 'SELECT * FROM politicians' }
   *   })
   * }
   * ```
   */
  error: (message: string, context?: LogContext) => {
    const entry = createLogEntry('error', message, context)
    writeLog(entry)
  },

  /**
   * Log a warning with context
   *
   * @example
   * ```typescript
   * logger.warn('Rate limit approaching threshold', {
   *   endpoint: '/api/ratings',
   *   userId: user.id,
   *   metadata: { remaining: 2, limit: 10 }
   * })
   * ```
   */
  warn: (message: string, context?: LogContext) => {
    const entry = createLogEntry('warn', message, context)
    writeLog(entry)
  },

  /**
   * Log informational message
   *
   * @example
   * ```typescript
   * logger.info('User logged in successfully', {
   *   userId: user.id,
   *   endpoint: '/api/auth/login'
   * })
   * ```
   */
  info: (message: string, context?: LogContext) => {
    const entry = createLogEntry('info', message, context)
    writeLog(entry)
  },

  /**
   * Log debug information (development only)
   *
   * @example
   * ```typescript
   * logger.debug('Cache hit', {
   *   endpoint: '/api/politicians',
   *   metadata: { cacheKey: 'politicians:page:1' }
   * })
   * ```
   */
  debug: (message: string, context?: LogContext) => {
    const entry = createLogEntry('debug', message, context)
    writeLog(entry)
  },
}

// ============================================================================
// Specialized Logging Functions
// ============================================================================

/**
 * Log API request errors with automatic context extraction
 *
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   try {
 *     // ... your code
 *   } catch (error) {
 *     logApiError(request, error, 'GET /api/politicians')
 *     return NextResponse.json({ error: 'Failed' }, { status: 500 })
 *   }
 * }
 * ```
 */
export function logApiError(
  request: Request,
  error: unknown,
  endpoint: string,
  userId?: string
): void {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : undefined

  logger.error(`API Error: ${errorMessage}`, {
    endpoint,
    method: request.method,
    userId,
    errorType: error instanceof Error ? error.constructor.name : typeof error,
    stack,
    metadata: {
      url: request.url,
      headers: Object.fromEntries(request.headers),
    },
  })
}

/**
 * Log authentication errors
 *
 * @example
 * ```typescript
 * const { error } = await supabase.auth.signIn({ email, password })
 * if (error) {
 *   logAuthError('login', error, email)
 * }
 * ```
 */
export function logAuthError(
  action: 'login' | 'signup' | 'logout' | 'password_reset',
  error: unknown,
  userIdentifier?: string
): void {
  const errorMessage = error instanceof Error ? error.message : String(error)

  logger.error(`Auth Error: ${action}`, {
    endpoint: `/api/auth/${action}`,
    errorCode: 'AUTH_ERROR',
    errorType: error instanceof Error ? error.constructor.name : typeof error,
    metadata: {
      action,
      userIdentifier: userIdentifier ? userIdentifier.substring(0, 3) + '***' : undefined,
    },
  })
}

/**
 * Log Supabase query errors
 *
 * @example
 * ```typescript
 * const { data, error } = await supabase.from('politicians').select('*')
 * if (error) {
 *   logSupabaseError('politicians', 'select', error)
 * }
 * ```
 */
export function logSupabaseError(
  table: string,
  operation: 'select' | 'insert' | 'update' | 'delete',
  error: any,
  userId?: string
): void {
  logger.error(`Supabase Error: ${table}.${operation}`, {
    errorCode: 'SUPABASE_ERROR',
    errorType: error?.code || error?.message || 'Unknown',
    userId,
    metadata: {
      table,
      operation,
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
    },
  })
}

/**
 * Log rate limit violations
 *
 * @example
 * ```typescript
 * if (!rateLimitSuccess) {
 *   logRateLimitError(request, limiterType, identifier)
 * }
 * ```
 */
export function logRateLimitError(
  request: Request,
  limiterType: string,
  identifier: string
): void {
  logger.warn('Rate limit exceeded', {
    endpoint: new URL(request.url).pathname,
    method: request.method,
    errorCode: 'RATE_LIMIT_EXCEEDED',
    statusCode: 429,
    metadata: {
      limiterType,
      identifier: identifier.substring(0, 10) + '***',
    },
  })
}

/**
 * Log performance metrics
 *
 * @example
 * ```typescript
 * const start = Date.now()
 * const result = await slowQuery()
 * logPerformance('/api/politicians', Date.now() - start)
 * ```
 */
export function logPerformance(
  endpoint: string,
  duration: number,
  threshold: number = 1000
): void {
  if (duration > threshold) {
    logger.warn(`Slow operation detected`, {
      endpoint,
      duration,
      metadata: {
        threshold,
        exceedBy: duration - threshold,
      },
    })
  } else {
    logger.debug(`Performance metric`, {
      endpoint,
      duration,
    })
  }
}

// ============================================================================
// Error Boundary Logging
// ============================================================================

/**
 * Log React component errors (for use in Error Boundaries)
 *
 * @example
 * ```typescript
 * class ErrorBoundary extends React.Component {
 *   componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
 *     logComponentError(error, errorInfo)
 *   }
 * }
 * ```
 */
export function logComponentError(error: Error, errorInfo?: any): void {
  logger.error(`React Component Error: ${error.message}`, {
    errorCode: 'COMPONENT_ERROR',
    errorType: error.constructor.name,
    stack: error.stack,
    metadata: {
      componentStack: errorInfo?.componentStack,
    },
  })
}

// ============================================================================
// Export for testing
// ============================================================================

export const __testing__ = {
  createLogEntry,
  sanitizeContext,
  shouldLog,
  generateTraceId,
}
