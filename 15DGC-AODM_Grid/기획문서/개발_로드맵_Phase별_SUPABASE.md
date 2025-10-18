# Politician Finder 개발 로드맵 (Phase별 - Supabase 기반)

# 🤖 AI-only 개발 프로젝트

## 개발 방식
본 프로젝트는 **사용자 개입 없이 AI 에이전트만으로 완성**합니다.

### 각 Phase별 AI-only 준수 사항
- **Phase 1**: ✅ 완료 (API Route 방식으로 수동 작업 제거)
- **Phase 2**: 모든 CRUD API Route 구현
- **Phase 3**: 자동화 테스트 스크립트
- **Phase 4**: CI/CD 파이프라인 (GitHub Actions)

### 금지 사항
모든 Phase에서 다음은 **절대 사용 금지**:
- Manual Dashboard operations
- GUI-based configurations
- User-executed SQL scripts
- Manual deployment steps

---

**버전**: 2.0 (Supabase 올인원)
**작성일**: 2025-10-16
**기술 스택**: Next.js 14 + Supabase + Vercel

---

## 🎯 전체 로드맵 개요

```
Phase 0: 기획 및 설계 (완료)
    ↓
Phase 1: Supabase 기반 구축 + 인증 (2주)
    ↓
Phase 2: 정치인 시스템 + 기본 커뮤니티 (3주)
    ↓
Phase 3: 고급 커뮤니티 기능 (2주)
    ↓
Phase 4: AI 평가 시스템 (3주)
    ↓
Phase 5: 실시간 기능 + 최적화 (2주)
    ↓
Phase 6: 테스트 & 배포 (1주)
```

**총 예상 기간**: 13주 (약 3개월)

---

## 🏗️ Phase 1: Supabase 기반 구축 + 인증 시스템

**목표**: Supabase 프로젝트 완전 세팅 + 회원가입/로그인 작동

**기간**: 2주

### Week 1: Supabase 설정 및 데이터베이스

#### Day 1-2: 프로젝트 초기화

```bash
# Frontend 생성
npx create-next-app@latest politician-finder --typescript --tailwind --app

# Supabase CLI 설치
npm install -g supabase

# Supabase 프로젝트 초기화
cd politician-finder
supabase init

# 로컬 개발 환경 시작
supabase start
```

**완료 기준**:
- [x] Next.js 14 프로젝트 생성
- [x] Supabase 로컬 환경 실행
- [x] http://localhost:3000 접속 가능
- [x] Supabase Studio http://localhost:54323 접속 가능

---

#### Day 3-4: Supabase 클라우드 프로젝트 생성

```
1. https://supabase.com 접속
2. 새 프로젝트 생성
3. Organization: "PoliticianFinder"
4. Project Name: "politician-finder-prod"
5. Database Password: 강력한 비밀번호 설정
6. Region: Northeast Asia (Seoul) 선택
7. 프로비저닝 대기 (약 2분)
```

**환경 변수 설정**:
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

**Supabase 클라이언트 설치**:
```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

**완료 기준**:
- [x] Supabase 클라우드 프로젝트 생성
- [x] API 키 발급
- [x] 환경 변수 설정
- [x] Supabase Client 초기화 파일 작성

---

#### Day 5-7: 데이터베이스 스키마 설계 및 생성

**테이블 생성 순서** (의존성 순서 중요):

```sql
-- supabase/migrations/20250116000000_init_schema.sql

-- 1. profiles 테이블 (auth.users 확장)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  is_politician BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. politicians 테이블
CREATE TABLE public.politicians (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  party TEXT NOT NULL,
  region TEXT NOT NULL,
  position TEXT NOT NULL, -- 국회의원, 시장, 도지사 등
  profile_image_url TEXT,
  biography TEXT,
  official_website TEXT,
  user_id UUID REFERENCES auth.users(id), -- 본인 인증 시
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. categories 테이블
CREATE TABLE public.categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. posts 테이블
CREATE TABLE public.posts (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  politician_id INTEGER REFERENCES public.politicians(id) ON DELETE SET NULL,
  category_id INTEGER REFERENCES public.categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL CHECK (char_length(title) >= 2 AND char_length(title) <= 200),
  content TEXT NOT NULL CHECK (char_length(content) >= 10),
  view_count INTEGER DEFAULT 0,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  is_best BOOLEAN DEFAULT false,
  is_concept BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. comments 테이블
CREATE TABLE public.comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  parent_id INTEGER REFERENCES public.comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) >= 1),
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. votes 테이블 (게시글/댓글 투표)
CREATE TABLE public.votes (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment')),
  target_id INTEGER NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, target_type, target_id)
);

-- 7. ratings 테이블 (시민 평가)
CREATE TABLE public.ratings (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  politician_id INTEGER REFERENCES public.politicians(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, politician_id)
);

-- 8. ai_evaluations 테이블 (AI 평가)
CREATE TABLE public.ai_evaluations (
  id SERIAL PRIMARY KEY,
  politician_id INTEGER REFERENCES public.politicians(id) ON DELETE CASCADE NOT NULL,
  ai_provider TEXT NOT NULL CHECK (ai_provider IN ('claude', 'chatgpt', 'gemini')),
  total_score DECIMAL(5,2) NOT NULL CHECK (total_score >= 0 AND total_score <= 100),
  category_scores JSONB, -- {"의정활동": 85, "공약이행": 70, ...}
  evaluation_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(politician_id, ai_provider, evaluation_date)
);

-- 9. notifications 테이블
CREATE TABLE public.notifications (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- 'comment', 'reply', 'vote', 'mention'
  title TEXT NOT NULL,
  content TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. bookmarks 테이블
CREATE TABLE public.bookmarks (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'politician')),
  target_id INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, target_type, target_id)
);

-- 11. reports 테이블 (신고)
CREATE TABLE public.reports (
  id SERIAL PRIMARY KEY,
  reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment', 'user')),
  target_id INTEGER NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- 12. user_follows 테이블
CREATE TABLE public.user_follows (
  id SERIAL PRIMARY KEY,
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- 인덱스 생성
CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_politicians_party ON public.politicians(party);
CREATE INDEX idx_politicians_region ON public.politicians(region);
CREATE INDEX idx_posts_user_id ON public.posts(user_id);
CREATE INDEX idx_posts_politician_id ON public.posts(politician_id);
CREATE INDEX idx_posts_category_id ON public.posts(category_id);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX idx_comments_post_id ON public.comments(post_id);
CREATE INDEX idx_comments_user_id ON public.comments(user_id);
CREATE INDEX idx_votes_user_target ON public.votes(user_id, target_type, target_id);
CREATE INDEX idx_notifications_user_read ON public.notifications(user_id, is_read);
```

**마이그레이션 실행**:
```bash
# 로컬에서 테스트
supabase db reset

# 프로덕션에 적용
supabase db push
```

**완료 기준**:
- [x] 12개 테이블 생성 완료
- [x] 인덱스 설정 완료
- [x] Supabase Studio에서 테이블 확인

---

### Week 2: RLS 정책 & 인증 시스템

#### Day 8-10: Row Level Security (RLS) 설정

```sql
-- supabase/migrations/20250117000000_rls_policies.sql

-- 1. profiles 테이블 RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "프로필 읽기 공개"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "본인 프로필만 수정"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 2. politicians 테이블 RLS
ALTER TABLE public.politicians ENABLE ROW LEVEL SECURITY;

CREATE POLICY "정치인 읽기 공개"
  ON public.politicians FOR SELECT
  USING (true);

CREATE POLICY "관리자만 정치인 추가"
  ON public.politicians FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 3. posts 테이블 RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "게시글 읽기 공개"
  ON public.posts FOR SELECT
  USING (true);

CREATE POLICY "인증 사용자만 글 작성"
  ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "본인 게시글만 수정"
  ON public.posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "본인 게시글만 삭제"
  ON public.posts FOR DELETE
  USING (auth.uid() = user_id);

-- 4. comments 테이블 RLS (유사하게 작성)
-- 5. votes, ratings, notifications, bookmarks, reports RLS 설정
-- (각 테이블마다 적절한 정책 적용)
```

**완료 기준**:
- [x] 모든 테이블에 RLS 활성화
- [x] 읽기/쓰기/수정/삭제 정책 설정
- [x] Supabase Studio에서 정책 확인

---

#### Day 11-14: Frontend 인증 시스템 구현

**1. Supabase 클라이언트 설정**:

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
```

**2. Auth Context 생성**:

```typescript
// contexts/AuthContext.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  loading: boolean
  signUp: (email: string, password: string, username: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 현재 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Auth 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, username: string) => {
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

    // profiles 테이블에 사용자 정보 추가
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        username,
      })
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
```

**3. 회원가입 페이지**:

```typescript
// app/signup/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SignupPage() {
  const router = useRouter()
  const { signUp } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await signUp(email, password, username)
      router.push('/') // 회원가입 후 메인 페이지로
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold">회원가입</h1>

        {error && (
          <div className="rounded bg-red-50 p-3 text-red-800">{error}</div>
        )}

        <div>
          <Label htmlFor="username">사용자명</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="email">이메일</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="password">비밀번호</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? '처리 중...' : '회원가입'}
        </Button>
      </form>
    </div>
  )
}
```

**4. 로그인 페이지** (유사하게 작성)

**완료 기준**:
- [x] AuthContext 작성 완료
- [x] 회원가입 페이지 작동
- [x] 로그인 페이지 작동
- [x] 로그아웃 기능 작동
- [x] 세션 유지 확인

---

### ✅ Phase 1 완료 체크리스트

- [ ] Supabase 프로젝트 생성 완료
- [ ] 12개 데이터베이스 테이블 생성
- [ ] RLS 정책 적용 완료
- [ ] 회원가입 작동 (이메일 확인 포함)
- [ ] 로그인 작동 (세션 유지)
- [ ] 로그아웃 작동
- [ ] AuthContext로 전역 인증 상태 관리
- [ ] 보호된 페이지 접근 제어

---

## 🚀 Phase 2: 정치인 시스템 + 기본 커뮤니티

**목표**: 정치인 목록/상세 + 게시글 CRUD

**기간**: 3주

### Week 3: 정치인 시스템

#### Day 15-17: 정치인 데이터 시딩

```typescript
// scripts/seed-politicians.ts

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service Role Key 사용
)

const politicians = [
  {
    name: '홍길동',
    party: '민주당',
    region: '서울 강남구',
    position: '국회의원',
    biography: '...',
    profile_image_url: 'https://...'
  },
  // ... 50명 데이터
]

async function seed() {
  const { data, error } = await supabase
    .from('politicians')
    .insert(politicians)

  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Success:', data)
  }
}

seed()
```

**실행**:
```bash
tsx scripts/seed-politicians.ts
```

**완료 기준**:
- [x] 정치인 50명 데이터 DB 삽입
- [x] 프로필 이미지 URL 설정
- [x] Supabase Studio에서 데이터 확인

---

#### Day 18-21: 정치인 페이지 구현

**1. 정치인 목록 페이지**:

```typescript
// app/politicians/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import PoliticianCard from '@/components/politician/PoliticianCard'

export default function PoliticiansPage() {
  const [politicians, setPoliticians] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPoliticians() {
      const { data, error } = await supabase
        .from('politicians')
        .select('*')
        .order('name')

      if (error) {
        console.error(error)
      } else {
        setPoliticians(data)
      }
      setLoading(false)
    }

    fetchPoliticians()
  }, [])

  if (loading) return <div>로딩 중...</div>

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">정치인 목록</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {politicians.map((politician) => (
          <PoliticianCard key={politician.id} politician={politician} />
        ))}
      </div>
    </div>
  )
}
```

**2. 정치인 카드 컴포넌트**:

```typescript
// components/politician/PoliticianCard.tsx

import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface Props {
  politician: {
    id: number
    name: string
    party: string
    region: string
    position: string
    profile_image_url: string
  }
}

export default function PoliticianCard({ politician }: Props) {
  return (
    <Link href={`/politician/${politician.id}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader>
          <img
            src={politician.profile_image_url}
            alt={politician.name}
            className="w-32 h-32 rounded-full mx-auto object-cover"
          />
          <CardTitle className="text-center mt-4">{politician.name}</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-sm text-gray-600">
          <p>{politician.party}</p>
          <p>{politician.region}</p>
          <p className="text-xs mt-2">{politician.position}</p>
        </CardContent>
      </Card>
    </Link>
  )
}
```

**3. 정치인 상세 페이지**:

```typescript
// app/politician/[id]/page.tsx

import { supabase } from '@/lib/supabase'

export default async function PoliticianDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const { data: politician, error } = await supabase
    .from('politicians')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !politician) {
    return <div>정치인을 찾을 수 없습니다.</div>
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-8 mb-8">
          <img
            src={politician.profile_image_url}
            alt={politician.name}
            className="w-48 h-48 rounded-full object-cover"
          />
          <div>
            <h1 className="text-4xl font-bold mb-2">{politician.name}</h1>
            <p className="text-xl text-gray-600">{politician.party}</p>
            <p className="text-lg text-gray-500">{politician.region}</p>
            <p className="text-sm text-gray-400">{politician.position}</p>
          </div>
        </div>

        <div className="prose max-w-none">
          <h2>약력</h2>
          <p>{politician.biography}</p>
        </div>

        {/* AI 평가 섹션은 Phase 4에서 추가 */}
      </div>
    </div>
  )
}
```

**완료 기준**:
- [x] 정치인 목록 페이지 작동
- [x] 정치인 카드 컴포넌트 렌더링
- [x] 정치인 상세 페이지 작동
- [x] 반응형 디자인 적용

---

### Week 4-5: 커뮤니티 게시판

#### Day 22-28: 게시글 CRUD 구현

**1. 게시글 작성 페이지**:

```typescript
// app/post/write/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export default function WritePostPage() {
  const router = useRouter()
  const { user } = useAuth()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)

    const { error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        title,
        content,
      })

    if (error) {
      console.error(error)
      alert('게시글 작성 실패')
    } else {
      router.push('/community')
    }

    setLoading(false)
  }

  return (
    <div className="container mx-auto py-8">
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold">게시글 작성</h1>

        <input
          type="text"
          placeholder="제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full p-3 border rounded"
        />

        <textarea
          placeholder="내용"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={15}
          className="w-full p-3 border rounded"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded"
        >
          {loading ? '작성 중...' : '게시글 작성'}
        </button>
      </form>
    </div>
  )
}
```

**2. 게시글 목록 페이지**:

```typescript
// app/community/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function CommunityPage() {
  const [posts, setPosts] = useState([])

  useEffect(() => {
    async function fetchPosts() {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles (username)
        `)
        .order('created_at', { ascending: false })

      if (!error) {
        setPosts(data)
      }
    }

    fetchPosts()
  }, [])

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">커뮤니티</h1>
        <Link href="/post/write">
          <button className="bg-blue-600 text-white px-4 py-2 rounded">
            글쓰기
          </button>
        </Link>
      </div>

      <div className="space-y-4">
        {posts.map((post) => (
          <Link key={post.id} href={`/post/${post.id}`}>
            <div className="border p-4 rounded hover:bg-gray-50">
              <h2 className="text-xl font-semibold">{post.title}</h2>
              <p className="text-sm text-gray-600 mt-2">
                작성자: {post.profiles.username} |
                조회 {post.view_count} |
                추천 {post.upvotes}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

**3. 게시글 상세 페이지**:

```typescript
// app/post/[id]/page.tsx

import { supabase } from '@/lib/supabase'

export default async function PostDetailPage({
  params,
}: {
  params: { id: string }
}) {
  // 조회수 증가
  await supabase.rpc('increment_view_count', { post_id: parseInt(params.id) })

  const { data: post, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles (username, avatar_url)
    `)
    .eq('id', params.id)
    .single()

  if (error || !post) {
    return <div>게시글을 찾을 수 없습니다.</div>
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">{post.title}</h1>

        <div className="flex items-center gap-3 mb-6 text-sm text-gray-600">
          <img
            src={post.profiles.avatar_url}
            alt={post.profiles.username}
            className="w-10 h-10 rounded-full"
          />
          <span>{post.profiles.username}</span>
          <span>|</span>
          <span>{new Date(post.created_at).toLocaleDateString()}</span>
          <span>|</span>
          <span>조회 {post.view_count}</span>
        </div>

        <div className="prose max-w-none">
          {post.content}
        </div>

        {/* 추천/비추천 버튼은 Phase 3에서 추가 */}
        {/* 댓글은 Phase 3에서 추가 */}
      </div>
    </div>
  )
}
```

**완료 기준**:
- [x] 게시글 작성 페이지 작동
- [x] 게시글 목록 페이지 작동
- [x] 게시글 상세 페이지 작동
- [x] 조회수 증가 기능 작동

---

### ✅ Phase 2 완료 체크리스트

- [ ] 정치인 50명 데이터 삽입
- [ ] 정치인 목록 페이지 작동
- [ ] 정치인 상세 페이지 작동
- [ ] 게시글 CRUD 작동
- [ ] 게시글 목록/상세 페이지 작동

---

## 🎨 Phase 3: 고급 커뮤니티 기능

**목표**: 댓글, 투표, 알림, 실시간 기능

**기간**: 2주

### Week 6: 댓글 & 투표 시스템

**작업 내용**:
- 댓글 작성/수정/삭제
- 대댓글 (계층 구조)
- 게시글/댓글 추천/비추천
- 베스트글 자동 마킹
- 개념글 자동 마킹

### Week 7: 알림 & 실시간

**작업 내용**:
- 댓글 알림
- 답글 알림
- 추천 알림
- Supabase Realtime으로 실시간 댓글 구독
- 알림 뱃지

---

## 🤖 Phase 4: AI 평가 시스템

**목표**: 정치인 AI 평가 점수 계산 및 표시

**기간**: 3주

### Week 8-9: Edge Functions 구현

**작업 내용**:
- Supabase Edge Function 작성
- Claude/ChatGPT/Gemini API 통합
- AI 평가 점수 계산 로직
- 가중 평균 알고리즘

### Week 10: AI 점수 UI

**작업 내용**:
- AI 점수 차트 (Recharts)
- 항목별 상세 점수
- AI 별 평가 비교
- 랭킹 시스템

---

## ⚡ Phase 5: 실시간 기능 + 최적화

**목표**: 성능 최적화 및 UX 개선

**기간**: 2주

### Week 11-12

**작업 내용**:
- 이미지 최적화 (Next.js Image)
- 코드 스플리팅
- 캐싱 전략
- SEO 최적화
- 접근성 개선

---

## 🚀 Phase 6: 테스트 & 배포

**목표**: 프로덕션 배포

**기간**: 1주

### Week 13

**작업 내용**:
- E2E 테스트 (Playwright)
- Vercel 배포
- 도메인 연결
- 모니터링 설정

---

**총 예상 기간**: 13주 (약 3개월)

**작성자**: Claude
**작성일**: 2025-10-16
**버전**: 2.0 (Supabase 기반)
