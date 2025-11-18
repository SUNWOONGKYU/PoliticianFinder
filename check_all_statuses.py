#!/usr/bin/env python3
import os, sys
from supabase import create_client
if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

print("=" * 80)
print("프로젝트 그리드 전체 상태 조회")
print("=" * 80)
print()

# 모든 Task 조회
result = supabase.table('project_grid_tasks_revised').select('task_id, task_name, status, progress, phase, area').execute()

if not result.data:
    print("Task가 없습니다.")
else:
    # 상태별로 그룹화
    status_groups = {}
    for task in result.data:
        status = task.get('status', '미정')
        if status not in status_groups:
            status_groups[status] = []
        status_groups[status].append(task)

    print(f"총 {len(result.data)}개의 Task")
    print()

    # 상태별 출력
    for status, tasks in sorted(status_groups.items()):
        print(f"📊 [{status}] - {len(tasks)}개")
        for task in tasks[:5]:  # 각 상태별로 최대 5개만 표시
            print(f"   • {task.get('task_id')}: {task.get('task_name')} (Phase {task.get('phase')}, {task.get('progress', 0)}%)")
        if len(tasks) > 5:
            print(f"   ... 외 {len(tasks) - 5}개")
        print()

print("=" * 80)
