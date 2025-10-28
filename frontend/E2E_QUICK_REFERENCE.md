# E2E 테스트 빠른 참조 카드

## ⚡ 빠른 시작

```bash
# 1. 설치
npm install
npx playwright install

# 2. 테스트 실행
npm run test:e2e:ui      # UI 모드 (추천)
npm run test:e2e         # 전체 실행
npm run test:e2e:headed  # 브라우저 보기
```

## 🎯 주요 명령어

| 명령어 | 설명 |
|--------|------|
| `npm run test:e2e` | 전체 테스트 실행 |
| `npm run test:e2e:ui` | UI 모드 (디버깅용) |
| `npm run test:e2e:headed` | 브라우저 창 표시 |
| `npm run test:e2e:debug` | 디버그 모드 |
| `npm run test:e2e:report` | 리포트 보기 |
| `npm run test:e2e:chromium` | Chrome만 |
| `npm run test:e2e:firefox` | Firefox만 |
| `npm run test:e2e:mobile` | 모바일만 |

## 📁 파일 구조

```
e2e/
├── rating-system.spec.ts    # 평가 시스템 테스트 (16 tests)
├── helpers/
│   └── auth.ts             # 로그인/로그아웃 헬퍼
└── fixtures/
    └── rating-data.ts      # 테스트 데이터
```

## 🔧 헬퍼 함수

### 인증
```typescript
import { login, logout } from './helpers/auth'

await login(page)                    // 로그인
await logout(page)                   // 로그아웃
await isAuthenticated(page)          // 인증 확인
```

### 테스트 데이터
```typescript
import {
  VALID_RATING_DATA,
  RATING_SAMPLES,
  UPDATE_RATING_DATA
} from './fixtures/rating-data'

// 평가 생성 데이터
const rating = VALID_RATING_DATA

// 다양한 점수 샘플
const excellent = RATING_SAMPLES.excellent  // 5점
const poor = RATING_SAMPLES.poor            // 2점
```

## 📝 테스트 작성 템플릿

### 기본 테스트
```typescript
import { test, expect } from '@playwright/test'

test('should do something', async ({ page }) => {
  // 준비
  await page.goto('/page')

  // 실행
  await page.click('button')

  // 검증
  await expect(page.locator('text=Success')).toBeVisible()
})
```

### 인증 필요 테스트
```typescript
import { login } from './helpers/auth'

test('authenticated action', async ({ page }) => {
  await login(page)
  await page.goto('/protected-page')
  // 테스트 로직
})
```

## 🎨 선택자 패턴

```typescript
// 1. data-testid (최우선)
page.locator('[data-testid="submit-button"]')

// 2. Role 기반
page.getByRole('button', { name: '제출' })

// 3. 텍스트 기반
page.locator('button:has-text("제출")')

// 4. Label 기반
page.getByLabel('평점')
```

## ⏱️ 대기 패턴

```typescript
// 요소 대기
await page.waitForSelector('text=완료')

// 네트워크 대기
await page.waitForLoadState('networkidle')

// URL 변경 대기
await page.waitForURL('/success')

// API 응답 대기
await page.waitForResponse('**/api/**')
```

## 🐛 디버깅

```typescript
// 일시정지
await page.pause()

// 스크린샷
await page.screenshot({ path: 'debug.png' })

// 콘솔 로그
page.on('console', msg => console.log(msg.text()))

// 특정 테스트만 실행
test.only('debug this', async ({ page }) => { })
```

## 📊 테스트 현황

### 평가 시스템 (rating-system.spec.ts)
- ✅ 평가 작성 (3 tests)
- ✅ 평가 조회 (4 tests)
- ✅ 평가 수정 (2 tests)
- ✅ 평가 삭제 (2 tests)
- ✅ 평가 통계 (4 tests)
- ✅ 통합 테스트 (1 test)

**총 16개 테스트**

## 🌐 테스트 환경

- Desktop: Chrome, Firefox, Safari
- Mobile: Android, iOS
- Tablet: iPad Pro

**총 6개 환경**

## 📚 문서 위치

| 문서 | 경로 |
|------|------|
| 빠른 참조 | `E2E_QUICK_REFERENCE.md` (이 파일) |
| 전체 가이드 | `E2E_TESTING_GUIDE.md` |
| 상세 보고서 | `TASK_P2T2_IMPLEMENTATION_REPORT.md` |
| 완료 요약 | `P2T2_COMPLETION_SUMMARY.md` |
| E2E README | `e2e/README.md` |

## 🆘 일반적인 문제

### "Timeout exceeded"
```typescript
test.setTimeout(60000)  // 타임아웃 증가
await page.waitForLoadState('networkidle')
```

### "Element not found"
```typescript
await page.waitForSelector('element', { timeout: 10000 })
```

### "Navigation timeout"
```typescript
await page.goto('/page', { waitUntil: 'networkidle' })
```

## ✅ 체크리스트

테스트 작성 전:
- [ ] 개발 서버 실행 중
- [ ] 백엔드 API 서버 실행 중
- [ ] 테스트 데이터 준비됨

테스트 작성 후:
- [ ] 테스트가 독립적으로 실행됨
- [ ] 명확한 테스트 이름
- [ ] AAA 패턴 준수
- [ ] 안정적인 선택자 사용
- [ ] 적절한 대기 시간

## 🚀 CI/CD

```yaml
# .github/workflows/e2e.yml
- run: npm ci
- run: npx playwright install --with-deps
- run: npm run test:e2e
```

## 📞 도움말

- Playwright Docs: https://playwright.dev
- 프로젝트 Issues: GitHub 이슈 트래커
- 팀 Wiki: 내부 문서

---

**마지막 업데이트**: 2025-10-17
**버전**: 1.0.0
