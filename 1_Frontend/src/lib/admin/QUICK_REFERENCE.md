# Admin Action Logs - Quick Reference

**Task ID:** P4BA13 | **Version:** 1.0.0

---

## Import

```typescript
import { getActivityTracker } from '@/lib/admin/activity-tracker';
```

---

## Quick Start

```typescript
const tracker = getActivityTracker();

// Track action
await tracker.track({
  adminId: user.id,
  actionType: 'user_ban',
  targetType: 'user',
  targetId: userId,
  metadata: { reason: 'Spam' }
});
```

---

## Common Patterns

### 1. Track with Timing
```typescript
const { result, error } = await tracker.trackWithTiming(
  { adminId, actionType: 'post_delete', targetId: postId },
  async () => await deletePost(postId)
);
```

### 2. Helper Methods
```typescript
await tracker.trackUserBan(adminId, userId, 'Spam');
await tracker.trackPostDelete(adminId, postId, 'Inappropriate');
await tracker.trackLogin(adminId);
```

### 3. Query Actions
```typescript
const recent = await tracker.getRecentActions(50);
const byAdmin = await tracker.getActionsByAdmin(adminId, 100);
```

### 4. Get Statistics
```typescript
const stats = await tracker.getStatistics({
  startDate: '2025-01-01',
  groupBy: 'action_type'
});
```

---

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/action-logs` | GET | Query logs |
| `/api/admin/action-logs` | POST | Track action |
| `/api/admin/action-logs/stats` | GET | Simple stats |
| `/api/admin/action-logs/stats` | POST | Custom stats |

---

## Action Types

```typescript
'user_ban' | 'user_unban' | 'user_edit'
'post_delete' | 'post_restore'
'comment_delete' | 'comment_restore'
'report_accept' | 'report_reject'
'ad_create' | 'ad_update' | 'ad_delete'
'policy_update' | 'system_setting'
'admin_login' | 'admin_logout'
```

---

## Response Format

```typescript
{
  success: boolean;
  data: any;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
```

---

## TypeScript Types

```typescript
interface TrackActionParams {
  adminId: string;
  actionType: string;
  targetType?: string;
  targetId?: string;
  result?: 'success' | 'failure';
  durationMs?: number;
  metadata?: Record<string, any>;
}

interface AdminActionRecord {
  id?: string;
  admin_id: string;
  action_type: string;
  target_type?: string;
  target_id?: string;
  result: 'success' | 'failure';
  duration_ms?: number;
  metadata?: Record<string, any>;
  created_at?: string;
}
```

---

## Full Docs

- API: `src/app/api/admin/action-logs/API_DOCUMENTATION.md`
- Usage: `src/lib/admin/ACTIVITY_TRACKER_USAGE.md`
- Tests: `src/app/api/admin/action-logs/__tests__/action-logs.test.ts`
