-- ============================================================================
-- 불필요한 테이블 삭제
-- 작성일: 2025-11-20
-- 목적: ai_item_scores, ai_scores 테이블 제거
-- ============================================================================

-- 1. 삭제 전 데이터 확인
SELECT 'ai_item_scores' as table_name, COUNT(*) as row_count FROM ai_item_scores
UNION ALL
SELECT 'ai_scores' as table_name, COUNT(*) as row_count FROM ai_scores;

-- 2. 테이블 삭제
DROP TABLE IF EXISTS ai_item_scores CASCADE;
DROP TABLE IF EXISTS ai_scores CASCADE;

-- 3. 삭제 확인 (남아있는 ai_ 테이블 목록)
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
  AND table_name LIKE 'ai_%'
ORDER BY table_name;

-- ============================================================================
-- 최종 테이블 구조
-- ============================================================================
-- ✅ ai_category_scores  - AI별 카테고리 점수 (10개)
-- ✅ ai_evaluations      - 멀티 AI 종합 평가 (1개)
-- ✅ ai_final_scores     - AI별 최종 점수 (1개)
-- ✅ collected_data      - 원본 데이터 (500개)
-- ❌ ai_item_scores      - 삭제됨 (항목별 점수 불필요)
-- ❌ ai_scores           - 삭제됨 (용도 불명확)
-- ============================================================================
