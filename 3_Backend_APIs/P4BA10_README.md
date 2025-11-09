# P4BA10 - 정책 관리 API

**Task ID**: P4BA10
**Phase**: Phase 4
**Area**: Backend APIs (BA)
**Created**: 2025-11-09
**Status**: 완료

## 작업 개요

이용약관, 개인정보처리방침 등 서비스 정책을 관리하는 RESTful API를 구현했습니다. 버전 관리, 변경 이력 추적, 현재 버전 관리 기능을 제공합니다.

## 생성된 파일

### 1. 핵심 파일

```
3_Backend_APIs/
├── lib/
│   └── policies/
│       ├── version-manager.ts          # 정책 버전 관리 로직
│       └── types.ts                    # TypeScript 타입 정의
├── app/
│   └── api/
│       ├── admin/
│       │   └── policies/
│       │       ├── route.ts            # 관리자 정책 목록/생성 API
│       │       ├── [id]/
│       │       │   └── route.ts        # 개별 정책 관리 API
│       │       ├── __tests__/
│       │       │   └── policies.test.ts # 단위 테스트
│       │       └── API_DOCUMENTATION.md # API 문서
│       └── policies/
│           └── [type]/
│               └── route.ts            # 사용자용 정책 조회 API
└── P4BA10_README.md                    # 이 파일
```

### 2. 파일 설명

#### `lib/policies/version-manager.ts`
- **PolicyVersionManager** 클래스: 정책 버전 관리 로직
- 주요 기능:
  - 현재 정책 조회
  - 특정 버전 조회
  - 정책 히스토리 조회
  - 새 버전 생성
  - 정책 업데이트/삭제
  - 현재 버전 설정
- 유틸리티 함수:
  - `isValidPolicyType()`: 정책 타입 검증
  - `getPolicyTypeName()`: 한글 이름 변환

#### `lib/policies/types.ts`
- TypeScript 타입 정의
- API 요청/응답 인터페이스
- 정책 엔티티 타입

#### `app/api/admin/policies/route.ts`
- **GET**: 정책 목록 조회 (페이지네이션, 필터링)
- **POST**: 새 정책 버전 생성
- 쿼리 파라미터: `current`, `type`, `page`, `limit`

#### `app/api/admin/policies/[id]/route.ts`
- **GET**: 특정 정책 조회
- **PATCH**: 정책 수정 또는 현재 버전 설정
- **DELETE**: 정책 삭제 (현재 버전 보호)

#### `app/api/policies/[type]/route.ts`
- **GET**: 사용자용 현재 정책 조회
- 쿼리 파라미터: `version` (선택적)
- 인증 불필요

## 정책 종류

| Type | Description | Korean Name |
|------|-------------|-------------|
| `terms` | Terms of Service | 이용약관 |
| `privacy` | Privacy Policy | 개인정보처리방침 |
| `marketing` | Marketing Consent | 마케팅 수신 동의 |
| `community` | Community Guidelines | 커뮤니티 가이드라인 |

## API 엔드포인트

### 관리자 API

1. **GET /api/admin/policies**
   - 정책 목록 조회
   - 페이지네이션 지원
   - 현재 버전 필터링
   - 타입별 필터링

2. **POST /api/admin/policies**
   - 새 정책 버전 생성
   - 자동 버전 증가
   - 자동 현재 버전 설정

3. **GET /api/admin/policies/[id]**
   - 특정 정책 조회

4. **PATCH /api/admin/policies/[id]**
   - 정책 수정
   - 현재 버전 설정

5. **DELETE /api/admin/policies/[id]**
   - 정책 삭제 (현재 버전 보호)

### 사용자 API

6. **GET /api/policies/[type]**
   - 현재 정책 조회
   - 특정 버전 조회 (선택적)
   - 인증 불필요

## 버전 관리 규칙

1. **자동 버전 증가**: 새 정책 생성 시 자동으로 버전 번호 증가
2. **단일 현재 버전**: 각 정책 타입당 하나의 현재 버전만 존재
3. **변경 이력 추적**: 모든 버전 데이터베이스 보관
4. **현재 버전 보호**: 현재 활성 버전 삭제 불가

## Database 스키마

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

## 사용 예제

### 1. 새 정책 버전 생성

```typescript
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
```

### 2. 현재 정책 조회 (사용자용)

```typescript
const response = await fetch('/api/policies/terms');
const data = await response.json();
console.log(data.data.content);
```

### 3. 정책 히스토리 조회

```typescript
const response = await fetch('/api/admin/policies?type=privacy', {
  headers: { 'Authorization': 'Bearer <token>' }
});
```

### 4. 특정 버전을 현재 버전으로 설정

```typescript
const response = await fetch('/api/admin/policies/uuid', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <token>'
  },
  body: JSON.stringify({ set_current: true })
});
```

## 테스트

### 단위 테스트

```bash
# 테스트 실행
npm test -- app/api/admin/policies/__tests__/policies.test.ts
```

테스트 포함 항목:
- PolicyVersionManager 클래스 메서드
- 유틸리티 함수
- API 엔드포인트 (모킹)
- 버전 관리 로직
- 에러 처리

## 완료 기준 체크리스트

- [x] CRUD 기능 동작
- [x] 버전 관리 확인
- [x] 변경 이력 추적
- [x] 사용자용 API 동작
- [x] 단위 테스트 작성
- [x] API 문서 작성

## 의존성

- **P2D1**: Database 스키마 (policies 테이블)
- **Supabase**: 데이터베이스 및 인증
- **Zod**: 요청 검증
- **Next.js**: API Routes

## 환경 변수

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

## 보안 고려사항

1. **관리자 API**: JWT 인증 필요 (구현 예정)
2. **Rate Limiting**: 요청 제한 (구현 권장)
3. **Input Validation**: Zod 스키마로 검증
4. **현재 버전 보호**: 삭제 방지 로직

## 향후 개선 사항

1. [ ] 관리자 권한 검증 미들웨어 추가
2. [ ] Rate limiting 구현
3. [ ] 정책 비교 기능 (diff)
4. [ ] 정책 승인 워크플로우
5. [ ] 이메일 알림 (정책 업데이트 시)
6. [ ] 정책 동의 이력 추적
7. [ ] 다국어 지원

## 문서

- [API Documentation](./app/api/admin/policies/API_DOCUMENTATION.md)
- [작업지시서](../0-5_Development_ProjectGrid/action/PROJECT_GRID_REVISED/viewer/deploy/tasks/P4BA10.md)

---

**작업 완료일**: 2025-11-09
**작업자**: Claude-Sonnet-4.5 (api-designer)
**소요 시간**: 약 60분
