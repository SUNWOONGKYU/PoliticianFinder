// 7개 신규 태스크를 Supabase에 등록하는 스크립트
// 실행: node run_insert_7_tasks.js

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ooddlafwdpzgxfefgsrx.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA3MDc5NTYsImV4cCI6MjA0NjI4Mzk1Nn0.dq9kdQ0J2XS8S-qIJI0VfvCnlsaJMvPsP8q_HCyXcbY';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const tasks = [
  {
    phase: 3,
    area: 'F',
    task_id: 'P3F3',
    task_name: 'status 필드 제거 및 identity/title 분리 작업',
    instruction_file: 'tasks/P3F3.md',
    assigned_agent: '1차: frontend-developer | 2차: Claude Code(실행 및 검증)',
    tools: 'Read, Write, Edit, Bash, Glob, Grep',
    work_mode: 'Code',
    dependency_chain: 'P2D1 → P3F3',
    progress: 80,
    status: '진행중',
    generated_files: '1_Frontend/src/app/api/politicians/route.ts (수정), 1_Frontend/src/app/api/politicians/[id]/route.ts (수정), 1_Frontend/src/app/politicians/[id]/page.tsx (수정), 1_Frontend/src/types/politician.ts (신규)',
    generator: 'Claude Code',
    duration: '6시간',
    modification_history: '2025-12-12: 초기 생성',
    test_history: '최종: Build ✅ + Type ✅',
    build_result: '✅ 성공',
    dependency_propagation: '✅ 완료',
    blocker: '없음',
    validation_result: '✅ 통과',
    remarks: 'status 필드(신분/직책 결합)를 identity(신분)와 title(직책)로 분리. 데이터 구조 근본적 개선.'
  },
  {
    phase: 3,
    area: 'F',
    task_id: 'P3F4',
    task_name: '정치인 데이터 스키마 완성 및 필드 매핑 작업',
    instruction_file: 'tasks/P3F4.md',
    assigned_agent: '1차: frontend-developer | 2차: Claude Code(실행 및 검증)',
    tools: 'Read, Write, Edit, Bash, Glob, Grep',
    work_mode: 'Code',
    dependency_chain: 'P2D1 → P3F4',
    progress: 100,
    status: '완료',
    generated_files: '1_Frontend/src/utils/fieldMapper.ts (신규), 1_Frontend/src/types/politician.ts (신규), 1_Frontend/src/app/api/politicians/[id]/route.ts (수정), add_politician_official_info_fields.sql (신규)',
    generator: 'Claude Code',
    duration: '3.5시간',
    modification_history: '2025-11-14: 초기 생성, 2025-11-15: 완료',
    test_history: '최종: Build ✅ + Type ✅ + API Test ✅',
    build_result: '✅ 성공',
    dependency_propagation: '✅ 완료',
    blocker: '없음',
    validation_result: '✅ 통과',
    remarks: '11개 필드 추가, snake_case→camelCase 매핑, 계산 필드(age, postCount 등) 구현.'
  },
  {
    phase: 3,
    area: 'BA',
    task_id: 'P3BA33',
    task_name: 'V24.0 AI 평가 점수 등급-이모지 불일치 버그 수정',
    instruction_file: 'tasks/P3BA33.md',
    assigned_agent: '1차: backend-developer | 2차: Claude Code(실행 및 검증)',
    tools: 'Read, Write, Edit, Bash, Glob, Grep',
    work_mode: 'Code',
    dependency_chain: 'P3BA2 → P3BA33',
    progress: 100,
    status: '완료',
    generated_files: '1_Frontend/src/app/api/politicians/[id]/route.ts (수정), 1_Frontend/src/lib/database.types.ts (수정)',
    generator: 'Claude Code',
    duration: '1.5시간',
    modification_history: '2025-11-26: 버그 수정 완료. Git: 17f58d5',
    test_history: '최종: Build ✅ + API Test ✅',
    build_result: '✅ 성공',
    dependency_propagation: '✅ 완료',
    blocker: '없음',
    validation_result: '✅ 통과',
    remarks: '점수-등급 불일치 해결. DB의 grade_code 대신 API에서 점수 기반 등급 재계산.'
  },
  {
    phase: 3,
    area: 'BA',
    task_id: 'P3BA34',
    task_name: 'V24.0 AI 점수 목록 API 통합',
    instruction_file: 'tasks/P3BA34.md',
    assigned_agent: '1차: backend-developer | 2차: Claude Code(실행 및 검증)',
    tools: 'Read, Write, Edit, Bash, Glob, Grep',
    work_mode: 'Code',
    dependency_chain: 'P3BA33 → P3BA34',
    progress: 100,
    status: '완료',
    generated_files: '1_Frontend/src/app/api/politicians/route.ts (수정), 1_Frontend/src/utils/fieldMapper.ts (수정)',
    generator: 'Claude Code',
    duration: '1.5시간',
    modification_history: '2025-11-27: 완료. Git: d0b8fb9',
    test_history: '최종: Build ✅ + API Test ✅',
    build_result: '✅ 성공',
    dependency_propagation: '✅ 완료',
    blocker: '없음',
    validation_result: '✅ 통과',
    remarks: '목록 API에서 ai_final_scores 테이블 조회 추가. calculateV24Grade() 함수 구현.'
  },
  {
    phase: 3,
    area: 'BA',
    task_id: 'P3BA35',
    task_name: '정치인 상세 페이지 하드코딩된 점수 제거',
    instruction_file: 'tasks/P3BA35.md',
    assigned_agent: '1차: frontend-developer | 2차: Claude Code(실행 및 검증)',
    tools: 'Read, Write, Edit, Bash, Glob, Grep',
    work_mode: 'Code',
    dependency_chain: 'P3BA33 → P3BA34 → P3BA35',
    progress: 100,
    status: '완료',
    generated_files: '1_Frontend/src/app/politicians/[id]/page.tsx (수정), 1_Frontend/src/types/politician.ts (수정)',
    generator: 'Claude Code',
    duration: '1.5시간',
    modification_history: '2025-11-27: 완료. Git: e3b45ca',
    test_history: '최종: Build ✅ + Manual Test ✅',
    build_result: '✅ 성공',
    dependency_propagation: '✅ 완료',
    blocker: '없음',
    validation_result: '✅ 통과',
    remarks: 'AI_SCORES, CATEGORY_SCORES 하드코딩 제거. Claude AI만 사용. 실제 API 데이터 표시.'
  },
  {
    phase: 3,
    area: 'BA',
    task_id: 'P3BA36',
    task_name: '팔로우 시스템 백엔드 구현',
    instruction_file: 'tasks/P3BA36.md',
    assigned_agent: '1차: backend-developer | 2차: Claude Code(실행 및 검증)',
    tools: 'Read, Write, Edit, Bash, Glob, Grep',
    work_mode: 'Code',
    dependency_chain: 'P2D1 → P3BA36',
    progress: 100,
    status: '완료',
    generated_files: '0-4_Database/Supabase/migrations/060_follow_system_complete.sql (신규), 1_Frontend/src/app/api/users/[id]/follow/route.ts (신규), 1_Frontend/src/app/api/users/[id]/followers/route.ts (신규), 1_Frontend/src/app/api/users/[id]/following/route.ts (신규), 1_Frontend/src/app/api/users/[id]/stats/route.ts (신규)',
    generator: 'Claude Code',
    duration: '3.5시간',
    modification_history: '2025-12-12: 완료',
    test_history: '최종: Build ✅ + DB Migration ✅ + API Test ✅',
    build_result: '✅ 성공',
    dependency_propagation: '✅ 완료',
    blocker: '없음',
    validation_result: '✅ 통과',
    remarks: '회원 간 팔로우 시스템 백엔드. follows 테이블, 활동포인트 자동 지급, 영향력 등급 계산.'
  },
  {
    phase: 3,
    area: 'BA',
    task_id: 'P3BA37',
    task_name: '팔로우 시스템 프론트엔드 및 실시간 기능',
    instruction_file: 'tasks/P3BA37.md',
    assigned_agent: '1차: fullstack-developer | 2차: Claude Code(실행 및 검증)',
    tools: 'Read, Write, Edit, Bash, Glob, Grep',
    work_mode: 'Code',
    dependency_chain: 'P3BA36 → P3BA37',
    progress: 60,
    status: '진행중',
    generated_files: '1_Frontend/src/components/FollowButton.tsx (신규), 1_Frontend/src/components/GradeUpgradeModal.tsx (신규), 1_Frontend/src/app/users/[id]/followers/page.tsx (신규), 1_Frontend/src/app/users/[id]/following/page.tsx (신규), 1_Frontend/src/app/mypage/page.tsx (수정)',
    generator: 'Claude Code',
    duration: '3시간 (진행중)',
    modification_history: '2025-12-12: 60% 완료',
    test_history: '1차: Build ✅ | 등급 모달/토스트 구현 중',
    build_result: '✅ 성공',
    dependency_propagation: '⏳ 진행중',
    blocker: '없음',
    validation_result: '⏳ 진행중',
    remarks: 'FollowButton, 팔로워/팔로잉 목록 페이지, 마이페이지 연동 완료. 등급 승급 모달, 실시간 알림 구현 중.'
  }
];

async function insertTasks() {
  console.log('7개 신규 태스크 등록 시작...\n');

  for (const task of tasks) {
    console.log(`등록 중: ${task.task_id} - ${task.task_name}`);

    const { data, error } = await supabase
      .from('project_grid_tasks_revised')
      .insert([task])
      .select();

    if (error) {
      if (error.code === '23505') {
        console.log(`  ⚠️ 이미 존재: ${task.task_id}`);
      } else {
        console.log(`  ❌ 오류: ${error.message}`);
      }
    } else {
      console.log(`  ✅ 등록 완료: ${task.task_id}`);
    }
  }

  // 전체 개수 확인
  const { count } = await supabase
    .from('project_grid_tasks_revised')
    .select('*', { count: 'exact', head: true });

  console.log(`\n전체 태스크 개수: ${count}개`);

  // 등록된 7개 확인
  const { data: newTasks } = await supabase
    .from('project_grid_tasks_revised')
    .select('task_id, task_name, status, progress')
    .in('task_id', ['P3F3', 'P3F4', 'P3BA33', 'P3BA34', 'P3BA35', 'P3BA36', 'P3BA37'])
    .order('task_id');

  console.log('\n등록된 신규 태스크:');
  console.table(newTasks);
}

insertTasks().catch(console.error);
