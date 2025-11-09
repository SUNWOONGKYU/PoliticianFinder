-- PROJECT GRID REVISED - 74 Tasks (All Phases)
-- Generated: 2025-11-06
-- Updated: 2025-11-06 (Added 7 admin feature tasks: P4BA7-P4BA13)
-- Target table: project_grid_tasks_revised
--
-- Task Distribution:
--   Phase 1: Frontend + Mock API (27 tasks)
--   Phase 2: Database Schema (1 task)
--   Phase 3: Real API Implementation (23 tasks)
--   Phase 4: Backend Utilities & Crawlers (16 tasks) - Added 7 admin APIs
--   Phase 5: Testing (3 tasks)
--   Phase 6: DevOps & Deployment (4 tasks)

-- Phase 1: Frontend + Mock API (27개)

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    1, 'F', 'P1F1', 'React 전체 페이지 변환',
    'tasks/P1F1.md', 'frontend-developer',
    'TypeScript, React, Next.js, Tailwind CSS', 'AI-Only',
    '없음', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', '프로토타입 28개 + 개선 5개 페이지를 React로 변환'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    1, 'BI', 'P1BI1', 'Supabase 클라이언트 설정',
    'tasks/P1BI1.md', 'backend-developer',
    'TypeScript, Next.js, Supabase', 'AI-Only',
    '없음', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', 'Supabase 클라이언트 초기화 (서버/클라이언트 분리)'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    1, 'BI', 'P1BI2', 'API 미들웨어',
    'tasks/P1BI2.md', 'backend-developer',
    'TypeScript, Next.js, Supabase', 'AI-Only',
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
    'TypeScript, Next.js, Supabase', 'AI-Only',
    'P1BI1, P2D1', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', 'Supabase Schema → TypeScript Types 자동 생성'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    1, 'BA', 'P1BA1', '회원가입 API (Mock)',
    'tasks/P1BA1.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
    'P1BI1, P1BI2', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', 'Mock 데이터로 회원가입 처리'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    1, 'BA', 'P1BA2', 'Google OAuth API (Mock)',
    'tasks/P1BA2.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
    'P1BI1, P1BI2', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', 'Mock Google OAuth 콜백 처리'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    1, 'BA', 'P1BA3', '로그인 API (Mock)',
    'tasks/P1BA3.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
    'P1BI1, P1BI2', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', 'Mock 데이터로 로그인 처리'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    1, 'BA', 'P1BA4', '비밀번호 재설정 API (Mock)',
    'tasks/P1BA4.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
    'P1BI1, P1BI2', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', 'Mock 이메일 전송 처리'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    1, 'BA', 'P1BA5', '토큰 갱신 API (Mock)',
    'tasks/P1BA5.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
    'P1BI1, P1BI2', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', 'Mock 토큰 갱신 처리'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    1, 'BA', 'P1BA6', '로그아웃 API (Mock)',
    'tasks/P1BA6.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
    'P1BI1, P1BI2', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', 'Mock 로그아웃 처리'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    1, 'BA', 'P1BA7', '정치인 목록 API (Mock)',
    'tasks/P1BA7.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
    'P1BI1, P1BI2', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', 'Mock 정치인 목록 반환'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    1, 'BA', 'P1BA8', '정치인 상세 API (Mock)',
    'tasks/P1BA8.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
    'P1BI1, P1BI2', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', 'Mock 정치인 상세 정보 반환'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    1, 'BA', 'P1BA9', '정치인 관심 등록 API (Mock)',
    'tasks/P1BA9.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
    'P1BI1, P1BI2', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', 'Mock 관심 등록/해제'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    1, 'BA', 'P1BA10', '정치인 본인 인증 API (Mock)',
    'tasks/P1BA10.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
    'P1BI1, P1BI2', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', 'Mock 정치인 본인 인증 처리'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    1, 'BA', 'P1BA11', 'AI 평가 조회 API (Mock)',
    'tasks/P1BA11.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
    'P1BI1, P1BI2', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', 'Mock AI 평가 데이터 반환'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    1, 'BA', 'P1BA12', 'AI 평가 생성 API (Mock)',
    'tasks/P1BA12.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
    'P1BI1, P1BI2', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', 'Mock AI 평가 생성 시뮬레이션'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    1, 'BA', 'P1BA13', '게시글 목록 API (Mock)',
    'tasks/P1BA13.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
    'P1BI1, P1BI2', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', 'Mock 게시글 목록 반환'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    1, 'BA', 'P1BA14', '게시글 상세 API (Mock)',
    'tasks/P1BA14.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
    'P1BI1, P1BI2', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', 'Mock 게시글 상세 정보 반환'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    1, 'BA', 'P1BA15', '게시글 작성 API (Mock)',
    'tasks/P1BA15.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
    'P1BI1, P1BI2', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', 'Mock 게시글 작성 처리'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    1, 'BA', 'P1BA16', '댓글 작성 API (Mock)',
    'tasks/P1BA16.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
    'P1BI1, P1BI2', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', 'Mock 댓글 작성 처리'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    1, 'BA', 'P1BA17', '좋아요 API (Mock)',
    'tasks/P1BA17.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
    'P1BI1, P1BI2', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', 'Mock 좋아요/좋아요 취소 처리'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    1, 'BA', 'P1BA18', '공유 API (Mock)',
    'tasks/P1BA18.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
    'P1BI1, P1BI2', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', 'Mock 게시글 공유 처리'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    1, 'BA', 'P1BA19', '팔로우 API (Mock)',
    'tasks/P1BA19.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
    'P1BI1, P1BI2', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', 'Mock 팔로우/언팔로우 처리'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    1, 'BA', 'P1BA20', '알림 조회 API (Mock)',
    'tasks/P1BA20.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
    'P1BI1, P1BI2', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', 'Mock 알림 목록 반환'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    1, 'BA', 'P1BA21', '관리자 통계 API (Mock)',
    'tasks/P1BA21.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
    'P1BI1, P1BI2', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', 'Mock 관리자 대시보드 통계'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    1, 'BA', 'P1BA22', '사용자 관리 API (Mock)',
    'tasks/P1BA22.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
    'P1BI1, P1BI2', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', 'Mock 사용자 관리 (차단/활성화)'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    1, 'BA', 'P1BA23', '콘텐츠 신고 API (Mock)',
    'tasks/P1BA23.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
    'P1BI1, P1BI2', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', 'Mock 콘텐츠 신고 처리'
);


-- Phase 2: Database Schema (1개)

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    2, 'D', 'P2D1', '전체 Database 스키마 (통합)',
    'tasks/P2D1.md', 'database-developer',
    'PostgreSQL, Supabase', 'AI-Only',
    '없음', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', '모든 테이블 + 트리거 + 타입 + Storage + 최적화'
);


-- Phase 3: Real API Implementation (23개)

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    3, 'BA', 'P3BA1', '회원가입 API (Real)',
    'tasks/P3BA1.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
    'P2D1, P1BA1', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', 'Supabase Auth + users 테이블 실제 처리'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    3, 'BA', 'P3BA2', 'Google OAuth API (Real)',
    'tasks/P3BA2.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
    'P2D1, P1BA2', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', 'Google OAuth → Supabase Auth 실제 연동'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    3, 'BA', 'P3BA3', '로그인 API (Real)',
    'tasks/P3BA3.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
    'P2D1, P1BA3', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', 'Supabase Auth 실제 로그인'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    3, 'BA', 'P3BA4', '비밀번호 재설정 API (Real)',
    'tasks/P3BA4.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
    'P2D1, P1BA4', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', 'Supabase Auth 실제 비밀번호 재설정'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    3, 'BA', 'P3BA5', '토큰 갱신 API (Real)',
    'tasks/P3BA5.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
    'P2D1, P1BA5', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', 'Supabase Auth 실제 토큰 갱신'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    3, 'BA', 'P3BA6', '로그아웃 API (Real)',
    'tasks/P3BA6.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
    'P2D1, P1BA6', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', 'Supabase Auth 실제 로그아웃'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    3, 'BA', 'P3BA7', '정치인 목록 API (Real)',
    'tasks/P3BA7.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
    'P2D1, P1BA7', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', 'politicians 테이블 실제 조회 (필터링/정렬)'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    3, 'BA', 'P3BA8', '정치인 상세 API (Real)',
    'tasks/P3BA8.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
    'P2D1, P1BA8', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', 'politicians + careers + pledges JOIN 조회'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    3, 'BA', 'P3BA9', '정치인 관심 등록 API (Real)',
    'tasks/P3BA9.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
    'P2D1, P1BA9', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', 'user_favorites 테이블 INSERT/DELETE'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    3, 'BA', 'P3BA10', '정치인 본인 인증 API (Real)',
    'tasks/P3BA10.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
    'P2D1, P1BA10', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', 'politician_verification 실제 처리'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    3, 'BA', 'P3BA11', 'AI 평가 조회 API (Real)',
    'tasks/P3BA11.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
    'P2D1, P1BA11', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', 'ai_evaluations 테이블 실제 조회'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    3, 'BA', 'P3BA12', 'AI 평가 생성 API (Real)',
    'tasks/P3BA12.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
    'P2D1, P1BA12', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', 'OpenAI API 호출 + ai_evaluations 저장'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    3, 'BA', 'P3BA13', '게시글 목록 API (Real)',
    'tasks/P3BA13.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
    'P2D1, P1BA13', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', 'posts 테이블 실제 조회 (페이지네이션)'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    3, 'BA', 'P3BA14', '게시글 상세 API (Real)',
    'tasks/P3BA14.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
    'P2D1, P1BA14', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', 'posts 상세 실제 조회'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    3, 'BA', 'P3BA15', '게시글 작성 API (Real)',
    'tasks/P3BA15.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
    'P2D1, P1BA15', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', 'posts 테이블 실제 INSERT'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    3, 'BA', 'P3BA16', '댓글 작성 API (Real)',
    'tasks/P3BA16.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
    'P2D1, P1BA16', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', 'comments 테이블 실제 INSERT'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    3, 'BA', 'P3BA17', '좋아요 API (Real)',
    'tasks/P3BA17.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
    'P2D1, P1BA17', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', 'post_likes + comment_likes 실제 처리'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    3, 'BA', 'P3BA18', '공유 API (Real)',
    'tasks/P3BA18.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
    'P2D1, P1BA18', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', 'shares 테이블 실제 처리'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    3, 'BA', 'P3BA19', '팔로우 API (Real)',
    'tasks/P3BA19.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
    'P2D1, P1BA19', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', 'follows 테이블 실제 처리'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    3, 'BA', 'P3BA20', '알림 조회 API (Real)',
    'tasks/P3BA20.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
    'P2D1, P1BA20', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', 'notifications 테이블 실제 조회'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    3, 'BA', 'P3BA21', '관리자 통계 API (Real)',
    'tasks/P3BA21.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
    'P2D1, P1BA21', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', '실제 집계 쿼리 (사용자/게시글 통계)'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    3, 'BA', 'P3BA22', '사용자 관리 API (Real)',
    'tasks/P3BA22.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
    'P2D1, P1BA22', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', 'users 관리 실제 처리 (차단/활성화)'
);

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    3, 'BA', 'P3BA23', '콘텐츠 신고 API (Real)',
    'tasks/P3BA23.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
    'P2D1, P1BA23', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', 'reports 테이블 실제 처리'
);


-- Phase 4: Backend Utilities & Crawlers (9개)

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    4, 'BA', 'P4BA1', '선관위 크롤링 스크립트',
    'tasks/P4BA1.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
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
    'tasks/P4BA2.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
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
    'tasks/P4BA3.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
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
    'tasks/P4BA4.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
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
    'tasks/P4BA5.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
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
    'tasks/P4BA6.md', 'api-designer',
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
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
    'P3BA23', 0, '대기',
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
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
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
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
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
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
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
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
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
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
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
    'TypeScript, Next.js API Routes, Supabase, Zod', 'AI-Only',
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
    'tasks/P4O1.md', 'devops-engineer',
    'GitHub Actions, Vercel, Sentry', 'AI-Only',
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
    'tasks/P4O2.md', 'devops-engineer',
    'GitHub Actions, Vercel, Sentry', 'AI-Only',
    'P2D1', 0, '대기',
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
    'tasks/P4O3.md', 'devops-engineer',
    'GitHub Actions, Vercel, Sentry', 'AI-Only',
    'P2D1', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', '사용자 등급 자동 재계산 (Cron)'
);


-- Phase 5: Testing (3개)

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    5, 'T', 'P5T1', 'Unit Tests',
    'tasks/P5T1.md', 'test-engineer',
    'Jest, Playwright, Testing Library', 'AI-Only',
    'P1F1, P3BA1, P3BA2, P3BA3', 0, '대기',
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
    'Jest, Playwright, Testing Library', 'AI-Only',
    'P1F1, P3BA1, P3BA2, P3BA3', 0, '대기',
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
    'Jest, Playwright, Testing Library', 'AI-Only',
    'P3BA1, P3BA2, P3BA3, P2D1', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', 'API + DB 통합 테스트'
);


-- Phase 6: DevOps & Deployment (4개)

INSERT INTO project_grid_tasks_revised (
    phase, area, task_id, task_name, instruction_file, assigned_agent,
    tools, work_mode, dependency_chain, progress, status, generated_files,
    generator, duration, modification_history, test_history, build_result,
    dependency_propagation, blocker, validation_result, remarks
) VALUES (
    6, 'O', 'P6O1', 'CI/CD 파이프라인',
    'tasks/P6O1.md', 'devops-engineer',
    'GitHub Actions, Vercel, Sentry', 'AI-Only',
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
    'tasks/P6O2.md', 'devops-engineer',
    'GitHub Actions, Vercel, Sentry', 'AI-Only',
    'P5T1, P5T2, P5T3', 0, '대기',
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
    'tasks/P6O3.md', 'devops-engineer',
    'GitHub Actions, Vercel, Sentry', 'AI-Only',
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
    'tasks/P6O4.md', 'devops-engineer',
    'GitHub Actions, Vercel, Sentry', 'AI-Only',
    'P6O2', 0, '대기',
    '-', '-',
    '-', '-',
    '대기', '⏳ 대기',
    '⏳ 대기', '없음',
    '⏳ 대기', 'Rate Limiting + CORS + CSP 설정'
);

