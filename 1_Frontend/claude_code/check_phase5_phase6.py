#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Phase 5와 Phase 6 완료 상태 확인
"""
from supabase import create_client, Client

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("=" * 80)
print("Phase 5 & Phase 6 Status Check")
print("=" * 80)

# Phase 5 확인
print("\n[Phase 5]")
try:
    phase5 = supabase.table("project_grid_tasks").select("*").eq("phase", 5).execute()
    if phase5.data:
        total = len(phase5.data)
        completed = sum(1 for t in phase5.data if t.get("status") == "완료")
        print(f"Total: {total} tasks")
        print(f"Completed: {completed} tasks ({completed*100//total if total > 0 else 0}%)")

        incomplete = [t for t in phase5.data if t.get("status") != "완료"]
        if incomplete:
            print(f"\nIncomplete tasks ({len(incomplete)}):")
            for t in sorted(incomplete, key=lambda x: x.get("task_id", "")):
                print(f"  {t['task_id']}: {t.get('task_name', 'N/A')} - {t.get('status', 'N/A')} ({t.get('progress', 0)}%)")
        else:
            print("\nAll Phase 5 tasks completed!")
    else:
        print("No Phase 5 tasks found")
except Exception as e:
    print(f"ERROR: {e}")

# Phase 6 확인
print("\n[Phase 6]")
try:
    phase6 = supabase.table("project_grid_tasks").select("*").eq("phase", 6).execute()
    if phase6.data:
        total = len(phase6.data)
        completed = sum(1 for t in phase6.data if t.get("status") == "완료")
        print(f"Total: {total} tasks")
        print(f"Completed: {completed} tasks ({completed*100//total if total > 0 else 0}%)")

        incomplete = [t for t in phase6.data if t.get("status") != "완료"]
        if incomplete:
            print(f"\nIncomplete tasks ({len(incomplete)}):")
            for t in sorted(incomplete, key=lambda x: x.get("task_id", "")):
                print(f"  {t['task_id']}: {t.get('task_name', 'N/A')} - {t.get('status', 'N/A')} ({t.get('progress', 0)}%)")
        else:
            print("\nAll Phase 6 tasks completed!")
    else:
        print("No Phase 6 tasks found")
except Exception as e:
    print(f"ERROR: {e}")

print("\n" + "=" * 80)
