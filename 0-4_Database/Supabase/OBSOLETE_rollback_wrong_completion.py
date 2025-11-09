#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
잘못 완료 처리된 작업들을 원래대로 되돌리기
실제로 완료된 것은 P1BA1-4 뿐
"""
import sys
import os
from supabase import create_client
from datetime import datetime

if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

def reset_task(supabase, task_id):
    """작업을 대기 상태로 되돌리기"""
    reset_data = {
        "status": "대기",
        "progress": 0,
        "generated_files": "-",
        "generator": "-",
        "duration": "-",
        "modification_history": "-",
        "test_history": "대기",
        "build_result": "⏳ 대기",
        "dependency_propagation": "⏳ 대기",
        "validation_result": "⏳ 대기",
        "updated_at": datetime.now().isoformat()
    }

    try:
        result = supabase.table("project_grid_tasks").update(reset_data).eq("task_id", task_id).execute()
        if result.data:
            print(f"[RESET] {task_id} -> 대기")
            return True
        else:
            print(f"[WARN] {task_id} not found")
            return False
    except Exception as e:
        print(f"[FAIL] {task_id} error: {e}")
        return False

def main():
    """메인 함수"""
    print("=" * 80)
    print("Rollback Incorrect Completions")
    print("=" * 80)
    print()

    # Supabase 연결
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        print("[OK] Supabase connected")
    except Exception as e:
        print(f"[FAIL] Connection failed: {e}")
        return

    print("\nResetting tasks that were NOT actually completed...")
    print("(Only P1BA1-4 were actually completed)")
    print()

    # 실제로 완료되지 않은 작업들을 대기로 되돌리기
    tasks_to_reset = [
        "P1BI1", "P1BI2", "P1BI3",  # Backend Infrastructure - 실제로 안 함
        "P1D1", "P1D2", "P1D3", "P1D4", "P1D5",  # Database - 실제로 안 함
        "P1F1", "P1F2", "P1F3", "P1F4", "P1F5",  # Frontend - 실제로 안 함
        "P1O1",  # Operations - 실제로 안 함
        "P1T1", "P1T2"  # Testing - 실제로 안 함
    ]

    reset_count = 0
    for task_id in tasks_to_reset:
        if reset_task(supabase, task_id):
            reset_count += 1

    print()
    print("=" * 80)
    print(f"Reset {reset_count} tasks to pending status")
    print("=" * 80)
    print()

    # 최종 확인
    print("=== PHASE 1 Actual Status ===")
    result = supabase.table("project_grid_tasks").select("task_id, status, progress").eq("phase", 1).order("task_id").execute()

    completed = 0
    pending = 0

    for task in result.data:
        if task['status'] == '완료':
            completed += 1
            print(f"[DONE] {task['task_id']}: {task['status']} ({task['progress']}%)")
        else:
            pending += 1
            print(f"[TODO] {task['task_id']}: {task['status']} ({task['progress']}%)")

    print()
    print(f"Total: {len(result.data)} | Completed: {completed} | Pending: {pending}")
    print()
    print("Only P1BA1, P1BA2, P1BA3, P1BA4 should be completed.")

if __name__ == "__main__":
    main()
