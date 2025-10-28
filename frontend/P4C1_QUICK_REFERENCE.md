# P4C1 Session Timeout - Quick Reference

## What Was Implemented

Session timeout mechanism with:
- **Auto-refresh**: Tokens refresh automatically before expiry
- **Warning UI**: Dialog appears 5 minutes before timeout
- **Graceful expiry**: Automatic sign-out on session expiration

## Key Files

### Created
1. **`src/hooks/useSessionTimeout.ts`** - Session management hook
2. **`src/components/auth/SessionTimeoutWarning.tsx`** - Warning dialog UI

### Modified
1. **`src/contexts/AuthContext.tsx`** - Integrated timeout system
2. **`src/lib/supabase.ts`** - Enabled auto-refresh

## How It Works

```
User Signs In
     ↓
Hook monitors session expiry
     ↓
Auto-refresh 1 min before expiry ──→ Session continues
     ↓ (if refresh fails)
Warning shows 5 min before expiry
     ↓
User clicks "Extend" ──→ Refresh & continue
     ↓ (or)
User clicks "Sign Out" ──→ Immediate logout
     ↓ (or timeout)
Auto sign-out on expiry
```

## Timing Configuration

```typescript
// src/hooks/useSessionTimeout.ts
SESSION_TIMEOUT_WARNING = 5 * 60 * 1000  // 5 min warning
TOKEN_REFRESH_BUFFER = 60 * 1000         // Refresh 1 min early
CHECK_INTERVAL = 30 * 1000               // Check every 30 sec
```

## Usage Example

The hook is automatically integrated in `AuthContext`. No additional setup needed in components.

```typescript
// Already integrated - nothing to add to your components
function YourComponent() {
  const { user, isAuthenticated } = useAuth()
  // Timeout warning shows automatically when needed
}
```

## Testing

### Quick Test
1. Sign in to the application
2. Wait for session to approach expiry (or modify constants for faster testing)
3. Verify warning dialog appears
4. Test both "Extend Session" and "Sign Out" buttons

### Modify for Testing
```typescript
// Temporarily change in useSessionTimeout.ts for quick testing
const SESSION_TIMEOUT_WARNING = 2 * 60 * 1000  // 2 min warning
const TOKEN_REFRESH_BUFFER = 30 * 1000         // 30 sec buffer
```

## Supabase Configuration

Current settings in `src/lib/supabase.ts`:
```typescript
{
  auth: {
    autoRefreshToken: true,    // ✓ Enabled
    persistSession: true,      // ✓ Session persists
    detectSessionInUrl: true,  // ✓ OAuth support
    flowType: 'pkce',         // ✓ Secure flow
  }
}
```

## Common Scenarios

### Scenario 1: Normal Use
- User works continuously
- Token refreshes automatically every ~59 minutes
- No interruption to user

### Scenario 2: Inactive User
- User idle for extended period
- Warning shows 5 minutes before expiry
- User can extend or sign out

### Scenario 3: Session Expires
- User doesn't respond to warning
- Session expires automatically
- User signed out and redirected to home

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Warning not appearing | Check console for errors, verify user authenticated |
| Auto-refresh failing | Check network tab, verify Supabase connection |
| Immediate expiry | Check system time, verify JWT settings in Supabase |
| Dialog won't close | Click "Extend Session" or "Sign Out" (dismiss blocked) |

## Key Features

✓ **Automatic token refresh** - Happens in background
✓ **User-friendly warnings** - 5-minute advance notice
✓ **Real-time countdown** - Shows exact time remaining
✓ **Graceful expiry handling** - Auto sign-out prevents errors
✓ **No additional dependencies** - Uses existing packages
✓ **Production-ready** - Error handling & cleanup included

## Summary

The session timeout system is fully integrated and requires no additional configuration. It works automatically for all authenticated users, providing a seamless and secure experience.
