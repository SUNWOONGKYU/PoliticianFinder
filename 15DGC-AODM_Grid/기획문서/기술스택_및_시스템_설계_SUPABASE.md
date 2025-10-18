# Politician Finder 기술 스택 및 시스템 설계 (Supabase 기반)

**버전**: 2.0 (Supabase 올인원 아키텍처)
**작성일**: 2025-10-16
**변경 이유**: 관리 편의성 및 배포 간소화를 위해 FastAPI+PostgreSQL에서 Supabase로 전환

---

## AI-only 개발 호환성 체크 ✅

본 기술 스택은 다음 AI-only 개발 기준을 충족합니다:

| 기술 | AI-only 호환 | 자동화 방법 |
|------|--------------|-------------|
| **Supabase** | ✅ 완전 호환 | API Route, Migration, CLI |
| **Next.js** | ✅ 완전 호환 | 코드 기반 설정 |
| **TypeScript** | ✅ 완전 호환 | 자동 타입 체크 |
| **Tailwind CSS** | ✅ 완전 호환 | 설정 파일 |
| **shadcn/ui** | ✅ 완전 호환 | CLI 설치 |

### 거부된 대안 기술
- ❌ **Firebase**: Console 수동 설정 필요
- ❌ **Vercel KV**: Dashboard 설정 필요
- ❌ **AWS RDS**: Console 수동 작업 필요

---

## 📋 목차
1. [기술 스택](#기술-스택)
2. [시스템 아키텍처](#시스템-아키텍처)
3. [Supabase 활용 전략](#supabase-활용-전략)
4. [폴더 구조](#폴더-구조)
5. [개발 워크플로우](#개발-워크플로우)
6. [배포 전략](#배포-전략)

---

## 🎯 개발 전략

**핵심 원칙:**
- 1인 개발 + Claude 중심 개발
- **Supabase 올인원** 솔루션 활용
- 백엔드 서버 관리 최소화
- 모듈화 극대화
- 오픈소스 활용 극대화

**왜 Supabase인가?**
- ✅ 백엔드 서버 불필요 (Serverless)
- ✅ PostgreSQL + 인증 + 스토리지 + API 통합
- ✅ 실시간 기능 내장 (Realtime Subscriptions)
- ✅ Row Level Security로 보안 강화
- ✅ 무료 플랜으로 시작 가능
- ✅ Vercel과 완벽한 통합
- ✅ 관리 대시보드 제공

---

## 💻 기술 스택

### 📱 프론트엔드

```yaml
프레임워크: Next.js 14 (App Router)
  이유:
    - 파일 기반 라우팅
    - 서버 컴포넌트로 성능 최적화
    - Supabase SSR 지원
    - Vercel 자동 배포

언어: TypeScript
  이유:
    - 타입 안정성
    - Supabase 타입 자동 생성
    - IDE 자동완성

스타일: Tailwind CSS
  이유:
    - 유틸리티 클래스
    - 커스텀 CSS 최소화
    - 반응형 디자인 간편

UI 컴포넌트: shadcn/ui
  이유:
    - 복사-붙여넣기 가능한 컴포넌트
    - Tailwind 기반
    - 커스터마이징 자유로움
    - Radix UI 기반 (접근성 좋음)

상태 관리: Zustand (간소화) + Supabase Realtime
  이유:
    - 인증 상태는 Supabase Auth가 관리
    - UI 상태만 Zustand로 관리
    - 실시간 데이터는 Supabase Realtime

폼 관리: React Hook Form + Zod
  이유:
    - 타입 안전 검증
    - 퍼포먼스 좋음

데이터 페칭: Supabase Client + TanStack Query (선택)
  이유:
    - Supabase Client가 기본 데이터 페칭
    - TanStack Query는 복잡한 캐싱 시나리오에만 사용
```

### ⚙️ 백엔드 (Supabase)

```yaml
BaaS 플랫폼: Supabase
  역할:
    - PostgreSQL 데이터베이스
    - RESTful API 자동 생성
    - GraphQL API (선택)
    - 인증 (Auth)
    - 파일 스토리지 (Storage)
    - 실시간 구독 (Realtime)
    - Edge Functions (서버리스 함수)

데이터베이스: PostgreSQL 15+
  제공: Supabase
  특징:
    - 프로덕션급 안정성
    - JSON 컬럼 지원 (JSONB)
    - Full-text search
    - Row Level Security (RLS)
    - 자동 백업

인증: Supabase Auth
  기능:
    - 이메일/비밀번호 인증
    - 소셜 로그인 (Google, GitHub, Kakao 등)
    - Magic Link
    - JWT 토큰 자동 관리
    - 세션 관리
    - MFA (선택)

스토리지: Supabase Storage
  용도:
    - 프로필 사진
    - 게시글 첨부파일
    - 리포트 PDF
  특징:
    - S3 호환
    - CDN 자동 제공
    - 이미지 리사이징

서버리스 함수: Supabase Edge Functions
  용도:
    - 복잡한 비즈니스 로직
    - 외부 API 호출
    - AI 평가 점수 계산
    - 스케줄 작업
  런타임: Deno
```

### 🗄️ 데이터 아키텍처

```yaml
메인 DB: Supabase PostgreSQL
  테이블:
    # 인증 (Supabase Auth 자동 생성)
    - auth.users (Supabase 관리)

    # 커스텀 테이블
    - public.profiles (users 확장)
    - public.politicians (정치인)
    - public.posts (게시글)
    - public.comments (댓글)
    - public.votes (추천/비추천)
    - public.ratings (평가)
    - public.categories (카테고리)
    - public.notifications (알림)
    - public.bookmarks (북마크)
    - public.reports (신고)
    - public.user_follows (팔로우)
    - public.ai_evaluations (AI 평가)

  RLS 정책:
    - 각 테이블마다 Row Level Security 정책 설정
    - 읽기/쓰기/수정/삭제 권한 세밀하게 제어

실시간 기능:
  - 새 댓글 실시간 업데이트
  - 알림 실시간 푸시
  - 온라인 사용자 표시

파일 스토리지 Buckets:
  - avatars/ (프로필 사진)
  - post-attachments/ (게시글 첨부)
  - reports/ (리포트 PDF)
```

### 🚀 배포 & 인프라

```yaml
프론트엔드: Vercel
  - Next.js 최적화
  - 자동 배포 (Git push)
  - Edge Functions 지원
  - 무료 HTTPS
  - 커스텀 도메인
  - 환경 변수 관리

백엔드: Supabase
  - 자동 스케일링
  - 글로벌 CDN
  - 자동 백업 (Pro 플랜)
  - 모니터링 대시보드

도메인 & CDN:
  - Vercel DNS (프론트엔드)
  - Supabase CDN (파일)
  - Cloudflare (선택, DDoS 방어)

모니터링:
  - Vercel Analytics (프론트엔드)
  - Supabase Dashboard (DB, Auth, Storage)
  - Sentry (에러 트래킹, 선택)
```

### 🤖 AI & 개발 도구

```yaml
개발 에이전트:
  - Claude Code: 메인 개발
  - GitHub Copilot: 코드 자동완성
  - v0.dev: UI 프로토타입

AI 기능 (서버리스 함수):
  - 정치인 평가 AI
  - 댓글 감정 분석
  - 스팸 필터링
  - 추천 시스템

외부 API (Edge Functions에서 호출):
  - OpenAI API
  - Gemini API
  - Perplexity API
```

### 📦 기타 라이브러리

```yaml
Supabase 클라이언트:
  - @supabase/supabase-js
  - @supabase/auth-helpers-nextjs

차트/그래프:
  - Recharts (AI 평가 시각화)

날짜 처리:
  - date-fns

아이콘:
  - Lucide React

마크다운:
  - react-markdown

테스트:
  - Vitest (유닛 테스트)
  - Playwright (E2E 테스트)
```

---

## 🏗️ 시스템 아키텍처

### Before (기존 - FastAPI)
```
┌──────────────┐     REST API      ┌──────────────┐     SQL      ┌──────────┐
│   Next.js    │ ←───────────────→ │   FastAPI    │ ←──────────→ │  SQLite  │
│   Frontend   │                    │   Backend    │              │    DB    │
└──────────────┘                    └──────────────┘              └──────────┘
      ↓                                    ↓                            ↓
   Vercel                              Railway                     File-based

문제점:
  ❌ 백엔드 서버 관리 필요
  ❌ SQLite는 프로덕션 부적합
  ❌ 인증 시스템 수동 구현
  ❌ 파일 스토리지 별도 필요
  ❌ 실시간 기능 복잡
```

### After (신규 - Supabase)
```
┌──────────────────────────────────────────────────────────────┐
│                         사용자                               │
│                  (브라우저/모바일)                           │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                    Vercel CDN                                │
│              (Next.js 14 App Router)                         │
├──────────────────────────────────────────────────────────────┤
│  📱 프론트엔드                                               │
│  ┌─────────────────────────────────────────────────┐        │
│  │  Pages (App Router)                             │        │
│  │  ├── / (메인)                                   │        │
│  │  ├── /politician/[id] (정치인 상세)            │        │
│  │  ├── /community (커뮤니티)                     │        │
│  │  ├── /post/[id] (게시글 상세)                  │        │
│  │  └── /admin (관리자)                           │        │
│  │                                                 │        │
│  │  Components (shadcn/ui)                         │        │
│  │  State Management (Zustand - UI만)             │        │
│  │  Supabase Client (@supabase/supabase-js)       │        │
│  └─────────────────────────────────────────────────┘        │
└─────────────────────────┬────────────────────────────────────┘
                          │
                          │ Supabase Client SDK
                          │
                          ▼
┌──────────────────────────────────────────────────────────────┐
│                      Supabase                                │
│               (All-in-One Backend)                           │
├──────────────────────────────────────────────────────────────┤
│  🗄️ PostgreSQL Database                                     │
│  ├── auth.users (Supabase 관리)                             │
│  ├── public.profiles                                         │
│  ├── public.politicians                                      │
│  ├── public.posts                                            │
│  ├── public.comments                                         │
│  ├── public.votes                                            │
│  └── ... (기타 테이블)                                      │
│                                                              │
│  🔐 Supabase Auth                                            │
│  ├── 이메일/비밀번호 인증                                   │
│  ├── 소셜 로그인 (Google, Kakao)                            │
│  ├── JWT 토큰 자동 관리                                     │
│  └── 세션 관리                                              │
│                                                              │
│  📦 Supabase Storage                                         │
│  ├── avatars/ (프로필 사진)                                 │
│  ├── post-attachments/ (첨부파일)                           │
│  └── reports/ (리포트)                                      │
│                                                              │
│  🔴 Realtime (실시간 구독)                                   │
│  ├── 새 댓글 실시간 업데이트                                │
│  ├── 알림 실시간 푸시                                       │
│  └── 온라인 사용자 표시                                     │
│                                                              │
│  ⚡ Edge Functions (Serverless)                             │
│  ├── AI 평가 계산                                           │
│  ├── 스팸 필터링                                            │
│  ├── 외부 API 호출                                          │
│  └── 스케줄 작업                                            │
│                                                              │
│  📊 자동 생성 API                                            │
│  ├── REST API (PostgREST)                                   │
│  ├── GraphQL API (선택)                                     │
│  └── Row Level Security (RLS)                               │
└──────────────────────────────────────────────────────────────┘

장점:
  ✅ 백엔드 서버 관리 불필요
  ✅ 모든 기능 통합 (DB + Auth + Storage + API)
  ✅ 실시간 기능 내장
  ✅ Row Level Security로 보안 강화
  ✅ 자동 백업 및 스케일링
  ✅ 무료로 시작 가능
```

---

## 📂 폴더 구조

### 프론트엔드 (Next.js + Supabase)

```
politician-finder/
├── frontend/
│   ├── src/
│   │   ├── app/                          # Next.js App Router
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── politician/
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── community/
│   │   │   │   └── page.tsx
│   │   │   ├── post/
│   │   │   │   ├── [id]/page.tsx
│   │   │   │   └── write/page.tsx
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── admin/page.tsx
│   │   │
│   │   ├── components/
│   │   │   ├── ui/                       # shadcn/ui
│   │   │   ├── layout/
│   │   │   ├── politician/
│   │   │   ├── community/
│   │   │   └── auth/
│   │   │
│   │   ├── lib/
│   │   │   ├── supabase.ts              # Supabase 클라이언트
│   │   │   ├── supabase-server.ts       # 서버 컴포넌트용
│   │   │   └── utils.ts
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.ts               # Supabase Auth 훅
│   │   │   ├── usePoliticians.ts
│   │   │   └── usePosts.ts
│   │   │
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx          # Supabase Auth Context
│   │   │
│   │   ├── store/
│   │   │   └── uiStore.ts               # UI 상태만 (Zustand)
│   │   │
│   │   ├── types/
│   │   │   ├── database.types.ts        # Supabase 타입 (자동 생성)
│   │   │   └── custom.types.ts
│   │   │
│   │   └── styles/
│   │       └── globals.css
│   │
│   ├── supabase/
│   │   ├── migrations/                  # DB 마이그레이션
│   │   │   ├── 20250101000000_init.sql
│   │   │   ├── 20250102000000_add_rls.sql
│   │   │   └── ...
│   │   └── functions/                   # Edge Functions
│   │       ├── calculate-ai-score/
│   │       └── send-notification/
│   │
│   ├── .env.local                        # 환경 변수
│   ├── middleware.ts                     # 인증 미들웨어
│   ├── next.config.js
│   ├── tailwind.config.ts
│   └── package.json
│
└── 12D-GCDM_Grid/
    ├── planning_docs/                    # 기획 문서 (이 폴더)
    ├── tasks/                            # 작업 지시서
    └── project_grid_v2.0_supabase.csv   # 신규 그리드
```

---

## 🔧 Supabase 활용 전략

### 1. 데이터베이스 설계

```sql
-- profiles 테이블 (users 확장)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  is_politician BOOLEAN DEFAULT false,
  politician_id INTEGER REFERENCES politicians(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책: 모든 사용자는 프로필 읽기 가능, 본인만 수정 가능
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "프로필 읽기 공개"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "본인 프로필만 수정"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

### 2. 인증 플로우

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 회원가입
export async function signUp(email: string, password: string, username: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
      }
    }
  })

  if (error) throw error
  return data
}

// 로그인
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

// 로그아웃
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// 현재 사용자
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}
```

### 3. 데이터 CRUD

```typescript
// hooks/usePosts.ts
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function usePosts(category?: string) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPosts()
  }, [category])

  async function fetchPosts() {
    let query = supabase
      .from('posts')
      .select(`
        *,
        profiles (username, avatar_url),
        comments (count)
      `)
      .order('created_at', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) console.error(error)
    else setPosts(data)
    setLoading(false)
  }

  return { posts, loading, refetch: fetchPosts }
}
```

### 4. 실시간 구독

```typescript
// components/CommentList.tsx
useEffect(() => {
  const channel = supabase
    .channel('comments')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'comments',
        filter: `post_id=eq.${postId}`
      },
      (payload) => {
        setComments((prev) => [...prev, payload.new])
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [postId])
```

### 5. 파일 업로드

```typescript
// lib/storage.ts
export async function uploadAvatar(file: File, userId: string) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}.${fileExt}`
  const filePath = `${fileName}`

  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      upsert: true
    })

  if (error) throw error

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath)

  return publicUrl
}
```

### 6. Edge Functions (AI 평가)

```typescript
// supabase/functions/calculate-ai-score/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const { politicianId } = await req.json()

    // AI API 호출 (OpenAI, Gemini 등)
    const aiScore = await calculateAIScore(politicianId)

    // DB 업데이트
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { error } = await supabase
      .from('ai_evaluations')
      .insert({
        politician_id: politicianId,
        score: aiScore,
        updated_at: new Date()
      })

    if (error) throw error

    return new Response(
      JSON.stringify({ success: true, score: aiScore }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    )
  }
})
```

---

## 🚀 배포 전략

### 1단계: Supabase 프로젝트 설정

```bash
# Supabase CLI 설치
npm install -g supabase

# 프로젝트 초기화
supabase init

# 로컬 개발 시작
supabase start

# DB 타입 생성
npx supabase gen types typescript --local > src/types/database.types.ts
```

### 2단계: Vercel 배포

```bash
# Vercel CLI 설치
npm install -g vercel

# 프로젝트 연결
vercel link

# 환경 변수 설정
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY

# 배포
vercel --prod
```

### 3단계: CI/CD 설정

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

---

## 📊 비용 분석

### 무료 플랜 (시작)

```yaml
Supabase 무료:
  - 500MB 데이터베이스
  - 1GB 파일 스토리지
  - 5GB 대역폭/월
  - 50,000 MAU (월간 활성 사용자)
  - 2백만 Edge Function 호출/월
  비용: $0

Vercel 무료:
  - Next.js 호스팅
  - 100GB 대역폭/월
  - Serverless Functions
  비용: $0

총 비용: $0/월
```

### Pro 플랜 (성장 후)

```yaml
Supabase Pro:
  - 8GB 데이터베이스
  - 100GB 파일 스토리지
  - 50GB 대역폭/월
  - 100,000 MAU
  - 자동 백업
  비용: $25/월

Vercel 무료:
  - 계속 무료 사용 가능
  비용: $0

총 비용: $25/월
```

---

## ✅ 마이그레이션 체크리스트

### Phase 0: 기획 (완료)
- [x] Supabase 아키텍처 설계
- [x] 데이터베이스 스키마 설계
- [x] RLS 정책 설계
- [x] 기술 스택 문서 작성

### Phase 1: Supabase 설정
- [ ] Supabase 프로젝트 생성
- [ ] 환경 변수 설정
- [ ] Supabase Client 설치
- [ ] 데이터베이스 테이블 생성
- [ ] RLS 정책 적용
- [ ] Storage Buckets 생성

### Phase 2: 인증 시스템
- [ ] Auth Context 생성
- [ ] 회원가입 페이지 구현
- [ ] 로그인 페이지 구현
- [ ] 세션 관리 구현
- [ ] 보호된 라우트 설정

### Phase 3: 데이터 CRUD
- [ ] 정치인 데이터 CRUD
- [ ] 게시글 CRUD
- [ ] 댓글 CRUD
- [ ] 투표 기능
- [ ] 평가 기능

### Phase 4: 실시간 & 고급 기능
- [ ] 실시간 댓글 구독
- [ ] 실시간 알림
- [ ] 파일 업로드
- [ ] Edge Functions (AI 평가)

### Phase 5: 테스트 & 배포
- [ ] 단위 테스트
- [ ] E2E 테스트
- [ ] Vercel 배포
- [ ] 도메인 연결

---

**작성자**: Claude Code
**버전**: 2.0 (Supabase 기반)
**최종 수정**: 2025-10-16

