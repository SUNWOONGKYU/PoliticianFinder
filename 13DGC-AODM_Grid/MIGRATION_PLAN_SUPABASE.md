# PoliticianFinder - Supabase 마이그레이션 계획

## 개요
기존 FastAPI + SQLite 아키텍처를 Supabase 기반 올인원 솔루션으로 전환

**변경일**: 2025-10-16
**목적**: 관리 편의성 향상, 배포 간소화, 확장성 개선

---

## 아키텍처 변경

### Before (기존)
```
┌─────────────┐     REST API      ┌──────────────┐     SQL      ┌──────────┐
│  Next.js    │ ←───────────────→ │   FastAPI    │ ←──────────→ │  SQLite  │
│  Frontend   │                    │   Backend    │              │    DB    │
└─────────────┘                    └──────────────┘              └──────────┘
     ↓
  Vercel                               Railway                     File-based
```

### After (신규)
```
┌─────────────┐     Supabase Client SDK
│  Next.js    │ ←───────────────────────────────────┐
│  Frontend   │                                      │
└─────────────┘                                      ↓
     ↓                                    ┌─────────────────────────┐
  Vercel                                  │      Supabase           │
                                          │  ┌──────────────────┐   │
                                          │  │  PostgreSQL DB   │   │
                                          │  ├──────────────────┤   │
                                          │  │  Auth (내장)     │   │
                                          │  ├──────────────────┤   │
                                          │  │  Storage         │   │
                                          │  ├──────────────────┤   │
                                          │  │  Edge Functions  │   │
                                          │  └──────────────────┘   │
                                          └─────────────────────────┘
```

---

## Phase별 영향도 분석

### Phase 1 (기초 설정) - 22개 작업

| 작업 ID | 작업명 | 상태 | 변경 여부 | 비고 |
|---------|--------|------|-----------|------|
| **Frontend** |
| P1F1 | Next.js 14 프로젝트 초기화 | 완료 | ✅ 유지 | 변경 없음 |
| P1F2 | TypeScript & Tailwind 설정 | 완료 | ✅ 유지 | 변경 없음 |
| P1F3 | shadcn/ui 설치 | 완료 | ✅ 유지 | 변경 없음 |
| P1F4 | 폴더 구조 생성 | 완료 | ✅ 유지 | 변경 없음 |
| P1F5 | Zustand 상태 관리 | 완료 | 🔄 수정 | Supabase Auth로 대체 |
| P1F6 | 회원가입 페이지 | 완료 | 🔄 수정 | Supabase Auth API 연동 |
| P1F7 | 로그인 페이지 | 완료 | 🔄 수정 | Supabase Auth API 연동 |
| **Backend** |
| P1B1 | FastAPI 서버 초기화 | 완료 | ❌ 삭제 | Supabase로 대체 |
| P1B6 | 인증 엔드포인트 | 완료 | ❌ 삭제 | Supabase Auth 사용 |
| P1B7 | Health check | 완료 | ❌ 삭제 | 불필요 |
| **Database** |
| P1D1 | users 테이블 | 완료 | 🔄 마이그레이션 | Supabase Auth 기본 제공 |
| P1D2 | politicians 테이블 | 완료 | 🔄 마이그레이션 | PostgreSQL로 전환 |
| P1D3 | ratings 테이블 | 완료 | 🔄 마이그레이션 | PostgreSQL로 전환 |
| P1D4 | categories 테이블 | 완료 | 🔄 마이그레이션 | PostgreSQL로 전환 |
| P1D5 | comments 테이블 | 완료 | 🔄 마이그레이션 | PostgreSQL로 전환 |
| P1D6 | notifications 테이블 | 완료 | 🔄 마이그레이션 | PostgreSQL로 전환 |
| P1D7 | posts 테이블 | 완료 | 🔄 마이그레이션 | PostgreSQL로 전환 |
| P1D8 | reports 테이블 | 완료 | 🔄 마이그레이션 | PostgreSQL로 전환 |
| P1D9 | user_follows 테이블 | 완료 | 🔄 마이그레이션 | PostgreSQL로 전환 |
| P1D10 | politician_bookmarks 테이블 | 완료 | 🔄 마이그레이션 | PostgreSQL로 전환 |
| P1D11 | ai_evaluations 테이블 | 완료 | 🔄 마이그레이션 | PostgreSQL로 전환 |
| P1D12 | politician_evaluations 테이블 | 완료 | 🔄 마이그레이션 | PostgreSQL로 전환 |

**요약**:
- ✅ 유지: 4개 (Frontend 기본 설정)
- 🔄 수정/마이그레이션: 15개 (상태관리, DB)
- ❌ 삭제: 3개 (FastAPI 백엔드)

---

## 새로운 Phase 1 작업 목록 (Supabase 기반)

### Phase 1A: Supabase 설정 (신규)

| 작업 ID | 작업명 | 설명 | 우선순위 |
|---------|--------|------|----------|
| P1A1 | Supabase 프로젝트 생성 | Supabase 계정 생성 및 프로젝트 초기화 | 최우선 |
| P1A2 | 환경 변수 설정 | NEXT_PUBLIC_SUPABASE_URL, ANON_KEY 설정 | 최우선 |
| P1A3 | Supabase Client 설치 | @supabase/supabase-js 설치 | 최우선 |
| P1A4 | Supabase Client 초기화 | lib/supabase.ts 파일 생성 | 최우선 |

### Phase 1B: Database 마이그레이션

| 작업 ID | 작업명 | 설명 | 우선순위 |
|---------|--------|------|----------|
| P1B1 | users 테이블 확인 | Supabase Auth 기본 테이블 확인 | 높음 |
| P1B2 | politicians 테이블 생성 | PostgreSQL로 마이그레이션 | 높음 |
| P1B3 | ratings 테이블 생성 | PostgreSQL로 마이그레이션 | 높음 |
| P1B4 | categories 테이블 생성 | PostgreSQL로 마이그레이션 | 높음 |
| P1B5 | comments 테이블 생성 | PostgreSQL로 마이그레이션 | 중간 |
| P1B6 | notifications 테이블 생성 | PostgreSQL로 마이그레이션 | 중간 |
| P1B7 | posts 테이블 생성 | PostgreSQL로 마이그레이션 | 중간 |
| P1B8 | reports 테이블 생성 | PostgreSQL로 마이그레이션 | 중간 |
| P1B9 | user_follows 테이블 생성 | PostgreSQL로 마이그레이션 | 낮음 |
| P1B10 | politician_bookmarks 테이블 생성 | PostgreSQL로 마이그레이션 | 낮음 |
| P1B11 | ai_evaluations 테이블 생성 | PostgreSQL로 마이그레이션 | 낮음 |
| P1B12 | politician_evaluations 테이블 생성 | PostgreSQL로 마이그레이션 | 낮음 |

### Phase 1C: 인증 시스템 (Supabase Auth)

| 작업 ID | 작업명 | 설명 | 우선순위 |
|---------|--------|------|----------|
| P1C1 | Auth Context 생성 | Supabase Auth 상태 관리 Context | 최우선 |
| P1C2 | 회원가입 기능 구현 | signUp API 연동 | 높음 |
| P1C3 | 로그인 기능 구현 | signInWithPassword API 연동 | 높음 |
| P1C4 | 로그아웃 기능 구현 | signOut API 연동 | 높음 |
| P1C5 | 세션 관리 구현 | getSession, onAuthStateChange | 높음 |
| P1C6 | 보호된 라우트 구현 | 미들웨어로 인증 체크 | 중간 |

### Phase 1D: Frontend 업데이트

| 작업 ID | 작업명 | 설명 | 우선순위 |
|---------|--------|------|----------|
| P1D1 | 회원가입 페이지 수정 | Supabase Auth 연동 | 높음 |
| P1D2 | 로그인 페이지 수정 | Supabase Auth 연동 | 높음 |
| P1D3 | 프로필 페이지 생성 | 사용자 정보 표시 | 중간 |
| P1D4 | 상태 관리 정리 | Zustand 제거 또는 간소화 | 낮음 |

### Phase 1E: RLS (Row Level Security) 설정

| 작업 ID | 작업명 | 설명 | 우선순위 |
|---------|--------|------|----------|
| P1E1 | politicians 테이블 RLS | 읽기 공개, 쓰기 관리자만 | 높음 |
| P1E2 | ratings 테이블 RLS | 본인 평가만 수정/삭제 | 높음 |
| P1E3 | comments 테이블 RLS | 본인 댓글만 수정/삭제 | 높음 |
| P1E4 | posts 테이블 RLS | 본인 게시물만 수정/삭제 | 중간 |
| P1E5 | 나머지 테이블 RLS | 적절한 권한 설정 | 중간 |

### Phase 1F: 테스트 및 검증

| 작업 ID | 작업명 | 설명 | 우선순위 |
|---------|--------|------|----------|
| P1F1 | 회원가입 테스트 | 이메일 인증 포함 | 최우선 |
| P1F2 | 로그인 테스트 | 세션 유지 확인 | 최우선 |
| P1F3 | 데이터베이스 CRUD 테스트 | 각 테이블별 생성/조회/수정/삭제 | 높음 |
| P1F4 | RLS 정책 테스트 | 권한별 접근 제어 확인 | 높음 |
| P1F5 | 통합 테스트 | 전체 플로우 테스트 | 중간 |

---

## 코드 변경 사항

### 1. 삭제할 파일/폴더
```
/api/                    # FastAPI 전체 폴더
  ├── main.py
  ├── auth.py
  ├── database.py
  ├── models.py
  ├── schemas.py
  └── ...
/politicians.db          # SQLite 데이터베이스
/test_auth_endpoints.py  # FastAPI 테스트
```

### 2. 새로 생성할 파일
```
/frontend/
  ├── lib/
  │   └── supabase.ts           # Supabase 클라이언트
  ├── contexts/
  │   └── AuthContext.tsx       # 인증 Context
  ├── hooks/
  │   ├── useAuth.ts            # 인증 훅
  │   └── useSupabase.ts        # Supabase 훅
  ├── middleware.ts             # Next.js 미들웨어 (인증 체크)
  └── types/
      └── supabase.ts           # Supabase 타입 정의
```

### 3. 수정할 파일
```
/frontend/
  ├── .env.local                # Supabase 환경 변수 추가
  ├── package.json              # @supabase/supabase-js 추가
  ├── src/app/signup/page.tsx   # Supabase Auth 연동
  ├── src/app/login/page.tsx    # Supabase Auth 연동
  └── src/store/authStore.ts    # 간소화 또는 제거
```

---

## 마이그레이션 단계

### Step 1: Supabase 프로젝트 설정 (1시간)
1. Supabase 계정 생성
2. 새 프로젝트 생성
3. API 키 및 URL 복사
4. .env.local 파일 업데이트

### Step 2: Frontend Supabase 클라이언트 설치 (30분)
1. `npm install @supabase/supabase-js`
2. lib/supabase.ts 생성
3. AuthContext 생성

### Step 3: 데이터베이스 마이그레이션 (2-3시간)
1. Supabase Dashboard에서 SQL 에디터 열기
2. 기존 SQLite 스키마를 PostgreSQL로 변환
3. 테이블 생성 (12개)
4. RLS 정책 설정

### Step 4: 인증 기능 마이그레이션 (2-3시간)
1. 회원가입 페이지 업데이트
2. 로그인 페이지 업데이트
3. 세션 관리 구현
4. 보호된 라우트 설정

### Step 5: 테스트 (2-3시간)
1. 회원가입/로그인 테스트
2. 데이터베이스 CRUD 테스트
3. RLS 정책 테스트
4. 통합 테스트

### Step 6: 기존 코드 정리 (1시간)
1. /api 폴더 삭제
2. SQLite DB 파일 삭제
3. 사용하지 않는 패키지 제거
4. 문서 업데이트

**총 예상 시간**: 8-12시간

---

## 비용 분석

### 무료 플랜으로 시작
- **Supabase 무료**: $0/월
  - 500MB 데이터베이스
  - 5GB 대역폭
  - 50,000 MAU (월간 활성 사용자)

- **Vercel 무료**: $0/월
  - Next.js 호스팅
  - 자동 배포

**총 초기 비용**: $0/월

### 성장 후 (Pro 플랜)
- **Supabase Pro**: $25/월
  - 8GB 데이터베이스
  - 50GB 대역폭
  - 100,000 MAU

- **Vercel 무료**: $0/월

**총 비용**: $25/월 (약 33,000원)

---

## 장점 vs 단점

### 장점 ✅
1. **관리 편의성**: 한 곳에서 모든 것 관리
2. **배포 간소화**: 백엔드 서버 관리 불필요
3. **자동 백업**: Supabase가 자동으로 백업
4. **확장성**: 자동 스케일링
5. **실시간 기능**: Realtime subscriptions 내장
6. **인증 시스템**: 소셜 로그인 쉽게 추가 가능
7. **보안**: RLS로 데이터 보호
8. **개발 속도**: API 자동 생성

### 단점 ❌
1. **학습 곡선**: Supabase 새로 배워야 함
2. **제한된 커스터마이징**: 백엔드 로직 제한적
3. **Vendor Lock-in**: Supabase 종속성
4. **마이그레이션 비용**: 기존 코드 재작성 필요
5. **디버깅 어려움**: 서버리스 환경

---

## 다음 단계

1. **승인 대기**: 이 마이그레이션 계획 검토 및 승인
2. **백업**: 기존 코드 완전 백업
3. **Supabase 계정 생성**: 무료 플랜으로 시작
4. **단계별 진행**: Step 1부터 순차적으로 진행

---

## 질문/확인 사항

- [ ] Supabase 무료 플랜으로 시작할까요?
- [ ] 기존 FastAPI 코드는 백업 후 삭제할까요?
- [ ] 이메일 인증 기능을 활성화할까요?
- [ ] 소셜 로그인 (Google, GitHub 등)을 추가할까요?
- [ ] 단계별로 진행하면서 테스트할까요?

**작성자**: Claude Code
**작성일**: 2025-10-16
**버전**: 1.0
