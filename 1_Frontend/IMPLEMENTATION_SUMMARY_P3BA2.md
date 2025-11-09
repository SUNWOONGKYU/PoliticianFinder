# P3BA2: Real API Implementation - 정치인 (Supabase + OpenAI 연동)

## 작업 완료 일시
2025-11-07

## 작업 개요
PHASE 1의 Mock API를 실제 Supabase Database 및 AI 평가 시스템과 연동하는 Real API로 전면 교체

---

## 수정된 파일 목록

### 1. `/src/app/api/politicians/route.ts`
**변경 사항:**
- Supabase Service Key 직접 사용에서 `@/lib/supabase/server` 사용으로 변경 (RLS 적용)
- Mock 데이터 완전 제거
- Database schema 정렬: `database.types.ts`와 완전히 일치하도록 수정
  - `political_party_id`, `position_id`, `constituency_id` 사용
  - `is_active` 필터링 추가
  - `verified_only` 옵션 추가
- Full-text search 개선: 한국어, 한자(kana), 영문 이름, 약력 검색
- 페이지네이션 개선: `hasMore` 플래그 추가
- 입력 검증 강화: Zod schema 추가 (POST 요청)

**API 엔드포인트:**
- `GET /api/politicians` - 정치인 목록 조회
- `POST /api/politicians` - 정치인 생성 (관리자)

**쿼리 파라미터:**
- `page`, `limit` - 페이지네이션
- `search` - 전체 텍스트 검색
- `political_party_id` - 정당 필터
- `position_id` - 직책 필터
- `constituency_id` - 지역구 필터
- `is_active` - 활성 상태 필터
- `verified_only` - 검증된 정치인만
- `sort`, `order` - 정렬

---

### 2. `/src/app/api/politicians/[id]/route.ts`
**변경 사항:**
- `@/lib/supabase/server` 사용 (RLS 적용)
- Mock AI 평가 데이터 제거
- **실제 AI 평가 데이터 연동**: `ai_evaluations` 테이블에서 조회
  - 모델별 평가 점수 (Claude, ChatGPT, Gemini, Grok, Perplexity)
  - 평가 일자, 만료일, 보고서 URL
  - Raw data (JSON)
- **Politician Details 조인**: `politician_details` 테이블 연동
  - 학력, 경력, 업적, 논란
  - 기부 한도, 선거 본부
  - 선거 이력 (출마 횟수, 당선 횟수, 득표수)
- 소프트 삭제 구현: `DELETE`는 `is_active = false` 설정
- 업데이트 시 `updated_at` 자동 갱신

**API 엔드포인트:**
- `GET /api/politicians/[id]` - 정치인 상세 조회
- `PATCH /api/politicians/[id]` - 정치인 정보 업데이트
- `DELETE /api/politicians/[id]` - 정치인 비활성화 (소프트 삭제)

---

### 3. `/src/app/api/politicians/search/route.ts`
**변경 사항:**
- `@/lib/supabase/server` 사용 (RLS 적용)
- Full-text search 개선
  - 타입별 검색: `name`, `bio`, `all`
  - 한국어, 한자, 영문 이름 동시 검색
- 필터 옵션 확장
  - `political_party_id`, `position_id`, `constituency_id`
  - `verified_only`, `is_active`
- 결과 정렬: 이름순 (기본값)
- 검색 조건 반환: 응답에 검색 필터 정보 포함

**API 엔드포인트:**
- `GET /api/politicians/search?q=검색어&type=all&limit=10`

**쿼리 파라미터:**
- `q` - 검색어 (필수)
- `type` - 검색 타입: `name`, `bio`, `all`
- `limit` - 결과 개수 제한
- `political_party_id`, `position_id`, `constituency_id` - 필터
- `verified_only`, `is_active` - 검증/활성 필터

---

### 4. `/src/app/api/favorites/route.ts`
**변경 사항:**
- Mock User ID 제거
- **실제 사용자 인증 적용**: `supabase.auth.getUser()`
- **RLS 정책 완전 준수**: user_id 자동 필터링
- Database schema 정렬: `favorite_politicians` 테이블
  - `notes`, `notification_enabled`, `is_pinned` 지원
- 정치인 정보 조인 개선
- UUID 형식 검증 추가
- 인증 에러 처리: 401 Unauthorized

**API 엔드포인트:**
- `GET /api/favorites` - 즐겨찾기 목록 (인증 필요)
- `POST /api/favorites` - 즐겨찾기 추가 (인증 필요)
- `DELETE /api/favorites?politician_id={uuid}` - 즐겨찾기 삭제 (인증 필요)

---

### 5. `/src/app/api/politicians/statistics/route.ts`
**변경 사항:**
- `@/lib/supabase/server` 사용 (RLS 적용)
- Database schema 정렬
  - `political_party_id`, `position_id`, `constituency_id` 사용
- 통계 항목 확장
  - AI 평가 완료 정치인 수 추가
  - 평가율 계산 추가
- 최근 검증된 정치인 목록 추가
- 캐시 만료 시간 메타데이터 추가 (1시간)

**API 엔드포인트:**
- `GET /api/politicians/statistics`

**응답 데이터:**
- `overview`: 전체/검증/평가 정치인 수, 검증률, 평가율
- `distribution`: 정당별/지역구별/직책별 분포
- `recentVerified`: 최근 검증된 정치인 10명
- `recentUpdates`: 최근 업데이트된 정치인 10명

---

## 주요 변경 사항 요약

### 1. Supabase Client 변경
```typescript
// Before (Service Key 직접 사용)
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// After (RLS 적용 서버 클라이언트)
import { createClient } from "@/lib/supabase/server";
const supabase = createClient();
```

### 2. Database Schema 정렬
```typescript
// Before
party: string
region: string
position: string

// After (Foreign Keys)
political_party_id: number | null
constituency_id: number | null
position_id: number | null
```

### 3. AI 평가 데이터 실제 연동
```typescript
// Before: Mock 데이터
const ai_evaluations = { claude: { overall_score: 97, ... } };

// After: 실제 DB 조회
const { data: aiEvaluations } = await supabase
  .from("ai_evaluations")
  .select("*")
  .eq("politician_id", id);
```

### 4. 사용자 인증 (Favorites API)
```typescript
// Before: Mock User ID
const MOCK_USER_ID = "7f61567b-bbdf-427a-90a9-0ee060ef4595";

// After: 실제 인증
const { data: { user }, error } = await supabase.auth.getUser();
if (!user) return 401;
```

### 5. 소프트 삭제
```typescript
// Before: Hard Delete
await supabase.from("politicians").delete().eq("id", id);

// After: Soft Delete
await supabase.from("politicians")
  .update({ is_active: false, updated_at: new Date().toISOString() })
  .eq("id", id);
```

---

## 보안 고려사항

### 1. RLS (Row Level Security) 정책 준수
- 모든 API에서 `@/lib/supabase/server` 클라이언트 사용
- 사용자별 데이터 접근 자동 제어
- 인증되지 않은 요청 차단 (401 Unauthorized)

### 2. 입력 검증
- Zod schema를 통한 타입 안전성 보장
- UUID 형식 검증
- Email, URL 형식 검증

### 3. SQL Injection 방지
- Supabase ORM 사용 (Parameterized Queries)
- 직접 SQL 실행 없음

### 4. 에러 처리
- 민감한 정보 노출 방지
- 일관된 에러 응답 형식
- 상세한 에러 로깅 (서버 측)

---

## 성능 최적화

### 1. 데이터베이스 쿼리 최적화
- 필요한 필드만 SELECT
- JOIN 최소화 (필요한 경우만)
- 인덱스 활용 (is_active, verified_at 등)

### 2. 페이지네이션
- `range()` 사용으로 대용량 데이터 처리
- `hasMore` 플래그로 무한 스크롤 지원

### 3. 캐싱 전략 (Statistics API)
- 캐시 만료 시간 메타데이터 제공
- 1시간 캐시 권장

---

## API 테스트 방법

### 1. 정치인 목록 조회
```bash
curl -X GET "http://localhost:3002/api/politicians?page=1&limit=10&is_active=true"
```

### 2. 정치인 검색
```bash
curl -X GET "http://localhost:3002/api/politicians/search?q=김&type=name&limit=5"
```

### 3. 정치인 상세 조회
```bash
curl -X GET "http://localhost:3002/api/politicians/{politician_id}"
```

### 4. 즐겨찾기 추가 (인증 필요)
```bash
curl -X POST "http://localhost:3002/api/favorites" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"politician_id": "{uuid}"}'
```

### 5. 통계 조회
```bash
curl -X GET "http://localhost:3002/api/politicians/statistics"
```

---

## 다음 단계 제안

### 1. OpenAI API 연동
- AI 평가 생성 API 구현
- `/api/politicians/[id]/evaluate` 엔드포인트
- GPT-4, Claude API 호출
- 평가 결과를 `ai_evaluations` 테이블에 저장

### 2. 캐싱 레이어 추가
- Redis 또는 Next.js ISR 활용
- 통계 데이터 캐싱 (1시간)
- 정치인 상세 정보 캐싱 (10분)

### 3. Rate Limiting
- API 요청 제한 (1분당 100회)
- DDoS 방지

### 4. 실시간 알림
- Supabase Realtime 활용
- 즐겨찾기한 정치인 업데이트 알림

### 5. 검색 성능 개선
- PostgreSQL Full-text Search 인덱스
- 또는 Elasticsearch 연동

---

## 의존성 정보
- Next.js 14.2.18
- Supabase JS Client: ^2.x
- Zod: ^3.x
- TypeScript: ^5.x

---

## 완료 체크리스트
- [x] Mock 데이터 완전 제거
- [x] Supabase 서버 클라이언트 연결
- [x] Database schema 정렬 (database.types.ts 준수)
- [x] RLS 정책 적용
- [x] AI 평가 데이터 실제 연동
- [x] 사용자 인증 적용 (Favorites)
- [x] Full-text search 구현
- [x] 에러 처리 강화
- [x] 입력 검증 (Zod)
- [x] 소프트 삭제 구현
- [x] API 엔드포인트 문서화

---

## 빌드 상태
- TypeScript 컴파일: 수정된 파일 문법 오류 없음
- Import 경로: `@/lib/supabase/server` 정상 작동
- 전체 빌드: 다른 파일의 오류로 인해 전체 빌드 실패 (본 작업과 무관)

**참고**: `/src/app/api/statistics/community/route.ts` 파일에 Supabase `.catch()` 메서드 오류 존재 (다른 작업에서 수정 필요)

---

## 작업자 노트
- 모든 API는 RLS 정책을 준수하도록 설계됨
- 인증이 필요한 API (Favorites)는 401 에러 반환
- UUID 형식 검증으로 데이터 무결성 보장
- 소프트 삭제로 데이터 복구 가능성 확보
