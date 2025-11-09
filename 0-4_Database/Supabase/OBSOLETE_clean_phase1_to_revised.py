#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Supabase DB를 REVISED 버전(8개 작업)에 맞게 정리
PHASE 1: P1BA1-4, P1BI1-3, P1F1 (총 8개)만 남기고 나머지 삭제
"""
import sys
import os
from supabase import create_client

if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

# REVISED 버전의 PHASE 1 작업 (8개만)
REVISED_PHASE1_TASKS = [
    "P1BA1", "P1BA2", "P1BA3", "P1BA4",  # Backend APIs
    "P1BI1", "P1BI2", "P1BI3",           # Backend Infrastructure
    "P1F1"                                # Frontend
]

def main():
    print("=" * 80)
    print("Clean PHASE 1 to REVISED version (8 tasks only)")
    print("=" * 80)
    print()

    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        print("[OK] Supabase connected")
    except Exception as e:
        print(f"[FAIL] Connection failed: {e}")
        return

    # 현재 PHASE 1 작업 목록 확인
    print("\n--- Current PHASE 1 tasks ---")
    result = supabase.table("project_grid_tasks").select("task_id, task_name").eq("phase", 1).order("task_id").execute()

    if result.data:
        print(f"Total: {len(result.data)} tasks")
        for task in result.data:
            keep_delete = "KEEP" if task['task_id'] in REVISED_PHASE1_TASKS else "DELETE"
            print(f"  [{keep_delete}] {task['task_id']}: {task['task_name']}")

    # 삭제할 작업 목록
    tasks_to_delete = [t['task_id'] for t in result.data if t['task_id'] not in REVISED_PHASE1_TASKS]

    if not tasks_to_delete:
        print("\n[INFO] No tasks to delete. Already clean!")
        return

    print(f"\n--- Deleting {len(tasks_to_delete)} tasks ---")

    deleted_count = 0
    for task_id in tasks_to_delete:
        try:
            result = supabase.table("project_grid_tasks").delete().eq("task_id", task_id).execute()
            print(f"[DELETED] {task_id}")
            deleted_count += 1
        except Exception as e:
            print(f"[FAIL] {task_id}: {e}")

    print()
    print("=" * 80)
    print(f"Deleted {deleted_count} tasks")
    print("=" * 80)

    # 최종 확인
    print("\n--- Final PHASE 1 tasks (REVISED) ---")
    result = supabase.table("project_grid_tasks").select("task_id, task_name, status, progress").eq("phase", 1).order("task_id").execute()

    if result.data:
        for task in result.data:
            status_mark = "[OK]" if task['status'] == '완료' else "[TODO]"
            print(f"{status_mark} {task['task_id']}: {task['task_name']} ({task['progress']}%)")

        completed = len([t for t in result.data if t['status'] == '완료'])
        total = len(result.data)

        print()
        print(f"Total: {total} | Completed: {completed} | Remaining: {total - completed}")

if __name__ == "__main__":
    main()
