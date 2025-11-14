#!/usr/bin/env python3
"""
Register P3F4 task to project_grid_tasks_revised database
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv('1_Frontend/.env.local')

# Initialize Supabase client
supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_key:
    print("Error: Missing Supabase credentials")
    exit(1)

supabase: Client = create_client(supabase_url, supabase_key.strip())

# P3F4 task data
task_data = {
    "task_id": "P3F4",
    "phase": 3,
    "area": "F",
    "task_description": "정치인 데이터 스키마 완성 및 필드 매핑",
    "task_instruction_file": "0-5_Development_ProjectGrid/tasks/P3F4.md",
    "assigned_agent": "fullstack-developer",
    "tools": "Next.js/TypeScript/Supabase/PostgreSQL",
    "work_mode": "AI-Only",
    "dependency_chain": None,  # P3F3와 병렬 가능
    "progress": 0,
    "status": "대기",
    "generated_files": None,
    "code_generator": None,
    "duration": None,
    "modification_history": "-",
    "test_history": "-",
    "build_result": "⏳ 대기",
    "dependency_propagation": "✅ 이행",  # 선행 작업 없음
    "blocker": "없음",
    "comprehensive_validation_result": "⏳ 대기",
    "remarks": "snake_case(DB) ↔ camelCase(Frontend) 필드명 자동 변환, 선관위 공식 정보 11개 필드 추가"
}

# Check if P3F4 already exists
existing = supabase.table('project_grid_tasks_revised').select('task_id').eq('task_id', 'P3F4').execute()

if existing.data and len(existing.data) > 0:
    print("P3F4 task already exists. Updating...")
    result = supabase.table('project_grid_tasks_revised').update(task_data).eq('task_id', 'P3F4').execute()
    print(f"✅ P3F4 task updated successfully")
else:
    print("P3F4 task does not exist. Creating...")
    result = supabase.table('project_grid_tasks_revised').insert(task_data).execute()
    print(f"✅ P3F4 task created successfully")

# Display the registered task
print("\n=== Registered P3F4 Task ===")
print(f"Task ID: {task_data['task_id']}")
print(f"Phase: {task_data['phase']}")
print(f"Area: {task_data['area']}")
print(f"Description: {task_data['task_description']}")
print(f"Instruction File: {task_data['task_instruction_file']}")
print(f"Assigned Agent: {task_data['assigned_agent']}")
print(f"Tools: {task_data['tools']}")
print(f"Status: {task_data['status']}")
print(f"Progress: {task_data['progress']}%")
print(f"Dependency: {task_data['dependency_chain'] or 'None (병렬 가능)'}")
print(f"Remarks: {task_data['remarks']}")
