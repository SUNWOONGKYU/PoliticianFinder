/**
 * Project Grid Task ID: P4BA8
 * 작업명: 감사 로그 API - Query Builder
 * 생성시간: 2025-11-09
 * 생성자: Claude-Sonnet-4.5
 * 의존성: P2D1 (Database 스키마)
 * 설명: 감사 로그 조회를 위한 쿼리 빌더
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { AuditLogRecord } from './logger';

/**
 * 감사 로그 필터 옵션
 */
export interface AuditLogFilters {
  adminId?: string;
  actionType?: string;
  targetType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * 감사 로그 쿼리 결과
 */
export interface AuditLogQueryResult {
  data: AuditLogRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * AuditLogQueryBuilder 클래스
 * 복잡한 필터링과 정렬을 지원하는 쿼리 빌더
 */
export class AuditLogQueryBuilder {
  private supabase: SupabaseClient;
  private filters: AuditLogFilters;

  constructor(supabase: SupabaseClient, filters: AuditLogFilters = {}) {
    this.supabase = supabase;
    this.filters = {
      page: 1,
      limit: 20,
      sortBy: 'created_at',
      sortOrder: 'desc',
      ...filters,
    };
  }

  /**
   * 쿼리 실행 및 결과 반환
   */
  public async execute(): Promise<AuditLogQueryResult | null> {
    try {
      // 카운트 쿼리 (필터 적용)
      let countQuery = this.supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true });

      countQuery = this.applyFilters(countQuery);

      const { count, error: countError } = await countQuery;

      if (countError) {
        console.error('[AuditLogQueryBuilder] Count query error:', countError);
        return null;
      }

      const total = count || 0;

      // 데이터 쿼리 (필터 + 정렬 + 페이지네이션)
      let dataQuery = this.supabase
        .from('audit_logs')
        .select('*');

      dataQuery = this.applyFilters(dataQuery);
      dataQuery = this.applySorting(dataQuery);
      dataQuery = this.applyPagination(dataQuery);

      const { data, error: dataError } = await dataQuery;

      if (dataError) {
        console.error('[AuditLogQueryBuilder] Data query error:', dataError);
        return null;
      }

      const page = this.filters.page || 1;
      const limit = this.filters.limit || 20;
      const totalPages = Math.ceil(total / limit);

      return {
        data: (data || []) as AuditLogRecord[],
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      console.error('[AuditLogQueryBuilder] Unexpected error:', error);
      return null;
    }
  }

  /**
   * 필터 적용
   */
  private applyFilters(query: any): any {
    let filteredQuery = query;

    // 관리자 ID 필터
    if (this.filters.adminId) {
      filteredQuery = filteredQuery.eq('admin_id', this.filters.adminId);
    }

    // 액션 타입 필터
    if (this.filters.actionType) {
      filteredQuery = filteredQuery.eq('action_type', this.filters.actionType);
    }

    // 타겟 타입 필터
    if (this.filters.targetType) {
      filteredQuery = filteredQuery.eq('target_type', this.filters.targetType);
    }

    // 날짜 범위 필터
    if (this.filters.startDate) {
      filteredQuery = filteredQuery.gte('created_at', this.filters.startDate);
    }

    if (this.filters.endDate) {
      filteredQuery = filteredQuery.lte('created_at', this.filters.endDate);
    }

    return filteredQuery;
  }

  /**
   * 정렬 적용
   */
  private applySorting(query: any): any {
    const sortBy = this.filters.sortBy || 'created_at';
    const ascending = this.filters.sortOrder === 'asc';

    return query.order(sortBy, { ascending });
  }

  /**
   * 페이지네이션 적용
   */
  private applyPagination(query: any): any {
    const page = this.filters.page || 1;
    const limit = this.filters.limit || 20;

    const start = (page - 1) * limit;
    const end = start + limit - 1;

    return query.range(start, end);
  }

  /**
   * CSV 내보내기용 데이터 조회 (페이지네이션 없음)
   */
  public async exportToCSV(): Promise<string | null> {
    try {
      let query = this.supabase
        .from('audit_logs')
        .select('*');

      query = this.applyFilters(query);
      query = this.applySorting(query);

      // 최대 10,000개 레코드만 내보내기
      query = query.limit(10000);

      const { data, error } = await query;

      if (error) {
        console.error('[AuditLogQueryBuilder] Export query error:', error);
        return null;
      }

      if (!data || data.length === 0) {
        return '';
      }

      // CSV 헤더
      const headers = [
        'ID',
        'Admin ID',
        'Action Type',
        'Target Type',
        'Target ID',
        'Details',
        'IP Address',
        'User Agent',
        'Created At',
      ];

      // CSV 행
      const rows = data.map((log: any) => [
        log.id || '',
        log.admin_id || '',
        log.action_type || '',
        log.target_type || '',
        log.target_id || '',
        log.details ? JSON.stringify(log.details) : '',
        log.ip_address || '',
        log.user_agent || '',
        log.created_at || '',
      ]);

      // CSV 생성
      const csvLines = [
        headers.join(','),
        ...rows.map((row: any[]) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ),
      ];

      return csvLines.join('\n');
    } catch (error) {
      console.error('[AuditLogQueryBuilder] Export error:', error);
      return null;
    }
  }

  /**
   * 통계 조회 (액션 타입별 카운트)
   */
  public async getStatistics(): Promise<Record<string, number> | null> {
    try {
      let query = this.supabase
        .from('audit_logs')
        .select('action_type');

      query = this.applyFilters(query);

      const { data, error } = await query;

      if (error) {
        console.error('[AuditLogQueryBuilder] Statistics query error:', error);
        return null;
      }

      if (!data || data.length === 0) {
        return {};
      }

      // 액션 타입별 카운트
      const stats: Record<string, number> = {};
      data.forEach((log: any) => {
        const actionType = log.action_type;
        stats[actionType] = (stats[actionType] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('[AuditLogQueryBuilder] Statistics error:', error);
      return null;
    }
  }

  /**
   * 최근 로그 조회 (빠른 조회용)
   */
  public static async getRecentLogs(
    supabase: SupabaseClient,
    limit: number = 50
  ): Promise<AuditLogRecord[]> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[AuditLogQueryBuilder] Recent logs query error:', error);
        return [];
      }

      return (data || []) as AuditLogRecord[];
    } catch (error) {
      console.error('[AuditLogQueryBuilder] Recent logs error:', error);
      return [];
    }
  }

  /**
   * 특정 관리자의 로그 조회
   */
  public static async getLogsByAdmin(
    supabase: SupabaseClient,
    adminId: string,
    limit: number = 100
  ): Promise<AuditLogRecord[]> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('admin_id', adminId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[AuditLogQueryBuilder] Admin logs query error:', error);
        return [];
      }

      return (data || []) as AuditLogRecord[];
    } catch (error) {
      console.error('[AuditLogQueryBuilder] Admin logs error:', error);
      return [];
    }
  }

  /**
   * 특정 타겟의 로그 조회 (예: 특정 게시글에 대한 모든 관리 액션)
   */
  public static async getLogsByTarget(
    supabase: SupabaseClient,
    targetType: string,
    targetId: string
  ): Promise<AuditLogRecord[]> {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('target_type', targetType)
        .eq('target_id', targetId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[AuditLogQueryBuilder] Target logs query error:', error);
        return [];
      }

      return (data || []) as AuditLogRecord[];
    } catch (error) {
      console.error('[AuditLogQueryBuilder] Target logs error:', error);
      return [];
    }
  }
}

/**
 * 편의 함수: 쿼리 빌더 생성
 */
export function createAuditLogQueryBuilder(
  supabase: SupabaseClient,
  filters: AuditLogFilters = {}
): AuditLogQueryBuilder {
  return new AuditLogQueryBuilder(supabase, filters);
}
