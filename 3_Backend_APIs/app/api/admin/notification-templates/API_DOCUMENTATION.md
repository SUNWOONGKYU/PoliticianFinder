# Notification Templates API Documentation

## Overview
P4BA11 - 알림 템플릿 API

알림 타입별 메시지 템플릿을 관리하는 API입니다.

## Base URL
```
/api/admin/notification-templates
```

## Authentication
All endpoints require admin authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Endpoints

### 1. GET /api/admin/notification-templates
전체 템플릿 목록 조회

#### Request
```http
GET /api/admin/notification-templates HTTP/1.1
Host: api.example.com
Authorization: Bearer <admin_token>
```

#### Response
**Success (200 OK)**
```json
{
  "success": true,
  "data": {
    "templates": [
      {
        "id": "uuid-1",
        "type": "comment",
        "title_template": "{작성자}님이 댓글을 남겼습니다",
        "body_template": "{작성자}님이 회원님의 게시글에 댓글을 남겼습니다: \"{댓글내용}\"",
        "is_enabled": true,
        "created_at": "2025-11-09T10:00:00Z",
        "updated_at": "2025-11-09T10:00:00Z"
      },
      {
        "id": "uuid-2",
        "type": "like",
        "title_template": "{작성자}님이 공감했습니다",
        "body_template": "{작성자}님이 회원님의 게시글을 공감했습니다.",
        "is_enabled": true,
        "created_at": "2025-11-09T10:00:00Z",
        "updated_at": "2025-11-09T10:00:00Z"
      }
    ],
    "total": 2
  },
  "timestamp": "2025-11-09T10:30:00Z"
}
```

---

### 2. GET /api/admin/notification-templates?type={type}
특정 타입 템플릿 조회

#### Request
```http
GET /api/admin/notification-templates?type=comment HTTP/1.1
Host: api.example.com
Authorization: Bearer <admin_token>
```

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | string | Yes | 템플릿 타입 (comment, like, follow, mention, reply, system) |

#### Response
**Success (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "uuid-1",
    "type": "comment",
    "title_template": "{작성자}님이 댓글을 남겼습니다",
    "body_template": "{작성자}님이 회원님의 게시글에 댓글을 남겼습니다: \"{댓글내용}\"",
    "is_enabled": true,
    "created_at": "2025-11-09T10:00:00Z",
    "updated_at": "2025-11-09T10:00:00Z"
  },
  "timestamp": "2025-11-09T10:30:00Z"
}
```

**Error (404 Not Found)**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Template not found for type: invalid_type"
  },
  "timestamp": "2025-11-09T10:30:00Z"
}
```

---

### 3. PATCH /api/admin/notification-templates
템플릿 수정

#### Request
```http
PATCH /api/admin/notification-templates HTTP/1.1
Host: api.example.com
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "type": "comment",
  "title_template": "{작성자}님의 새 댓글",
  "body_template": "{작성자}님이 댓글을 남겼습니다: \"{댓글내용}\"",
  "is_enabled": true
}
```

#### Request Body Schema
```typescript
{
  type: 'comment' | 'like' | 'follow' | 'mention' | 'reply' | 'system';  // 필수
  title_template?: string;   // 제목 템플릿 (1-200자)
  body_template?: string;    // 본문 템플릿 (1-500자)
  is_enabled?: boolean;      // 템플릿 활성화 여부
}
```

#### Response
**Success (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "uuid-1",
    "type": "comment",
    "title_template": "{작성자}님의 새 댓글",
    "body_template": "{작성자}님이 댓글을 남겼습니다: \"{댓글내용}\"",
    "is_enabled": true,
    "created_at": "2025-11-09T10:00:00Z",
    "updated_at": "2025-11-09T10:35:00Z"
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
    "details": "[{\"path\": [\"title_template\"], \"message\": \"String must contain at least 1 character(s)\"}]"
  },
  "timestamp": "2025-11-09T10:35:00Z"
}
```

**Error (404 Not Found)**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Template not found for type: invalid_type"
  },
  "timestamp": "2025-11-09T10:35:00Z"
}
```

---

## Template Types

| Type | Description | Default Title | Default Body |
|------|-------------|---------------|--------------|
| `comment` | 댓글 알림 | {작성자}님이 댓글을 남겼습니다 | {작성자}님이 회원님의 게시글에 댓글을 남겼습니다: "{댓글내용}" |
| `like` | 공감 알림 | {작성자}님이 공감했습니다 | {작성자}님이 회원님의 게시글을 공감했습니다. |
| `follow` | 팔로우 알림 | {작성자}님이 팔로우했습니다 | {작성자}님이 회원님을 팔로우했습니다. |
| `mention` | 멘션 알림 | {작성자}님이 회원님을 언급했습니다 | {작성자}님이 게시글에서 회원님을 언급했습니다. |
| `reply` | 답글 알림 | {작성자}님이 답글을 남겼습니다 | {작성자}님이 회원님의 댓글에 답글을 남겼습니다: "{댓글내용}" |
| `system` | 시스템 알림 | 시스템 알림 | {메시지} |

---

## Template Variables

템플릿에서 사용 가능한 변수 (중괄호로 감싸서 사용):

| Variable | Description | Example |
|----------|-------------|---------|
| `{작성자}` | 알림을 발생시킨 사용자 이름 | 홍길동 |
| `{댓글내용}` | 댓글 내용 (첫 50자) | 좋은 글 감사합니다! |
| `{게시글제목}` | 게시글 제목 | 정치인 검색 서비스 소개 |
| `{사용자이름}` | 대상 사용자 이름 | 김철수 |
| `{팔로워이름}` | 팔로워 이름 | 이영희 |
| `{메시지}` | 시스템 메시지 | 새로운 업데이트가 있습니다 |

### Variable Substitution Example
```
Template: "{작성자}님이 댓글을 남겼습니다: \"{댓글내용}\""
Variables: { 작성자: "홍길동", 댓글내용: "좋은 글입니다!" }
Result: "홍길동님이 댓글을 남겼습니다: \"좋은 글입니다!\""
```

---

## Field Descriptions

| Field | Type | Description | Constraints |
|-------|------|-------------|-------------|
| `id` | UUID | 템플릿 고유 ID | 자동 생성 |
| `type` | string | 알림 타입 | comment, like, follow, mention, reply, system |
| `title_template` | string | 제목 템플릿 | 1-200자 |
| `body_template` | string | 본문 템플릿 | 1-500자 |
| `is_enabled` | boolean | 템플릿 활성화 여부 | - |
| `created_at` | string | 생성 시간 (ISO 8601) | 자동 생성 |
| `updated_at` | string | 수정 시간 (ISO 8601) | 자동 업데이트 |

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | 인증 토큰이 없거나 유효하지 않음 |
| `FORBIDDEN` | 403 | 관리자 권한이 필요함 |
| `NOT_FOUND` | 404 | 템플릿을 찾을 수 없음 |
| `VALIDATION_ERROR` | 400 | 요청 데이터 검증 실패 |
| `INTERNAL_ERROR` | 500 | 서버 내부 오류 |

---

## Usage Examples

### cURL Examples
```bash
# 전체 템플릿 목록 조회
curl -X GET "https://api.example.com/api/admin/notification-templates" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# 특정 타입 템플릿 조회
curl -X GET "https://api.example.com/api/admin/notification-templates?type=comment" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# 템플릿 수정
curl -X PATCH "https://api.example.com/api/admin/notification-templates" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "comment",
    "title_template": "{작성자}님의 새 댓글",
    "is_enabled": true
  }'
```

### JavaScript Examples
```javascript
// 전체 템플릿 목록 조회
const getAllTemplates = async () => {
  const response = await fetch('/api/admin/notification-templates', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
    },
  });
  return await response.json();
};

// 특정 타입 템플릿 조회
const getTemplate = async (type) => {
  const response = await fetch(
    `/api/admin/notification-templates?type=${type}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      },
    }
  );
  return await response.json();
};

// 템플릿 수정
const updateTemplate = async (templateData) => {
  const response = await fetch('/api/admin/notification-templates', {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(templateData),
  });
  return await response.json();
};
```

---

## Template Engine Usage

템플릿 엔진을 사용하여 변수를 치환할 수 있습니다:

```typescript
import { TemplateEngine } from '@/lib/notifications/template-engine';

const engine = TemplateEngine.getInstance();

// 기본 렌더링
const result = engine.render(
  '{작성자}님이 댓글을 남겼습니다',
  { 작성자: '홍길동' }
);
// 결과: "홍길동님이 댓글을 남겼습니다"

// 옵션과 함께 렌더링
const result = engine.render(
  '{댓글내용}',
  { 댓글내용: 'A'.repeat(100) },
  { truncateLength: 50 }
);
// 결과: "AAA...AAA..." (50자 + "...")
```

---

## Notes
- 각 템플릿 타입은 고유하며 중복될 수 없습니다
- 템플릿 변수는 중괄호 `{}`로 감싸서 사용합니다
- 템플릿을 비활성화(`is_enabled: false`)해도 삭제되지 않습니다
- `updated_at`은 자동으로 현재 시간으로 업데이트됩니다
- HTML은 자동으로 이스케이프되어 XSS 공격을 방지합니다
