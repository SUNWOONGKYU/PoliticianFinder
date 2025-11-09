# NEC Crawler - Quick Reference Card

**Task**: P4BA1 | **Version**: 1.0.0 | **Date**: 2025-11-09

## 30-Second Start

```typescript
import { crawlNEC } from '@/lib/crawlers';

const result = await crawlNEC();
console.log(result.data); // Array of politicians
```

## Installation

```bash
npx playwright install chromium
```

## Import Patterns

```typescript
// Option 1: Named imports
import { crawlNEC, createNECCrawler, CrawlErrorCode } from '@/lib/crawlers';

// Option 2: Import specific modules
import { NECCrawler } from '@/lib/crawlers/nec-crawler';
import { retry, cleanText } from '@/lib/crawlers/utils';
import type { PoliticianCrawlData, CrawlerOptions } from '@/lib/crawlers/types';
```

## Core Functions

### crawlNEC()
Quick crawl with default options
```typescript
const result = await crawlNEC({ timeout: 60000 });
```

### createNECCrawler()
Create crawler instance with custom options
```typescript
const crawler = createNECCrawler({ maxRetries: 5 });
const result = await crawler.crawl();
```

### crawlAndSaveNEC()
Crawl and save to JSON file
```typescript
await crawlAndSaveNEC('./data/politicians.json');
```

## API Routes

### POST /api/crawl/nec
```bash
curl -X POST http://localhost:3000/api/crawl/nec \
  -H "Content-Type: application/json" \
  -d '{"options": {"timeout": 60000}}'
```

### GET /api/crawl/nec
```bash
curl http://localhost:3000/api/crawl/nec
```

## Common Options

```typescript
{
  timeout: 60000,      // 60 seconds
  maxRetries: 3,       // 3 attempts
  retryDelay: 2000,    // 2 second delay
  headless: true,      // No UI
  waitTime: 2000       // 2 second wait
}
```

## Data Structure

```typescript
{
  name: "홍길동",
  party: "더불어민주당",
  district: "서울 강남구",
  contact: {
    phone: "02-1234-5678",
    email: "example@example.com",
    office: "서울시 강남구..."
  },
  career: [
    { period: "2020-2024", description: "국회의원" }
  ],
  metadata: {
    crawledAt: Date,
    sourceUrl: "https://...",
    confidence: 0.95
  }
}
```

## Error Handling

```typescript
const result = await crawlNEC();

if (!result.success) {
  switch (result.error?.code) {
    case 'NETWORK_ERROR':
    case 'TIMEOUT':
    case 'RATE_LIMIT':
      // Retryable - try again
      break;
    case 'SELECTOR_NOT_FOUND':
      // Update selectors in nec-crawler.ts
      break;
    default:
      // Handle other errors
  }
}
```

## Utility Functions

```typescript
import {
  cleanText,           // Clean whitespace
  formatPhoneNumber,   // Format phone: "02-1234-5678"
  isValidEmail,        // Validate email
  parseCareer,         // Parse career text
  retry,               // Retry with backoff
  sleep,              // Async delay
} from '@/lib/crawlers';

const clean = cleanText('  text  '); // "text"
const phone = formatPhoneNumber('0212345678'); // "02-1234-5678"
const valid = isValidEmail('test@example.com'); // true
```

## React Hook Example

```typescript
function useCrawler() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const crawl = async () => {
    setLoading(true);
    const res = await fetch('/api/crawl/nec', { method: 'POST' });
    const result = await res.json();
    setData(result.data);
    setLoading(false);
  };

  return { loading, data, crawl };
}
```

## TypeScript Types

```typescript
import type {
  PoliticianCrawlData,  // Main data type
  CrawlerOptions,       // Config options
  CrawlResult,          // Result type
  CrawlError,           // Error type
  CrawlStats,           // Statistics
} from '@/lib/crawlers';
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `SELECTOR_NOT_FOUND` | Update selectors in `nec-crawler.ts` |
| `TIMEOUT` | Increase `timeout` option |
| Browser error | Run `npx playwright install chromium` |
| Import error | Check `@/*` alias in `tsconfig.json` |

## File Locations

```
src/lib/crawlers/
├── index.ts              # Main entry
├── nec-crawler.ts        # Crawler implementation
├── types.ts              # Type definitions
├── utils.ts              # Utility functions
├── example.ts            # Examples
├── README.md             # Full guide
└── API_DOCUMENTATION.md  # API reference

src/app/api/crawl/nec/
└── route.ts              # API endpoint
```

## Updating Selectors

```typescript
// File: src/lib/crawlers/nec-crawler.ts
const NEC_SELECTORS: NECSelectors = {
  listContainer: '.your-container-class',
  politicianItem: '.your-item-class',
  name: '.your-name-class',
  party: '.your-party-class',
  district: '.your-district-class',
  contact: {
    phone: '.your-phone-class',
    email: '.your-email-class',
    office: '.your-office-class',
  },
  career: '.your-career-class',
};
```

## Performance Tips

1. Use `headless: true` on server
2. Set reasonable `timeout` (30-60s)
3. Implement caching for results
4. Add rate limiting for API
5. Monitor retry counts

## Testing

```bash
# Type check
npm run type-check

# Build
npm run build

# Manual test
node -e "import('./src/lib/crawlers').then(m => m.crawlNEC())"
```

## Key Files to Read

1. **README.md** - User guide (start here)
2. **API_DOCUMENTATION.md** - API reference (detailed)
3. **example.ts** - Code examples (practical)

## Support

- 📖 README.md - User guide
- 📚 API_DOCUMENTATION.md - API docs
- 💡 example.ts - Code examples
- 📝 IMPLEMENTATION_SUMMARY.md - Overview

---

**Quick Links**:
- [README](./README.md)
- [API Docs](./API_DOCUMENTATION.md)
- [Examples](./example.ts)
- [Types](./types.ts)
