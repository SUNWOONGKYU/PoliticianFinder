/**
 * Project Grid Task ID: P4BA8
 * 작업명: 감사 로그 API - Main Export
 * 생성시간: 2025-11-09
 * 생성자: Claude-Sonnet-4.5
 * 설명: Audit Log System의 모든 export를 집중화
 */

// Logger exports
export {
  AuditLogger,
  AuditActionType,
  getAuditLogger,
  type AuditLogRecord,
  type CreateAuditLogParams,
} from './logger';

// Query Builder exports
export {
  AuditLogQueryBuilder,
  createAuditLogQueryBuilder,
  type AuditLogFilters,
  type AuditLogQueryResult,
} from './query-builder';

/**
 * 사용 예제:
 *
 * import { getAuditLogger, createAuditLogQueryBuilder } from '@/lib/audit';
 *
 * const logger = getAuditLogger();
 * await logger.logUserBan(adminId, userId, reason);
 *
 * const queryBuilder = createAuditLogQueryBuilder(supabase, { page: 1 });
 * const result = await queryBuilder.execute();
 */
