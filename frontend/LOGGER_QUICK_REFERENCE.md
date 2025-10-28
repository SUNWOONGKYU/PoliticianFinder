# Logger Quick Reference - P4B5

Quick reference guide for using the centralized error logging system.

---

## Import

```typescript
import {
  logger,
  logApiError,
  logSupabaseError,
  logAuthError,
  logRateLimitError,
  logPerformance,
  logComponentError
} from '@/lib/logger'
```

---

## Basic Usage

### 1. Error Logging
```typescript
logger.error('Database query failed', {
  endpoint: '/api/politicians',
  userId: user?.id,
  errorCode: 'DB_ERROR',
  metadata: { query: 'SELECT * FROM politicians' }
})
```

### 2. Warning Logging
```typescript
logger.warn('Approaching rate limit', {
  endpoint: '/api/ratings',
  userId: user.id,
  metadata: { remaining: 2, limit: 10 }
})
```

### 3. Info Logging
```typescript
logger.info('User action completed', {
  userId: user.id,
  metadata: { action: 'rating_created' }
})
```

### 4. Debug Logging (Dev only)
```typescript
logger.debug('Cache hit', {
  metadata: { cacheKey: 'politicians:page:1' }
})
```

---

## Specialized Functions

### API Route Errors
```typescript
export async function GET(request: NextRequest) {
  try {
    // your code
  } catch (error) {
    logApiError(request, error, 'GET /api/politicians', user?.id)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
```

### Supabase Errors
```typescript
const { data, error } = await supabase
  .from('politicians')
  .select('*')

if (error) {
  logSupabaseError('politicians', 'select', error, user?.id)
  return NextResponse.json({ error: 'Failed' }, { status: 500 })
}
```

### Authentication Errors
```typescript
const { error } = await supabase.auth.signIn({ email, password })
if (error) {
  logAuthError('login', error, email)
}
```

### Performance Tracking
```typescript
const startTime = Date.now()
const result = await slowOperation()
logPerformance('/api/endpoint', Date.now() - startTime)
```

---

## API Route Template

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { logger, logSupabaseError, logPerformance } from '@/lib/logger'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const supabase = createClient()
    const { data, error } = await supabase.from('table').select('*')

    if (error) {
      logSupabaseError('table', 'select', error)
      return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }

    // Log performance
    const duration = Date.now() - startTime
    logPerformance('/api/endpoint', duration)

    return NextResponse.json({
      data
    }, {
      headers: {
        'X-Query-Time': `${duration}ms`
      }
    })

  } catch (error) {
    logger.error('API Error', {
      endpoint: '/api/endpoint',
      method: 'GET',
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      stack: error instanceof Error ? error.stack : undefined,
      metadata: {
        message: error instanceof Error ? error.message : String(error)
      }
    })

    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
```

---

## Error Boundary (Client-Side)

### Usage in Layout
```typescript
// app/layout.tsx
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  )
}
```

### Custom Fallback
```typescript
<ErrorBoundary
  fallback={<div>Custom error UI</div>}
  onError={(error, info) => {
    // Additional error handling
    console.log('Caught error:', error)
  }}
>
  <YourComponent />
</ErrorBoundary>
```

### HOC Pattern
```typescript
import { withErrorBoundary } from '@/components/ErrorBoundary'

const SafeComponent = withErrorBoundary(MyComponent)
```

---

## Log Context Interface

```typescript
interface LogContext {
  endpoint?: string       // API endpoint path
  method?: string         // HTTP method
  userId?: string         // User identifier
  userEmail?: string      // User email (auto-masked)
  errorCode?: string      // Custom error code
  errorType?: string      // Error class name
  statusCode?: number     // HTTP status
  duration?: number       // Operation duration (ms)
  metadata?: Record<string, any>  // Additional data
  stack?: string          // Stack trace
}
```

---

## Security Notes

**Automatically Sanitized:**
- Passwords (removed)
- Tokens (removed)
- API keys (removed)
- Email addresses (masked: `us***@example.com`)
- Identifiers (truncated)

**Safe to Log:**
- User IDs (hashed)
- Error types/codes
- Endpoint paths
- Performance metrics

---

## Environment Behavior

### Development
- Verbose console output with colors
- Full error details
- All log levels output
- Stack traces visible

### Production
- Structured JSON logs
- Sensitive data sanitized
- Only info/warn/error levels
- Sent to Sentry (if configured)

### Test
- Minimal logging
- Only errors output
- No Sentry calls

---

## Performance Thresholds

```typescript
// Default threshold: 1000ms
logPerformance('/api/endpoint', duration)

// Custom threshold
logPerformance('/api/endpoint', duration, 500) // Warn if > 500ms
```

**Automatic Warnings:**
- Queries > 1000ms flagged as slow
- Logged with `warn` level
- Includes excess time in metadata

---

## Files Modified

### Core Files
- `src/lib/logger.ts` - Main logger implementation
- `src/components/ErrorBoundary.tsx` - React error boundary

### Updated API Routes
- `src/app/api/politicians/route.ts`
- `src/app/api/ratings/route.ts`
- `src/app/api/comments/route.ts`
- `src/lib/ratelimit.ts`

---

## Next Steps

1. **Install Sentry** (Optional, for production tracking)
   ```bash
   npm install @sentry/nextjs
   npx @sentry/wizard -i nextjs
   ```

2. **Add to More Routes**
   - `/api/likes/*`
   - `/api/notifications/*`
   - Authentication routes

3. **Set Up Monitoring**
   - Configure error alerts
   - Monitor performance metrics
   - Review logs weekly

---

## Common Patterns

### Check & Log Pattern
```typescript
if (error) {
  logSupabaseError('table', 'operation', error, userId)
  return errorResponse
}
```

### Try-Catch Pattern
```typescript
try {
  await operation()
} catch (error) {
  logger.error('Operation failed', { endpoint, userId })
  return errorResponse
}
```

### Performance Pattern
```typescript
const start = Date.now()
const result = await operation()
logPerformance('/api/endpoint', Date.now() - start)
```

---

**For Full Documentation**: See `P4B5_IMPLEMENTATION_SUMMARY.md`
