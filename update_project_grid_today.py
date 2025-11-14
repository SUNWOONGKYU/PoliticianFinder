#!/usr/bin/env python3
import os, sys
from supabase import create_client
from datetime import datetime
if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# 오늘 수정한 작업들
updates = [
    {
        "task_id": "P1BA3",
        "task_name": "댓글 API",
        "status": "완료",
        "progress": 100,
        "remarks": "댓글 API post_id 선택적 파라미터로 변경 - 관리자 대시보드에서 전체 댓글 조회 가능하도록 수정"
    },
    {
        "task_id": "P1BA4",
        "task_name": "신고 관리 API",
        "status": "완료",
        "progress": 100,
        "remarks": "users 테이블 참조를 profiles로 변경 - 관리자 대시보드 신고 관리 오류 해결"
    },
    {
        "task_id": "P3BA3",
        "task_name": "커뮤니티 게시글 API",
        "status": "완료",
        "progress": 100,
        "remarks": "Service Role Key 사용하는 /api/community/posts 신규 생성 - RLS 우회로 모든 게시글(86개) 표시, Vercel 환경 변수 줄바꿈 문제 해결"
    },
    {
        "task_id": "P1FA2",
        "task_name": "게시글 상세 페이지",
        "status": "완료",
        "progress": 100,
        "remarks": "회원 자유게시판 댓글 UI 개선 - 정치인/회원 댓글 구분 제거, 게시판 유형에 따른 댓글 UI 조건부 렌더링"
    }
]

print("프로젝트 그리드 업데이트 시작...\n")

for update in updates:
    try:
        # 현재 작업 정보 조회
        result = supabase.table('project_grid_tasks_revised').select('*').eq('task_id', update['task_id']).execute()

        if not result.data:
            print(f"⚠️  {update['task_id']}: 작업을 찾을 수 없습니다.")
            continue

        current = result.data[0]

        # 업데이트할 데이터 준비
        update_data = {
            'status': update['status'],
            'progress': update['progress'],
            'updated_at': datetime.now().isoformat()
        }

        # remarks 필드가 있으면 추가
        if 'remarks' in update and update['remarks']:
            # 기존 remarks에 새로운 내용 추가
            existing_remarks = current.get('remarks', '') or ''
            new_remark = f"\n[{datetime.now().strftime('%Y-%m-%d')}] {update['remarks']}"
            update_data['remarks'] = (existing_remarks + new_remark).strip()

        # 업데이트 실행
        supabase.table('project_grid_tasks_revised').update(update_data).eq('task_id', update['task_id']).execute()

        print(f"[OK] {update['task_id']}: {update['task_name']}")
        print(f"   Status: {current.get('status')} -> {update['status']}")
        print(f"   Progress: {current.get('progress', 0)}% -> {update['progress']}%")
        if 'remarks' in update:
            print(f"   Remarks: {update['remarks'][:50]}...")
        print()

    except Exception as e:
        print(f"[ERROR] {update['task_id']}: {str(e)}")
        print()

print("\n프로젝트 그리드 업데이트 완료!")
