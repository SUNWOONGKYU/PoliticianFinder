# Notification Helper - Quick Reference Card

## Import
```typescript
import {
  createNotification,
  createBatchNotification,
  markNotificationAsRead,
  getNotifications,
  getUnreadNotificationCount,
} from '@/lib/utils/notification-helper';
```

## Notification Types
```typescript
'post_like' | 'post_comment' | 'comment_reply' | 'follow' | 'mention' | 'system'
```

## Common Patterns

### 1. Create Notification (Like)
```typescript
await createNotification({
  user_id: 'recipient-id',
  actor_id: 'actor-id',
  type: 'post_like',
  target_id: 'post-id',
  link_url: '/posts/123',
});
```

### 2. Batch Notification (Multiple Likes)
```typescript
await createBatchNotification({
  user_id: 'recipient-id',
  actor_ids: ['user-1', 'user-2', 'user-3'],
  type: 'post_like',
  target_id: 'post-id',
});
// Output: "홍길동 외 2명이 좋아합니다"
```

### 3. System Notification
```typescript
await createNotification({
  user_id: 'user-id',
  type: 'system',
  custom_message: '시스템 점검 안내',
});
```

### 4. Get Unread Count (Badge)
```typescript
const count = await getUnreadNotificationCount('user-id');
```

### 5. Get Notifications (Paginated)
```typescript
const { notifications, total } = await getNotifications('user-id', {
  page: 1,
  limit: 20,
  is_read: false,
});
```

### 6. Mark as Read
```typescript
await markNotificationAsRead('notification-id');
```

### 7. Mark All as Read
```typescript
await markAllNotificationsAsRead('user-id');
```

## Message Templates

| Type | Single User | Multiple Users |
|------|-------------|----------------|
| post_like | "김철수님이 좋아합니다" | "김철수 외 5명이 좋아합니다" |
| post_comment | "홍길동님이 댓글을 달았습니다" | "홍길동 외 3명이 댓글을 달았습니다" |
| follow | "이영희님이 팔로우했습니다" | "이영희 외 2명이 팔로우했습니다" |

## Duplicate Prevention
- Same user + same type + same target within **1 hour** = Only 1 notification
- Batch notifications update existing notification instead of creating duplicates

## Return Values
- `createNotification()` → `Notification | null`
- `markNotificationAsRead()` → `boolean`
- `getUnreadNotificationCount()` → `number`
- `getNotifications()` → `{ notifications: [], total: number }`

## Error Handling
- No exceptions thrown
- Returns `null`, `false`, `0`, or `[]` on error
- Errors logged to console

## Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```
