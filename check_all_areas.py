#!/usr/bin/env python3
import os, sys
from supabase import create_client

if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Get all unique areas
result = supabase.table('project_grid_tasks_revised').select('area').execute()

areas = set()
for task in result.data:
    areas.add(task['area'])

print("All areas in project grid:")
for area in sorted(areas):
    print(f"  - {area}")

# Count tasks by phase and area
print("\n\nTasks by Phase and Area:\n")
for phase in [1, 2, 3, 4]:
    result = supabase.table('project_grid_tasks_revised').select('area, task_id, task_name').eq('phase', phase).order('task_id').execute()
    
    if result.data:
        print(f"Phase {phase}:")
        for task in result.data:
            print(f"  {task['task_id']} ({task['area']}): {task['task_name']}")
        print()
