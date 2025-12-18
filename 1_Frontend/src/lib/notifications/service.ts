// P7BA3: 알림 서비스 유틸리티
// 프로그래매틱하게 알림을 생성하는 서비스

import { createAdminClient } from '@/lib/supabase/server';

// 알림 유형 정의
export type NotificationType =
  | 'comment'           // 내 게시글에 댓글
  | 'reply'            // 내 댓글에 답글
  | 'vote'             // 내 댓글에 공감/비공감
  | 'follow'           // 팔로우
  | 'mention'          // 멘션
  | 'politician_update' // 팔로우한 정치인 업데이트
  | 'notice'           // 새 공지사항
  | 'grade_change'     // 등급 변경
  | 'points'           // 포인트 적립
  | 'inquiry_reply'    // 문의 처리 완료
  | 'report_payment'   // 보고서 입금 확인
  | 'report_sent'      // 보고서 발송 완료
  | 'system';          // 시스템 알림

// 알림 생성 파라미터
export interface CreateNotificationParams {
  user_id: string;
  actor_id?: string;
  type: NotificationType;
  title: string;
  message: string;
  link_url?: string;
  target_type?: string;
  target_id?: string;
  metadata?: Record<string, any>;
}

// 알림 서비스 클래스
export class NotificationService {
  private supabase = createAdminClient();

  // 단일 알림 생성
  async createNotification(params: CreateNotificationParams): Promise<boolean> {
    try {
      const { error } = await (this.supabase.from('notifications') as any).insert({
        user_id: params.user_id,
        actor_id: params.actor_id || null,
        type: params.type,
        title: params.title,
        message: params.message,
        link_url: params.link_url || null,
        target_type: params.target_type || null,
        target_id: params.target_id || null,
        metadata: params.metadata || {},
        is_read: false,
      });

      if (error) {
        console.error('[NotificationService] Create error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[NotificationService] Error:', error);
      return false;
    }
  }

  // 여러 사용자에게 동일한 알림 생성 (공지사항 등)
  async createBulkNotifications(
    userIds: string[],
    notification: Omit<CreateNotificationParams, 'user_id'>
  ): Promise<boolean> {
    try {
      const notifications = userIds.map(user_id => ({
        user_id,
        actor_id: notification.actor_id || null,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        link_url: notification.link_url || null,
        target_type: notification.target_type || null,
        target_id: notification.target_id || null,
        metadata: notification.metadata || {},
        is_read: false,
      }));

      const { error } = await (this.supabase.from('notifications') as any).insert(notifications);

      if (error) {
        console.error('[NotificationService] Bulk create error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[NotificationService] Error:', error);
      return false;
    }
  }

  // === 특정 알림 유형별 헬퍼 메서드 ===

  // 문의 처리 완료 알림
  async notifyInquiryReply(userId: string, inquiryId: string, inquiryTitle: string): Promise<boolean> {
    return this.createNotification({
      user_id: userId,
      type: 'inquiry_reply',
      title: '문의 답변 완료',
      message: `"${inquiryTitle}" 문의에 대한 답변이 등록되었습니다.`,
      link_url: `/support/inquiries/${inquiryId}`,
      target_type: 'inquiry',
      target_id: inquiryId,
    });
  }

  // 보고서 입금 확인 알림
  async notifyReportPaymentConfirmed(
    userId: string,
    purchaseId: string,
    politicianName: string
  ): Promise<boolean> {
    return this.createNotification({
      user_id: userId,
      type: 'report_payment',
      title: '입금 확인 완료',
      message: `${politicianName}님의 상세 평가 보고서 입금이 확인되었습니다. 곧 보고서가 발송됩니다.`,
      link_url: `/report-purchase/status/${purchaseId}`,
      target_type: 'report_purchase',
      target_id: purchaseId,
    });
  }

  // 보고서 발송 완료 알림
  async notifyReportSent(
    userId: string,
    purchaseId: string,
    politicianName: string,
    email: string
  ): Promise<boolean> {
    return this.createNotification({
      user_id: userId,
      type: 'report_sent',
      title: '보고서 발송 완료',
      message: `${politicianName}님의 상세 평가 보고서가 ${email}로 발송되었습니다.`,
      link_url: `/report-purchase/status/${purchaseId}`,
      target_type: 'report_purchase',
      target_id: purchaseId,
    });
  }

  // 새 공지사항 알림 (모든 사용자에게)
  async notifyNewNotice(noticeId: string, noticeTitle: string): Promise<boolean> {
    try {
      // 모든 활성 사용자 조회
      const { data: users, error } = await this.supabase
        .from('users')
        .select('user_id')
        .eq('is_active', true) as { data: { user_id: string }[] | null; error: any };

      if (error || !users) {
        console.error('[NotificationService] Get users error:', error);
        return false;
      }

      const userIds = users.map(u => u.user_id);

      return this.createBulkNotifications(userIds, {
        type: 'notice',
        title: '새 공지사항',
        message: `새 공지사항: ${noticeTitle}`,
        link_url: `/notices/${noticeId}`,
        target_type: 'notice',
        target_id: noticeId,
      });
    } catch (error) {
      console.error('[NotificationService] Error:', error);
      return false;
    }
  }

  // 팔로우한 정치인 업데이트 알림
  async notifyPoliticianUpdate(
    politicianId: string,
    politicianName: string,
    updateType: 'evaluation' | 'post' | 'news'
  ): Promise<boolean> {
    try {
      // 해당 정치인을 팔로우한 사용자 조회
      const { data: followers, error } = await this.supabase
        .from('favorite_politicians')
        .select('user_id')
        .eq('politician_id', politicianId) as { data: { user_id: string }[] | null; error: any };

      if (error || !followers || followers.length === 0) {
        return true; // 팔로워가 없으면 성공으로 처리
      }

      const updateTypeText = {
        evaluation: 'AI 평가',
        post: '새 글',
        news: '관련 뉴스',
      }[updateType];

      const userIds = followers.map(f => f.user_id);

      return this.createBulkNotifications(userIds, {
        type: 'politician_update',
        title: '정치인 업데이트',
        message: `${politicianName}님의 ${updateTypeText}가 업데이트되었습니다.`,
        link_url: `/politicians/${politicianId}`,
        target_type: 'politician',
        target_id: politicianId,
        metadata: { update_type: updateType },
      });
    } catch (error) {
      console.error('[NotificationService] Error:', error);
      return false;
    }
  }

  // 등급 변경 알림
  async notifyGradeChange(
    userId: string,
    oldGrade: string | null,
    newGrade: string
  ): Promise<boolean> {
    return this.createNotification({
      user_id: userId,
      type: 'grade_change',
      title: '등급 변경',
      message: `회원님의 등급이 ${newGrade}(으)로 변경되었습니다!`,
      link_url: '/profile',
      metadata: { old_grade: oldGrade, new_grade: newGrade },
    });
  }

  // 포인트 적립 알림
  async notifyPointsEarned(
    userId: string,
    amount: number,
    reason: string,
    totalPoints: number
  ): Promise<boolean> {
    return this.createNotification({
      user_id: userId,
      type: 'points',
      title: '포인트 적립',
      message: `${amount} 포인트가 적립되었습니다. (${reason})`,
      link_url: '/profile/points',
      metadata: { amount, reason, total: totalPoints },
    });
  }

  // 읽지 않은 알림 수 조회
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('[NotificationService] Count error:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('[NotificationService] Error:', error);
      return 0;
    }
  }

  // 모든 알림 읽음 처리
  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await (this.supabase.from('notifications') as any)
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('[NotificationService] Mark all read error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[NotificationService] Error:', error);
      return false;
    }
  }
}

// 싱글톤 인스턴스
export const notificationService = new NotificationService();
