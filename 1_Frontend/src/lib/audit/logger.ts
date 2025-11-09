/**
 * Project Grid Task ID: P4BA8
 * 작업명: 감사 로그 API - Audit Logger
 * 생성시간: 2025-11-09
 * 생성자: Claude-Sonnet-4.5
 * 의존성: P2D1 (Database 스키마)
 * 설명: 관리자 액션 자동 기록 유틸리티
 */

import { createClient } from '@/lib/supabase/server';

/**
 * 감사 로그 액션 타입
 */
export enum AuditActionType {
  USER_BAN = 'user_ban',
  USER_UNBAN = 'user_unban',
  POST_DELETE = 'post_delete',
  COMMENT_DELETE = 'comment_delete',
  REPORT_ACCEPT = 'report_accept',
  REPORT_REJECT = 'report_reject',
  AD_CREATE = 'ad_create',
  POLICY_UPDATE = 'policy_update',
  SYSTEM_SETTING = 'system_setting',
}

/**
 * 감사 로그 레코드 인터페이스
 */
export interface AuditLogRecord {
  id?: string;
  admin_id: string;
  action_type: AuditActionType | string;
  target_type?: string;
  target_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at?: string;
}

/**
 * 감사 로그 생성 파라미터
 */
export interface CreateAuditLogParams {
  adminId: string;
  actionType: AuditActionType | string;
  targetType?: string;
  targetId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * AuditLogger 클래스
 * 관리자의 모든 액션을 자동으로 기록
 */
export class AuditLogger {
  private static instance: AuditLogger;

  private constructor() {}

  /**
   * 싱글톤 인스턴스 가져오기
   */
  public static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  /**
   * 감사 로그 기록
   */
  public async log(params: CreateAuditLogParams): Promise<AuditLogRecord | null> {
    try {
      const supabase = createClient();

      const logEntry: Partial<AuditLogRecord> = {
        admin_id: params.adminId,
        action_type: params.actionType,
        target_type: params.targetType,
        target_id: params.targetId,
        details: params.details,
        ip_address: params.ipAddress,
        user_agent: params.userAgent,
      };

      const { data, error } = await supabase
        .from('audit_logs')
        .insert(logEntry)
        .select()
        .single();

      if (error) {
        console.error('[AuditLogger] Failed to create audit log:', error);
        return null;
      }

      return data as AuditLogRecord;
    } catch (error) {
      console.error('[AuditLogger] Unexpected error:', error);
      return null;
    }
  }

  /**
   * 사용자 차단 로그
   */
  public async logUserBan(
    adminId: string,
    userId: string,
    reason: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLogRecord | null> {
    return this.log({
      adminId,
      actionType: AuditActionType.USER_BAN,
      targetType: 'user',
      targetId: userId,
      details: { reason },
      ipAddress,
      userAgent,
    });
  }

  /**
   * 사용자 차단 해제 로그
   */
  public async logUserUnban(
    adminId: string,
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLogRecord | null> {
    return this.log({
      adminId,
      actionType: AuditActionType.USER_UNBAN,
      targetType: 'user',
      targetId: userId,
      ipAddress,
      userAgent,
    });
  }

  /**
   * 게시글 삭제 로그
   */
  public async logPostDelete(
    adminId: string,
    postId: string,
    reason: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLogRecord | null> {
    return this.log({
      adminId,
      actionType: AuditActionType.POST_DELETE,
      targetType: 'post',
      targetId: postId,
      details: { reason },
      ipAddress,
      userAgent,
    });
  }

  /**
   * 댓글 삭제 로그
   */
  public async logCommentDelete(
    adminId: string,
    commentId: string,
    reason: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLogRecord | null> {
    return this.log({
      adminId,
      actionType: AuditActionType.COMMENT_DELETE,
      targetType: 'comment',
      targetId: commentId,
      details: { reason },
      ipAddress,
      userAgent,
    });
  }

  /**
   * 신고 승인 로그
   */
  public async logReportAccept(
    adminId: string,
    reportId: string,
    action: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLogRecord | null> {
    return this.log({
      adminId,
      actionType: AuditActionType.REPORT_ACCEPT,
      targetType: 'report',
      targetId: reportId,
      details: { action },
      ipAddress,
      userAgent,
    });
  }

  /**
   * 신고 거부 로그
   */
  public async logReportReject(
    adminId: string,
    reportId: string,
    reason: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLogRecord | null> {
    return this.log({
      adminId,
      actionType: AuditActionType.REPORT_REJECT,
      targetType: 'report',
      targetId: reportId,
      details: { reason },
      ipAddress,
      userAgent,
    });
  }

  /**
   * 광고 생성 로그
   */
  public async logAdCreate(
    adminId: string,
    adId: string,
    adDetails: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLogRecord | null> {
    return this.log({
      adminId,
      actionType: AuditActionType.AD_CREATE,
      targetType: 'ad',
      targetId: adId,
      details: adDetails,
      ipAddress,
      userAgent,
    });
  }

  /**
   * 정책 수정 로그
   */
  public async logPolicyUpdate(
    adminId: string,
    policyType: string,
    changes: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLogRecord | null> {
    return this.log({
      adminId,
      actionType: AuditActionType.POLICY_UPDATE,
      targetType: 'policy',
      targetId: policyType,
      details: changes,
      ipAddress,
      userAgent,
    });
  }

  /**
   * 시스템 설정 변경 로그
   */
  public async logSystemSetting(
    adminId: string,
    settingKey: string,
    oldValue: any,
    newValue: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLogRecord | null> {
    return this.log({
      adminId,
      actionType: AuditActionType.SYSTEM_SETTING,
      targetType: 'system',
      targetId: settingKey,
      details: { oldValue, newValue },
      ipAddress,
      userAgent,
    });
  }
}

/**
 * 편의 함수: AuditLogger 인스턴스 가져오기
 */
export function getAuditLogger(): AuditLogger {
  return AuditLogger.getInstance();
}
