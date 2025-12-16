# Politician Verification API (P4BA18)

정치인 본인 인증 시스템 - 공직자가 자신의 프로필을 인증하고 "Verified" 배지를 획득합니다.

## Overview

이 API는 정치인이 공식 이메일 주소(*.go.kr, *.assembly.go.kr, *.korea.kr)를 통해 본인 인증을 할 수 있는 시스템입니다.

## API Endpoints

### 1. POST /api/politicians/verification/request
정치인 본인 인증 요청 - 공직 이메일로 인증 코드를 발송합니다.

**Request Body:**
```json
{
  "politician_id": "uuid-of-politician",
  "official_email": "name@assembly.go.kr",
  "documents": ["https://url-to-document.pdf"],  // optional
  "notes": "Additional verification notes"  // optional
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "인증 코드가 이메일로 발송되었습니다. 15분 내에 인증 코드를 입력해주세요.",
  "data": {
    "request_id": "uuid-of-request",
    "politician_id": "uuid-of-politician",
    "email": "name@assembly.go.kr",
    "expires_at": "2024-01-01T12:15:00Z",
    "status": "pending"
  }
}
```

**Validation Rules:**
- 사용자는 인증되어야 함
- 정치인 ID는 유효한 UUID여야 함
- 이메일은 공식 도메인(*.go.kr, *.assembly.go.kr, *.korea.kr)이어야 함
- 정치인이 이미 검증되지 않아야 함
- 처리 중인 검증 요청이 없어야 함

### 2. POST /api/politicians/verification/verify
인증 코드를 입력하여 정치인 검증을 완료합니다.

**Request Body:**
```json
{
  "request_id": "uuid-of-request",
  "verification_code": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "검증이 완료되었습니다. \"Verified\" 배지가 부여되었습니다.",
  "data": {
    "politician_id": "uuid-of-politician",
    "politician_name": "홍길동",
    "is_verified": true,
    "verified_at": "2024-01-01T12:05:00Z",
    "request_id": "uuid-of-request"
  }
}
```

**Validation Rules:**
- 사용자는 인증되어야 함
- 요청 ID는 유효하고 사용자가 소유해야 함
- 인증 코드는 6자리여야 함
- 인증 코드가 일치해야 함
- 인증 코드가 만료되지 않았어야 함 (15분 내)
- 요청이 이미 승인되거나 거부되지 않았어야 함

### 3. GET /api/politicians/verification/status/[politicianId]
정치인의 검증 상태 및 이력을 조회합니다.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "politician_id": "uuid-of-politician",
    "politician_name": "홍길동",
    "is_verified": true,
    "verified_at": "2024-01-01T12:05:00Z",
    "verified_by": {
      "id": "uuid-of-verifier",
      "name": "홍길동"
    },
    "verification_history": [
      {
        "id": "uuid-of-request",
        "verification_method": "email",
        "status": "approved",
        "created_at": "2024-01-01T12:00:00Z",
        "reviewed_at": "2024-01-01T12:05:00Z",
        "rejection_reason": null,
        "token_expires_at": "2024-01-01T12:15:00Z"
      }
    ]
  }
}
```

**Note:** `verification_history`는 인증된 사용자에게만 표시됩니다.

## Workflow

1. **인증 요청**
   - 사용자가 정치인 프로필에서 "본인 인증" 버튼 클릭
   - 공직 이메일 주소 입력
   - POST /api/politicians/verification/request 호출
   - 6자리 인증 코드가 이메일로 발송됨

2. **이메일 수신**
   - 정치인이 공식 이메일에서 인증 코드 확인
   - 15분 내에 코드 입력 필요

3. **인증 확인**
   - 사용자가 인증 코드 입력
   - POST /api/politicians/verification/verify 호출
   - 코드 일치 시 정치인 프로필에 "Verified" 배지 부여

4. **상태 확인**
   - GET /api/politicians/verification/status/[politicianId] 호출
   - 검증 상태 및 이력 확인

## Email Configuration

이메일 발송을 위해 다음 환경 변수를 설정해야 합니다:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

**Note:** SMTP 설정이 없으면 콘솔에 로그만 출력됩니다.

## Database Schema

### politician_verification Table
```sql
CREATE TABLE politician_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id UUID NOT NULL REFERENCES politicians(id),
  user_id UUID REFERENCES users(id),
  verification_method TEXT NOT NULL,
  verification_token TEXT,
  token_expires_at TIMESTAMPTZ,
  submitted_documents TEXT[],
  notes TEXT,
  status TEXT DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### politicians Table Updates
```sql
ALTER TABLE politicians
  ADD COLUMN is_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN verified_at TIMESTAMPTZ,
  ADD COLUMN verified_by UUID REFERENCES users(id);
```

## Security

- **Row Level Security (RLS)**: 사용자는 자신의 검증 요청만 조회/생성할 수 있습니다
- **이메일 검증**: 공식 도메인(*.go.kr, *.assembly.go.kr, *.korea.kr)만 허용
- **코드 만료**: 인증 코드는 15분 후 자동 만료
- **일회용 코드**: 한 번 사용된 코드는 재사용 불가
- **중복 방지**: 동일 정치인에 대한 중복 검증 요청 방지

## Error Codes

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Validation error | 입력 데이터 유효성 검증 실패 |
| 400 | Already verified | 이미 검증된 정치인 |
| 400 | Request exists | 처리 중인 검증 요청 존재 |
| 400 | Invalid code | 인증 코드 불일치 |
| 400 | Code expired | 인증 코드 만료 |
| 401 | Unauthorized | 로그인 필요 |
| 404 | Not found | 정치인 또는 요청을 찾을 수 없음 |
| 500 | Database error | 데이터베이스 오류 |
| 500 | Internal server error | 서버 오류 |

## Testing

### Manual Testing

1. **요청 생성 테스트**
```bash
curl -X POST http://localhost:3000/api/politicians/verification/request \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "politician_id": "uuid-here",
    "official_email": "test@assembly.go.kr"
  }'
```

2. **인증 코드 확인 테스트**
```bash
curl -X POST http://localhost:3000/api/politicians/verification/verify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "request_id": "uuid-here",
    "verification_code": "123456"
  }'
```

3. **상태 조회 테스트**
```bash
curl http://localhost:3000/api/politicians/verification/status/uuid-here
```

## Implementation Files

- `src/app/api/politicians/verification/request/route.ts` - 검증 요청 API
- `src/app/api/politicians/verification/verify/route.ts` - 검증 승인 API
- `src/app/api/politicians/verification/status/[politicianId]/route.ts` - 검증 상태 조회 API
- `src/lib/verification/email-sender.ts` - 이메일 발송 라이브러리
- `0-4_Database/Supabase/migrations/043_update_verification_system.sql` - DB 마이그레이션

## Future Enhancements

- [ ] SMS 인증 추가
- [ ] 관리자 수동 검증 기능
- [ ] 서류 업로드 지원
- [ ] 검증 만료 및 갱신 시스템
- [ ] 검증 요청 횟수 제한 (Rate Limiting)
- [ ] 이메일 템플릿 커스터마이징
