#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PHASE 3 전체 4개 작업 완료 상태로 Supabase DB 업데이트
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
    """특정 task_id 업데이트"""
    try:
        result = supabase.table("project_grid_tasks_revised").update(update_data).eq("task_id", task_id).execute()
        if result.data:
            print(f"[OK] {task_id} updated")
            return True
        else:
            print(f"[WARN] {task_id} not found")
            return False
    except Exception as e:
        print(f"[FAIL] {task_id} error: {e}")
        return False

def main():
    print("=" * 80)
    print("PHASE 3 - All 4 Tasks Complete")
    print("=" * 80)
    print()

    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        print("[OK] Supabase connected")
    except Exception as e:
        print(f"[FAIL] Connection failed: {e}")
        return

    current_time = datetime.now().isoformat()

    # P3BA1
    print("\n--- P3BA1: Real API - 회원 ---")
    update_task(supabase, "P3BA1", {
        "status": "완료",
        "progress": 100,
        "generated_files": "src/app/api/auth/signup/route.ts, src/app/api/auth/login/route.ts, src/app/api/auth/logout/route.ts, src/app/api/user/profile/route.ts, src/app/api/user/profile/update/route.ts, src/app/api/user/delete/route.ts",
        "generator": "Claude-Sonnet-4.5 (backend-developer)",
        "duration": "45분",
        "modification_history": "Mock → Real Supabase Auth 전환, JWT 토큰, 이메일 인증, Rate limiting, RLS 적용",
        "test_history": "빌드 성공, TypeScript 타입 체크 통과",
        "build_result": "성공",
        "dependency_propagation": "완료",
        "validation_result": "Supabase Auth 연동 완료, 프로필 CRUD API 생성",
        "updated_at": current_time
    })

    # P3BA2
    print("\n--- P3BA2: Real API - 정치인 ---")
    update_task(supabase, "P3BA2", {
        "status": "완료",
        "progress": 100,
        "generated_files": "src/app/api/politicians/route.ts, src/app/api/politicians/[id]/route.ts, src/app/api/politicians/search/route.ts, src/app/api/favorites/route.ts, src/app/api/politicians/statistics/route.ts, IMPLEMENTATION_SUMMARY_P3BA2.md",
        "generator": "Claude-Sonnet-4.5 (backend-developer)",
        "duration": "50분",
        "modification_history": "Mock → Real Supabase DB 전환, AI 평가 통합, 한국어 전체 텍스트 검색, Soft delete",
        "test_history": "빌드 성공, 스키마 정렬 완료",
        "build_result": "성공",
        "dependency_propagation": "완료",
        "validation_result": "정치인 API 모두 Real 연동 완료, RLS 적용",
        "updated_at": current_time
    })

    # P3BA3
    print("\n--- P3BA3: Real API - 커뮤니티 ---")
    update_task(supabase, "P3BA3", {
        "status": "완료",
        "progress": 100,
        "generated_files": "src/app/api/posts/route.ts, src/app/api/posts/[id]/likes/route.ts, src/app/api/posts/search/route.ts, src/lib/auth/helpers.ts, P3BA3_IMPLEMENTATION_SUMMARY.md, P3BA3_FINAL_REPORT.md",
        "generator": "Claude-Sonnet-4.5 (backend-developer)",
        "duration": "55분",
        "modification_history": "Mock → Real Supabase CRUD 전환, 좋아요 토글, 검색, 인증 헬퍼 생성",
        "test_history": "빌드 성공, RLS 정책 적용",
        "build_result": "성공",
        "dependency_propagation": "완료",
        "validation_result": "커뮤니티 API Real 연동 완료, 트리거 자동 카운트",
        "updated_at": current_time
    })

    # P3BA4
    print("\n--- P3BA4: Real API - 기타 ---")
    update_task(supabase, "P3BA4", {
        "status": "완료",
        "progress": 100,
        "generated_files": "src/app/api/statistics/overview/route.ts, src/app/api/statistics/community/route.ts, src/app/api/statistics/politicians-stats/route.ts, src/app/api/statistics/payments/route.ts, src/app/api/health/route.ts, src/app/api/statistics/API_DOCUMENTATION.md, P3BA4_IMPLEMENTATION_SUMMARY.md",
        "generator": "Claude-Sonnet-4.5 (backend-developer)",
        "duration": "40분",
        "modification_history": "Mock → Real Supabase 통계 전환, 헬스체크, 캐싱 전략 (5분), 병렬 쿼리",
        "test_history": "빌드 성공, 707 lines 코드 생성",
        "build_result": "성공",
        "dependency_propagation": "완료",
        "validation_result": "통계 API Real 연동 완료, DB 연결 확인",
        "updated_at": current_time
    })

    print("\n" + "=" * 80)
    print("All PHASE 3 tasks updated!")
    print("=" * 80)

    # 최종 확인
    print("\n=== PHASE 3 Final Status ===")
    result = supabase.table("project_grid_tasks_revised").select("task_id, status, progress").eq("phase", 3).order("task_id").execute()

    if result.data:
        completed = len([t for t in result.data if t['status'] == '완료'])
        total = len(result.data)

        for task in result.data:
            status = "[OK]" if task['status'] == '완료' else "[TODO]"
            print(f"{status} {task['task_id']}: {task['status']} ({task['progress']}%)")

        print()
        print(f"Total: {total} | Completed: {completed}")

        if completed == total:
            print()
            print("=" * 80)
            print("PHASE 3 - 100% COMPLETE!")
            print("=" * 80)

if __name__ == "__main__":
    main()
