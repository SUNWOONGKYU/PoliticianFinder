#!/usr/bin/env python3
"""
Check for incomplete tasks in project grid
"""

import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv('1_Frontend/.env.local')
supabase = create_client(
    os.environ.get('NEXT_PUBLIC_SUPABASE_URL'),
    os.environ.get('SUPABASE_SERVICE_ROLE_KEY').strip()
)

result = supabase.table('project_grid_tasks_revised') \
    .select('task_id, task_name, status, progress, phase, area, assigned_agent, blocker') \
    .order('phase') \
    .order('task_id') \
    .execute()

print('=== Project Grid Tasks Summary ===\n')

incomplete = []
complete = []

for task in result.data:
    prog = task.get('progress', 0) or 0
    status = task.get('status', 'N/A')

    if prog < 100 or status != '완료':
        incomplete.append(task)
    else:
        complete.append(task)

print(f'Total Tasks: {len(result.data)}')
print(f'Complete: {len(complete)}')
print(f'Incomplete: {len(incomplete)}\n')

if incomplete:
    print('=== Incomplete Tasks ===\n')
    for task in incomplete:
        prog = task.get('progress', 0) or 0
        agent = task.get('assigned_agent', 'N/A')
        blocker = task.get('blocker', 'None')
        print(f"[Phase {task['phase']}] {task['task_id']} ({prog}%) - {task['task_name']}")
        print(f"  Status: {task.get('status', 'N/A')}")
        print(f"  Agent: {agent}")
        if blocker and blocker != 'None' and blocker != '없음':
            print(f"  Blocker: {blocker}")
        print()
else:
    print('✅ All tasks complete!')
    print('\n=== Next Steps ===')
    print('1. Run manual DB migration for P3F4')
    print('2. Deploy to production')
    print('3. Monitor and gather user feedback')
