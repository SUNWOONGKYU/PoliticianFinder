# Utils Library

## Profanity Filter (P4BA5)

Comprehensive Korean profanity detection and filtering system.

### Quick Start

```typescript
import { validateProfanity, filterProfanity } from '@/lib/utils/profanity-filter'

// API Validation
const validation = validateProfanity(userInput, 'content')
if (!validation.valid) {
  return Response.json({ error: validation.error }, { status: 400 })
}

// Content Filtering
const filtered = filterProfanity(userInput) // "시발" → "시**"
```

### Available Functions

1. **containsProfanity(text)** - Simple boolean check
2. **detectProfanity(text)** - Detailed detection with positions & levels
3. **filterProfanity(text)** - Mask profanity with asterisks
4. **censorProfanity(text)** - Reject if profanity found (returns null)
5. **validateProfanity(text, field)** - API validation with error messages
6. **filterByLevel(text, level)** - Level-based filtering policy
7. **getProfanityStats(text)** - Statistical analysis

### Documentation

- **Usage Guide**: [profanity-filter-usage.md](./profanity-filter-usage.md)
- **API Examples**: [profanity-filter-api-example.ts](./profanity-filter-api-example.ts)
- **Implementation Summary**: [P4BA5_IMPLEMENTATION_SUMMARY.md](./P4BA5_IMPLEMENTATION_SUMMARY.md)

### Features

- ✅ 42+ Korean profanity words
- ✅ 10+ regex patterns for variant detection
- ✅ 4-level severity system (MILD, MODERATE, SEVERE, EXTREME)
- ✅ Whitelist for false-positive prevention
- ✅ Comprehensive test coverage (25+ tests)
- ✅ TypeScript support with full type definitions

### Detection Capabilities

- Exact matching: 시발, 개새끼, 병신
- Variant detection: ㅅㅂ, ㅆㅂ, ㅂㅅ
- Special char bypass: 시-발, 시.발
- Whitelist exceptions: 개발자, 개선, 새로운

### Severity Levels

```typescript
enum ProfanityLevel {
  MILD = 1,      // 미친, 또라이
  MODERATE = 2,  // 병신, 지랄
  SEVERE = 3,    // 시발, 새끼
  EXTREME = 4,   // 좆, 존나, 개새끼
}
```

### Integration Points

Recommended for use in:
- Post/Comment creation APIs (P3BA3, P3BA4, P4BA1, P4BA2)
- User profile updates (P1BA4, P3BA4)
- Admin moderation tools (P4BA6, P4BA7)
- Real-time validation endpoints

### Tests

Run tests:
```bash
npm test profanity-filter
```

All 25 test cases passing ✅
