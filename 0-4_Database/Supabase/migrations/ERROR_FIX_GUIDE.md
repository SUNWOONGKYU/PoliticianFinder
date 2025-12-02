# ⚠️ 마이그레이션 오류 해결 가이드

## 발생한 오류

```
ERROR: 23514: check constraint "posts_author_check" of relation "posts" is violated by some row
```

## 원인

기존 데이터베이스에 **제약조건을 위반하는 행**이 이미 존재합니다.

**위반 사례:**
1. `user_id`와 `politician_id`가 **둘 다** 설정된 행
2. `user_id`와 `politician_id`가 **둘 다** NULL인 행
3. 기타 잘못된 데이터 조합

**새로운 제약조건:**
```sql
CHECK (
  (user_id IS NOT NULL AND politician_id IS NULL AND author_type = 'user') OR
  (user_id IS NULL AND politician_id IS NOT NULL AND author_type = 'politician')
)
```

이 제약조건은:
- ✅ `user_id` 있고 `politician_id` NULL → 일반 사용자 글
- ✅ `user_id` NULL이고 `politician_id` 있음 → 정치인 글
- ❌ 둘 다 있음 → **오류**
- ❌ 둘 다 없음 → **오류**

## 해결 방법: 안전한 마이그레이션 사용

**기존 마이그레이션 (오류 발생):**
- `ALL_MIGRATIONS.sql` - 기존 데이터 정리 없이 제약조건 추가

**새로운 안전한 마이그레이션:**
- `ALL_MIGRATIONS_SAFE.sql` - **기존 데이터를 먼저 정리한 후** 제약조건 추가

---

## 🚀 즉시 적용 방법

### Step 1: Supabase Dashboard 접속
1. https://supabase.com/dashboard
2. PoliticianFinder 프로젝트 선택

### Step 2: SQL Editor 열기
1. 왼쪽 사이드바 → **SQL Editor**
2. **New query** 버튼 클릭

### Step 3: 안전한 마이그레이션 실행
**아래 파일의 전체 내용을 복사-붙여넣기-Run:**

```
0-4_Database/Supabase/migrations/ALL_MIGRATIONS_SAFE.sql
```

이 스크립트는:
1. ✅ **먼저 기존 데이터 정리**
   - `politician_id`가 있는 행의 `user_id`를 NULL로 설정
2. ✅ **스키마 수정**
   - `user_id` NULL 허용
   - `author_type` 컬럼 추가
3. ✅ **기존 데이터에 `author_type` 설정**
   - `politician_id` 있으면 → `'politician'`
   - 없으면 → `'user'`
4. ✅ **제약조건 추가**
   - 데이터 정리 후 추가하므로 오류 없음

---

## 차이점 비교

### 기존 버전 (오류 발생)
```sql
-- ❌ 데이터 정리 없이 바로 제약조건 추가
ALTER TABLE posts
  ADD CONSTRAINT posts_author_check
  CHECK (...);
```

### 안전한 버전 (오류 없음)
```sql
-- ✅ STEP 1: 먼저 데이터 정리
UPDATE posts
SET user_id = NULL
WHERE politician_id IS NOT NULL;

-- ✅ STEP 2: 컬럼 추가
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS author_type TEXT;

-- ✅ STEP 3: 기존 데이터에 값 설정
UPDATE posts
SET author_type = CASE
  WHEN politician_id IS NOT NULL THEN 'politician'
  ELSE 'user'
END;

-- ✅ STEP 4: 이제 제약조건 추가 (안전)
ALTER TABLE posts
  ADD CONSTRAINT posts_author_check
  CHECK (...);
```

---

## 검증 (마이그레이션 적용 후)

**New query 열고 아래 SQL 실행:**

```sql
-- 1. politician_sessions 테이블 확인
SELECT COUNT(*) as session_count FROM politician_sessions;

-- 2. posts 테이블 스키마 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'posts'
  AND column_name IN ('user_id', 'author_type', 'politician_id')
ORDER BY column_name;

-- 3. 데이터 정합성 확인
SELECT
  COUNT(*) as total,
  COUNT(CASE WHEN author_type = 'user' THEN 1 END) as user_posts,
  COUNT(CASE WHEN author_type = 'politician' THEN 1 END) as politician_posts
FROM posts;
```

**예상 결과:**
```
session_count: 0

posts 컬럼:
- author_type | text | NO   ← NOT NULL ✅
- politician_id | text | YES
- user_id | uuid | YES  ← NULL 허용 ✅

데이터 정합성:
- total: [전체 게시글 수]
- user_posts: [일반 사용자 글 수]
- politician_posts: 0 (아직 정치인 글 없음)
```

---

## 테스트 (마이그레이션 적용 후)

```bash
cd 1_Frontend
node test_politician_posting_simple.js
```

**예상 결과:**
```
✅ 모든 테스트 통과!
```

---

## 요약

| 항목 | 기존 버전 | 안전한 버전 |
|------|----------|-----------|
| 파일명 | `ALL_MIGRATIONS.sql` | `ALL_MIGRATIONS_SAFE.sql` |
| 데이터 정리 | ❌ 없음 | ✅ 있음 (제약조건 추가 전) |
| 오류 발생 | ❌ YES | ✅ NO |
| 권장 사용 | ❌ | ✅ **이거 사용!** |

**✅ `ALL_MIGRATIONS_SAFE.sql`을 사용하세요!**
