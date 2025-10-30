-- ============================================
-- PROJECT GRID - Supabase PostgreSQL Schema
-- ============================================
-- 매뉴얼: 프로젝트 그리드 작성 매뉴얼 V2.0
-- 21개 속성 완전 구현 (매뉴얼 순서 준수)
-- ============================================

-- 작업 테이블 (Tasks)
CREATE TABLE IF NOT EXISTS project_grid_tasks (
    -- ========== 【그리드 좌표】(2개) - 3D 공간 위치 ==========
    phase INTEGER NOT NULL,                              -- 1. Phase (개발 단계): 1, 2, 3...
    area VARCHAR(1) NOT NULL CHECK (area IN ('F', 'B', 'D', 'T', 'S', 'O')),  -- 2. Area: F/B/D/T/S/O

    -- ========== 【작업 기본 정보】(9개) - 작업 정의 및 할당 ==========
    task_id VARCHAR(20) PRIMARY KEY,                     -- 3. 작업ID: P1F1, P2F3a 등 (PK)
    task_name TEXT NOT NULL,                             -- 4. 업무: 작업 설명 (50~100자 권장)
    instruction_file TEXT,                               -- 5. 작업지시서: 파일 경로/URL
    assigned_agent VARCHAR(50),                          -- 6. 담당AI (서브 에이전트): fullstack-developer 등
    tools TEXT,                                          -- 7. 사용도구: React/TypeScript/Supabase
    work_mode VARCHAR(50) NOT NULL,                      -- 8. 작업 방식: AI-Only, AI + 사용자 수동 작업
    dependency_chain TEXT,                               -- 9. 의존성 체인: P1F4, P2B1 (쉼표 구분)
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),  -- 10. 진도: 0~100
    status TEXT NOT NULL,                                -- 11. 상태: 대기, 진행 중, 완료 (YYYY-MM-DD HH:MM)

    -- ========== 【작업 실행 기록】(4개) - 코드 생성 기록 ==========
    generated_files TEXT,                                -- 12. 생성 소스코드 파일: 경로;경로 [타임스탬프]
    generator VARCHAR(50),                               -- 13. 생성자: Claude-3.5-Sonnet, GPT-4
    duration TEXT,                                       -- 14. 소요시간: "45분", "진행중"
    modification_history TEXT,                           -- 15. 수정이력: [v1.0] 초기구현 / [ERROR]→[FIX]

    -- ========== 【검증】(5개) - 코드 검증 기록 ==========
    test_history TEXT,                                   -- 16. 테스트내역: CR(15/15)@QA-01 → Test(24/24)@Test-01
    build_result VARCHAR(20),                            -- 17. 빌드결과: ✅ 성공, ❌ 실패, ⏳ 대기
    dependency_propagation TEXT,                         -- 18. 의존성 전파: ✅ 이행, ❌ 불이행 - P2B1
    blocker TEXT,                                        -- 19. 블로커: 없음, 의존성 문제: P3B1b
    validation_result TEXT,                              -- 20. 종합 검증 결과: ✅ 통과, 🔄 진행중

    -- ========== 【기타 정보】(1개) - 추가 정보 ==========
    remarks TEXT,                                        -- 21. 참고사항: 메모, 특이사항

    -- ========== 메타데이터 ==========
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 인덱스 생성 (조회 성능 최적화)
-- ============================================

-- Phase별 조회 최적화
CREATE INDEX idx_phase ON project_grid_tasks(phase);

-- Area별 조회 최적화
CREATE INDEX idx_area ON project_grid_tasks(area);

-- Phase + Area 조합 조회 최적화 (3D 블록 뷰)
CREATE INDEX idx_phase_area ON project_grid_tasks(phase, area);

-- 상태별 필터링 최적화
CREATE INDEX idx_status ON project_grid_tasks(status);

-- 검증 결과별 필터링 최적화
CREATE INDEX idx_validation_result ON project_grid_tasks(validation_result);

-- 작업명 전문 검색 인덱스
CREATE INDEX idx_task_name_search ON project_grid_tasks USING gin(to_tsvector('simple', task_name));

-- ============================================
-- Row Level Security (RLS) 설정
-- ============================================

-- RLS 활성화
ALTER TABLE project_grid_tasks ENABLE ROW LEVEL SECURITY;

-- 읽기 정책: 모든 인증된 사용자
CREATE POLICY "Allow authenticated read access"
    ON project_grid_tasks
    FOR SELECT
    TO authenticated
    USING (true);

-- 쓰기 정책: 인증된 사용자만 삽입/수정/삭제
CREATE POLICY "Allow authenticated write access"
    ON project_grid_tasks
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- ============================================
-- 트리거: updated_at 자동 업데이트
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_project_grid_tasks_updated_at
    BEFORE UPDATE ON project_grid_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 샘플 데이터 삽입 (6개 작업)
-- ============================================

INSERT INTO project_grid_tasks (
    phase, area, task_id, task_name, instruction_file,
    assigned_agent, tools, work_mode, dependency_chain,
    progress, status, generated_files, generator, duration,
    modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES
-- Phase 1, Frontend, 완료
(
    1, 'F', 'P1F1', 'AuthContext 생성', 'tasks/P1F1.md',
    'fullstack-developer', 'React/TypeScript/Supabase', 'AI-Only', '없음',
    100, '완료 (2025-10-16 14:30)',
    'AuthContext.tsx (2025-10-23 12:42:57);useAuth.ts (2025-10-23 12:42:57)',
    'Claude-3.5-Sonnet', '45분',
    'Supabase Auth 통합 완료',
    'CR(15/15)@QA-01 → Test(24/24)@Test-01 → Build(성공)@CI',
    '✅ 성공', '✅ 이행', '없음',
    '✅ 통과 | 보고서: docs/P1F1_REPORT.md (2025-10-23 14:30)',
    'Context API 사용'
),
-- Phase 1, Frontend, 완료
(
    1, 'F', 'P1F2', '회원가입 페이지', 'tasks/P1F2.md',
    'fullstack-developer', 'React/TypeScript', 'AI-Only', 'P1F1',
    100, '완료 (2025-10-17 09:15)',
    'RegisterPage.tsx (2025-10-23 12:43:01);register.module.css (2025-10-23 12:43:01)',
    'Claude-3.5-Sonnet', '60분',
    '폼 검증 추가',
    'CR(12/12)@QA-02 → Test(18/18)@Test-01 → Build(성공)@CI',
    '✅ 성공', '✅ 이행', '없음',
    '✅ 통과 | 보고서: docs/P1F2_REPORT.md',
    'Zod 스키마 검증'
),
-- Phase 1, Backend, 완료
(
    1, 'B', 'P1B1', 'JWT 인증 API', 'tasks/P1B1.md',
    'fullstack-developer', 'Python/FastAPI', 'AI-Only', '없음',
    100, '완료 (2025-10-16 11:20)',
    'auth.py (2025-10-23 12:40:12);jwt_utils.py (2025-10-23 12:40:12);middleware.py (2025-10-23 12:40:12)',
    'GPT-4', '90분',
    'RefreshToken 추가',
    'CR(20/20)@QA-03 → Test(35/35)@Test-02 → Build(성공)@CI',
    '✅ 성공', '✅ 이행', '없음',
    '✅ 통과 | 보고서: docs/P1B1_REPORT.md',
    'JWT 만료시간 24시간'
),
-- Phase 2, Frontend, 진행중
(
    2, 'F', 'P2F1', 'Dashboard UI 구현', 'tasks/P2F1.md',
    'fullstack-developer', 'React/Recharts', 'AI-Only', 'P1F2',
    60, '진행 중',
    'Dashboard.tsx (2025-10-24 10:15:22)',
    'Claude-3.5-Sonnet', '진행중',
    '차트 컴포넌트 추가 중',
    'CR(진행:8/12)@QA-01 → Test(대기) → Build(대기)',
    '⏳ 대기', '✅ 이행', '없음',
    '🔄 진행중',
    'Recharts 라이브러리 사용'
),
-- Phase 2, Backend, 진행중
(
    2, 'B', 'P2B1', '사용자 CRUD API', 'tasks/P2B1.md',
    'database-specialist', 'Python/FastAPI/SQLAlchemy', 'AI-Only', 'P1B1',
    70, '진행 중',
    'users.py (2025-10-24 11:20:05);schemas.py (2025-10-24 11:20:05)',
    'GPT-4', '진행중',
    'Pagination 추가',
    'CR(15/20)@QA-03 → Test(대기) → Build(대기)',
    '⏳ 대기', '✅ 이행', '없음',
    '🔄 진행중',
    'FastAPI 라우터'
),
-- Phase 3, Frontend, 대기
(
    3, 'F', 'P3F1', '데이터 시각화 차트', 'tasks/P3F1.md',
    NULL, 'React/D3.js', 'AI-Only', 'P2F1',
    0, '대기',
    NULL, '-', '-', '-',
    '대기',
    '⏳ 대기', '❌ 불이행 - P2F1', 'P2F1 완료 필요',
    '⏳ 대기',
    'D3.js 또는 Recharts'
);

-- ============================================
-- 유용한 뷰 (Views) 생성
-- ============================================

-- 완료된 작업만 보기
CREATE OR REPLACE VIEW completed_tasks AS
SELECT * FROM project_grid_tasks
WHERE status LIKE '완료%'
ORDER BY phase, area, task_id;

-- 진행 중인 작업만 보기
CREATE OR REPLACE VIEW in_progress_tasks AS
SELECT * FROM project_grid_tasks
WHERE status = '진행 중'
ORDER BY phase, area, task_id;

-- 대기 중인 작업만 보기
CREATE OR REPLACE VIEW pending_tasks AS
SELECT * FROM project_grid_tasks
WHERE status = '대기'
ORDER BY phase, area, task_id;

-- 검증 통과한 작업만 보기
CREATE OR REPLACE VIEW validated_tasks AS
SELECT * FROM project_grid_tasks
WHERE validation_result LIKE '✅ 통과%'
ORDER BY phase, area, task_id;

-- Phase별 통계
CREATE OR REPLACE VIEW phase_statistics AS
SELECT
    phase,
    COUNT(*) as total_tasks,
    SUM(CASE WHEN status LIKE '완료%' THEN 1 ELSE 0 END) as completed,
    SUM(CASE WHEN status = '진행 중' THEN 1 ELSE 0 END) as in_progress,
    SUM(CASE WHEN status = '대기' THEN 1 ELSE 0 END) as pending,
    ROUND(AVG(progress), 2) as avg_progress
FROM project_grid_tasks
GROUP BY phase
ORDER BY phase;

-- Area별 통계
CREATE OR REPLACE VIEW area_statistics AS
SELECT
    area,
    CASE area
        WHEN 'F' THEN 'Frontend'
        WHEN 'B' THEN 'Backend'
        WHEN 'D' THEN 'Database'
        WHEN 'T' THEN 'Testing'
        WHEN 'S' THEN 'Security'
        WHEN 'O' THEN 'DevOps'
    END as area_name,
    COUNT(*) as total_tasks,
    SUM(CASE WHEN status LIKE '완료%' THEN 1 ELSE 0 END) as completed,
    SUM(CASE WHEN status = '진행 중' THEN 1 ELSE 0 END) as in_progress,
    SUM(CASE WHEN status = '대기' THEN 1 ELSE 0 END) as pending,
    ROUND(AVG(progress), 2) as avg_progress
FROM project_grid_tasks
GROUP BY area
ORDER BY area;

-- ============================================
-- 유용한 함수 생성
-- ============================================

-- 특정 작업의 의존성 체인 조회 (재귀)
CREATE OR REPLACE FUNCTION get_dependency_chain(target_task_id VARCHAR)
RETURNS TABLE(
    task_id VARCHAR,
    task_name TEXT,
    status TEXT,
    progress INTEGER,
    level INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE dep_chain AS (
        -- 기본 작업
        SELECT
            t.task_id,
            t.task_name,
            t.status,
            t.progress,
            t.dependency_chain,
            0 as level
        FROM project_grid_tasks t
        WHERE t.task_id = target_task_id

        UNION ALL

        -- 의존하는 작업들
        SELECT
            t.task_id,
            t.task_name,
            t.status,
            t.progress,
            t.dependency_chain,
            dc.level + 1
        FROM project_grid_tasks t
        INNER JOIN dep_chain dc
            ON t.task_id = ANY(string_to_array(regexp_replace(dc.dependency_chain, '\s', '', 'g'), ','))
        WHERE dc.dependency_chain IS NOT NULL
          AND dc.dependency_chain != '없음'
          AND dc.level < 10  -- 무한 루프 방지
    )
    SELECT dc.task_id, dc.task_name, dc.status, dc.progress, dc.level
    FROM dep_chain dc
    ORDER BY dc.level;
END;
$$ LANGUAGE plpgsql;

-- 블로커가 있는 작업 조회
CREATE OR REPLACE FUNCTION get_blocked_tasks()
RETURNS TABLE(
    task_id VARCHAR,
    task_name TEXT,
    blocker TEXT,
    phase INTEGER,
    area VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.task_id,
        t.task_name,
        t.blocker,
        t.phase,
        t.area
    FROM project_grid_tasks t
    WHERE t.blocker IS NOT NULL
      AND t.blocker != '없음'
    ORDER BY t.phase, t.area;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 코멘트 (문서화) - 매뉴얼 V2.0 준수
-- ============================================

COMMENT ON TABLE project_grid_tasks IS 'PROJECT GRID 작업 관리 테이블 - 매뉴얼 V2.0 기준 21개 속성';

COMMENT ON COLUMN project_grid_tasks.phase IS '1. Phase (개발 단계): X축 좌표, 순차적 진행 관리';
COMMENT ON COLUMN project_grid_tasks.area IS '2. Area (개발 영역): Y축 좌표, F/B/D/T/S/O';
COMMENT ON COLUMN project_grid_tasks.task_id IS '3. 작업ID: P[Phase][Area][번호][병렬] 형식, Primary Key';
COMMENT ON COLUMN project_grid_tasks.task_name IS '4. 업무: 작업 설명 (50~100자 권장)';
COMMENT ON COLUMN project_grid_tasks.instruction_file IS '5. 작업지시서: 파일 경로 또는 URL';
COMMENT ON COLUMN project_grid_tasks.assigned_agent IS '6. 담당AI (서브 에이전트): fullstack-developer 등';
COMMENT ON COLUMN project_grid_tasks.tools IS '7. 사용도구: React/TypeScript 등 (슬래시 또는 세미콜론 구분)';
COMMENT ON COLUMN project_grid_tasks.work_mode IS '8. 작업 방식: AI-Only, AI + 사용자 수동 작업, 협력 AI API 연결, 협력 AI 수동 연결';
COMMENT ON COLUMN project_grid_tasks.dependency_chain IS '9. 의존성 체인: 선행 작업ID (쉼표 구분)';
COMMENT ON COLUMN project_grid_tasks.progress IS '10. 진도: 0~100%';
COMMENT ON COLUMN project_grid_tasks.status IS '11. 상태: 대기, 진행 중, 완료 (YYYY-MM-DD HH:MM)';
COMMENT ON COLUMN project_grid_tasks.generated_files IS '12. 생성 소스코드 파일: 경로;경로 [타임스탬프]';
COMMENT ON COLUMN project_grid_tasks.generator IS '13. 생성자: AI 모델명';
COMMENT ON COLUMN project_grid_tasks.duration IS '14. 소요시간: 분 단위 또는 "진행중"';
COMMENT ON COLUMN project_grid_tasks.modification_history IS '15. 수정이력: [v버전] 또는 [ERROR]→[FIX]→[PASS/FAIL]';
COMMENT ON COLUMN project_grid_tasks.test_history IS '16. 테스트내역: CR(진행)@검증자 → Test(진행)@검증자 → Build(상태)@시스템';
COMMENT ON COLUMN project_grid_tasks.build_result IS '17. 빌드결과: ✅ 성공, ❌ 실패, ⏳ 대기, ⚠️ 경고';
COMMENT ON COLUMN project_grid_tasks.dependency_propagation IS '18. 의존성 전파: ✅ 이행, ❌ 불이행 - [작업ID], ⏳ 대기';
COMMENT ON COLUMN project_grid_tasks.blocker IS '19. 블로커: 없음, 기술적 문제, 의존성 문제, 자원 부족, 테스트 실패';
COMMENT ON COLUMN project_grid_tasks.validation_result IS '20. 종합 검증 결과: ✅ 통과, 🔄 진행중, ⏳ 대기, ❌ 실패 (보고서 경로 포함)';
COMMENT ON COLUMN project_grid_tasks.remarks IS '21. 참고사항: 메모, 특이사항';

-- ============================================
-- 실행 완료 메시지
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '============================================';
    RAISE NOTICE 'PROJECT GRID 테이블 생성 완료!';
    RAISE NOTICE '매뉴얼: V2.0 (21개 속성)';
    RAISE NOTICE '샘플 데이터: 6개 작업 삽입됨';
    RAISE NOTICE '============================================';
END $$;
