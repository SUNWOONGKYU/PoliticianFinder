#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os, sys
from supabase import create_client
import json
if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1OTI0MzQsImV4cCI6MjA3NjE2ODQzNH0.knUt4zhH7Ld8c0GxaiLgcQp5m_tGnjt5djcetJgd-k8"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("Searching for relevant tasks in project grid...")

# Search for community-related tasks
response = supabase.table('project_grid_tasks_revised').select('*').in_(
    'task_id', ['P1FA1', 'P1FA2', 'P3BA3']
).execute()

print(f"\nFound {len(response.data)} tasks:")
for task in response.data:
    print(f"\n{task['task_id']}: {task['task_name']}")
    print(f"  Status: {task['status']}")
    print(f"  Progress: {task['progress']}%")

# Today's modifications
modifications = """
2025-11-14: 커뮤니티 페이지 Hot/Best 배지를 제목 옆으로 이동 (홈페이지와 통일) [76e82b7]
2025-11-14: 홈페이지 정치인 이름에서 '의원' 접미사 제거 (커뮤니티와 통일) [cf86af7]
2025-11-14: 커뮤니티 전체 게시글 개수 표시 (pagination.total 사용, 86개 표시) [09041c3]
2025-11-14: 관리자 회원 관리 API - users→profiles 테이블 변경 (14명 회원 표시) [09041c3]
2025-11-14: 정치인 평가 점수를 세 자릿수로 변경 (DB 10배, 등급 기준 900/850/800 등) [7d2fb29]
2025-11-14: 홈페이지 커뮤니티 인기 게시글에 영향력 등급(🏰 영주) 추가 [5faebdf]
2025-11-14: 홈페이지 게시글 메타 정보 완전 수정 (공감/비공감/공유 추가, status 하드코딩 제거) [43b696c]
2025-11-14: 커뮤니티 페이지 회원 레벨 표시 중복 제거 (ML 접두사 처리) [b033bfc]
"""

print("\n\n=== Updating P1FA2 (홈페이지) ===")
supabase.table('project_grid_tasks_revised').update({
    'modification_history': modifications,
    'status': '완료',
    'progress': 100
}).eq('task_id', 'P1FA2').execute()
print("P1FA2 updated!")

print("\n=== Updating P3BA3 (커뮤니티) ===")
supabase.table('project_grid_tasks_revised').update({
    'modification_history': modifications,
    'status': '완료',
    'progress': 100
}).eq('task_id', 'P3BA3').execute()
print("P3BA3 updated!")

print("\n=== Updating P1FA1 (정치인 목록) ===")
supabase.table('project_grid_tasks_revised').update({
    'modification_history': modifications,
    'status': '완료',
    'progress': 100
}).eq('task_id', 'P1FA1').execute()
print("P1FA1 updated!")

print("\n\nAll tasks updated in project grid!")
print("\nModifications added:")
print(modifications)
