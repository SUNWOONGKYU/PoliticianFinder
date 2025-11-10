#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Phase 6 작업 목록 확인
"""
from supabase import create_client, Client

# Supabase 연결 정보
SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

# Supabase 클라이언트 생성
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

print("=" * 80)
print("Phase 6 Operations (O) Area Tasks")
print("=" * 80)

try:
    # Phase 6, Area O 작업만 조회
    response = supabase.table("project_grid_tasks").select("*").eq("phase", 6).eq("area", "O").execute()

    if response.data:
        print(f"\nFound {len(response.data)} tasks in Phase 6, Area O:\n")
        for task in sorted(response.data, key=lambda x: x.get("task_id", "")):
            task_id = task.get("task_id", "N/A")
            task_name = task.get("task_name", "N/A")
            status = task.get("status", "N/A")
            progress = task.get("progress", 0)
            print(f"{task_id}: {task_name}")
            print(f"  Status: {status} ({progress}%)")
            print()
    else:
        print("No tasks found in Phase 6, Area O")

except Exception as e:
    print(f"ERROR: {str(e)}")

print("=" * 80)
