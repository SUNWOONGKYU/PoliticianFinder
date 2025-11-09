# 작업지시서: P1BI1

## 📋 기본 정보

- **작업 ID**: P1BI1
- **업무명**: Supabase 클라이언트 설정
- **Phase**: Phase 1
- **Area**: Backend Infrastructure (BI)
- **서브 에이전트**: backend-developer
- **작업 방식**: AI-Only

---

## 🎯 작업 목표

Next.js App Router에서 사용할 Supabase 클라이언트를 초기화합니다.

**핵심 요구사항:**
1. **클라이언트 컴포넌트용** Supabase 클라이언트 생성 (브라우저 환경)
2. **서버 컴포넌트용** Supabase 클라이언트 생성 (SSR 환경)
3. 환경 변수를 통한 Supabase 프로젝트 연결 설정
4. TypeScript 타입 안전성 확보

**클라이언트 vs 서버 구분 이유:**
- **클라이언트 컴포넌트**: 브라우저에서 실행, 사용자 세션 기반 인증
- **서버 컴포넌트**: 서버에서 실행, 서비스 역할 키 또는 사용자 세션 쿠키 사용

---

## 🔧 사용 도구

```
[Claude 도구]
Read, Edit, Write, Grep, Glob, Bash

[기술 스택]
TypeScript, Next.js, Supabase

[전문 스킬]
api-builder, database-connector
```

**도구 설명**:
- **Claude 도구**: Claude Code의 기본 기능 (Read, Write, Edit, Bash, Glob, Grep 등)
- **기술 스택**: 프로젝트에 사용되는 프레임워크 및 라이브러리
- **전문 스킬**: Anthropic 빌트인 스킬 (.claude/skills/*.md 참조)

## 🔗 의존성 정보

**의존성 체인**: 없음

이 작업은 독립적으로 시작할 수 있습니다.

---

## 📦 기대 결과물

**생성할 파일:**
1. `lib/supabase/client.ts` - 클라이언트 컴포넌트용 Supabase 클라이언트
2. `lib/supabase/server.ts` - 서버 컴포넌트/API Route용 Supabase 클라이언트
3. `.env.local` - 환경 변수 설정 파일 (또는 기존 파일에 추가)

**각 파일의 역할:**
- **client.ts**: `'use client'` 컴포넌트에서 사용, 브라우저 환경에서 실행
- **server.ts**: Server Components, API Routes, Server Actions에서 사용

**설치 필요 패키지:**
```bash
npm install @supabase/supabase-js @supabase/ssr
```

---

## 💾 구현 파일 저장 위치

**루트 폴더**: `2_Backend_Infrastructure/lib/supabase/`

**파일 경로**:
```
2_Backend_Infrastructure/
└── lib/
    └── supabase/
        ├── client.ts       # Supabase 클라이언트 (브라우저용)
        └── server.ts       # Supabase 서버 클라이언트 (SSR용)
```

**절대 경로 별칭**: `@/` (예: `import { supabase } from '@/lib/supabase/client'`)

---

## 📝 작업 지시사항

### 1. 준비 단계

#### 1.1 패키지 설치
```bash
cd 2_Backend_Infrastructure
npm install @supabase/supabase-js @supabase/ssr
```

#### 1.2 Supabase 프로젝트 정보 확인
현재 프로젝트의 Supabase 정보:
- **Project ID**: `ooddlafwdpzgxfefgsrx`
- **Project URL**: `https://ooddlafwdpzgxfefgsrx.supabase.co`
- **Anon Key**: Supabase Dashboard에서 확인 필요

Supabase Dashboard (https://supabase.com/dashboard) → 프로젝트 선택 → Settings → API에서 확인

#### 1.3 환경 변수 설정 (.env.local)
`.env.local` 파일을 생성하거나 기존 파일에 다음 내용 추가:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://ooddlafwdpzgxfefgsrx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**환경 변수 설명:**
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL (클라이언트에서도 접근 가능)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: 익명 키 (공개 가능, 클라이언트에서 사용)
- `SUPABASE_SERVICE_ROLE_KEY`: 서비스 역할 키 (서버 전용, 절대 공개 금지!)

---

### 2. 구현 단계

#### 2.1 클라이언트 컴포넌트용 Supabase 클라이언트 생성

**파일**: `2_Backend_Infrastructure/lib/supabase/client.ts`

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

/**
 * 클라이언트 컴포넌트에서 사용하는 Supabase 클라이언트
 * 브라우저 환경에서만 실행됨
 *
 * @example
 * 'use client'
 *
 * import { supabase } from '@/lib/supabase/client'
 *
 * const { data, error } = await supabase
 *   .from('politicians')
 *   .select('*')
 */
export const createClient = () => {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**구현 포인트:**
- `createBrowserClient`는 브라우저 환경에서 실행됨
- `NEXT_PUBLIC_` 접두사가 있는 환경 변수만 사용 (클라이언트에서 접근 가능)
- TypeScript 제네릭으로 `Database` 타입 전달 (타입 안전성)

---

#### 2.2 서버 컴포넌트용 Supabase 클라이언트 생성

**파일**: `2_Backend_Infrastructure/lib/supabase/server.ts`

```typescript
// lib/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

/**
 * 서버 컴포넌트 및 API Route에서 사용하는 Supabase 클라이언트
 *
 * @example
 * // Server Component
 * import { createClient } from '@/lib/supabase/server'
 *
 * export default async function Page() {
 *   const supabase = createClient()
 *   const { data } = await supabase.from('politicians').select('*')
 *   return <div>{JSON.stringify(data)}</div>
 * }
 *
 * @example
 * // API Route
 * import { createClient } from '@/lib/supabase/server'
 *
 * export async function GET(request: Request) {
 *   const supabase = createClient()
 *   const { data, error } = await supabase.from('users').select('*')
 *   return Response.json({ data, error })
 * }
 */
export const createClient = () => {
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Server Component에서 쿠키 설정 시도 시 에러 발생 가능
            // (읽기 전용 모드일 경우)
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Server Component에서 쿠키 삭제 시도 시 에러 발생 가능
          }
        },
      },
    }
  )
}

/**
 * 서비스 역할 키를 사용하는 관리자용 Supabase 클라이언트
 * RLS(Row Level Security)를 우회하여 모든 데이터에 접근 가능
 *
 * ⚠️ 주의: 서버 사이드에서만 사용해야 하며, 절대 클라이언트에 노출되면 안 됨!
 *
 * @example
 * import { createAdminClient } from '@/lib/supabase/server'
 *
 * export async function POST(request: Request) {
 *   const supabase = createAdminClient()
 *   // RLS 우회하여 모든 사용자 데이터 조회 가능
 *   const { data } = await supabase.from('users').select('*')
 *   return Response.json({ data })
 * }
 */
export const createAdminClient = () => {
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // 서비스 역할 키 사용
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // 에러 무시
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // 에러 무시
          }
        },
      },
    }
  )
}
```

**구현 포인트:**
- `createServerClient`는 Next.js 쿠키를 사용하여 세션 관리
- `createClient`: 일반 사용자 세션 기반 (RLS 적용됨)
- `createAdminClient`: 서비스 역할 키 사용 (RLS 우회, 관리자 작업용)
- `try-catch`로 쿠키 설정 에러 처리 (Server Component에서 쿠키 수정 불가능한 경우 대비)

---

#### 2.3 사용 예시

**클라이언트 컴포넌트에서 사용:**
```typescript
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function PoliticianList() {
  const [politicians, setPoliticians] = useState([])
  const supabase = createClient()

  useEffect(() => {
    async function fetchPoliticians() {
      const { data, error } = await supabase
        .from('politicians')
        .select('*')
        .limit(10)

      if (data) setPoliticians(data)
    }

    fetchPoliticians()
  }, [])

  return <div>{/* 정치인 목록 렌더링 */}</div>
}
```

**서버 컴포넌트에서 사용:**
```typescript
// app/politicians/page.tsx
import { createClient } from '@/lib/supabase/server'

export default async function PoliticiansPage() {
  const supabase = createClient()

  const { data: politicians, error } = await supabase
    .from('politicians')
    .select('*')
    .limit(10)

  if (error) {
    return <div>Error: {error.message}</div>
  }

  return (
    <div>
      {politicians.map((politician) => (
        <div key={politician.id}>{politician.name}</div>
      ))}
    </div>
  )
}
```

**API Route에서 사용:**
```typescript
// app/api/politicians/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('politicians')
    .select('*')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
```

**관리자 작업 (RLS 우회):**
```typescript
// app/api/admin/users/route.ts
import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // ⚠️ 반드시 관리자 인증 확인 후 사용!
  const supabase = createAdminClient()

  // RLS 우회하여 모든 사용자 조회
  const { data, error } = await supabase
    .from('users')
    .select('*')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
```

### 3. 검증 단계

#### 3.1 TypeScript 타입 체크
```bash
npm run type-check
# 또는
npx tsc --noEmit
```

**확인 사항:**
- `Database` 타입을 import 시 에러 없는지 확인
- 환경 변수 타입 에러 없는지 확인 (process.env.NEXT_PUBLIC_*)

#### 3.2 Lint 검사
```bash
npm run lint
```

#### 3.3 연결 테스트

**간단한 테스트 API 작성:**
```typescript
// app/api/test-supabase/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createClient()

    // 간단한 쿼리로 연결 테스트
    const { data, error } = await supabase
      .from('politicians')
      .select('id')
      .limit(1)

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase connection successful',
      data
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 })
  }
}
```

**테스트 실행:**
```bash
# 개발 서버 시작
npm run dev

# 브라우저 또는 curl로 테스트
curl http://localhost:3000/api/test-supabase
```

**예상 응답:**
```json
{
  "success": true,
  "message": "Supabase connection successful",
  "data": [...]
}
```

#### 3.4 환경 변수 확인

**.env.local 파일이 올바르게 설정되었는지 확인:**
```bash
# Next.js에서 환경 변수 로드 확인
npm run dev
```

**브라우저 콘솔에서 클라이언트 환경 변수 확인 (공개 변수만 보임):**
```javascript
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
// 출력: https://ooddlafwdpzgxfefgsrx.supabase.co
```

⚠️ **주의**: `SUPABASE_SERVICE_ROLE_KEY`는 절대 클라이언트에 노출되면 안 됨!

---

### 4. 완료 단계

#### 4.1 생성된 파일 확인
```bash
ls -la 2_Backend_Infrastructure/lib/supabase/
# client.ts (클라이언트용)
# server.ts (서버용)
```

#### 4.2 .gitignore 확인
`.env.local` 파일이 Git에 커밋되지 않도록 확인:
```bash
# .gitignore에 다음 내용이 있는지 확인
cat .gitignore | grep .env.local
```

없다면 추가:
```bash
echo ".env.local" >> .gitignore
```

#### 4.3 다음 작업 의존성 확인

이 작업이 완료되면 다음 작업들이 Supabase 클라이언트를 사용할 수 있습니다:
- **P1BI2** (API 미들웨어) - Supabase 인증 검증에 사용
- **P1BA2, P1BA3, P1BA4** (Mock API들) - Supabase 데이터 조회에 사용
- 모든 Backend API 작업들

#### 4.4 PROJECT GRID 상태 업데이트
- 작업 상태: "완료"로 변경
- 생성된 파일: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `.env.local` 기록
- 테스트 결과: 연결 테스트 성공 여부 기록

---

## ✅ 완료 기준

- [ ] `lib/supabase/client.ts` 파일 생성 완료
- [ ] `lib/supabase/server.ts` 파일 생성 완료 (`createClient`, `createAdminClient` 포함)
- [ ] `.env.local` 파일에 Supabase 환경 변수 3개 설정 완료
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `@supabase/supabase-js`, `@supabase/ssr` 패키지 설치 완료
- [ ] TypeScript 타입 체크 통과 (`npm run type-check`)
- [ ] Lint 검사 통과 (`npm run lint`)
- [ ] Supabase 연결 테스트 성공 (테스트 API 호출 성공)
- [ ] 클라이언트 컴포넌트에서 `createClient` import 및 사용 가능
- [ ] 서버 컴포넌트/API Route에서 `createClient` 사용 가능
- [ ] `.gitignore`에 `.env.local` 추가 확인
- [ ] PROJECT GRID 상태 업데이트 완료

---

**작업지시서 생성일**: 2025-11-06
**PROJECT GRID Version**: v4.0
