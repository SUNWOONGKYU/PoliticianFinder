# Audit Log System Integration Guide

**Task ID**: P4BA8
**Created**: 2025-11-09

## Overview

This guide shows how to integrate the audit logging system into your admin actions throughout the application.

## Quick Start

### 1. Import the Logger

```typescript
import { getAuditLogger } from '@/lib/audit/logger';
```

### 2. Log an Action

```typescript
const logger = getAuditLogger();

await logger.logUserBan(
  adminId,      // Admin performing the action
  userId,       // User being banned
  reason,       // Reason for ban
  ipAddress,    // Optional: request IP
  userAgent     // Optional: request user agent
);
```

---

## Integration Patterns

### Pattern 1: API Route Integration

When creating admin API routes, integrate logging at the end of successful operations:

```typescript
// app/api/admin/users/[id]/ban/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/helpers';
import { getAuditLogger } from '@/lib/audit/logger';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // 1. Authenticate and check admin role
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  // 2. Parse request
  const { reason } = await request.json();
  const userId = params.id;

  // 3. Perform the action
  const supabase = createClient();
  const { error } = await supabase
    .from('users')
    .update({ is_banned: true })
    .eq('id', userId);

  if (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }

  // 4. LOG THE ACTION
  const logger = getAuditLogger();
  const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  await logger.logUserBan(user.id, userId, reason, ipAddress, userAgent);

  // 5. Return success
  return NextResponse.json({ success: true });
}
```

### Pattern 2: Server Action Integration

For Next.js Server Actions:

```typescript
// app/actions/admin.ts
'use server'

import { getAuditLogger } from '@/lib/audit/logger';
import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

export async function deletePost(postId: string, reason: string) {
  const supabase = createClient();

  // Get current admin user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  // Delete the post
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId);

  if (error) throw error;

  // Log the action
  const logger = getAuditLogger();
  const headersList = headers();
  const ipAddress = headersList.get('x-forwarded-for') || 'unknown';
  const userAgent = headersList.get('user-agent') || 'unknown';

  await logger.logPostDelete(user.id, postId, reason, ipAddress, userAgent);

  return { success: true };
}
```

### Pattern 3: Middleware Integration

Create a middleware wrapper for automatic logging:

```typescript
// lib/audit/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuditLogger, AuditActionType } from '@/lib/audit/logger';

export function withAuditLog(
  handler: (req: NextRequest) => Promise<NextResponse>,
  actionType: AuditActionType,
  targetType?: string
) {
  return async (req: NextRequest) => {
    // Execute handler
    const response = await handler(req);

    // If successful, log the action
    if (response.ok) {
      const logger = getAuditLogger();
      const user = await getCurrentUser(req); // Your auth function

      if (user) {
        const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
        const userAgent = req.headers.get('user-agent') || 'unknown';

        await logger.log({
          adminId: user.id,
          actionType,
          targetType,
          ipAddress,
          userAgent,
        });
      }
    }

    return response;
  };
}

// Usage
export const POST = withAuditLog(
  async (req) => {
    // Your handler logic
    return NextResponse.json({ success: true });
  },
  AuditActionType.SYSTEM_SETTING,
  'system'
);
```

---

## Common Use Cases

### User Management

```typescript
// Ban user
await logger.logUserBan(adminId, userId, 'Spam', ip, ua);

// Unban user
await logger.logUserUnban(adminId, userId, ip, ua);
```

### Content Moderation

```typescript
// Delete post
await logger.logPostDelete(adminId, postId, 'Inappropriate content', ip, ua);

// Delete comment
await logger.logCommentDelete(adminId, commentId, 'Spam', ip, ua);
```

### Report Handling

```typescript
// Accept report
await logger.logReportAccept(
  adminId,
  reportId,
  'Banned user and deleted content',
  ip,
  ua
);

// Reject report
await logger.logReportReject(
  adminId,
  reportId,
  'Not a violation',
  ip,
  ua
);
```

### System Configuration

```typescript
// Policy update
await logger.logPolicyUpdate(
  adminId,
  'terms_of_service',
  { version: '2.0', changes: ['Added section 4.5'] },
  ip,
  ua
);

// System setting
await logger.logSystemSetting(
  adminId,
  'max_upload_size',
  '5MB',
  '10MB',
  ip,
  ua
);
```

### Advertisement Management

```typescript
// Create ad
await logger.logAdCreate(
  adminId,
  adId,
  {
    title: 'Spring Campaign',
    budget: 5000,
    duration: '30 days',
  },
  ip,
  ua
);
```

---

## Querying Audit Logs

### Basic Query

```typescript
import { createClient } from '@/lib/supabase/server';
import { createAuditLogQueryBuilder } from '@/lib/audit/query-builder';

const supabase = createClient();
const queryBuilder = createAuditLogQueryBuilder(supabase, {
  page: 1,
  limit: 20,
});

const result = await queryBuilder.execute();
```

### Filtered Query

```typescript
const queryBuilder = createAuditLogQueryBuilder(supabase, {
  adminId: 'admin-uuid',
  actionType: 'user_ban',
  startDate: '2025-01-01T00:00:00Z',
  endDate: '2025-12-31T23:59:59Z',
  page: 1,
  limit: 50,
});

const result = await queryBuilder.execute();
```

### Export to CSV

```typescript
const queryBuilder = createAuditLogQueryBuilder(supabase, {
  startDate: '2025-01-01T00:00:00Z',
  endDate: '2025-12-31T23:59:59Z',
});

const csv = await queryBuilder.exportToCSV();

// Send as download
return new Response(csv, {
  headers: {
    'Content-Type': 'text/csv',
    'Content-Disposition': 'attachment; filename="audit-logs.csv"',
  },
});
```

### Get Statistics

```typescript
const queryBuilder = createAuditLogQueryBuilder(supabase, {
  startDate: '2025-01-01T00:00:00Z',
  endDate: '2025-01-31T23:59:59Z',
});

const stats = await queryBuilder.getStatistics();
// { user_ban: 45, post_delete: 23, ... }
```

---

## Admin Dashboard Integration

### Recent Activity Widget

```typescript
// components/admin/RecentActivity.tsx
import { AuditLogQueryBuilder } from '@/lib/audit/query-builder';
import { createClient } from '@/lib/supabase/server';

export async function RecentActivity() {
  const supabase = createClient();
  const recentLogs = await AuditLogQueryBuilder.getRecentLogs(supabase, 10);

  return (
    <div className="recent-activity">
      <h3>Recent Admin Actions</h3>
      <ul>
        {recentLogs.map(log => (
          <li key={log.id}>
            <span>{log.action_type}</span>
            <span>{new Date(log.created_at).toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Admin Activity Log

```typescript
// components/admin/AdminActivityLog.tsx
import { AuditLogQueryBuilder } from '@/lib/audit/query-builder';
import { createClient } from '@/lib/supabase/server';

export async function AdminActivityLog({ adminId }: { adminId: string }) {
  const supabase = createClient();
  const logs = await AuditLogQueryBuilder.getLogsByAdmin(supabase, adminId, 50);

  return (
    <div className="admin-activity">
      <h3>My Recent Actions</h3>
      <table>
        <thead>
          <tr>
            <th>Action</th>
            <th>Target</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {logs.map(log => (
            <tr key={log.id}>
              <td>{log.action_type}</td>
              <td>{log.target_type}: {log.target_id}</td>
              <td>{new Date(log.created_at).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Content History

```typescript
// Show all admin actions on a specific post
const supabase = createClient();
const logs = await AuditLogQueryBuilder.getLogsByTarget(
  supabase,
  'post',
  postId
);

// Display: who deleted it, who edited it, etc.
```

---

## Best Practices

### 1. Always Log Admin Actions

Every admin action that modifies data should be logged:

```typescript
// ✅ GOOD
await supabase.from('users').update({ is_banned: true }).eq('id', userId);
await logger.logUserBan(adminId, userId, reason, ip, ua);

// ❌ BAD
await supabase.from('users').update({ is_banned: true }).eq('id', userId);
// Missing audit log!
```

### 2. Provide Meaningful Details

```typescript
// ✅ GOOD - Detailed context
await logger.logUserBan(adminId, userId, 'Spam: Posted 50 promotional links in 1 hour', ip, ua);

// ❌ BAD - No context
await logger.logUserBan(adminId, userId, 'Banned', ip, ua);
```

### 3. Include IP and User Agent

```typescript
// ✅ GOOD
const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
const userAgent = request.headers.get('user-agent') || 'unknown';
await logger.logUserBan(adminId, userId, reason, ipAddress, userAgent);

// ⚠️ OK but less useful
await logger.logUserBan(adminId, userId, reason);
```

### 4. Use Specific Action Types

```typescript
// ✅ GOOD - Use enum or specific strings
await logger.log({
  adminId,
  actionType: AuditActionType.USER_BAN,
  targetType: 'user',
  targetId: userId,
});

// ❌ BAD - Generic action type
await logger.log({
  adminId,
  actionType: 'action',
  targetType: 'thing',
});
```

### 5. Handle Logging Errors Gracefully

```typescript
// ✅ GOOD - Log errors but don't fail the operation
try {
  await logger.logUserBan(adminId, userId, reason, ip, ua);
} catch (error) {
  console.error('Failed to create audit log:', error);
  // Continue - the ban still succeeded
}

// ❌ BAD - Failing operation if logging fails
await logger.logUserBan(adminId, userId, reason, ip, ua); // Throws on error
```

### 6. Use Query Builder for Complex Queries

```typescript
// ✅ GOOD - Use query builder for filtering
const queryBuilder = createAuditLogQueryBuilder(supabase, {
  adminId: adminId,
  actionType: 'user_ban',
  startDate: startDate,
  endDate: endDate,
});
const result = await queryBuilder.execute();

// ❌ BAD - Manual Supabase queries
const { data } = await supabase
  .from('audit_logs')
  .select('*')
  .eq('admin_id', adminId)
  .eq('action_type', 'user_ban')
  // ... manual filtering
```

---

## Testing

### Unit Tests

```typescript
import { getAuditLogger } from '@/lib/audit/logger';

describe('Audit Logging', () => {
  it('should log user ban', async () => {
    const logger = getAuditLogger();
    const result = await logger.logUserBan(
      'admin-id',
      'user-id',
      'Test reason'
    );

    expect(result).toBeDefined();
    expect(result?.action_type).toBe('user_ban');
  });
});
```

### Integration Tests

```typescript
import { createAuditLogQueryBuilder } from '@/lib/audit/query-builder';

describe('Audit Log Queries', () => {
  it('should retrieve logs with filters', async () => {
    const queryBuilder = createAuditLogQueryBuilder(supabase, {
      actionType: 'user_ban',
      page: 1,
      limit: 10,
    });

    const result = await queryBuilder.execute();

    expect(result).toBeDefined();
    expect(result?.data).toBeInstanceOf(Array);
  });
});
```

---

## Performance Optimization

### 1. Batch Logging

For bulk operations:

```typescript
// Instead of logging each action individually
for (const user of users) {
  await logger.logUserBan(adminId, user.id, reason);
}

// Consider bulk insert (requires custom implementation)
const logs = users.map(user => ({
  admin_id: adminId,
  action_type: 'user_ban',
  target_type: 'user',
  target_id: user.id,
  details: { reason },
}));

await supabase.from('audit_logs').insert(logs);
```

### 2. Async Logging

Don't wait for logging to complete:

```typescript
// Fire and forget (for non-critical logs)
logger.logUserBan(adminId, userId, reason, ip, ua).catch(console.error);

// Return response immediately
return NextResponse.json({ success: true });
```

### 3. Use Indexes

The migration file creates indexes for common queries. Use them:

```typescript
// ✅ FAST - Uses idx_audit_admin
await queryBuilder.execute({ adminId: 'admin-id' });

// ✅ FAST - Uses idx_audit_action_created
await queryBuilder.execute({
  actionType: 'user_ban',
  sortBy: 'created_at'
});
```

---

## Troubleshooting

### Issue: Logs not appearing

**Check**:
1. Admin role is set correctly in profiles table
2. RLS policies are enabled
3. Supabase connection is working

### Issue: Permission denied

**Check**:
1. User has admin or super_admin role
2. RLS policies allow the operation
3. admin_id matches authenticated user

### Issue: Slow queries

**Solutions**:
1. Use date range filters
2. Reduce page size
3. Add more specific filters
4. Check database indexes

---

## Security Considerations

1. **RLS Policies**: Audit logs are protected by RLS
2. **Immutability**: Logs cannot be updated or deleted
3. **Admin Only**: Only admins can read/write logs
4. **IP Tracking**: All actions are tracked with IP
5. **User Agent**: Browser/client information is logged

---

## Future Enhancements

Potential improvements:

1. **Real-time notifications** for critical actions
2. **Automated alerts** for suspicious patterns
3. **Data retention policies** with automatic archiving
4. **Advanced analytics** dashboard
5. **Export to external services** (S3, logging platforms)

---

## Support

For questions or issues:
- Check the API documentation
- Review test files for examples
- Contact the development team
