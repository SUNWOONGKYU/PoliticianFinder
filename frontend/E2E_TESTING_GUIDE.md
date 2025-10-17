# E2E 테스팅 가이드

PoliticianFinder 프로젝트의 E2E 테스트 실행 및 작성 가이드입니다.

## 빠른 시작

### 1. 의존성 설치
```bash
cd frontend
npm install
```

### 2. 브라우저 설치
```bash
npx playwright install
```

### 3. 테스트 실행
```bash
# 전체 테스트 실행
npm run test:e2e

# UI 모드로 실행 (추천)
npm run test:e2e:ui

# 특정 브라우저만
npm run test:e2e:chromium
```

## 테스트 스크립트

### 개발 중 사용
```bash
# UI 모드 - 테스트 선택 및 디버깅
npm run test:e2e:ui

# 헤드풀 모드 - 브라우저 창 보기
npm run test:e2e:headed

# 디버그 모드 - 단계별 실행
npm run test:e2e:debug
```

### CI/CD에서 사용
```bash
# 전체 테스트
npm run test:e2e

# 특정 브라우저
npm run test:e2e:chromium
npm run test:e2e:firefox

# 모바일
npm run test:e2e:mobile
```

### 리포트 확인
```bash
# HTML 리포트 열기
npm run test:e2e:report
```

## 디렉토리 구조

```
frontend/
├── e2e/                          # E2E 테스트
│   ├── fixtures/                 # 테스트 데이터
│   │   ├── politician-data.ts    # 정치인 데이터
│   │   └── rating-data.ts        # 평가 데이터
│   ├── helpers/                  # 헬퍼 함수
│   │   ├── auth.ts              # 인증 헬퍼
│   │   ├── api-mock.ts          # API 모킹
│   │   └── viewport.ts          # 뷰포트 헬퍼
│   ├── rating-system.spec.ts    # 평가 시스템 테스트
│   └── politician-detail.spec.ts # 정치인 상세 테스트
├── playwright.config.ts          # Playwright 설정
└── playwright-report/            # 테스트 리포트 (생성됨)
```

## 새 테스트 작성하기

### 1. 기본 테스트 구조

```typescript
import { test, expect } from '@playwright/test'
import { login } from './helpers/auth'

test.describe('기능 이름', () => {
  test.beforeEach(async ({ page }) => {
    // 각 테스트 전에 실행
    await page.goto('/')
  })

  test('should do something', async ({ page }) => {
    // Arrange (준비)
    await login(page)

    // Act (실행)
    await page.click('button:has-text("클릭")')

    // Assert (검증)
    await expect(page.locator('text=성공')).toBeVisible()
  })
})
```

### 2. 인증이 필요한 테스트

```typescript
import { login, logout } from './helpers/auth'

test('authenticated user can access profile', async ({ page }) => {
  // 로그인
  await login(page)

  // 프로필 페이지 접근
  await page.goto('/profile')

  // 검증
  await expect(page.locator('text=내 프로필')).toBeVisible()

  // 로그아웃 (선택사항)
  await logout(page)
})
```

### 3. 테스트 데이터 사용

```typescript
import { VALID_RATING_DATA } from './fixtures/rating-data'

test('should create rating', async ({ page }) => {
  await login(page)

  // 픽스처 데이터 사용
  await page.fill('textarea', VALID_RATING_DATA.comment)
  await page.click(`button[data-score="${VALID_RATING_DATA.score}"]`)

  await page.click('button[type="submit"]')

  await expect(page.locator(`text=${VALID_RATING_DATA.comment}`)).toBeVisible()
})
```

### 4. 여러 시나리오 테스트

```typescript
test.describe('Rating CRUD', () => {
  test('should create rating', async ({ page }) => {
    // 생성 테스트
  })

  test('should read ratings', async ({ page }) => {
    // 조회 테스트
  })

  test('should update rating', async ({ page }) => {
    // 수정 테스트
  })

  test('should delete rating', async ({ page }) => {
    // 삭제 테스트
  })
})
```

## 유용한 패턴

### 1. 페이지 객체 패턴 (간소화)

```typescript
// helpers/pages/rating-page.ts
export class RatingPage {
  constructor(private page: Page) {}

  async navigateTo(politicianId: number) {
    await this.page.goto(`/politicians/${politicianId}`)
  }

  async createRating(score: number, comment: string) {
    await this.page.click('button:has-text("평가하기")')
    await this.selectScore(score)
    await this.page.fill('textarea', comment)
    await this.page.click('button[type="submit"]')
  }

  async selectScore(score: number) {
    await this.page.click(`button[data-score="${score}"]`)
  }
}

// 사용
const ratingPage = new RatingPage(page)
await ratingPage.navigateTo(1)
await ratingPage.createRating(5, '좋습니다')
```

### 2. 재사용 가능한 헬퍼

```typescript
// helpers/rating-helpers.ts
export async function createRating(
  page: Page,
  score: number,
  comment: string
) {
  await page.click('button:has-text("평가하기")')
  await page.click(`button[data-score="${score}"]`)
  await page.fill('textarea[name="comment"]', comment)
  await page.click('button[type="submit"]')
  await page.waitForSelector(`text=${comment}`)
}

// 사용
await createRating(page, 5, '훌륭합니다')
```

### 3. API 응답 대기

```typescript
test('should load data from API', async ({ page }) => {
  // API 응답 대기
  const responsePromise = page.waitForResponse('**/api/ratings**')

  await page.goto('/politicians/1')

  const response = await responsePromise
  expect(response.status()).toBe(200)
})
```

### 4. 조건부 로직

```typescript
test('should handle optional elements', async ({ page }) => {
  const editButton = page.locator('button:has-text("수정")')

  if (await editButton.count() > 0) {
    await editButton.first().click()
    // 수정 로직
  } else {
    // 대체 로직
  }
})
```

## 선택자 전략

### 권장 우선순위

1. **data-testid** (가장 안정적)
```typescript
await page.locator('[data-testid="submit-button"]').click()
```

2. **aria-label** (접근성도 개선)
```typescript
await page.locator('[aria-label="평가 제출"]').click()
```

3. **텍스트 기반** (사용자 관점)
```typescript
await page.locator('button:has-text("제출")').click()
```

4. **CSS 선택자** (최후 수단)
```typescript
await page.locator('.submit-button').click()
```

### 선택자 예시

```typescript
// 좋은 예
await page.locator('[data-testid="rating-form"]')
await page.getByRole('button', { name: '제출' })
await page.getByText('평가하기')
await page.getByLabel('평점')

// 나쁜 예 (불안정)
await page.locator('.btn.btn-primary.submit')
await page.locator('div > div > button:nth-child(3)')
```

## 대기 전략

### 1. 명시적 대기 (권장)

```typescript
// 요소 표시 대기
await page.waitForSelector('text=로딩 완료')

// 네트워크 안정화 대기
await page.waitForLoadState('networkidle')

// URL 변경 대기
await page.waitForURL('/success')

// API 응답 대기
await page.waitForResponse('**/api/**')
```

### 2. 암묵적 대기 (내장)

```typescript
// Playwright는 자동으로 대기
await expect(page.locator('text=성공')).toBeVisible()
```

### 3. 피해야 할 대기

```typescript
// 나쁜 예 - 하드코딩된 대기
await page.waitForTimeout(3000)

// 좋은 예
await page.waitForSelector('text=로딩 완료')
```

## 디버깅 팁

### 1. 실행 일시정지

```typescript
test('debug test', async ({ page }) => {
  await page.goto('/')

  // 여기서 일시정지
  await page.pause()

  // 개발자 도구 사용 가능
})
```

### 2. 콘솔 로그 확인

```typescript
page.on('console', msg => console.log('PAGE LOG:', msg.text()))
page.on('pageerror', err => console.log('PAGE ERROR:', err))
```

### 3. 스크린샷 찍기

```typescript
await page.screenshot({ path: 'screenshot.png' })
await page.screenshot({ path: 'fullpage.png', fullPage: true })
```

### 4. 특정 테스트만 실행

```typescript
// .only 사용
test.only('this test only', async ({ page }) => {
  // 이 테스트만 실행됨
})

// 명령줄에서
npx playwright test --grep "specific test name"
```

### 5. Trace 확인

```bash
# Trace 파일 열기
npx playwright show-trace test-results/.../trace.zip
```

## 일반적인 문제 해결

### 1. "Timeout exceeded" 에러

```typescript
// 타임아웃 증가
test('slow test', async ({ page }) => {
  test.setTimeout(60000) // 60초
  // ...
})

// 또는 기다림 추가
await page.waitForLoadState('networkidle')
```

### 2. "Element not found" 에러

```typescript
// 요소 대기
await page.waitForSelector('text=찾을 요소', { timeout: 10000 })

// 조건부 확인
const element = page.locator('text=요소')
if (await element.count() > 0) {
  await element.click()
}
```

### 3. "Navigation timeout" 에러

```typescript
// 네트워크 대기
await page.goto('/page', { waitUntil: 'networkidle' })

// 타임아웃 증가
await page.goto('/page', { timeout: 60000 })
```

### 4. 간헐적 실패 (Flaky tests)

```typescript
// 안정적인 대기 추가
await page.waitForLoadState('networkidle')
await page.waitForTimeout(100) // 최소한으로만

// 재시도 로직
let attempts = 0
while (attempts < 3) {
  try {
    await page.click('button')
    break
  } catch {
    attempts++
    if (attempts === 3) throw new Error('Failed after 3 attempts')
  }
}
```

## 베스트 프랙티스

### 1. 테스트 독립성
- 각 테스트는 다른 테스트에 의존하지 않아야 함
- beforeEach에서 초기 상태 설정
- afterEach에서 정리

### 2. 명확한 이름
```typescript
// 좋은 예
test('should allow authenticated user to create rating')
test('should prevent duplicate rating submission')

// 나쁜 예
test('test 1')
test('rating test')
```

### 3. AAA 패턴
```typescript
test('example', async ({ page }) => {
  // Arrange (준비)
  await login(page)
  await page.goto('/page')

  // Act (실행)
  await page.click('button')

  // Assert (검증)
  await expect(page.locator('text=Success')).toBeVisible()
})
```

### 4. 재사용 가능한 코드
- 공통 로직은 helpers에
- 테스트 데이터는 fixtures에
- 페이지별 로직은 page objects에

### 5. 의미 있는 Assertion
```typescript
// 좋은 예
await expect(page.locator('[data-testid="rating-list"]'))
  .toContainText('평가가 성공적으로 등록되었습니다')

// 나쁜 예
await expect(page.locator('div')).toBeVisible()
```

## CI/CD 통합

### GitHub Actions 예시

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

## 추가 리소스

- [Playwright 공식 문서](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
- [Codegen - 자동 테스트 생성](https://playwright.dev/docs/codegen)

## 질문 및 지원

- GitHub Issues: 프로젝트 이슈 트래커
- Playwright Discord: https://aka.ms/playwright/discord
- 팀 문서: 내부 위키 참조

---

**마지막 업데이트**: 2025-10-17
