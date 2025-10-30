# Backend APIs Area (BA)

실제 비즈니스 로직 및 REST API 엔드포인트가 위치합니다.

## 디렉토리 구조 (예정)

```
app/api/
├── auth/
│   ├── signup/
│   │   └── route.ts        # P1BA1: 회원가입 API
│   ├── login/
│   │   └── route.ts        # P1BA2: 로그인 API
│   └── logout/
│       └── route.ts        # P1BA3: 로그아웃 API
├── politicians/
│   ├── route.ts            # P2BA1: 정치인 목록 API
│   ├── [id]/
│   │   └── route.ts        # P2BA2: 정치인 상세 API
│   └── search/
│       └── route.ts        # P2BA3: 정치인 검색 API
├── community/
│   ├── posts/
│   │   └── route.ts        # P3BA1: 게시글 API
│   └── comments/
│       └── route.ts        # P3BA2: 댓글 API
└── users/
    └── profile/
        └── route.ts        # P1BA4: 프로필 API
```

## Task ID 헤더 (Next.js API Route)

```typescript
/**
 * Project Grid Task ID: P1BA1
 * 작업명: 회원가입 API 구현
 * 생성시간: 2025-10-30 14:30
 * 생성자: Claude-3.5-Sonnet
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // 비즈니스 로직
    ...
  } catch (error) {
    ...
  }
}
```

## API 명명 규칙

- **RESTful 원칙** 준수
- **HTTP 메서드**: GET, POST, PUT, PATCH, DELETE
- **URL 구조**: `/api/{resource}/{action}`

## 의존성

- **Backend Infrastructure (BI)** 완료 후 개발 시작
- **lib/supabase**, **lib/utils** 사용

## 에러 처리

모든 API는 **일관된 에러 응답 형식** 사용:

```typescript
{
  "success": false,
  "error": {
    "code": "AUTH_001",
    "message": "Invalid credentials"
  }
}
```
