# Phase 1 테스트 및 검증 가이드

**프로젝트**: PoliticianFinder
**작성일**: 2025년 10월 16일
**테스트 단계**: Phase 1F (테스트 및 검증)

---

## 📋 개요

Phase 1A~1E까지 완료된 기능들을 체계적으로 테스트하기 위한 가이드입니다.
각 테스트 항목을 순서대로 진행하고 결과를 기록해주세요.

---

## 🚀 시작하기 전에

### 1. 개발 서버 실행 확인
```bash
cd C:\Users\home\PoliticianFinder_Supabase\frontend
npm run dev
```

**확인사항**:
- ✅ 서버가 정상 실행됨 (http://localhost:3001 또는 다른 포트)
- ✅ 콘솔에 에러 메시지가 없음
- ✅ `.env.local` 파일에 Supabase 환경 변수가 설정되어 있음

### 2. Supabase 대시보드 준비
- Supabase 대시보드 (https://supabase.com/dashboard) 로그인
- `politician-finder` 프로젝트 선택
- 좌측 메뉴에서 **Table Editor** 열기 (테이블 확인용)

---

## P1F1: 회원가입 테스트 ⭐ 최우선

### 테스트 시나리오 1: 정상 회원가입

**단계**:
1. 브라우저에서 `http://localhost:3001` 접속
2. 우측 상단 **"회원가입"** 버튼 클릭 또는 `/signup` 페이지로 이동
3. 다음 정보 입력:
   - **이메일**: `test1@example.com` (본인 실제 이메일 권장)
   - **사용자명**: `testuser1`
   - **이름**: `테스트유저1` (선택)
   - **비밀번호**: `Test1234!@#$`
   - **비밀번호 확인**: `Test1234!@#$`
4. **"회원가입"** 버튼 클릭

**예상 결과**:
- ✅ 로딩 중 표시 (버튼이 "가입 중..."으로 변경)
- ✅ 회원가입 성공 후 홈페이지(`/`)로 리다이렉트
- ✅ 네비게이션 바에 사용자 아이콘 표시 (로그인 상태)

**Supabase 확인**:
1. Supabase Dashboard → **Table Editor** → `profiles` 테이블 선택
2. 방금 가입한 사용자 정보 확인:
   - `username`: `testuser1`
   - `full_name`: `테스트유저1`
3. **Authentication** 메뉴로 이동
4. Users 탭에서 이메일 확인

**테스트 결과**:
```
[ ] 회원가입 폼이 정상 표시됨
[ ] 입력 유효성 검사가 작동함
[ ] 회원가입이 성공적으로 완료됨
[ ] profiles 테이블에 데이터가 생성됨
[ ] auth.users 테이블에 사용자가 생성됨
[ ] 로그인 상태로 홈페이지 리다이렉트됨
```

---

### 테스트 시나리오 2: 유효성 검사 테스트

**단계**:
1. `/signup` 페이지로 이동
2. 각 필드에 잘못된 값 입력하여 에러 메시지 확인

**테스트 케이스**:

| 입력 필드 | 잘못된 값 | 예상 에러 메시지 |
|-----------|-----------|------------------|
| 이메일 | `invalid-email` | "Invalid email format" |
| 사용자명 | `ab` | "Username must be at least 3 characters" |
| 사용자명 | `123user` | "Username must start with a letter..." |
| 비밀번호 | `short` | "Password must be at least 8 characters" |
| 비밀번호 | `onlylowercase` | "Password must include uppercase..." |
| 비밀번호 확인 | `different` | "Passwords do not match" |

**테스트 결과**:
```
[ ] 모든 유효성 검사가 정상 작동함
[ ] 에러 메시지가 명확하게 표시됨
[ ] 필드별로 에러가 표시됨
```

---

### 테스트 시나리오 3: 중복 회원가입 방지

**단계**:
1. 이미 가입한 이메일(`test1@example.com`)로 재가입 시도

**예상 결과**:
- ✅ Supabase에서 "User already registered" 에러 발생
- ✅ 에러 메시지가 화면에 표시됨

**테스트 결과**:
```
[ ] 중복 이메일 가입이 차단됨
[ ] 적절한 에러 메시지 표시됨
```

---

## P1F2: 로그인 테스트 ⭐ 최우선

### 테스트 시나리오 1: 정상 로그인

**사전 조건**: P1F1에서 생성한 계정 사용

**단계**:
1. 로그아웃 상태인지 확인 (네비게이션 바에 "로그인" 버튼 표시)
   - 로그인 상태라면 사용자 드롭다운 → "로그아웃" 클릭
2. **"로그인"** 버튼 클릭 또는 `/login` 페이지로 이동
3. 로그인 정보 입력:
   - **이메일**: `test1@example.com`
   - **비밀번호**: `Test1234!@#$`
4. **"로그인"** 버튼 클릭

**예상 결과**:
- ✅ 로딩 중 표시 (버튼이 "로그인 중..."으로 변경)
- ✅ 로그인 성공 후 홈페이지(`/`)로 리다이렉트
- ✅ 네비게이션 바에 사용자 정보 표시

**테스트 결과**:
```
[ ] 로그인 폼이 정상 표시됨
[ ] 로그인이 성공적으로 완료됨
[ ] 홈페이지로 리다이렉트됨
[ ] 네비게이션 바에 사용자 아이콘이 표시됨
[ ] 사용자 드롭다운에 이메일/사용자명이 표시됨
```

---

### 테스트 시나리오 2: 잘못된 로그인 정보

**단계**:
1. `/login` 페이지로 이동
2. 잘못된 비밀번호 입력:
   - **이메일**: `test1@example.com`
   - **비밀번호**: `WrongPassword123!`
3. **"로그인"** 버튼 클릭

**예상 결과**:
- ✅ "Invalid login credentials" 또는 "로그인에 실패했습니다" 에러 메시지 표시
- ✅ 로그인되지 않음

**테스트 결과**:
```
[ ] 잘못된 비밀번호가 차단됨
[ ] 적절한 에러 메시지 표시됨
[ ] 보안상 구체적인 실패 이유를 노출하지 않음
```

---

### 테스트 시나리오 3: 세션 관리 및 로그아웃

**단계**:
1. 로그인 상태에서 페이지 새로고침 (F5)
2. 로그인 상태가 유지되는지 확인
3. 네비게이션 바에서 사용자 아이콘 클릭 → 드롭다운 메뉴 열기
4. **"로그아웃"** 클릭

**예상 결과**:
- ✅ 새로고침 후에도 로그인 상태 유지됨
- ✅ 로그아웃 버튼 클릭 시 `/login` 페이지로 이동
- ✅ 네비게이션 바가 비로그인 상태로 변경됨 ("로그인", "회원가입" 버튼 표시)

**테스트 결과**:
```
[ ] 페이지 새로고침 후에도 로그인 상태 유지됨
[ ] 로그아웃이 정상 작동함
[ ] 로그아웃 후 비로그인 상태로 UI 변경됨
```

---

## P1F3: 보호된 라우트 테스트

### 테스트 시나리오 1: 비로그인 상태 접근 차단

**단계**:
1. **로그아웃 상태**인지 확인
2. 브라우저 주소창에 `http://localhost:3001/profile` 직접 입력

**예상 결과**:
- ✅ 즉시 `/login` 페이지로 리다이렉트됨
- ✅ 프로필 페이지가 표시되지 않음

**테스트 결과**:
```
[ ] 비로그인 상태에서 보호된 라우트 접근이 차단됨
[ ] 자동으로 로그인 페이지로 리다이렉트됨
```

---

### 테스트 시나리오 2: 로그인 후 프로필 페이지 접근

**단계**:
1. 로그인 상태로 전환 (P1F2 참조)
2. 네비게이션 바에서 사용자 아이콘 클릭 → **"프로필"** 클릭
3. 또는 주소창에 `/profile` 직접 입력

**예상 결과**:
- ✅ 프로필 페이지가 정상 표시됨
- ✅ "기본 정보" 카드에 사용자 이메일, 사용자명, 가입일 표시
- ✅ "활동 통계" 카드에 0개씩 표시 (게시글, 댓글, 평가한 정치인)

**테스트 결과**:
```
[ ] 로그인 상태에서 프로필 페이지 정상 접근됨
[ ] 사용자 정보가 올바르게 표시됨
[ ] 활동 통계가 표시됨
```

---

## P1F4: 데이터베이스 CRUD 테스트 (Supabase Dashboard)

이 테스트는 Supabase Dashboard에서 직접 수행합니다.

### 테스트 준비
1. Supabase Dashboard 로그인
2. `politician-finder` 프로젝트 선택
3. **Table Editor** 메뉴 선택

---

### 테스트 1: profiles 테이블 조회 (Read)

**단계**:
1. 좌측에서 `profiles` 테이블 선택
2. 테이블 데이터 확인

**예상 결과**:
- ✅ P1F1에서 생성한 사용자 데이터가 보임
- ✅ 컬럼: `id`, `username`, `full_name`, `avatar_url`, `is_admin`, `user_type`, `user_level`, `points`, `created_at`, `updated_at`

**테스트 결과**:
```
[ ] profiles 테이블이 존재함
[ ] 사용자 데이터가 정확하게 저장됨
[ ] 모든 컬럼이 정상 표시됨
```

---

### 테스트 2: politicians 테이블 데이터 생성 (Create)

**단계**:
1. `politicians` 테이블 선택
2. **"Insert row"** 버튼 클릭
3. 다음 정보 입력:
   - `name`: `홍길동`
   - `party`: `테스트당`
   - `region`: `서울특별시`
   - `position`: `국회의원`
   - `biography`: `테스트용 정치인입니다`
   - `avatar_enabled`: `false` (체크 해제)
4. **"Save"** 버튼 클릭

**예상 결과**:
- ✅ 데이터가 성공적으로 생성됨
- ✅ `id`가 자동 생성됨 (SERIAL)
- ✅ `avg_rating`이 0으로 설정됨
- ✅ `created_at`, `updated_at`이 자동 설정됨

**테스트 결과**:
```
[ ] politicians 테이블에 데이터 생성 성공
[ ] 자동 생성 필드들이 정상 동작함
```

---

### 테스트 3: politicians 테이블 데이터 수정 (Update)

**단계**:
1. 방금 생성한 정치인 행 클릭
2. `biography` 필드 수정: `테스트용 정치인입니다. 수정됨!`
3. **"Save"** 버튼 클릭

**예상 결과**:
- ✅ 데이터가 정상 수정됨
- ✅ `updated_at`이 자동으로 현재 시간으로 업데이트됨

**테스트 결과**:
```
[ ] 데이터 수정 성공
[ ] updated_at 자동 업데이트됨
```

---

### 테스트 4: politicians 테이블 데이터 삭제 (Delete)

**주의**: 실제 데이터를 삭제하므로 테스트 데이터만 삭제하세요!

**단계**:
1. 테스트로 생성한 정치인 행 선택
2. 행 좌측 체크박스 클릭
3. 상단의 **"Delete selected rows"** 버튼 클릭
4. 확인 팝업에서 **"Delete"** 클릭

**예상 결과**:
- ✅ 데이터가 삭제됨
- ✅ 테이블에서 해당 행이 사라짐

**테스트 결과**:
```
[ ] 데이터 삭제 성공
[ ] 테이블에서 정상적으로 제거됨
```

---

## P1F5: RLS 정책 테스트

RLS (Row Level Security) 정책이 올바르게 작동하는지 테스트합니다.

### 테스트 준비
- 2개의 브라우저 (또는 시크릿 모드 사용)
- User A: `test1@example.com` (이미 생성됨)
- User B: `test2@example.com` (새로 생성 필요)

---

### 테스트 1: profiles 테이블 RLS - 읽기 공개

**단계**:
1. User A로 로그인한 상태에서 Supabase Dashboard 확인
2. `profiles` 테이블의 모든 사용자 정보를 볼 수 있는지 확인

**예상 결과**:
- ✅ RLS 정책: "프로필 읽기 공개" (모든 사용자가 읽기 가능)
- ✅ 다른 사용자의 프로필도 조회 가능

**테스트 결과**:
```
[ ] profiles 테이블 읽기 권한이 공개로 설정됨
```

---

### 테스트 2: profiles 테이블 RLS - 본인 프로필만 수정

**Supabase SQL Editor에서 테스트**:

```sql
-- User A의 ID 확인
SELECT id, username, email FROM auth.users WHERE email = 'test1@example.com';

-- User A로 자신의 프로필 수정 시도 (성공해야 함)
UPDATE profiles
SET full_name = '수정된 이름'
WHERE id = '<User A의 ID>';

-- User A로 다른 사용자 프로필 수정 시도 (실패해야 함)
UPDATE profiles
SET full_name = '해킹 시도'
WHERE id != '<User A의 ID>';
```

**예상 결과**:
- ✅ 본인 프로필 수정: 성공
- ✅ 타인 프로필 수정: 0 rows affected (차단됨)

**테스트 결과**:
```
[ ] 본인 프로필 수정 가능
[ ] 타인 프로필 수정 차단됨
```

---

### 테스트 3: posts 테이블 RLS - 본인 게시물만 수정/삭제

**SQL Editor에서 테스트**:

```sql
-- User A로 게시물 생성
INSERT INTO posts (user_id, category, title, content)
VALUES
('<User A의 ID>', 'general', '테스트 게시물', '내용입니다');

-- User A로 자신의 게시물 수정 (성공)
UPDATE posts
SET title = '수정된 제목'
WHERE user_id = '<User A의 ID>';

-- User A로 타인의 게시물 수정 시도 (실패)
UPDATE posts
SET title = '해킹 시도'
WHERE user_id != '<User A의 ID>';
```

**예상 결과**:
- ✅ 본인 게시물 수정: 성공
- ✅ 타인 게시물 수정: 0 rows affected

**테스트 결과**:
```
[ ] 본인 게시물 수정 가능
[ ] 타인 게시물 수정 차단됨
```

---

### 테스트 4: politicians 테이블 RLS - 관리자만 수정

**SQL Editor에서 테스트**:

```sql
-- 일반 사용자(User A)로 정치인 데이터 수정 시도 (실패해야 함)
UPDATE politicians
SET name = '해킹 시도'
WHERE id = 1;

-- User A를 관리자로 변경
UPDATE profiles
SET is_admin = true
WHERE id = '<User A의 ID>';

-- 관리자로 정치인 데이터 수정 시도 (성공해야 함)
UPDATE politicians
SET biography = '관리자가 수정함'
WHERE id = 1;

-- 테스트 후 관리자 권한 제거
UPDATE profiles
SET is_admin = false
WHERE id = '<User A의 ID>';
```

**예상 결과**:
- ✅ 일반 사용자: 수정 차단 (0 rows affected)
- ✅ 관리자: 수정 성공

**테스트 결과**:
```
[ ] 일반 사용자의 정치인 데이터 수정 차단됨
[ ] 관리자의 정치인 데이터 수정 가능
```

---

## 📊 최종 점검 체크리스트

테스트를 모두 완료한 후 최종 점검을 진행하세요.

### Phase 1A: Supabase 설정
```
✅ P1A1: Supabase 프로젝트 생성 완료
✅ P1A2: 환경 변수 설정 완료 (.env.local)
✅ P1A3: Supabase Client 설치 완료
✅ P1A4: Supabase Client 초기화 완료 (lib/supabase.ts)
```

### Phase 1B: Database 마이그레이션
```
✅ P1B1: profiles 테이블 생성 (RLS 포함)
✅ P1B2: politicians 테이블 생성 (RLS 포함)
✅ P1B3: ratings 테이블 생성 (RLS 포함)
✅ P1B4: ai_scores 테이블 생성 (RLS 포함)
✅ P1B5: comments 테이블 생성 (RLS 포함)
✅ P1B6: notifications 테이블 생성 (RLS 포함)
✅ P1B7: posts 테이블 생성 (RLS 포함)
✅ P1B8: reports 테이블 생성 (RLS 포함)
✅ P1B9: votes 테이블 생성 (RLS 포함)
✅ P1B10: bookmarks 테이블 생성 (RLS 포함)
```

### Phase 1C: 인증 시스템
```
✅ P1C1: Auth Context 생성 완료
✅ P1C2: 회원가입 기능 구현 완료
✅ P1C3: 로그인 기능 구현 완료
✅ P1C4: 로그아웃 기능 구현 완료
✅ P1C5: 세션 관리 구현 완료
✅ P1C6: 보호된 라우트 구현 완료 (ProtectedRoute)
```

### Phase 1D: Frontend 업데이트
```
✅ P1D1: 회원가입 페이지 수정 완료
✅ P1D2: 로그인 페이지 수정 완료
✅ P1D3: 프로필 페이지 생성 완료
✅ P1D4: 네비게이션 바 생성 완료
```

### Phase 1E: RLS 설정
```
✅ P1E1: politicians 테이블 RLS 완료
✅ P1E2: ratings 테이블 RLS 완료
✅ P1E3: comments 테이블 RLS 완료
✅ P1E4: posts 테이블 RLS 완료
✅ P1E5: 나머지 테이블 RLS 완료
```

### Phase 1F: 테스트 및 검증
```
[ ] P1F1: 회원가입 테스트 통과
[ ] P1F2: 로그인 테스트 통과
[ ] P1F3: 보호된 라우트 테스트 통과
[ ] P1F4: 데이터베이스 CRUD 테스트 통과
[ ] P1F5: RLS 정책 테스트 통과
```

---

## 🐛 문제 발생 시 대처 방법

### 문제 1: 회원가입/로그인이 안 됨

**해결 방법**:
1. 브라우저 개발자 도구(F12) → Console 탭에서 에러 메시지 확인
2. Network 탭에서 Supabase API 호출 확인 (401, 403 에러 여부)
3. `.env.local` 파일의 환경 변수가 올바른지 확인
4. Supabase Dashboard → Settings → API에서 키 재확인

### 문제 2: 테이블이 보이지 않음

**해결 방법**:
1. Supabase Dashboard → Table Editor에서 테이블 목록 확인
2. SQL Editor에서 `\dt` 명령어로 테이블 존재 여부 확인
3. 스키마 SQL 파일을 다시 실행

### 문제 3: RLS 정책 에러

**해결 방법**:
1. Supabase Dashboard → Table Editor → 테이블 선택 → "View policies" 클릭
2. RLS가 활성화되어 있는지 확인 (`ENABLE ROW LEVEL SECURITY`)
3. 정책이 올바르게 생성되었는지 확인

---

## ✅ 테스트 완료 보고

모든 테스트를 완료한 후 다음 형식으로 보고해주세요:

```
=== Phase 1F 테스트 결과 ===

날짜: 2025-10-16
테스터: [이름]

## 테스트 통과 현황
- P1F1 회원가입: [ 통과 / 실패 ]
- P1F2 로그인: [ 통과 / 실패 ]
- P1F3 보호된 라우트: [ 통과 / 실패 ]
- P1F4 데이터베이스 CRUD: [ 통과 / 실패 ]
- P1F5 RLS 정책: [ 통과 / 실패 ]

## 발견된 문제
1. [문제 설명]
2. [문제 설명]

## 추가 의견
[의견 작성]
```

---

**다음 단계**: Phase 1F 테스트를 모두 통과하면 **Phase 2: 정치인 목록 및 상세 페이지** 개발을 시작합니다.
