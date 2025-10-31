-- ============================================
-- PROJECT GRID V4.0 - 통합 설치 SQL
-- 모든 작업을 한 번에 실행
-- ============================================
-- 실행 방법:
-- 1. 이 파일 전체를 복사 (Ctrl+A, Ctrl+C)
-- 2. Supabase Dashboard → SQL Editor → New query
-- 3. 붙여넣기 (Ctrl+V)
-- 4. Run 버튼 클릭
-- ============================================

-- ============================================
-- 1단계: 완전 삭제 (기존 객체 모두 제거)
-- ============================================

-- 테이블 먼저 삭제 (CASCADE로 모든 종속 객체 함께 삭제)
DROP TABLE IF EXISTS project_grid_tasks CASCADE;

-- 남아있을 수 있는 함수 삭제
DROP FUNCTION IF EXISTS get_dependency_chain(VARCHAR(20)) CASCADE;
DROP FUNCTION IF EXISTS get_dependency_chain(VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS get_blocked_tasks() CASCADE;
DROP FUNCTION IF EXISTS update_modified_column() CASCADE;

-- 남아있을 수 있는 뷰 삭제
DROP VIEW IF EXISTS area_statistics CASCADE;
DROP VIEW IF EXISTS phase_progress CASCADE;

-- 남아있을 수 있는 모든 인덱스 명시적 삭제
DROP INDEX IF EXISTS idx_phase CASCADE;
DROP INDEX IF EXISTS idx_area CASCADE;
DROP INDEX IF EXISTS idx_status CASCADE;
DROP INDEX IF EXISTS idx_dependency CASCADE;
DROP INDEX IF EXISTS idx_tasks_phase CASCADE;
DROP INDEX IF EXISTS idx_tasks_area CASCADE;
DROP INDEX IF EXISTS idx_tasks_status CASCADE;
DROP INDEX IF EXISTS idx_tasks_assigned_agent CASCADE;
DROP INDEX IF EXISTS idx_phase_area CASCADE;
DROP INDEX IF EXISTS idx_validation_result CASCADE;
DROP INDEX IF EXISTS idx_task_name_search CASCADE;

SELECT '✅ 1단계 완료: 기존 객체 모두 삭제됨' AS status;

-- ============================================
-- 2단계: 스키마 생성 (테이블 + 인덱스 + 함수)
-- ============================================
