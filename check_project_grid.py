#!/usr/bin/env python3
"""Check all bugfixes recorded in project_grid_tasks_revised"""

from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv('1_Frontend/.env.local')

SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

supabase = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)

# 모든 BUGFIX 조회
print('=== All BUGFIX tasks in project_grid_tasks_revised ===\n')
result = supabase.table('project_grid_tasks_revised').select('*').like('task_id', 'BUGFIX%').order('task_id').execute()

for task in result.data:
    print(f"Task ID: {task['task_id']}")
    print(f"Name: {task['task_name']}")
    print(f"Status: {task['status']}")
    print(f"Progress: {task['progress']}%")
    print(f"Phase: {task['phase']}")
    print(f"Area: {task['area']}")
    print(f"Agent: {task['assigned_agent']}")
    print(f"Build: {task['build_result']}")
    print('---\n')

print(f'\nTotal BUGFIX tasks: {len(result.data)}')

# 전체 작업 수 확인
total_result = supabase.table('project_grid_tasks_revised').select('task_id').execute()
print(f'Total tasks in project_grid: {len(total_result.data)}')
