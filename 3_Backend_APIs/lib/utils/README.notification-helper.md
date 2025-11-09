# Notification Helper - P4BA6

알림 생성 및 관리를 위한 헬퍼 유틸리티

## 개요

이 헬퍼는 애플리케이션에서 사용자 알림을 쉽게 생성하고 관리할 수 있도록 도와줍니다. 중복 방지, 배치 알림, 자동 메시지 생성 등의 기능을 제공합니다.

## 주요 기능

### 1. 알림 타입

- `post_like`: 게시글 좋아요
- `post_comment`: 게시글 댓글
- `comment_reply`: 댓글 답글
- `follow`: 팔로우
- `mention`: 멘션
- `system`: 시스템 공지

### 2. 중복 방지

동일 사용자의 동일 타입 알림은 **1시간 내 1개만** 생성됩니다.

예시:
- A가 B의 게시글에 좋아요 5번 클릭 → 알림 1개만 생성
- 좋아요 취소 후 1시간 내 다시 좋아요 → 알림 생성 안 됨
- 1시간 경과 후 다시 좋아요 → 새 알림 생성

### 3. 배치 알림

여러 사용자의 동일한 액션을 하나의 알림으로 그룹화합니다.

예시:
- "홍길동 외 5명이 좋아합니다"
- "김철수 외 3명이 댓글을 달았습니다"

### 4. 자동 메시지 생성

타입별로 미리 정의된 템플릿을 사용하여 자동으로 메시지를 생성합니다.

## API 문서

### createNotification()

단일 알림을 생성합니다.

```typescript
import { createNotification } from '@/lib/utils/notification-helper';

const notification = await createNotification({
  user_id: 'user-123',           // 필수: 알림 받을 사용자 ID
  actor_id: 'actor-456',         // 선택: 알림 발생시킨 사용자 ID
  type: 'post_like',             // 필수: 알림 타입
  target_type: 'post',           // 선택: 대상 타입
  target_id: 'post-789',         // 선택: 대상 ID
  link_url: '/posts/789',        // 선택: 클릭 시 이동 URL
  custom_message: '커스텀 메시지' // 선택: 커스텀 메시지
});
```

**반환값**: `Notification | null`

### createBatchNotification()

배치 알림을 생성합니다 (여러 사용자의 액션 그룹화).

```typescript
import { createBatchNotification } from '@/lib/utils/notification-helper';

const notification = await createBatchNotification({
  user_id: 'user-123',                              // 필수: 알림 받을 사용자 ID
  actor_ids: ['actor-1', 'actor-2', 'actor-3'],    // 필수: 알림 발생시킨 사용자 ID 배열
  type: 'post_like',                                // 필수: 알림 타입
  target_type: 'post',                              // 선택: 대상 타입
  target_id: 'post-789',                            // 선택: 대상 ID
  link_url: '/posts/789',                           // 선택: 클릭 시 이동 URL
});
```

**반환값**: `Notification | null`

### markNotificationAsRead()

알림을 읽음 처리합니다.

```typescript
import { markNotificationAsRead } from '@/lib/utils/notification-helper';

const success = await markNotificationAsRead('notification-id');
```

**반환값**: `boolean`

### markNotificationsAsRead()

여러 알림을 읽음 처리합니다.

```typescript
import { markNotificationsAsRead } from '@/lib/utils/notification-helper';

const success = await markNotificationsAsRead([
  'notification-1',
  'notification-2',
  'notification-3'
]);
```

**반환값**: `boolean`

### markAllNotificationsAsRead()

사용자의 모든 알림을 읽음 처리합니다.

```typescript
import { markAllNotificationsAsRead } from '@/lib/utils/notification-helper';

const success = await markAllNotificationsAsRead('user-id');
```

**반환값**: `boolean`

### deleteNotification()

알림을 삭제합니다.

```typescript
import { deleteNotification } from '@/lib/utils/notification-helper';

const success = await deleteNotification('notification-id');
```

**반환값**: `boolean`

### deleteNotifications()

여러 알림을 삭제합니다.

```typescript
import { deleteNotifications } from '@/lib/utils/notification-helper';

const success = await deleteNotifications([
  'notification-1',
  'notification-2'
]);
```

**반환값**: `boolean`

### deleteReadNotifications()

사용자의 모든 읽은 알림을 삭제합니다.

```typescript
import { deleteReadNotifications } from '@/lib/utils/notification-helper';

const success = await deleteReadNotifications('user-id');
```

**반환값**: `boolean`

### getUnreadNotificationCount()

읽지 않은 알림 개수를 조회합니다.

```typescript
import { getUnreadNotificationCount } from '@/lib/utils/notification-helper';

const count = await getUnreadNotificationCount('user-id');
console.log(`읽지 않은 알림: ${count}개`);
```

**반환값**: `number`

### getNotifications()

알림 목록을 조회합니다.

```typescript
import { getNotifications } from '@/lib/utils/notification-helper';

// 기본 조회
const result = await getNotifications('user-id');

// 페이지네이션
const result = await getNotifications('user-id', {
  page: 1,
  limit: 20
});

// 타입별 필터
const result = await getNotifications('user-id', {
  type: 'post_like'
});

// 읽지 않은 알림만
const result = await getNotifications('user-id', {
  is_read: false
});
```

**반환값**: `{ notifications: Notification[], total: number }`

### deleteOldNotifications()

30일 이상 경과한 읽은 알림을 자동 삭제합니다.

```typescript
import { deleteOldNotifications } from '@/lib/utils/notification-helper';

const deletedCount = await deleteOldNotifications();
console.log(`${deletedCount}개의 오래된 알림이 삭제되었습니다.`);
```

**반환값**: `number` (삭제된 알림 개수)

## 사용 예시

### 1. 게시글 좋아요 API에서 사용

```typescript
// POST /api/posts/[id]/like
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { userId } = await getUserFromSession(request);
  const postId = params.id;

  // 1. 좋아요 처리
  await likePost(postId, userId);

  // 2. 게시글 작성자 조회
  const post = await getPost(postId);

  // 3. 알림 생성 (자신의 게시글이 아닌 경우만)
  if (userId !== post.author_id) {
    await createNotification({
      user_id: post.author_id,
      actor_id: userId,
      type: 'post_like',
      target_type: 'post',
      target_id: postId,
      link_url: `/posts/${postId}`,
    });
  }

  return NextResponse.json({ success: true });
}
```

### 2. 배치 알림 생성 (좋아요 여러 명)

```typescript
// 주기적으로 실행되는 배치 작업
export async function processBatchNotifications() {
  // 1. 최근 1시간 내 좋아요 그룹화
  const likeGroups = await getRecentLikesByPost();

  for (const group of likeGroups) {
    if (group.liker_ids.length > 1) {
      // 2. 배치 알림 생성
      await createBatchNotification({
        user_id: group.post_author_id,
        actor_ids: group.liker_ids,
        type: 'post_like',
        target_type: 'post',
        target_id: group.post_id,
        link_url: `/posts/${group.post_id}`,
      });
    }
  }
}
```

### 3. 알림 목록 API

```typescript
// GET /api/notifications
export async function GET(request: Request) {
  const { userId } = await getUserFromSession(request);
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const type = searchParams.get('type') as NotificationType | undefined;

  const result = await getNotifications(userId, {
    page,
    limit,
    type,
    is_read: false, // 읽지 않은 알림만
  });

  return NextResponse.json({
    success: true,
    data: result.notifications,
    pagination: {
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit),
    },
  });
}
```

### 4. 읽지 않은 알림 개수 표시 (헤더 배지)

```typescript
// GET /api/notifications/unread-count
export async function GET(request: Request) {
  const { userId } = await getUserFromSession(request);
  const count = await getUnreadNotificationCount(userId);

  return NextResponse.json({
    success: true,
    unread_count: count,
  });
}
```

### 5. 알림 읽음 처리

```typescript
// PATCH /api/notifications/[id]/read
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const notificationId = params.id;
  const success = await markNotificationAsRead(notificationId);

  return NextResponse.json({
    success,
    message: success ? 'Notification marked as read' : 'Failed to mark as read',
  });
}
```

### 6. 모든 알림 읽음 처리

```typescript
// POST /api/notifications/read-all
export async function POST(request: Request) {
  const { userId } = await getUserFromSession(request);
  const success = await markAllNotificationsAsRead(userId);

  return NextResponse.json({
    success,
    message: success ? 'All notifications marked as read' : 'Failed to mark all as read',
  });
}
```

## 알림 메시지 템플릿

### 단일 사용자 알림

| 타입 | 메시지 템플릿 |
|------|--------------|
| post_like | "홍길동님이 게시글을 좋아합니다" |
| post_comment | "김철수님이 댓글을 달았습니다" |
| comment_reply | "이영희님이 답글을 달았습니다" |
| follow | "박민수님이 팔로우했습니다" |
| mention | "최지우님이 멘션했습니다" |
| system | (커스텀 메시지) |

### 배치 알림 (여러 사용자)

| 타입 | 메시지 템플릿 |
|------|--------------|
| post_like | "홍길동 외 5명이 좋아합니다" |
| post_comment | "김철수 외 3명이 댓글을 달았습니다" |
| comment_reply | "이영희 외 2명이 답글을 달았습니다" |
| follow | "박민수 외 4명이 팔로우했습니다" |
| mention | "최지우 외 1명이 멘션했습니다" |

## 중복 방지 전략

### 규칙

1. **시간 기준**: 1시간 내 중복 체크
2. **비교 기준**:
   - user_id (알림 받는 사용자)
   - actor_id (알림 발생시킨 사용자)
   - type (알림 타입)
   - target_id (대상 객체 ID)

### 시나리오

#### 시나리오 1: 좋아요 중복
```
10:00 - A가 B의 게시글 좋아요 → 알림 생성 ✅
10:30 - A가 좋아요 취소 후 다시 좋아요 → 알림 생성 안 됨 ❌
11:30 - A가 다시 좋아요 → 알림 생성 ✅ (1시간 경과)
```

#### 시나리오 2: 배치 알림
```
10:00 - A가 B의 게시글 좋아요 → 알림: "A님이 좋아합니다"
10:15 - C가 B의 게시글 좋아요 → 알림 업데이트: "A 외 1명이 좋아합니다"
10:30 - D, E가 좋아요 → 알림 업데이트: "A 외 3명이 좋아합니다"
```

## 데이터베이스 스키마

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link_url TEXT,
  target_type TEXT,
  target_id UUID,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 환경 변수

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 에러 핸들링

모든 함수는 에러가 발생해도 예외를 던지지 않고, 적절한 기본값을 반환합니다:

- `createNotification()`: `null` 반환
- `markNotificationAsRead()`: `false` 반환
- `getUnreadNotificationCount()`: `0` 반환
- `getNotifications()`: `{ notifications: [], total: 0 }` 반환

에러는 콘솔에 로그됩니다.

## 성능 고려사항

### 인덱스

다음 인덱스가 설정되어 있어야 합니다:

```sql
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_actor_id ON notifications(actor_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC)
  WHERE is_read = FALSE;
```

### 자동 정리

오래된 알림을 주기적으로 삭제하는 것을 권장합니다:

```typescript
// cron job or scheduled task
import { deleteOldNotifications } from '@/lib/utils/notification-helper';

// 매일 새벽 2시 실행
export async function cleanupOldNotifications() {
  const deletedCount = await deleteOldNotifications();
  console.log(`Deleted ${deletedCount} old notifications`);
}
```

## 테스트

```bash
# 테스트 실행
npm test -- notification-helper.test.ts

# 커버리지 확인
npm test -- --coverage notification-helper.test.ts
```

## 버전

- **Version**: 1.0.0
- **Task ID**: P4BA6
- **작업일**: 2025-11-09

## 라이선스

Proprietary - PoliticianFinder Project
