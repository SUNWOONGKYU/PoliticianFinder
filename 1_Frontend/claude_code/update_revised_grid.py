#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from supabase import create_client, Client
from datetime import datetime

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("=" * 80)
print("Updating project_grid_tasks_revised for Phase 6")
print("=" * 80)

# Phase 6 업데이트
update_data = {
    "status": "완료",
    "progress": 100,
    "assigned_agent": "Claude Code",
    "generated_files": ["ci-cd.yml", "vercel.json", "sentry", "middleware"],
    "duration": "305분",
    "build_result": "OK",
    "test_history": "TypeCheck OK",
    "updated_at": datetime.now().isoformat()
}

try:
    response = supabase.table("project_grid_tasks_revised").update(update_data).eq("task_id", "P6O1").execute()
    if response.data:
        print("SUCCESS - P6O1 updated")
    else:
        print("WARN - No P6O1 found")
except Exception as e:
    print(f"ERROR: {e}")

# Phase 6 전체 확인
try:
    result = supabase.table("project_grid_tasks_revised").select("*").eq("phase", 6).execute()
    if result.data:
        print(f"\nPhase 6 tasks ({len(result.data)}):")
        for t in sorted(result.data, key=lambda x: x.get("task_id", "")):
            print(f"  {t['task_id']}: {t.get('status', 'N/A')} ({t.get('progress', 0)}%)")
except Exception as e:
    print(f"ERROR: {e}")

print("\n" + "=" * 80)
