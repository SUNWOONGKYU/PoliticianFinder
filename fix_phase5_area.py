# -*- coding: utf-8 -*-
"""
Phase 5 작업의 Area 코드를 F (Frontend)로 수정
"""

import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client
from datetime import datetime, timezone

sys.stdout.reconfigure(encoding='utf-8')
load_dotenv('1_Frontend/.env.local')

url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

supabase: Client = create_client(url, key)

# Phase 5 작업 ID 수정 (M -> F, MI -> F)
updates = [
    {"old_task_id": "P5M9", "new_task_id": "P5F9", "task_name": "다크모드 시스템 구현"},
    {"old_task_id": "P5M14", "new_task_id": "P5F14", "task_name": "알림 센터 드롭다운 구현"},
    {"old_task_id": "P5M13", "new_task_id": "P5F13", "task_name": "댓글 스레드 시스템 구현"},
    {"old_task_id": "P5MI3", "new_task_id": "P5F15", "task_name": "무한 스크롤 성능 최적화 (가상화 리스트)"},
]

for item in updates:
    try:
        # 기존 레코드 삭제
        supabase.table("project_grid_tasks_revised").delete().eq("task_id", item["old_task_id"]).execute()
        print(f"[DELETE] {item['old_task_id']} 삭제")
        
        # 새 task_id로 삽입
        new_record = {
            "task_id": item["new_task_id"],
            "task_name": item["task_name"],
            "phase": 5,
            "area": "F",
            "status": "완료",
            "progress": 100,
            "assigned_agent": "Claude Code",
            "build_result": "성공",
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "remarks": "Phase 5 선택적 고급 기능 - 모바일 최적화"
        }
        
        result = supabase.table("project_grid_tasks_revised").insert(new_record).execute()
        if result.data:
            print(f"[INSERT] {item['new_task_id']}: {item['task_name']} - Area: F")
    except Exception as e:
        print(f"[ERROR] {item['old_task_id']}: {e}")

print("\n완료: Area 코드가 F (Frontend)로 수정되었습니다.")
