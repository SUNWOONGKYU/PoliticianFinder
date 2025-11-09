# Profanity Filter Usage Guide

## Overview
The profanity filter provides comprehensive Korean profanity detection and filtering capabilities with multiple severity levels and filtering strategies.

## Installation

No external dependencies required. The implementation uses built-in JavaScript/TypeScript features.

> **Note**: The task specification mentioned `hangul-js`, but the current implementation uses regex patterns and string manipulation instead, which is more lightweight and sufficient for the requirements.

## API Reference

### 1. `containsProfanity(text: string): boolean`

Simple check if text contains profanity.

```typescript
import { containsProfanity } from '@/lib/utils/profanity-filter'

// Returns false for clean text
containsProfanity('안녕하세요') // false

// Returns true for profanity
containsProfanity('시발') // true
containsProfanity('ㅅㅂ') // true (detects variants)
```

### 2. `detectProfanity(text: string): ProfanityDetectionResult`

Detailed profanity detection with positions and severity levels.

```typescript
import { detectProfanity } from '@/lib/utils/profanity-filter'

const result = detectProfanity('이 시발 새끼야')
// {
//   hasProfanity: true,
//   detectedWords: ['시발', '새끼'],
//   maxLevel: 3,
//   positions: [2, 5]
// }
```

### 3. `filterProfanity(text: string, maskChar?: string, keepFirstChar?: boolean): string`

Filter and mask profanity in text.

```typescript
import { filterProfanity } from '@/lib/utils/profanity-filter'

// Default: Keep first character
filterProfanity('시발 새끼야') // '시** 새**야'

// Full masking
filterProfanity('시발 새끼야', '*', false) // '** **야'

// Custom mask character
filterProfanity('시발', '#', true) // '시##'
```

### 4. `censorProfanity(text: string): string | null`

Reject text entirely if it contains profanity.

```typescript
import { censorProfanity } from '@/lib/utils/profanity-filter'

censorProfanity('안녕하세요') // '안녕하세요'
censorProfanity('시발') // null
```

### 5. `validateProfanity(text: string, fieldName?: string): ValidationResult`

API-friendly validation with error messages.

```typescript
import { validateProfanity } from '@/lib/utils/profanity-filter'

validateProfanity('안녕하세요', 'content')
// { valid: true }

validateProfanity('시발', 'content')
// { valid: false, error: 'content 필드에 부적절한 언어가 포함되어 있습니다.' }
```

### 6. `filterByLevel(text: string, allowedLevel: ProfanityLevel): FilterResult`

Level-based filtering policy.

```typescript
import { filterByLevel, ProfanityLevel } from '@/lib/utils/profanity-filter'

// Allow mild profanity
filterByLevel('미친듯이 재밌어요', ProfanityLevel.MILD)
// { allowed: true, filtered: '미친듯이 재밌어요' }

// Block severe profanity
filterByLevel('시발 새끼야', ProfanityLevel.MODERATE)
// { allowed: false, filtered: '시** 새**야' }
```

### 7. `getProfanityStats(text: string): ProfanityStats`

Get detailed statistics about profanity in text.

```typescript
import { getProfanityStats } from '@/lib/utils/profanity-filter'

const stats = getProfanityStats('시발 이게 뭐야')
// {
//   totalWords: 3,
//   profanityCount: 1,
//   profanityRatio: 0.33,
//   detectedWords: ['시발'],
//   maxLevel: 3
// }
```

## Profanity Levels

```typescript
export enum ProfanityLevel {
  MILD = 1,      // 경미한 비속어 (미친, 또라이)
  MODERATE = 2,  // 중간 수준 (병신, 지랄)
  SEVERE = 3,    // 심각한 욕설 (시발, 새끼)
  EXTREME = 4,   // 극심한 욕설 (좆, 존나, 개새끼)
}
```

## Usage Examples

### Example 1: Post/Comment Validation

```typescript
// In API route handler
import { validateProfanity } from '@/lib/utils/profanity-filter'

export async function POST(request: Request) {
  const { content } = await request.json()

  // Validate for profanity
  const validation = validateProfanity(content, 'content')

  if (!validation.valid) {
    return Response.json({
      success: false,
      error: validation.error
    }, { status: 400 })
  }

  // Proceed with saving...
}
```

### Example 2: Content Filtering

```typescript
// Filter user-generated content before display
import { filterProfanity } from '@/lib/utils/profanity-filter'

function displayComment(comment: string) {
  const filtered = filterProfanity(comment)
  return <div>{filtered}</div>
}
```

### Example 3: Strict Censorship

```typescript
// Reject any content with profanity
import { censorProfanity } from '@/lib/utils/profanity-filter'

const processedContent = censorProfanity(userInput)
if (processedContent === null) {
  throw new Error('부적절한 언어가 포함되어 있습니다.')
}
```

### Example 4: Level-based Moderation

```typescript
// Different policies for different contexts
import { filterByLevel, ProfanityLevel } from '@/lib/utils/profanity-filter'

// Strict policy for public posts
const publicPost = filterByLevel(content, ProfanityLevel.MILD)
if (!publicPost.allowed) {
  return publicPost.filtered // Return masked version
}

// Lenient policy for user profiles
const profileBio = filterByLevel(bio, ProfanityLevel.MODERATE)
```

## Detection Features

### 1. Exact Matching
Detects exact profanity words:
- 시발, 씨발, 개새끼, 병신, etc.

### 2. Variant Detection
Detects common variations:
- Consonant-only: ㅅㅂ, ㅆㅂ, ㅂㅅ, ㅈㄴ
- Special character insertion: 시-발, 시.발
- Character substitution: 시1발, s1발

### 3. Whitelist/Exceptions
Excludes legitimate words that might contain profanity:
- 개발자 (developer)
- 개선 (improvement)
- 새로운 (new)
- 미친듯이 (like crazy - positive usage)

## Best Practices

1. **API Validation**: Use `validateProfanity()` in API routes for user input
2. **Display Filtering**: Use `filterProfanity()` for displaying user-generated content
3. **Strict Moderation**: Use `censorProfanity()` for zero-tolerance contexts
4. **Level-based**: Use `filterByLevel()` for context-dependent policies
5. **Analytics**: Use `getProfanityStats()` for moderation analytics

## Performance Considerations

- All functions handle empty/null input gracefully
- Regex patterns are pre-compiled for efficiency
- Normalization removes special characters to catch variants
- Whitelist check prevents false positives

## Extending the Filter

To add new profanity words:

1. Edit `profanity-words.ts`
2. Add to `profanityWords` array for exact matching
3. Add to `profanityPatterns` for variant detection
4. Set severity in `profanityLevels` mapping
5. Run tests to verify

```typescript
// In profanity-words.ts
export const profanityWords: string[] = [
  // ... existing words
  '새로운욕설',
]

export const profanityLevels: Record<string, ProfanityLevel> = {
  // ... existing levels
  '새로운욕설': ProfanityLevel.SEVERE,
}
```
