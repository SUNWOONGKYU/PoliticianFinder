-- ============================================================
-- V24.0 → V26.0 마이그레이션 SQL
-- ============================================================
-- 목적: V24.0 데이터를 백업하고 V26.0 수집을 위한 준비
-- 실행: Supabase SQL Editor에서 직접 실행
-- ============================================================

-- ============================================================
-- STEP 1: 백업 테이블 생성 (V24.0 데이터 보존)
-- ============================================================

-- 1-1. collected_data 백업 테이블
CREATE TABLE IF NOT EXISTS collected_data_v24_backup (
    LIKE collected_data INCLUDING ALL
);

-- 1-2. ai_category_scores 백업 테이블
CREATE TABLE IF NOT EXISTS ai_category_scores_v24_backup (
    LIKE ai_category_scores INCLUDING ALL
);

-- 1-3. ai_final_scores 백업 테이블
CREATE TABLE IF NOT EXISTS ai_final_scores_v24_backup (
    LIKE ai_final_scores INCLUDING ALL
);

-- 1-4. ai_evaluations 백업 테이블
CREATE TABLE IF NOT EXISTS ai_evaluations_v24_backup (
    LIKE ai_evaluations INCLUDING ALL
);

-- ============================================================
-- STEP 2: V24.0 데이터를 백업 테이블로 복사
-- ============================================================

-- 2-1. collected_data 백업
INSERT INTO collected_data_v24_backup
SELECT * FROM collected_data
ON CONFLICT DO NOTHING;

-- 2-2. ai_category_scores 백업
INSERT INTO ai_category_scores_v24_backup
SELECT * FROM ai_category_scores
ON CONFLICT DO NOTHING;

-- 2-3. ai_final_scores 백업
INSERT INTO ai_final_scores_v24_backup
SELECT * FROM ai_final_scores
ON CONFLICT DO NOTHING;

-- 2-4. ai_evaluations 백업
INSERT INTO ai_evaluations_v24_backup
SELECT * FROM ai_evaluations
ON CONFLICT DO NOTHING;

-- ============================================================
-- STEP 3: 백업 확인
-- ============================================================

SELECT 'collected_data' as table_name, COUNT(*) as original_count,
       (SELECT COUNT(*) FROM collected_data_v24_backup) as backup_count
FROM collected_data
UNION ALL
SELECT 'ai_category_scores', COUNT(*),
       (SELECT COUNT(*) FROM ai_category_scores_v24_backup)
FROM ai_category_scores
UNION ALL
SELECT 'ai_final_scores', COUNT(*),
       (SELECT COUNT(*) FROM ai_final_scores_v24_backup)
FROM ai_final_scores
UNION ALL
SELECT 'ai_evaluations', COUNT(*),
       (SELECT COUNT(*) FROM ai_evaluations_v24_backup)
FROM ai_evaluations;

-- ============================================================
-- STEP 4: 원본 테이블 비우기 (V26.0 수집 준비)
-- ⚠️ 주의: 이 단계는 백업 확인 후에만 실행!
-- ============================================================

-- 주석 해제 후 실행:
-- TRUNCATE TABLE collected_data CASCADE;
-- TRUNCATE TABLE ai_category_scores CASCADE;
-- TRUNCATE TABLE ai_final_scores CASCADE;
-- TRUNCATE TABLE ai_evaluations CASCADE;

-- ============================================================
-- STEP 5: V26.0용 버전 정보 추가 (선택)
-- ============================================================

-- collected_data에 collection_version 컬럼 추가 (선택)
-- ALTER TABLE collected_data ADD COLUMN IF NOT EXISTS collection_version VARCHAR(10) DEFAULT 'V26.0';

-- ============================================================
-- 완료!
-- ============================================================
-- 백업 테이블:
--   - collected_data_v24_backup
--   - ai_category_scores_v24_backup
--   - ai_final_scores_v24_backup
--   - ai_evaluations_v24_backup
--
-- 다음 단계:
--   1. 백업 레코드 수 확인
--   2. STEP 4 TRUNCATE 실행
--   3. V26.0 수집 스크립트 실행
-- ============================================================
