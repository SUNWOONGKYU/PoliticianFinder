#!/usr/bin/env python3
import os, sys
from supabase import create_client
from datetime import datetime
if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'

SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

print("=" * 80)
print("P3BA30 검증 결과 반영 - Resend 이메일 시스템 연동")
print("검증일: 2025-11-18")
print("=" * 80)
print()

task_id = "P3BA30"

# 현재 작업 정보 조회
result = supabase.table('project_grid_tasks_revised').select('*').eq('task_id', task_id).execute()

if not result.data:
    print(f"❌ {task_id} 작업을 찾을 수 없습니다.")
    sys.exit(1)

current = result.data[0]

print(f"현재 상태:")
print(f"  Task ID: {current.get('task_id')}")
print(f"  Task Name: {current.get('task_name')}")
print(f"  Status: {current.get('status')}")
print(f"  Progress: {current.get('progress', 0)}%")
print()

# 검증 결과 기반 업데이트
update_data = {
    'progress': 50,  # 10% → 50%
    'updated_at': datetime.now().isoformat()
}

# 기존 remarks에 검증 결과 추가
existing_remarks = current.get('remarks', '') or ''
new_remark = "[2025-11-18 검증] 이메일 발송 코드 완성 (email.ts). 남은 작업: Resend API Key 발급, 도메인 인증, 테스트 발송"

if existing_remarks:
    update_data['remarks'] = f"{existing_remarks}\n{new_remark}"
else:
    update_data['remarks'] = new_remark

# 업데이트 실행
try:
    supabase.table('project_grid_tasks_revised').update(update_data).eq('task_id', task_id).execute()

    print("[OK] Update Complete!")
    print()
    print(f"Update Details:")
    print(f"  Progress: {current.get('progress', 0)}% -> 50%")
    print(f"  Status: {current.get('status')} (Maintained)")
    print(f"  Remarks: {new_remark}")
    print()
    print("=" * 80)
    print("Verification Summary:")
    print("=" * 80)
    print()
    print("[COMPLETE] Completed Items:")
    print("  1. Resend client setup (email.ts)")
    print("  2. Inquiry response email function")
    print("  3. HTML email template (Korean support)")
    print("  4. Error handling")
    print()
    print("[TODO] Remaining Tasks:")
    print("  1. Add RESEND_API_KEY to .env.example")
    print("  2. Domain authentication (politicianfinder.com)")
    print("  3. Obtain Resend API Key")
    print("  4. Test email sending")
    print()
    print("[PROGRESS] 10% -> 50% (Code complete, config and testing remaining)")
    print()

except Exception as e:
    print(f"[ERROR] Update failed: {str(e)}")
    sys.exit(1)
