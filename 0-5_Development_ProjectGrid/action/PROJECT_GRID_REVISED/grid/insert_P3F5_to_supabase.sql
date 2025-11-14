-- P3F5: 정치인 필터 시스템 고도화를 Supabase project_grid_tasks_revised 테이블에 추가

INSERT INTO project_grid_tasks_revised (
  phase,
  area,
  task_id,
  task_name,
  instruction_file,
  assigned_agent,
  tools,
  work_mode,
  dependency_chain,
  progress,
  status,
  priority,
  estimated_hours,
  actual_hours,
  generated_files,
  test_history,
  build_result,
  dependencies,
  blocking_tasks,
  notes,
  created_at,
  updated_at
) VALUES (
  3,                                           -- phase
  'F',                                         -- area
  'P3F5',                                      -- task_id
  '정치인 필터 시스템 고도화',                 -- task_name
  'tasks/P3F5.md',                             -- instruction_file
  '1차: frontend-developer | 2차: Claude Code(실행 및 검증)',  -- assigned_agent
  'Read, Write, Edit, Bash, Glob, Grep',      -- tools
  'Code',                                      -- work_mode
  'P2D1 → P3F5',                               -- dependency_chain
  100,                                         -- progress
  '완료',                                      -- status
  'High',                                      -- priority
  4.0,                                         -- estimated_hours
  4.0,                                         -- actual_hours
  ARRAY[
    '1_Frontend/src/constants/regions.ts (ClaudeCode추가)',
    '1_Frontend/src/constants/constituencies.ts (ClaudeCode추가)',
    '1_Frontend/src/app/politicians/page.tsx (ClaudeCode수정)',
    '1_Frontend/src/app/admin/politicians/page.tsx (ClaudeCode수정)',
    '1_Frontend/src/app/api/admin/politicians/route.ts (ClaudeCode수정)',
    'add_district_field.sql (ClaudeCode추가)'
  ],                                           -- generated_files
  '최종: Build ✅ + Type ✅ + Lint ✅ + Manual Test ✅',  -- test_history
  '2차: Build ✅ + Type ✅',                   -- build_result
  ARRAY['P2D1'],                               -- dependencies
  ARRAY[]::text[],                             -- blocking_tasks (empty array)
  '22대 국회 254개 선거구 + 17개 광역시도 전체 데이터 구현. 조건부 필터 시스템 (국회의원 ↔ 일반). district 필드 추가.',  -- notes
  NOW(),                                       -- created_at
  NOW()                                        -- updated_at
);

-- 확인 쿼리
SELECT
  task_id,
  task_name,
  phase,
  area,
  status,
  progress,
  assigned_agent
FROM project_grid_tasks_revised
WHERE task_id = 'P3F5';
