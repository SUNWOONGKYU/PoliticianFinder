-- PROJECT GRID REVISED - Supabase 스키마
-- 36개 Task + Phase Gate 통과 조건
-- 생성일: 2025-11-06
-- 버전: REVISED Edition v2 (Phase Gate 추가)

-- 1. 새 테이블 생성
CREATE TABLE IF NOT EXISTS project_grid_tasks_revised (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- 기본 정보 (4개)
    phase INTEGER NOT NULL,
    area VARCHAR(10) NOT NULL,
    task_id VARCHAR(20) UNIQUE NOT NULL,
    task_name TEXT NOT NULL,

    -- 작업 정보 (5개)
    instruction_file TEXT,
    assigned_agent VARCHAR(100),
    tools TEXT,
    work_mode VARCHAR(50) DEFAULT 'AI-Only',
    dependency_chain TEXT,

    -- 진행 상황 (2개)
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    status VARCHAR(50) DEFAULT '대기',

    -- 실행 기록 (4개)
    generated_files TEXT,
    generator VARCHAR(50),
    duration VARCHAR(50),
    modification_history TEXT,

    -- 검증 (5개)
    test_history TEXT,
    build_result VARCHAR(20) DEFAULT '⏳ 대기',
    dependency_propagation VARCHAR(50) DEFAULT '⏳ 대기',
    blocker TEXT DEFAULT '없음',
    validation_result TEXT DEFAULT '⏳ 대기',

    -- Phase Gate (1개) ✨ NEW
    phase_gate_criteria TEXT,

    -- 기타 (1개)
    remarks TEXT,

    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_revised_task_id ON project_grid_tasks_revised(task_id);
CREATE INDEX IF NOT EXISTS idx_revised_phase ON project_grid_tasks_revised(phase);
CREATE INDEX IF NOT EXISTS idx_revised_area ON project_grid_tasks_revised(area);
CREATE INDEX IF NOT EXISTS idx_revised_status ON project_grid_tasks_revised(status);

-- 3. RLS (Row Level Security) 정책
ALTER TABLE project_grid_tasks_revised ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능
DROP POLICY IF EXISTS "Allow public read access" ON project_grid_tasks_revised;
CREATE POLICY "Allow public read access"
    ON project_grid_tasks_revised
    FOR SELECT
    TO public
    USING (true);

-- 모든 사용자가 쓰기 가능 (개발 환경용)
DROP POLICY IF EXISTS "Allow public write access" ON project_grid_tasks_revised;
CREATE POLICY "Allow public write access"
    ON project_grid_tasks_revised
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- 4. updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_project_grid_tasks_revised_modtime ON project_grid_tasks_revised;
CREATE TRIGGER update_project_grid_tasks_revised_modtime
    BEFORE UPDATE ON project_grid_tasks_revised
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- 완료!
-- 이제 project_grid_revised_36_data.sql 파일로 36개 Task를 INSERT하세요.
