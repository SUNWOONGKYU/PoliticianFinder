# -*- coding: utf-8 -*-
"""
Phase 5 모바일 최적화 작업을 Project Grid 데이터베이스에 반영
"""

import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client
from datetime import datetime, timezone

# UTF-8 출력 설정
sys.stdout.reconfigure(encoding='utf-8')

# .env.local 로드
load_dotenv('1_Frontend/.env.local')

url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
key = os.getenv('SUPABASE_SERVICE_ROLE_KEY') or os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

if not url or not key:
    print("Error: Supabase credentials not found")
    exit(1)

supabase: Client = create_client(url, key)

# Phase 5 작업 목록
phase5_tasks = [
    {
        "task_id": "P5M9",
        "task_name": "다크모드 시스템 구현",
        "phase": 5,
        "area": "M",
        "status": "완료",
        "progress": 100,
        "assigned_agent": "Claude Code",
        "generated_files": "ThemeContext.tsx, ThemeToggle.tsx, ThemeContext.test.tsx, ThemeToggle.test.tsx, tailwind.config.ts(수정), globals.css(수정), layout.tsx(수정), header.tsx(수정), footer.tsx(수정)",
        "modification_history": "light/dark/system 테마 지원, localStorage 저장, anti-flicker 스크립트, 헤더/푸터 다크모드 스타일",
        "build_result": "성공",
        "test_history": "Test(26/26) 통과",
        "validation_result": "code-reviewer: 92/100, ui-designer: 8.5/10",
        "remarks": "Phase 5 선택적 고급 기능 - 다크모드"
    },
    {
        "task_id": "P5M14",
        "task_name": "알림 센터 드롭다운 구현",
        "phase": 5,
        "area": "M",
        "status": "완료",
        "progress": 100,
        "assigned_agent": "Claude Code",
        "generated_files": "NotificationDropdown.tsx, notifications/page.tsx(수정)",
        "modification_history": "헤더용 알림 드롭다운, 스와이프 삭제, 타입별 아이콘, 다크모드 지원",
        "build_result": "성공",
        "test_history": "빌드 검증 통과",
        "validation_result": "code-reviewer: 85/100, ui-designer: 8.7/10",
        "remarks": "Phase 5 선택적 고급 기능 - 알림 센터"
    },
    {
        "task_id": "P5M13",
        "task_name": "댓글 스레드 시스템 구현",
        "phase": 5,
        "area": "M",
        "status": "완료",
        "progress": 100,
        "assigned_agent": "Claude Code",
        "generated_files": "CommentThread.tsx, CommentThread.test.tsx",
        "modification_history": "중첩 대댓글 지원(configurable maxDepth), 접기/펼치기, 추천/비추천, 삭제 기능, 다크모드",
        "build_result": "성공",
        "test_history": "Test(21/21) 통과",
        "validation_result": "code-reviewer: 87/100, ui-designer: 8.8/10",
        "remarks": "Phase 5 선택적 고급 기능 - 댓글 스레드"
    },
    {
        "task_id": "P5MI3",
        "task_name": "무한 스크롤 성능 최적화 (가상화 리스트)",
        "phase": 5,
        "area": "MI",
        "status": "완료",
        "progress": 100,
        "assigned_agent": "Claude Code",
        "generated_files": "VirtualizedList.tsx, VirtualizedList.test.tsx",
        "modification_history": "가상화 리스트 컴포넌트, useInfiniteScroll 훅, useScrollRestoration 훅, 대용량 리스트 메모리 최적화",
        "build_result": "성공",
        "test_history": "Test(16/16) 통과",
        "validation_result": "code-reviewer: 89/100, ui-designer: 9.2/10",
        "remarks": "Phase 5 선택적 고급 기능 - 무한 스크롤 성능"
    }
]

# 데이터베이스 업데이트
success_count = 0
for task in phase5_tasks:
    task["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    try:
        # upsert (있으면 업데이트, 없으면 삽입)
        result = supabase.table("project_grid_tasks_revised").upsert(
            task,
            on_conflict="task_id"
        ).execute()
        
        if result.data:
            print(f"[OK] {task['task_id']}: {task['task_name']} - 반영 성공")
            success_count += 1
        else:
            print(f"[FAIL] {task['task_id']}: 반영 실패")
    except Exception as e:
        print(f"[ERROR] {task['task_id']}: {e}")

print(f"\n총 {success_count}/{len(phase5_tasks)}개 작업 반영 완료")
