# Notification Settings API Documentation

## Overview
P4BA11 - 알림 설정 API

전역 알림 설정 및 알림 템플릿을 관리하는 API입니다.

## Base URL
```
/api/admin/notification-settings
```

## Authentication
All endpoints require admin authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Endpoints

### 1. GET /api/admin/notification-settings
전역 알림 설정 조회

#### Request
```http
GET /api/admin/notification-settings HTTP/1.1
Host: api.example.com
Authorization: Bearer <admin_token>
```

#### Response
**Success (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "00000000-0000-0000-0000-000000000001",
    "notifications_enabled": true,
    "batch_processing_enabled": false,
    "batch_interval_minutes": 15,
    "max_notifications_per_user": 50,
    "rate_limit_per_minute": 100,
    "email_notifications_enabled": true,
    "push_notifications_enabled": true,
    "updated_at": "2025-11-09T10:30:00Z",
    "updated_by": "user-uuid"
  },
  "timestamp": "2025-11-09T10:30:00Z"
}
```

**Error (401 Unauthorized)**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authorization header missing"
  },
  "timestamp": "2025-11-09T10:30:00Z"
}
```

**Error (403 Forbidden)**
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Admin access required"
  },
  "timestamp": "2025-11-09T10:30:00Z"
}
```

---

### 2. PATCH /api/admin/notification-settings
전역 알림 설정 수정

#### Request
```http
PATCH /api/admin/notification-settings HTTP/1.1
Host: api.example.com
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "notifications_enabled": false,
  "batch_interval_minutes": 30,
  "max_notifications_per_user": 100
}
```

#### Request Body Schema
```typescript
{
  notifications_enabled?: boolean;          // 알림 기능 전체 활성화/비활성화
  batch_processing_enabled?: boolean;       // 배치 처리 활성화 여부
  batch_interval_minutes?: number;          // 배치 처리 간격 (1-1440분)
  max_notifications_per_user?: number;      // 사용자당 최대 알림 수 (1-100)
  rate_limit_per_minute?: number;           // 분당 알림 발송 제한 (1-1000)
  email_notifications_enabled?: boolean;    // 이메일 알림 활성화
  push_notifications_enabled?: boolean;     // 푸시 알림 활성화
}
```

#### Response
**Success (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "00000000-0000-0000-0000-000000000001",
    "notifications_enabled": false,
    "batch_processing_enabled": false,
    "batch_interval_minutes": 30,
    "max_notifications_per_user": 100,
    "rate_limit_per_minute": 100,
    "email_notifications_enabled": true,
    "push_notifications_enabled": true,
    "updated_at": "2025-11-09T10:35:00Z",
    "updated_by": "admin-user-uuid"
  },
  "timestamp": "2025-11-09T10:35:00Z"
}
```

**Error (400 Bad Request)**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": "[{\"path\": [\"batch_interval_minutes\"], \"message\": \"Number must be greater than or equal to 1\"}]"
  },
  "timestamp": "2025-11-09T10:35:00Z"
}
```

---

## Field Descriptions

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | UUID | 설정 ID (고정값) | 항상 `00000000-0000-0000-0000-000000000001` |
| `notifications_enabled` | boolean | 알림 기능 전체 활성화/비활성화 | - |
| `batch_processing_enabled` | boolean | 배치 처리 활성화 여부 | - |
| `batch_interval_minutes` | number | 배치 처리 간격 (분) | 1-1440 |
| `max_notifications_per_user` | number | 사용자당 최대 알림 수 | 1-100 |
| `rate_limit_per_minute` | number | 분당 알림 발송 제한 | 1-1000 |
| `email_notifications_enabled` | boolean | 이메일 알림 활성화 | - |
| `push_notifications_enabled` | boolean | 푸시 알림 활성화 | - |
| `updated_at` | string | 마지막 수정 시간 (ISO 8601) | - |
| `updated_by` | string (UUID) | 마지막 수정자 사용자 ID | - |

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | 인증 토큰이 없거나 유효하지 않음 |
| `FORBIDDEN` | 403 | 관리자 권한이 필요함 |
| `VALIDATION_ERROR` | 400 | 요청 데이터 검증 실패 |
| `INTERNAL_ERROR` | 500 | 서버 내부 오류 |

---

## Usage Examples

### cURL Example
```bash
# 설정 조회
curl -X GET "https://api.example.com/api/admin/notification-settings" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# 설정 수정
curl -X PATCH "https://api.example.com/api/admin/notification-settings" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "notifications_enabled": true,
    "batch_interval_minutes": 20,
    "max_notifications_per_user": 75
  }'
```

### JavaScript Example
```javascript
// 설정 조회
const getSettings = async () => {
  const response = await fetch('/api/admin/notification-settings', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
    },
  });
  return await response.json();
};

// 설정 수정
const updateSettings = async (settings) => {
  const response = await fetch('/api/admin/notification-settings', {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(settings),
  });
  return await response.json();
};
```

---

## Notes
- 전역 설정은 단일 레코드로 관리됩니다 (ID: `00000000-0000-0000-0000-000000000001`)
- 모든 엔드포인트는 관리자 권한이 필요합니다
- `updated_at`은 자동으로 현재 시간으로 설정됩니다
- `updated_by`는 인증된 관리자의 사용자 ID로 자동 설정됩니다
