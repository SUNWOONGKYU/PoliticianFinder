# Audit Log System - Quick Reference

**Task ID**: P4BA8 | **Quick Access Guide**

---

## 🚀 Quick Start (30 seconds)

```typescript
// 1. Import
import { getAuditLogger } from '@/lib/audit/logger';

// 2. Log an action
const logger = getAuditLogger();
await logger.logUserBan(adminId, userId, reason);

// 3. Done! ✅
```

---

## 📦 Common Imports

```typescript
// Logging
import { getAuditLogger, AuditActionType } from '@/lib/audit/logger';

// Querying
import { createAuditLogQueryBuilder, AuditLogQueryBuilder } from '@/lib/audit/query-builder';

// Supabase
import { createClient } from '@/lib/supabase/server';
```

---

## ✍️ Logging Actions

### User Management
```typescript
const logger = getAuditLogger();

// Ban user
await logger.logUserBan(adminId, userId, reason, ip, ua);

// Unban user
await logger.logUserUnban(adminId, userId, ip, ua);
```

### Content Moderation
```typescript
// Delete post
await logger.logPostDelete(adminId, postId, reason, ip, ua);

// Delete comment
await logger.logCommentDelete(adminId, commentId, reason, ip, ua);
```

### Reports
```typescript
// Accept report
await logger.logReportAccept(adminId, reportId, action, ip, ua);

// Reject report
await logger.logReportReject(adminId, reportId, reason, ip, ua);
```

### System
```typescript
// Policy update
await logger.logPolicyUpdate(adminId, policyType, changes, ip, ua);

// System setting
await logger.logSystemSetting(adminId, key, oldVal, newVal, ip, ua);

// Ad creation
await logger.logAdCreate(adminId, adId, details, ip, ua);
```

### Custom Action
```typescript
await logger.log({
  adminId: 'uuid',
  actionType: 'custom_action',
  targetType: 'type',
  targetId: 'uuid',
  details: { key: 'value' },
  ipAddress: 'ip',
  userAgent: 'ua',
});
```

---

## 🔍 Querying Logs

### Recent Logs (Quick)
```typescript
const supabase = createClient();

// Last 50 logs
const logs = await AuditLogQueryBuilder.getRecentLogs(supabase, 50);
```

### By Admin
```typescript
// Last 100 logs for specific admin
const logs = await AuditLogQueryBuilder.getLogsByAdmin(supabase, adminId, 100);
```

### By Target
```typescript
// All actions on a specific post
const logs = await AuditLogQueryBuilder.getLogsByTarget(supabase, 'post', postId);
```

### Filtered Query
```typescript
const queryBuilder = createAuditLogQueryBuilder(supabase, {
  adminId: 'uuid',           // Filter by admin
  actionType: 'user_ban',    // Filter by action
  targetType: 'user',        // Filter by target type
  startDate: '2025-01-01',   // Date range start
  endDate: '2025-12-31',     // Date range end
  page: 1,                   // Page number
  limit: 20,                 // Items per page
  sortBy: 'created_at',      // Sort field
  sortOrder: 'desc',         // asc or desc
});

const result = await queryBuilder.execute();
// { data: [...], total, page, limit, totalPages }
```

### Export CSV
```typescript
const queryBuilder = createAuditLogQueryBuilder(supabase, {
  startDate: '2025-01-01',
  endDate: '2025-12-31',
});

const csv = await queryBuilder.exportToCSV();
```

### Statistics
```typescript
const stats = await queryBuilder.getStatistics();
// { user_ban: 45, post_delete: 23, ... }
```

---

## 🌐 API Endpoints

### GET Logs
```bash
GET /api/admin/audit-logs?actionType=user_ban&page=1&limit=20
```

**Query Params**:
- `adminId` - UUID
- `actionType` - user_ban, post_delete, etc.
- `targetType` - user, post, comment, etc.
- `startDate` - ISO 8601
- `endDate` - ISO 8601
- `page` - Number (default: 1)
- `limit` - Number (default: 20, max: 100)
- `sortBy` - Field name (default: created_at)
- `sortOrder` - asc/desc (default: desc)
- `format` - json/csv (default: json)

### POST Log
```bash
POST /api/admin/audit-logs
Content-Type: application/json

{
  "actionType": "user_ban",
  "targetType": "user",
  "targetId": "uuid",
  "details": { "reason": "Spam" }
}
```

### Export CSV
```bash
GET /api/admin/audit-logs?format=csv&startDate=2025-01-01&endDate=2025-12-31
```

---

## 🔐 Security

### Required
- ✅ Authentication (JWT/session)
- ✅ Admin role (`admin` or `super_admin`)

### Auto-captured
- ✅ `admin_id` from session
- ✅ `ip_address` from headers
- ✅ `user_agent` from headers
- ✅ `created_at` timestamp

### Protection
- ✅ RLS policies (admin-only)
- ✅ Logs are immutable
- ✅ Cannot update or delete

---

## 📊 Action Types

| Type | Description |
|------|-------------|
| `user_ban` | User banned |
| `user_unban` | User unbanned |
| `post_delete` | Post deleted |
| `comment_delete` | Comment deleted |
| `report_accept` | Report accepted |
| `report_reject` | Report rejected |
| `ad_create` | Ad created |
| `policy_update` | Policy updated |
| `system_setting` | Setting changed |

---

## 🎯 Common Patterns

### API Route Integration
```typescript
export async function POST(request: NextRequest) {
  // 1. Perform action
  await supabase.from('users').update({ is_banned: true }).eq('id', userId);

  // 2. Log it
  const logger = getAuditLogger();
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const ua = request.headers.get('user-agent') || 'unknown';
  await logger.logUserBan(adminId, userId, reason, ip, ua);

  // 3. Return
  return NextResponse.json({ success: true });
}
```

### Extract IP & User Agent
```typescript
const ipAddress = request.headers.get('x-forwarded-for') ||
                  request.headers.get('x-real-ip') ||
                  'unknown';
const userAgent = request.headers.get('user-agent') || 'unknown';
```

### Dashboard Widget
```typescript
const recentLogs = await AuditLogQueryBuilder.getRecentLogs(supabase, 10);

return (
  <ul>
    {recentLogs.map(log => (
      <li key={log.id}>
        {log.action_type} - {new Date(log.created_at).toLocaleString()}
      </li>
    ))}
  </ul>
);
```

---

## ⚡ Performance Tips

1. **Use date ranges** for large datasets
2. **Filter by action type** when possible
3. **Paginate** instead of loading all
4. **Use indexes** (already created)
5. **Export in batches** for large CSVs

---

## 🐛 Troubleshooting

### Permission Denied
```sql
-- Check user role
SELECT role FROM profiles WHERE id = 'user-id';
-- Should be 'admin' or 'super_admin'
```

### Logs Not Appearing
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'audit_logs';
```

### Slow Queries
```sql
-- Check indexes
SELECT * FROM pg_indexes WHERE tablename = 'audit_logs';
```

---

## 📖 Full Documentation

- **API Docs**: `src/app/api/admin/audit-logs/API_DOCUMENTATION.md`
- **Integration Guide**: `src/lib/audit/INTEGRATION_GUIDE.md`
- **README**: `src/lib/audit/README.md`
- **Examples**: `src/lib/audit/example.ts`
- **Tests**: `src/app/api/admin/audit-logs/__tests__/audit-logs.test.ts`

---

## 🚨 Error Codes

| Code | Status | Meaning |
|------|--------|---------|
| `UNAUTHORIZED` | 401 | Not logged in |
| `FORBIDDEN` | 403 | Not an admin |
| `VALIDATION_ERROR` | 400 | Invalid input |
| `DATABASE_ERROR` | 500 | DB error |
| `INTERNAL_SERVER_ERROR` | 500 | Server error |

---

## ✅ Checklist

Before logging:
- [ ] User is authenticated
- [ ] User has admin role
- [ ] Action is complete
- [ ] Have reason/details

After logging:
- [ ] Check log created
- [ ] Verify details correct
- [ ] Test querying

---

**Quick Help**: Check `example.ts` for 18 usage examples!
