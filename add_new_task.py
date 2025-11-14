#!/usr/bin/env python3
import os, sys
from supabase import create_client
from datetime import datetime

if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

new_task = {
    "phase": 3,
    "area": "F",
    "task_id": "P3F1",
    "task_name": "커뮤니티 게시글 상세 페이지 UI 개선",
    "instruction_file": None,
    "assigned_agent": "frontend-developer",
    "tools": ["Read", "Write", "Edit"],
    "work_mode": "single",
    "dependency_chain": ["P3BA3"],
    "progress": 100,
    "status": "완료",
    "generated_files": ["1_Frontend/src/app/community/posts/[id]/page.tsx"],
    "generator": "Claude Code",
    "duration": "30분",
    "modification_history": None,
    "test_history": "Build 성공",
    "build_result": "성공",
    "dependency_propagation": None,
    "blocker": None,
    "validation_result": "통과",
    "phase_gate_criteria": None,
    "remarks": f"[{datetime.now().strftime('%Y-%m-%d')}] 회원 자유게시판 댓글 UI 개선 - 정치인/회원 댓글 구분 제거, 게시판 유형에 따른 댓글 UI 조건부 렌더링 (isPolitician 플래그 기반)",
    "created_at": datetime.now().isoformat(),
    "updated_at": datetime.now().isoformat()
}

try:
    result = supabase.table('project_grid_tasks_revised').insert(new_task).execute()
    
    print(f"[OK] New task created: {new_task['task_id']}")
    print(f"  Task name: {new_task['task_name']}")
    print(f"  Phase: {new_task['phase']}")
    print(f"  Area: {new_task['area']}")
    print(f"  Status: {new_task['status']}")
    print(f"  Progress: {new_task['progress']}%")
    print(f"  Remarks: {new_task['remarks'][:80]}...")
except Exception as e:
    print(f"[ERROR] Failed to create task: {str(e)}")
