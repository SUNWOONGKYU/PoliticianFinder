# 작업지시서: P1BI3

## 📋 기본 정보

- **작업 ID**: P1BI3
- **업무명**: Database Types 생성
- **Phase**: Phase 1
- **Area**: Backend Infrastructure (BI)
- **서브 에이전트**: backend-developer
- **작업 방식**: AI-Only

---

## 🎯 작업 목표

Supabase Schema → TypeScript Types 자동 생성

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

**의존성 체인**: P1BI1, P2D1

이 작업을 시작하기 전에 다음 작업이 완료되어야 합니다: P1BI1, P2D1

---

## 📦 기대 결과물

- types/database.ts (Supabase CLI 자동 생성)

**구현해야 할 세부 항목**:

1. Supabase CLI로 타입 생성 명령 실행
2. types/database.ts 파일 생성
3. TypeScript 설정 업데이트
4. 타입 안전성 검증

각 항목을 체계적으로 구현하고 테스트하세요.

---

## 💾 구현 파일 저장 위치

**루트 폴더**: `2_Backend_Infrastructure/types/`

**파일 경로**:
```
2_Backend_Infrastructure/
└── types/
    └── database.ts       # Supabase 자동 생성 타입
```

**생성 명령어**:
```bash
npx supabase gen types typescript --project-id ooddlafwdpzgxfefgsrx > 2_Backend_Infrastructure/types/database.ts
```

**절대 경로 별칭**: `@/` (예: `import type { Database } from '@/types/database'`)

---

## 📝 작업 지시사항

### 1. 준비 단계

#### 1.1 Supabase CLI 설치
```bash
npm install -g supabase
# 또는 프로젝트 로컬에 설치
npm install -D supabase
```

#### 1.2 Supabase 로그인 및 프로젝트 연결
```bash
# Supabase 로그인
npx supabase login

# 프로젝트 연결 (선택사항 - 로컬에서 타입 생성 시)
npx supabase link --project-ref ooddlafwdpzgxfefgsrx
```

**필요한 정보:**
- Project ID: `ooddlafwdpzgxfefgsrx`
- Database Password: Supabase Dashboard에서 확인

#### 1.3 의존성 확인
- **P1BI1** (Supabase 클라이언트) 작업 완료 확인
- **P2D1** (Database 스키마) 작업 완료 확인 (**중요!**)
  - P2D1에서 생성한 모든 테이블이 Supabase에 적용되어야 함
  - 테이블이 없으면 타입이 생성되지 않음

---

### 2. 구현 단계

#### 2.1 Database Types 생성 명령 실행

**방법 1: Supabase CLI 사용 (권장)**
```bash
cd 2_Backend_Infrastructure

# Supabase에서 타입 자동 생성
npx supabase gen types typescript \
  --project-id ooddlafwdpzgxfefgsrx \
  --schema public \
  > types/database.ts
```

**방법 2: REST API 사용 (대안)**
```bash
curl -s "https://api.supabase.com/v1/projects/ooddlafwdpzgxfefgsrx/types/typescript" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  > types/database.ts
```

**생성된 파일 예시:**
```typescript
// types/database.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          created_at: string
          // ...
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          created_at?: string
          // ...
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          // ...
        }
        Relationships: []
      }
      politicians: {
        Row: {
          id: string
          name: string
          party: string
          // ...
        }
        Insert: {
          // ...
        }
        Update: {
          // ...
        }
        Relationships: []
      }
      // ... 다른 테이블들
    }
    Views: {
      // Views가 있다면
    }
    Functions: {
      // 함수가 있다면
    }
    Enums: {
      // Enum이 있다면
    }
    CompositeTypes: {
      // 복합 타입이 있다면
    }
  }
}
```

---

#### 2.2 TypeScript 설정 업데이트

**tsconfig.json 확인 및 수정:**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@/types/*": ["./types/*"]
    },
    "types": ["node"],
    // ... 기타 설정
  },
  "include": [
    "types/**/*.ts",
    "lib/**/*.ts",
    "app/**/*.ts",
    "app/**/*.tsx"
  ]
}
```

**package.json에 타입 생성 스크립트 추가:**
```json
{
  "scripts": {
    "types:generate": "npx supabase gen types typescript --project-id ooddlafwdpzgxfefgsrx --schema public > types/database.ts",
    "types:update": "npm run types:generate && npm run type-check"
  }
}
```

---

#### 2.3 생성된 타입 사용 예시

**Supabase 클라이언트에서 타입 사용:**
```typescript
// lib/supabase/client.ts (이미 P1BI1에서 생성됨)
import { createBrowserClient } from '@/lib/supabase/ssr'
import type { Database } from '@/types/database'

export const createClient = () => {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**API에서 타입 안전한 쿼리:**
```typescript
// app/api/politicians/route.ts
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

export async function GET() {
  const supabase = createClient()

  // 타입 안전한 쿼리
  const { data, error } = await supabase
    .from('politicians') // 'politicians' 테이블 자동 완성
    .select('id, name, party') // 필드 자동 완성 및 검증
    .limit(10)

  // data 타입이 자동으로 추론됨:
  // data: Database['public']['Tables']['politicians']['Row'][] | null

  return Response.json({ data, error })
}
```

**타입 추출 및 재사용:**
```typescript
// lib/types/politician.ts
import type { Database } from '@/types/database'

// 테이블 Row 타입 추출
export type Politician = Database['public']['Tables']['politicians']['Row']

// Insert 타입 추출
export type PoliticianInsert = Database['public']['Tables']['politicians']['Insert']

// Update 타입 추출
export type PoliticianUpdate = Database['public']['Tables']['politicians']['Update']

// 사용 예시
export async function createPolitician(data: PoliticianInsert) {
  const supabase = createClient()

  const { data: politician, error } = await supabase
    .from('politicians')
    .insert(data)
    .select()
    .single()

  return { politician, error }
}
```

### 3. 검증 단계

#### 3.1 생성된 파일 확인
```bash
# types/database.ts 파일이 생성되었는지 확인
ls -lh types/database.ts

# 파일 크기 확인 (최소 수 KB 이상이어야 함)
wc -l types/database.ts
```

#### 3.2 타입 내용 확인
```typescript
// types/database.ts 파일을 열어서 다음 내용 확인

// 1. Database interface가 존재하는가?
export interface Database {
  public: {
    Tables: {
      // 2. P2D1에서 생성한 테이블들이 모두 포함되어 있는가?
      users: { ... }
      politicians: { ... }
      posts: { ... }
      comments: { ... }
      // ... 기타 테이블들
    }
  }
}

// 3. 각 테이블에 Row, Insert, Update 타입이 있는가?
```

**확인할 테이블 목록 (P2D1 참조):**
- users
- politicians
- careers
- pledges
- posts
- comments
- post_likes, comment_likes
- follows
- notifications
- user_favorites
- ai_evaluations
- reports
- shares
- politician_verification
- audit_logs
- advertisements
- policies
- notification_templates
- system_settings
- admin_actions

#### 3.3 TypeScript 타입 체크
```bash
# 타입 체크 실행
npm run type-check

# 또는
npx tsc --noEmit
```

**예상 결과:**
- 타입 에러 없음
- `Database` 타입이 정상적으로 인식됨

#### 3.4 import 테스트
```typescript
// 임시 테스트 파일 생성: test-types.ts
import type { Database } from '@/types/database'

// 타입 추출 테스트
type UsersTable = Database['public']['Tables']['users']
type UserRow = UsersTable['Row']
type UserInsert = UsersTable['Insert']
type UserUpdate = UsersTable['Update']

// IDE에서 자동 완성이 작동하는지 확인
const testUser: UserRow = {
  id: '',
  email: '',
  name: null,
  created_at: '',
  // ... IDE가 필드를 자동 완성해주는지 확인
}
```

#### 3.5 Supabase 클라이언트 통합 테스트
```typescript
// app/api/test-types/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()

  // 타입 안전한 쿼리
  const { data: politicians } = await supabase
    .from('politicians')
    .select('id, name, party')
    .limit(5)

  // politicians 변수에 마우스를 올려보면 타입이 표시되어야 함
  // Database['public']['Tables']['politicians']['Row'][]

  return NextResponse.json({ politicians })
}
```

**테스트 실행:**
```bash
npm run dev
curl http://localhost:3000/api/test-types
```

---

### 4. 완료 단계

#### 4.1 생성된 파일 확인
```bash
ls -lh types/database.ts
# 파일이 존재하고, 크기가 0이 아닌지 확인
```

#### 4.2 package.json 스크립트 확인
```json
{
  "scripts": {
    "types:generate": "...",
    "types:update": "..."
  }
}
```

#### 4.3 타입 업데이트 프로세스 문서화
**스키마 변경 시 타입 업데이트 방법:**
```bash
# 1. Supabase에서 스키마 변경 (P2D1 마이그레이션 실행)
cd 4_Database
npx supabase db push

# 2. 타입 재생성
cd ../2_Backend_Infrastructure
npm run types:generate

# 3. 타입 체크
npm run type-check
```

#### 4.4 다음 작업 의존성 확인

이 작업이 완료되면 다음 작업들이 타입 안전성을 확보할 수 있습니다:
- **모든 Backend API** - 타입 안전한 Supabase 쿼리 사용
- **Frontend 컴포넌트** - 타입 안전한 데이터 핸들링

#### 4.5 PROJECT GRID 상태 업데이트
- 작업 상태: "완료"로 변경
- 생성된 파일: `types/database.ts` 기록
- 테이블 개수: P2D1에서 생성한 테이블 수 기록

---

## ✅ 완료 기준

- [ ] Supabase CLI 설치 완료 (`supabase` 패키지)
- [ ] `types/database.ts` 파일 생성 완료
- [ ] `Database` interface가 파일에 존재함
- [ ] P2D1에서 생성한 모든 테이블이 타입에 포함됨 (20개 이상)
- [ ] 각 테이블에 `Row`, `Insert`, `Update` 타입 존재함
- [ ] `package.json`에 `types:generate`, `types:update` 스크립트 추가됨
- [ ] tsconfig.json에 types 경로 설정 확인
- [ ] TypeScript 타입 체크 통과 (에러 없음)
- [ ] import 테스트 성공 (`import type { Database }` 정상 작동)
- [ ] Supabase 클라이언트에서 타입 사용 가능 (`createClient<Database>()`)
- [ ] IDE 자동 완성 작동 확인 (테이블명, 필드명)
- [ ] PROJECT GRID 상태 업데이트 완료

---

**작업지시서 생성일**: 2025-11-06
**PROJECT GRID Version**: v4.0
