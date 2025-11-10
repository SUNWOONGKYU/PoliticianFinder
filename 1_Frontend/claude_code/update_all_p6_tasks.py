#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from supabase import create_client, Client
from datetime import datetime

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("=" * 80)
print("Updating ALL Phase 6 Operations tasks")
print("=" * 80)

task_files = {
    "P6O1": [".github/workflows/ci-cd.yml"],
    "P6O2": ["vercel.json"],
    "P6O3": ["sentry.client.config.ts", "sentry.server.config.ts", "sentry.edge.config.ts", "src/lib/monitoring/analytics.ts"],
    "P6O4": ["src/middleware.ts"]
}

for task_id in ["P6O1", "P6O2", "P6O3", "P6O4"]:
    try:
        update_data = {
            "status": "완료",
            "progress": 100,
            "assigned_agent": "Claude Code",
            "generated_files": task_files.get(task_id, []),
            "duration": "305분",
            "build_result": "OK",
            "test_history": "TypeCheck OK",
            "updated_at": datetime.now().isoformat()
        }

        response = supabase.table("project_grid_tasks_revised").update(update_data).eq("task_id", task_id).execute()
        if response.data:
            print(f"SUCCESS - {task_id} updated")
        else:
            print(f"WARN - {task_id} not found")
    except Exception as e:
        print(f"ERROR - {task_id}: {e}")

# 확인
try:
    result = supabase.table("project_grid_tasks_revised").select("*").eq("phase", 6).execute()
    if result.data:
        print(f"\nPhase 6 final status ({len(result.data)} tasks):")
        completed = sum(1 for t in result.data if t.get("status") == "완료")
        print(f"Completed: {completed}/{len(result.data)}")
        for t in sorted(result.data, key=lambda x: x.get("task_id", "")):
            print(f"  {t['task_id']}: {t.get('status', 'N/A')} ({t.get('progress', 0)}%)")
except Exception as e:
    print(f"ERROR: {e}")

print("\n" + "=" * 80)
print("Update complete! Check viewer to verify.")
print("=" * 80)
