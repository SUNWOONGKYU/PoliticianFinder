#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
모든 Phase 완료 상태 확인
"""
from supabase import create_client, Client

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("=" * 80)
print("All Phases Completion Status")
print("=" * 80)

for phase_num in range(1, 8):
    print(f"\n[Phase {phase_num}]")
    try:
        result = supabase.table("project_grid_tasks").select("*").eq("phase", phase_num).execute()
        if result.data:
            total = len(result.data)
            completed = sum(1 for t in result.data if t.get("status") == "완료")
            percentage = (completed * 100 // total) if total > 0 else 0
            print(f"Total: {total} tasks | Completed: {completed} ({percentage}%)")

            if completed < total:
                incomplete = [t for t in result.data if t.get("status") != "완료"]
                print(f"Incomplete: {len(incomplete)} tasks")
        else:
            print("No tasks found")
    except Exception as e:
        print(f"ERROR: {e}")

print("\n" + "=" * 80)
