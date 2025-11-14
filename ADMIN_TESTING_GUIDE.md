# Admin Content Management System - Testing Guide

## Overview
This guide helps verify that the admin content management system fixes are working correctly.

## Prerequisites
- Application is running (dev or production mode)
- Database has `community_posts`, `comments`, and `notices` tables populated
- Admin credentials for testing

## Test Cases

### 1. Admin Posts Tab

**Test:** View all posts in admin panel

**Steps:**
1. Navigate to `/admin/posts`
2. Click on "게시글 관리" (Posts Management) tab
3. Verify posts are displayed

**Expected Results:**
- Posts table shows data with columns: ID, 제목 (Title), 작성자 (Author), 작성일 (Date), 관리 (Actions)
- Author names are displayed (not "Unknown")
- Dates are formatted in Korean locale (YYYY. M. D.)
- "삭제" (Delete) button is visible for each post

**API Call:** `GET /api/admin/content`

**Sample Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-here",
      "title": "게시글 제목",
      "created_at": "2025-11-15T...",
      "profiles": {
        "username": "사용자명",
        "email": "user@example.com"
      },
      ...
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 86,
    "totalPages": 5
  }
}
```

### 2. Admin Comments Tab

**Test:** View all comments in admin panel

**Steps:**
1. Navigate to `/admin/posts`
2. Click on "댓글 관리" (Comments Management) tab
3. Verify comments are displayed

**Expected Results:**
- Comments table shows data with columns: ID, 내용 (Content), 작성자 (Author), 게시글 (Post), 작성일 (Date), 관리 (Actions)
- Author names are displayed (not "User")
- Post titles are displayed (not "Post")
- Dates are formatted correctly
- "삭제" (Delete) button is visible for each comment

**API Call:** `GET /api/comments`

**Sample Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "comment_123",
      "content": "댓글 내용",
      "created_at": "2025-11-15T...",
      "profiles": {
        "username": "댓글작성자",
        "email": "commenter@example.com"
      },
      "community_posts": {
        "title": "원본 게시글 제목"
      },
      ...
    }
  ],
  "pagination": {...}
}
```

### 3. Admin Notices Tab

**Test:** View all notices in admin panel

**Steps:**
1. Navigate to `/admin/posts`
2. Click on "공지사항 관리" (Notices Management) tab
3. Verify notices are displayed

**Expected Results:**
- Notices table shows data with columns: ID, 제목 (Title), 작성자 (Author), 작성일 (Date), 관리 (Actions)
- Author shows "Admin"
- Dates are formatted correctly
- "수정" (Edit) and "삭제" (Delete) buttons are visible

**API Call:** `GET /api/notices`

**Sample Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "공지사항 제목",
      "content": "공지사항 내용",
      "created_at": "2025-11-15T...",
      ...
    }
  ]
}
```

### 4. Search Functionality

**Test:** Search within each tab

**Steps:**
1. In Posts tab, enter search term and click "검색"
2. In Comments tab, enter search term and click "검색"
3. In Notices tab, enter search term and click "검색"

**Expected Results:**
- Filtered results are displayed
- Search works for titles, content, and authors as appropriate

### 5. Delete Operations

**Test:** Delete a post

**Steps:**
1. In Posts tab, click "삭제" on any post
2. Confirm deletion in the alert dialog

**Expected Results:**
- Alert confirms deletion
- Post is removed from the list
- List refreshes automatically

**API Call:** `DELETE /api/posts/{id}`

**Test:** Delete a comment

**Steps:**
1. In Comments tab, click "삭제" on any comment
2. Confirm deletion

**Expected Results:**
- Comment is deleted
- List refreshes

**API Call:** `DELETE /api/comments/{id}`

**Test:** Delete a notice

**Steps:**
1. In Notices tab, click "삭제" on any notice
2. Confirm deletion

**Expected Results:**
- Notice is deleted
- List refreshes

**API Call:** `DELETE /api/notices?id={id}` (Note: uses query parameter)

## Troubleshooting

### Posts not showing
- Check if `community_posts` table exists
- Verify API endpoint: `GET /api/admin/content`
- Check browser console for errors
- Verify Supabase SERVICE_ROLE_KEY is set

### Comments show "Unknown" author or "Unknown Post"
- Verify `profiles` table has matching `user_id`
- Verify `community_posts` table has matching `post_id`
- Check foreign key relationships in database

### Notices not showing
- Check if `notices` table exists
- Verify API endpoint: `GET /api/notices`
- Check if there's data in the notices table

### "게시글이 없습니다" despite data in database
- Table name mismatch: ensure using `community_posts` not `posts`
- RLS policies: ensure SERVICE_ROLE_KEY bypasses RLS
- Check API response format matches expected structure

## Database Verification

### Check if tables exist and have data

```sql
-- Count posts
SELECT COUNT(*) FROM community_posts;

-- Count comments
SELECT COUNT(*) FROM comments;

-- Count notices
SELECT COUNT(*) FROM notices;

-- Sample posts with author info
SELECT
  cp.id,
  cp.title,
  p.username,
  p.email,
  cp.created_at
FROM community_posts cp
LEFT JOIN profiles p ON cp.user_id = p.id
LIMIT 5;

-- Sample comments with post and author info
SELECT
  c.id,
  c.content,
  p.username as author,
  cp.title as post_title,
  c.created_at
FROM comments c
LEFT JOIN profiles p ON c.user_id = p.id
LEFT JOIN community_posts cp ON c.post_id = cp.id
LIMIT 5;
```

## API Testing with curl

### Test admin content API
```bash
curl http://localhost:3000/api/admin/content?limit=5
```

### Test comments API
```bash
curl http://localhost:3000/api/comments?limit=5
```

### Test notices API
```bash
curl http://localhost:3000/api/notices
```

## Success Criteria

All tests pass when:
1. Posts tab displays actual posts with proper author names and dates
2. Comments tab displays actual comments with author and post information
3. Notices tab displays actual notices with proper formatting
4. Search functionality works in all tabs
5. Delete operations work correctly
6. No console errors appear
7. Data refreshes automatically after modifications
