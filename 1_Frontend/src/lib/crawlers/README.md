# NEC Crawler - 선관위 크롤링 스크립트

중앙선거관리위원회(NEC) 웹사이트에서 정치인 정보를 수집하는 크롤러입니다.

## 파일 구조

```
src/lib/crawlers/
├── index.ts           # 모듈 진입점
├── nec-crawler.ts     # 크롤러 메인 로직
├── types.ts           # TypeScript 타입 정의
├── utils.ts           # 유틸리티 함수
└── README.md          # 문서
```

## 설치

이 프로젝트는 Playwright를 사용합니다 (이미 devDependencies에 설치됨).

Playwright 브라우저 설치가 필요한 경우:
```bash
npx playwright install chromium
```

## 사용 방법

### 기본 사용

```typescript
import { crawlNEC } from '@/lib/crawlers';

// 기본 옵션으로 크롤링 실행
const result = await crawlNEC();

if (result.success) {
  console.log(`수집된 정치인: ${result.data.length}명`);
  result.data.forEach(politician => {
    console.log(`${politician.name} (${politician.party}) - ${politician.district}`);
  });
} else {
  console.error('크롤링 실패:', result.error?.message);
}
```

### 커스텀 옵션

```typescript
import { createNECCrawler } from '@/lib/crawlers';

const crawler = createNECCrawler({
  headless: false,          // 브라우저 UI 표시
  timeout: 60000,           // 60초 타임아웃
  maxRetries: 5,            // 최대 5회 재시도
  retryDelay: 3000,         // 3초 재시도 지연
  waitTime: 2000,           // 페이지 로딩 후 2초 대기
});

const result = await crawler.crawl();
```

### JSON 파일로 저장

```typescript
import { crawlAndSaveNEC } from '@/lib/crawlers';

const result = await crawlAndSaveNEC('./data/politicians.json', {
  headless: true,
  timeout: 30000,
});

console.log(`결과가 저장되었습니다: ${result.stats.itemsCollected}개 항목`);
```

### 클래스 인스턴스 사용

```typescript
import { NECCrawler } from '@/lib/crawlers';

const crawler = new NECCrawler({
  headless: true,
  maxRetries: 3,
});

// 크롤링 실행
const result = await crawler.crawl();

// 또는 크롤링 + 저장
const result2 = await crawler.crawlAndSave('./output/data.json');
```

## 데이터 구조

### PoliticianCrawlData

```typescript
{
  name: string;           // 이름
  party: string;          // 정당
  district: string;       // 지역구
  contact: {
    phone?: string;       // 전화번호
    email?: string;       // 이메일
    office?: string;      // 사무실 주소
  };
  career: Array<{
    period: string;       // 기간 (예: "2020-2024")
    description: string;  // 내용
  }>;
  metadata: {
    crawledAt: Date;      // 크롤링 일시
    sourceUrl: string;    // 출처 URL
    confidence: number;   // 데이터 신뢰도 (0-1)
  };
}
```

### CrawlResult

```typescript
{
  success: boolean;       // 성공 여부
  data: PoliticianCrawlData[];  // 수집된 데이터
  error?: {
    code: CrawlErrorCode;
    message: string;
    stack?: string;
    retryable: boolean;
  };
  stats: {
    startTime: Date;
    endTime: Date;
    duration: number;     // 밀리초
    itemsCollected: number;
    itemsFailed: number;
    retryCount: number;
  };
}
```

## 옵션

| 옵션 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `headless` | boolean | true | 헤드리스 모드 (브라우저 UI 숨김) |
| `timeout` | number | 30000 | 타임아웃 (밀리초) |
| `maxRetries` | number | 3 | 최대 재시도 횟수 |
| `retryDelay` | number | 2000 | 재시도 간격 (밀리초) |
| `waitTime` | number | 2000 | 페이지 로딩 대기 시간 (밀리초) |
| `userAgent` | string | Chrome UA | User Agent 문자열 |

## 에러 처리

```typescript
import { crawlNEC, CrawlErrorCode } from '@/lib/crawlers';

const result = await crawlNEC();

if (!result.success && result.error) {
  switch (result.error.code) {
    case CrawlErrorCode.NETWORK_ERROR:
      console.error('네트워크 오류');
      break;
    case CrawlErrorCode.TIMEOUT:
      console.error('타임아웃');
      break;
    case CrawlErrorCode.PARSING_ERROR:
      console.error('파싱 오류');
      break;
    case CrawlErrorCode.SELECTOR_NOT_FOUND:
      console.error('선택자를 찾을 수 없음 (사이트 구조 변경 가능성)');
      break;
    default:
      console.error('알 수 없는 오류:', result.error.message);
  }

  // 재시도 가능 여부 확인
  if (result.error.retryable) {
    console.log('재시도 가능한 오류입니다.');
  }
}
```

## 유틸리티 함수

```typescript
import {
  cleanText,
  formatPhoneNumber,
  isValidEmail,
  parseCareer,
  retry,
  sleep,
} from '@/lib/crawlers';

// 텍스트 정리
const clean = cleanText('  여러   공백   제거  \n');  // "여러 공백 제거"

// 전화번호 포맷
const phone = formatPhoneNumber('0212345678');  // "02-1234-5678"

// 이메일 검증
const valid = isValidEmail('test@example.com');  // true

// 약력 파싱
const careers = parseCareer('2020-2024 국회의원\n2016-2020 서울시의원');
// [
//   { period: '2020-2024', description: '국회의원' },
//   { period: '2016-2020', description: '서울시의원' }
// ]

// 재시도 로직
await retry(async () => {
  // 실패할 수 있는 작업
}, {
  maxRetries: 3,
  retryDelay: 1000,
  onRetry: (error, attempt) => {
    console.log(`재시도 ${attempt}: ${error.message}`);
  }
});

// 대기
await sleep(1000);  // 1초 대기
```

## 사이트 구조 업데이트

NEC 웹사이트 구조가 변경된 경우, `nec-crawler.ts`의 `NEC_SELECTORS` 객체를 업데이트하세요:

```typescript
const NEC_SELECTORS: NECSelectors = {
  listContainer: '.actual-list-container-class',
  politicianItem: '.actual-item-class',
  name: '.actual-name-class',
  party: '.actual-party-class',
  district: '.actual-district-class',
  contact: {
    phone: '.actual-phone-class',
    email: '.actual-email-class',
    office: '.actual-office-class',
  },
  career: '.actual-career-class',
  detailLink: 'a.actual-detail-link',
};
```

## Next.js API Route 예제

```typescript
// app/api/crawl/nec/route.ts
import { NextResponse } from 'next/server';
import { crawlNEC } from '@/lib/crawlers';

export async function POST() {
  try {
    const result = await crawlNEC({
      headless: true,
      timeout: 60000,
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data,
        stats: result.stats,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: { message: (error as Error).message },
    }, { status: 500 });
  }
}
```

## 주의사항

1. **크롤링 주기**: 서버 부하 방지를 위해 적절한 주기로 실행하세요
2. **User Agent**: 봇으로 인식되지 않도록 실제 브라우저 User Agent 사용
3. **에러 처리**: 네트워크 오류, 타임아웃 등 예외 처리 필수
4. **데이터 검증**: 수집된 데이터의 유효성 검증 필요
5. **법적 준수**: 웹사이트 이용약관 및 robots.txt 준수

## 라이선스

이 코드는 PoliticianFinder 프로젝트의 일부입니다.
