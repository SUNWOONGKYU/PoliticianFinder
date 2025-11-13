from supabase import create_client
from datetime import datetime
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

bug_fix_3 = {
    "date": "2025-11-13",
    "type": "Bug Fix - Schema Mismatch",
    "executor": "Claude Code",
    "description": "Users API status filter schema mismatch fix",
    "issue": "API looking for 'status' column but DB has 'is_active' and 'is_banned'",
    "root_cause": "DB schema uses is_active/is_banned but API expected status enum",
    "fix": "Mapped status parameter to correct columns (active/banned/suspended)",
    "files_modified": [
        "1_Frontend/src/app/api/admin/users/route.ts"
    ],
    "git_commit": "0114255",
    "status": "resolved"
}

try:
    response = supabase.table('project_grid_tasks_revised').select('*').eq('task_id', 'P1BA4').execute()
    
    if response.data and len(response.data) > 0:
        task = response.data[0]
        existing_history = task.get('modification_history')
        if existing_history is None:
            existing_history = []
        elif isinstance(existing_history, str):
            try:
                existing_history = json.loads(existing_history)
            except:
                existing_history = []
        
        existing_history.append(bug_fix_3)
        
        update_data = {
            "modification_history": existing_history,
            "test_history": "API(5/5)+Fix(3)@CC",
            "updated_at": datetime.now().isoformat()
        }
        
        result = supabase.table('project_grid_tasks_revised').update(update_data).eq('task_id', 'P1BA4').execute()
        
        print("OK P1BA4 updated with 3rd bug fix")
        print("   - Issue: Schema mismatch (status vs is_active/is_banned)")
        print("   - Fix: Status mapping added")
        print("   - Commit: 0114255")
        print("   - Test: API(5/5)+Fix(3)@CC")
        
    else:
        print("ERROR: P1BA4 not found")
        
except Exception as e:
    print(f"ERROR: {e}")
