# NEC Crawler API Documentation

**Task**: P4BA1 - 선관위 크롤링 스크립트
**Version**: 1.0.0
**Last Updated**: 2025-11-09

## Overview

선관위(중앙선거관리위원회) 웹사이트에서 정치인 정보를 자동으로 수집하는 크롤러입니다.

## API Endpoints

### POST /api/crawl/nec

선관위 크롤링을 실행합니다.

**Request:**

```typescript
POST /api/crawl/nec
Content-Type: application/json

{
  "options": {
    "timeout": 60000,      // Optional: 타임아웃 (밀리초)
    "maxRetries": 3,       // Optional: 최대 재시도 횟수
    "retryDelay": 2000,    // Optional: 재시도 간격 (밀리초)
    "waitTime": 2000       // Optional: 페이지 로딩 대기 시간
  }
}
```

**Response (Success):**

```typescript
{
  "success": true,
  "message": "Successfully crawled 100 politicians",
  "data": [
    {
      "name": "홍길동",
      "party": "더불어민주당",
      "district": "서울 강남구",
      "contact": {
        "phone": "02-1234-5678",
        "email": "example@example.com",
        "office": "서울시 강남구 테헤란로 123"
      },
      "career": [
        {
          "period": "2020-2024",
          "description": "제21대 국회의원"
        },
        {
          "period": "2016-2020",
          "description": "서울시의원"
        }
      ],
      "metadata": {
        "crawledAt": "2025-11-09T10:30:00.000Z",
        "sourceUrl": "https://www.nec.go.kr/...",
        "confidence": 0.95
      }
    }
    // ... more politicians
  ],
  "stats": {
    "startTime": "2025-11-09T10:28:00.000Z",
    "endTime": "2025-11-09T10:30:00.000Z",
    "duration": 120000,
    "itemsCollected": 100,
    "itemsFailed": 5,
    "retryCount": 2
  }
}
```

**Response (Error):**

```typescript
{
  "success": false,
  "error": {
    "code": "TIMEOUT",
    "message": "Crawling timeout after 60000ms",
    "retryable": true
  },
  "stats": {
    "startTime": "2025-11-09T10:28:00.000Z",
    "endTime": "2025-11-09T10:29:00.000Z",
    "duration": 60000,
    "itemsCollected": 0,
    "itemsFailed": 0,
    "retryCount": 3
  }
}
```

**Status Codes:**

- `200 OK` - 크롤링 성공
- `500 Internal Server Error` - 크롤링 실패

### GET /api/crawl/nec

크롤러 정보를 조회합니다.

**Request:**

```
GET /api/crawl/nec
```

**Response:**

```typescript
{
  "service": "NEC Crawler",
  "description": "중앙선거관리위원회 정치인 정보 크롤러",
  "version": "1.0.0",
  "endpoints": {
    "POST": {
      "description": "크롤링 실행",
      "body": { ... }
    }
  },
  "usage": { ... }
}
```

## Type Definitions

### PoliticianCrawlData

```typescript
interface PoliticianCrawlData {
  name: string;           // 정치인 이름
  party: string;          // 소속 정당
  district: string;       // 지역구
  contact: {
    phone?: string;       // 전화번호 (형식: 02-1234-5678)
    email?: string;       // 이메일
    office?: string;      // 사무실 주소
  };
  career: CareerItem[];   // 약력
  metadata: {
    crawledAt: Date;      // 크롤링 일시
    sourceUrl: string;    // 출처 URL
    confidence: number;   // 신뢰도 (0-1)
  };
}
```

### CareerItem

```typescript
interface CareerItem {
  period: string;         // 기간 (예: "2020-2024")
  description: string;    // 내용
}
```

### CrawlerOptions

```typescript
interface CrawlerOptions {
  timeout?: number;       // 타임아웃 (기본: 30000ms)
  maxRetries?: number;    // 최대 재시도 (기본: 3회)
  retryDelay?: number;    // 재시도 간격 (기본: 2000ms)
  headless?: boolean;     // 헤드리스 모드 (기본: true)
  userAgent?: string;     // User Agent
  waitTime?: number;      // 페이지 대기 시간 (기본: 2000ms)
}
```

### CrawlResult

```typescript
interface CrawlResult {
  success: boolean;
  data: PoliticianCrawlData[];
  error?: CrawlError;
  stats: CrawlStats;
}
```

### CrawlError

```typescript
interface CrawlError {
  code: CrawlErrorCode;   // 에러 코드
  message: string;        // 에러 메시지
  stack?: string;         // 스택 트레이스
  retryable: boolean;     // 재시도 가능 여부
}

enum CrawlErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  PARSING_ERROR = 'PARSING_ERROR',
  SELECTOR_NOT_FOUND = 'SELECTOR_NOT_FOUND',
  INVALID_DATA = 'INVALID_DATA',
  RATE_LIMIT = 'RATE_LIMIT',
  UNKNOWN = 'UNKNOWN',
}
```

### CrawlStats

```typescript
interface CrawlStats {
  startTime: Date;        // 시작 시간
  endTime: Date;          // 종료 시간
  duration: number;       // 소요 시간 (밀리초)
  itemsCollected: number; // 수집 성공 항목 수
  itemsFailed: number;    // 수집 실패 항목 수
  retryCount: number;     // 재시도 횟수
}
```

## Error Codes

| Code | Description | Retryable |
|------|-------------|-----------|
| `NETWORK_ERROR` | 네트워크 연결 오류 | ✅ Yes |
| `TIMEOUT` | 타임아웃 오류 | ✅ Yes |
| `RATE_LIMIT` | API 호출 제한 | ✅ Yes |
| `PARSING_ERROR` | 데이터 파싱 오류 | ❌ No |
| `SELECTOR_NOT_FOUND` | HTML 선택자를 찾을 수 없음 | ❌ No |
| `INVALID_DATA` | 유효하지 않은 데이터 | ❌ No |
| `UNKNOWN` | 알 수 없는 오류 | ❌ No |

## Usage Examples

### Example 1: Basic Usage (JavaScript/TypeScript)

```typescript
// Client-side (Browser)
async function fetchPoliticians() {
  const response = await fetch('/api/crawl/nec', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      options: {
        timeout: 60000,
        maxRetries: 3,
      }
    }),
  });

  const result = await response.json();

  if (result.success) {
    console.log('Politicians:', result.data);
    console.log('Stats:', result.stats);
  } else {
    console.error('Error:', result.error);
  }
}
```

### Example 2: Using fetch with error handling

```typescript
async function crawlWithErrorHandling() {
  try {
    const response = await fetch('/api/crawl/nec', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const result = await response.json();

    if (!result.success) {
      if (result.error.retryable) {
        console.log('Retryable error, trying again...');
        // Implement retry logic
      } else {
        console.error('Fatal error:', result.error.message);
      }
    }
  } catch (error) {
    console.error('Request failed:', error);
  }
}
```

### Example 3: Using axios

```typescript
import axios from 'axios';

async function crawlWithAxios() {
  try {
    const { data } = await axios.post('/api/crawl/nec', {
      options: {
        timeout: 60000,
        maxRetries: 5,
      }
    });

    if (data.success) {
      return data.data; // Return politicians array
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('API Error:', error.response?.data);
    }
    throw error;
  }
}
```

### Example 4: React Hook

```typescript
import { useState, useCallback } from 'react';

function usePoliticianCrawler() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const crawl = useCallback(async (options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/crawl/nec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ options }),
      });

      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError({ message: err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, data, error, crawl };
}

// Usage in component
function PoliticianList() {
  const { loading, data, error, crawl } = usePoliticianCrawler();

  return (
    <div>
      <button onClick={() => crawl()} disabled={loading}>
        {loading ? 'Crawling...' : 'Crawl Politicians'}
      </button>

      {error && <p>Error: {error.message}</p>}

      {data && (
        <ul>
          {data.map(politician => (
            <li key={politician.name}>
              {politician.name} - {politician.party}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### Example 5: Direct Library Usage (Server-side only)

```typescript
import { crawlNEC, createNECCrawler } from '@/lib/crawlers';

// Option 1: Quick usage
const result = await crawlNEC({
  timeout: 60000,
  maxRetries: 3,
});

// Option 2: Using crawler instance
const crawler = createNECCrawler({
  headless: true,
  timeout: 60000,
});

const result = await crawler.crawl();

// Option 3: Save to file
import { crawlAndSaveNEC } from '@/lib/crawlers';

const result = await crawlAndSaveNEC('./data/politicians.json');
```

## Performance Considerations

### Recommended Settings

```typescript
{
  timeout: 60000,        // 60초 (대용량 데이터 수집 시)
  maxRetries: 3,         // 3회 재시도
  retryDelay: 2000,      // 2초 간격
  waitTime: 2000,        // 페이지 로딩 2초 대기
  headless: true         // 서버에서는 항상 true
}
```

### Performance Tips

1. **Batch Processing**: 대량 크롤링 시 배치로 처리
2. **Caching**: 결과를 캐싱하여 재사용
3. **Rate Limiting**: 서버 부하 방지를 위해 적절한 간격으로 실행
4. **Timeout**: 적절한 타임아웃 설정 (최소 30초 권장)
5. **Error Handling**: 재시도 가능한 에러는 자동으로 재시도

## Security Notes

1. **API 보안**: 프로덕션에서는 인증/인가 미들웨어 추가 필요
2. **Rate Limiting**: API 호출 제한 구현 권장
3. **Input Validation**: 요청 데이터 검증 필수
4. **CORS**: 필요한 경우 CORS 설정
5. **Logging**: 크롤링 이력 로깅 및 모니터링

## Troubleshooting

### 문제: SELECTOR_NOT_FOUND 에러

**원인**: 선관위 웹사이트 구조 변경

**해결**:
1. `src/lib/crawlers/nec-crawler.ts` 파일 열기
2. `NEC_SELECTORS` 객체의 선택자 업데이트
3. 실제 웹사이트 HTML 구조 분석 후 수정

### 문제: TIMEOUT 에러

**원인**: 네트워크 속도 또는 서버 응답 지연

**해결**:
- `timeout` 값 증가 (60000ms 이상)
- `waitTime` 값 증가
- `maxRetries` 값 증가

### 문제: Playwright 브라우저 실행 오류

**원인**: Playwright 브라우저 미설치

**해결**:
```bash
npx playwright install chromium
```

## Changelog

### v1.0.0 (2025-11-09)
- Initial release
- NEC crawler implementation
- API routes
- Error handling
- Retry logic
- Documentation

## License

PoliticianFinder Project - Internal Use Only
