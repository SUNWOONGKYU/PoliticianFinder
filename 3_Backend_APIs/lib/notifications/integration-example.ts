/**
 * P4BA11: Notification System Integration Example
 * 작업일: 2025-11-09
 * 설명: 알림 시스템 통합 사용 예시
 */

import {
  TemplateEngine,
  renderCommentNotification,
  renderLikeNotification,
  renderFollowNotification,
} from './template-engine';
import {
  NotificationMessage,
  NotificationType,
  NotificationSendOptions,
} from './types';
import { supabaseClient } from '@/infrastructure/core';

/**
 * 알림 서비스 클래스
 * 실제 프로젝트에서 사용할 수 있는 통합 예시
 */
export class NotificationService {
  private templateEngine: TemplateEngine;

  constructor() {
    this.templateEngine = TemplateEngine.getInstance();
  }

  /**
   * 댓글 알림 발송
   */
  async sendCommentNotification(
    recipientId: string,
    authorName: string,
    commentContent: string,
    postId: string,
    options?: NotificationSendOptions
  ): Promise<void> {
    // 템플릿 렌더링
    const notification = renderCommentNotification(authorName, commentContent, {
      truncateLength: 50,
    });

    // 알림 메시지 생성
    const message: NotificationMessage = {
      title: notification.title,
      body: notification.body,
      type: NotificationType.COMMENT,
      recipient_id: recipientId,
      reference_id: postId,
      reference_type: 'post',
    };

    // 알림 저장 및 발송
    await this.sendNotification(message, options);
  }

  /**
   * 좋아요 알림 발송
   */
  async sendLikeNotification(
    recipientId: string,
    authorName: string,
    postId: string,
    options?: NotificationSendOptions
  ): Promise<void> {
    const notification = renderLikeNotification(authorName);

    const message: NotificationMessage = {
      title: notification.title,
      body: notification.body,
      type: NotificationType.LIKE,
      recipient_id: recipientId,
      reference_id: postId,
      reference_type: 'post',
    };

    await this.sendNotification(message, options);
  }

  /**
   * 팔로우 알림 발송
   */
  async sendFollowNotification(
    recipientId: string,
    followerName: string,
    followerId: string,
    options?: NotificationSendOptions
  ): Promise<void> {
    const notification = renderFollowNotification(followerName);

    const message: NotificationMessage = {
      title: notification.title,
      body: notification.body,
      type: NotificationType.FOLLOW,
      recipient_id: recipientId,
      sender_id: followerId,
      reference_type: 'user',
    };

    await this.sendNotification(message, options);
  }

  /**
   * 커스텀 알림 발송 (템플릿 기반)
   */
  async sendCustomNotification(
    recipientId: string,
    type: NotificationType,
    variables: Record<string, string>,
    options?: NotificationSendOptions
  ): Promise<void> {
    // 데이터베이스에서 템플릿 조회
    const { data: template, error } = await supabaseClient
      .from('notification_templates')
      .select('*')
      .eq('type', type)
      .eq('is_enabled', true)
      .single();

    if (error || !template) {
      throw new Error(`Template not found or disabled for type: ${type}`);
    }

    // 템플릿 렌더링
    const title = this.templateEngine.render(
      template.title_template,
      variables,
      { truncateLength: 100 }
    );

    const body = this.templateEngine.render(
      template.body_template,
      variables,
      { truncateLength: 200 }
    );

    // 알림 메시지 생성
    const message: NotificationMessage = {
      title,
      body,
      type,
      recipient_id: recipientId,
    };

    await this.sendNotification(message, options);
  }

  /**
   * 알림 발송 (내부 메서드)
   */
  private async sendNotification(
    message: NotificationMessage,
    options?: NotificationSendOptions
  ): Promise<void> {
    // 전역 설정 확인
    const { data: settings, error: settingsError } = await supabaseClient
      .from('notification_settings')
      .select('*')
      .single();

    if (settingsError || !settings) {
      throw new Error('Failed to fetch notification settings');
    }

    // 알림이 비활성화된 경우
    if (!settings.notifications_enabled) {
      console.log('Notifications are globally disabled');
      return;
    }

    // 사용자별 알림 개수 확인
    const { count } = await supabaseClient
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', message.recipient_id)
      .eq('is_read', false);

    if (count && count >= settings.max_notifications_per_user) {
      console.log(
        `User ${message.recipient_id} has reached max notifications limit`
      );
      return;
    }

    // 알림 저장
    const { data: notification, error: insertError } = await supabaseClient
      .from('notifications')
      .insert({
        user_id: message.recipient_id,
        type: message.type,
        title: message.title,
        body: message.body,
        sender_id: message.sender_id || null,
        reference_id: message.reference_id || null,
        reference_type: message.reference_type || null,
        metadata: message.metadata || null,
        is_read: false,
      })
      .select()
      .single();

    if (insertError || !notification) {
      throw new Error('Failed to save notification');
    }

    // 이메일 발송
    if (
      settings.email_notifications_enabled &&
      (options?.send_email ?? true)
    ) {
      await this.sendEmail(message);
    }

    // 푸시 알림 발송
    if (settings.push_notifications_enabled && (options?.send_push ?? true)) {
      await this.sendPush(message);
    }

    console.log(`Notification sent to user ${message.recipient_id}`);
  }

  /**
   * 이메일 발송 (예시)
   */
  private async sendEmail(message: NotificationMessage): Promise<void> {
    // TODO: 실제 이메일 발송 로직 구현
    // 예: SendGrid, AWS SES, Mailgun 등
    console.log('Email sent:', message.title);
  }

  /**
   * 푸시 알림 발송 (예시)
   */
  private async sendPush(message: NotificationMessage): Promise<void> {
    // TODO: 실제 푸시 알림 발송 로직 구현
    // 예: Firebase Cloud Messaging, OneSignal 등
    console.log('Push notification sent:', message.title);
  }

  /**
   * 알림 읽음 처리
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const { error } = await supabaseClient
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) {
      throw new Error('Failed to mark notification as read');
    }
  }

  /**
   * 모든 알림 읽음 처리
   */
  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabaseClient
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      throw new Error('Failed to mark all notifications as read');
    }
  }

  /**
   * 알림 삭제
   */
  async deleteNotification(
    notificationId: string,
    userId: string
  ): Promise<void> {
    const { error } = await supabaseClient
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) {
      throw new Error('Failed to delete notification');
    }
  }

  /**
   * 사용자 알림 목록 조회
   */
  async getUserNotifications(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ) {
    const { data, error } = await supabaseClient
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error('Failed to fetch notifications');
    }

    return data;
  }

  /**
   * 읽지 않은 알림 개수 조회
   */
  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabaseClient
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      throw new Error('Failed to fetch unread count');
    }

    return count || 0;
  }
}

/**
 * 사용 예시
 */
export async function exampleUsage() {
  const notificationService = new NotificationService();

  // 1. 댓글 알림 발송
  await notificationService.sendCommentNotification(
    'recipient-user-id',
    '홍길동',
    '좋은 글 감사합니다!',
    'post-id-123'
  );

  // 2. 좋아요 알림 발송
  await notificationService.sendLikeNotification(
    'recipient-user-id',
    '김철수',
    'post-id-123'
  );

  // 3. 팔로우 알림 발송
  await notificationService.sendFollowNotification(
    'recipient-user-id',
    '이영희',
    'follower-user-id'
  );

  // 4. 커스텀 알림 발송
  await notificationService.sendCustomNotification(
    'recipient-user-id',
    NotificationType.MENTION,
    {
      작성자: '박지성',
      게시글제목: '정치인 검색 서비스 소개',
    }
  );

  // 5. 알림 목록 조회
  const notifications = await notificationService.getUserNotifications(
    'user-id-123',
    20,
    0
  );
  console.log('Notifications:', notifications);

  // 6. 읽지 않은 알림 개수
  const unreadCount = await notificationService.getUnreadCount('user-id-123');
  console.log('Unread count:', unreadCount);

  // 7. 알림 읽음 처리
  await notificationService.markAsRead('notification-id', 'user-id-123');

  // 8. 모든 알림 읽음 처리
  await notificationService.markAllAsRead('user-id-123');

  // 9. 알림 삭제
  await notificationService.deleteNotification('notification-id', 'user-id-123');
}

/**
 * API 핸들러 예시
 */
export async function handleCommentCreation(
  postId: string,
  postAuthorId: string,
  commentAuthorId: string,
  commentAuthorName: string,
  commentContent: string
) {
  // 자신의 게시글에 댓글을 단 경우는 알림을 보내지 않음
  if (postAuthorId === commentAuthorId) {
    return;
  }

  const notificationService = new NotificationService();

  await notificationService.sendCommentNotification(
    postAuthorId, // 알림 받을 사람 (게시글 작성자)
    commentAuthorName, // 댓글 작성자 이름
    commentContent, // 댓글 내용
    postId // 게시글 ID
  );
}

/**
 * 배치 알림 처리 예시
 */
export async function processBatchNotifications() {
  // 전역 설정 확인
  const { data: settings } = await supabaseClient
    .from('notification_settings')
    .select('*')
    .single();

  if (!settings?.batch_processing_enabled) {
    console.log('Batch processing is disabled');
    return;
  }

  // TODO: 배치 알림 처리 로직 구현
  // - 특정 시간 간격마다 실행 (예: cron job)
  // - 대기 중인 알림을 모아서 발송
  // - 사용자별로 그룹화하여 요약 알림 발송
  console.log('Processing batch notifications...');
}
