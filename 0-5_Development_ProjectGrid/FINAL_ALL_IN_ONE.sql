-- ============================================
-- PROJECT GRID V4.0 통합 설치 SQL
-- 한 번에 모든 작업 실행
-- ============================================

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

-- ============================================
-- 2단계: 스키마 생성
-- ============================================

-- ============================================
-- PROJECT GRID - Supabase PostgreSQL Schema V4.0
-- ============================================
-- 매뉴얼: 프로젝트 그리드 작성 매뉴얼 V4.0
-- 21개 속성 완전 구현 (매뉴얼 순서 준수)
-- V4.0 개편: 6개 영역 (O/D/BI/BA/F/T)
-- ============================================

-- 작업 테이블 (Tasks)
CREATE TABLE IF NOT EXISTS project_grid_tasks (
    -- ========== 【그리드 좌표】(2개) - 3D 공간 위치 ==========
    phase INTEGER NOT NULL,                              -- 1. Phase (개발 단계): 1, 2, 3...
    area VARCHAR(2) NOT NULL CHECK (area IN ('O', 'D', 'BI', 'BA', 'F', 'T')),  -- 2. Area: O/D/BI/BA/F/T

    -- ========== 【작업 기본 정보】(9개) - 작업 정의 및 할당 ==========
    task_id VARCHAR(20) PRIMARY KEY,                     -- 3. 작업ID: P1O1, P2BI3a, P3BA5 등 (PK)
    task_name TEXT NOT NULL,                             -- 4. 업무: 작업 설명 (50~100자 권장)
    instruction_file TEXT,                               -- 5. 작업지시서: 파일 경로/URL
    assigned_agent VARCHAR(50),                          -- 6. 담당AI (서브 에이전트): fullstack-developer 등
    tools TEXT,                                          -- 7. 사용도구: React/TypeScript/Supabase
    work_mode VARCHAR(50) NOT NULL,                      -- 8. 작업 방식: AI-Only, AI + 사용자 수동 작업
    dependency_chain TEXT,                               -- 9. 의존성 체인: P1O4, P2BI1 (쉼표 구분)
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),  -- 10. 진도: 0~100
    status TEXT NOT NULL,                                -- 11. 상태: 대기, 진행 중, 완료 (YYYY-MM-DD HH:MM)

    -- ========== 【작업 실행 기록】(4개) - 코드 생성 기록 ==========
    generated_files TEXT,                                -- 12. 생성 소스코드 파일: 경로;경로 [타임스탬프]
    generator VARCHAR(50),                               -- 13. 생성자: Claude-Sonnet-4.5, GPT-4
    duration TEXT,                                       -- 14. 소요시간: "45분", "진행중"
    modification_history TEXT,                           -- 15. 수정이력: [v1.0] 초기구현 / [ERROR]→[FIX]

    -- ========== 【검증】(5개) - 코드 검증 기록 ==========
    test_history TEXT,                                   -- 16. 테스트내역: CR(15/15)@QA-01 → Test(24/24)@Test-01
    build_result VARCHAR(20),                            -- 17. 빌드결과: ✅ 성공, ❌ 실패, ⏳ 대기
    dependency_propagation TEXT,                         -- 18. 의존성 전파: ✅ 이행, ❌ 불이행 - P2BI1
    blocker TEXT,                                        -- 19. 블로커: 없음, 의존성 문제: P3BI1b
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
CREATE INDEX IF NOT EXISTS idx_phase ON project_grid_tasks(phase);

-- Area별 조회 최적화
CREATE INDEX IF NOT EXISTS idx_area ON project_grid_tasks(area);

-- Phase + Area 조합 조회 최적화 (3D 블록 뷰)
CREATE INDEX IF NOT EXISTS idx_phase_area ON project_grid_tasks(phase, area);

-- 상태별 필터링 최적화
CREATE INDEX IF NOT EXISTS idx_status ON project_grid_tasks(status);

-- 검증 결과별 필터링 최적화
CREATE INDEX IF NOT EXISTS idx_validation_result ON project_grid_tasks(validation_result);

-- 작업명 전문 검색 인덱스
CREATE INDEX IF NOT EXISTS idx_task_name_search ON project_grid_tasks USING gin(to_tsvector('simple', task_name));

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
-- 샘플 데이터 삽입 (6개 작업 - V4.0 영역 코드)
-- ============================================

INSERT INTO project_grid_tasks (
    phase, area, task_id, task_name, instruction_file,
    assigned_agent, tools, work_mode, dependency_chain,
    progress, status, generated_files, generator, duration,
    modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES
-- Phase 1, DevOps, 완료
(
    1, 'O', 'P1O1', '프로젝트 초기화', 'tasks/P1O1.md',
    'devops-troubleshooter', 'Next.js/TypeScript/Tailwind', 'AI-Only', '없음',
    100, '완료 (2025-10-31 10:30)',
    'package.json (2025-10-31 10:15:32);next.config.js (2025-10-31 10:15:32);tailwind.config.js (2025-10-31 10:15:32)',
    'Claude-Sonnet-4.5', '30분',
    'Next.js 14 설정 완료',
    'CR(10/10)@QA-01 → Test(12/12)@Test-01 → Build(성공)@CI',
    '✅ 성공', '✅ 이행', '없음',
    '✅ 통과 | 보고서: docs/P1O1_REPORT.md (2025-10-31 10:30)',
    'TypeScript strict mode'
),
-- Phase 1, Database, 완료
(
    1, 'D', 'P1D1', '인증 스키마', 'tasks/P1D1.md',
    'database-specialist', 'Supabase/PostgreSQL', 'AI-Only', 'P1O1',
    100, '완료 (2025-10-31 11:20)',
    'supabase/migrations/001_auth_schema.sql (2025-10-31 11:10:15)',
    'Claude-Sonnet-4.5', '40분',
    'RLS 정책 추가',
    'CR(15/15)@QA-02 → Test(20/20)@Test-02 → Build(성공)@Supabase',
    '✅ 성공', '✅ 이행', '없음',
    '✅ 통과 | 보고서: docs/P1D1_REPORT.md',
    'profiles, auth_tokens 테이블'
),
-- Phase 1, Backend Infrastructure, 완료
(
    1, 'BI', 'P1BI1', 'Supabase 클라이언트', 'tasks/P1BI1.md',
    'fullstack-developer', 'TypeScript/Supabase', 'AI-Only', 'P1D1',
    100, '완료 (2025-10-31 12:15)',
    'lib/supabase/client.ts (2025-10-31 12:05:20)',
    'Claude-Sonnet-4.5', '25분',
    'Auth 헬퍼 함수 추가',
    'CR(8/8)@QA-01 → Test(15/15)@Test-01 → Build(성공)@CI',
    '✅ 성공', '✅ 이행', '없음',
    '✅ 통과 | 보고서: docs/P1BI1_REPORT.md',
    'SSR/CSR 클라이언트 분리'
),
-- Phase 1, Backend APIs, 진행중
(
    1, 'BA', 'P1BA1', '회원가입 API', 'tasks/P1BA1.md',
    'fullstack-developer', 'Next.js/TypeScript', 'AI-Only', 'P1BI1',
    60, '진행 중',
    'app/api/auth/signup/route.ts (2025-10-31 14:10:25)',
    'Claude-Sonnet-4.5', '진행중',
    '이메일 인증 로직 추가 중',
    'CR(진행:10/15)@QA-01 → Test(대기) → Build(대기)',
    '⏳ 대기', '✅ 이행', '없음',
    '🔄 진행중',
    'Zod 스키마 검증'
),
-- Phase 1, Frontend, 대기
(
    1, 'F', 'P1F1', '회원가입 페이지', 'tasks/P1F1.md',
    NULL, 'React/TypeScript/Tailwind', 'AI-Only', 'P1BA1',
    0, '대기',
    NULL, '-', '-', '-',
    '대기',
    '⏳ 대기', '❌ 불이행 - P1BA1', 'P1BA1 완료 필요',
    '⏳ 대기',
    '5개 필드 + 약관 모달'
),
-- Phase 1, Test, 대기
(
    1, 'T', 'P1T1', '인증 E2E 테스트', 'tasks/P1T1.md',
    NULL, 'Playwright/TypeScript', 'AI-Only', 'P1F1',
    0, '대기',
    NULL, '-', '-', '-',
    '대기',
    '⏳ 대기', '❌ 불이행 - P1F1', 'P1F1 완료 필요',
    '⏳ 대기',
    '회원가입/로그인 E2E'
);

-- ============================================
-- 유용한 뷰 (Views) 생성 - V4.0 영역 반영
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

-- Area별 통계 (V4.0 영역)
CREATE OR REPLACE VIEW area_statistics AS
SELECT
    area,
    CASE area
        WHEN 'O' THEN 'DevOps'
        WHEN 'D' THEN 'Database'
        WHEN 'BI' THEN 'Backend Infrastructure'
        WHEN 'BA' THEN 'Backend APIs'
        WHEN 'F' THEN 'Frontend'
        WHEN 'T' THEN 'Test'
    END as area_name,
    COUNT(*) as total_tasks,
    SUM(CASE WHEN status LIKE '완료%' THEN 1 ELSE 0 END) as completed,
    SUM(CASE WHEN status = '진행 중' THEN 1 ELSE 0 END) as in_progress,
    SUM(CASE WHEN status = '대기' THEN 1 ELSE 0 END) as pending,
    ROUND(AVG(progress), 2) as avg_progress
FROM project_grid_tasks
GROUP BY area
ORDER BY
    CASE area
        WHEN 'O' THEN 1
        WHEN 'D' THEN 2
        WHEN 'BI' THEN 3
        WHEN 'BA' THEN 4
        WHEN 'F' THEN 5
        WHEN 'T' THEN 6
    END;

-- ============================================
-- 유용한 함수 생성
-- ============================================

-- 특정 작업의 의존성 체인 조회 (재귀)
CREATE OR REPLACE FUNCTION get_dependency_chain(target_task_id VARCHAR(20))
RETURNS TABLE(
    task_id VARCHAR(20),
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
    task_id VARCHAR(20),
    task_name TEXT,
    blocker TEXT,
    phase INTEGER,
    area VARCHAR(2)
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
-- 코멘트 (문서화) - 매뉴얼 V4.0 준수
-- ============================================

COMMENT ON TABLE project_grid_tasks IS 'PROJECT GRID 작업 관리 테이블 - 매뉴얼 V4.0 기준 21개 속성, 6개 영역 (O/D/BI/BA/F/T)';

COMMENT ON COLUMN project_grid_tasks.phase IS '1. Phase (개발 단계): X축 좌표, 순차적 진행 관리';
COMMENT ON COLUMN project_grid_tasks.area IS '2. Area (개발 영역): Y축 좌표, O/D/BI/BA/F/T (DevOps/Database/Backend Infrastructure/Backend APIs/Frontend/Test)';
COMMENT ON COLUMN project_grid_tasks.task_id IS '3. 작업ID: P[Phase][Area][번호][병렬] 형식, Primary Key (예: P1O1, P2BI3a, P3BA5)';
COMMENT ON COLUMN project_grid_tasks.task_name IS '4. 업무: 작업 설명 (50~100자 권장)';
COMMENT ON COLUMN project_grid_tasks.instruction_file IS '5. 작업지시서: 파일 경로 또는 URL';
COMMENT ON COLUMN project_grid_tasks.assigned_agent IS '6. 담당AI (서브 에이전트): fullstack-developer, devops-troubleshooter, database-specialist 등';
COMMENT ON COLUMN project_grid_tasks.tools IS '7. 사용도구: React/TypeScript 등 (슬래시 또는 세미콜론 구분)';
COMMENT ON COLUMN project_grid_tasks.work_mode IS '8. 작업 방식: AI-Only, AI + 사용자 수동 작업, 협력 AI API 연결, 협력 AI 수동 연결';
COMMENT ON COLUMN project_grid_tasks.dependency_chain IS '9. 의존성 체인: 선행 작업ID (쉼표 구분)';
COMMENT ON COLUMN project_grid_tasks.progress IS '10. 진도: 0~100%';
COMMENT ON COLUMN project_grid_tasks.status IS '11. 상태: 대기, 진행 중, 완료 (YYYY-MM-DD HH:MM)';
COMMENT ON COLUMN project_grid_tasks.generated_files IS '12. 생성 소스코드 파일: 경로;경로 [타임스탬프]';
COMMENT ON COLUMN project_grid_tasks.generator IS '13. 생성자: AI 모델명 (Claude-Sonnet-4.5, GPT-4 등)';
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
    RAISE NOTICE '매뉴얼: V4.0 (21개 속성, 6개 영역)';
    RAISE NOTICE '영역: O(DevOps), D(Database), BI(Backend Infrastructure), BA(Backend APIs), F(Frontend), T(Test)';
    RAISE NOTICE '샘플 데이터: 6개 작업 삽입됨';
    RAISE NOTICE '============================================';
END $$;

-- ============================================
-- 3단계: 데이터 삽입 (144개 작업)
-- ============================================

-- PROJECT GRID 자동 생성 SQL V4.0
-- 생성 시각: 2025-10-31 02:53:02
-- 작업 수: 144개
-- 소스: PoliticianFinder_개발업무_최종.md

-- 기존 데이터 삭제 (테스트용)
DELETE FROM project_grid_tasks;

INSERT INTO project_grid_tasks (
    phase, area, task_id, task_name, instruction_file,
    assigned_agent, tools, work_mode, dependency_chain,
    progress, status, generated_files, generator, duration,
    modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES
(1, 'O', 'P1O1', '프로젝트 초기화', 'tasks/P1O1.md', 'devops-troubleshooter', 'Next.js/Vercel/GitHub Actions', 'AI-Only', '없음', 0, '대기', '`package.json`, `next.config.js`, `tailwind.config.js`, `.env.local`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'Next.js 14 설정 / Tailwind CSS 설정 / ESLint, Prettier / 환경변수 템플릿'),
(1, 'D', 'P1D1', '인증 스키마', 'tasks/P1D1.md', 'database-specialist', 'Supabase/PostgreSQL', 'AI-Only', 'P1O1', 0, '대기', '`supabase/migrations/001_auth_schema.sql`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'profiles 테이블 / auth_tokens 테이블 / email_verifications 테이블 / password_resets 테이블 / 인덱스 생성 / RLS 정책'),
(1, 'D', 'P1D2', '트리거', 'tasks/P1D2.md', 'database-specialist', 'Supabase/PostgreSQL', 'AI-Only', 'P1D1', 0, '대기', '`supabase/migrations/002_auth_triggers.sql`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'profiles.updated_at 자동 갱신 / auth.users 생성 시 profiles 자동 생성'),
(1, 'D', 'P1D3', '시드 데이터', 'tasks/P1D3.md', 'database-specialist', 'Supabase/PostgreSQL', 'AI-Only', 'P1D1', 0, '대기', '`supabase/seed_dev.sql`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '테스트 계정 생성'),
(1, 'D', 'P1D4', '타입 생성', 'tasks/P1D4.md', 'database-specialist', 'Supabase/PostgreSQL', 'AI-Only', 'P1D1', 0, '대기', '`lib/database.types.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'Supabase CLI로 타입 생성'),
(1, 'D', 'P1D5', 'Supabase 프로젝트 설정', 'tasks/P1D5.md', 'database-specialist', 'Supabase/PostgreSQL', 'AI-Only', 'P1D1', 0, '대기', 'Supabase 콘솔 설정', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '프로젝트 생성 / API 키 발급'),
(1, 'BI', 'P1BI1', 'Supabase 클라이언트', 'tasks/P1BI1.md', 'fullstack-developer', 'Next.js API Routes/Supabase Client', 'AI-Only', 'P1D1, P1D4, P1D5', 0, '대기', '`lib/supabase/client.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '클라이언트 설정 / Auth 헬퍼 함수'),
(1, 'BI', 'P1BI2', 'API 미들웨어', 'tasks/P1BI2.md', 'fullstack-developer', 'Next.js API Routes/Supabase Client', 'AI-Only', '없음', 0, '대기', '`middleware.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'JWT 검증 / Rate Limiting / CORS 설정'),
(1, 'BI', 'P1BI3', '인증 보안 설정', 'tasks/P1BI3.md', 'fullstack-developer', 'Next.js API Routes/Supabase Client', 'AI-Only', '없음', 0, '대기', '`lib/security/auth.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '비밀번호 강도 검증 / Rate Limiting 규칙 / CSRF 토큰'),
(1, 'BA', 'P1BA1', '회원가입 API', 'tasks/P1BA1.md', 'fullstack-developer', 'Next.js API Routes/Zod', 'AI-Only', 'P1BI1, P1BI2', 0, '대기', '`app/api/auth/signup/route.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '이메일 중복 체크 / 비밀번호 해싱 / 프로필 생성 / 이메일 인증 발송'),
(1, 'BA', 'P1BA2', '로그인 API', 'tasks/P1BA2.md', 'fullstack-developer', 'Next.js API Routes/Zod', 'AI-Only', 'P1BI1, P1BI2', 0, '대기', '`app/api/auth/login/route.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '이메일/비밀번호 검증 / JWT 토큰 발급 / Refresh Token 처리 / 세션 생성'),
(1, 'BA', 'P1BA3', '구글 OAuth API', 'tasks/P1BA3.md', 'fullstack-developer', 'Next.js API Routes/Zod', 'AI-Only', 'P1BI1, P1BI2', 0, '대기', '`app/api/auth/google/route.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '구글 OAuth 콜백 / 계정 연동/생성 / JWT 발급'),
(1, 'BA', 'P1BA4', '비밀번호 재설정 API', 'tasks/P1BA4.md', 'fullstack-developer', 'Next.js API Routes/Zod', 'AI-Only', 'P1BI1, P1BI2', 0, '대기', '`app/api/auth/reset-password/route.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '재설정 이메일 발송 / 토큰 검증 / 비밀번호 업데이트'),
(1, 'F', 'P1F1', '전역 레이아웃', 'tasks/P1F1.md', 'fullstack-developer', 'React/TypeScript/Tailwind CSS', 'AI-Only', 'P1BI1', 0, '대기', '`app/layout.tsx`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '헤더 (네비게이션, 알림 아이콘, 로그인/회원가입 버튼) / 푸터 / AuthContext Provider'),
(1, 'F', 'P1F2', '홈 페이지', 'tasks/P1F2.md', 'fullstack-developer', 'React/TypeScript/Tailwind CSS', 'AI-Only', 'P1F1', 0, '대기', '`app/page.tsx`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '랜딩 페이지 / 서비스 소개'),
(1, 'F', 'P1F3', '회원가입 페이지', 'tasks/P1F3.md', 'fullstack-developer', 'React/TypeScript/Tailwind CSS', 'AI-Only', 'P1BA1, P1F1', 0, '대기', '`app/signup/page.tsx`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '5개 필드 (이메일, 비밀번호, 비밀번호확인, 닉네임, 실명) / 3개 약관 모달 (이용약관, 개인정보, 마케팅) / 구글 소셜로그인 / 클라이언트 검증'),
(1, 'F', 'P1F4', '로그인 페이지', 'tasks/P1F4.md', 'fullstack-developer', 'React/TypeScript/Tailwind CSS', 'AI-Only', 'P1BA2, P1BA3, P1F1', 0, '대기', '`app/login/page.tsx`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '이메일/비밀번호 / 로그인 상태 유지 / 구글 소셜로그인 / 비밀번호 찾기 링크'),
(1, 'F', 'P1F5', '비밀번호 재설정 페이지', 'tasks/P1F5.md', 'fullstack-developer', 'React/TypeScript/Tailwind CSS', 'AI-Only', 'P1BA4, P1F1', 0, '대기', '`app/password-reset/page.tsx`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '4단계 UI (이메일 입력 → 발송 확인 → 새 비밀번호 → 완료) / 비밀번호 강도 표시 / 요구사항 체크 / 보기/숨기기 토글'),
(1, 'T', 'P1T1', '인증 E2E 테스트', 'tasks/P1T1.md', 'qa-specialist', 'Playwright/Vitest', 'AI-Only', 'P1F3, P1F4, P1F5', 0, '대기', '`e2e/auth.spec.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '회원가입 플로우 / 로그인 플로우 / 비밀번호 재설정'),
(1, 'T', 'P1T2', '인증 API 테스트', 'tasks/P1T2.md', 'qa-specialist', 'Playwright/Vitest', 'AI-Only', 'P1BA1, P1BA2, P1BA3, P1BA4', 0, '대기', '`tests/api/auth.test.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '회원가입 API / 로그인 API / 토큰 검증'),
(2, 'F', 'P2F1', '정치인 목록 페이지', 'tasks/P2F1.md', 'fullstack-developer', 'React/TypeScript/Tailwind CSS', 'AI-Only', '없음', 0, '대기', '`app/politicians/page.tsx` (← 1단계(Phase 1))', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '검색/필터 (10개 정당, 17개 지역, 6개 직책) / 정렬 (AI평점순, 회원평점순, 이름순) / 정치인 카드 (AI평점, 회원평점, 등급, 즐겨찾기) / 무한 스크롤'),
(2, 'F', 'P2F2', '정치인 상세 페이지', 'tasks/P2F2.md', 'fullstack-developer', 'React/TypeScript/Tailwind CSS', 'AI-Only', 'P2F1', 0, '대기', '`app/politicians/[id]/page.tsx`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '기본 정보 / AI 평가 정보 (5개 AI, 시계열 그래프 Chart.js) / AI 평가내역 모달 (10개 분야) / 상세보고서 구매 섹션 (본인 인증 필수) / 커뮤니티 활동 정보 / 선관위 공식 정보'),
(2, 'F', 'P2F3', '관심 정치인 페이지', 'tasks/P2F3.md', 'fullstack-developer', 'React/TypeScript/Tailwind CSS', 'AI-Only', 'P2F1', 0, '대기', '`app/favorites/page.tsx`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '관심 정치인 목록 / 검색/추가/삭제'),
(2, 'BA', 'P2BA1', '정치인 목록 API', 'tasks/P2BA1.md', 'fullstack-developer', 'Next.js API Routes/Zod', 'AI-Only', '없음', 0, '대기', '`app/api/politicians/route.ts` (← Database)', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'GET 목록 / 검색 / 필터링 (정당, 지역, 직책) / 정렬 / 페이지네이션'),
(2, 'BA', 'P2BA2', '정치인 상세 API', 'tasks/P2BA2.md', 'fullstack-developer', 'Next.js API Routes/Zod', 'AI-Only', 'P2BA1', 0, '대기', '`app/api/politicians/[id]/route.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'GET 상세 정보 / 모든 관련 데이터 조인'),
(2, 'BA', 'P2BA3', '관심 정치인 API', 'tasks/P2BA3.md', 'fullstack-developer', 'Next.js API Routes/Zod', 'AI-Only', '없음', 0, '대기', '`app/api/favorites/route.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'POST 추가 / DELETE 제거 / GET 목록'),
(2, 'BA', 'P2BA4', '정치인 본인 인증 API', 'tasks/P2BA4.md', 'fullstack-developer', 'Next.js API Routes/Zod', 'AI-Only', '없음', 0, '대기', '`app/api/politicians/verify/route.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'POST 본인 인증 (이름, 정당, 직종 일치 확인)'),
(2, 'BA', 'P2BA5', 'AI 평가 요청 API', 'tasks/P2BA5.md', 'fullstack-developer', 'Next.js API Routes/Zod', 'AI-Only', '없음', 0, '대기', '`app/api/evaluations/request/route.ts` (← 평가 엔진)', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'POST 평가 요청 (평가 엔진 호출)'),
(2, 'BA', 'P2BA6', 'AI 평가 결과 API', 'tasks/P2BA6.md', 'fullstack-developer', 'Next.js API Routes/Zod', 'AI-Only', 'P2BA5', 0, '대기', '`app/api/evaluations/[id]/route.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'GET 평가 결과 / GET 시계열 데이터'),
(2, 'BA', 'P2BA7', '선관위 크롤링 스크립트', 'tasks/P2BA7.md', 'fullstack-developer', 'Next.js API Routes/Zod', 'AI-Only', '없음', 0, '대기', '`scripts/crawl-nec.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '선관위 API/크롤링 / 정치인 기본 정보 수집'),
(2, 'BA', 'P2BA8', '정치인 데이터 시딩', 'tasks/P2BA8.md', 'fullstack-developer', 'Next.js API Routes/Zod', 'AI-Only', '없음', 0, '대기', '`scripts/seed-politicians.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '정치인 50명 데이터 삽입'),
(2, 'BA', 'P2BA9', '정치인 이미지 업로드 헬퍼', 'tasks/P2BA9.md', 'fullstack-developer', 'Next.js API Routes/Zod', 'AI-Only', '없음', 0, '대기', '`lib/storage/politicians.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'Supabase Storage 업로드'),
(2, 'BA', 'P2BA10', '정치인 데이터 유틸', 'tasks/P2BA10.md', 'fullstack-developer', 'Next.js API Routes/Zod', 'AI-Only', '없음', 0, '대기', '`lib/utils/politicians.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '데이터 정규화 / 검색 필터링 헬퍼'),
(2, 'BA', 'P2BA11', '정치인 데이터 보안', 'tasks/P2BA11.md', 'fullstack-developer', 'Next.js API Routes/Zod', 'AI-Only', '없음', 0, '대기', '`lib/security/politicians.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '크롤링 Rate Limiting / 이미지 업로드 검증'),
(2, 'D', 'P2D1', '정치인 스키마', 'tasks/P2D1.md', 'database-specialist', 'Supabase/PostgreSQL', 'AI-Only', '없음', 0, '대기', '`supabase/migrations/003_politicians_schema.sql`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'politicians 테이블 / politician_details 테이블 / political_parties 테이블 / constituencies 테이블 / positions 테이블 / promises 테이블 / voting_records 테이블 / activity_logs 테이블 / 인덱스 생성 / Full-text search 인덱스 / RLS 정책'),
(2, 'D', 'P2D2', '관심 정치인 스키마', 'tasks/P2D2.md', 'database-specialist', 'Supabase/PostgreSQL', 'AI-Only', '없음', 0, '대기', '`supabase/migrations/004_favorites_schema.sql`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'favorite_politicians 테이블 / 복합 인덱스 / RLS 정책'),
(2, 'D', 'P2D3', 'AI 평가 스키마', 'tasks/P2D3.md', 'database-specialist', 'Supabase/PostgreSQL', 'AI-Only', '없음', 0, '대기', '`supabase/migrations/005_evaluations_schema.sql`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'ai_evaluations 테이블 (평가 엔진 연동용) / evaluation_cache 테이블 / 인덱스 / RLS 정책'),
(2, 'D', 'P2D4', '정치인 시드 데이터', 'tasks/P2D4.md', 'database-specialist', 'Supabase/PostgreSQL', 'AI-Only', '없음', 0, '대기', '`supabase/seed_politicians.sql`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '정당 데이터 (10개) / 지역 데이터 (17개) / 직책 데이터 (6개)'),
(2, 'D', 'P2D5', 'Supabase Storage 버킷', 'tasks/P2D5.md', 'database-specialist', 'Supabase/PostgreSQL', 'AI-Only', '없음', 0, '대기', 'Supabase 콘솔 설정', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'politicians-images 버킷 생성 / RLS 정책'),
(2, 'D', 'P2D6', '정치인 트리거', 'tasks/P2D6.md', 'database-specialist', 'Supabase/PostgreSQL', 'AI-Only', '없음', 0, '대기', '`supabase/migrations/006_politicians_triggers.sql` (← 34-35)', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '통계 자동 업데이트'),
(2, 'D', 'P2D7', '타입 업데이트', 'tasks/P2D7.md', 'database-specialist', 'Supabase/PostgreSQL', 'AI-Only', '없음', 0, '대기', '`lib/database.types.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '타입 재생성'),
(2, 'T', 'P2T1', '정치인 E2E 테스트', 'tasks/P2T1.md', 'qa-specialist', 'Playwright/Vitest', 'AI-Only', '없음', 0, '대기', '`e2e/politicians.spec.ts` (← 21-26)', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '목록 검색 / 상세 페이지 / 관심 등록'),
(2, 'T', 'P2T2', '정치인 API 테스트', 'tasks/P2T2.md', 'qa-specialist', 'Playwright/Vitest', 'AI-Only', '없음', 0, '대기', '`tests/api/politicians.test.ts` (← 24-26)', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '목록 API / 필터링 / 검색'),
(2, 'O', 'P2O1', '크롤링 스케줄러', 'tasks/P2O1.md', 'devops-troubleshooter', 'Next.js/Vercel/GitHub Actions', 'AI-Only', '없음', 0, '대기', '`.github/workflows/crawl-politicians.yml`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '주기적 데이터 수집'),
(3, 'D', 'P3D1', '게시글 스키마', 'tasks/P3D1.md', 'database-specialist', 'Supabase/PostgreSQL', 'AI-Only', '없음', 0, '대기', '`supabase/migrations/007_posts_schema.sql`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'posts 테이블 / board_types 테이블 (2개: 정치인/회원) / post_politician_tags 테이블 / post_attachments 테이블 / post_views 테이블 / 인덱스 / Full-text search / RLS 정책'),
(3, 'D', 'P3D2', '댓글 스키마', 'tasks/P3D2.md', 'database-specialist', 'Supabase/PostgreSQL', 'AI-Only', '없음', 0, '대기', '`supabase/migrations/008_comments_schema.sql`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'comments 테이블 (author_type: 회원/정치인) / 인덱스 / RLS 정책'),
(3, 'D', 'P3D3', '공감/공유 스키마', 'tasks/P3D3.md', 'database-specialist', 'Supabase/PostgreSQL', 'AI-Only', '없음', 0, '대기', '`supabase/migrations/009_votes_shares_schema.sql`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'votes 테이블 / shares 테이블 / 복합 인덱스 / RLS 정책'),
(3, 'D', 'P3D4', '팔로우 스키마', 'tasks/P3D4.md', 'database-specialist', 'Supabase/PostgreSQL', 'AI-Only', '없음', 0, '대기', '`supabase/migrations/010_follows_schema.sql`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'follows 테이블 / 복합 인덱스 / RLS 정책'),
(3, 'D', 'P3D5', '알림 스키마', 'tasks/P3D5.md', 'database-specialist', 'Supabase/PostgreSQL', 'AI-Only', '없음', 0, '대기', '`supabase/migrations/011_notifications_schema.sql`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'notifications 테이블 (7가지 type) / 인덱스 / RLS 정책'),
(3, 'D', 'P3D6', '커뮤니티 트리거', 'tasks/P3D6.md', 'database-specialist', 'Supabase/PostgreSQL', 'AI-Only', '없음', 0, '대기', '`supabase/migrations/012_community_triggers.sql` (← 63-67)', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '댓글 수 자동 업데이트 / 공감 수 자동 업데이트 / 알림 자동 생성'),
(3, 'D', 'P3D7', 'Supabase Storage 버킷', 'tasks/P3D7.md', 'database-specialist', 'Supabase/PostgreSQL', 'AI-Only', '없음', 0, '대기', 'Supabase 콘솔', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'post-attachments 버킷 / RLS 정책'),
(3, 'D', 'P3D8', '타입 업데이트', 'tasks/P3D8.md', 'database-specialist', 'Supabase/PostgreSQL', 'AI-Only', '없음', 0, '대기', '`lib/database.types.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', ''),
(3, 'BA', 'P3BA1', '게시글 생성 API', 'tasks/P3BA1.md', 'fullstack-developer', 'Next.js API Routes/Zod', 'AI-Only', '없음', 0, '대기', '`app/api/posts/route.ts` (← Database)', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'POST 게시글 (회원/정치인 구분) / 정치인 태그 저장 / 첨부파일 업로드'),
(3, 'BA', 'P3BA2', '게시글 목록 API', 'tasks/P3BA2.md', 'fullstack-developer', 'Next.js API Routes/Zod', 'AI-Only', '없음', 0, '대기', '`app/api/posts/route.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'GET 목록 / 카테고리 필터 / 검색 / 정렬'),
(3, 'BA', 'P3BA3', '게시글 상세 API', 'tasks/P3BA3.md', 'fullstack-developer', 'Next.js API Routes/Zod', 'AI-Only', 'P3BA1', 0, '대기', '`app/api/posts/[id]/route.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'GET 상세 / PATCH 수정 / DELETE 삭제 / 조회수 증가'),
(3, 'BA', 'P3BA4', '댓글 API', 'tasks/P3BA4.md', 'fullstack-developer', 'Next.js API Routes/Zod', 'AI-Only', '없음', 0, '대기', '`app/api/comments/route.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'POST 생성 (회원/정치인 모드) / GET 목록 / 필터링 (전체/정치인/회원)'),
(3, 'BA', 'P3BA5', '댓글 수정/삭제 API', 'tasks/P3BA5.md', 'fullstack-developer', 'Next.js API Routes/Zod', 'AI-Only', 'P3BA4', 0, '대기', '`app/api/comments/[id]/route.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'PATCH 수정 / DELETE 삭제'),
(3, 'BA', 'P3BA6', '공감/비공감 API', 'tasks/P3BA6.md', 'fullstack-developer', 'Next.js API Routes/Zod', 'AI-Only', '없음', 0, '대기', '`app/api/votes/route.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'POST 공감/비공감 / DELETE 취소'),
(3, 'BA', 'P3BA7', '공유 API', 'tasks/P3BA7.md', 'fullstack-developer', 'Next.js API Routes/Zod', 'AI-Only', '없음', 0, '대기', '`app/api/shares/route.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'POST 공유 기록 / 공유 수 집계'),
(3, 'BA', 'P3BA8', '팔로우 API', 'tasks/P3BA8.md', 'fullstack-developer', 'Next.js API Routes/Zod', 'AI-Only', '없음', 0, '대기', '`app/api/follows/route.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'POST 팔로우 / DELETE 언팔로우 / GET 팔로워/팔로잉 목록 / 포인트 +20p'),
(3, 'BA', 'P3BA9', '알림 API', 'tasks/P3BA9.md', 'fullstack-developer', 'Next.js API Routes/Zod', 'AI-Only', '없음', 0, '대기', '`app/api/notifications/route.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'GET 목록 (7가지 유형 필터) / PATCH 읽음 처리 / DELETE 삭제'),
(3, 'BA', 'P3BA10', '알림 생성 헬퍼', 'tasks/P3BA10.md', 'fullstack-developer', 'Next.js API Routes/Zod', 'AI-Only', '없음', 0, '대기', '`lib/notifications/create.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '댓글 알림 / 공감 알림 / 공유 알림 / 팔로우 알림 / 정치인 업데이트 알림'),
(3, 'BA', 'P3BA11', '욕설 필터', 'tasks/P3BA11.md', 'fullstack-developer', 'Next.js API Routes/Zod', 'AI-Only', '없음', 0, '대기', '`lib/utils/profanity-filter.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '욕설/비방 필터링'),
(3, 'BA', 'P3BA12', '파일 업로드 헬퍼', 'tasks/P3BA12.md', 'fullstack-developer', 'Next.js API Routes/Zod', 'AI-Only', '없음', 0, '대기', '`lib/storage/uploads.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'Supabase Storage 업로드 (이미지/PDF/DOC) / 10MB 제한'),
(3, 'BA', 'P3BA13', '커뮤니티 보안', 'tasks/P3BA13.md', 'fullstack-developer', 'Next.js API Routes/Zod', 'AI-Only', '없음', 0, '대기', '`lib/security/community.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'XSS 방어 (DOMPurify) / 스팸 방지 (연속 작성 제한) / 파일 업로드 검증'),
(3, 'F', 'P3F1', '커뮤니티 메인 페이지', 'tasks/P3F1.md', 'fullstack-developer', 'React/TypeScript/Tailwind CSS', 'AI-Only', '없음', 0, '대기', '`app/community/page.tsx` (← 1단계(Phase 1))', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '2개 게시판 탭 (정치인/회원) / 검색 / 정렬 (최신순, 공감순, 조회순) / 게시글 리스트 / 카테고리 선택 모달'),
(3, 'F', 'P3F2', '회원 게시글 상세', 'tasks/P3F2.md', 'fullstack-developer', 'React/TypeScript/Tailwind CSS', 'AI-Only', 'P3F1', 0, '대기', '`app/posts/member/[id]/page.tsx`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '게시글 내용 / 공감/비공감 / 공유 (링크복사, Facebook, X, 네이버, 모바일 네이티브) / 댓글 목록 / 댓글 작성 / 팔로우 버튼'),
(3, 'F', 'P3F3', '정치인 게시글 상세', 'tasks/P3F3.md', 'fullstack-developer', 'React/TypeScript/Tailwind CSS', 'AI-Only', 'P3F1', 0, '대기', '`app/posts/politician/[id]/page.tsx`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '게시글 내용 / 댓글 2가지 모드 (정치인/회원) / 정치인 댓글 본인 인증 / 댓글 필터 (전체/정치인/회원)'),
(3, 'F', 'P3F4', '회원 글쓰기 페이지', 'tasks/P3F4.md', 'fullstack-developer', 'React/TypeScript/Tailwind CSS', 'AI-Only', 'P3F1', 0, '대기', '`app/posts/write/member/page.tsx`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '정치인 태그 (검색, 자동완성 최대 20개) / 제목 (최대 100자) / 에디터 (Tiptap or Quill) / 태그 (최대 5개) / 첨부파일 (이미지/PDF/DOC, 최대 10MB, 드래그앤드롭) / 임시저장 (localStorage)'),
(3, 'F', 'P3F5', '정치인 글쓰기 페이지', 'tasks/P3F5.md', 'fullstack-developer', 'React/TypeScript/Tailwind CSS', 'AI-Only', 'P3F1', 0, '대기', '`app/posts/write/politician/page.tsx`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '정치인 게시판용'),
(3, 'F', 'P3F6', '알림 페이지', 'tasks/P3F6.md', 'fullstack-developer', 'React/TypeScript/Tailwind CSS', 'AI-Only', '없음', 0, '대기', '`app/notifications/page.tsx` (← 1단계(Phase 1))', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '7가지 알림 유형 / 필터 탭 / 읽음 처리 / 모두 읽음 / 삭제'),
(3, 'T', 'P3T1', '커뮤니티 E2E 테스트', 'tasks/P3T1.md', 'qa-specialist', 'Playwright/Vitest', 'AI-Only', '없음', 0, '대기', '`e2e/community.spec.ts` (← 45-50)', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '게시글 작성 / 댓글 작성 / 공감 / 팔로우'),
(3, 'T', 'P3T2', '게시글 API 테스트', 'tasks/P3T2.md', 'qa-specialist', 'Playwright/Vitest', 'AI-Only', '없음', 0, '대기', '`tests/api/posts.test.ts` (← 51-53)', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', ''),
(3, 'T', 'P3T3', '댓글 API 테스트', 'tasks/P3T3.md', 'qa-specialist', 'Playwright/Vitest', 'AI-Only', '없음', 0, '대기', '`tests/api/comments.test.ts` (← 54-55)', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', ''),
(3, 'T', 'P3T4', '알림 테스트', 'tasks/P3T4.md', 'qa-specialist', 'Playwright/Vitest', 'AI-Only', '없음', 0, '대기', '`tests/api/notifications.test.ts` (← 59-60)', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', ''),
(3, 'O', 'P3O1', '인기 게시글 집계 스케줄러', 'tasks/P3O1.md', 'devops-troubleshooter', 'Next.js/Vercel/GitHub Actions', 'AI-Only', '없음', 0, '대기', '`.github/workflows/aggregate-posts.yml`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '매 1시간 집계'),
(4, 'D', 'P4D1', '포인트 스키마', 'tasks/P4D1.md', 'database-specialist', 'Supabase/PostgreSQL', 'AI-Only', '없음', 0, '대기', '`supabase/migrations/013_points_schema.sql`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'point_history 테이블 / 인덱스 / RLS 정책'),
(4, 'D', 'P4D2', '등급 스키마', 'tasks/P4D2.md', 'database-specialist', 'Supabase/PostgreSQL', 'AI-Only', '없음', 0, '대기', '`supabase/migrations/014_grades_schema.sql`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'user_levels 테이블 (ML1-ML6 기준) / influence_grades 테이블 (무궁화~브론즈 기준)'),
(4, 'D', 'P4D3', '포인트 트리거', 'tasks/P4D3.md', 'database-specialist', 'Supabase/PostgreSQL', 'AI-Only', 'P4D1', 0, '대기', '`supabase/migrations/015_points_triggers.sql`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '활동별 포인트 자동 적립 / 등급 자동 업데이트'),
(4, 'BA', 'P4BA1', '포인트 API', 'tasks/P4BA1.md', 'fullstack-developer', 'Next.js API Routes/Zod', 'AI-Only', '없음', 0, '대기', '`app/api/points/route.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'GET 포인트 조회 / GET 활동 내역'),
(4, 'BA', 'P4BA2', '포인트 적립 헬퍼', 'tasks/P4BA2.md', 'fullstack-developer', 'Next.js API Routes/Zod', 'AI-Only', '없음', 0, '대기', '`lib/points/earn.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '게시글 작성 +50p / 댓글 작성 +10p / 공감 받음 +5p / 팔로우 +20p / 로그인 +1p'),
(4, 'BA', 'P4BA3', '등급 계산 API', 'tasks/P4BA3.md', 'fullstack-developer', 'Next.js API Routes/Zod', 'AI-Only', '없음', 0, '대기', '`app/api/grades/calculate/route.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '활동 등급 계산 (ML1-ML6, 포인트 기반) / 영향력 등급 계산 (무궁화~브론즈, 팔로워+공감+공유)'),
(4, 'BA', 'P4BA4', '프로필 API', 'tasks/P4BA4.md', 'fullstack-developer', 'Next.js API Routes/Zod', 'AI-Only', '없음', 0, '대기', '`app/api/profile/route.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'GET 프로필 / PATCH 프로필 수정 / DELETE 회원 탈퇴'),
(4, 'BA', 'P4BA5', '타인 프로필 API', 'tasks/P4BA5.md', 'fullstack-developer', 'Next.js API Routes/Zod', 'AI-Only', '없음', 0, '대기', '`app/api/users/[id]/route.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'GET 타인 프로필 조회'),
(4, 'F', 'P4F1', '마이페이지', 'tasks/P4F1.md', 'fullstack-developer', 'React/TypeScript/Tailwind CSS', 'AI-Only', '없음', 0, '대기', '`app/mypage/page.tsx` (← 1단계(Phase 1))', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '프로필 정보 / 활동 등급 (ML1-ML6) / 통계 (게시글, 댓글, 포인트, 팔로워, 팔로잉) / 3개 탭 (내 게시글, 내 댓글, 활동 내역)'),
(4, 'F', 'P4F2', '프로필 수정', 'tasks/P4F2.md', 'fullstack-developer', 'React/TypeScript/Tailwind CSS', 'AI-Only', 'P4F1', 0, '대기', '`app/profile/edit/page.tsx`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '프로필 이미지 / 닉네임 / 소개 / 관심 지역 / 생년월일'),
(4, 'F', 'P4F3', '설정 페이지', 'tasks/P4F3.md', 'fullstack-developer', 'React/TypeScript/Tailwind CSS', 'AI-Only', 'P4F1', 0, '대기', '`app/settings/page.tsx`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '알림 설정 (4가지 토글) / 비밀번호 변경 / 회원 탈퇴'),
(4, 'T', 'P4T1', '포인트/등급 E2E', 'tasks/P4T1.md', 'qa-specialist', 'Playwright/Vitest', 'AI-Only', '없음', 0, '대기', '`e2e/points-grades.spec.ts` (← 77-79)', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', ''),
(4, 'T', 'P4T2', '포인트 API 테스트', 'tasks/P4T2.md', 'qa-specialist', 'Playwright/Vitest', 'AI-Only', '없음', 0, '대기', '`tests/api/points.test.ts` (← 80-82)', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', ''),
(4, 'O', 'P4O1', '등급 재계산 스케줄러', 'tasks/P4O1.md', 'devops-troubleshooter', 'Next.js/Vercel/GitHub Actions', 'AI-Only', '없음', 0, '대기', '`.github/workflows/recalculate-grades.yml`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '매일 등급 재계산'),
(5, 'D', 'P5D1', '결제 스키마', 'tasks/P5D1.md', 'database-specialist', 'Supabase/PostgreSQL', 'AI-Only', '없음', 0, '대기', '`supabase/migrations/016_payments_schema.sql`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'payments 테이블 / orders 테이블 / politician_verifications 테이블 / 인덱스 / RLS 정책'),
(5, 'D', 'P5D2', 'PDF 리포트 스키마', 'tasks/P5D2.md', 'database-specialist', 'Supabase/PostgreSQL', 'AI-Only', '없음', 0, '대기', '`supabase/migrations/017_reports_schema.sql`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'evaluation_reports 테이블'),
(5, 'BA', 'P5BA1', '결제 생성 API', 'tasks/P5BA1.md', 'fullstack-developer', 'Next.js API Routes/Zod', 'AI-Only', 'P2BA4, Task91', 0, '대기', '`app/api/payments/route.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'POST 결제 생성 (정치인 본인 인증 필수) / 계좌이체 정보 생성'),
(5, 'BA', 'P5BA2', '결제 확인 API', 'tasks/P5BA2.md', 'fullstack-developer', 'Next.js API Routes/Zod', 'AI-Only', 'P5BA1', 0, '대기', '`app/api/payments/[id]/confirm/route.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'POST 입금 완료 확인 (관리자 수동)'),
(5, 'BA', 'P5BA3', '주문 조회 API', 'tasks/P5BA3.md', 'fullstack-developer', 'Next.js API Routes/Zod', 'AI-Only', '없음', 0, '대기', '`app/api/orders/route.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'GET 주문 목록 / GET 주문 상세'),
(5, 'BA', 'P5BA4', 'PDF 리포트 생성 API', 'tasks/P5BA4.md', 'fullstack-developer', 'Next.js API Routes/Zod', 'AI-Only', '없음', 0, '대기', '`app/api/reports/generate/route.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'POST PDF 생성 (Puppeteer)'),
(5, 'BA', 'P5BA5', 'PDF 다운로드 API', 'tasks/P5BA5.md', 'fullstack-developer', 'Next.js API Routes/Zod', 'AI-Only', '없음', 0, '대기', '`app/api/reports/[id]/download/route.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'GET PDF 다운로드 (결제 완료자만)'),
(5, 'BA', 'P5BA6', '결제 보안', 'tasks/P5BA6.md', 'fullstack-developer', 'Next.js API Routes/Zod', 'AI-Only', '없음', 0, '대기', '`lib/security/payments.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '결제 정보 암호화 / 본인 인증 검증 / PDF 다운로드 권한'),
(5, 'F', 'P5F1', '결제 페이지', 'tasks/P5F1.md', 'fullstack-developer', 'React/TypeScript/Tailwind CSS', 'AI-Only', 'P2F2', 0, '대기', '`app/payment/page.tsx`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '주문자 정보 / 정치인 본인 인증 / 상품 정보 (AI 보고서) / 계좌이체 정보 / 2개 약관 (이용약관, 개인정보)'),
(5, 'F', 'P5F2', '계좌이체 안내 페이지', 'tasks/P5F2.md', 'fullstack-developer', 'React/TypeScript/Tailwind CSS', 'AI-Only', 'P5F1', 0, '대기', '`app/payment/account-transfer/page.tsx`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '계좌번호 표시 / 입금자명 / 입금 완료 확인'),
(5, 'T', 'P5T1', '결제 E2E', 'tasks/P5T1.md', 'qa-specialist', 'Playwright/Vitest', 'AI-Only', '없음', 0, '대기', '`e2e/payment.spec.ts` (← 91-92)', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', ''),
(5, 'T', 'P5T2', '결제 API 테스트', 'tasks/P5T2.md', 'qa-specialist', 'Playwright/Vitest', 'AI-Only', '없음', 0, '대기', '`tests/api/payments.test.ts` (← 93-97)', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', ''),
(6, 'D', 'P6D1', '관리자 스키마', 'tasks/P6D1.md', 'database-specialist', 'Supabase/PostgreSQL', 'AI-Only', '없음', 0, '대기', '`supabase/migrations/018_admin_schema.sql`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'admin_users 테이블 / admin_activity_logs 테이블 / reports 테이블 / RLS 정책'),
(6, 'D', 'P6D2', '검색 최적화', 'tasks/P6D2.md', 'database-specialist', 'Supabase/PostgreSQL', 'AI-Only', '없음', 0, '대기', '`supabase/migrations/019_search_optimization.sql`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'Full-text search 인덱스 최적화 / 통합 검색 뷰'),
(6, 'D', 'P6D3', '타입 최종 업데이트', 'tasks/P6D3.md', 'database-specialist', 'Supabase/PostgreSQL', 'AI-Only', '없음', 0, '대기', '`lib/database.types.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', ''),
(6, 'BA', 'P6BA1', '관리자 대시보드 API', 'tasks/P6BA1.md', 'fullstack-developer', 'Next.js API Routes/Zod', 'AI-Only', '없음', 0, '대기', '`app/api/admin/dashboard/route.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'GET 통계'),
(6, 'BA', 'P6BA2', '회원 관리 API', 'tasks/P6BA2.md', 'fullstack-developer', 'Next.js API Routes/Zod', 'AI-Only', '없음', 0, '대기', '`app/api/admin/users/route.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'GET 목록 / PATCH 수정 / POST 차단'),
(6, 'BA', 'P6BA3', '정치인 관리 API', 'tasks/P6BA3.md', 'fullstack-developer', 'Next.js API Routes/Zod', 'AI-Only', '없음', 0, '대기', '`app/api/admin/politicians/route.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'POST 추가 / PATCH 수정 / DELETE 삭제'),
(6, 'BA', 'P6BA4', '신고 관리 API', 'tasks/P6BA4.md', 'fullstack-developer', 'Next.js API Routes/Zod', 'AI-Only', '없음', 0, '대기', '`app/api/admin/reports/route.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'GET 목록 / PATCH 처리'),
(6, 'BA', 'P6BA5', '활동 로그 API', 'tasks/P6BA5.md', 'fullstack-developer', 'Next.js API Routes/Zod', 'AI-Only', '없음', 0, '대기', '`app/api/admin/logs/route.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'GET 로그 조회'),
(6, 'BA', 'P6BA6', '통합 검색 API', 'tasks/P6BA6.md', 'fullstack-developer', 'Next.js API Routes/Zod', 'AI-Only', '없음', 0, '대기', '`app/api/search/route.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'GET 검색 (정치인, 게시글, 사용자)'),
(6, 'BA', 'P6BA7', '이용약관 페이지', 'tasks/P6BA7.md', 'fullstack-developer', 'Next.js API Routes/Zod', 'AI-Only', '없음', 0, '대기', '`app/terms/page.tsx`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', ''),
(6, 'BA', 'P6BA8', '개인정보처리방침 페이지', 'tasks/P6BA8.md', 'fullstack-developer', 'Next.js API Routes/Zod', 'AI-Only', '없음', 0, '대기', '`app/privacy/page.tsx`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', ''),
(6, 'BA', 'P6BA9', '관리자 미들웨어', 'tasks/P6BA9.md', 'fullstack-developer', 'Next.js API Routes/Zod', 'AI-Only', '없음', 0, '대기', '`lib/middleware/admin.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '관리자 권한 검증'),
(6, 'BA', 'P6BA10', '관리자 보안', 'tasks/P6BA10.md', 'fullstack-developer', 'Next.js API Routes/Zod', 'AI-Only', '없음', 0, '대기', '`lib/security/admin.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '관리자 권한 검증 / 로그 기록'),
(6, 'F', 'P6F1', '관리자 대시보드', 'tasks/P6F1.md', 'fullstack-developer', 'React/TypeScript/Tailwind CSS', 'AI-Only', '없음', 0, '대기', '`app/admin/page.tsx` (← Phase 1, 관리자 권한)', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '통계 카드 (회원, 정치인, 게시글, 신고) / 최근 활동 로그 / 주요 공지사항'),
(6, 'F', 'P6F2', '회원 관리', 'tasks/P6F2.md', 'fullstack-developer', 'React/TypeScript/Tailwind CSS', 'AI-Only', 'P6F1', 0, '대기', '`app/admin/users/page.tsx`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '검색 / 등급 필터 / 상태 필터 / 수정/차단'),
(6, 'F', 'P6F3', '정치인 관리', 'tasks/P6F3.md', 'fullstack-developer', 'React/TypeScript/Tailwind CSS', 'AI-Only', 'P6F1', 0, '대기', '`app/admin/politicians/page.tsx`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '추가 / 수정 / 인증계정 관리'),
(6, 'F', 'P6F4', '신고 관리', 'tasks/P6F4.md', 'fullstack-developer', 'React/TypeScript/Tailwind CSS', 'AI-Only', 'P6F1', 0, '대기', '`app/admin/reports/page.tsx`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '신고 목록 / 처리/반려'),
(6, 'F', 'P6F5', '검색 결과 페이지', 'tasks/P6F5.md', 'fullstack-developer', 'React/TypeScript/Tailwind CSS', 'AI-Only', '없음', 0, '대기', '`app/search/page.tsx`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '통합 검색 (정치인, 게시글, 사용자)'),
(6, 'F', 'P6F6', '서비스 소개', 'tasks/P6F6.md', 'fullstack-developer', 'React/TypeScript/Tailwind CSS', 'AI-Only', '없음', 0, '대기', '`app/services/page.tsx`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', ''),
(6, 'F', 'P6F7', '고객센터', 'tasks/P6F7.md', 'fullstack-developer', 'React/TypeScript/Tailwind CSS', 'AI-Only', '없음', 0, '대기', '`app/support/page.tsx`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', ''),
(6, 'T', 'P6T1', '관리자 E2E', 'tasks/P6T1.md', 'qa-specialist', 'Playwright/Vitest', 'AI-Only', '없음', 0, '대기', '`e2e/admin.spec.ts` (← 103-106)', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', ''),
(6, 'T', 'P6T2', '검색 E2E', 'tasks/P6T2.md', 'qa-specialist', 'Playwright/Vitest', 'AI-Only', 'P6F5, P6BA6', 0, '대기', '`e2e/search.spec.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', ''),
(6, 'T', 'P6T3', '관리자 API 테스트', 'tasks/P6T3.md', 'qa-specialist', 'Playwright/Vitest', 'AI-Only', '없음', 0, '대기', '`tests/api/admin.test.ts` (← 110-114)', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', ''),
(6, 'O', 'P6O1', '로그 수집 설정', 'tasks/P6O1.md', 'devops-troubleshooter', 'Next.js/Vercel/GitHub Actions', 'AI-Only', '없음', 0, '대기', 'Sentry, Vercel Logs 설정', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', ''),
(7, 'BA', 'P7BA1', '헬스 체크 API', 'tasks/P7BA1.md', 'fullstack-developer', 'Next.js API Routes/Zod', 'AI-Only', '없음', 0, '대기', '`app/api/health/route.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', ''),
(7, 'BA', 'P7BA2', '캐싱 설정', 'tasks/P7BA2.md', 'fullstack-developer', 'Next.js API Routes/Zod', 'AI-Only', '없음', 0, '대기', '`lib/cache/redis.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'Redis (Upstash)'),
(7, 'BA', 'P7BA3', 'API 문서', 'tasks/P7BA3.md', 'fullstack-developer', 'Next.js API Routes/Zod', 'AI-Only', '없음', 0, '대기', '`public/api-docs.json`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'OpenAPI 스펙'),
(7, 'BA', 'P7BA4', '에러 핸들러', 'tasks/P7BA4.md', 'fullstack-developer', 'Next.js API Routes/Zod', 'AI-Only', '없음', 0, '대기', '`lib/errors/handler.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '전역 에러 핸들링'),
(7, 'F', 'P7F1', 'PWA 설정', 'tasks/P7F1.md', 'fullstack-developer', 'React/TypeScript/Tailwind CSS', 'AI-Only', '없음', 0, '대기', '`public/manifest.json`, `public/sw.js`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'Service Worker / 오프라인 지원'),
(7, 'F', 'P7F2', 'SEO 설정', 'tasks/P7F2.md', 'fullstack-developer', 'React/TypeScript/Tailwind CSS', 'AI-Only', '없음', 0, '대기', '`app/robots.txt`, `app/sitemap.xml`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', ''),
(7, 'F', 'P7F3', 'OG 태그 설정', 'tasks/P7F3.md', 'fullstack-developer', 'React/TypeScript/Tailwind CSS', 'AI-Only', '없음', 0, '대기', '`app/layout.tsx` 메타데이터', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', ''),
(7, 'F', 'P7F4', '404 페이지', 'tasks/P7F4.md', 'fullstack-developer', 'React/TypeScript/Tailwind CSS', 'AI-Only', '없음', 0, '대기', '`app/not-found.tsx`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', ''),
(7, 'F', 'P7F5', '500 페이지', 'tasks/P7F5.md', 'fullstack-developer', 'React/TypeScript/Tailwind CSS', 'AI-Only', '없음', 0, '대기', '`app/error.tsx`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', ''),
(7, 'D', 'P7D1', '데이터베이스 최적화', 'tasks/P7D1.md', 'database-specialist', 'Supabase/PostgreSQL', 'AI-Only', '없음', 0, '대기', '`supabase/migrations/020_optimization.sql`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '인덱스 최종 점검 / 쿼리 최적화'),
(7, 'D', 'P7D2', '백업 설정', 'tasks/P7D2.md', 'database-specialist', 'Supabase/PostgreSQL', 'AI-Only', '없음', 0, '대기', 'Supabase 백업 정책', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', ''),
(7, 'T', 'P7T1', '전체 E2E 테스트', 'tasks/P7T1.md', 'qa-specialist', 'Playwright/Vitest', 'AI-Only', '없음', 0, '대기', '`e2e/full-flow.spec.ts` (← 모든 Phase)', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '회원가입 → 게시글 → 정치인 → 평가'),
(7, 'T', 'P7T2', '부하 테스트', 'tasks/P7T2.md', 'qa-specialist', 'Playwright/Vitest', 'AI-Only', '없음', 0, '대기', '`tests/load/k6.js`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '동시 사용자 100명'),
(7, 'T', 'P7T3', '보안 테스트', 'tasks/P7T3.md', 'qa-specialist', 'Playwright/Vitest', 'AI-Only', '없음', 0, '대기', 'OWASP ZAP 스캔', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', ''),
(7, 'O', 'P7O1', '보안 최종 점검', 'tasks/P7O1.md', 'devops-troubleshooter', 'Next.js/Vercel/GitHub Actions', 'AI-Only', '없음', 0, '대기', '`lib/security/final-check.ts`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '보안 헤더 / HTTPS 강제'),
(7, 'O', 'P7O2', '의존성 스캔', 'tasks/P7O2.md', 'devops-troubleshooter', 'Next.js/Vercel/GitHub Actions', 'AI-Only', '없음', 0, '대기', '`npm audit`, Snyk', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', ''),
(7, 'O', 'P7O3', 'Vercel 배포 설정', 'tasks/P7O3.md', 'devops-troubleshooter', 'Next.js/Vercel/GitHub Actions', 'AI-Only', '없음', 0, '대기', '`vercel.json`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '환경변수 / 리다이렉트 / 헤더'),
(7, 'O', 'P7O4', 'CI/CD 파이프라인', 'tasks/P7O4.md', 'devops-troubleshooter', 'Next.js/Vercel/GitHub Actions', 'AI-Only', '없음', 0, '대기', '`.github/workflows/deploy.yml`', '-', '-', '-', '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', '테스트 → 빌드 → 배포');
-- ============================================
-- ✅ 완료! 아래 SQL로 확인하세요
-- SELECT COUNT(*) FROM project_grid_tasks;
-- 결과: 144개
-- ============================================
