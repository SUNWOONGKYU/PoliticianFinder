# Supabase 마이그레이션 적용 가이드

## 📋 현재 적용 필요한 마이그레이션

### 1. `053_create_politician_sessions.sql`
- **목적**: 정치인 세션 토큰 관리 테이블 생성
- **필요성**: 정치인 인증 및 글쓰기 권한 관리

### 2. `054_fix_politician_posting_schema.sql`
- **목적**: posts/comments 테이블에서 정치인 글쓰기 지원
- **변경사항**:
  - `posts.user_id` NULL 허용
  - `comments.user_id` NULL 허용
  - `author_type` 컬럼 추가 ('user' 또는 'politician')
  - CHECK 제약조건 추가

---

## 🚀 마이그레이션 적용 방법

### 방법 1: Supabase Dashboard (추천)

#### Step 1: Supabase Dashboard 접속
1. https://supabase.com/dashboard 접속
2. 프로젝트 선택: **PoliticianFinder**

#### Step 2: SQL Editor 열기
1. 왼쪽 사이드바에서 **SQL Editor** 클릭
2. **New query** 클릭

#### Step 3: Migration 053 실행
1. `053_create_politician_sessions.sql` 파일 내용 복사
2. SQL Editor에 붙여넣기
3. **Run** 버튼 클릭
4. 성공 메시지 확인

#### Step 4: Migration 054 실행
1. `054_fix_politician_posting_schema.sql` 파일 내용 복사
2. SQL Editor에 붙여넣기 (새 쿼리 탭)
3. **Run** 버튼 클릭
4. 성공 메시지 확인

#### Step 5: 검증
```sql
-- 1. politician_sessions 테이블 존재 확인
SELECT * FROM politician_sessions LIMIT 1;

-- 2. posts 테이블 author_type 컬럼 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'posts' AND column_name IN ('user_id', 'author_type', 'politician_id');

-- 3. comments 테이블 author_type 컬럼 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'comments' AND column_name IN ('user_id', 'author_type', 'politician_id');
```

---

### 방법 2: Supabase CLI

#### 사전 준비
```bash
# Supabase CLI 설치 (아직 설치 안 했다면)
npm install -g supabase

# 프로젝트 연결
cd 0-4_Database/Supabase
supabase link --project-ref yqihnwqljtrddxhvmpkz
```

#### 마이그레이션 적용
```bash
# Migration 053 적용
supabase db push --include-migrations 053_create_politician_sessions.sql

# Migration 054 적용
supabase db push --include-migrations 054_fix_politician_posting_schema.sql

# 또는 모든 마이그레이션 적용
supabase db push
```

---

### 방법 3: psql 직접 연결

#### Step 1: 연결 정보 확인
Supabase Dashboard → Settings → Database → Connection String

#### Step 2: psql로 연결
```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@db.yqihnwqljtrddxhvmpkz.supabase.co:5432/postgres"
```

#### Step 3: 마이그레이션 실행
```sql
-- Migration 053 실행
\i 053_create_politician_sessions.sql

-- Migration 054 실행
\i 054_fix_politician_posting_schema.sql
```

---

## ✅ 적용 후 검증 체크리스트

### 1. 테이블 존재 확인
```sql
-- politician_sessions 테이블 확인
SELECT COUNT(*) FROM politician_sessions;
-- 결과: 0 (정상 - 아직 세션 없음)
```

### 2. posts 테이블 스키마 확인
```sql
-- user_id NULL 허용 확인
SELECT is_nullable FROM information_schema.columns
WHERE table_name = 'posts' AND column_name = 'user_id';
-- 결과: YES

-- author_type 컬럼 존재 확인
SELECT COUNT(*) FROM information_schema.columns
WHERE table_name = 'posts' AND column_name = 'author_type';
-- 결과: 1
```

### 3. comments 테이블 스키마 확인
```sql
-- user_id NULL 허용 확인
SELECT is_nullable FROM information_schema.columns
WHERE table_name = 'comments' AND column_name = 'user_id';
-- 결과: YES

-- author_type 컬럼 존재 확인
SELECT COUNT(*) FROM information_schema.columns
WHERE table_name = 'comments' AND column_name = 'author_type';
-- 결과: 1
```

### 4. 제약조건 확인
```sql
-- posts 테이블 제약조건
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'posts' AND constraint_name LIKE '%author%';
-- 결과: posts_author_check (CHECK)

-- comments 테이블 제약조건
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'comments' AND constraint_name LIKE '%author%';
-- 결과: comments_author_check (CHECK)
```

---

## 🧪 테스트 쿼리

### 정치인 게시글 삽입 테스트
```sql
-- 정치인 게시글 작성 (오세훈)
INSERT INTO posts (user_id, politician_id, title, content, category, author_type)
VALUES (NULL, '62e7b453', '[테스트] 정치인 게시글', '테스트 내용입니다.', '정책발표', 'politician')
RETURNING *;
```

### 정치인 댓글 삽입 테스트
```sql
-- 위에서 생성한 게시글 ID를 사용
INSERT INTO comments (post_id, user_id, politician_id, content, author_type)
VALUES ('[POST_ID]', NULL, '62e7b453', '정치인 댓글입니다.', 'politician')
RETURNING *;
```

### 정치인 게시글 조회 테스트
```sql
-- 정치인 정보와 함께 조회
SELECT
  p.*,
  pol.name AS politician_name,
  pol.party,
  pol.position
FROM posts p
LEFT JOIN politicians pol ON p.politician_id = pol.id
WHERE p.author_type = 'politician'
ORDER BY p.created_at DESC
LIMIT 10;
```

---

## ⚠️ 롤백 (필요 시)

마이그레이션을 되돌려야 하는 경우:

### Migration 054 롤백
```sql
-- author_type 컬럼 삭제
ALTER TABLE posts DROP COLUMN IF EXISTS author_type;
ALTER TABLE comments DROP COLUMN IF EXISTS author_type;

-- CHECK 제약조건 삭제
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_author_check;
ALTER TABLE comments DROP CONSTRAINT IF EXISTS comments_author_check;

-- user_id NOT NULL 복원
ALTER TABLE posts ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE comments ALTER COLUMN user_id SET NOT NULL;

-- 인덱스 삭제
DROP INDEX IF EXISTS idx_posts_politician_id;
DROP INDEX IF EXISTS idx_comments_politician_id;
DROP INDEX IF EXISTS idx_posts_author_type;
DROP INDEX IF EXISTS idx_comments_author_type;
```

### Migration 053 롤백
```sql
-- politician_sessions 테이블 삭제
DROP TABLE IF EXISTS politician_sessions CASCADE;

-- 함수 삭제
DROP FUNCTION IF EXISTS cleanup_expired_politician_sessions();
```

---

## 📞 문제 해결

### 에러: "relation already exists"
- **원인**: 테이블이 이미 존재함
- **해결**: SQL에서 `IF NOT EXISTS` 구문 사용됨 - 무시해도 됨

### 에러: "column already exists"
- **원인**: 컬럼이 이미 존재함
- **해결**: SQL에서 `IF NOT EXISTS` 구문 사용됨 - 무시해도 됨

### 에러: "constraint already exists"
- **원인**: 제약조건이 이미 존재함
- **해결**:
  ```sql
  -- 기존 제약조건 삭제 후 재생성
  ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_author_check;
  ALTER TABLE posts ADD CONSTRAINT posts_author_check CHECK (...);
  ```

### 에러: "violates not-null constraint"
- **원인**: 기존 데이터가 NULL을 허용하지 않음
- **해결**: 마이그레이션 순서대로 실행 (UPDATE 문이 포함되어 있음)

---

## 📝 마이그레이션 완료 후 할 일

1. ✅ **테스트 스크립트 실행**
   ```bash
   cd 1_Frontend
   node test_politician_posting_simple.js
   ```

2. ✅ **API 테스트**
   - POST `/api/posts` (정치인 게시글 작성)
   - POST `/api/comments` (정치인 댓글 작성)

3. ✅ **데이터베이스 타입 재생성**
   ```bash
   cd 1_Frontend
   npm run update-types
   # 또는
   supabase gen types typescript --project-id yqihnwqljtrddxhvmpkz > src/lib/database.types.ts
   ```

4. ✅ **문서 업데이트**
   - DATABASE_SCHEMA.md 업데이트
   - API 문서 업데이트

---

**작성자**: Claude Code
**작성일**: 2025-12-02
**최종 업데이트**: 2025-12-02
