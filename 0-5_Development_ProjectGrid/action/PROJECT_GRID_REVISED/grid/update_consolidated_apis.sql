-- PROJECT GRID REVISED - 통합 API 작업지시서 업데이트
-- 작성일: 2025-11-07
-- 작성자: Claude Code
-- 설명: P1BA1~4, P3BA1~4를 통합 API 버전으로 업데이트

-- =============================================================================
-- Phase 1: Mock APIs (통합 버전)
-- =============================================================================

-- P1BA1: Mock API - 인증 (6개 API 통합)
UPDATE project_grid_tasks_revised
SET
    task_name = 'Mock API - 인증 (6개 API 통합)',
    instruction_file = 'tasks/P1BA1.md',
    assigned_agent = '1차: api-designer | 2차: Claude Code(실행 및 검증)',
    tools = 'Read, Edit, Write, Grep, Glob, Bash / TypeScript, Next.js API Routes, Zod / api-builder, api-test',
    work_mode = 'AI-Only',
    dependency_chain = 'P1D1, P1D2',
    progress = 0,
    status = '작업지시서 작성 완료',
    generated_files = '작업지시서: tasks/P1BA1.md (799줄)

대상 API 6개:
1. 회원가입 (POST /api/auth/signup)
2. Google OAuth (POST /api/auth/google)
3. 로그인 (POST /api/auth/signin)
4. 비밀번호 재설정 (POST /api/auth/reset-password)
5. 토큰 리프레시 (POST /api/auth/refresh)
6. 로그아웃 (POST /api/auth/logout)

생성 예정 파일:
- 1_Frontend/src/app/api/auth/signup/route.ts
- 1_Frontend/src/app/api/auth/google/route.ts
- 1_Frontend/src/app/api/auth/signin/route.ts
- 1_Frontend/src/app/api/auth/reset-password/route.ts
- 1_Frontend/src/app/api/auth/refresh/route.ts
- 1_Frontend/src/app/api/auth/logout/route.ts
- 1_Frontend/src/lib/validators/auth.ts (Zod 스키마)
- 1_Frontend/src/lib/auth/jwt.ts (JWT 유틸리티)
- 1_Frontend/src/lib/mock/auth-data.json (Mock 데이터)',
    generator = 'Claude Code',
    duration = '1차: 작업지시서 작성(799줄)',
    modification_history = '2025-11-07: 작업지시서 작성 완료 (통합 버전)',
    test_history = '⏳ 대기 (작업지시서 작성 단계)',
    build_result = '⏳ 대기',
    dependency_propagation = '⏳ 대기',
    blocker = '없음',
    validation_result = '⏳ 대기',
    remarks = '6개 인증 API를 1개 작업지시서로 통합 / Zod 스키마 검증 / JWT 토큰 / Mock 데이터',
    updated_at = NOW()
WHERE task_id = 'P1BA1';

-- P1BA3: Mock API - 커뮤니티 (7개 API 통합)
UPDATE project_grid_tasks_revised
SET
    task_name = 'Mock API - 커뮤니티 (7개 API 통합)',
    instruction_file = 'tasks/P1BA3.md',
    assigned_agent = '1차: api-designer | 2차: Claude Code(실행 및 검증)',
    tools = 'Read, Edit, Write, Grep, Glob, Bash / TypeScript, Next.js API Routes, Zod / api-builder, api-test',
    work_mode = 'AI-Only',
    dependency_chain = 'P1D1, P1D2',
    progress = 0,
    status = '작업지시서 작성 완료',
    generated_files = '작업지시서: tasks/P1BA3.md (902줄)

대상 API 7개:
1. 게시글 목록 조회 (GET /api/community/posts)
2. 게시글 작성 (POST /api/community/posts)
3. 게시글 상세 조회 (GET /api/community/posts/[id])
4. 게시글 수정 (PUT /api/community/posts/[id])
5. 게시글 삭제 (DELETE /api/community/posts/[id])
6. 댓글 작성 (POST /api/community/posts/[id]/comments)
7. 게시글 좋아요 (POST /api/community/posts/[id]/like)

생성 예정 파일:
- 1_Frontend/src/app/api/community/posts/route.ts (목록, 작성)
- 1_Frontend/src/app/api/community/posts/[id]/route.ts (상세, 수정, 삭제)
- 1_Frontend/src/app/api/community/posts/[id]/comments/route.ts
- 1_Frontend/src/app/api/community/posts/[id]/like/route.ts
- 1_Frontend/src/lib/validators/community.ts (Zod 스키마)
- 1_Frontend/src/lib/mock/community-data.json (Mock 데이터)',
    generator = 'Claude Code',
    duration = '1차: 작업지시서 작성(902줄)',
    modification_history = '2025-11-07: 작업지시서 작성 완료 (통합 버전)',
    test_history = '⏳ 대기 (작업지시서 작성 단계)',
    build_result = '⏳ 대기',
    dependency_propagation = '⏳ 대기',
    blocker = '없음',
    validation_result = '⏳ 대기',
    remarks = '7개 커뮤니티 API를 1개 작업지시서로 통합 / 계층형 댓글 구조 / Mock CRUD',
    updated_at = NOW()
WHERE task_id = 'P1BA3';

-- P1BA4: Mock API - 기타 (4개 API 통합)
UPDATE project_grid_tasks_revised
SET
    task_name = 'Mock API - 기타 (4개 시스템 API 통합)',
    instruction_file = 'tasks/P1BA4.md',
    assigned_agent = '1차: api-designer | 2차: Claude Code(실행 및 검증)',
    tools = 'Read, Edit, Write, Grep, Glob, Bash / TypeScript, Next.js API Routes, Zod / api-builder, api-test',
    work_mode = 'AI-Only',
    dependency_chain = 'P1D1, P1D2',
    progress = 0,
    status = '작업지시서 작성 완료',
    generated_files = '작업지시서: tasks/P1BA4.md (590줄)

대상 API 4개:
1. 알림 목록 조회 (GET /api/notifications)
2. 알림 읽음 처리 (PUT /api/notifications/[id]/read)
3. 관리자 통계 조회 (GET /api/admin/statistics)
4. 신고 접수 (POST /api/reports)

생성 예정 파일:
- 1_Frontend/src/app/api/notifications/route.ts
- 1_Frontend/src/app/api/notifications/[id]/read/route.ts
- 1_Frontend/src/app/api/admin/statistics/route.ts
- 1_Frontend/src/app/api/reports/route.ts
- 1_Frontend/src/lib/validators/system.ts (Zod 스키마)
- 1_Frontend/src/lib/mock/system-data.json (Mock 데이터)',
    generator = 'Claude Code',
    duration = '1차: 작업지시서 작성(590줄)',
    modification_history = '2025-11-07: 작업지시서 작성 완료 (통합 버전)',
    test_history = '⏳ 대기 (작업지시서 작성 단계)',
    build_result = '⏳ 대기',
    dependency_propagation = '⏳ 대기',
    blocker = '없음',
    validation_result = '⏳ 대기',
    remarks = '4개 시스템 API를 1개 작업지시서로 통합 / Admin 권한 / Mock 통계',
    updated_at = NOW()
WHERE task_id = 'P1BA4';

-- =============================================================================
-- Phase 3: Real APIs with Supabase (통합 버전)
-- =============================================================================

-- P3BA1: Real API - 인증 (6개 API 통합)
UPDATE project_grid_tasks_revised
SET
    task_name = 'Real API - 인증 (Supabase Auth 통합)',
    instruction_file = 'tasks/P3BA1.md',
    assigned_agent = '1차: api-designer | 2차: Claude Code(실행 및 검증)',
    tools = 'Read, Edit, Write, Grep, Glob, Bash / TypeScript, Next.js, Supabase Auth / api-builder, database-developer',
    work_mode = 'AI-Only',
    dependency_chain = 'P2D1, P1BA1',
    progress = 0,
    status = '작업지시서 작성 완료',
    generated_files = '작업지시서: tasks/P3BA1.md (954줄)

대상 API 6개 (Mock → Real 교체):
1. 회원가입 (POST /api/auth/signup) - Supabase Auth signUp
2. Google OAuth (POST /api/auth/google) - Supabase signInWithOAuth
3. 로그인 (POST /api/auth/signin) - Supabase signInWithPassword
4. 비밀번호 재설정 (POST /api/auth/reset-password) - Supabase resetPasswordForEmail
5. 토큰 리프레시 (POST /api/auth/refresh) - Supabase refreshSession
6. 로그아웃 (POST /api/auth/logout) - Supabase signOut

생성 예정 파일:
- 1_Frontend/src/lib/supabase/server.ts (신규 - Server-side 클라이언트)
- 1_Frontend/src/app/auth/callback/route.ts (신규 - OAuth Callback)
- 1_Frontend/src/app/auth/update-password/route.ts (신규)
- 1_Frontend/src/app/api/auth/signup/route.ts (Real 교체)
- 1_Frontend/src/app/api/auth/google/route.ts (Real 교체)
- 1_Frontend/src/app/api/auth/signin/route.ts (Real 교체)
- 1_Frontend/src/app/api/auth/reset-password/route.ts (Real 교체)
- 1_Frontend/src/app/api/auth/refresh/route.ts (Real 교체)
- 1_Frontend/src/app/api/auth/logout/route.ts (Real 교체)',
    generator = 'Claude Code',
    duration = '1차: 작업지시서 작성(954줄)',
    modification_history = '2025-11-07: 작업지시서 작성 완료 (통합 버전)',
    test_history = '⏳ 대기 (작업지시서 작성 단계)',
    build_result = '⏳ 대기',
    dependency_propagation = '⏳ 대기',
    blocker = '없음',
    validation_result = '⏳ 대기',
    remarks = '6개 인증 API를 Supabase Auth로 교체 / Server-side 쿠키 / RLS 정책',
    updated_at = NOW()
WHERE task_id = 'P3BA1';

-- P3BA2: Real API - 정치인 (6개 API 통합)
UPDATE project_grid_tasks_revised
SET
    task_name = 'Real API - 정치인 (Supabase + OpenAI 통합)',
    instruction_file = 'tasks/P3BA2.md',
    assigned_agent = '1차: api-designer | 2차: Claude Code(실행 및 검증)',
    tools = 'Read, Edit, Write, Grep, Glob, Bash / TypeScript, Supabase, OpenAI / api-builder, database-developer',
    work_mode = 'AI-Only',
    dependency_chain = 'P2D1, P1BA2, P3BA1',
    progress = 0,
    status = '작업지시서 작성 완료',
    generated_files = '작업지시서: tasks/P3BA2.md (1117줄)

대상 API 6개 (Mock → Real 교체):
1. 정치인 목록 조회 (GET /api/politicians) - Supabase Query Builder
2. 정치인 상세 조회 (GET /api/politicians/[id]) - Supabase + 즐겨찾기
3. 정치인 검색 (GET /api/politicians/search) - Supabase Full-Text Search
4. AI 정치인 평가 (POST /api/politicians/[id]/evaluate) - OpenAI GPT-4
5. 정치인 즐겨찾기 (POST /api/politicians/[id]/favorite) - Supabase + RLS
6. 정치인 검증 요청 (POST /api/politicians/[id]/verify-request) - Supabase

생성 예정 파일:
- 1_Frontend/src/lib/openai/client.ts (신규 - OpenAI 클라이언트)
- 1_Frontend/src/app/api/politicians/route.ts (Real 교체)
- 1_Frontend/src/app/api/politicians/search/route.ts (Real 교체)
- 1_Frontend/src/app/api/politicians/[id]/route.ts (Real 교체)
- 1_Frontend/src/app/api/politicians/[id]/evaluate/route.ts (Real 교체)
- 1_Frontend/src/app/api/politicians/[id]/favorite/route.ts (Real 교체)
- 1_Frontend/src/app/api/politicians/[id]/verify-request/route.ts (Real 교체)',
    generator = 'Claude Code',
    duration = '1차: 작업지시서 작성(1117줄)',
    modification_history = '2025-11-07: 작업지시서 작성 완료 (통합 버전)',
    test_history = '⏳ 대기 (작업지시서 작성 단계)',
    build_result = '⏳ 대기',
    dependency_propagation = '⏳ 대기',
    blocker = '없음',
    validation_result = '⏳ 대기',
    remarks = '6개 정치인 API를 Supabase + OpenAI로 교체 / AI 평가 / FTS 검색 / RLS',
    updated_at = NOW()
WHERE task_id = 'P3BA2';

-- P3BA3: Real API - 커뮤니티 (7개 API 통합)
UPDATE project_grid_tasks_revised
SET
    task_name = 'Real API - 커뮤니티 (Supabase CRUD 통합)',
    instruction_file = 'tasks/P3BA3.md',
    assigned_agent = '1차: api-designer | 2차: Claude Code(실행 및 검증)',
    tools = 'Read, Edit, Write, Grep, Glob, Bash / TypeScript, Supabase Database / api-builder, database-developer',
    work_mode = 'AI-Only',
    dependency_chain = 'P2D1, P1BA3, P3BA1',
    progress = 0,
    status = '작업지시서 작성 완료',
    generated_files = '작업지시서: tasks/P3BA3.md (1185줄)

대상 API 7개 (Mock → Real 교체):
1. 게시글 목록 조회 (GET /api/community/posts) - Supabase Query
2. 게시글 작성 (POST /api/community/posts) - Supabase Insert
3. 게시글 상세 조회 (GET /api/community/posts/[id]) - Supabase + 댓글
4. 게시글 수정 (PUT /api/community/posts/[id]) - Supabase Update + RLS
5. 게시글 삭제 (DELETE /api/community/posts/[id]) - Supabase Delete + CASCADE
6. 댓글 작성 (POST /api/community/posts/[id]/comments) - 계층형 댓글
7. 게시글 좋아요 (POST /api/community/posts/[id]/like) - 토글 방식

생성 예정 파일:
- 1_Frontend/src/app/api/community/posts/route.ts (Real 교체 - GET, POST)
- 1_Frontend/src/app/api/community/posts/[id]/route.ts (Real 교체 - GET, PUT, DELETE)
- 1_Frontend/src/app/api/community/posts/[id]/comments/route.ts (Real 교체)
- 1_Frontend/src/app/api/community/posts/[id]/like/route.ts (Real 교체)',
    generator = 'Claude Code',
    duration = '1차: 작업지시서 작성(1185줄)',
    modification_history = '2025-11-07: 작업지시서 작성 완료 (통합 버전)',
    test_history = '⏳ 대기 (작업지시서 작성 단계)',
    build_result = '⏳ 대기',
    dependency_propagation = '⏳ 대기',
    blocker = '없음',
    validation_result = '⏳ 대기',
    remarks = '7개 커뮤니티 API를 Supabase로 교체 / RLS 작성자 권한 / CASCADE / 계층형 댓글',
    updated_at = NOW()
WHERE task_id = 'P3BA3';

-- P3BA4: Real API - 기타 (4개 API 통합)
UPDATE project_grid_tasks_revised
SET
    task_name = 'Real API - 기타 (Supabase 시스템 API 통합)',
    instruction_file = 'tasks/P3BA4.md',
    assigned_agent = '1차: api-designer | 2차: Claude Code(실행 및 검증)',
    tools = 'Read, Edit, Write, Grep, Glob, Bash / TypeScript, Supabase Database / api-builder, database-developer',
    work_mode = 'AI-Only',
    dependency_chain = 'P2D1, P1BA4, P3BA1',
    progress = 0,
    status = '작업지시서 작성 완료',
    generated_files = '작업지시서: tasks/P3BA4.md (827줄)

대상 API 4개 (Mock → Real 교체):
1. 알림 목록 조회 (GET /api/notifications) - Supabase + RLS
2. 알림 읽음 처리 (PUT /api/notifications/[id]/read) - Supabase Update
3. 관리자 통계 조회 (GET /api/admin/statistics) - Supabase 집계 쿼리
4. 신고 접수 (POST /api/reports) - Supabase + 중복 방지

생성 예정 파일:
- 1_Frontend/src/app/api/notifications/route.ts (Real 교체)
- 1_Frontend/src/app/api/notifications/[id]/read/route.ts (Real 교체)
- 1_Frontend/src/app/api/admin/statistics/route.ts (Real 교체)
- 1_Frontend/src/app/api/reports/route.ts (Real 교체)',
    generator = 'Claude Code',
    duration = '1차: 작업지시서 작성(827줄)',
    modification_history = '2025-11-07: 작업지시서 작성 완료 (통합 버전)',
    test_history = '⏳ 대기 (작업지시서 작성 단계)',
    build_result = '⏳ 대기',
    dependency_propagation = '⏳ 대기',
    blocker = '없음',
    validation_result = '⏳ 대기',
    remarks = '4개 시스템 API를 Supabase로 교체 / Admin 통계 / RLS 본인 데이터 / 신고 중복 방지',
    updated_at = NOW()
WHERE task_id = 'P3BA4';

-- =============================================================================
-- 확인 쿼리
-- =============================================================================

-- 업데이트된 작업 확인
SELECT
    task_id,
    task_name,
    status,
    progress,
    SUBSTRING(generated_files FROM 1 FOR 100) as files_preview,
    updated_at
FROM project_grid_tasks_revised
WHERE task_id IN ('P1BA1', 'P1BA3', 'P1BA4', 'P3BA1', 'P3BA2', 'P3BA3', 'P3BA4')
ORDER BY phase, area, task_id;
