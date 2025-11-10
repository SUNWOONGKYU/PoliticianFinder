#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Phase 6 최종 업데이트 (2차 검증 완료 반영)
"""
from supabase import create_client, Client
from datetime import datetime

# Supabase 연결
SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("=" * 80)
print("Phase 6 Final Update (Including 2nd Verification)")
print("=" * 80)

# P6O1 최종 업데이트 데이터 (2차 검증 완료 반영)
final_update = {
    "task_name": "Phase 6 Ops",
    "status": "완료",
    "progress": 100,
    "assigned_agent": "1+2차: Claude",
    "generated_files": [
        "ci-cd.yml",
        "ci.yml",
        "deploy.yml",
        "vercel.json",
        "Dockerfile",
        ".env.example",
        "sentry.*.ts",
        "analytics.ts",
        "middleware.ts"
    ],
    "duration": "305분",
    "build_result": "OK (98p)",
    "test_history": "TypeCheck+Build OK",
    "updated_at": datetime.now().isoformat()
}

try:
    response = supabase.table("project_grid_tasks").update(final_update).eq("task_id", "P6O1").execute()

    if response.data:
        print("SUCCESS - P6O1 updated with 2nd verification results")
        print("\nFinal Status:")
        print(f"  Task: {final_update['task_name']}")
        print(f"  Status: {final_update['status']} ({final_update['progress']}%)")
        print(f"  Agent: {final_update['assigned_agent']}")
        print(f"  Duration: {final_update['duration']}")
        print(f"  Build: {final_update['build_result']}")
        print(f"  Tests: {final_update['test_history']}")
        print(f"\n  Files Generated ({len(final_update['generated_files'])}):")
        for f in final_update['generated_files']:
            print(f"    - {f}")
    else:
        print("WARN - No data returned")

except Exception as e:
    print(f"ERROR - Update failed: {str(e)}")

print("\n" + "=" * 80)
print("Phase 6 Summary")
print("=" * 80)

try:
    response = supabase.table("project_grid_tasks").select("*").eq("phase", 6).eq("area", "O").execute()

    if response.data:
        print(f"\nPhase 6 Operations Tasks:")
        for task in response.data:
            print(f"  {task['task_id']}: {task['task_name']}")
            print(f"    Status: {task['status']} ({task['progress']}%)")
            print(f"    Agent: {task.get('assigned_agent', 'N/A')}")
            print()

    # 전체 Phase 6 통계
    all_phase6 = supabase.table("project_grid_tasks").select("*").eq("phase", 6).execute()
    if all_phase6.data:
        total = len(all_phase6.data)
        completed = sum(1 for t in all_phase6.data if t.get("status") == "완료")
        print(f"Phase 6 Overall: {completed}/{total} tasks completed ({completed*100//total}%)")

except Exception as e:
    print(f"ERROR - Query failed: {str(e)}")

print("\n" + "=" * 80)
print("Update Complete!")
print("=" * 80)
print("\nNext Steps:")
print("  1. Vercel Dashboard에서 GitHub 연결 (내일)")
print("  2. GitHub Secrets 설정 (내일)")
print("  3. Git push하여 자동 배포 테스트 (내일)")
print("\nPhase 6 Status: APPROVED & READY FOR DEPLOYMENT")
