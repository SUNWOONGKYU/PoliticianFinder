/**
 * Project Grid Task ID: P4BA13
 * 작업명: 관리자 액션 로그 API - Activity Tracker
 * 생성시간: 2025-11-09
 * 생성자: Claude-Sonnet-4.5
 * 의존성: P4BA8 (감사 로그 API), P2D1 (Database 스키마)
 * 설명: 관리자 활동 추적 및 통계 유틸리티
 */

import { createClient } from '@/lib/supabase/server';

/**
 * 관리자 액션 타입
 */
export enum AdminActionType {
  USER_BAN = 'user_ban',
  USER_UNBAN = 'user_unban',
  USER_EDIT = 'user_edit',
  POST_DELETE = 'post_delete',
  POST_RESTORE = 'post_restore',
  COMMENT_DELETE = 'comment_delete',
  COMMENT_RESTORE = 'comment_restore',
  REPORT_ACCEPT = 'report_accept',
  REPORT_REJECT = 'report_reject',
  AD_CREATE = 'ad_create',
  AD_UPDATE = 'ad_update',
  AD_DELETE = 'ad_delete',
  POLICY_UPDATE = 'policy_update',
  SYSTEM_SETTING = 'system_setting',
  ADMIN_LOGIN = 'admin_login',
  ADMIN_LOGOUT = 'admin_logout',
}

/**
 * 관리자 액션 레코드 인터페이스
 */
export interface AdminActionRecord {
  id?: string;
  admin_id: string;
  action_type: AdminActionType | string;
  target_type?: string;
  target_id?: string;
  result: 'success' | 'failure';
  duration_ms?: number;
  metadata?: Record<string, any>;
  created_at?: string;
}

/**
 * 관리자 액션 생성 파라미터
 */
export interface TrackActionParams {
  adminId: string;
  actionType: AdminActionType | string;
  targetType?: string;
  targetId?: string;
  result?: 'success' | 'failure';
  durationMs?: number;
  metadata?: Record<string, any>;
}

/**
 * 통계 조회 옵션
 */
export interface StatsOptions {
  adminId?: string;
  startDate?: string;
  endDate?: string;
  groupBy: 'admin' | 'action_type' | 'date';
}

/**
 * 통계 응답 인터페이스
 */
export interface AdminActionStats {
  totalActions: number;
  byAdmin?: Array<{ adminId: string; name: string; count: number }>;
  byActionType?: Array<{ type: string; count: number }>;
  byDate?: Array<{ date: string; count: number }>;
  byResult?: { success: number; failure: number };
  avgDuration?: number;
}

/**
 * ActivityTracker 클래스
 * 관리자 활동을 추적하고 통계를 제공
 */
export class ActivityTracker {
  private static instance: ActivityTracker;

  private constructor() {}

  /**
   * 싱글톤 인스턴스 가져오기
   */
  public static getInstance(): ActivityTracker {
    if (!ActivityTracker.instance) {
      ActivityTracker.instance = new ActivityTracker();
    }
    return ActivityTracker.instance;
  }

  /**
   * 관리자 액션 추적
   */
  public async track(params: TrackActionParams): Promise<AdminActionRecord | null> {
    try {
      const supabase = await createClient();

      const actionEntry: Partial<AdminActionRecord> = {
        admin_id: params.adminId,
        action_type: params.actionType,
        target_type: params.targetType,
        target_id: params.targetId,
        result: params.result || 'success',
        duration_ms: params.durationMs,
        metadata: params.metadata,
      };

      const { data, error } = await supabase
        .from('admin_actions')
        .insert(actionEntry)
        .select()
        .single();

      if (error) {
        console.error('[ActivityTracker] Failed to track action:', error);
        return null;
      }

      return data as AdminActionRecord;
    } catch (error) {
      console.error('[ActivityTracker] Unexpected error:', error);
      return null;
    }
  }

  /**
   * 액션 실행 시간 측정 및 기록
   */
  public async trackWithTiming<T>(
    params: Omit<TrackActionParams, 'durationMs' | 'result'>,
    action: () => Promise<T>
  ): Promise<{ result: T | null; error: Error | null }> {
    const startTime = Date.now();
    let actionResult: 'success' | 'failure' = 'success';
    let result: T | null = null;
    let error: Error | null = null;

    try {
      result = await action();
    } catch (err) {
      actionResult = 'failure';
      error = err instanceof Error ? err : new Error('Unknown error');
    }

    const duration = Date.now() - startTime;

    await this.track({
      ...params,
      result: actionResult,
      durationMs: duration,
    });

    return { result, error };
  }

  /**
   * 사용자 차단 추적
   */
  public async trackUserBan(
    adminId: string,
    userId: string,
    reason: string
  ): Promise<AdminActionRecord | null> {
    return this.track({
      adminId,
      actionType: AdminActionType.USER_BAN,
      targetType: 'user',
      targetId: userId,
      metadata: { reason },
    });
  }

  /**
   * 사용자 차단 해제 추적
   */
  public async trackUserUnban(
    adminId: string,
    userId: string
  ): Promise<AdminActionRecord | null> {
    return this.track({
      adminId,
      actionType: AdminActionType.USER_UNBAN,
      targetType: 'user',
      targetId: userId,
    });
  }

  /**
   * 게시글 삭제 추적
   */
  public async trackPostDelete(
    adminId: string,
    postId: string,
    reason: string
  ): Promise<AdminActionRecord | null> {
    return this.track({
      adminId,
      actionType: AdminActionType.POST_DELETE,
      targetType: 'post',
      targetId: postId,
      metadata: { reason },
    });
  }

  /**
   * 댓글 삭제 추적
   */
  public async trackCommentDelete(
    adminId: string,
    commentId: string,
    reason: string
  ): Promise<AdminActionRecord | null> {
    return this.track({
      adminId,
      actionType: AdminActionType.COMMENT_DELETE,
      targetType: 'comment',
      targetId: commentId,
      metadata: { reason },
    });
  }

  /**
   * 광고 생성 추적
   */
  public async trackAdCreate(
    adminId: string,
    adId: string,
    adDetails: Record<string, any>
  ): Promise<AdminActionRecord | null> {
    return this.track({
      adminId,
      actionType: AdminActionType.AD_CREATE,
      targetType: 'ad',
      targetId: adId,
      metadata: adDetails,
    });
  }

  /**
   * 로그인 추적
   */
  public async trackLogin(adminId: string): Promise<AdminActionRecord | null> {
    return this.track({
      adminId,
      actionType: AdminActionType.ADMIN_LOGIN,
    });
  }

  /**
   * 로그아웃 추적
   */
  public async trackLogout(adminId: string): Promise<AdminActionRecord | null> {
    return this.track({
      adminId,
      actionType: AdminActionType.ADMIN_LOGOUT,
    });
  }

  /**
   * 통계 조회
   */
  public async getStatistics(options: StatsOptions): Promise<AdminActionStats | null> {
    try {
      const supabase = await createClient();

      // 기본 필터 쿼리
      let baseQuery = supabase.from('admin_actions').select('*');

      // 필터 적용
      if (options.adminId) {
        baseQuery = baseQuery.eq('admin_id', options.adminId);
      }

      if (options.startDate) {
        baseQuery = baseQuery.gte('created_at', options.startDate);
      }

      if (options.endDate) {
        baseQuery = baseQuery.lte('created_at', options.endDate);
      }

      const { data, error } = await baseQuery;

      if (error) {
        console.error('[ActivityTracker] Statistics query error:', error);
        return null;
      }

      if (!data || data.length === 0) {
        return {
          totalActions: 0,
          byAdmin: [],
          byActionType: [],
          byDate: [],
          byResult: { success: 0, failure: 0 },
          avgDuration: 0,
        };
      }

      const stats: AdminActionStats = {
        totalActions: data.length,
      };

      // 그룹별 집계
      if (options.groupBy === 'admin') {
        stats.byAdmin = await this.aggregateByAdmin(data);
      } else if (options.groupBy === 'action_type') {
        stats.byActionType = this.aggregateByActionType(data);
      } else if (options.groupBy === 'date') {
        stats.byDate = this.aggregateByDate(data);
      }

      // 결과별 집계
      stats.byResult = this.aggregateByResult(data);

      // 평균 실행 시간
      stats.avgDuration = this.calculateAvgDuration(data);

      return stats;
    } catch (error) {
      console.error('[ActivityTracker] Statistics error:', error);
      return null;
    }
  }

  /**
   * 관리자별 집계
   */
  private async aggregateByAdmin(
    data: any[]
  ): Promise<Array<{ adminId: string; name: string; count: number }>> {
    const supabase = await createClient();

    const adminCounts: Record<string, number> = {};
    data.forEach((action: any) => {
      const adminId = action.admin_id;
      adminCounts[adminId] = (adminCounts[adminId] || 0) + 1;
    });

    const result = [];
    for (const [adminId, count] of Object.entries(adminCounts)) {
      // 관리자 이름 조회
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', adminId)
        .single();

      result.push({
        adminId,
        name: profile?.full_name || profile?.email || 'Unknown',
        count,
      });
    }

    return result.sort((a, b) => b.count - a.count);
  }

  /**
   * 액션 타입별 집계
   */
  private aggregateByActionType(
    data: any[]
  ): Array<{ type: string; count: number }> {
    const typeCounts: Record<string, number> = {};
    data.forEach((action: any) => {
      const type = action.action_type;
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    return Object.entries(typeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * 날짜별 집계
   */
  private aggregateByDate(
    data: any[]
  ): Array<{ date: string; count: number }> {
    const dateCounts: Record<string, number> = {};
    data.forEach((action: any) => {
      const date = new Date(action.created_at).toISOString().split('T')[0];
      dateCounts[date] = (dateCounts[date] || 0) + 1;
    });

    return Object.entries(dateCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * 결과별 집계
   */
  private aggregateByResult(data: any[]): { success: number; failure: number } {
    const result = { success: 0, failure: 0 };
    data.forEach((action: any) => {
      if (action.result === 'success') {
        result.success++;
      } else if (action.result === 'failure') {
        result.failure++;
      }
    });
    return result;
  }

  /**
   * 평균 실행 시간 계산
   */
  private calculateAvgDuration(data: any[]): number {
    const durations = data
      .filter((action: any) => action.duration_ms != null)
      .map((action: any) => action.duration_ms);

    if (durations.length === 0) {
      return 0;
    }

    const sum = durations.reduce((acc, val) => acc + val, 0);
    return Math.round(sum / durations.length);
  }

  /**
   * 최근 액션 조회
   */
  public async getRecentActions(
    limit: number = 50
  ): Promise<AdminActionRecord[]> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('admin_actions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[ActivityTracker] Recent actions query error:', error);
        return [];
      }

      return (data || []) as AdminActionRecord[];
    } catch (error) {
      console.error('[ActivityTracker] Recent actions error:', error);
      return [];
    }
  }

  /**
   * 특정 관리자의 액션 조회
   */
  public async getActionsByAdmin(
    adminId: string,
    limit: number = 100
  ): Promise<AdminActionRecord[]> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('admin_actions')
        .select('*')
        .eq('admin_id', adminId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[ActivityTracker] Admin actions query error:', error);
        return [];
      }

      return (data || []) as AdminActionRecord[];
    } catch (error) {
      console.error('[ActivityTracker] Admin actions error:', error);
      return [];
    }
  }
}

/**
 * 편의 함수: ActivityTracker 인스턴스 가져오기
 */
export function getActivityTracker(): ActivityTracker {
  return ActivityTracker.getInstance();
}
