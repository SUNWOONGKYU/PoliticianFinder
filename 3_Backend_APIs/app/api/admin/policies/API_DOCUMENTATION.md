# Policy Management API Documentation

**Task ID**: P4BA10
**Created**: 2025-11-09
**Version**: 1.0.0

## Overview

정책 관리 API는 이용약관, 개인정보처리방침 등 서비스 정책 문서를 관리하는 RESTful API입니다. 버전 관리, 변경 이력 추적, 현재 버전 관리 기능을 제공합니다.

## Base URL

```
Production: https://politician-finder.com/api
Development: http://localhost:3000/api
```

## Authentication

관리자 API (`/api/admin/*`)는 JWT 인증이 필요합니다.
사용자 API (`/api/policies/*`)는 인증이 필요하지 않습니다.

## Policy Types

| Type | Description | Korean Name |
|------|-------------|-------------|
| `terms` | Terms of Service | 이용약관 |
| `privacy` | Privacy Policy | 개인정보처리방침 |
| `marketing` | Marketing Consent | 마케팅 수신 동의 |
| `community` | Community Guidelines | 커뮤니티 가이드라인 |

---

## Admin Endpoints

### 1. Get All Policies

정책 목록을 조회합니다 (페이지네이션 지원).

**Endpoint**: `GET /api/admin/policies`

**Query Parameters**:
- `current` (boolean, optional): true일 경우 현재 버전만 조회
- `type` (string, optional): 특정 타입만 필터링
- `page` (number, optional): 페이지 번호 (기본값: 1)
- `limit` (number, optional): 페이지 크기 (기본값: 20)

**Example Requests**:
```bash
# 모든 정책 조회 (페이지네이션)
GET /api/admin/policies?page=1&limit=20

# 현재 버전만 조회
GET /api/admin/policies?current=true

# 특정 타입의 현재 버전 조회
GET /api/admin/policies?current=true&type=terms

# 특정 타입의 전체 히스토리 조회
GET /api/admin/policies?type=privacy
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "terms",
      "version": 2,
      "title": "이용약관",
      "content": "...",
      "is_current": true,
      "effective_date": "2025-11-09T00:00:00Z",
      "updated_by": "admin-uuid",
      "created_at": "2025-11-09T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  },
  "timestamp": "2025-11-09T10:00:00Z"
}
```

---

### 2. Create New Policy Version

새로운 정책 버전을 생성합니다.

**Endpoint**: `POST /api/admin/policies`

**Request Body**:
```json
{
  "type": "terms",
  "title": "이용약관",
  "content": "정책 내용...",
  "effective_date": "2025-11-09T00:00:00Z",
  "updated_by": "admin-uuid"
}
```

**Validation Rules**:
- `type`: Required, must be one of: `terms`, `privacy`, `marketing`, `community`
- `title`: Required, 1-200 characters
- `content`: Required, minimum 1 character
- `effective_date`: Required, ISO 8601 datetime format
- `updated_by`: Optional, UUID format

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "terms",
    "version": 3,
    "title": "이용약관",
    "content": "...",
    "is_current": true,
    "effective_date": "2025-11-09T00:00:00Z",
    "updated_by": "admin-uuid",
    "created_at": "2025-11-09T10:00:00Z"
  },
  "message": "새 정책 버전이 생성되었습니다 (v3)",
  "timestamp": "2025-11-09T10:00:00Z"
}
```

**Status Codes**:
- `201 Created`: 정책 생성 성공
- `400 Bad Request`: 유효하지 않은 요청
- `500 Internal Server Error`: 서버 오류

---

### 3. Get Policy by ID

특정 정책을 조회합니다.

**Endpoint**: `GET /api/admin/policies/{id}`

**Path Parameters**:
- `id` (string, required): Policy UUID

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "terms",
    "version": 2,
    "title": "이용약관",
    "content": "...",
    "is_current": true,
    "effective_date": "2025-11-09T00:00:00Z",
    "updated_by": "admin-uuid",
    "created_at": "2025-11-09T00:00:00Z"
  },
  "timestamp": "2025-11-09T10:00:00Z"
}
```

**Status Codes**:
- `200 OK`: 조회 성공
- `404 Not Found`: 정책을 찾을 수 없음
- `500 Internal Server Error`: 서버 오류

---

### 4. Update Policy

정책을 수정하거나 현재 버전으로 설정합니다.

**Endpoint**: `PATCH /api/admin/policies/{id}`

**Path Parameters**:
- `id` (string, required): Policy UUID

**Request Body (일반 수정)**:
```json
{
  "title": "새 제목",
  "content": "새 내용",
  "effective_date": "2025-12-01T00:00:00Z"
}
```

**Request Body (현재 버전 설정)**:
```json
{
  "set_current": true
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "terms",
    "version": 2,
    "title": "새 제목",
    "content": "새 내용",
    "is_current": true,
    "effective_date": "2025-12-01T00:00:00Z",
    "updated_by": "admin-uuid",
    "created_at": "2025-11-09T00:00:00Z",
    "updated_at": "2025-11-09T10:30:00Z"
  },
  "message": "정책이 업데이트되었습니다",
  "timestamp": "2025-11-09T10:30:00Z"
}
```

**Status Codes**:
- `200 OK`: 업데이트 성공
- `400 Bad Request`: 유효하지 않은 요청
- `404 Not Found`: 정책을 찾을 수 없음
- `500 Internal Server Error`: 서버 오류

---

### 5. Delete Policy

정책을 삭제합니다 (현재 활성 버전은 삭제 불가).

**Endpoint**: `DELETE /api/admin/policies/{id}`

**Path Parameters**:
- `id` (string, required): Policy UUID

**Response**:
```json
{
  "success": true,
  "message": "정책이 삭제되었습니다",
  "timestamp": "2025-11-09T10:00:00Z"
}
```

**Status Codes**:
- `200 OK`: 삭제 성공
- `403 Forbidden`: 현재 활성 정책은 삭제 불가
- `404 Not Found`: 정책을 찾을 수 없음
- `500 Internal Server Error`: 서버 오류

---

## Public Endpoints

### 6. Get Current Policy by Type

특정 타입의 현재 정책을 조회합니다 (사용자용).

**Endpoint**: `GET /api/policies/{type}`

**Path Parameters**:
- `type` (string, required): One of `terms`, `privacy`, `marketing`, `community`

**Query Parameters**:
- `version` (number, optional): 특정 버전 조회

**Example Requests**:
```bash
# 현재 이용약관 조회
GET /api/policies/terms

# 특정 버전의 개인정보처리방침 조회
GET /api/policies/privacy?version=1
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "terms",
    "type_name": "이용약관",
    "version": 2,
    "title": "이용약관",
    "content": "...",
    "is_current": true,
    "effective_date": "2025-11-09T00:00:00Z",
    "created_at": "2025-11-09T00:00:00Z"
  },
  "timestamp": "2025-11-09T10:00:00Z"
}
```

**Status Codes**:
- `200 OK`: 조회 성공
- `400 Bad Request`: 유효하지 않은 타입 또는 버전
- `404 Not Found`: 정책을 찾을 수 없음
- `500 Internal Server Error`: 서버 오류

---

## Error Responses

모든 에러는 다음 형식으로 반환됩니다:

```json
{
  "success": false,
  "error": "Error message",
  "details": {},
  "timestamp": "2025-11-09T10:00:00Z"
}
```

**Common Error Codes**:
- `400 Bad Request`: 유효하지 않은 요청 (validation error)
- `401 Unauthorized`: 인증 실패
- `403 Forbidden`: 권한 없음
- `404 Not Found`: 리소스를 찾을 수 없음
- `500 Internal Server Error`: 서버 내부 오류

---

## Version Management

### 버전 관리 규칙

1. **자동 버전 증가**: 새 정책 생성 시 자동으로 버전 번호가 증가합니다.
2. **단일 현재 버전**: 각 정책 타입당 하나의 현재 버전만 존재합니다.
3. **변경 이력 추적**: 모든 버전이 데이터베이스에 보관됩니다.
4. **현재 버전 보호**: 현재 활성 버전은 삭제할 수 없습니다.

### 버전 전환 흐름

1. 새 버전 생성 (`POST /api/admin/policies`)
2. 자동으로 새 버전이 현재 버전으로 설정됨
3. 이전 버전은 히스토리로 보관됨

또는

1. 기존 버전을 현재 버전으로 설정 (`PATCH /api/admin/policies/{id}` with `set_current: true`)

---

## Database Schema

```sql
CREATE TABLE policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL,
  version INTEGER NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  is_current BOOLEAN DEFAULT false,
  effective_date TIMESTAMPTZ NOT NULL,
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_policies_type ON policies(type);
CREATE INDEX idx_policies_current ON policies(type, is_current);
CREATE UNIQUE INDEX idx_policies_type_version ON policies(type, version);
```

---

## Usage Examples

### Example 1: Create and Publish Terms of Service

```typescript
// 1. Create new version
const response = await fetch('/api/admin/policies', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <token>'
  },
  body: JSON.stringify({
    type: 'terms',
    title: '이용약관 v2.0',
    content: '약관 내용...',
    effective_date: '2025-11-09T00:00:00Z',
    updated_by: 'admin-uuid'
  })
});

const data = await response.json();
console.log(`Created version ${data.data.version}`);
```

### Example 2: Get Current Policies for User

```typescript
// Get current terms of service
const response = await fetch('/api/policies/terms');
const data = await response.json();

console.log(data.data.title);
console.log(data.data.content);
```

### Example 3: View Policy History

```typescript
// Get all versions of privacy policy
const response = await fetch('/api/admin/policies?type=privacy', {
  headers: {
    'Authorization': 'Bearer <token>'
  }
});

const data = await response.json();
data.data.forEach(policy => {
  console.log(`Version ${policy.version}: ${policy.title}`);
});
```

---

## Rate Limiting

- Public API: 100 requests/minute per IP
- Admin API: 1000 requests/minute per user

---

## Changelog

**v1.0.0** (2025-11-09)
- Initial release
- CRUD operations for policies
- Version management
- Public API for current policies
- Change history tracking
