-- SQL statement to insert P3BA27 into project_grid_tasks_revised table
-- Generated: 2025-11-15
-- Task: 홈 화면 버그 수정 (공지사항, 중계 페이지, 평가점수)

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
  generated_files,
  test_history,
  build_result,
  created_at,
  updated_at
) VALUES (
  3,
  'BA',
  'P3BA27',
  '홈 화면 버그 수정',
  NULL,
  'ClaudeCode',
  NULL,
  'bugfix',
  NULL,
  100,
  '완료',
  ARRAY[
    '1_Frontend/src/app/page.tsx',
    '1_Frontend/src/app/relay/page.tsx'
  ],
  'Manual Test ✅ | Build ✅',
  '✅ 성공',
  NOW(),
  NOW()
);

-- Verify insertion
SELECT
  task_id,
  task_name,
  phase,
  area,
  status,
  progress,
  assigned_agent,
  generated_files,
  test_history,
  build_result,
  updated_at
FROM project_grid_tasks_revised
WHERE task_id = 'P3BA27';
