#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
이미 완료된 작업들의 status를 "완료"로 정리
"""
import sys
import os
from supabase import create_client
from datetime import datetime

if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

def fix_status(supabase):
    """status가 '완료 (날짜)' 형태인 작업들을 '완료'로 변경"""

    # Phase 1에서 progress가 100%이지만 status가 "완료"가 아닌 작업들 찾기
    result = supabase.table("project_grid_tasks").select("task_id, status, progress").eq("phase", 1).execute()

    fixed_count = 0
    for task in result.data:
        # status가 "완료"로 시작하지만 정확히 "완료"가 아닌 경우
        if task['progress'] == 100 and task['status'] != '완료' and '완료' in task['status']:
            print(f"[FIX] {task['task_id']}: '{task['status']}' -> '완료'")

            # status를 "완료"로 업데이트
            supabase.table("project_grid_tasks").update({
                "status": "완료",
                "updated_at": datetime.now().isoformat()
            }).eq("task_id", task['task_id']).execute()

            fixed_count += 1

    return fixed_count

def main():
    """메인 함수"""
    print("=" * 80)
    print("Phase 1 작업 status 정리")
    print("=" * 80)
    print()

    # Supabase 연결
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        print("[OK] Supabase 연결 성공")
    except Exception as e:
        print(f"[FAIL] Supabase 연결 실패: {e}")
        return

    # status 수정
    fixed_count = fix_status(supabase)

    print()
    print("=" * 80)
    print(f"완료! {fixed_count}개 작업의 status를 '완료'로 변경했습니다.")
    print("=" * 80)

    # 최종 확인
    print()
    print("=== Phase 1 작업 현황 ===")
    result = supabase.table("project_grid_tasks").select("task_id, status, progress").eq("phase", 1).order("task_id").execute()

    completed = 0
    pending = 0

    for task in result.data:
        if task['status'] == '완료':
            completed += 1
        else:
            pending += 1
            print(f"[TODO] {task['task_id']}: {task['status']} ({task['progress']}%)")

    print()
    print(f"Total: {len(result.data)} | Completed: {completed} | Pending: {pending}")

if __name__ == "__main__":
    main()
