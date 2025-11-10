#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
P6O1 작업 내용 업데이트
실제로 구현한 작업: CI/CD 파이프라인 + Vercel + 모니터링 + 보안
"""
from supabase import create_client, Client
from datetime import datetime

# Supabase 연결 정보
SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

# Supabase 클라이언트 생성
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("=" * 80)
print("Updating P6O1 with actual implementation details...")
print("=" * 80)

# P6O1 업데이트 데이터
update_data = {
    "task_name": "Phase 6 Operations",
    "status": "완료",
    "progress": 100,
    "assigned_agent": "1차: devops",
    "generated_files": [
        ".github/workflows/ci-cd.yml",
        "vercel.json",
        "sentry.client.config.ts",
        "sentry.server.config.ts",
        "src/lib/monitoring/analytics.ts",
        "src/middleware.ts"
    ],
    "duration": "1차: 125분",
    "build_result": "1차: OK",
    "test_history": "1차: TypeCheck OK",
    "updated_at": datetime.now().isoformat()
}

try:
    response = supabase.table("project_grid_tasks").update(update_data).eq("task_id", "P6O1").execute()

    if response.data:
        print("OK - P6O1 updated successfully")
        print("\nUpdated content:")
        print(f"  Task Name: {update_data['task_name']}")
        print(f"  Status: {update_data['status']}")
        print(f"  Progress: {update_data['progress']}%")
        print(f"  Files Generated:")
        for f in update_data['generated_files']:
            print(f"    - {f}")
        print(f"  Duration: {update_data['duration']}")
        print(f"  Build: {update_data['build_result']}")
        print(f"  Tests: {update_data['test_history']}")
    else:
        print("WARN - No data returned")

except Exception as e:
    print(f"ERROR - Update failed: {str(e)}")

print("\n" + "=" * 80)
print("Update complete!")
print("=" * 80)
