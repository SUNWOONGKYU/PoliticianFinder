/**
 * Task ID: P4BA6
 * Notification Helper 사용 예제
 * 작업일: 2025-11-09
 */

import {
  createNotification,
  createBatchNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getNotifications,
  getUnreadNotificationCount,
  type CreateNotificationParams,
  type CreateBatchNotificationParams,
} from './notification-helper';

/**
 * 예제 1: 게시글 좋아요 알림 생성
 */
export async function examplePostLikeNotification() {
  const params: CreateNotificationParams = {
    user_id: 'post-author-id',           // 게시글 작성자 ID
    actor_id: 'user-who-liked-id',       // 좋아요 누른 사용자 ID
    type: 'post_like',
    target_type: 'post',
    target_id: 'post-id',
    link_url: '/posts/post-id',
  };

  const notification = await createNotification(params);
  console.log('좋아요 알림 생성:', notification);
  // 결과: "홍길동님이 게시글을 좋아합니다"
}

/**
 * 예제 2: 게시글 댓글 알림 생성
 */
export async function examplePostCommentNotification() {
  const params: CreateNotificationParams = {
    user_id: 'post-author-id',           // 게시글 작성자 ID
    actor_id: 'commenter-id',            // 댓글 작성자 ID
    type: 'post_comment',
    target_type: 'post',
    target_id: 'post-id',
    link_url: '/posts/post-id#comments',
  };

  const notification = await createNotification(params);
  console.log('댓글 알림 생성:', notification);
  // 결과: "김철수님이 댓글을 달았습니다"
}

/**
 * 예제 3: 댓글 답글 알림 생성
 */
export async function exampleCommentReplyNotification() {
  const params: CreateNotificationParams = {
    user_id: 'comment-author-id',        // 댓글 작성자 ID
    actor_id: 'replier-id',              // 답글 작성자 ID
    type: 'comment_reply',
    target_type: 'comment',
    target_id: 'comment-id',
    link_url: '/posts/post-id#comment-comment-id',
  };

  const notification = await createNotification(params);
  console.log('답글 알림 생성:', notification);
  // 결과: "이영희님이 답글을 달았습니다"
}

/**
 * 예제 4: 팔로우 알림 생성
 */
export async function exampleFollowNotification() {
  const params: CreateNotificationParams = {
    user_id: 'followed-user-id',         // 팔로우 당한 사용자 ID
    actor_id: 'follower-id',             // 팔로우한 사용자 ID
    type: 'follow',
    target_type: 'user',
    target_id: 'follower-id',
    link_url: '/users/follower-id',
  };

  const notification = await createNotification(params);
  console.log('팔로우 알림 생성:', notification);
  // 결과: "박민수님이 팔로우했습니다"
}

/**
 * 예제 5: 멘션 알림 생성
 */
export async function exampleMentionNotification() {
  const params: CreateNotificationParams = {
    user_id: 'mentioned-user-id',        // 멘션된 사용자 ID
    actor_id: 'mentioner-id',            // 멘션한 사용자 ID
    type: 'mention',
    target_type: 'post',
    target_id: 'post-id',
    link_url: '/posts/post-id',
  };

  const notification = await createNotification(params);
  console.log('멘션 알림 생성:', notification);
  // 결과: "최지우님이 멘션했습니다"
}

/**
 * 예제 6: 시스템 알림 생성
 */
export async function exampleSystemNotification() {
  const params: CreateNotificationParams = {
    user_id: 'user-id',
    type: 'system',
    custom_message: '시스템 점검이 예정되어 있습니다. 2025-11-10 02:00 ~ 04:00',
    link_url: '/announcements/maintenance',
  };

  const notification = await createNotification(params);
  console.log('시스템 알림 생성:', notification);
  // 결과: "시스템 점검이 예정되어 있습니다. 2025-11-10 02:00 ~ 04:00"
}

/**
 * 예제 7: 배치 알림 생성 (여러 사용자가 좋아요)
 */
export async function exampleBatchLikeNotification() {
  const params: CreateBatchNotificationParams = {
    user_id: 'post-author-id',
    actor_ids: ['user-1', 'user-2', 'user-3', 'user-4', 'user-5'],
    type: 'post_like',
    target_type: 'post',
    target_id: 'post-id',
    link_url: '/posts/post-id',
  };

  const notification = await createBatchNotification(params);
  console.log('배치 좋아요 알림 생성:', notification);
  // 결과: "홍길동 외 4명이 좋아합니다"
}

/**
 * 예제 8: 배치 알림 생성 (여러 사용자가 댓글)
 */
export async function exampleBatchCommentNotification() {
  const params: CreateBatchNotificationParams = {
    user_id: 'post-author-id',
    actor_ids: ['user-1', 'user-2', 'user-3'],
    type: 'post_comment',
    target_type: 'post',
    target_id: 'post-id',
    link_url: '/posts/post-id#comments',
  };

  const notification = await createBatchNotification(params);
  console.log('배치 댓글 알림 생성:', notification);
  // 결과: "김철수 외 2명이 댓글을 달았습니다"
}

/**
 * 예제 9: 알림 읽음 처리
 */
export async function exampleMarkAsRead() {
  const notificationId = 'notification-id';
  const success = await markNotificationAsRead(notificationId);
  console.log('알림 읽음 처리:', success);
}

/**
 * 예제 10: 모든 알림 읽음 처리
 */
export async function exampleMarkAllAsRead() {
  const userId = 'user-id';
  const success = await markAllNotificationsAsRead(userId);
  console.log('모든 알림 읽음 처리:', success);
}

/**
 * 예제 11: 알림 삭제
 */
export async function exampleDeleteNotification() {
  const notificationId = 'notification-id';
  const success = await deleteNotification(notificationId);
  console.log('알림 삭제:', success);
}

/**
 * 예제 12: 알림 목록 조회 (기본)
 */
export async function exampleGetNotifications() {
  const userId = 'user-id';
  const result = await getNotifications(userId);
  console.log('알림 목록:', result.notifications);
  console.log('총 개수:', result.total);
}

/**
 * 예제 13: 알림 목록 조회 (페이지네이션)
 */
export async function exampleGetNotificationsWithPagination() {
  const userId = 'user-id';
  const result = await getNotifications(userId, {
    page: 1,
    limit: 20,
  });
  console.log('1페이지 알림 목록:', result.notifications);
  console.log('총 개수:', result.total);
}

/**
 * 예제 14: 알림 목록 조회 (타입별 필터)
 */
export async function exampleGetNotificationsByType() {
  const userId = 'user-id';
  const result = await getNotifications(userId, {
    type: 'post_like',
  });
  console.log('좋아요 알림만:', result.notifications);
}

/**
 * 예제 15: 읽지 않은 알림만 조회
 */
export async function exampleGetUnreadNotifications() {
  const userId = 'user-id';
  const result = await getNotifications(userId, {
    is_read: false,
  });
  console.log('읽지 않은 알림:', result.notifications);
}

/**
 * 예제 16: 읽지 않은 알림 개수 조회
 */
export async function exampleGetUnreadCount() {
  const userId = 'user-id';
  const count = await getUnreadNotificationCount(userId);
  console.log('읽지 않은 알림 개수:', count);
}

/**
 * 예제 17: API 라우트에서 사용 (게시글 좋아요 API)
 */
export async function exampleUseInPostLikeAPI(postId: string, userId: string, postAuthorId: string) {
  // 1. 좋아요 처리 로직...

  // 2. 알림 생성 (자신의 게시글이 아닌 경우만)
  if (userId !== postAuthorId) {
    await createNotification({
      user_id: postAuthorId,
      actor_id: userId,
      type: 'post_like',
      target_type: 'post',
      target_id: postId,
      link_url: `/posts/${postId}`,
    });
  }
}

/**
 * 예제 18: API 라우트에서 배치 알림 사용
 */
export async function exampleUseInBatchLikeAPI(postId: string, postAuthorId: string) {
  // 1. 최근 1시간 내 좋아요한 사용자들 조회 (예시)
  const recentLikers = ['user-1', 'user-2', 'user-3', 'user-4', 'user-5'];

  // 2. 배치 알림 생성
  if (recentLikers.length > 0) {
    await createBatchNotification({
      user_id: postAuthorId,
      actor_ids: recentLikers,
      type: 'post_like',
      target_type: 'post',
      target_id: postId,
      link_url: `/posts/${postId}`,
    });
  }
}

/**
 * 예제 19: 중복 알림 방지 예시
 */
export async function exampleDuplicatePrevention() {
  // 동일한 사용자가 1시간 내에 같은 게시글에 여러 번 좋아요 -> 알림 1개만 생성됨

  // 첫 번째 좋아요 (알림 생성)
  await createNotification({
    user_id: 'post-author-id',
    actor_id: 'user-id',
    type: 'post_like',
    target_id: 'post-id',
  });

  // 좋아요 취소 후 다시 좋아요 (1시간 내) -> 알림 생성 안 됨
  await createNotification({
    user_id: 'post-author-id',
    actor_id: 'user-id',
    type: 'post_like',
    target_id: 'post-id',
  });
}

/**
 * 예제 20: 실시간 알림 카운트 업데이트
 */
export async function exampleRealtimeNotificationCount() {
  const userId = 'user-id';

  // 읽지 않은 알림 개수 조회 (헤더 배지 표시용)
  const unreadCount = await getUnreadNotificationCount(userId);

  // 프론트엔드로 전송
  return {
    unread_count: unreadCount,
  };
}
