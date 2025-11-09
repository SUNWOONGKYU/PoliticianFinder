-- ============================================
-- Phase Gates 추가 (2025-11-04)
-- ============================================
-- 각 Phase 끝에 승인 게이트 추가
-- 실행 방법: Supabase SQL Editor에서 복사-붙여넣기

-- Phase 1 Gate (P1GATE)
INSERT INTO public.project_grid_tasks (
  phase, area, task_id, task_name, instruction_file, assigned_agent, tools, work_mode,
  dependency_chain, progress, status, generated_files, generator, duration, modification_history,
  test_history, build_result, dependency_propagation, blocker, validation_result, remarks
) VALUES (
  1, 'GATE', 'P1GATE', 'Phase 1 Gate', 'tasks/P1GATE.md',
  'Main Agent', 'Project Grid Review', 'AI-Only',
  'P1O1,P1D5,P1BI3,P1BA4,P1F5,P1T2', 0, '대기', '-', '-', '-', '-',
  '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'Phase 1 최종 승인 게이트'
);

-- Phase 2 Gate (P2GATE)
INSERT INTO public.project_grid_tasks (
  phase, area, task_id, task_name, instruction_file, assigned_agent, tools, work_mode,
  dependency_chain, progress, status, generated_files, generator, duration, modification_history,
  test_history, build_result, dependency_propagation, blocker, validation_result, remarks
) VALUES (
  2, 'GATE', 'P2GATE', 'Phase 2 Gate', 'tasks/P2GATE.md',
  'Main Agent', 'Project Grid Review', 'AI-Only',
  'P2O1,P2D7,P2BA11,P2F3,P2T2', 0, '대기', '-', '-', '-', '-',
  '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'Phase 2 최종 승인 게이트'
);

-- Phase 3 Gate (P3GATE)
INSERT INTO public.project_grid_tasks (
  phase, area, task_id, task_name, instruction_file, assigned_agent, tools, work_mode,
  dependency_chain, progress, status, generated_files, generator, duration, modification_history,
  test_history, build_result, dependency_propagation, blocker, validation_result, remarks
) VALUES (
  3, 'GATE', 'P3GATE', 'Phase 3 Gate', 'tasks/P3GATE.md',
  'Main Agent', 'Project Grid Review', 'AI-Only',
  'P3O1,P3D8,P3BA13,P3F6,P3T4', 0, '대기', '-', '-', '-', '-',
  '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'Phase 3 최종 승인 게이트'
);

-- Phase 4 Gate (P4GATE)
INSERT INTO public.project_grid_tasks (
  phase, area, task_id, task_name, instruction_file, assigned_agent, tools, work_mode,
  dependency_chain, progress, status, generated_files, generator, duration, modification_history,
  test_history, build_result, dependency_propagation, blocker, validation_result, remarks
) VALUES (
  4, 'GATE', 'P4GATE', 'Phase 4 Gate', 'tasks/P4GATE.md',
  'Main Agent', 'Project Grid Review', 'AI-Only',
  'P4O1,P4D3,P4BA5,P4F3,P4T2', 0, '대기', '-', '-', '-', '-',
  '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'Phase 4 최종 승인 게이트'
);

-- Phase 5 Gate (P5GATE)
INSERT INTO public.project_grid_tasks (
  phase, area, task_id, task_name, instruction_file, assigned_agent, tools, work_mode,
  dependency_chain, progress, status, generated_files, generator, duration, modification_history,
  test_history, build_result, dependency_propagation, blocker, validation_result, remarks
) VALUES (
  5, 'GATE', 'P5GATE', 'Phase 5 Gate', 'tasks/P5GATE.md',
  'Main Agent', 'Project Grid Review', 'AI-Only',
  'P5BA6,P5D2,P5F2,P5T2', 0, '대기', '-', '-', '-', '-',
  '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'Phase 5 최종 승인 게이트'
);

-- Phase 6 Gate (P6GATE)
INSERT INTO public.project_grid_tasks (
  phase, area, task_id, task_name, instruction_file, assigned_agent, tools, work_mode,
  dependency_chain, progress, status, generated_files, generator, duration, modification_history,
  test_history, build_result, dependency_propagation, blocker, validation_result, remarks
) VALUES (
  6, 'GATE', 'P6GATE', 'Phase 6 Gate', 'tasks/P6GATE.md',
  'Main Agent', 'Project Grid Review', 'AI-Only',
  'P6O1,P6D3,P6BA10,P6F7,P6T3', 0, '대기', '-', '-', '-', '-',
  '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'Phase 6 최종 승인 게이트'
);

-- Phase 7 Gate (P7GATE)
INSERT INTO public.project_grid_tasks (
  phase, area, task_id, task_name, instruction_file, assigned_agent, tools, work_mode,
  dependency_chain, progress, status, generated_files, generator, duration, modification_history,
  test_history, build_result, dependency_propagation, blocker, validation_result, remarks
) VALUES (
  7, 'GATE', 'P7GATE', 'Phase 7 Gate - 최종 완료', 'tasks/P7GATE.md',
  'Main Agent', 'Project Grid Review', 'AI-Only',
  'P7O4,P7D2,P7BA4,P7F5,P7T1', 0, '대기', '-', '-', '-', '-',
  '대기', '⏳ 대기', '⏳ 대기', '없음', '⏳ 대기', 'Phase 7 최종 완료 게이트'
);
