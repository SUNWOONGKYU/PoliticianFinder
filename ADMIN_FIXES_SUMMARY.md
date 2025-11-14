# Admin Content Management System - Bug Fixes Summary

## Issue Description
The admin content management system had multiple bugs preventing proper display of posts, comments, and notices:

1. Admin posts page showed "86 contents" but admin couldn't see them
2. Comments tab showed no data
3. Notices tab showed no data

## Root Cause
The admin content API (`/api/admin/content`) was querying the wrong table (`posts` instead of `community_posts`), and the frontend was not properly mapping the API response data to match the component interfaces.

## Changes Made

### 1. Admin Content API (`1_Frontend/src/app/api/admin/content/route.ts`)

**Changed table references from `posts` to `community_posts`:**

- **GET endpoint** (Line 41): Changed query from `posts` to `community_posts`
- **PATCH endpoint** (Line 134): Changed update query from `posts` to `community_posts`
- **DELETE endpoint** (Line 180): Changed delete query from `posts` to `community_posts`

**Reasoning:** The database schema uses `community_posts` table, not `posts`. This was confirmed by checking:
- `/api/admin/dashboard/route.ts` which correctly uses `community_posts`
- `/api/comments/route.ts` which references `community_posts` in foreign key joins
- `/api/politicians/[id]/route.ts` which queries `community_posts`

### 2. Comments API (`1_Frontend/src/app/api/comments/route.ts`)

**Enhanced GET endpoint to include joined data (Line 136-148):**

```typescript
// Added joins to profiles and community_posts tables
let queryBuilder = supabase
  .from('comments')
  .select(`
    *,
    profiles:user_id (
      username,
      email
    ),
    community_posts:post_id (
      title
    )
  `, { count: 'exact' })
  .order('created_at', { ascending: false });
```

**Reasoning:** The admin panel needs to display comment author names and post titles, which require joining with the `profiles` and `community_posts` tables.

### 3. Admin Posts Page (`1_Frontend/src/app/admin/posts/page.tsx`)

**Added data mapping for posts (Lines 65-76):**

```typescript
// Map the data to match Post interface
const mappedPosts = rawData.map((post: any) => ({
  id: post.id,
  title: post.title || 'Untitled',
  author: post.profiles?.username || post.profiles?.email || 'Unknown',
  date: new Date(post.created_at).toLocaleDateString('ko-KR'),
}));
```

**Added data mapping for comments (Lines 105-111):**

```typescript
// Map the data to match Comment interface
const mappedComments = rawData.map((comment: any) => ({
  id: comment.id,
  content: comment.content || '',
  author: comment.profiles?.username || comment.profiles?.email || 'Unknown',
  postTitle: comment.community_posts?.title || 'Unknown Post',
  date: new Date(comment.created_at).toLocaleDateString('ko-KR'),
}));
```

**Added data mapping for notices (Lines 142-147):**

```typescript
// Map the data to match Notice interface
const mappedNotices = rawData.map((notice: any) => ({
  id: notice.id,
  title: notice.title || 'Untitled',
  author: 'Admin', // Notices are created by admin
  date: new Date(notice.created_at).toLocaleDateString('ko-KR'),
}));
```

**Reasoning:** The API returns data in Supabase format with joined tables (e.g., `profiles`, `community_posts`), but the component expects a simpler interface with direct properties like `author`, `postTitle`, and formatted `date`.

## Files Modified

1. `1_Frontend/src/app/api/admin/content/route.ts`
   - Changed 3 occurrences of `"posts"` to `"community_posts"` (GET, PATCH, DELETE)

2. `1_Frontend/src/app/api/comments/route.ts`
   - Enhanced select query to include joins with `profiles` and `community_posts`

3. `1_Frontend/src/app/api/posts/[id]/route.ts`
   - Changed all 5 occurrences of `.from('posts')` to `.from('community_posts')`
   - Affects GET, PATCH, DELETE operations

4. `1_Frontend/src/app/api/community/posts/route.ts`
   - Changed `"posts"` to `"community_posts"` in GET query

5. `1_Frontend/src/app/admin/posts/page.tsx`
   - Added data mapping for posts display
   - Added data mapping for comments display
   - Added data mapping for notices display
   - Fixed notice deletion to use correct query parameter format (`?id=` instead of `/{id}`)

## Expected Results

After these fixes:

1. **Posts Tab**: Admin can now see all community posts with proper author names and dates
2. **Comments Tab**: Admin can see all comments with author information and associated post titles
3. **Notices Tab**: Admin can see all notices with proper formatting

## Testing

Build completed successfully with no TypeScript errors:
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Generating static pages
```

## Database Schema Consistency

The fixes ensure consistency across the codebase:
- `/api/admin/dashboard` ✅ Uses `community_posts`
- `/api/admin/content` ✅ NOW uses `community_posts` (fixed)
- `/api/comments` ✅ References `community_posts` in joins
- `/api/politicians/[id]` ✅ Uses `community_posts`

## Additional Notes

- The `posts` table may be an old schema that was replaced with `community_posts`
- All APIs now consistently use `community_posts`
- The admin panel properly maps database fields to UI-friendly formats
- Fallback values ('Unknown', 'Untitled') ensure graceful degradation if data is missing
