# System Settings API Documentation

**Task ID**: P4BA12
**Created**: 2025-11-09
**Version**: 1.0.0

## Overview

시스템 설정 API는 전역 시스템 설정을 관리합니다. 포인트 규칙, 등급 기준, 기능 토글, 유지보수 모드 등을 제어할 수 있습니다.

## Base URLs

- **Admin API**: `/api/admin/system-settings`
- **Public API**: `/api/system-settings/public`

---

## Admin Endpoints

### 1. GET /api/admin/system-settings

전체 시스템 설정 또는 특정 카테고리/키의 설정을 조회합니다.

#### Query Parameters

| Parameter | Type   | Required | Description                                      |
|-----------|--------|----------|--------------------------------------------------|
| category  | string | No       | 특정 카테고리 (points, ranks, features, maintenance, limits) |
| key       | string | No       | 특정 설정 키 (예: 'points.post')                 |

#### Response Examples

**전체 설정 조회**
```json
{
  "success": true,
  "data": [
    {
      "key": "points.post",
      "value": 10,
      "description": "게시글 작성 시 포인트",
      "updated_at": "2025-11-09T00:00:00Z"
    },
    {
      "key": "features.community",
      "value": true,
      "description": "커뮤니티 기능 활성화",
      "updated_at": "2025-11-09T00:00:00Z"
    }
  ],
  "total": 15,
  "timestamp": "2025-11-09T10:30:00Z"
}
```

**카테고리별 조회 (points)**
```json
{
  "success": true,
  "category": "points",
  "data": {
    "post": 10,
    "comment": 5,
    "like": 1,
    "follow": 20,
    "share": 3,
    "report": 5,
    "verification": 100
  },
  "timestamp": "2025-11-09T10:30:00Z"
}
```

**특정 키 조회**
```json
{
  "success": true,
  "data": {
    "key": "points.post",
    "value": 10
  },
  "timestamp": "2025-11-09T10:30:00Z"
}
```

#### Status Codes

- `200 OK`: 성공
- `404 Not Found`: 설정 키를 찾을 수 없음
- `500 Internal Server Error`: 서버 오류

---

### 2. PATCH /api/admin/system-settings

시스템 설정을 수정합니다 (단일 또는 일괄).

#### Request Body (단일 설정)

```json
{
  "key": "points.post",
  "value": 15
}
```

#### Request Body (일괄 업데이트)

```json
{
  "settings": [
    { "key": "points.post", "value": 15 },
    { "key": "points.comment", "value": 7 },
    { "key": "features.community", "value": true }
  ]
}
```

#### Response Examples

**단일 설정 업데이트**
```json
{
  "success": true,
  "data": {
    "key": "points.post",
    "value": 15,
    "description": "게시글 작성 시 포인트",
    "updated_at": "2025-11-09T10:35:00Z"
  },
  "message": "설정이 업데이트되었습니다",
  "timestamp": "2025-11-09T10:35:00Z"
}
```

**일괄 업데이트**
```json
{
  "success": true,
  "data": {
    "updated": 3
  },
  "message": "3개의 설정이 업데이트되었습니다",
  "timestamp": "2025-11-09T10:35:00Z"
}
```

#### Error Response

```json
{
  "success": false,
  "error": "유효하지 않은 설정 키입니다",
  "key": "invalid.key",
  "validPrefixes": ["points.*", "ranks.*", "features.*", "maintenance.*", "limits.*"],
  "timestamp": "2025-11-09T10:35:00Z"
}
```

#### Status Codes

- `200 OK`: 성공
- `400 Bad Request`: 유효하지 않은 요청
- `500 Internal Server Error`: 서버 오류

---

### 3. DELETE /api/admin/system-settings/cache

설정 캐시를 무효화합니다.

#### Query Parameters

| Parameter | Type   | Required | Description                       |
|-----------|--------|----------|-----------------------------------|
| key       | string | No       | 특정 키의 캐시만 삭제             |
| pattern   | string | No       | 패턴과 일치하는 캐시 삭제 (예: 'points.*') |

#### Response Example

```json
{
  "success": true,
  "message": "전체 캐시가 삭제되었습니다",
  "timestamp": "2025-11-09T10:40:00Z"
}
```

#### Status Codes

- `200 OK`: 성공
- `500 Internal Server Error`: 서버 오류

---

## Public Endpoints

### GET /api/system-settings/public

일반 사용자가 접근 가능한 공개 설정을 조회합니다.

#### Query Parameters

| Parameter | Type   | Required | Description                                   |
|-----------|--------|----------|-----------------------------------------------|
| check     | string | No       | 특정 항목만 확인 (maintenance, features, limits) |

#### Response Example

**전체 공개 설정**
```json
{
  "success": true,
  "data": {
    "maintenance": {
      "enabled": false,
      "message": "서비스 점검 중입니다",
      "start_time": null,
      "end_time": null
    },
    "features": {
      "community": true,
      "ai_evaluation": true,
      "notifications": true,
      "advertisements": false,
      "politician_verification": true
    },
    "limits": {
      "max_upload_size_mb": 10,
      "max_post_length": 5000,
      "max_comment_length": 1000,
      "max_daily_posts": 50,
      "max_daily_comments": 100
    }
  },
  "timestamp": "2025-11-09T10:30:00Z"
}
```

**유지보수 모드만 확인**
```json
{
  "success": true,
  "data": {
    "maintenance": {
      "enabled": true,
      "message": "서비스 점검 중입니다. 11월 10일 오전 2시에 재개됩니다.",
      "start_time": "2025-11-10T00:00:00Z",
      "end_time": "2025-11-10T02:00:00Z"
    }
  },
  "timestamp": "2025-11-09T10:30:00Z"
}
```

#### Status Codes

- `200 OK`: 성공
- `500 Internal Server Error`: 서버 오류

---

## Setting Categories

### 1. Points (포인트)

활동별 포인트 점수 설정

| Key                  | Type   | Default | Description       |
|----------------------|--------|---------|-------------------|
| points.post          | number | 10      | 게시글 작성       |
| points.comment       | number | 5       | 댓글 작성         |
| points.like          | number | 1       | 공감 클릭       |
| points.follow        | number | 20      | 팔로우            |
| points.share         | number | 3       | 공유              |
| points.report        | number | 5       | 신고              |
| points.verification  | number | 100     | 본인 인증         |

### 2. Ranks (등급)

등급별 필요 포인트

| Key          | Type   | Default | Description       |
|--------------|--------|---------|-------------------|
| ranks.bronze | number | 0       | 브론즈 등급       |
| ranks.silver | number | 100     | 실버 등급         |
| ranks.gold   | number | 500     | 골드 등급         |
| ranks.platinum | number | 2000  | 플래티넘 등급     |
| ranks.diamond | number | 10000  | 다이아몬드 등급   |

### 3. Features (기능 토글)

서비스 기능 on/off

| Key                                | Type    | Default | Description          |
|------------------------------------|---------|---------|----------------------|
| features.community                 | boolean | true    | 커뮤니티 기능        |
| features.ai_evaluation             | boolean | true    | AI 평가 기능         |
| features.notifications             | boolean | true    | 알림 기능            |
| features.advertisements            | boolean | false   | 광고 기능            |
| features.politician_verification   | boolean | true    | 정치인 본인인증 기능 |

### 4. Maintenance (유지보수)

서비스 점검 모드

| Key                   | Type    | Default              | Description       |
|-----------------------|---------|----------------------|-------------------|
| maintenance.enabled   | boolean | false                | 유지보수 모드     |
| maintenance.message   | string  | "서비스 점검 중입니다" | 점검 메시지       |
| maintenance.start_time | string | null                 | 점검 시작 시간    |
| maintenance.end_time  | string  | null                 | 점검 종료 시간    |

### 5. Limits (제한)

각종 제한 설정

| Key                        | Type   | Default | Description              |
|----------------------------|--------|---------|--------------------------|
| limits.max_upload_size_mb  | number | 10      | 최대 업로드 크기 (MB)    |
| limits.max_post_length     | number | 5000    | 최대 게시글 길이         |
| limits.max_comment_length  | number | 1000    | 최대 댓글 길이           |
| limits.max_daily_posts     | number | 50      | 일일 최대 게시글 수      |
| limits.max_daily_comments  | number | 100     | 일일 최대 댓글 수        |

---

## Usage Examples

### 포인트 규칙 변경

```typescript
// 게시글 작성 포인트를 10 → 15로 변경
const response = await fetch('/api/admin/system-settings', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    key: 'points.post',
    value: 15
  })
});
```

### 여러 설정 일괄 변경

```typescript
const response = await fetch('/api/admin/system-settings', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    settings: [
      { key: 'points.post', value: 15 },
      { key: 'points.comment', value: 7 },
      { key: 'points.like', value: 2 }
    ]
  })
});
```

### 유지보수 모드 활성화

```typescript
const response = await fetch('/api/admin/system-settings', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    settings: [
      { key: 'maintenance.enabled', value: true },
      { key: 'maintenance.message', value: '서비스 업데이트 중입니다. 잠시 후 재개됩니다.' }
    ]
  })
});
```

### 기능 비활성화

```typescript
// 커뮤니티 기능 임시 비활성화
const response = await fetch('/api/admin/system-settings', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    key: 'features.community',
    value: false
  })
});
```

### 공개 설정 조회 (클라이언트)

```typescript
// 유지보수 모드 확인
const response = await fetch('/api/system-settings/public?check=maintenance');
const { data } = await response.json();

if (data.maintenance.enabled) {
  alert(data.maintenance.message);
}
```

---

## Cache Management

설정은 자동으로 캐싱되며 TTL은 5분입니다. 설정 변경 시 캐시가 자동으로 무효화됩니다.

수동 캐시 무효화:
```bash
# 전체 캐시 삭제
DELETE /api/admin/system-settings/cache

# 특정 키 캐시 삭제
DELETE /api/admin/system-settings/cache?key=points.post
```

---

## Error Handling

모든 에러는 일관된 형식으로 반환됩니다:

```json
{
  "success": false,
  "error": "에러 메시지",
  "timestamp": "2025-11-09T10:30:00Z"
}
```

### Common Error Codes

- `400`: 잘못된 요청 (유효하지 않은 키, 값 등)
- `404`: 리소스를 찾을 수 없음
- `500`: 서버 내부 오류

---

## Security

- **Admin API**: 관리자 권한 필요 (인증 미들웨어 적용 권장)
- **Public API**: 인증 불필요 (읽기 전용)

## Dependencies

- `@supabase/supabase-js`: Supabase 클라이언트
- `zod`: 요청 검증
- `next`: Next.js API Routes

## Related Files

- `lib/system/settings-manager.ts`: 설정 관리 유틸리티
- `lib/system/cache-manager.ts`: 캐시 관리 유틸리티
- `app/api/admin/system-settings/route.ts`: 관리자 API
- `app/api/system-settings/public/route.ts`: 공개 API
