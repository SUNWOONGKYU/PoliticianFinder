# -*- coding: utf-8 -*-
"""
Update modification_history for P4BA13 and P4BA9
Phase 4 테스트 파일 Jest 변환 기록
"""

import sys
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

import os
from supabase import create_client, Client

# Supabase credentials
SUPABASE_URL = "https://ooddlafwdpzgxfefgsrx.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZGRsYWZ3ZHB6Z3hmZWZnc3J4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU5MjQzNCwiZXhwIjoyMDc2MTY4NDM0fQ.qiVzF8VLQ9jyDvv5ZLdw_6XTog8aAUPyJLkeffsA1qU"

# Create Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Update P4BA13 (action-logs test)
p4ba13_history = "[ERROR] TypeScript 타입 오류 (vitest 모듈 없음) → [FIX] 사용자 승인 후 Claude Code 수정 (vitest→Jest 변환) → [PASS] TypeScript 타입 체크 0 오류 [2025-11-09 검증 완료]"

print("Updating P4BA13 modification_history...")
try:
    result = supabase.table('project_grid_tasks_revised').update({
        'modification_history': p4ba13_history
    }).eq('task_id', 'P4BA13').execute()

    print(f"✅ P4BA13 updated successfully")
    print(f"   modification_history: {p4ba13_history}")
except Exception as e:
    print(f"❌ Error updating P4BA13: {e}")

# Update P4BA9 (ads test)
p4ba9_history = "[ERROR] TypeScript 타입 오류 (vitest 모듈 없음) → [FIX] 사용자 승인 후 Claude Code 수정 (vitest→Jest 변환) → [PASS] TypeScript 타입 체크 0 오류 [2025-11-09 검증 완료]"

print("\nUpdating P4BA9 modification_history...")
try:
    result = supabase.table('project_grid_tasks_revised').update({
        'modification_history': p4ba9_history
    }).eq('task_id', 'P4BA9').execute()

    print(f"✅ P4BA9 updated successfully")
    print(f"   modification_history: {p4ba9_history}")
except Exception as e:
    print(f"❌ Error updating P4BA9: {e}")

print("\n" + "="*60)
print("✅ Supabase update completed")
print("="*60)
