# Activity Tracker Usage Guide

**Task ID:** P4BA13
**Component:** ActivityTracker
**Location:** `@/lib/admin/activity-tracker`

## Overview

The ActivityTracker utility provides automated tracking of all administrative actions in the system. It records action details, execution time, results, and metadata for comprehensive admin activity monitoring.

## Basic Usage

### Import the Tracker

```typescript
import { getActivityTracker } from '@/lib/admin/activity-tracker';
```

### Track a Simple Action

```typescript
const tracker = getActivityTracker();

await tracker.track({
  adminId: user.id,
  actionType: 'user_ban',
  targetType: 'user',
  targetId: userId,
  metadata: { reason: 'Spam' }
});
```

## Common Use Cases

### 1. Track User Ban

```typescript
import { getActivityTracker } from '@/lib/admin/activity-tracker';

export async function banUser(adminId: string, userId: string, reason: string) {
  const tracker = getActivityTracker();

  // Perform the ban operation
  try {
    await supabase
      .from('users')
      .update({ is_banned: true })
      .eq('id', userId);

    // Track successful action
    await tracker.trackUserBan(adminId, userId, reason);

    return { success: true };
  } catch (error) {
    // Track failed action
    await tracker.track({
      adminId,
      actionType: 'user_ban',
      targetType: 'user',
      targetId: userId,
      result: 'failure',
      metadata: { reason, error: error.message }
    });

    throw error;
  }
}
```

### 2. Track Action with Timing

```typescript
const tracker = getActivityTracker();

const { result, error } = await tracker.trackWithTiming(
  {
    adminId: user.id,
    actionType: 'post_delete',
    targetType: 'post',
    targetId: postId,
    metadata: { reason: 'Inappropriate content' }
  },
  async () => {
    // This function will be timed automatically
    return await deletePost(postId);
  }
);

if (error) {
  console.error('Post deletion failed:', error);
}
```

### 3. Track Multiple Actions in Sequence

```typescript
const tracker = getActivityTracker();

async function moderateUser(adminId: string, userId: string) {
  // Track login
  await tracker.trackLogin(adminId);

  // Delete user's posts
  const posts = await getUserPosts(userId);
  for (const post of posts) {
    await tracker.trackPostDelete(adminId, post.id, 'User moderation');
    await deletePost(post.id);
  }

  // Ban user
  await tracker.trackUserBan(adminId, userId, 'Multiple violations');
  await banUser(userId);
}
```

### 4. Track Ad Creation

```typescript
const tracker = getActivityTracker();

async function createAdvertisement(adminId: string, adData: AdData) {
  const { result, error } = await tracker.trackWithTiming(
    {
      adminId,
      actionType: 'ad_create',
      targetType: 'ad',
      metadata: {
        ad_type: adData.type,
        position: adData.position,
        duration_days: adData.durationDays
      }
    },
    async () => {
      const ad = await supabase
        .from('advertisements')
        .insert(adData)
        .select()
        .single();

      return ad.data;
    }
  );

  if (error) {
    throw error;
  }

  return result;
}
```

### 5. Track System Settings Change

```typescript
const tracker = getActivityTracker();

async function updateSystemSetting(
  adminId: string,
  key: string,
  value: any
) {
  // Get current value
  const { data: current } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', key)
    .single();

  // Update setting
  await supabase
    .from('system_settings')
    .update({ value })
    .eq('key', key);

  // Track change
  await tracker.track({
    adminId,
    actionType: 'system_setting',
    targetType: 'system',
    targetId: key,
    metadata: {
      old_value: current?.value,
      new_value: value
    }
  });
}
```

## Querying Activity Data

### Get Recent Actions

```typescript
const tracker = getActivityTracker();

// Get last 50 actions
const recentActions = await tracker.getRecentActions(50);

console.log('Recent admin activities:', recentActions);
```

### Get Actions by Specific Admin

```typescript
const tracker = getActivityTracker();

// Get last 100 actions by specific admin
const adminActions = await tracker.getActionsByAdmin(adminId, 100);

console.log(`Admin ${adminId} performed ${adminActions.length} actions`);
```

### Get Statistics

```typescript
const tracker = getActivityTracker();

// Get statistics grouped by action type
const stats = await tracker.getStatistics({
  startDate: '2025-01-01',
  endDate: '2025-12-31',
  groupBy: 'action_type'
});

console.log('Total actions:', stats.totalActions);
console.log('By action type:', stats.byActionType);
console.log('Success rate:',
  (stats.byResult.success / stats.totalActions * 100).toFixed(2) + '%'
);
```

## Integration Examples

### API Route Integration

```typescript
// app/api/admin/users/[id]/ban/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/helpers';
import { getActivityTracker } from '@/lib/admin/activity-tracker';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  const { user } = authResult;

  const body = await request.json();
  const tracker = getActivityTracker();

  const { result, error } = await tracker.trackWithTiming(
    {
      adminId: user.id,
      actionType: 'user_ban',
      targetType: 'user',
      targetId: params.id,
      metadata: { reason: body.reason }
    },
    async () => {
      return await banUser(params.id);
    }
  );

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: result });
}
```

### Server Component Integration

```typescript
// app/admin/dashboard/page.tsx
import { getActivityTracker } from '@/lib/admin/activity-tracker';

export default async function AdminDashboard() {
  const tracker = getActivityTracker();

  // Get today's statistics
  const today = new Date().toISOString().split('T')[0];
  const stats = await tracker.getStatistics({
    startDate: today,
    endDate: today,
    groupBy: 'action_type'
  });

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <div>
        <h2>Today's Activity</h2>
        <p>Total Actions: {stats.totalActions}</p>
        <p>Success Rate: {
          (stats.byResult.success / stats.totalActions * 100).toFixed(1)
        }%</p>
        <ul>
          {stats.byActionType?.map(({ type, count }) => (
            <li key={type}>{type}: {count}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

### Middleware Integration

```typescript
// lib/middleware/admin-tracking.ts
import { NextRequest, NextResponse } from 'next/server';
import { getActivityTracker } from '@/lib/admin/activity-tracker';

export async function trackAdminLogin(
  request: NextRequest,
  adminId: string
) {
  const tracker = getActivityTracker();

  await tracker.track({
    adminId,
    actionType: 'admin_login',
    metadata: {
      ip: request.ip,
      userAgent: request.headers.get('user-agent')
    }
  });
}

export async function trackAdminLogout(adminId: string) {
  const tracker = getActivityTracker();

  await tracker.track({
    adminId,
    actionType: 'admin_logout'
  });
}
```

## Best Practices

### 1. Always Track Critical Actions

```typescript
// ❌ Bad: No tracking
async function deletePost(postId: string) {
  await supabase.from('posts').delete().eq('id', postId);
}

// ✅ Good: Tracking included
async function deletePost(adminId: string, postId: string, reason: string) {
  const tracker = getActivityTracker();

  await tracker.trackWithTiming(
    {
      adminId,
      actionType: 'post_delete',
      targetType: 'post',
      targetId: postId,
      metadata: { reason }
    },
    async () => {
      return await supabase.from('posts').delete().eq('id', postId);
    }
  );
}
```

### 2. Include Meaningful Metadata

```typescript
// ❌ Bad: Minimal metadata
await tracker.track({
  adminId,
  actionType: 'user_ban',
  targetId: userId
});

// ✅ Good: Rich metadata
await tracker.track({
  adminId,
  actionType: 'user_ban',
  targetType: 'user',
  targetId: userId,
  metadata: {
    reason: 'Multiple spam reports',
    duration_days: 7,
    report_count: 5,
    auto_generated: false
  }
});
```

### 3. Track Both Success and Failure

```typescript
try {
  await performAction();

  await tracker.track({
    adminId,
    actionType: 'user_edit',
    targetId: userId,
    result: 'success'
  });
} catch (error) {
  await tracker.track({
    adminId,
    actionType: 'user_edit',
    targetId: userId,
    result: 'failure',
    metadata: {
      error: error.message,
      stack: error.stack
    }
  });

  throw error;
}
```

### 4. Use Helper Methods When Available

```typescript
// ❌ Verbose
await tracker.track({
  adminId,
  actionType: 'user_ban',
  targetType: 'user',
  targetId: userId,
  metadata: { reason }
});

// ✅ Concise
await tracker.trackUserBan(adminId, userId, reason);
```

## Available Action Types

```typescript
enum AdminActionType {
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
```

## TypeScript Types

```typescript
interface TrackActionParams {
  adminId: string;
  actionType: AdminActionType | string;
  targetType?: string;
  targetId?: string;
  result?: 'success' | 'failure';
  durationMs?: number;
  metadata?: Record<string, any>;
}

interface AdminActionRecord {
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

interface StatsOptions {
  adminId?: string;
  startDate?: string;
  endDate?: string;
  groupBy: 'admin' | 'action_type' | 'date';
}
```

---

**Version:** 1.0.0
**Last Updated:** 2025-11-09
