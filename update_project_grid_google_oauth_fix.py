#!/usr/bin/env python3
import os, sys
from supabase import create_client
from datetime import datetime
if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

print("=" * 80)
print("Google OAuth Login Fix - Project Grid Update")
print("Date: 2025-11-18")
print("=" * 80)
print()

task_id = "P3BA1"

# Get current task info
result = supabase.table('project_grid_tasks_revised').select('*').eq('task_id', task_id).execute()

if not result.data:
    print(f"[ERROR] Task {task_id} not found")
    sys.exit(1)

current = result.data[0]

print(f"Current Status:")
print(f"  Task ID: {current.get('task_id')}")
print(f"  Task Name: {current.get('task_name')}")
print(f"  Status: {current.get('status')}")
print(f"  Progress: {current.get('progress')}%")
print()

# New remark to add
new_remark = "[2025-11-18 Bugfix] Google OAuth 404 error fixed - Dynamic redirect URL implementation (origin from request.url instead of hardcoded NEXT_PUBLIC_SITE_URL). Works on all Vercel deployment URLs. Commit: c6e70c4"

# Prepare update data
update_data = {
    'updated_at': datetime.now().isoformat()
}

# Append new remark to existing remarks
existing_remarks = current.get('remarks', '') or ''
if existing_remarks:
    update_data['remarks'] = f"{existing_remarks}\n{new_remark}"
else:
    update_data['remarks'] = new_remark

# Execute update
try:
    supabase.table('project_grid_tasks_revised').update(update_data).eq('task_id', task_id).execute()

    print("[OK] Update Complete!")
    print()
    print(f"Update Details:")
    print(f"  Task: {task_id} - {current.get('task_name')}")
    print(f"  Status: {current.get('status')} (Maintained)")
    print(f"  Progress: {current.get('progress')}% (Maintained)")
    print()
    print("New Remark Added:")
    print(f"  {new_remark}")
    print()
    print("=" * 80)
    print("Fix Summary:")
    print("=" * 80)
    print()
    print("[ISSUE] Google OAuth 404 NOT_FOUND Error")
    print("  - Problem: Hardcoded NEXT_PUBLIC_SITE_URL in redirectTo")
    print("  - Vercel env: https://politician-finder.vercel.app")
    print("  - Actual URL: https://politician-finder-xxx.vercel.app")
    print("  - Result: 404 error on callback")
    print()
    print("[SOLUTION] Dynamic Origin Extraction")
    print("  - Extract origin from request.url")
    print("  - Use dynamic origin in redirectTo")
    print("  - Works on all Vercel deployment URLs")
    print()
    print("[FILES MODIFIED]")
    print("  - 1_Frontend/src/app/api/auth/google/route.ts")
    print()
    print("[DEPLOYMENT]")
    print("  - Commit: c6e70c4")
    print("  - Production URL: https://politician-finder-ul6m3773l-finder-world.vercel.app")
    print("  - Status: SUCCESS - Google login working")
    print()

except Exception as e:
    print(f"[ERROR] Update failed: {str(e)}")
    sys.exit(1)
