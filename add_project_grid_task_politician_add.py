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
    "task_id": "P3F2",
    "task_name": "새 정치인 추가 기능 (관리자)",
    "instruction_file": None,
    "assigned_agent": "frontend-developer + backend-developer",
    "tools": ["Read", "Write", "Edit"],
    "work_mode": "single",
    "dependency_chain": ["P3BA3"],
    "progress": 100,
    "status": "완료",
    "generated_files": [
        "1_Frontend/src/app/admin/politicians/page.tsx (모달 UI)",
        "1_Frontend/src/app/api/admin/politicians/route.ts (POST API)",
        "add_politician_fields.sql (DB 마이그레이션)"
    ],
    "generator": "Claude Code",
    "duration": "90분",
    "modification_history": None,
    "test_history": "Build 성공",
    "build_result": "성공",
    "dependency_propagation": None,
    "blocker": None,
    "validation_result": "통과",
    "phase_gate_criteria": None,
    "remarks": f"""[{datetime.now().strftime('%Y-%m-%d')}] 새 정치인 추가 기능 구현 완료
- 관리자 페이지에 모달 폼 추가 (이름, 정당, 출마직종, 지역, 신분, 직책, 생년월일, 성별)
- POST /api/admin/politicians API 구현 (Service Role Key, RLS 우회, 중복 확인)
- DB 컬럼 추가: identity(신분), title(직책), gender(성별)
- identity/title 별도 저장하면서 status 필드도 조합하여 저장 (하위 호환성)
- 기본 정보 수동 입력, 상세 정보는 데이터 수집 프로세스로 자동 채움 (추후 구현)""",
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
    print(f"  Files generated: {len(new_task['generated_files'])} files")
except Exception as e:
    print(f"[ERROR] Failed to create task: {str(e)}")
