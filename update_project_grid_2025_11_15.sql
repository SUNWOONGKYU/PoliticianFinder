-- SQL statements to update project_grid_tasks_revised table
-- Generated: 2025-11-15
-- Summary: 2 UPDATEs (P3F5, P3BA24) and 3 INSERTs (P3BA25, P3BA26, P3F6)

-- ============================================================================
-- UPDATE P3F5: 정치인 필터 시스템 고도화 - District 필드 추가
-- ============================================================================
UPDATE project_grid_tasks_revised
SET
  status = '완료',
  progress = 100,
  assigned_agent = 'ClaudeCode',
  generated_files = ARRAY[
    'add_district_field.sql',
    '1_Frontend/src/constants/constituencies.ts',
    '1_Frontend/src/app/politicians/page.tsx',
    '1_Frontend/src/app/admin/politicians/page.tsx'
  ],
  test_history = 'Manual Test ✅ | Build ✅ | Type ✅ | Lint ✅',
  build_result = '✅ 성공',
  updated_at = NOW()
WHERE task_id = 'P3F5';

-- ============================================================================
-- UPDATE P3BA24: 문의 관리 시스템 완성
-- ============================================================================
UPDATE project_grid_tasks_revised
SET
  status = '완료',
  progress = 100,
  assigned_agent = 'ClaudeCode',
  generated_files = ARRAY[
    'create_inquiries_table.sql',
    '1_Frontend/src/app/api/admin/inquiries/route.ts',
    '1_Frontend/src/app/admin/inquiries/page.tsx',
    '1_Frontend/src/lib/email.ts',
    'INQUIRY_EMAIL_SETUP.md',
    '1_Frontend/src/app/admin/components/AdminSidebar.tsx',
    '1_Frontend/src/app/admin/page.tsx',
    '1_Frontend/src/app/api/admin/dashboard/route.ts',
    '1_Frontend/.env.local'
  ],
  test_history = 'Manual Test ✅ | Build ✅ | Type ✅ | Lint ✅',
  build_result = '✅ 성공',
  updated_at = NOW()
WHERE task_id = 'P3BA24';

-- ============================================================================
-- INSERT P3BA25: 콘텐츠 관리 API 테이블명 통일 (새 태스크)
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
  'P3BA25',
  '콘텐츠 관리 API 수정',
  NULL,
  'ClaudeCode',
  NULL,
  'bugfix',
  NULL,
  100,
  '완료',
  ARRAY[
    '1_Frontend/src/app/api/admin/content/route.ts',
    '1_Frontend/src/app/api/posts/[id]/route.ts',
    '1_Frontend/src/app/api/community/posts/route.ts',
    '1_Frontend/src/app/api/comments/route.ts',
    '1_Frontend/src/app/admin/posts/page.tsx'
  ],
  'Manual Test ✅ | Build ✅',
  '✅ 성공',
  NOW(),
  NOW()
);

-- ============================================================================
-- INSERT P3BA26: 공지사항 API 구현 (새 태스크)
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
  'P3BA26',
  '공지사항 API 구현',
  NULL,
  'ClaudeCode',
  NULL,
  'feature',
  NULL,
  100,
  '완료',
  ARRAY[
    '1_Frontend/src/app/api/notices/route.ts'
  ],
  'Manual Test ✅ | Build ✅',
  '✅ 성공',
  NOW(),
  NOW()
);

-- ============================================================================
-- INSERT P3F6: 회원 역할 관리 시스템 (새 태스크)
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
  'P3F6',
  '회원 역할 관리',
  NULL,
  'ClaudeCode',
  NULL,
  'feature',
  NULL,
  100,
  '완료',
  ARRAY[
    'add_user_roles.sql',
    '1_Frontend/src/app/admin/users/page.tsx'
  ],
  'Manual Test ✅ | Build ✅',
  '✅ 성공',
  NOW(),
  NOW()
);

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Verify all updates were successful
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
WHERE task_id IN ('P3F5', 'P3BA24', 'P3BA25', 'P3BA26', 'P3F6')
ORDER BY phase, area, task_id;

-- Summary by area
SELECT
  area,
  COUNT(*) as task_count,
  COUNT(CASE WHEN status = '완료' THEN 1 END) as completed_count
FROM project_grid_tasks_revised
WHERE task_id IN ('P3F5', 'P3BA24', 'P3BA25', 'P3BA26', 'P3F6')
GROUP BY area
ORDER BY area;
