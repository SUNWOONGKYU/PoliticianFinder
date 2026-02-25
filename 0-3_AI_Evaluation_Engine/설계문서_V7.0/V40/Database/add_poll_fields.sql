-- ============================================================
-- politicians 테이블에 여론조사 필드 추가
-- ============================================================
-- poll_rank: 여론조사 순위 (1, 2, 3, 4)
-- poll_support: 지지율 (%)
-- collected_date: 수집일 (YYYY-MM-DD)
-- ============================================================

-- 필드 추가
ALTER TABLE politicians
ADD COLUMN IF NOT EXISTS poll_rank INTEGER,
ADD COLUMN IF NOT EXISTS poll_support TEXT,
ADD COLUMN IF NOT EXISTS collected_date DATE DEFAULT CURRENT_DATE;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_politicians_poll_rank ON politicians(poll_rank);
CREATE INDEX IF NOT EXISTS idx_politicians_collected_date ON politicians(collected_date);

-- 확인
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'politicians'
ORDER BY ordinal_position;

SELECT 'Add poll fields to politicians table' AS result;
