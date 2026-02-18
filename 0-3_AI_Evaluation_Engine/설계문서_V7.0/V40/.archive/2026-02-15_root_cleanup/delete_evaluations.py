#!/usr/bin/env python3
"""
박주민 평가 데이터 삭제 스크립트
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

# .env 로드
load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Supabase credentials not found")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

POLITICIAN_ID = '8c5dcc89'
POLITICIAN_NAME = '박주민'

print("="*80)
print(f"박주민({POLITICIAN_ID}) 평가 데이터 삭제")
print("="*80)

# 현재 평가 데이터 확인
print("\n[1] 현재 평가 데이터 확인 중...")
result = supabase.table('evaluations_v40').select('id, evaluator_ai').eq('politician_id', POLITICIAN_ID).execute()
current_count = len(result.data)

if current_count == 0:
    print("삭제할 평가 데이터가 없습니다.")
    exit(0)

print(f"현재 평가 데이터: {current_count}개")

# AI별 개수
ai_counts = {}
for item in result.data:
    ai = item['evaluator_ai']
    ai_counts[ai] = ai_counts.get(ai, 0) + 1

print("\nAI별 평가 개수:")
for ai, count in sorted(ai_counts.items()):
    print(f"  {ai}: {count}개")

# 삭제 확인
print(f"\n⚠️  위 {current_count}개의 평가 데이터를 삭제합니다.")
confirm = input("계속 진행하시겠습니까? (yes/no): ")

if confirm.lower() != 'yes':
    print("삭제 취소됨")
    exit(0)

# 삭제 실행
print("\n[2] 평가 데이터 삭제 중...")
delete_result = supabase.table('evaluations_v40').delete().eq('politician_id', POLITICIAN_ID).execute()

print(f"✅ 삭제 완료: {current_count}개")

# 검증
print("\n[3] 삭제 검증 중...")
verify_result = supabase.table('evaluations_v40').select('id').eq('politician_id', POLITICIAN_ID).execute()
remaining = len(verify_result.data)

if remaining == 0:
    print("✅ 검증 완료: 모든 평가 데이터가 삭제되었습니다.")
else:
    print(f"⚠️  경고: {remaining}개의 평가 데이터가 남아있습니다.")

print("\n" + "="*80)
print("삭제 완료")
print("="*80)
