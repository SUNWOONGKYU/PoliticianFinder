# Backend Infrastructure Area (BI)

모든 Backend APIs가 사용하는 **기반 코드**가 위치합니다.

## 디렉토리 구조

```
lib/
├── supabase/
│   ├── client.ts       # Supabase 클라이언트 초기화
│   ├── server.ts       # Server-side Supabase 클라이언트
│   └── middleware.ts   # Supabase 미들웨어
├── utils/
│   ├── validation.ts   # 유효성 검증 유틸리티
│   ├── error.ts        # 에러 처리 유틸리티
│   └── response.ts     # API 응답 포맷
└── hooks/
    ├── useAuth.ts      # 인증 훅
    └── useSupabase.ts  # Supabase 훅
```

## Task ID 헤더

```typescript
/**
 * Project Grid Task ID: P1BI1
 * 작업명: Supabase 클라이언트 초기화
 * 생성시간: 2025-10-30 14:30
 * 생성자: Claude-3.5-Sonnet
 */

import { createClient } from '@supabase/supabase-js'
...
```

## 중요 원칙

1. **모든 API가 공통으로 사용하는 코드만** 여기에 위치
2. **비즈니스 로직은 Backend APIs Area (BA)**에 구현
3. **재사용 가능한 유틸리티 함수** 중심
4. **타입 안정성** 보장

## 의존성

- Backend APIs Area (BA)는 **반드시** Backend Infrastructure Area (BI)에 의존
- BI 완료 후 → BA 개발 시작 가능
