#!/usr/bin/env python3
import os, sys
from supabase import create_client
from datetime import datetime
if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# 2025-11-18 추가 작업: 버그 수정 검증 및 개발 환경 인증 우회
updates = [
    {
        "task_id": "P3BA28",
        "task_name": "알림 시스템 API",
        "status": "완료",
        "progress": 100,
        "remarks": "[2025-11-18 검증] 알림 타입(reply, mention) 정상 작동 확인. 로컬/프로덕션 테스트 완료"
    },
    {
        "task_id": "P1BA3",
        "task_name": "커뮤니티 댓글 API",
        "status": "완료",
        "progress": 100,
        "remarks": "[2025-11-18 검증] users 테이블 변경 정상 작동 확인. 댓글 작성자 이름 정상 표시"
    },
    {
        "task_id": "P1BA4",
        "task_name": "기타 (사용자 관리 API)",
        "status": "완료",
        "progress": 100,
        "remarks": "[2025-11-18 검증] Admin API 정상 작동 확인 (20명 사용자 조회 성공). 개발 모드 인증 우회 설정 추가 (1_Frontend/src/lib/auth/helpers.ts)"
    },
    {
        "task_id": "P3BA29",
        "task_name": "목 데이터 제거 및 실제 DB 연동",
        "status": "완료",
        "progress": 100,
        "remarks": "[2025-11-18 검증] 댓글 개수 동적 계산 정상 작동 확인 (4개, 3개, 2개 등 실제 DB 값 표시). 마이페이지 실제 API 연동 확인"
    }
]

print("=" * 70)
print("프로젝트 그리드 업데이트 [2025-11-18 - 버그 검증 & 인증 우회]")
print("작업 내용: 이전 커밋(0085075) 버그 수정 검증 + 개발 환경 인증 우회 설정")
print("=" * 70)
print()

success_count = 0
error_count = 0

for update in updates:
    try:
        # 현재 작업 정보 조회
        result = supabase.table('project_grid_tasks_revised').select('*').eq('task_id', update['task_id']).execute()

        if not result.data:
            print(f"⚠️  {update['task_id']}: 작업을 찾을 수 없습니다.")
            error_count += 1
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
            new_remark = f"\n{update['remarks']}"
            update_data['remarks'] = (existing_remarks + new_remark).strip()

        # 업데이트 실행
        supabase.table('project_grid_tasks_revised').update(update_data).eq('task_id', update['task_id']).execute()

        print(f"✅ [OK] {update['task_id']}: {update['task_name']}")
        print(f"   Status: {current.get('status')} -> {update['status']}")
        print(f"   Progress: {current.get('progress', 0)}% -> {update['progress']}%")
        if 'remarks' in update:
            print(f"   New Remark: {update['remarks'][:100]}...")
        print()

        success_count += 1

    except Exception as e:
        print(f"❌ [ERROR] {update['task_id']}: {str(e)}")
        print()
        error_count += 1

print("=" * 70)
print(f"프로젝트 그리드 업데이트 완료!")
print(f"성공: {success_count}개, 실패: {error_count}개")
print("=" * 70)
print()
print("📝 추가된 검증 내용:")
print("  - 알림 시스템: reply/mention 타입 정상 작동")
print("  - 댓글 API: users 테이블 변경 정상 작동")
print("  - Admin API: 개발 모드 인증 우회 설정 (helpers.ts)")
print("  - 목 데이터: 댓글 개수 동적 계산 정상 작동")
print()
print("⚠️  중요: 프로덕션 배포 전 helpers.ts의 인증 우회 코드 제거 필요!")
