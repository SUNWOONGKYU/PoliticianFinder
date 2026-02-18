-- ============================================================
-- V30 rating 체크 제약 수정 (0 등급 추가)
-- 작성일: 2026-01-21
--
-- 문제: evaluations_v30 테이블의 rating 체크 제약에 '0'이 없음
-- 해결: 기존 제약 삭제 후, '0' 포함한 새 제약 추가
-- ============================================================

-- 1. 기존 rating 체크 제약 삭제
ALTER TABLE evaluations_v30 DROP CONSTRAINT IF EXISTS evaluations_v30_rating_check;

-- 2. 기존 score 체크 제약 삭제
ALTER TABLE evaluations_v30 DROP CONSTRAINT IF EXISTS evaluations_v30_score_check;

-- 3. 새로운 rating 체크 제약 추가 (0 포함)
ALTER TABLE evaluations_v30
ADD CONSTRAINT evaluations_v30_rating_check
CHECK (rating IN ('+4', '+3', '+2', '+1', '0', '-1', '-2', '-3', '-4'));

-- 4. 새로운 score 체크 제약 추가 (0 포함)
ALTER TABLE evaluations_v30
ADD CONSTRAINT evaluations_v30_score_check
CHECK (score IN (8, 6, 4, 2, 0, -2, -4, -6, -8));

-- 5. 확인
SELECT conname, pg_get_constraintdef(oid) as constraint_def
FROM pg_constraint
WHERE conrelid = 'evaluations_v30'::regclass
  AND conname LIKE '%rating%' OR conname LIKE '%score%'
ORDER BY conname;

COMMENT ON CONSTRAINT evaluations_v30_rating_check ON evaluations_v30
IS 'V30 9단계 등급: +4, +3, +2, +1, 0, -1, -2, -3, -4';

COMMENT ON CONSTRAINT evaluations_v30_score_check ON evaluations_v30
IS 'V30 9단계 점수: 8, 6, 4, 2, 0, -2, -4, -6, -8 (rating × 2)';
