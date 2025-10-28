# Comments Security Implementation Guide

## 작업 ID: P2E2
**작성일**: 2025-01-17
**목적**: comments 테이블의 보안 구현 가이드 (XSS 방어, Rate Limiting, RLS)

---

## 1. Row Level Security (RLS) 정책

### 1.1 정책 개요

comments 테이블에는 4개의 핵심 RLS 정책이 적용됩니다:

| 정책 | 권한 | 설명 |
|------|------|------|
| SELECT | 모든 사용자 | 비로그인 포함 모든 사용자가 댓글 조회 가능 |
| INSERT | 인증된 사용자 | 로그인한 사용자만 본인 명의로 댓글 작성 |
| UPDATE | 댓글 작성자 | 본인이 작성한 댓글만 수정 가능 |
| DELETE | 2단계 권한 | 댓글 작성자 또는 게시글 작성자 |

### 1.2 2단계 삭제 권한 구조

```sql
-- 삭제 권한을 가진 사용자:
-- 1. 댓글 작성자 (자신의 댓글)
-- 2. 게시글 작성자 (자신의 게시글에 달린 모든 댓글)

CREATE POLICY "Users can delete their own comments or comments on their posts"
ON comments FOR DELETE
USING (
  auth.uid() IS NOT NULL
  AND (
    auth.uid() = user_id  -- 본인 댓글
    OR
    EXISTS (  -- 본인 게시글의 댓글
      SELECT 1 FROM posts
      WHERE posts.id = comments.post_id
      AND posts.user_id = auth.uid()
    )
  )
);
```

### 1.3 마이그레이션 실행

```bash
# RLS 정책 적용
supabase migration up 20250117_comments_rls_policies.sql

# 롤백이 필요한 경우
supabase migration up 20250117_rollback_comments_rls.sql

# 테스트 실행
supabase migration up 20250117_test_comments_rls.sql
```

---

## 2. XSS (Cross-Site Scripting) 방어

### 2.1 프론트엔드 새니타이징

#### DOMPurify 설치
```bash
npm install dompurify
npm install @types/dompurify --save-dev
```

#### React 컴포넌트에서 사용
```typescript
import DOMPurify from 'dompurify'
import { Comment } from '@/types/comment'

interface CommentDisplayProps {
  comment: Comment
}

export function CommentDisplay({ comment }: CommentDisplayProps) {
  // HTML 새니타이징
  const sanitizedContent = DOMPurify.sanitize(comment.content, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: []
  })

  return (
    <div className="comment">
      <div className="comment-header">
        <span className="author">{comment.user_name}</span>
        <time>{comment.created_at}</time>
      </div>
      <div
        className="comment-content"
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      />
    </div>
  )
}
```

### 2.2 서버사이드 검증

```typescript
// api/app/services/comment-validator.ts
import validator from 'validator'

export class CommentValidator {
  static validateContent(content: string): { valid: boolean; error?: string } {
    // 길이 체크
    if (!content || content.length < 1) {
      return { valid: false, error: 'Comment cannot be empty' }
    }

    if (content.length > 5000) {
      return { valid: false, error: 'Comment is too long (max 5000 characters)' }
    }

    // Script 태그 체크
    if (/<script/i.test(content)) {
      return { valid: false, error: 'Invalid content detected' }
    }

    // SQL Injection 패턴 체크
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE)\b)/i,
      /(--|\||;|\/\*|\*\/)/
    ]

    for (const pattern of sqlPatterns) {
      if (pattern.test(content)) {
        return { valid: false, error: 'Invalid content detected' }
      }
    }

    return { valid: true }
  }

  static escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    }

    return text.replace(/[&<>"'\/]/g, (char) => map[char])
  }
}
```

### 2.3 Content Security Policy (CSP) 설정

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // CSP 헤더 설정
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' https://api.supabase.io",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ')
  )

  // 기타 보안 헤더
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  return response
}

export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)'
}
```

---

## 3. Rate Limiting 구현

### 3.1 Redis 기반 Rate Limiting

#### 설치
```bash
npm install ioredis
npm install @upstash/redis @upstash/ratelimit
```

#### Rate Limiter 구현
```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Redis 클라이언트 생성
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!
})

// Rate Limiters
export const commentRateLimits = {
  // 댓글 작성: 1분당 10개
  create: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    analytics: true,
    prefix: 'rl:comment:create'
  }),

  // 댓글 수정: 5분당 20개
  update: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '5 m'),
    analytics: true,
    prefix: 'rl:comment:update'
  }),

  // 댓글 삭제: 1분당 5개
  delete: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'),
    analytics: true,
    prefix: 'rl:comment:delete'
  })
}
```

### 3.2 API Route에서 사용

```typescript
// app/api/comments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { commentRateLimits } from '@/lib/rate-limit'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    // 사용자 인증 확인
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Rate Limiting 체크
    const { success, limit, reset, remaining } = await commentRateLimits.create.limit(
      user.id
    )

    if (!success) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          retryAfter: Math.floor((reset - Date.now()) / 1000)
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': new Date(reset).toISOString()
          }
        }
      )
    }

    // 댓글 내용 검증
    const body = await request.json()
    const { post_id, content, parent_id } = body

    // XSS 및 스팸 체크
    if (isSpam(content) || containsProfanity(content)) {
      return NextResponse.json(
        { error: 'Invalid content' },
        { status: 400 }
      )
    }

    // 댓글 생성
    const { data, error } = await supabase
      .from('comments')
      .insert({
        user_id: user.id,
        post_id,
        parent_id,
        content
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(data, {
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': new Date(reset).toISOString()
      }
    })
  } catch (error) {
    console.error('Comment creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### 3.3 메모리 기반 Rate Limiting (개발용)

```typescript
// lib/simple-rate-limit.ts
interface RateLimitEntry {
  count: number
  resetAt: number
}

class SimpleRateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map()

  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}

  check(identifier: string): { success: boolean; remaining: number; resetAt: number } {
    const now = Date.now()
    const entry = this.limits.get(identifier)

    if (!entry || entry.resetAt < now) {
      // 새 윈도우 시작
      this.limits.set(identifier, {
        count: 1,
        resetAt: now + this.windowMs
      })

      return {
        success: true,
        remaining: this.maxRequests - 1,
        resetAt: now + this.windowMs
      }
    }

    if (entry.count >= this.maxRequests) {
      return {
        success: false,
        remaining: 0,
        resetAt: entry.resetAt
      }
    }

    entry.count++
    return {
      success: true,
      remaining: this.maxRequests - entry.count,
      resetAt: entry.resetAt
    }
  }

  // 메모리 정리 (주기적으로 실행)
  cleanup() {
    const now = Date.now()
    for (const [key, entry] of this.limits.entries()) {
      if (entry.resetAt < now) {
        this.limits.delete(key)
      }
    }
  }
}

// 싱글톤 인스턴스
export const commentCreateLimiter = new SimpleRateLimiter(10, 60000) // 1분당 10개
export const commentUpdateLimiter = new SimpleRateLimiter(20, 300000) // 5분당 20개
export const commentDeleteLimiter = new SimpleRateLimiter(5, 60000) // 1분당 5개

// 정리 작업 예약
setInterval(() => {
  commentCreateLimiter.cleanup()
  commentUpdateLimiter.cleanup()
  commentDeleteLimiter.cleanup()
}, 60000) // 1분마다 정리
```

---

## 4. 스팸 및 악용 방지

### 4.1 스팸 필터링

```typescript
// services/spam-filter.ts
export class SpamFilter {
  // 반복 문자 체크
  static hasExcessiveRepeats(text: string, maxRepeats: number = 10): boolean {
    const pattern = new RegExp(`(.)\\1{${maxRepeats - 1},}`)
    return pattern.test(text)
  }

  // 과도한 링크 체크
  static hasTooManyLinks(text: string, maxLinks: number = 3): boolean {
    const linkPattern = /https?:\/\/[^\s]+/g
    const links = text.match(linkPattern) || []
    return links.length > maxLinks
  }

  // 과도한 대문자 체크
  static hasExcessiveCaps(text: string, maxRatio: number = 0.7): boolean {
    if (text.length < 10) return false

    const capsCount = (text.match(/[A-Z]/g) || []).length
    const ratio = capsCount / text.length
    return ratio > maxRatio
  }

  // 빈 공백 스팸 체크
  static isWhitespaceSpam(text: string): boolean {
    const trimmed = text.trim()
    return trimmed.length === 0 || /^\s+$/.test(text)
  }

  // 종합 스팸 체크
  static isSpam(text: string): boolean {
    return (
      this.hasExcessiveRepeats(text) ||
      this.hasTooManyLinks(text) ||
      this.hasExcessiveCaps(text) ||
      this.isWhitespaceSpam(text)
    )
  }
}
```

### 4.2 욕설 필터링

```typescript
// services/profanity-filter.ts
import Filter from 'bad-words'

export class ProfanityFilter {
  private static filter = new Filter()

  // 커스텀 욕설 추가
  static {
    this.filter.addWords('customBadWord1', 'customBadWord2')
  }

  static containsProfanity(text: string): boolean {
    return this.filter.isProfane(text)
  }

  static clean(text: string): string {
    return this.filter.clean(text)
  }

  // 한국어 욕설 체크 (간단한 예시)
  static containsKoreanProfanity(text: string): boolean {
    const koreanProfanity = ['욕설1', '욕설2'] // 실제 구현에서는 완전한 목록 사용
    const lowerText = text.toLowerCase()

    return koreanProfanity.some(word => lowerText.includes(word))
  }
}
```

---

## 5. 모니터링 및 감사

### 5.1 보안 이벤트 로깅

```typescript
// services/security-logger.ts
export class SecurityLogger {
  static async logSecurityEvent(event: {
    type: 'XSS_ATTEMPT' | 'SQL_INJECTION' | 'RATE_LIMIT' | 'SPAM' | 'PROFANITY'
    userId?: string
    ip?: string
    content?: string
    metadata?: any
  }) {
    const log = {
      ...event,
      timestamp: new Date().toISOString(),
      id: crypto.randomUUID()
    }

    // 데이터베이스에 로그 저장
    await supabase
      .from('security_logs')
      .insert(log)

    // 심각한 이벤트는 알림 발송
    if (event.type === 'SQL_INJECTION' || event.type === 'XSS_ATTEMPT') {
      await this.sendAlert(log)
    }

    console.warn('Security Event:', log)
  }

  static async sendAlert(log: any) {
    // 이메일, Slack 등으로 알림 발송
    // 구현 예정
  }
}
```

### 5.2 정기 보안 감사

```sql
-- 보안 감사 쿼리
-- 비정상적인 댓글 패턴 감지
SELECT
  user_id,
  COUNT(*) as comment_count,
  MIN(created_at) as first_comment,
  MAX(created_at) as last_comment,
  EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) / 60 as minutes_span
FROM comments
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY user_id
HAVING COUNT(*) > 20  -- 1시간에 20개 이상
ORDER BY comment_count DESC;

-- 삭제된 댓글 추적
SELECT
  c.user_id as comment_author,
  p.user_id as post_author,
  COUNT(*) as deleted_count
FROM deleted_comments_log c
JOIN posts p ON c.post_id = p.id
WHERE c.deleted_at > NOW() - INTERVAL '24 hours'
  AND c.deleted_by != c.user_id  -- 본인이 아닌 사람이 삭제
GROUP BY c.user_id, p.user_id
ORDER BY deleted_count DESC;
```

---

## 6. 테스트 체크리스트

### 보안 테스트
- [ ] RLS 정책 4개 모두 작동 확인
- [ ] 2단계 삭제 권한 확인
- [ ] XSS 공격 시도 차단
- [ ] SQL Injection 방어 확인
- [ ] CSRF 토큰 검증

### 성능 테스트
- [ ] 대량 댓글 조회 성능 (< 1초)
- [ ] RLS 권한 체크 성능 (< 100ms)
- [ ] Rate Limiting 응답 시간

### 기능 테스트
- [ ] 댓글 CRUD 작동
- [ ] 대댓글 구조 작동
- [ ] CASCADE 삭제 확인
- [ ] 스팸 필터링 작동
- [ ] 욕설 필터링 작동

---

## 7. 트러블슈팅

### 문제: RLS 정책이 적용되지 않음
**해결방법**:
```sql
-- RLS 활성화 확인
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'comments';

-- 정책 재생성
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
```

### 문제: Rate Limiting이 작동하지 않음
**해결방법**:
```typescript
// Redis 연결 확인
const redis = new Redis(...)
await redis.ping() // PONG 응답 확인

// 로컬 개발 시 메모리 기반 사용
if (process.env.NODE_ENV === 'development') {
  // SimpleRateLimiter 사용
}
```

### 문제: XSS 공격이 차단되지 않음
**해결방법**:
```typescript
// DOMPurify 설정 강화
const clean = DOMPurify.sanitize(dirty, {
  ALLOWED_TAGS: [],  // 모든 태그 제거
  KEEP_CONTENT: true  // 텍스트만 유지
})
```

---

## 8. 참고 자료

- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [OWASP SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)
- [Upstash Rate Limiting](https://docs.upstash.com/redis/sdks/ratelimit)