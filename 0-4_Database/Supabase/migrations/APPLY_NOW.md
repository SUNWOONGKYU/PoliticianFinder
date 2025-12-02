# 🚀 마이그레이션 즉시 적용 가이드

## 빠른 적용 방법 (5분 소요)

### Step 1: Supabase Dashboard 접속
1. 브라우저에서 https://supabase.com/dashboard 접속
2. **PoliticianFinder** 프로젝트 선택

### Step 2: SQL Editor 열기
1. 왼쪽 사이드바에서 **SQL Editor** 클릭
2. **New query** 버튼 클릭

---

### Step 3: Migration 053 실행

**아래 SQL을 복사해서 붙여넣고 Run 버튼 클릭:**

```sql
-- Migration: 053_create_politician_sessions.sql
-- Purpose: 정치인 세션 토큰 관리 테이블 생성

CREATE TABLE IF NOT EXISTS politician_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  politician_id TEXT NOT NULL REFERENCES politicians(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_politician_sessions_token
  ON politician_sessions(session_token);

CREATE INDEX IF NOT EXISTS idx_politician_sessions_expires
  ON politician_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_politician_sessions_politician
  ON politician_sessions(politician_id);

CREATE OR REPLACE FUNCTION cleanup_expired_politician_sessions()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM politician_sessions
  WHERE expires_at < NOW();
END;
$$;

ALTER TABLE politician_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read sessions for validation"
  ON politician_sessions
  FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert sessions"
  ON politician_sessions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update sessions"
  ON politician_sessions
  FOR UPDATE
  USING (true);

CREATE POLICY "Service role can delete sessions"
  ON politician_sessions
  FOR DELETE
  USING (true);

COMMENT ON TABLE politician_sessions IS 'Politician session tokens for authenticated posting';
COMMENT ON COLUMN politician_sessions.politician_id IS 'Reference to politicians(id) - 8-char hex TEXT type';
COMMENT ON COLUMN politician_sessions.session_token IS '64-char hex token for authentication';
```

**결과:** ✅ Success 메시지가 표시되면 성공

---

### Step 4: Migration 054 실행

**New query 버튼을 클릭하고, 아래 SQL을 복사해서 붙여넣고 Run 버튼 클릭:**

```sql
-- Migration: 054_fix_politician_posting_schema.sql
-- Purpose: 정치인 글쓰기를 위한 posts/comments 테이블 스키마 수정

-- 1. POSTS 테이블 수정
ALTER TABLE posts
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS author_type TEXT NOT NULL DEFAULT 'user'
  CHECK (author_type IN ('user', 'politician'));

ALTER TABLE posts
  ADD CONSTRAINT posts_author_check
  CHECK (
    (user_id IS NOT NULL AND politician_id IS NULL AND author_type = 'user') OR
    (user_id IS NULL AND politician_id IS NOT NULL AND author_type = 'politician')
  );

UPDATE posts
SET author_type = 'user'
WHERE author_type IS NULL OR author_type = 'user';

-- 2. COMMENTS 테이블 수정
ALTER TABLE comments
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS author_type TEXT NOT NULL DEFAULT 'user'
  CHECK (author_type IN ('user', 'politician'));

ALTER TABLE comments
  ADD CONSTRAINT comments_author_check
  CHECK (
    (user_id IS NOT NULL AND politician_id IS NULL AND author_type = 'user') OR
    (user_id IS NULL AND politician_id IS NOT NULL AND author_type = 'politician')
  );

UPDATE comments
SET author_type = 'user'
WHERE author_type IS NULL OR author_type = 'user';

-- 3. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_posts_politician_id
  ON posts(politician_id)
  WHERE politician_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_comments_politician_id
  ON comments(politician_id)
  WHERE politician_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_posts_author_type
  ON posts(author_type);

CREATE INDEX IF NOT EXISTS idx_comments_author_type
  ON comments(author_type);

-- 4. 테이블 설명 업데이트
COMMENT ON COLUMN posts.author_type IS 'Author type: user or politician';
COMMENT ON COLUMN posts.user_id IS 'User ID (NULL for politician posts)';
COMMENT ON COLUMN posts.politician_id IS 'Politician ID (NULL for user posts)';

COMMENT ON COLUMN comments.author_type IS 'Author type: user or politician';
COMMENT ON COLUMN comments.user_id IS 'User ID (NULL for politician comments)';
COMMENT ON COLUMN comments.politician_id IS 'Politician ID (NULL for user comments)';
```

**결과:** ✅ Success 메시지가 표시되면 성공

---

### Step 5: 검증

**New query 버튼을 클릭하고, 아래 SQL로 검증:**

```sql
-- 1. politician_sessions 테이블 존재 확인
SELECT COUNT(*) as session_count FROM politician_sessions;

-- 2. posts 테이블 스키마 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'posts'
  AND column_name IN ('user_id', 'author_type', 'politician_id')
ORDER BY column_name;

-- 3. comments 테이블 스키마 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'comments'
  AND column_name IN ('user_id', 'author_type', 'politician_id')
ORDER BY column_name;
```

**예상 결과:**
```
session_count: 0 (정상 - 아직 세션 없음)

posts 컬럼:
- author_type | text | YES
- politician_id | text | YES
- user_id | uuid | YES  ← NULL 허용으로 변경됨

comments 컬럼:
- author_type | text | YES
- politician_id | text | YES
- user_id | uuid | YES  ← NULL 허용으로 변경됨
```

---

## ✅ 완료 후 테스트

터미널에서 실행:

```bash
cd 1_Frontend
node test_politician_posting_simple.js
```

**예상 결과:**
```
========================================
정치인 글쓰기/댓글쓰기 간단 테스트
========================================

Step 1: 정치인 정보 확인
✅ 정치인 정보 확인 성공
   이름: 오세훈
   소속: 국민의힘
   직책: 서울특별시장

Step 2: 게시글 작성
✅ 게시글 작성 성공

Step 3: 댓글 작성
✅ 댓글 작성 성공

========================================
✅ 모든 테스트 통과!
========================================
```

---

## ⚠️ 오류 발생 시

### 오류: "constraint already exists"
**해결:** 이미 적용되어 있음 - 무시하고 다음 단계 진행

### 오류: "column already exists"
**해결:** 이미 적용되어 있음 - 무시하고 다음 단계 진행

### 오류: "violates check constraint"
**해결:**
1. 제약조건 삭제 후 재생성:
```sql
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_author_check;
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_author_check;
```
2. 다시 Migration 054 실행

---

**소요 시간:** 약 5분
**완료 후:** 정치인 글쓰기 기능 완전 작동!
