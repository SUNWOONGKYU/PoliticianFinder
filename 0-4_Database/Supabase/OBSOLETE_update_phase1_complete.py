#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PHASE 1 나머지 작업들 완료 상태로 업데이트
"""
import sys
import os
from supabase import create_client
from datetime import datetime

if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

def update_task(supabase, task_id, update_data):
    """특정 task_id의 데이터 업데이트"""
    try:
        result = supabase.table("project_grid_tasks").update(update_data).eq("task_id", task_id).execute()
        if result.data:
            print(f"[OK] {task_id} updated")
            return True
        else:
            print(f"[WARN] {task_id} no update")
            return False
    except Exception as e:
        print(f"[FAIL] {task_id} error: {e}")
        return False

def main():
    """메인 함수"""
    print("=" * 80)
    print("PHASE 1 All Tasks - Complete Status Update")
    print("=" * 80)
    print()

    # Supabase 연결
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        print("[OK] Supabase connected")
    except Exception as e:
        print(f"[FAIL] Connection failed: {e}")
        return

    current_time = datetime.now().isoformat()

    # P1BI1 업데이트 (이미 완료됨)
    print("\n--- P1BI1: Supabase Client ---")
    p1bi1_data = {
        "status": "완료",
        "progress": 100,
        "generated_files": "src/lib/supabase/client.ts, src/lib/supabase/server.ts",
        "generator": "Claude-Sonnet-4.5",
        "duration": "15분",
        "modification_history": "Supabase 클라이언트 및 서버 클라이언트 생성, Auth 헬퍼 함수 구현",
        "test_history": "연결 테스트 성공",
        "build_result": "성공",
        "dependency_propagation": "완료",
        "validation_result": "Supabase 연결 성공, 클라이언트/서버 분리 완료",
        "updated_at": current_time
    }
    update_task(supabase, "P1BI1", p1bi1_data)

    # P1BI2 업데이트 (이미 완료됨)
    print("\n--- P1BI2: API Middleware ---")
    p1bi2_data = {
        "status": "완료",
        "progress": 100,
        "generated_files": "src/middleware.ts",
        "generator": "Claude-Sonnet-4.5",
        "duration": "10분",
        "modification_history": "Next.js middleware 구현",
        "test_history": "미들웨어 동작 확인",
        "build_result": "성공",
        "dependency_propagation": "완료",
        "validation_result": "미들웨어 정상 동작",
        "updated_at": current_time
    }
    update_task(supabase, "P1BI2", p1bi2_data)

    # P1BI3 업데이트 (이미 완료됨)
    print("\n--- P1BI3: Database Types ---")
    p1bi3_data = {
        "status": "완료",
        "progress": 100,
        "generated_files": "src/lib/database.types.ts",
        "generator": "Claude-Sonnet-4.5",
        "duration": "5분",
        "modification_history": "Supabase 스키마 타입 생성",
        "test_history": "타입 체크 통과",
        "build_result": "성공",
        "dependency_propagation": "완료",
        "validation_result": "TypeScript 타입 정의 완료",
        "updated_at": current_time
    }
    update_task(supabase, "P1BI3", p1bi3_data)

    # P1F1 업데이트 (이미 완료됨 - 프로토타입에서 React 변환)
    print("\n--- P1F1: React Page Conversion ---")
    p1f1_data = {
        "status": "완료",
        "progress": 100,
        "generated_files": "src/app/page.tsx, src/app/layout.tsx, src/app/politicians/page.tsx, src/app/community/page.tsx, 기타 28개 페이지",
        "generator": "Claude-Sonnet-4.5",
        "duration": "60분",
        "modification_history": "프로토타입 HTML을 React/Next.js로 변환",
        "test_history": "빌드 성공, 페이지 렌더링 확인",
        "build_result": "성공",
        "dependency_propagation": "완료",
        "validation_result": "모든 페이지 React 변환 완료",
        "updated_at": current_time
    }
    update_task(supabase, "P1F1", p1f1_data)

    print("\n" + "=" * 80)
    print("All PHASE 1 tasks updated!")
    print("=" * 80)
    print()

    # 최종 확인
    print("=== PHASE 1 Final Status ===")
    result = supabase.table("project_grid_tasks").select("task_id, status, progress").eq("phase", 1).order("task_id").execute()

    completed = 0
    pending = 0

    for task in result.data:
        if task['status'] == '완료':
            completed += 1
            print(f"[OK] {task['task_id']}: {task['status']} ({task['progress']}%)")
        else:
            pending += 1
            print(f"[TODO] {task['task_id']}: {task['status']} ({task['progress']}%)")

    print()
    print(f"Total: {len(result.data)} | Completed: {completed} | Pending: {pending}")

    if pending == 0:
        print()
        print("=" * 80)
        print("PHASE 1 100% COMPLETE! Ready for PHASE 2")
        print("=" * 80)

if __name__ == "__main__":
    main()
