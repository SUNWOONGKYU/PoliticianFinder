# Audit Logs API Documentation

**Task ID**: P4BA8
**Created**: 2025-11-09
**Version**: 1.0.0

## Overview

The Audit Logs API provides comprehensive tracking and querying of all administrative actions in the system. Every admin action is automatically logged with detailed context including user information, IP address, user agent, and custom details.

## Base URL

```
/api/admin/audit-logs
```

## Authentication

All endpoints require authentication with admin role (`admin` or `super_admin`).

### Required Headers

```
Authorization: Bearer <token>
Content-Type: application/json
```

---

## Endpoints

### 1. GET /api/admin/audit-logs

Retrieve audit logs with filtering, sorting, and pagination.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `adminId` | UUID | No | - | Filter by admin user ID |
| `actionType` | string | No | - | Filter by action type |
| `targetType` | string | No | - | Filter by target type (user, post, comment, etc.) |
| `startDate` | ISO 8601 | No | - | Filter logs from this date |
| `endDate` | ISO 8601 | No | - | Filter logs until this date |
| `page` | number | No | 1 | Page number (1-indexed) |
| `limit` | number | No | 20 | Items per page (max: 100) |
| `sortBy` | string | No | `created_at` | Sort field |
| `sortOrder` | `asc` \| `desc` | No | `desc` | Sort order |
| `format` | `json` \| `csv` | No | `json` | Response format |

#### Action Types

- `user_ban` - User banned
- `user_unban` - User unbanned
- `post_delete` - Post deleted
- `comment_delete` - Comment deleted
- `report_accept` - Report accepted
- `report_reject` - Report rejected
- `ad_create` - Advertisement created
- `policy_update` - Policy updated
- `system_setting` - System setting changed

#### Example Request (JSON)

```bash
GET /api/admin/audit-logs?actionType=user_ban&page=1&limit=20&sortOrder=desc
```

#### Example Response (JSON)

```json
{
  "success": true,
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "admin_id": "456e7890-e89b-12d3-a456-426614174001",
      "action_type": "user_ban",
      "target_type": "user",
      "target_id": "789e0123-e89b-12d3-a456-426614174002",
      "details": {
        "reason": "Spam and harassment"
      },
      "ip_address": "192.168.1.100",
      "user_agent": "Mozilla/5.0...",
      "created_at": "2025-11-09T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  },
  "timestamp": "2025-11-09T12:00:00Z"
}
```

#### Example Request (CSV Export)

```bash
GET /api/admin/audit-logs?format=csv&startDate=2025-01-01&endDate=2025-12-31
```

#### Example Response (CSV)

```
Content-Type: text/csv
Content-Disposition: attachment; filename="audit-logs-2025-11-09T12:00:00.000Z.csv"

ID,Admin ID,Action Type,Target Type,Target ID,Details,IP Address,User Agent,Created At
"123e4567-e89b-12d3-a456-426614174000","456e7890-e89b-12d3-a456-426614174001","user_ban","user","789e0123-e89b-12d3-a456-426614174002","{""reason"":""Spam""}","192.168.1.100","Mozilla/5.0...","2025-11-09T10:30:00Z"
```

#### Status Codes

- `200 OK` - Success
- `400 Bad Request` - Invalid query parameters
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not an admin
- `500 Internal Server Error` - Server error

---

### 2. POST /api/admin/audit-logs

Create a new audit log entry manually.

#### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `actionType` | string | Yes | Type of action performed |
| `targetType` | string | No | Type of target entity |
| `targetId` | UUID | No | ID of target entity |
| `details` | object | No | Additional details (JSON) |

#### Example Request

```bash
POST /api/admin/audit-logs
Content-Type: application/json

{
  "actionType": "user_ban",
  "targetType": "user",
  "targetId": "789e0123-e89b-12d3-a456-426614174002",
  "details": {
    "reason": "Spam and harassment",
    "duration": "permanent",
    "notified": true
  }
}
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "admin_id": "456e7890-e89b-12d3-a456-426614174001",
    "action_type": "user_ban",
    "target_type": "user",
    "target_id": "789e0123-e89b-12d3-a456-426614174002",
    "details": {
      "reason": "Spam and harassment",
      "duration": "permanent",
      "notified": true
    },
    "ip_address": "192.168.1.100",
    "user_agent": "Mozilla/5.0...",
    "created_at": "2025-11-09T10:30:00Z"
  }
}
```

#### Automatic Data Capture

The following fields are automatically captured:
- `admin_id` - From authenticated session
- `ip_address` - From request headers (`x-forwarded-for` or `x-real-ip`)
- `user_agent` - From request headers
- `created_at` - Current timestamp

#### Status Codes

- `201 Created` - Success
- `400 Bad Request` - Invalid request body
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not an admin
- `500 Internal Server Error` - Server error

---

## Usage Examples

### Using the AuditLogger Utility

The recommended way to log admin actions is using the `AuditLogger` utility class:

```typescript
import { getAuditLogger } from '@/lib/audit/logger';

// Get logger instance
const logger = getAuditLogger();

// Log user ban
await logger.logUserBan(
  adminId,
  userId,
  'Spam and harassment',
  ipAddress,
  userAgent
);

// Log post deletion
await logger.logPostDelete(
  adminId,
  postId,
  'Inappropriate content',
  ipAddress,
  userAgent
);

// Log system setting change
await logger.logSystemSetting(
  adminId,
  'max_upload_size',
  '5MB',
  '10MB',
  ipAddress,
  userAgent
);
```

### Using the Query Builder

For complex queries, use the `AuditLogQueryBuilder`:

```typescript
import { createClient } from '@/lib/supabase/server';
import { createAuditLogQueryBuilder } from '@/lib/audit/query-builder';

const supabase = createClient();

// Create query builder with filters
const queryBuilder = createAuditLogQueryBuilder(supabase, {
  adminId: 'admin-uuid',
  actionType: 'user_ban',
  startDate: '2025-01-01T00:00:00Z',
  endDate: '2025-12-31T23:59:59Z',
  page: 1,
  limit: 50,
  sortBy: 'created_at',
  sortOrder: 'desc'
});

// Execute query
const result = await queryBuilder.execute();

if (result) {
  console.log(`Total: ${result.total}`);
  console.log(`Pages: ${result.totalPages}`);
  console.log(`Data: ${result.data.length} records`);
}

// Export to CSV
const csv = await queryBuilder.exportToCSV();

// Get statistics
const stats = await queryBuilder.getStatistics();
```

### Quick Access Methods

```typescript
import { AuditLogQueryBuilder } from '@/lib/audit/query-builder';
import { createClient } from '@/lib/supabase/server';

const supabase = createClient();

// Get recent logs (last 50)
const recentLogs = await AuditLogQueryBuilder.getRecentLogs(supabase, 50);

// Get logs by specific admin
const adminLogs = await AuditLogQueryBuilder.getLogsByAdmin(
  supabase,
  'admin-uuid',
  100
);

// Get logs for specific target (e.g., all actions on a post)
const targetLogs = await AuditLogQueryBuilder.getLogsByTarget(
  supabase,
  'post',
  'post-uuid'
);
```

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {} // Optional additional details
  }
}
```

### Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `UNAUTHORIZED` | 401 | User not authenticated |
| `FORBIDDEN` | 403 | User lacks admin privileges |
| `VALIDATION_ERROR` | 400 | Invalid request parameters |
| `DATABASE_ERROR` | 500 | Database operation failed |
| `LOG_ERROR` | 500 | Failed to create log entry |
| `EXPORT_ERROR` | 500 | CSV export failed |
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server error |

---

## Database Schema

### audit_logs Table

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES profiles(id),
  action_type VARCHAR(50) NOT NULL,
  target_type VARCHAR(50),
  target_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Indexes

- `idx_audit_admin` - Admin ID lookup
- `idx_audit_action` - Action type filtering
- `idx_audit_created` - Date sorting (DESC)
- `idx_audit_target` - Target lookup
- `idx_audit_admin_created` - Admin + date composite
- `idx_audit_action_created` - Action + date composite

### Row Level Security (RLS)

- **SELECT**: Only admins can view logs
- **INSERT**: Only admins can create logs (must be their own admin_id)
- **UPDATE**: Disabled (logs are immutable)
- **DELETE**: Disabled (logs are immutable)

---

## Performance Considerations

### Pagination

- Default: 20 items per page
- Maximum: 100 items per page
- Large datasets should use pagination

### CSV Export

- Maximum: 10,000 records per export
- Use date range filters for large datasets
- Exports are synchronous (may timeout for large datasets)

### Indexing

All common query patterns are indexed:
- Admin ID lookups
- Action type filtering
- Date range queries
- Target lookups

### Recommended Practices

1. **Use date ranges** for queries over large time periods
2. **Filter by action type** when possible to reduce result sets
3. **Use pagination** for displaying logs in UI
4. **Export in batches** for large datasets (multiple date ranges)

---

## Rate Limiting

No specific rate limits are applied, but general API rate limits may apply.

Recommended limits:
- GET requests: 100/minute
- POST requests: 20/minute
- CSV exports: 5/minute

---

## Changelog

### Version 1.0.0 (2025-11-09)
- Initial release
- GET endpoint with filtering, sorting, pagination
- POST endpoint for manual log creation
- CSV export support
- AuditLogger utility class
- AuditLogQueryBuilder utility class

---

## Support

For issues or questions, contact the development team or create an issue in the project repository.

## Related Documentation

- [Authentication Guide](../auth/README.md)
- [Admin Panel Documentation](../admin/README.md)
- [Database Schema](../../../../lib/database.types.ts)
