#!/usr/bin/env python3
import os, sys
from supabase import create_client

if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

try:
    result = supabase.table('project_grid_tasks_revised').select('*').eq('task_id', 'P1FA2').execute()
    
    if result.data:
        print("Found task P1FA2")
        print(f"Current status: {result.data[0].get('status')}")
        print(f"Current progress: {result.data[0].get('progress')}")
    else:
        print("Task P1FA2 not found")
except Exception as e:
    print(f"Error: {str(e)}")
