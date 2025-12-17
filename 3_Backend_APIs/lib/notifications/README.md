# Notification System

## Overview
P4BA11 - 알림 시스템 API

전역 알림 설정, 템플릿 관리, 템플릿 엔진을 포함한 알림 시스템입니다.

---

## Architecture

```
lib/notifications/
├── template-engine.ts           # 템플릿 변수 치환 엔진
├── template-engine.test.ts      # 템플릿 엔진 단위 테스트
├── database-schema.sql          # 데이터베이스 스키마
└── README.md                    # 이 문서

app/api/admin/
├── notification-settings/
│   ├── route.ts                 # 전역 알림 설정 API
│   └── API_DOCUMENTATION.md     # API 문서
└── notification-templates/
    ├── route.ts                 # 알림 템플릿 API
    └── API_DOCUMENTATION.md     # API 문서
```

---

## Features

### 1. Global Notification Settings
- 알림 기능 전체 활성화/비활성화
- 배치 처리 설정 (활성화, 간격)
- 사용자당 최대 알림 수 제한
- 분당 알림 발송 속도 제한
- 이메일/푸시 알림 개별 제어

### 2. Notification Templates
- 타입별 알림 템플릿 관리 (comment, like, follow, mention, reply, system)
- 템플릿 변수 치환 (예: `{작성자}`, `{댓글내용}`)
- 템플릿 활성화/비활성화
- 템플릿 검증 및 프리뷰

### 3. Template Engine
- 변수 치환 및 렌더링
- HTML 이스케이프 (XSS 방지)
- 문자열 자르기 (truncation)
- 템플릿 검증 및 변수 추출
- 헬퍼 함수 제공

---

## Database Schema

### notification_settings
전역 알림 설정 (단일 레코드)

```sql
CREATE TABLE notification_settings (
  id UUID PRIMARY KEY,                     -- 고정: 00000000-0000-0000-0000-000000000001
  notifications_enabled BOOLEAN,           -- 알림 전체 활성화
  batch_processing_enabled BOOLEAN,        -- 배치 처리 활성화
  batch_interval_minutes INTEGER,          -- 배치 간격 (1-1440분)
  max_notifications_per_user INTEGER,      -- 사용자당 최대 알림 (1-100)
  rate_limit_per_minute INTEGER,           -- 분당 발송 제한 (1-1000)
  email_notifications_enabled BOOLEAN,     -- 이메일 알림
  push_notifications_enabled BOOLEAN,      -- 푸시 알림
  updated_at TIMESTAMPTZ,
  updated_by UUID
);
```

### notification_templates
알림 템플릿

```sql
CREATE TABLE notification_templates (
  id UUID PRIMARY KEY,
  type VARCHAR(50) UNIQUE,                 -- comment, like, follow, mention, reply, system
  title_template TEXT,                     -- 제목 템플릿
  body_template TEXT,                      -- 본문 템플릿
  is_enabled BOOLEAN,                      -- 활성화 여부
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

---

## API Endpoints

### Notification Settings
```
GET    /api/admin/notification-settings      # 전역 설정 조회
PATCH  /api/admin/notification-settings      # 전역 설정 수정
```

### Notification Templates
```
GET    /api/admin/notification-templates                # 전체 템플릿 목록
GET    /api/admin/notification-templates?type={type}    # 특정 템플릿 조회
PATCH  /api/admin/notification-templates                # 템플릿 수정
```

자세한 API 문서는 각 API 폴더의 `API_DOCUMENTATION.md` 참조

---

## Template Engine Usage

### Basic Usage

```typescript
import { TemplateEngine } from '@/lib/notifications/template-engine';

const engine = TemplateEngine.getInstance();

// 변수 치환
const result = engine.render(
  '{작성자}님이 댓글을 남겼습니다',
  { 작성자: '홍길동' }
);
// 결과: "홍길동님이 댓글을 남겼습니다"
```

### With Options

```typescript
// 문자열 자르기
const result = engine.render(
  '{댓글내용}',
  { 댓글내용: 'Very long comment content...' },
  { truncateLength: 50 }
);

// HTML 이스케이프 비활성화
const result = engine.render(
  '{내용}',
  { 내용: '<b>Bold</b>' },
  { escapeHtml: false }
);

// Fallback 값 설정
const result = engine.render(
  '{존재하지않는변수}',
  {},
  { fallbackValue: '[알 수 없음]' }
);
```

### Template Validation

```typescript
// 템플릿 검증
const validation = engine.validate('{작성자}님이 {행동}했습니다');
console.log(validation.valid);       // true
console.log(validation.variables);   // ['작성자', '행동']
console.log(validation.errors);      // []

// 변수 추출
const variables = engine.extractVariables('{작성자}님의 {행동}');
// 결과: ['작성자', '행동']

// 변수 검증
const check = engine.validateVariables(
  '{작성자}님이 댓글을 남겼습니다',
  { 작성자: '홍길동' }
);
console.log(check.valid);            // true
console.log(check.missingVariables); // []
```

### Helper Functions

```typescript
import {
  renderCommentNotification,
  renderLikeNotification,
  renderFollowNotification,
  renderMentionNotification,
  renderCustomNotification,
} from '@/lib/notifications/template-engine';

// 댓글 알림
const comment = renderCommentNotification('홍길동', '좋은 글입니다!');
// { title: '홍길동님이 댓글을 남겼습니다', body: '...' }

// 공감 알림
const like = renderLikeNotification('김철수');
// { title: '김철수님이 공감했습니다', body: '...' }

// 팔로우 알림
const follow = renderFollowNotification('이영희');
// { title: '이영희님이 팔로우했습니다', body: '...' }

// 멘션 알림
const mention = renderMentionNotification('박지성', '정치인 검색 서비스');
// { title: '박지성님이 회원님을 언급했습니다', body: '...' }

// 커스텀 알림
const custom = renderCustomNotification(
  '{사용자}님께 알림',
  '{사용자}님, {메시지}',
  { 사용자: '홍길동', 메시지: '새 업데이트가 있습니다' }
);
// { title: '홍길동님께 알림', body: '홍길동님, 새 업데이트가 있습니다' }
```

### Preview

```typescript
// 샘플 데이터로 프리뷰 생성
const preview = engine.preview('{작성자}님이 {행동}했습니다');
// 결과: "홍길동님이 댓글을 남겼습니다했습니다" (샘플 데이터 사용)
```

---

## Template Variables

템플릿에서 사용 가능한 변수:

| Variable | Description | Example |
|----------|-------------|---------|
| `{작성자}` | 알림을 발생시킨 사용자 | 홍길동 |
| `{댓글내용}` | 댓글 내용 | 좋은 글 감사합니다! |
| `{게시글제목}` | 게시글 제목 | 정치인 검색 서비스 소개 |
| `{사용자이름}` | 대상 사용자 | 김철수 |
| `{팔로워이름}` | 팔로워 이름 | 이영희 |
| `{대상사용자}` | 대상 사용자 | 박지성 |
| `{메시지}` | 시스템 메시지 | 새 업데이트가 있습니다 |

---

## Security

### XSS Prevention
템플릿 엔진은 기본적으로 모든 변수를 HTML 이스케이프합니다:

```typescript
const result = engine.render(
  '{댓글내용}',
  { 댓글내용: '<script>alert("XSS")</script>' }
);
// 결과: "&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;"
```

### Rate Limiting
전역 설정에서 알림 발송 속도를 제한할 수 있습니다:
- `rate_limit_per_minute`: 분당 발송 제한 (1-1000)
- `max_notifications_per_user`: 사용자당 최대 알림 수 (1-100)

---

## Testing

단위 테스트 실행:

```bash
npm test lib/notifications/template-engine.test.ts
```

테스트 커버리지:
- 변수 치환
- 옵션 처리 (truncation, escapeHtml, fallback)
- 템플릿 검증
- 변수 추출
- 헬퍼 함수
- 보안 (XSS 방지)
- 싱글톤 패턴

---

## Configuration

### Initial Settings (database-schema.sql)

```sql
INSERT INTO notification_settings VALUES (
  '00000000-0000-0000-0000-000000000001',
  true,   -- notifications_enabled
  false,  -- batch_processing_enabled
  15,     -- batch_interval_minutes
  50,     -- max_notifications_per_user
  100,    -- rate_limit_per_minute
  true,   -- email_notifications_enabled
  true    -- push_notifications_enabled
);
```

### Environment Variables

필요한 환경 변수:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Best Practices

1. **템플릿 변수 이름**: 명확하고 일관성 있는 변수명 사용
2. **문자열 길이**: 긴 내용은 `truncateLength` 옵션으로 제한
3. **보안**: HTML 이스케이프는 항상 활성화 (기본값)
4. **검증**: 템플릿 수정 전 `validate()` 메서드로 검증
5. **프리뷰**: 템플릿 수정 후 `preview()` 메서드로 확인

---

## Error Handling

### API Errors
모든 API는 표준 에러 형식을 반환합니다:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": "Additional details (optional)"
  },
  "timestamp": "2025-11-09T10:30:00Z"
}
```

### Template Engine Errors
템플릿 엔진은 검증 결과 객체를 반환합니다:

```typescript
{
  valid: false,
  variables: [],
  errors: ['Error message 1', 'Error message 2']
}
```

---

## Future Enhancements

- [ ] 다국어 지원 (i18n)
- [ ] 실시간 알림 (WebSocket)
- [ ] 알림 통계 및 분석
- [ ] 사용자별 알림 설정
- [ ] 알림 그룹화 (batching)
- [ ] 알림 우선순위
- [ ] 알림 스케줄링

---

## Related Documentation

- [Notification Settings API](../../app/api/admin/notification-settings/API_DOCUMENTATION.md)
- [Notification Templates API](../../app/api/admin/notification-templates/API_DOCUMENTATION.md)
- [Backend Infrastructure Core](../../2_Backend_Infrastructure/core.ts)
- [Error Handling](../../2_Backend_Infrastructure/error-handling.ts)

---

## Support

문제가 발생하면 다음을 확인하세요:
1. 데이터베이스 스키마가 올바르게 적용되었는지
2. 환경 변수가 설정되었는지
3. 관리자 권한이 있는지
4. 템플릿 변수가 올바르게 사용되었는지

---

**작업 ID**: P4BA11
**작업일**: 2025-11-09
**버전**: 1.0.0
