-- 7개 신규 태스크를 Supabase project_grid_tasks_revised 테이블에 추가
-- 생성일: 2025-12-12
-- 기존 71개 + 신규 7개 = 78개

-- ============================================================
-- P3F3: status 필드 제거 및 identity/title 분리 작업
-- ============================================================
INSERT INTO project_grid_tasks_revised (
  phase, area, task_id, task_name, instruction_file, assigned_agent, tools,
  work_mode, dependency_chain, progress, status, generated_files, generator,
  duration, modification_history, test_history, build_result,
  dependency_propagation, blocker, validation_result, remarks
) VALUES (
  3,
  'F',
  'P3F3',
  'status 필드 제거 및 identity/title 분리 작업',
  'tasks/P3F3.md',
  '1차: frontend-developer | 2차: Claude Code(실행 및 검증)',
  'Read, Write, Edit, Bash, Glob, Grep',
  'Code',
  'P2D1 → P3F3',
  80,
  '진행중',
  '1_Frontend/src/app/api/politicians/route.ts (수정), 1_Frontend/src/app/api/politicians/[id]/route.ts (수정), 1_Frontend/src/app/politicians/[id]/page.tsx (수정), 1_Frontend/src/types/politician.ts (신규)',
  'Claude Code',
  '6시간',
  '2025-12-12: 초기 생성',
  '최종: Build ✅ + Type ✅',
  '✅ 성공',
  '✅ 완료',
  '없음',
  '✅ 통과',
  'status 필드(신분/직책 결합)를 identity(신분)와 title(직책)로 분리. 데이터 구조 근본적 개선.'
);

-- ============================================================
-- P3F4: 정치인 데이터 스키마 완성 및 필드 매핑 작업
-- ============================================================
INSERT INTO project_grid_tasks_revised (
  phase, area, task_id, task_name, instruction_file, assigned_agent, tools,
  work_mode, dependency_chain, progress, status, generated_files, generator,
  duration, modification_history, test_history, build_result,
  dependency_propagation, blocker, validation_result, remarks
) VALUES (
  3,
  'F',
  'P3F4',
  '정치인 데이터 스키마 완성 및 필드 매핑 작업',
  'tasks/P3F4.md',
  '1차: frontend-developer | 2차: Claude Code(실행 및 검증)',
  'Read, Write, Edit, Bash, Glob, Grep',
  'Code',
  'P2D1 → P3F4',
  100,
  '완료',
  '1_Frontend/src/utils/fieldMapper.ts (신규), 1_Frontend/src/types/politician.ts (신규), 1_Frontend/src/app/api/politicians/[id]/route.ts (수정), add_politician_official_info_fields.sql (신규)',
  'Claude Code',
  '3.5시간',
  '2025-11-14: 초기 생성, 2025-11-15: 완료',
  '최종: Build ✅ + Type ✅ + API Test ✅',
  '✅ 성공',
  '✅ 완료',
  '없음',
  '✅ 통과',
  '11개 필드 추가, snake_case→camelCase 매핑, 계산 필드(age, postCount 등) 구현.'
);

-- ============================================================
-- P3BA33: V24.0 AI 평가 점수 등급-이모지 불일치 버그 수정
-- ============================================================
INSERT INTO project_grid_tasks_revised (
  phase, area, task_id, task_name, instruction_file, assigned_agent, tools,
  work_mode, dependency_chain, progress, status, generated_files, generator,
  duration, modification_history, test_history, build_result,
  dependency_propagation, blocker, validation_result, remarks
) VALUES (
  3,
  'BA',
  'P3BA33',
  'V24.0 AI 평가 점수 등급-이모지 불일치 버그 수정',
  'tasks/P3BA33.md',
  '1차: backend-developer | 2차: Claude Code(실행 및 검증)',
  'Read, Write, Edit, Bash, Glob, Grep',
  'Code',
  'P3BA2 → P3BA33',
  100,
  '완료',
  '1_Frontend/src/app/api/politicians/[id]/route.ts (수정), 1_Frontend/src/lib/database.types.ts (수정)',
  'Claude Code',
  '1.5시간',
  '2025-11-26: 버그 수정 완료. Git: 17f58d5',
  '최종: Build ✅ + API Test ✅',
  '✅ 성공',
  '✅ 완료',
  '없음',
  '✅ 통과',
  '점수-등급 불일치 해결. DB의 grade_code 대신 API에서 점수 기반 등급 재계산.'
);

-- ============================================================
-- P3BA34: V24.0 AI 점수 목록 API 통합
-- ============================================================
INSERT INTO project_grid_tasks_revised (
  phase, area, task_id, task_name, instruction_file, assigned_agent, tools,
  work_mode, dependency_chain, progress, status, generated_files, generator,
  duration, modification_history, test_history, build_result,
  dependency_propagation, blocker, validation_result, remarks
) VALUES (
  3,
  'BA',
  'P3BA34',
  'V24.0 AI 점수 목록 API 통합',
  'tasks/P3BA34.md',
  '1차: backend-developer | 2차: Claude Code(실행 및 검증)',
  'Read, Write, Edit, Bash, Glob, Grep',
  'Code',
  'P3BA33 → P3BA34',
  100,
  '완료',
  '1_Frontend/src/app/api/politicians/route.ts (수정), 1_Frontend/src/utils/fieldMapper.ts (수정)',
  'Claude Code',
  '1.5시간',
  '2025-11-27: 완료. Git: d0b8fb9',
  '최종: Build ✅ + API Test ✅',
  '✅ 성공',
  '✅ 완료',
  '없음',
  '✅ 통과',
  '목록 API에서 ai_final_scores 테이블 조회 추가. calculateV24Grade() 함수 구현.'
);

-- ============================================================
-- P3BA35: 정치인 상세 페이지 하드코딩된 점수 제거
-- ============================================================
INSERT INTO project_grid_tasks_revised (
  phase, area, task_id, task_name, instruction_file, assigned_agent, tools,
  work_mode, dependency_chain, progress, status, generated_files, generator,
  duration, modification_history, test_history, build_result,
  dependency_propagation, blocker, validation_result, remarks
) VALUES (
  3,
  'BA',
  'P3BA35',
  '정치인 상세 페이지 하드코딩된 점수 제거',
  'tasks/P3BA35.md',
  '1차: frontend-developer | 2차: Claude Code(실행 및 검증)',
  'Read, Write, Edit, Bash, Glob, Grep',
  'Code',
  'P3BA33 → P3BA34 → P3BA35',
  100,
  '완료',
  '1_Frontend/src/app/politicians/[id]/page.tsx (수정), 1_Frontend/src/types/politician.ts (수정)',
  'Claude Code',
  '1.5시간',
  '2025-11-27: 완료. Git: e3b45ca',
  '최종: Build ✅ + Manual Test ✅',
  '✅ 성공',
  '✅ 완료',
  '없음',
  '✅ 통과',
  'AI_SCORES, CATEGORY_SCORES 하드코딩 제거. Claude AI만 사용. 실제 API 데이터 표시.'
);

-- ============================================================
-- P3BA36: 팔로우 시스템 백엔드 구현
-- ============================================================
INSERT INTO project_grid_tasks_revised (
  phase, area, task_id, task_name, instruction_file, assigned_agent, tools,
  work_mode, dependency_chain, progress, status, generated_files, generator,
  duration, modification_history, test_history, build_result,
  dependency_propagation, blocker, validation_result, remarks
) VALUES (
  3,
  'BA',
  'P3BA36',
  '팔로우 시스템 백엔드 구현',
  'tasks/P3BA36.md',
  '1차: backend-developer | 2차: Claude Code(실행 및 검증)',
  'Read, Write, Edit, Bash, Glob, Grep',
  'Code',
  'P2D1 → P3BA36',
  100,
  '완료',
  '0-4_Database/Supabase/migrations/060_follow_system_complete.sql (신규), 1_Frontend/src/app/api/users/[id]/follow/route.ts (신규), 1_Frontend/src/app/api/users/[id]/followers/route.ts (신규), 1_Frontend/src/app/api/users/[id]/following/route.ts (신규), 1_Frontend/src/app/api/users/[id]/stats/route.ts (신규)',
  'Claude Code',
  '3.5시간',
  '2025-12-12: 완료',
  '최종: Build ✅ + DB Migration ✅ + API Test ✅',
  '✅ 성공',
  '✅ 완료',
  '없음',
  '✅ 통과',
  '회원 간 팔로우 시스템 백엔드. follows 테이블, 활동포인트 자동 지급, 영향력 등급 계산.'
);

-- ============================================================
-- P3BA37: 팔로우 시스템 프론트엔드 및 실시간 기능
-- ============================================================
INSERT INTO project_grid_tasks_revised (
  phase, area, task_id, task_name, instruction_file, assigned_agent, tools,
  work_mode, dependency_chain, progress, status, generated_files, generator,
  duration, modification_history, test_history, build_result,
  dependency_propagation, blocker, validation_result, remarks
) VALUES (
  3,
  'BA',
  'P3BA37',
  '팔로우 시스템 프론트엔드 및 실시간 기능',
  'tasks/P3BA37.md',
  '1차: fullstack-developer | 2차: Claude Code(실행 및 검증)',
  'Read, Write, Edit, Bash, Glob, Grep',
  'Code',
  'P3BA36 → P3BA37',
  60,
  '진행중',
  '1_Frontend/src/components/FollowButton.tsx (신규), 1_Frontend/src/components/GradeUpgradeModal.tsx (신규), 1_Frontend/src/app/users/[id]/followers/page.tsx (신규), 1_Frontend/src/app/users/[id]/following/page.tsx (신규), 1_Frontend/src/app/mypage/page.tsx (수정)',
  'Claude Code',
  '3시간 (진행중)',
  '2025-12-12: 60% 완료',
  '1차: Build ✅ | 등급 모달/토스트 구현 중',
  '✅ 성공',
  '⏳ 진행중',
  '없음',
  '⏳ 진행중',
  'FollowButton, 팔로워/팔로잉 목록 페이지, 마이페이지 연동 완료. 등급 승급 모달, 실시간 알림 구현 중.'
);

-- ============================================================
-- 확인 쿼리
-- ============================================================
SELECT
  task_id,
  task_name,
  phase,
  area,
  status,
  progress,
  build_result
FROM project_grid_tasks_revised
WHERE task_id IN ('P3F3', 'P3F4', 'P3BA33', 'P3BA34', 'P3BA35', 'P3BA36', 'P3BA37')
ORDER BY task_id;

-- 전체 개수 확인
SELECT COUNT(*) as total_tasks FROM project_grid_tasks_revised;
