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
-- PHASE GATES 테이블
-- Phase별 통과 조건을 별도로 관리
-- 생성일: 2025-11-06

-- 1. Phase Gates 테이블 생성
CREATE TABLE IF NOT EXISTS phase_gates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- 기본 정보
    phase INTEGER UNIQUE NOT NULL,
    gate_name TEXT NOT NULL,

    -- 통과 조건
    criteria TEXT NOT NULL,

    -- 상태 관리
    status VARCHAR(20) DEFAULT '대기',  -- 대기, 검증중, 통과

    -- 검증 정보
    verified_at TIMESTAMPTZ,
    verified_by TEXT,
    verification_notes TEXT,

    -- 타임스탬프
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_phase_gates_phase ON phase_gates(phase);
CREATE INDEX IF NOT EXISTS idx_phase_gates_status ON phase_gates(status);

-- 3. RLS 정책
ALTER TABLE phase_gates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON phase_gates;
CREATE POLICY "Allow public read access"
    ON phase_gates
    FOR SELECT
    TO public
    USING (true);

DROP POLICY IF EXISTS "Allow public write access" ON phase_gates;
CREATE POLICY "Allow public write access"
    ON phase_gates
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- 4. updated_at 자동 업데이트 트리거
DROP TRIGGER IF EXISTS update_phase_gates_modtime ON phase_gates;
CREATE TRIGGER update_phase_gates_modtime
    BEFORE UPDATE ON phase_gates
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- 완료!
-- PROJECT GRID REVISED - 36 Tasks (Consolidated)
-- Generated: 2025-11-06
-- Updated: 2025-11-06 (Mock/Real API 통합: 23+23 → 4+4)
-- Target table: project_grid_tasks_revised
--
-- Task Distribution:
--   Phase 1: Frontend + Backend Infrastructure + Mock API (8 tasks)
--   Phase 2: Database Schema (1 task)
--   Phase 3: Real API Implementation (4 tasks)
--   Phase 4: Backend Utilities & Admin Features (16 tasks)
--   Phase 5: Testing (3 tasks)
--   Phase 6: DevOps & Deployment (4 tasks)
--
-- 변경사항:
--   - Mock API 23개 → 4개 카테고리 통합 (인증, 정치인, 커뮤니티, 기타)
--   - Real API 23개 → 4개 카테고리 통합 (인증, 정치인, 커뮤니티, 기타)
--   - 제2원칙 적용: AI가 한 세션에서 통합 작업 가능

-- ============================================================
-- Phase 1: Frontend + Backend Infrastructure + Mock API (8개)
-- ============================================================

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, phase_gate_criteria, remarks
) VALUES (
    1, 'F', 'P1F1', 'React 전체 페이지 변환',
    'tasks/P1F1.md', 'frontend-developer',
    'TypeScript, React, Next.js, Tailwind CSS', 'AI-Only',
    '없음', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', NULL, '프로토타입 28개 + 개선 5개 페이지를 React로 변환'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, phase_gate_criteria, remarks
) VALUES (
    1, 'BI', 'P1BI1', 'Supabase 클라이언트 설정',
    'tasks/P1BI1.md', 'backend-developer',
    'TypeScript, Next.js, Supabase', 'AI-Only',
    '없음', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', NULL, 'Supabase 클라이언트 초기화 (서버/클라이언트 분리)'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    1, 'BI', 'P1BI2', 'API 미들웨어',
    'tasks/P1BI2.md', 'backend-developer',
    'TypeScript, Next.js Middleware', 'AI-Only',
    'P1BI1', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', '인증 미들웨어 + 에러 핸들링 미들웨어'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    1, 'BI', 'P1BI3', 'Database Types 생성',
    'tasks/P1BI3.md', 'backend-developer',
    'TypeScript, Supabase CLI', 'AI-Only',
    'P1BI1', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', 'Supabase Schema → TypeScript Types 자동 생성'
);

-- Mock API 통합 작업 (4개)

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    1, 'BA', 'P1BA1', 'Mock API: 인증',
    'tasks/P1BA1.md', 'api-designer',
    'TypeScript, Next.js API Routes, Mock Data', 'AI-Only',
    'P1BI1, P1BI2', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', '회원가입, OAuth, 로그인, 비밀번호 재설정, 토큰 갱신, 로그아웃 (6개 route.ts)'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    1, 'BA', 'P1BA2', 'Mock API: 정치인',
    'tasks/P1BA2.md', 'api-designer',
    'TypeScript, Next.js API Routes, Mock Data', 'AI-Only',
    'P1BI1, P1BI2', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', '목록, 상세, 관심등록, 본인인증, AI평가 조회, AI평가 생성 (6개 route.ts)'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    1, 'BA', 'P1BA3', 'Mock API: 커뮤니티',
    'tasks/P1BA3.md', 'api-designer',
    'TypeScript, Next.js API Routes, Mock Data', 'AI-Only',
    'P1BI1, P1BI2', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', '게시글 목록/상세/작성, 댓글, 좋아요, 공유, 팔로우 (7개 route.ts)'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    1, 'BA', 'P1BA4', 'Mock API: 기타',
    'tasks/P1BA4.md', 'api-designer',
    'TypeScript, Next.js API Routes, Mock Data', 'AI-Only',
    'P1BI1, P1BI2', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', '알림, 관리자 통계, 사용자 관리, 콘텐츠 신고 (4개 route.ts)'
);

-- ============================================================
-- Phase 2: Database Schema (1개)
-- ============================================================

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    2, 'D', 'P2D1', '전체 Database 스키마 (통합)',
    'tasks/P2D1.md', 'database-developer',
    'PostgreSQL, Supabase, SQL', 'AI-Only',
    'P1BA1, P1BA2, P1BA3, P1BA4', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', '모든 테이블 + 트리거 + 타입 + Storage + 최적화'
);

-- ============================================================
-- Phase 3: Real API Implementation (4개)
-- ============================================================

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    3, 'BA', 'P3BA1', 'Real API: 인증',
    'tasks/P3BA1.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase Auth', 'AI-Only',
    'P2D1, P1BA1', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', '회원가입, OAuth, 로그인, 비밀번호 재설정, 토큰 갱신, 로그아웃 (6개 route.ts)'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    3, 'BA', 'P3BA2', 'Real API: 정치인',
    'tasks/P3BA2.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase Database', 'AI-Only',
    'P2D1, P1BA2', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', '목록, 상세, 관심등록, 본인인증, AI평가 조회, AI평가 생성 (6개 route.ts)'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    3, 'BA', 'P3BA3', 'Real API: 커뮤니티',
    'tasks/P3BA3.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase Database', 'AI-Only',
    'P2D1, P1BA3', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', '게시글 목록/상세/작성, 댓글, 좋아요, 공유, 팔로우 (7개 route.ts)'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    3, 'BA', 'P3BA4', 'Real API: 기타',
    'tasks/P3BA4.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase Database', 'AI-Only',
    'P2D1, P1BA4', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', '알림, 관리자 통계, 사용자 관리, 콘텐츠 신고 (4개 route.ts)'
);

-- ============================================================
-- Phase 4: Backend Utilities & Admin Features (16개)
-- ============================================================

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    4, 'BA', 'P4BA1', '선관위 크롤링 스크립트',
    'tasks/P4BA1.md', 'backend-developer',
    'TypeScript, Puppeteer, Cheerio', 'AI-Only',
    'P2D1', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', '선관위 사이트에서 정치인 데이터 크롤링'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    4, 'BA', 'P4BA2', '정치인 데이터 시딩',
    'tasks/P4BA2.md', 'backend-developer',
    'TypeScript, Supabase', 'AI-Only',
    'P4BA1', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', '초기 정치인 데이터 DB 삽입'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    4, 'BA', 'P4BA3', '이미지 업로드 헬퍼',
    'tasks/P4BA3.md', 'backend-developer',
    'TypeScript, Supabase Storage', 'AI-Only',
    'P2D1', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', 'Supabase Storage 이미지 업로드 유틸'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    4, 'BA', 'P4BA4', '파일 업로드 헬퍼',
    'tasks/P4BA4.md', 'backend-developer',
    'TypeScript, Supabase Storage', 'AI-Only',
    'P2D1', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', '게시글 첨부파일 업로드 처리'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    4, 'BA', 'P4BA5', '욕설 필터',
    'tasks/P4BA5.md', 'backend-developer',
    'TypeScript, 정규식', 'AI-Only',
    '없음', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', '욕설 감지 및 필터링 유틸'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    4, 'BA', 'P4BA6', '알림 생성 헬퍼',
    'tasks/P4BA6.md', 'backend-developer',
    'TypeScript, Supabase', 'AI-Only',
    'P2D1', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', '알림 자동 생성 유틸'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    4, 'BA', 'P4BA7', '자동 중재 시스템 API',
    'tasks/P4BA7.md', 'api-designer',
    'TypeScript, Next.js API Routes, OpenAI API, Zod', 'AI-Only',
    'P3BA4', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', 'AI 기반 신고 콘텐츠 자동 판정 및 처리'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    4, 'BA', 'P4BA8', '감사 로그 API',
    'tasks/P4BA8.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase', 'AI-Only',
    'P2D1', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', '모든 관리자 액션 기록 및 조회'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    4, 'BA', 'P4BA9', '광고 관리 API',
    'tasks/P4BA9.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase', 'AI-Only',
    'P2D1', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', '광고 등록/수정/삭제 및 통계'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    4, 'BA', 'P4BA10', '정책 관리 API',
    'tasks/P4BA10.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase', 'AI-Only',
    'P2D1', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', '이용약관/개인정보처리방침 등 관리'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    4, 'BA', 'P4BA11', '알림 설정 API',
    'tasks/P4BA11.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase', 'AI-Only',
    'P2D1', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', '전역 알림 설정 및 템플릿 관리'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    4, 'BA', 'P4BA12', '시스템 설정 API',
    'tasks/P4BA12.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase', 'AI-Only',
    'P2D1', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', '전역 시스템 설정 및 기능 토글'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    4, 'BA', 'P4BA13', '관리자 액션 로그 API',
    'tasks/P4BA13.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase', 'AI-Only',
    'P4BA8', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', '관리자 활동 추적 및 통계'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    4, 'O', 'P4O1', '크롤링 스케줄러',
    'tasks/P4O1.md', 'devops-troubleshooter',
    'TypeScript, Node-Cron, Vercel Cron Jobs', 'AI-Only',
    'P4BA1', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', '정치인 데이터 자동 업데이트 (Cron)'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    4, 'O', 'P4O2', '인기 게시글 집계 스케줄러',
    'tasks/P4O2.md', 'devops-troubleshooter',
    'TypeScript, Node-Cron, Vercel Cron Jobs', 'AI-Only',
    'P3BA3', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', '인기 게시글 순위 자동 계산 (Cron)'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    4, 'O', 'P4O3', '등급 재계산 스케줄러',
    'tasks/P4O3.md', 'devops-troubleshooter',
    'TypeScript, Node-Cron, Vercel Cron Jobs', 'AI-Only',
    'P3BA1', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', '사용자 등급 자동 재계산 (Cron)'
);

-- ============================================================
-- Phase 5: Testing (3개)
-- ============================================================

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    5, 'T', 'P5T1', 'Unit Tests',
    'tasks/P5T1.md', 'test-engineer',
    'Jest, React Testing Library, TypeScript', 'AI-Only',
    'P3BA1, P3BA2, P3BA3, P3BA4', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', '컴포넌트 + API 유틸 + 함수 유닛 테스트 (Jest)'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    5, 'T', 'P5T2', 'E2E Tests',
    'tasks/P5T2.md', 'test-engineer',
    'Playwright, TypeScript', 'AI-Only',
    'P3BA1, P3BA2, P3BA3, P3BA4', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', '사용자 시나리오 E2E 테스트 (Playwright)'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    5, 'T', 'P5T3', 'Integration Tests',
    'tasks/P5T3.md', 'test-engineer',
    'Jest, Supabase Test Client, TypeScript', 'AI-Only',
    'P3BA1, P3BA2, P3BA3, P3BA4', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', 'API + DB 통합 테스트'
);

-- ============================================================
-- Phase 6: DevOps & Deployment (4개)
-- ============================================================

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    6, 'O', 'P6O1', 'CI/CD 파이프라인',
    'tasks/P6O1.md', 'devops-troubleshooter',
    'GitHub Actions, YAML', 'AI-Only',
    'P5T1, P5T2, P5T3', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', 'GitHub Actions 자동 빌드/배포'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    6, 'O', 'P6O2', 'Vercel 배포 설정',
    'tasks/P6O2.md', 'devops-troubleshooter',
    'Vercel CLI, Environment Variables', 'AI-Only',
    'P6O1', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', 'Vercel 프로덕션 배포 설정'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    6, 'O', 'P6O3', '모니터링 설정',
    'tasks/P6O3.md', 'devops-troubleshooter',
    'Sentry, Google Analytics', 'AI-Only',
    'P6O2', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', 'Sentry 에러 추적 + Google Analytics'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    6, 'O', 'P6O4', '보안 설정',
    'tasks/P6O4.md', 'security-specialist',
    'Next.js Middleware, Rate Limiting', 'AI-Only',
    'P6O2', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', 'Rate Limiting + CORS + CSP 설정'
);

-- ============================================================
-- 완료!
-- 총 36개 작업이 project_grid_tasks_revised 테이블에 삽입되었습니다.
-- ============================================================
-- PHASE GATES 데이터
-- 6개 Phase별 통과 조건
-- 생성일: 2025-11-06

-- Phase 1 Gate
INSERT INTO phase_gates (phase, gate_name, criteria, status) VALUES (
    1,
    'Phase 1 Gate: Frontend + Mock APIs',
    'Build✅ | Lint✅ | Dev서버 실행 | 35페이지 렌더링 | Mock API 23개 응답200 | 사용자 승인',
    '대기'
);

-- Phase 2 Gate
INSERT INTO phase_gates (phase, gate_name, criteria, status) VALUES (
    2,
    'Phase 2 Gate: Database Schema',
    '30+테이블 생성 | RLS정책 적용 | Storage Buckets 생성 | Types 생성 확인 | 사용자 승인',
    '대기'
);

-- Phase 3 Gate
INSERT INTO phase_gates (phase, gate_name, criteria, status) VALUES (
    3,
    'Phase 3 Gate: Real APIs',
    'Build✅ | Real API 23개 응답 | DB연동 확인 | Auth 동작 | E2E Smoke Test | 사용자 승인',
    '대기'
);

-- Phase 4 Gate
INSERT INTO phase_gates (phase, gate_name, criteria, status) VALUES (
    4,
    'Phase 4 Gate: Backend Utilities + Admin',
    'Build✅ | 크롤링 성공 | 헬퍼6개 테스트 | Admin API 7개 응답 | Cron 3개 실행 | 사용자 승인',
    '대기'
);

-- Phase 5 Gate
INSERT INTO phase_gates (phase, gate_name, criteria, status) VALUES (
    5,
    'Phase 5 Gate: Testing',
    'Unit Test 80%+ | E2E Test 100% | Integration Test 90%+ | 실패 테스트 0개 | 사용자 승인',
    '대기'
);

-- Phase 6 Gate (최종)
INSERT INTO phase_gates (phase, gate_name, criteria, status) VALUES (
    6,
    'Phase 6 Gate: Deployment (최종)',
    'CI/CD 파이프라인 성공 | Vercel 배포 | Sentry 활성화 | Security 설정 | Smoke Test | 사용자 승인 ⭐',
    '대기'
);

-- 완료!
-- 6개 Phase Gate가 Supabase에 저장되었습니다.
