#!/usr/bin/env python3
import os, sys
from supabase import create_client

if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Search for all Frontend tasks
result = supabase.table('project_grid_tasks_revised').select('phase, area, task_id, task_name, instruction_file').in_('area', ['FE', 'FA']).order('task_id').execute()

print("All Frontend (FE/FA) tasks:\n")
for task in result.data:
    print(f"Phase {task['phase']} - {task['task_id']}: {task['task_name']}")
    if task.get('instruction_file'):
        print(f"  File: {task['instruction_file']}")
    print()

# Also check for UI/UX tasks
result2 = supabase.table('project_grid_tasks_revised').select('phase, area, task_id, task_name').eq('area', 'UI').order('task_id').execute()

print("\nAll UI tasks:\n")
for task in result2.data:
    print(f"Phase {task['phase']} - {task['task_id']}: {task['task_name']}")
    print()
