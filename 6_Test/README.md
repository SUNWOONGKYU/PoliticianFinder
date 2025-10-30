# Test Area (T)

모든 테스트 코드가 위치합니다.

## 디렉토리 구조

```
tests/
├── e2e/                # End-to-End 테스트
│   ├── auth.spec.ts    # 인증 E2E 테스트
│   ├── politicians.spec.ts
│   └── community.spec.ts
├── api/                # API 테스트
│   ├── auth.test.ts
│   ├── politicians.test.ts
│   └── users.test.ts
└── unit/               # 단위 테스트
    ├── utils.test.ts
    └── validation.test.ts
```

## Task ID 헤더

```typescript
/**
 * Project Grid Task ID: P1T1
 * 작업명: 회원가입 E2E 테스트
 * 생성시간: 2025-10-30 14:30
 * 생성자: Claude-3.5-Sonnet
 */

import { test, expect } from '@playwright/test'

test('회원가입이 정상적으로 동작한다', async ({ page }) => {
  await page.goto('/signup')
  ...
})
```

## 테스트 도구

- **E2E**: Playwright
- **API**: Jest + Supertest
- **Unit**: Jest

## 테스트 명명 규칙

- **파일명**: `{기능}.{테스트타입}.ts`
- **테스트명**: `{기능}이/가 {기대결과}한다`

## 테스트 커버리지 목표

- **E2E**: 주요 사용자 시나리오 100%
- **API**: 모든 엔드포인트 100%
- **Unit**: 유틸리티 함수 80% 이상

## 실행 명령어

```bash
# E2E 테스트
npm run test:e2e

# API 테스트
npm run test:api

# Unit 테스트
npm run test:unit

# 전체 테스트
npm test

# 커버리지 확인
npm run test:coverage
```
