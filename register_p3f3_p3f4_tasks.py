#!/usr/bin/env python3
"""
Register/Update P3F3 and P3F4 tasks in project_grid_tasks_revised database
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

# P3F3 task data (Update existing)
p3f3_data = {
    "task_id": "P3F3",
    "phase": 3,
    "area": "F",
    "task_name": "status 필드 제거 및 identity/title 분리",
    "instruction_file": "0-5_Development_ProjectGrid/tasks/P3F3.md",
    "assigned_agent": "fullstack-developer",
    "tools": "Next.js/TypeScript/Supabase/PostgreSQL",
    "work_mode": "AI-Only",
    "dependency_chain": None,
    "progress": 10,
    "status": "진행 중",
    "generated_files": None,
    "generator": None,
    "duration": None,
    "modification_history": "[v1.0] DB 필드 추가 (identity, title, gender)",
    "test_history": "-",
    "build_result": "⏳ 대기",
    "dependency_propagation": "✅ 이행",
    "blocker": "없음",
    "validation_result": "⏳ 대기",
    "remarks": "정치인 신분과 직책을 독립 필드로 분리하여 각각 변경 가능하도록 개선"
}

# P3F4 task data (New)
p3f4_data = {
    "task_id": "P3F4",
    "phase": 3,
    "area": "F",
    "task_name": "정치인 데이터 스키마 완성 및 필드 매핑",
    "instruction_file": "0-5_Development_ProjectGrid/tasks/P3F4.md",
    "assigned_agent": "fullstack-developer",
    "tools": "Next.js/TypeScript/Supabase/PostgreSQL",
    "work_mode": "AI-Only",
    "dependency_chain": None,  # P3F3와 병렬 가능
    "progress": 0,
    "status": "대기",
    "generated_files": None,
    "generator": None,
    "duration": None,
    "modification_history": "-",
    "test_history": "-",
    "build_result": "⏳ 대기",
    "dependency_propagation": "✅ 이행",  # 선행 작업 없음
    "blocker": "없음",
    "validation_result": "⏳ 대기",
    "remarks": "snake_case(DB) ↔ camelCase(Frontend) 필드명 자동 변환, 선관위 공식 정보 11개 필드 추가"
}

print("=== Updating P3F3 Task ===")
result_p3f3 = supabase.table('project_grid_tasks_revised').update(p3f3_data).eq('task_id', 'P3F3').execute()
print("[OK] P3F3 task updated successfully")
print(f"  - Task Name: {p3f3_data['task_name']}")
print(f"  - Status: {p3f3_data['status']}")
print(f"  - Progress: {p3f3_data['progress']}%")
print(f"  - Instruction: {p3f3_data['instruction_file']}")

print("\n=== Creating P3F4 Task ===")
# Check if P3F4 already exists
existing_p3f4 = supabase.table('project_grid_tasks_revised').select('task_id').eq('task_id', 'P3F4').execute()

if existing_p3f4.data and len(existing_p3f4.data) > 0:
    print("P3F4 already exists. Updating...")
    result_p3f4 = supabase.table('project_grid_tasks_revised').update(p3f4_data).eq('task_id', 'P3F4').execute()
    print("[OK] P3F4 task updated successfully")
else:
    print("P3F4 does not exist. Creating...")
    result_p3f4 = supabase.table('project_grid_tasks_revised').insert(p3f4_data).execute()
    print("[OK] P3F4 task created successfully")

print(f"  - Task Name: {p3f4_data['task_name']}")
print(f"  - Status: {p3f4_data['status']}")
print(f"  - Progress: {p3f4_data['progress']}%")
print(f"  - Instruction: {p3f4_data['instruction_file']}")

print("\n=== Summary ===")
print("[OK] P3F3: status 필드 제거 및 identity/title 분리 (진행 중 10%)")
print("[OK] P3F4: 정치인 데이터 스키마 완성 및 필드 매핑 (대기 0%)")
print("\n두 태스크 모두 프로젝트 그리드에 정상적으로 등록되었습니다.")
