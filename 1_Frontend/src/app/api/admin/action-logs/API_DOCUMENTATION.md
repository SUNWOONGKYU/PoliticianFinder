# Admin Action Logs API Documentation

**Task ID:** P4BA13
**Generated:** 2025-11-09
**Version:** 1.0.0

## Overview

The Admin Action Logs API provides comprehensive tracking and analytics for all administrative activities in the system. It enables administrators to:

- Track all admin actions with detailed metadata
- Query historical action logs with flexible filters
- Generate statistics and analytics reports
- Monitor admin performance and activity patterns

## Base URL

```
/api/admin/action-logs
```

## Authentication

All endpoints require admin authentication. Include a valid session token in requests.

**Required Permissions:**
- `admin` role
- `super_admin` role

## Endpoints

### 1. Get Action Logs

Retrieve a paginated list of admin action logs with optional filtering.

**Endpoint:** `GET /api/admin/action-logs`

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `adminId` | UUID | No | - | Filter by specific admin |
| `actionType` | String | No | - | Filter by action type |
| `result` | Enum | No | - | Filter by result (`success`, `failure`) |
| `startDate` | ISO 8601 | No | - | Filter from this date |
| `endDate` | ISO 8601 | No | - | Filter until this date |
| `page` | Number | No | 1 | Page number |
| `limit` | Number | No | 20 | Items per page (1-100) |
| `sortBy` | String | No | `created_at` | Sort field |
| `sortOrder` | Enum | No | `desc` | Sort direction (`asc`, `desc`) |

**Example Request:**

```bash
GET /api/admin/action-logs?page=1&limit=20&actionType=user_ban&startDate=2025-01-01
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "admin_id": "660e8400-e29b-41d4-a716-446655440001",
      "action_type": "user_ban",
      "target_type": "user",
      "target_id": "770e8400-e29b-41d4-a716-446655440002",
      "result": "success",
      "duration_ms": 150,
      "metadata": {
        "reason": "Spam"
      },
      "created_at": "2025-11-09T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  },
  "timestamp": "2025-11-09T10:35:00Z"
}
```

**Error Responses:**

- `400 Bad Request` - Invalid query parameters
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not an admin
- `500 Internal Server Error` - Server error

---

### 2. Track Action

Record a new admin action.

**Endpoint:** `POST /api/admin/action-logs`

**Request Body:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `actionType` | String | Yes | - | Type of action performed |
| `targetType` | String | No | - | Type of target entity |
| `targetId` | UUID | No | - | ID of target entity |
| `result` | Enum | No | `success` | Action result (`success`, `failure`) |
| `durationMs` | Number | No | - | Action duration in milliseconds |
| `metadata` | Object | No | - | Additional action metadata |

**Example Request:**

```bash
POST /api/admin/action-logs
Content-Type: application/json

{
  "actionType": "user_ban",
  "targetType": "user",
  "targetId": "770e8400-e29b-41d4-a716-446655440002",
  "result": "success",
  "durationMs": 150,
  "metadata": {
    "reason": "Violation of terms",
    "duration_days": 7
  }
}
```

**Success Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "admin_id": "660e8400-e29b-41d4-a716-446655440001",
    "action_type": "user_ban",
    "target_type": "user",
    "target_id": "770e8400-e29b-41d4-a716-446655440002",
    "result": "success",
    "duration_ms": 150,
    "metadata": {
      "reason": "Violation of terms",
      "duration_days": 7
    },
    "created_at": "2025-11-09T10:30:00Z"
  }
}
```

**Error Responses:**

- `400 Bad Request` - Invalid request body
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not an admin
- `500 Internal Server Error` - Server error

---

### 3. Get Statistics

Retrieve aggregated statistics for admin actions.

**Endpoint:** `GET /api/admin/action-logs/stats`

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `adminId` | UUID | No | - | Filter by specific admin |
| `startDate` | ISO 8601 | No | - | Filter from this date |
| `endDate` | ISO 8601 | No | - | Filter until this date |
| `groupBy` | Enum | Yes | `action_type` | Group by (`admin`, `action_type`, `date`) |

**Example Request:**

```bash
GET /api/admin/action-logs/stats?groupBy=action_type&startDate=2025-01-01
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "totalActions": 1234,
    "byActionType": [
      {
        "type": "user_ban",
        "count": 500
      },
      {
        "type": "post_delete",
        "count": 400
      }
    ],
    "byResult": {
      "success": 1150,
      "failure": 84
    },
    "avgDuration": 180
  },
  "filters": {
    "startDate": "2025-01-01",
    "groupBy": "action_type"
  },
  "timestamp": "2025-11-09T10:35:00Z"
}
```

**Group By Admin Example:**

```json
{
  "success": true,
  "data": {
    "totalActions": 1234,
    "byAdmin": [
      {
        "adminId": "660e8400-e29b-41d4-a716-446655440001",
        "name": "John Doe",
        "count": 700
      },
      {
        "adminId": "660e8400-e29b-41d4-a716-446655440002",
        "name": "Jane Smith",
        "count": 534
      }
    ],
    "byResult": {
      "success": 1150,
      "failure": 84
    },
    "avgDuration": 180
  }
}
```

**Group By Date Example:**

```json
{
  "success": true,
  "data": {
    "totalActions": 1234,
    "byDate": [
      {
        "date": "2025-11-01",
        "count": 100
      },
      {
        "date": "2025-11-02",
        "count": 150
      }
    ],
    "byResult": {
      "success": 1150,
      "failure": 84
    },
    "avgDuration": 180
  }
}
```

---

### 4. Get Custom Statistics

Retrieve custom statistics with multiple filters.

**Endpoint:** `POST /api/admin/action-logs/stats`

**Request Body:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `adminIds` | UUID[] | No | - | Filter by multiple admins |
| `actionTypes` | String[] | No | - | Filter by multiple action types |
| `startDate` | ISO 8601 | No | - | Filter from this date |
| `endDate` | ISO 8601 | No | - | Filter until this date |
| `groupBy` | Enum | Yes | `action_type` | Group by (`admin`, `action_type`, `date`) |
| `includeFailures` | Boolean | No | `true` | Include failed actions |

**Example Request:**

```bash
POST /api/admin/action-logs/stats
Content-Type: application/json

{
  "adminIds": [
    "660e8400-e29b-41d4-a716-446655440001",
    "660e8400-e29b-41d4-a716-446655440002"
  ],
  "actionTypes": ["user_ban", "post_delete"],
  "startDate": "2025-01-01",
  "endDate": "2025-12-31",
  "groupBy": "action_type",
  "includeFailures": false
}
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "totalActions": 900,
    "byActionType": [
      {
        "type": "user_ban",
        "count": 500
      },
      {
        "type": "post_delete",
        "count": 400
      }
    ],
    "byResult": {
      "success": 900,
      "failure": 0
    },
    "avgDuration": 175
  },
  "filters": {
    "adminIds": [
      "660e8400-e29b-41d4-a716-446655440001",
      "660e8400-e29b-41d4-a716-446655440002"
    ],
    "actionTypes": ["user_ban", "post_delete"],
    "startDate": "2025-01-01",
    "endDate": "2025-12-31",
    "groupBy": "action_type",
    "includeFailures": false
  },
  "timestamp": "2025-11-09T10:35:00Z"
}
```

---

## Action Types

Common action types tracked by the system:

| Action Type | Description |
|-------------|-------------|
| `user_ban` | User was banned |
| `user_unban` | User ban was lifted |
| `user_edit` | User profile was edited |
| `post_delete` | Post was deleted |
| `post_restore` | Post was restored |
| `comment_delete` | Comment was deleted |
| `comment_restore` | Comment was restored |
| `report_accept` | Report was accepted |
| `report_reject` | Report was rejected |
| `ad_create` | Advertisement was created |
| `ad_update` | Advertisement was updated |
| `ad_delete` | Advertisement was deleted |
| `policy_update` | Policy was updated |
| `system_setting` | System setting was changed |
| `admin_login` | Admin logged in |
| `admin_logout` | Admin logged out |

---

## Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Request validation failed |
| `UNAUTHORIZED` | Authentication required |
| `FORBIDDEN` | Admin permissions required |
| `DATABASE_ERROR` | Database operation failed |
| `TRACKING_ERROR` | Action tracking failed |
| `INTERNAL_SERVER_ERROR` | Unexpected server error |

---

## Usage Examples

### Track a User Ban

```typescript
const response = await fetch('/api/admin/action-logs', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    actionType: 'user_ban',
    targetType: 'user',
    targetId: userId,
    metadata: {
      reason: 'Spam',
      duration_days: 7
    }
  })
});
```

### Get Today's Actions

```typescript
const today = new Date().toISOString().split('T')[0];
const response = await fetch(
  `/api/admin/action-logs?startDate=${today}&endDate=${today}`
);
const data = await response.json();
```

### Get Admin Performance Stats

```typescript
const response = await fetch(
  '/api/admin/action-logs/stats?groupBy=admin&startDate=2025-01-01'
);
const stats = await response.json();
```

### Generate Weekly Report

```typescript
const response = await fetch('/api/admin/action-logs/stats', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    startDate: '2025-11-01',
    endDate: '2025-11-07',
    groupBy: 'date',
    includeFailures: true
  })
});
```

---

## Performance Considerations

- All queries use indexed fields for optimal performance
- Pagination is enforced (max 100 items per page)
- Statistics queries are optimized with composite indexes
- Consider caching frequently accessed statistics

## Database Schema

```sql
CREATE TABLE admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  result TEXT CHECK (result IN ('success', 'failure')),
  duration_ms INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX idx_admin_actions_action_type ON admin_actions(action_type);
CREATE INDEX idx_admin_actions_created_at ON admin_actions(created_at DESC);
CREATE INDEX idx_admin_actions_admin_type ON admin_actions(admin_id, action_type, created_at DESC);
```

---

## Related APIs

- `/api/admin/audit-logs` - Detailed audit trail (P4BA8)
- `/api/admin/users` - User management
- `/api/admin/reports` - Report management

---

**Version:** 1.0.0
**Last Updated:** 2025-11-09
**Maintained by:** Development Team
