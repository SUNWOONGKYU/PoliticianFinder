-- SQL statements to insert P3BA28 and P3F7 into project_grid_tasks_revised table
-- Generated: 2025-11-15
-- Summary: 2 INSERTs (P3BA28: 알림 시스템, P3F7: 관심 등록 버튼)

-- ============================================================================
-- INSERT P3BA28: 알림 시스템 API 연동 (새 태스크)
-- ============================================================================
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
  'P3BA28',
  '알림 시스템 연동',
  NULL,
  'ClaudeCode',
  NULL,
  'bugfix',
  NULL,
  100,
  '완료',
  ARRAY[
    '1_Frontend/src/app/notifications/page.tsx'
  ],
  'Manual Test ✅ | Build ✅',
  '✅ 성공',
  NOW(),
  NOW()
);

-- ============================================================================
-- INSERT P3F7: 정치인 관심 등록 버튼 구현 (새 태스크)
-- ============================================================================
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
  'F',
  'P3F7',
  '관심 등록 버튼',
  NULL,
  'ClaudeCode',
  NULL,
  'feature',
  NULL,
  100,
  '완료',
  ARRAY[
    '1_Frontend/src/components/FavoriteButton.tsx',
    '1_Frontend/src/app/politicians/[id]/page.tsx'
  ],
  'Manual Test ✅ | Build ✅',
  '✅ 성공',
  NOW(),
  NOW()
);

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Verify all inserts were successful
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
WHERE task_id IN ('P3BA28', 'P3F7')
ORDER BY phase, area, task_id;

-- Summary by area
SELECT
  area,
  COUNT(*) as task_count,
  COUNT(CASE WHEN status = '완료' THEN 1 END) as completed_count
FROM project_grid_tasks_revised
WHERE task_id IN ('P3BA28', 'P3F7')
GROUP BY area
ORDER BY area;
