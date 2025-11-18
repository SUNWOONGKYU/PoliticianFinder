#!/usr/bin/env python3
import os, sys
from supabase import create_client
if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

print("=" * 80)
print("검증 대기 중인 Task 조회")
print("=" * 80)
print()

# 검증 대기 중 상태 조회
result = supabase.table('project_grid_tasks_revised').select('*').eq('status', '검증 대기 중').execute()

if not result.data:
    print("검증 대기 중인 Task가 없습니다.")
else:
    print(f"총 {len(result.data)}개의 검증 대기 중 Task 발견")
    print()

    for idx, task in enumerate(result.data, 1):
        print(f"{idx}. Task ID: {task.get('task_id')}")
        print(f"   Task Name: {task.get('task_name')}")
        print(f"   Phase: {task.get('phase')}")
        print(f"   Area: {task.get('area')}")
        print(f"   Progress: {task.get('progress', 0)}%")
        print(f"   Expected Results: {task.get('expected_results', 'N/A')}")
        print(f"   Generated Files: {task.get('generated_files', 'N/A')}")
        print()

print("=" * 80)
