/**
 * Task ID: P4BA6
 * 작업일: 2025-11-09
 * 설명: 알림 생성 헬퍼 유틸리티
 *
 * 기능:
 * - 알림 타입별 자동 생성
 * - 중복 알림 방지 (1시간 내)
 * - 배치 알림 생성 (여러 사용자 그룹화)
 * - 알림 읽음/삭제 처리
 */

import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * 알림 타입 정의
 */
export type NotificationType =
  | 'post_like'        // 게시글 좋아요
  | 'post_comment'     // 게시글 댓글
  | 'comment_reply'    // 댓글 답글
  | 'follow'           // 팔로우
  | 'mention'          // 멘션
  | 'system';          // 시스템 공지

/**
 * 알림 생성 요청 인터페이스
 */
export interface CreateNotificationParams {
  user_id: string;           // 알림 받을 사용자 ID
  actor_id?: string | null;  // 알림을 발생시킨 사용자 ID (시스템 알림은 null)
  type: NotificationType;    // 알림 타입
  target_type?: string;      // 대상 객체 타입 (post, comment, politician 등)
  target_id?: string;        // 대상 객체 ID
  link_url?: string;         // 알림 클릭 시 이동할 URL
  custom_message?: string;   // 커스텀 메시지 (선택)
}

/**
 * 배치 알림 생성 요청 인터페이스
 */
export interface CreateBatchNotificationParams {
  user_id: string;           // 알림 받을 사용자 ID
  actor_ids: string[];       // 알림을 발생시킨 사용자 ID 배열
  type: NotificationType;    // 알림 타입
  target_type?: string;      // 대상 객체 타입
  target_id?: string;        // 대상 객체 ID
  link_url?: string;         // 알림 클릭 시 이동할 URL
}

/**
 * 알림 데이터 인터페이스
 */
export interface Notification {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: string;
  title: string;
  message: string;
  link_url: string | null;
  target_type: string | null;
  target_id: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

/**
 * 알림 타입별 메시지 템플릿
 */
const NOTIFICATION_TEMPLATES: Record<
  NotificationType,
  { title: string; message: (actorName: string, count?: number) => string }
> = {
  post_like: {
    title: '좋아요 알림',
    message: (actorName: string, count?: number) =>
      count && count > 1
        ? `${actorName} 외 ${count - 1}명이 게시글을 좋아합니다`
        : `${actorName}님이 게시글을 좋아합니다`,
  },
  post_comment: {
    title: '댓글 알림',
    message: (actorName: string, count?: number) =>
      count && count > 1
        ? `${actorName} 외 ${count - 1}명이 댓글을 달았습니다`
        : `${actorName}님이 댓글을 달았습니다`,
  },
  comment_reply: {
    title: '답글 알림',
    message: (actorName: string, count?: number) =>
      count && count > 1
        ? `${actorName} 외 ${count - 1}명이 답글을 달았습니다`
        : `${actorName}님이 답글을 달았습니다`,
  },
  follow: {
    title: '팔로우 알림',
    message: (actorName: string, count?: number) =>
      count && count > 1
        ? `${actorName} 외 ${count - 1}명이 팔로우했습니다`
        : `${actorName}님이 팔로우했습니다`,
  },
  mention: {
    title: '멘션 알림',
    message: (actorName: string, count?: number) =>
      count && count > 1
        ? `${actorName} 외 ${count - 1}명이 멘션했습니다`
        : `${actorName}님이 멘션했습니다`,
  },
  system: {
    title: '시스템 알림',
    message: (actorName: string) => actorName, // 시스템 알림은 actorName에 메시지 전달
  },
};

/**
 * 사용자 정보 조회
 */
async function getUserInfo(userId: string): Promise<{ nickname: string } | null> {
  const { data, error } = await supabase
    .from('users')
    .select('nickname')
    .eq('id', userId)
    .single();

  if (error || !data) {
    console.error('Failed to get user info:', error);
    return null;
  }

  return data;
}

/**
 * 중복 알림 체크 (1시간 내)
 * 동일 사용자의 동일 타입 알림이 1시간 내 존재하는지 확인
 */
async function checkDuplicateNotification(
  userId: string,
  actorId: string | null,
  type: NotificationType,
  targetId?: string
): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  let query = supabase
    .from('notifications')
    .select('id')
    .eq('user_id', userId)
    .eq('type', type)
    .gte('created_at', oneHourAgo);

  if (actorId) {
    query = query.eq('actor_id', actorId);
  }

  if (targetId) {
    query = query.eq('target_id', targetId);
  }

  const { data, error } = await query.limit(1);

  if (error) {
    console.error('Error checking duplicate notification:', error);
    return false;
  }

  return data && data.length > 0;
}

/**
 * 기존 배치 알림 찾기 (1시간 내)
 * 동일한 타입과 대상에 대한 배치 알림이 있는지 확인
 */
async function findExistingBatchNotification(
  userId: string,
  type: NotificationType,
  targetId?: string
): Promise<Notification | null> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .eq('type', type)
    .gte('created_at', oneHourAgo);

  if (targetId) {
    query = query.eq('target_id', targetId);
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error finding existing batch notification:', error);
    return null;
  }

  return data && data.length > 0 ? data[0] : null;
}

/**
 * 알림 생성
 *
 * @param params - 알림 생성 파라미터
 * @returns 생성된 알림 객체 또는 null
 */
export async function createNotification(
  params: CreateNotificationParams
): Promise<Notification | null> {
  const { user_id, actor_id, type, target_type, target_id, link_url, custom_message } = params;

  try {
    // 중복 알림 체크 (시스템 알림 제외)
    if (type !== 'system' && actor_id) {
      const isDuplicate = await checkDuplicateNotification(
        user_id,
        actor_id,
        type,
        target_id
      );

      if (isDuplicate) {
        console.log('Duplicate notification detected, skipping creation');
        return null;
      }
    }

    // 사용자 정보 조회 (actor가 있는 경우)
    let actorName = '시스템';
    if (actor_id) {
      const userInfo = await getUserInfo(actor_id);
      actorName = userInfo?.nickname || '알 수 없음';
    }

    // 메시지 생성
    const template = NOTIFICATION_TEMPLATES[type];
    const title = template.title;
    const message = custom_message || template.message(actorName);

    // 알림 생성
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id,
        actor_id,
        type,
        title,
        message,
        link_url: link_url || null,
        target_type: target_type || null,
        target_id: target_id || null,
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create notification:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in createNotification:', error);
    return null;
  }
}

/**
 * 배치 알림 생성
 * 여러 사용자의 동일한 액션을 그룹화하여 하나의 알림으로 생성
 * 예: "홍길동 외 5명이 좋아합니다"
 *
 * @param params - 배치 알림 생성 파라미터
 * @returns 생성된 알림 객체 또는 null
 */
export async function createBatchNotification(
  params: CreateBatchNotificationParams
): Promise<Notification | null> {
  const { user_id, actor_ids, type, target_type, target_id, link_url } = params;

  try {
    if (actor_ids.length === 0) {
      console.error('No actors provided for batch notification');
      return null;
    }

    // 기존 배치 알림 찾기
    const existingNotification = await findExistingBatchNotification(
      user_id,
      type,
      target_id
    );

    // 첫 번째 사용자 정보 조회
    const firstActorInfo = await getUserInfo(actor_ids[0]);
    const firstActorName = firstActorInfo?.nickname || '알 수 없음';

    // 메시지 생성
    const template = NOTIFICATION_TEMPLATES[type];
    const title = template.title;
    const message = template.message(firstActorName, actor_ids.length);

    if (existingNotification) {
      // 기존 알림 업데이트
      const { data, error } = await supabase
        .from('notifications')
        .update({
          message,
          created_at: new Date().toISOString(), // 최신 시간으로 업데이트
        })
        .eq('id', existingNotification.id)
        .select()
        .single();

      if (error) {
        console.error('Failed to update batch notification:', error);
        return null;
      }

      return data;
    } else {
      // 새 알림 생성
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id,
          actor_id: actor_ids[0], // 첫 번째 actor를 대표로 저장
          type,
          title,
          message,
          link_url: link_url || null,
          target_type: target_type || null,
          target_id: target_id || null,
          is_read: false,
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to create batch notification:', error);
        return null;
      }

      return data;
    }
  } catch (error) {
    console.error('Error in createBatchNotification:', error);
    return null;
  }
}

/**
 * 알림 읽음 처리
 *
 * @param notificationId - 알림 ID
 * @returns 성공 여부
 */
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId);

    if (error) {
      console.error('Failed to mark notification as read:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in markNotificationAsRead:', error);
    return false;
  }
}

/**
 * 여러 알림 읽음 처리
 *
 * @param notificationIds - 알림 ID 배열
 * @returns 성공 여부
 */
export async function markNotificationsAsRead(notificationIds: string[]): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .in('id', notificationIds);

    if (error) {
      console.error('Failed to mark notifications as read:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in markNotificationsAsRead:', error);
    return false;
  }
}

/**
 * 사용자의 모든 알림 읽음 처리
 *
 * @param userId - 사용자 ID
 * @returns 성공 여부
 */
export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Failed to mark all notifications as read:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in markAllNotificationsAsRead:', error);
    return false;
  }
}

/**
 * 알림 삭제
 *
 * @param notificationId - 알림 ID
 * @returns 성공 여부
 */
export async function deleteNotification(notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('Failed to delete notification:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteNotification:', error);
    return false;
  }
}

/**
 * 여러 알림 삭제
 *
 * @param notificationIds - 알림 ID 배열
 * @returns 성공 여부
 */
export async function deleteNotifications(notificationIds: string[]): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .in('id', notificationIds);

    if (error) {
      console.error('Failed to delete notifications:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteNotifications:', error);
    return false;
  }
}

/**
 * 사용자의 모든 읽은 알림 삭제
 *
 * @param userId - 사용자 ID
 * @returns 성공 여부
 */
export async function deleteReadNotifications(userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)
      .eq('is_read', true);

    if (error) {
      console.error('Failed to delete read notifications:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteReadNotifications:', error);
    return false;
  }
}

/**
 * 읽지 않은 알림 개수 조회
 *
 * @param userId - 사용자 ID
 * @returns 읽지 않은 알림 개수
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Failed to get unread notification count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error in getUnreadNotificationCount:', error);
    return 0;
  }
}

/**
 * 알림 목록 조회
 *
 * @param userId - 사용자 ID
 * @param options - 조회 옵션 (페이지네이션, 필터)
 * @returns 알림 목록과 총 개수
 */
export async function getNotifications(
  userId: string,
  options: {
    page?: number;
    limit?: number;
    type?: NotificationType;
    is_read?: boolean;
  } = {}
): Promise<{ notifications: Notification[]; total: number }> {
  try {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const start = (page - 1) * limit;
    const end = start + limit - 1;

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (options.type) {
      query = query.eq('type', options.type);
    }

    if (options.is_read !== undefined) {
      query = query.eq('is_read', options.is_read);
    }

    query = query.range(start, end);

    const { data, count, error } = await query;

    if (error) {
      console.error('Failed to get notifications:', error);
      return { notifications: [], total: 0 };
    }

    return {
      notifications: data || [],
      total: count || 0,
    };
  } catch (error) {
    console.error('Error in getNotifications:', error);
    return { notifications: [], total: 0 };
  }
}

/**
 * 오래된 알림 자동 삭제 (30일 이상 읽은 알림)
 *
 * @returns 삭제된 알림 개수
 */
export async function deleteOldNotifications(): Promise<number> {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('notifications')
      .delete()
      .eq('is_read', true)
      .lt('read_at', thirtyDaysAgo)
      .select();

    if (error) {
      console.error('Failed to delete old notifications:', error);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    console.error('Error in deleteOldNotifications:', error);
    return 0;
  }
}
