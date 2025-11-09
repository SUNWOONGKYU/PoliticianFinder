# 작업지시서: P1BI2

## 📋 기본 정보

- **작업 ID**: P1BI2
- **업무명**: API 미들웨어
- **Phase**: Phase 1
- **Area**: Backend Infrastructure (BI)
- **서브 에이전트**: backend-developer
- **작업 방식**: AI-Only

---

## 🎯 작업 목표

Next.js API Routes에서 사용할 **인증 미들웨어**와 **에러 핸들링 미들웨어**를 구현합니다.

**핵심 요구사항:**
1. **인증 미들웨어**: JWT 토큰 검증 및 사용자 세션 확인
2. **에러 핸들링 미들웨어**: 통일된 에러 응답 형식 제공
3. **API 응답 표준화**: 성공/실패 응답의 일관된 구조 정의
4. **로깅 시스템**: API 요청/응답 로그 기록

**왜 필요한가?**
- **인증**: 보호된 API 엔드포인트에 인증된 사용자만 접근 가능하도록 함
- **에러 핸들링**: 모든 API에서 일관된 에러 응답 형식 유지
- **로깅**: 디버깅 및 모니터링을 위한 요청/응답 기록

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

**의존성 체인**: P1BI1

이 작업을 시작하기 전에 다음 작업이 완료되어야 합니다: P1BI1

---

## 📦 기대 결과물

**생성할 파일:**
1. `lib/middleware/auth.ts` - 인증 미들웨어 (JWT 토큰 검증, 사용자 세션 확인)
2. `lib/middleware/error-handler.ts` - 에러 핸들링 미들웨어
3. `lib/utils/api-response.ts` - API 응답 표준화 유틸리티
4. `lib/utils/logger.ts` - 로깅 유틸리티

**API 응답 표준 형식:**
```typescript
// 성공 응답
{
  "success": true,
  "data": T,
  "meta"?: {
    "page": number,
    "limit": number,
    "total": number
  }
}

// 실패 응답
{
  "success": false,
  "error": {
    "code": string,
    "message": string,
    "details"?: any
  }
}
```

**설치 필요 패키지:**
```bash
npm install pino pino-pretty
# pino: 고성능 Node.js 로거
# pino-pretty: 개발 환경용 예쁜 로그 포맷
```

---

## 💾 구현 파일 저장 위치

**루트 폴더**: `2_Backend_Infrastructure/lib/middleware/`

**파일 경로**:
```
2_Backend_Infrastructure/
└── lib/
    └── middleware/
        ├── auth.ts           # 인증 미들웨어 (JWT 검증)
        └── error-handler.ts  # 에러 핸들링 미들웨어
```

**절대 경로 별칭**: `@/` (예: `import { authMiddleware } from '@/lib/middleware/auth'`)

---

## 📝 작업 지시사항

### 1. 준비 단계

#### 1.1 패키지 설치
```bash
cd 2_Backend_Infrastructure
npm install pino pino-pretty
```

#### 1.2 의존성 확인
- P1BI1 (Supabase 클라이언트) 작업 완료 확인
- `lib/supabase/server.ts`가 존재하는지 확인

---

### 2. 구현 단계

#### 2.1 로거 유틸리티 구현

**파일**: `lib/utils/logger.ts`

```typescript
// lib/utils/logger.ts
import pino from 'pino'

/**
 * Pino 로거 설정
 * 개발 환경에서는 pretty print, 프로덕션에서는 JSON 형식
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
})

/**
 * API 요청 로깅
 */
export function logRequest(
  method: string,
  url: string,
  userId?: string
) {
  logger.info({
    type: 'request',
    method,
    url,
    userId,
    timestamp: new Date().toISOString(),
  })
}

/**
 * API 응답 로깅
 */
export function logResponse(
  method: string,
  url: string,
  statusCode: number,
  duration: number
) {
  logger.info({
    type: 'response',
    method,
    url,
    statusCode,
    duration,
    timestamp: new Date().toISOString(),
  })
}

/**
 * 에러 로깅
 */
export function logError(
  error: Error,
  context?: Record<string, any>
) {
  logger.error({
    type: 'error',
    message: error.message,
    stack: error.stack,
    ...context,
    timestamp: new Date().toISOString(),
  })
}
```

---

#### 2.2 API 응답 표준화 유틸리티 구현

**파일**: `lib/utils/api-response.ts`

```typescript
// lib/utils/api-response.ts
import { NextResponse } from 'next/server'

/**
 * API 응답 타입 정의
 */
export interface ApiSuccessResponse<T = any> {
  success: true
  data: T
  meta?: {
    page?: number
    limit?: number
    total?: number
    totalPages?: number
  }
}

export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: any
  }
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse

/**
 * 성공 응답 생성
 */
export function successResponse<T>(
  data: T,
  meta?: ApiSuccessResponse<T>['meta']
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(meta && { meta }),
    },
    { status: 200 }
  )
}

/**
 * 에러 응답 생성
 */
export function errorResponse(
  code: string,
  message: string,
  statusCode: number = 500,
  details?: any
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details && { details }),
      },
    },
    { status: statusCode }
  )
}

/**
 * 사전 정의된 에러 응답들
 */
export const ErrorResponses = {
  UNAUTHORIZED: () =>
    errorResponse('UNAUTHORIZED', '인증이 필요합니다', 401),

  FORBIDDEN: () =>
    errorResponse('FORBIDDEN', '권한이 없습니다', 403),

  NOT_FOUND: (resource: string = '리소스') =>
    errorResponse('NOT_FOUND', `${resource}를 찾을 수 없습니다`, 404),

  VALIDATION_ERROR: (details?: any) =>
    errorResponse('VALIDATION_ERROR', '입력값이 올바르지 않습니다', 400, details),

  INTERNAL_ERROR: (message: string = '서버 내부 오류가 발생했습니다') =>
    errorResponse('INTERNAL_ERROR', message, 500),

  BAD_REQUEST: (message: string) =>
    errorResponse('BAD_REQUEST', message, 400),

  TOO_MANY_REQUESTS: () =>
    errorResponse('TOO_MANY_REQUESTS', '요청 한도를 초과했습니다', 429),

  CONFLICT: (message: string = '이미 존재하는 리소스입니다') =>
    errorResponse('CONFLICT', message, 409),
}
```

---

#### 2.3 인증 미들웨어 구현

**파일**: `lib/middleware/auth.ts`

```typescript
// lib/middleware/auth.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ErrorResponses } from '@/lib/utils/api-response'
import { logError } from '@/lib/utils/logger'

/**
 * 인증된 사용자 정보 타입
 */
export interface AuthenticatedUser {
  id: string
  email: string
  role: string
}

/**
 * 인증 미들웨어
 * API Route에서 사용자 인증을 확인하고, 인증된 사용자 정보를 반환
 *
 * @returns 인증 성공 시 사용자 정보, 실패 시 에러 응답
 *
 * @example
 * // API Route에서 사용
 * import { requireAuth } from '@/lib/middleware/auth'
 *
 * export async function GET(request: NextRequest) {
 *   const authResult = await requireAuth(request)
 *
 *   if (authResult instanceof NextResponse) {
 *     // 인증 실패 - 에러 응답 반환
 *     return authResult
 *   }
 *
 *   // 인증 성공 - 사용자 정보 사용
 *   const user = authResult
 *   // ... API 로직
 * }
 */
export async function requireAuth(
  request: NextRequest
): Promise<AuthenticatedUser | NextResponse> {
  try {
    const supabase = createClient()

    // Supabase 세션 확인
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      logError(new Error('Unauthorized access attempt'), {
        url: request.url,
        method: request.method,
      })
      return ErrorResponses.UNAUTHORIZED()
    }

    // 사용자 정보 반환
    return {
      id: user.id,
      email: user.email || '',
      role: user.user_metadata?.role || 'user',
    }
  } catch (error) {
    logError(error as Error, {
      context: 'requireAuth',
      url: request.url,
    })
    return ErrorResponses.INTERNAL_ERROR()
  }
}

/**
 * 관리자 권한 확인 미들웨어
 *
 * @example
 * export async function DELETE(request: NextRequest) {
 *   const authResult = await requireAdmin(request)
 *
 *   if (authResult instanceof NextResponse) {
 *     return authResult
 *   }
 *
 *   const admin = authResult
 *   // ... 관리자 전용 로직
 * }
 */
export async function requireAdmin(
  request: NextRequest
): Promise<AuthenticatedUser | NextResponse> {
  const authResult = await requireAuth(request)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  // 관리자 권한 확인
  if (authResult.role !== 'admin') {
    logError(new Error('Admin access attempt by non-admin user'), {
      userId: authResult.id,
      url: request.url,
    })
    return ErrorResponses.FORBIDDEN()
  }

  return authResult
}

/**
 * 선택적 인증 미들웨어
 * 인증되지 않아도 진행 가능하지만, 인증된 경우 사용자 정보를 반환
 *
 * @example
 * export async function GET(request: NextRequest) {
 *   const user = await optionalAuth(request)
 *
 *   if (user) {
 *     // 인증된 사용자용 로직
 *   } else {
 *     // 비인증 사용자용 로직
 *   }
 * }
 */
export async function optionalAuth(
  request: NextRequest
): Promise<AuthenticatedUser | null> {
  try {
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return null
    }

    return {
      id: user.id,
      email: user.email || '',
      role: user.user_metadata?.role || 'user',
    }
  } catch (error) {
    logError(error as Error, { context: 'optionalAuth' })
    return null
  }
}
```

---

#### 2.4 에러 핸들링 미들웨어 구현

**파일**: `lib/middleware/error-handler.ts`

```typescript
// lib/middleware/error-handler.ts
import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { errorResponse } from '@/lib/utils/api-response'
import { logError } from '@/lib/utils/logger'

/**
 * API Route Handler를 감싸서 에러를 자동으로 처리
 *
 * @example
 * import { withErrorHandler } from '@/lib/middleware/error-handler'
 *
 * export const GET = withErrorHandler(async (request: NextRequest) => {
 *   // 에러가 발생해도 자동으로 처리됨
 *   throw new Error('Something went wrong')
 * })
 */
export function withErrorHandler(
  handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any): Promise<NextResponse> => {
    const startTime = Date.now()

    try {
      const response = await handler(request, context)

      // 응답 로깅
      const duration = Date.now() - startTime
      console.log(`${request.method} ${request.url} - ${response.status} (${duration}ms)`)

      return response
    } catch (error) {
      // 에러 타입별 처리
      if (error instanceof ZodError) {
        // Zod 검증 에러
        logError(error, {
          type: 'ZodValidationError',
          issues: error.issues,
          url: request.url,
        })

        return errorResponse(
          'VALIDATION_ERROR',
          '입력값이 올바르지 않습니다',
          400,
          error.issues
        )
      }

      if (error instanceof Error) {
        // 일반 에러
        logError(error, {
          url: request.url,
          method: request.method,
        })

        // 에러 메시지에서 상태 코드 추출 (옵션)
        if (error.message.includes('404') || error.message.includes('not found')) {
          return errorResponse('NOT_FOUND', error.message, 404)
        }

        if (error.message.includes('401') || error.message.includes('unauthorized')) {
          return errorResponse('UNAUTHORIZED', error.message, 401)
        }

        if (error.message.includes('403') || error.message.includes('forbidden')) {
          return errorResponse('FORBIDDEN', error.message, 403)
        }

        return errorResponse('INTERNAL_ERROR', error.message, 500)
      }

      // 알 수 없는 에러
      logError(new Error('Unknown error'), {
        error,
        url: request.url,
      })

      return errorResponse('INTERNAL_ERROR', '알 수 없는 오류가 발생했습니다', 500)
    }
  }
}
```

---

#### 2.5 사용 예시

**인증이 필요한 API:**
```typescript
// app/api/profile/route.ts
import { NextRequest } from 'next/server'
import { requireAuth } from '@/lib/middleware/auth'
import { successResponse, ErrorResponses } from '@/lib/utils/api-response'
import { withErrorHandler } from '@/lib/middleware/error-handler'
import { createClient } from '@/lib/supabase/server'

export const GET = withErrorHandler(async (request: NextRequest) => {
  // 1. 인증 확인
  const authResult = await requireAuth(request)

  if (authResult instanceof NextResponse) {
    return authResult // 인증 실패 시 에러 응답 반환
  }

  const user = authResult

  // 2. 데이터 조회
  const supabase = createClient()
  const { data: profile, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    throw new Error('프로필을 찾을 수 없습니다')
  }

  // 3. 성공 응답
  return successResponse(profile)
})
```

**관리자 전용 API:**
```typescript
// app/api/admin/users/route.ts
import { NextRequest } from 'next/server'
import { requireAdmin } from '@/lib/middleware/auth'
import { successResponse } from '@/lib/utils/api-response'
import { withErrorHandler } from '@/lib/middleware/error-handler'
import { createAdminClient } from '@/lib/supabase/server'

export const GET = withErrorHandler(async (request: NextRequest) => {
  // 관리자 권한 확인
  const authResult = await requireAdmin(request)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  // 모든 사용자 조회 (RLS 우회)
  const supabase = createAdminClient()
  const { data: users, error } = await supabase
    .from('users')
    .select('*')

  if (error) {
    throw new Error('사용자 목록 조회 실패')
  }

  return successResponse(users)
})
```

**Zod 검증과 함께 사용:**
```typescript
// app/api/posts/route.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'
import { requireAuth } from '@/lib/middleware/auth'
import { successResponse } from '@/lib/utils/api-response'
import { withErrorHandler } from '@/lib/middleware/error-handler'
import { createClient } from '@/lib/supabase/server'

const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
})

export const POST = withErrorHandler(async (request: NextRequest) => {
  // 1. 인증
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) return authResult
  const user = authResult

  // 2. 요청 본문 검증 (에러 시 자동으로 400 응답)
  const body = await request.json()
  const validated = createPostSchema.parse(body) // ZodError 발생 시 withErrorHandler가 처리

  // 3. 게시글 생성
  const supabase = createClient()
  const { data: post, error } = await supabase
    .from('posts')
    .insert({
      ...validated,
      user_id: user.id,
    })
    .select()
    .single()

  if (error) {
    throw new Error('게시글 생성 실패')
  }

  return successResponse(post)
})
```

### 3. 검증 단계

#### 3.1 TypeScript 타입 체크
```bash
npm run type-check
```

#### 3.2 Lint 검사
```bash
npm run lint
```

#### 3.3 테스트 API 작성 및 확인

**인증 테스트 API:**
```typescript
// app/api/test-auth/route.ts
import { NextRequest } from 'next/server'
import { requireAuth, requireAdmin, optionalAuth } from '@/lib/middleware/auth'
import { successResponse } from '@/lib/utils/api-response'
import { withErrorHandler } from '@/lib/middleware/error-handler'

// 인증 필수 테스트
export const GET = withErrorHandler(async (request: NextRequest) => {
  const authResult = await requireAuth(request)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  return successResponse({
    message: '인증 성공',
    user: authResult,
  })
})
```

**테스트 실행:**
```bash
# 1. 개발 서버 시작
npm run dev

# 2. 인증 없이 요청 (401 예상)
curl http://localhost:3000/api/test-auth

# 3. 인증 후 요청 (200 예상)
# (Supabase 로그인 후 브라우저에서 테스트)
```

**예상 응답 (인증 실패):**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "인증이 필요합니다"
  }
}
```

**예상 응답 (인증 성공):**
```json
{
  "success": true,
  "data": {
    "message": "인증 성공",
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "role": "user"
    }
  }
}
```

#### 3.4 에러 핸들링 테스트

**에러 테스트 API:**
```typescript
// app/api/test-error/route.ts
import { NextRequest } from 'next/server'
import { withErrorHandler } from '@/lib/middleware/error-handler'

export const GET = withErrorHandler(async (request: NextRequest) => {
  const errorType = request.nextUrl.searchParams.get('type')

  if (errorType === 'validation') {
    // Zod 에러 시뮬레이션
    const { z } = await import('zod')
    const schema = z.object({ name: z.string() })
    schema.parse({ name: 123 }) // 에러 발생
  }

  if (errorType === 'notfound') {
    throw new Error('리소스를 찾을 수 없습니다 (404)')
  }

  if (errorType === 'general') {
    throw new Error('일반 에러 발생')
  }

  return NextResponse.json({ message: '정상 응답' })
})
```

**테스트:**
```bash
# 검증 에러 (400)
curl http://localhost:3000/api/test-error?type=validation

# 404 에러
curl http://localhost:3000/api/test-error?type=notfound

# 일반 에러 (500)
curl http://localhost:3000/api/test-error?type=general
```

#### 3.5 로깅 확인

개발 서버 콘솔에서 다음과 같은 로그가 출력되는지 확인:
```
[HH:MM:SS] INFO: GET /api/test-auth - 200 (45ms)
[HH:MM:SS] ERROR: Unauthorized access attempt
  url: http://localhost:3000/api/test-auth
  method: GET
```

---

### 4. 완료 단계

#### 4.1 생성된 파일 확인
```bash
ls -la 2_Backend_Infrastructure/lib/middleware/
# auth.ts
# error-handler.ts

ls -la 2_Backend_Infrastructure/lib/utils/
# api-response.ts
# logger.ts
```

#### 4.2 import 가능 여부 확인
```typescript
// 다른 파일에서 import 테스트
import { requireAuth, requireAdmin, optionalAuth } from '@/lib/middleware/auth'
import { withErrorHandler } from '@/lib/middleware/error-handler'
import { successResponse, errorResponse, ErrorResponses } from '@/lib/utils/api-response'
import { logger, logError, logRequest, logResponse } from '@/lib/utils/logger'
```

#### 4.3 다음 작업 의존성 확인

이 작업이 완료되면 다음 작업들이 미들웨어를 사용할 수 있습니다:
- **모든 Mock API** (P1BA2, P1BA3, P1BA4) - 인증 및 에러 핸들링 사용
- **모든 Real API** (P3BA1-4) - 인증 및 에러 핸들링 사용
- **Admin API** (P4BA1-13) - 관리자 권한 확인 사용

#### 4.4 PROJECT GRID 상태 업데이트
- 작업 상태: "완료"로 변경
- 생성된 파일: 4개 파일 기록
- 테스트 결과: 인증/에러 핸들링 테스트 성공 여부 기록

---

## ✅ 완료 기준

- [ ] `lib/middleware/auth.ts` 파일 생성 완료
  - `requireAuth` 함수 구현
  - `requireAdmin` 함수 구현
  - `optionalAuth` 함수 구현
- [ ] `lib/middleware/error-handler.ts` 파일 생성 완료
  - `withErrorHandler` HOC 구현
- [ ] `lib/utils/api-response.ts` 파일 생성 완료
  - `successResponse` 함수 구현
  - `errorResponse` 함수 구현
  - `ErrorResponses` 객체 구현
- [ ] `lib/utils/logger.ts` 파일 생성 완료
  - Pino 로거 설정
  - `logRequest`, `logResponse`, `logError` 함수 구현
- [ ] `pino`, `pino-pretty` 패키지 설치 완료
- [ ] TypeScript 타입 체크 통과
- [ ] Lint 검사 통과
- [ ] 인증 테스트 성공 (401, 200 응답 확인)
- [ ] 에러 핸들링 테스트 성공 (400, 404, 500 응답 확인)
- [ ] 로그가 콘솔에 정상 출력됨
- [ ] API 응답 형식이 표준 형식과 일치함
- [ ] PROJECT GRID 상태 업데이트 완료

---

**작업지시서 생성일**: 2025-11-06
**PROJECT GRID Version**: v4.0
