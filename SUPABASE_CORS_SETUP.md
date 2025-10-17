# Supabase CORS Configuration Guide

## Overview

This guide explains how to configure CORS settings in Supabase for the PoliticianFinder application. Supabase handles CORS automatically for most use cases, but understanding the configuration is important for security.

## Supabase CORS Behavior

### Default Behavior

Supabase automatically handles CORS for:
- **Browser clients**: Using supabase-js SDK
- **Server-side clients**: No CORS restrictions
- **Mobile apps**: No CORS restrictions

### Key Points

1. **Automatic CORS Headers**: Supabase automatically adds appropriate CORS headers to API responses
2. **Row Level Security (RLS)**: Primary security mechanism (more important than CORS)
3. **API Keys**: anon key for client-side, service_role key for server-side only

## Configuration Steps

### 1. Dashboard Settings

Navigate to: **Project Dashboard → Settings → API**

#### Allowed Origins

Supabase allows configuring custom origins if needed:

1. Go to **Settings → API**
2. Scroll to **CORS Configuration** (if available)
3. Add your domains:

**Development**:
```
http://localhost:3000
http://localhost:3001
http://127.0.0.1:3000
```

**Production**:
```
https://politicianfinder.vercel.app
https://www.politicianfinder.com
https://politicianfinder.com
```

### 2. API Keys Configuration

#### Anonymous (Public) Key

- **Usage**: Frontend client (browser)
- **Security**: Subject to RLS policies
- **CORS**: Automatically handled

```typescript
// Frontend configuration
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

#### Service Role Key

- **Usage**: Backend server only
- **Security**: Bypasses RLS - NEVER expose to client
- **CORS**: Not applicable (server-side only)

```python
# Backend configuration - NEVER in frontend
from supabase import create_client

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # Server-side only!
)
```

### 3. Row Level Security (RLS)

RLS is more important than CORS for Supabase security:

```sql
-- Enable RLS
ALTER TABLE politicians ENABLE ROW LEVEL SECURITY;

-- Policy: Public read access
CREATE POLICY "Public read access"
ON politicians FOR SELECT
USING (true);

-- Policy: Authenticated users can insert
CREATE POLICY "Authenticated insert"
ON politicians FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Policy: Users can only update their own records
CREATE POLICY "Users update own records"
ON politicians FOR UPDATE
USING (auth.uid() = user_id);
```

## Environment Variables

### Frontend (.env.local)

```env
# Public keys - safe to expose in browser
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Backend (.env)

```env
# Server-side only - NEVER expose to frontend
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## Frontend Implementation

### 1. Supabase Client Setup

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
```

### 2. Server Component Setup

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const createClient = () => {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
};
```

## Security Best Practices

### 1. API Key Security

**DO**:
- Use anon key for frontend/browser
- Use service_role key only in backend
- Store service_role key in environment variables
- Never commit keys to git

**DON'T**:
- Never expose service_role key to frontend
- Never hardcode keys in code
- Never use service_role key in browser
- Never share keys publicly

### 2. RLS Policies

**Always enable RLS** on tables:

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Enable RLS on all tables
ALTER TABLE politicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
```

### 3. CORS + RLS = Defense in Depth

```
┌─────────────────────────────────────────┐
│         Browser (Allowed Origin)        │
└─────────────────┬───────────────────────┘
                  │ CORS Check ✓
                  ↓
┌─────────────────────────────────────────┐
│          Supabase Edge Functions        │
│         (CORS Headers Applied)          │
└─────────────────┬───────────────────────┘
                  │ RLS Check
                  ↓
┌─────────────────────────────────────────┐
│          Database (RLS Enabled)         │
│        Only Authorized Data ✓           │
└─────────────────────────────────────────┘
```

## Testing CORS with Supabase

### 1. Browser Testing

```typescript
// Test from frontend
const { data, error } = await supabase
  .from('politicians')
  .select('*');

if (error) {
  console.error('Error:', error);
} else {
  console.log('Data:', data);
}

// Check browser DevTools → Network
// Look for CORS headers in response
```

### 2. Check CORS Headers

Expected headers in Supabase responses:
```
Access-Control-Allow-Origin: https://your-domain.com
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type
```

### 3. Test with curl

```bash
# Test preflight request
curl -X OPTIONS \
  -H "Origin: https://politicianfinder.vercel.app" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: apikey" \
  https://your-project.supabase.co/rest/v1/politicians

# Test actual request
curl -X GET \
  -H "Origin: https://politicianfinder.vercel.app" \
  -H "apikey: your-anon-key" \
  https://your-project.supabase.co/rest/v1/politicians
```

## Troubleshooting

### Issue 1: CORS Error with Supabase

**Error**:
```
Access to fetch at 'https://xxx.supabase.co/...' from origin 'http://localhost:3000'
has been blocked by CORS policy
```

**Solutions**:

1. **Check API Key**:
   ```typescript
   // Make sure you're using the correct key
   console.log(process.env.NEXT_PUBLIC_SUPABASE_URL);
   console.log(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
   ```

2. **Verify Environment Variables**:
   ```bash
   # Frontend .env.local must have NEXT_PUBLIC_ prefix
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```

3. **Check Origin Configuration**:
   - Go to Supabase Dashboard → Settings → API
   - Verify allowed origins (if custom configuration exists)

### Issue 2: Authentication Errors

**Error**:
```
Invalid API key
```

**Solutions**:

1. Regenerate API keys if compromised
2. Check for typos in environment variables
3. Restart Next.js dev server after changing .env

### Issue 3: RLS Blocking Requests

**Error**:
```
new row violates row-level security policy
```

**Solutions**:

1. **Check RLS Policies**:
   ```sql
   -- View existing policies
   SELECT * FROM pg_policies WHERE tablename = 'politicians';
   ```

2. **Create Missing Policies**:
   ```sql
   -- Allow public read
   CREATE POLICY "Public read"
   ON politicians FOR SELECT
   USING (true);
   ```

3. **Temporarily Disable RLS** (Development Only):
   ```sql
   -- ONLY FOR TESTING - NOT FOR PRODUCTION
   ALTER TABLE politicians DISABLE ROW LEVEL SECURITY;
   ```

## Deployment Checklist

### Before Going to Production

- [ ] **Environment Variables Set**
  - [ ] NEXT_PUBLIC_SUPABASE_URL configured
  - [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY configured
  - [ ] Backend SUPABASE_SERVICE_ROLE_KEY secured

- [ ] **RLS Enabled**
  - [ ] All tables have RLS enabled
  - [ ] Policies tested and verified
  - [ ] No data leaks possible

- [ ] **API Keys Secured**
  - [ ] Service role key never exposed
  - [ ] Keys stored in secure environment variables
  - [ ] Old keys revoked if compromised

- [ ] **CORS Configuration**
  - [ ] Production domains added
  - [ ] Development domains removed (if custom config)
  - [ ] HTTPS enforced

- [ ] **Testing Completed**
  - [ ] Frontend can access Supabase
  - [ ] CORS working correctly
  - [ ] RLS policies working
  - [ ] No console errors

## Supabase + Custom API CORS

If using both Supabase and your FastAPI backend:

### Architecture

```
Frontend (Next.js)
    │
    ├─→ Supabase (Direct)
    │   └─→ Auth, Storage, Realtime
    │
    └─→ FastAPI Backend (via CORS)
        └─→ Supabase (Server-side)
            └─→ Complex queries, Admin operations
```

### Configuration

1. **Frontend → Supabase**: Uses Supabase's built-in CORS
2. **Frontend → FastAPI**: Uses your CORS configuration
3. **FastAPI → Supabase**: No CORS (server-to-server)

## Additional Resources

- [Supabase CORS Documentation](https://supabase.com/docs/guides/api/cors)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase API Reference](https://supabase.com/docs/reference/javascript/introduction)
- [OWASP CORS Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Origin_Resource_Sharing_Cheat_Sheet.html)

## Support

For Supabase CORS issues:

1. Check Supabase Dashboard logs
2. Review RLS policies
3. Test with curl commands
4. Check browser DevTools
5. Contact Supabase support

---

**Last Updated**: 2025-10-17
**Version**: 1.0.0
