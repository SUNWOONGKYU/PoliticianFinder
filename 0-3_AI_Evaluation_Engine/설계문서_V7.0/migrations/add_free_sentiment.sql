-- ============================================================
-- V30 sentiment 컬럼에 'free' 값 추가
-- ============================================================
-- 작성일: 2026-01-18
-- 이유: 'free' (자유 수집) 모드를 'neutral' (중립)과 구분하기 위함
--
-- 배경:
-- - 기존: 'free' → 'neutral'로 잘못 매핑 (중립만 수집하는 것으로 오인)
-- - 수정: 'free' 그대로 저장 (긍정/부정/중립 모두 자유롭게 수집)
-- ============================================================

-- 1. 기존 제약 조건 삭제
ALTER TABLE collected_data_v30
DROP CONSTRAINT IF EXISTS collected_data_v30_sentiment_check;

-- 2. 새로운 제약 조건 추가 ('free' 값 포함)
ALTER TABLE collected_data_v30
ADD CONSTRAINT collected_data_v30_sentiment_check
CHECK (sentiment IN ('positive', 'negative', 'neutral', 'free'));

-- 3. 검증
DO $$
BEGIN
  RAISE NOTICE '✅ sentiment 컬럼 제약 조건 수정 완료';
  RAISE NOTICE '   허용 값: positive, negative, neutral, free';
END $$;
