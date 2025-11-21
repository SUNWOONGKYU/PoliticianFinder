-- P3BA28: Fix politician_details.politician_id type to TEXT
-- 문제: politician_details.politician_id가 BIGINT 타입으로 되어 있음
-- 해결: TEXT 타입으로 변경
--
-- politician_id 규칙:
-- - 타입: TEXT (8자리 hexadecimal)
-- - 예시: 'cd8c0263', '17270f25', 'de49f056'

-- Step 1: 기존 데이터 확인 (비어있어야 함)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM politician_details LIMIT 1) THEN
    RAISE NOTICE 'WARNING: politician_details has existing data. Manual migration required.';
  ELSE
    RAISE NOTICE 'OK: politician_details is empty. Safe to change type.';
  END IF;
END $$;

-- Step 2: FK 제약조건 제거 (있다면)
ALTER TABLE public.politician_details
DROP CONSTRAINT IF EXISTS politician_details_politician_id_fkey;

-- Step 3: politician_id 타입을 TEXT로 변경
ALTER TABLE public.politician_details
ALTER COLUMN politician_id TYPE TEXT;

-- Step 4: FK 제약조건 다시 추가
ALTER TABLE public.politician_details
ADD CONSTRAINT politician_details_politician_id_fkey
FOREIGN KEY (politician_id) REFERENCES politicians(id) ON DELETE CASCADE;

-- Step 5: Trigger 함수 재생성 (politician_id TEXT 타입 사용)
-- 이미 023 마이그레이션에서 생성되었으므로 재확인만 수행

-- 완료 확인
SELECT
  'politician_details.politician_id 타입 변경 완료' as message,
  data_type
FROM information_schema.columns
WHERE table_name = 'politician_details'
  AND column_name = 'politician_id';
