-- ============================================
-- PROJECT GRID 완전 삭제 SQL V2
-- 모든 관련 객체 제거 (더 강력한 버전)
-- ============================================

-- 1. 테이블 먼저 삭제 (CASCADE로 모든 종속 객체 함께 삭제)
DROP TABLE IF EXISTS project_grid_tasks CASCADE;

-- 2. 남아있을 수 있는 함수 삭제
DROP FUNCTION IF EXISTS get_dependency_chain(VARCHAR(20)) CASCADE;
DROP FUNCTION IF EXISTS get_dependency_chain(VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS get_blocked_tasks() CASCADE;
DROP FUNCTION IF EXISTS update_modified_column() CASCADE;

-- 3. 남아있을 수 있는 뷰 삭제
DROP VIEW IF EXISTS area_statistics CASCADE;
DROP VIEW IF EXISTS phase_progress CASCADE;

-- 4. 남아있을 수 있는 모든 인덱스 명시적 삭제
DROP INDEX IF EXISTS idx_phase CASCADE;
DROP INDEX IF EXISTS idx_area CASCADE;
DROP INDEX IF EXISTS idx_status CASCADE;
DROP INDEX IF EXISTS idx_dependency CASCADE;
DROP INDEX IF EXISTS idx_tasks_phase CASCADE;
DROP INDEX IF EXISTS idx_tasks_area CASCADE;
DROP INDEX IF EXISTS idx_tasks_status CASCADE;
DROP INDEX IF EXISTS idx_tasks_assigned_agent CASCADE;

-- 완료 메시지
SELECT '✅ PROJECT GRID 모든 객체 완전 삭제 완료' AS result;
