#!/usr/bin/env python3
"""
Update P3F3 task completion in project_grid_tasks_revised database
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv('1_Frontend/.env.local')

# Initialize Supabase client
supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_key:
    print("Error: Missing Supabase credentials")
    exit(1)

supabase: Client = create_client(supabase_url, supabase_key.strip())

# P3F3 task completion data
p3f3_complete = {
    "task_id": "P3F3",
    "phase": 3,
    "area": "F",
    "task_name": "status 필드 제거 및 identity/title 분리",
    "instruction_file": "0-5_Development_ProjectGrid/tasks/P3F3.md",
    "assigned_agent": "Claude Code (Sonnet 4.5)",
    "tools": "Next.js/TypeScript/Supabase/PostgreSQL",
    "work_mode": "AI-Only",
    "dependency_chain": None,
    "progress": 100,
    "status": "완료",
    "generated_files": """
1. 1_Frontend/src/app/api/politicians/[id]/route.ts (수정)
2. 1_Frontend/src/app/api/politicians/route.ts (수정)
3. 1_Frontend/src/app/politicians/page.tsx (수정 - 9군데)
4. 1_Frontend/src/app/politicians/[id]/page.tsx (수정)
5. 1_Frontend/src/app/page.tsx (수정 - 다수)
6. 1_Frontend/src/app/search/search-content.tsx (수정)
7. 1_Frontend/src/app/favorites/page.tsx (수정)
8. 1_Frontend/src/app/community/page.tsx (이전 완료)
""".strip(),
    "generator": "Claude Code (Sonnet 4.5)",
    "duration": "약 45분",
    "modification_history": "[v1.0] DB 필드 추가 (identity, title, gender) | [v2.0] 전체 Frontend 페이지 status->identity/title 분리 완료",
    "test_history": "Build: 성공 (TypeScript 에러 없음) | Dev Server: 정상 작동",
    "build_result": "[OK] 성공",
    "dependency_propagation": "[OK] 이행",
    "blocker": "없음",
    "validation_result": "[OK] 통과",
    "remarks": "정치인 신분(identity)과 직책(title)을 독립 필드로 분리 완료. API 2개, Frontend 페이지 6개 수정."
}

print("=== Updating P3F3 Task to Completed ===")
result = supabase.table('project_grid_tasks_revised').update(p3f3_complete).eq('task_id', 'P3F3').execute()

print("[OK] P3F3 task updated successfully")
print(f"  - Task Name: {p3f3_complete['task_name']}")
print(f"  - Status: {p3f3_complete['status']}")
print(f"  - Progress: {p3f3_complete['progress']}%")
print(f"  - Build Result: {p3f3_complete['build_result']}")
print(f"  - Duration: {p3f3_complete['duration']}")
print(f"  - Generated Files: 8개 파일 수정")
print("\nP3F3 작업이 프로젝트 그리드에 완료로 표시되었습니다.")
