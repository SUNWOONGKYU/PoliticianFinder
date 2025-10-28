/**
 * P5B4: Log Collection System
 *
 * Centralized log collection and aggregation utility
 * Extends the base logger with batch collection, filtering, and export capabilities
 *
 * Features:
 * - In-memory log buffering
 * - Log filtering by level, time range, endpoint
 * - Export logs to JSON/CSV
 * - Automatic log rotation
 * - Performance metrics aggregation
 */

import { logger, LogLevel, LogContext, LogEntry } from '@/lib/logger';

// ============================================================================
// Configuration
// ============================================================================

const MAX_LOGS_IN_MEMORY = 1000; // Maximum logs to keep in memory
const LOG_ROTATION_INTERVAL = 3600000; // 1 hour in milliseconds

// ============================================================================
// Types
// ============================================================================

interface LogFilter {
  level?: LogLevel | LogLevel[];
  startTime?: Date;
  endTime?: Date;
  endpoint?: string;
  userId?: string;
  errorCode?: string;
}

interface LogStats {
  total: number;
  byLevel: Record<LogLevel, number>;
  byEndpoint: Record<string, number>;
  errorRate: number;
  avgDuration?: number;
}

interface ExportOptions {
  format: 'json' | 'csv';
  filter?: LogFilter;
}

// ============================================================================
// Log Storage
// ============================================================================

class LogCollector {
  private logs: LogEntry[] = [];
  private lastRotation: number = Date.now();

  /**
   * Add a log entry to the collection
   */
  collect(entry: LogEntry): void {
    this.logs.push(entry);

    // Rotate logs if needed
    if (this.logs.length > MAX_LOGS_IN_MEMORY) {
      this.rotateLogs();
    }

    // Auto-rotate after interval
    if (Date.now() - this.lastRotation > LOG_ROTATION_INTERVAL) {
      this.rotateLogs();
    }
  }

  /**
   * Rotate logs (remove oldest entries)
   */
  private rotateLogs(): void {
    const keepCount = Math.floor(MAX_LOGS_IN_MEMORY * 0.5); // Keep 50% of max
    this.logs = this.logs.slice(-keepCount);
    this.lastRotation = Date.now();

    logger.debug('Log rotation performed', {
      metadata: {
        logsRemaining: this.logs.length,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Filter logs based on criteria
   */
  filter(filter: LogFilter): LogEntry[] {
    return this.logs.filter((log) => {
      // Filter by level
      if (filter.level) {
        const levels = Array.isArray(filter.level) ? filter.level : [filter.level];
        if (!levels.includes(log.level)) return false;
      }

      // Filter by time range
      if (filter.startTime) {
        const logTime = new Date(log.timestamp);
        if (logTime < filter.startTime) return false;
      }

      if (filter.endTime) {
        const logTime = new Date(log.timestamp);
        if (logTime > filter.endTime) return false;
      }

      // Filter by endpoint
      if (filter.endpoint && log.context?.endpoint !== filter.endpoint) {
        return false;
      }

      // Filter by userId
      if (filter.userId && log.context?.userId !== filter.userId) {
        return false;
      }

      // Filter by error code
      if (filter.errorCode && log.context?.errorCode !== filter.errorCode) {
        return false;
      }

      return true;
    });
  }

  /**
   * Get all logs
   */
  getAll(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Get recent logs
   */
  getRecent(count: number = 100): LogEntry[] {
    return this.logs.slice(-count);
  }

  /**
   * Get logs by level
   */
  getByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }

  /**
   * Get error logs
   */
  getErrors(): LogEntry[] {
    return this.getByLevel('error');
  }

  /**
   * Get logs for specific endpoint
   */
  getByEndpoint(endpoint: string): LogEntry[] {
    return this.logs.filter((log) => log.context?.endpoint === endpoint);
  }

  /**
   * Calculate log statistics
   */
  getStats(filter?: LogFilter): LogStats {
    const logs = filter ? this.filter(filter) : this.logs;

    const stats: LogStats = {
      total: logs.length,
      byLevel: {
        error: 0,
        warn: 0,
        info: 0,
        debug: 0,
      },
      byEndpoint: {},
      errorRate: 0,
    };

    let totalDuration = 0;
    let durationCount = 0;

    logs.forEach((log) => {
      // Count by level
      stats.byLevel[log.level]++;

      // Count by endpoint
      if (log.context?.endpoint) {
        stats.byEndpoint[log.context.endpoint] =
          (stats.byEndpoint[log.context.endpoint] || 0) + 1;
      }

      // Aggregate duration
      if (log.context?.duration) {
        totalDuration += log.context.duration;
        durationCount++;
      }
    });

    // Calculate error rate
    stats.errorRate = logs.length > 0 ? stats.byLevel.error / logs.length : 0;

    // Calculate average duration
    if (durationCount > 0) {
      stats.avgDuration = totalDuration / durationCount;
    }

    return stats;
  }

  /**
   * Export logs to JSON
   */
  exportJSON(filter?: LogFilter): string {
    const logs = filter ? this.filter(filter) : this.logs;
    return JSON.stringify(logs, null, 2);
  }

  /**
   * Export logs to CSV
   */
  exportCSV(filter?: LogFilter): string {
    const logs = filter ? this.filter(filter) : this.logs;

    if (logs.length === 0) {
      return 'No logs to export';
    }

    // CSV headers
    const headers = [
      'timestamp',
      'level',
      'message',
      'endpoint',
      'method',
      'userId',
      'errorCode',
      'statusCode',
      'duration',
      'traceId',
    ];

    // CSV rows
    const rows = logs.map((log) => {
      return [
        log.timestamp,
        log.level,
        `"${log.message.replace(/"/g, '""')}"`, // Escape quotes
        log.context?.endpoint || '',
        log.context?.method || '',
        log.context?.userId || '',
        log.context?.errorCode || '',
        log.context?.statusCode?.toString() || '',
        log.context?.duration?.toString() || '',
        log.traceId || '',
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Export logs with options
   */
  export(options: ExportOptions): string {
    if (options.format === 'csv') {
      return this.exportCSV(options.filter);
    }
    return this.exportJSON(options.filter);
  }

  /**
   * Clear all logs
   */
  clear(): void {
    this.logs = [];
    logger.info('Log collection cleared');
  }

  /**
   * Get collection size
   */
  size(): number {
    return this.logs.length;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const logCollector = new LogCollector();

// ============================================================================
// Enhanced Logger with Collection
// ============================================================================

/**
 * Enhanced logger that automatically collects logs
 */
export const collectingLogger = {
  error: (message: string, context?: LogContext) => {
    logger.error(message, context);
    logCollector.collect({
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      context,
    });
  },

  warn: (message: string, context?: LogContext) => {
    logger.warn(message, context);
    logCollector.collect({
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      context,
    });
  },

  info: (message: string, context?: LogContext) => {
    logger.info(message, context);
    logCollector.collect({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      context,
    });
  },

  debug: (message: string, context?: LogContext) => {
    logger.debug(message, context);
    logCollector.collect({
      level: 'debug',
      message,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      context,
    });
  },
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get logs within a time range
 */
export function getLogsByTimeRange(startTime: Date, endTime: Date): LogEntry[] {
  return logCollector.filter({ startTime, endTime });
}

/**
 * Get logs for the last N minutes
 */
export function getRecentLogs(minutes: number): LogEntry[] {
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - minutes * 60000);
  return getLogsByTimeRange(startTime, endTime);
}

/**
 * Get error summary
 */
export function getErrorSummary(minutes: number = 60): {
  total: number;
  byErrorCode: Record<string, number>;
  byEndpoint: Record<string, number>;
} {
  const logs = getRecentLogs(minutes);
  const errors = logs.filter((log) => log.level === 'error');

  const summary = {
    total: errors.length,
    byErrorCode: {} as Record<string, number>,
    byEndpoint: {} as Record<string, number>,
  };

  errors.forEach((error) => {
    if (error.context?.errorCode) {
      summary.byErrorCode[error.context.errorCode] =
        (summary.byErrorCode[error.context.errorCode] || 0) + 1;
    }

    if (error.context?.endpoint) {
      summary.byEndpoint[error.context.endpoint] =
        (summary.byEndpoint[error.context.endpoint] || 0) + 1;
    }
  });

  return summary;
}

/**
 * Get performance metrics
 */
export function getPerformanceMetrics(endpoint?: string): {
  count: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  p95Duration: number;
} {
  const filter = endpoint ? { endpoint } : undefined;
  const logs = logCollector.filter(filter || {});

  const durations = logs
    .map((log) => log.context?.duration)
    .filter((d): d is number => typeof d === 'number')
    .sort((a, b) => a - b);

  if (durations.length === 0) {
    return {
      count: 0,
      avgDuration: 0,
      minDuration: 0,
      maxDuration: 0,
      p95Duration: 0,
    };
  }

  const sum = durations.reduce((acc, d) => acc + d, 0);
  const p95Index = Math.floor(durations.length * 0.95);

  return {
    count: durations.length,
    avgDuration: sum / durations.length,
    minDuration: durations[0],
    maxDuration: durations[durations.length - 1],
    p95Duration: durations[p95Index] || durations[durations.length - 1],
  };
}
