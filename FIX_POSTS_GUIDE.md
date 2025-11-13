# 게시글이 보이지 않는 문제 해결 가이드

## 문제 상황
데이터베이스에는 게시글이 있지만 프론트엔드에 아무것도 표시되지 않습니다.

## 원인
게시글의 `moderation_status`가 `pending` 상태일 경우, 다음 두 가지 필터링 때문에 표시되지 않습니다:
1. **RLS (Row Level Security) 정책**: `approved` 상태의 게시글만 조회 허용
2. **API 필터**: `/api/posts` 엔드포인트에서 `approved` 게시글만 반환

## 해결 방법

### 방법 1: Supabase Dashboard에서 직접 SQL 실행 (권장)

1. **Supabase Dashboard 접속**
   - https://supabase.com 로그인
   - 프로젝트 선택

2. **SQL Editor 열기**
   - 왼쪽 메뉴에서 `SQL Editor` 클릭

3. **아래 SQL을 복사하여 실행**

```sql
-- Step 1: 현재 게시글 상태 확인
SELECT
  moderation_status,
  COUNT(*) as count
FROM posts
GROUP BY moderation_status;

-- Step 2: pending 게시글을 approved로 업데이트
UPDATE posts
SET moderation_status = 'approved'
WHERE moderation_status = 'pending';

-- Step 3: 업데이트 결과 확인
SELECT
  moderation_status,
  COUNT(*) as count
FROM posts
GROUP BY moderation_status;
```

4. **실행 버튼 클릭** (또는 `Ctrl+Enter`)

5. **프론트엔드 새로고침**
   - 브라우저에서 `Ctrl+Shift+R` (또는 `Cmd+Shift+R`)로 강력 새로고침
   - 30초 정도 기다린 후 다시 확인 (API 캐시 만료 대기)

### 방법 2: 마이그레이션 실행

프로젝트에 이미 마이그레이션 파일이 준비되어 있습니다:

1. **Supabase Dashboard의 SQL Editor**에서 다음 파일의 내용을 실행:

**파일 1**: `0-4_Database/Supabase/migrations/045_change_posts_moderation_default.sql`
```sql
-- 새 게시글의 기본값을 'approved'로 변경
ALTER TABLE posts ALTER COLUMN moderation_status SET DEFAULT 'approved';

-- 기존 pending 게시글을 approved로 업데이트
UPDATE posts SET moderation_status = 'approved' WHERE moderation_status = 'pending';
```

**파일 2**: `0-4_Database/Supabase/migrations/046_approve_existing_pending_posts.sql`
```sql
-- 기존 pending 게시글을 approved로 업데이트 (추가 확인)
UPDATE posts
SET moderation_status = 'approved'
WHERE moderation_status = 'pending';
```

### 방법 3: Python 스크립트 사용 (SERVICE_ROLE_KEY 필요)

만약 `SUPABASE_SERVICE_ROLE_KEY`가 있다면:

1. **환경 변수 추가**
   `1_Frontend/.env.local` 파일에 다음 추가:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

2. **스크립트 실행**
   ```bash
   python3 fix_posts_moderation_status_simple.py
   ```

## 문제가 계속되는 경우

### 1. 브라우저 캐시 문제
```bash
# 브라우저에서:
# - Ctrl+Shift+R (Windows/Linux)
# - Cmd+Shift+R (Mac)
```

### 2. API 캐시 문제
- API는 30초간 캐시를 유지합니다
- 30-60초 정도 기다린 후 다시 확인하세요

### 3. RLS 정책 확인
Supabase Dashboard에서 확인:
- `Authentication` > `Policies`
- `posts` 테이블의 정책 확인
- "Anyone can view approved posts" 정책이 활성화되어 있어야 함

```sql
-- RLS 정책 확인
SELECT * FROM pg_policies WHERE tablename = 'posts';
```

### 4. 게시글 데이터 직접 확인
```sql
-- 최근 게시글 10개 확인
SELECT
  id,
  title,
  moderation_status,
  created_at
FROM posts
ORDER BY created_at DESC
LIMIT 10;
```

### 5. 프론트엔드 API 호출 확인
브라우저 개발자도구(F12)에서:
- `Console` 탭에서 에러 확인
- `Network` 탭에서 `/api/posts` 요청 확인
  - Status: 200이어야 함
  - Response: 게시글 데이터가 있어야 함

## 예방 조치

새 게시글이 자동으로 `approved` 상태가 되도록 하려면:

```sql
-- 테이블 기본값 확인
SELECT
  column_name,
  column_default
FROM information_schema.columns
WHERE table_name = 'posts'
  AND column_name = 'moderation_status';

-- 기본값이 'pending'이면 'approved'로 변경
ALTER TABLE posts
ALTER COLUMN moderation_status
SET DEFAULT 'approved';
```

## 참고 파일
- API 엔드포인트: `1_Frontend/src/app/api/posts/route.ts:191`
- RLS 정책: `0-4_Database/Supabase/migrations/041_create_rls_policies.sql`
- 테이블 정의: `0-4_Database/Supabase/migrations/005_create_posts_table.sql`
