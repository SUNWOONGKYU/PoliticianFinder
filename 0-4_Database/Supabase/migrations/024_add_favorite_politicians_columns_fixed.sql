-- P3BA28: Add missing columns to favorite_politicians table (FIXED)
-- Task: 관심 정치인 등록 기능 완성
--
-- politician_id 규칙:
-- - 타입: TEXT (8자리 hexadecimal)
-- - 예시: 'cd8c0263', '17270f25', 'de49f056'
-- - ❌ UUID 전체 형식 사용 금지

-- Step 1: 기존 데이터 정리 (UUID 형식 데이터 제거)
-- 이유: politician_id가 UUID 형식으로 저장되어 있어 8자리 hex TEXT와 충돌
DELETE FROM public.favorite_politicians
WHERE LENGTH(politician_id::text) > 8;

-- Step 2: Add missing columns
ALTER TABLE public.favorite_politicians
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS notification_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;

-- Step 3: Update politician_id type to TEXT
ALTER TABLE public.favorite_politicians
ALTER COLUMN politician_id TYPE TEXT;

-- Step 4: Add Foreign Key constraint
-- 먼저 기존 constraint 제거
ALTER TABLE public.favorite_politicians
DROP CONSTRAINT IF EXISTS fk_favorite_politicians_politician;

-- 새 constraint 추가
ALTER TABLE public.favorite_politicians
ADD CONSTRAINT fk_favorite_politicians_politician
FOREIGN KEY (politician_id) REFERENCES politicians(id) ON DELETE CASCADE;

-- Step 5: Indexes for performance
CREATE INDEX IF NOT EXISTS idx_favorite_politicians_is_pinned
ON public.favorite_politicians(user_id, is_pinned) WHERE is_pinned = true;

CREATE INDEX IF NOT EXISTS idx_favorite_politicians_notification
ON public.favorite_politicians(user_id, notification_enabled) WHERE notification_enabled = true;

-- 완료 확인
SELECT
  '✅ favorite_politicians 테이블 업데이트 완료' as message,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE notes IS NOT NULL) as records_with_notes,
  COUNT(*) FILTER (WHERE notification_enabled = true) as notification_enabled_count,
  COUNT(*) FILTER (WHERE is_pinned = true) as pinned_count
FROM public.favorite_politicians;
