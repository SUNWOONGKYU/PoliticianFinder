#!/usr/bin/env python3
import os, sys
from supabase import create_client
from datetime import datetime

if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

tasks = ['P1BA3', 'P1BA4', 'P3BA3']
today = datetime.now().strftime('%Y-%m-%d')

print(f"Verifying updates for {today}:\n")

for task_id in tasks:
    result = supabase.table('project_grid_tasks_revised').select('task_id, task_name, status, progress, remarks').eq('task_id', task_id).execute()
    
    if result.data:
        task = result.data[0]
        print(f"{task['task_id']}: {task['task_name']}")
        print(f"  Status: {task['status']}")
        print(f"  Progress: {task['progress']}%")
        if task.get('remarks'):
            remarks = task['remarks']
            if f"[{today}]" in remarks:
                print(f"  Latest remark: Updated today")
                lines = remarks.split('\n')
                for line in lines:
                    if f"[{today}]" in line:
                        print(f"  {line}")
        print()
