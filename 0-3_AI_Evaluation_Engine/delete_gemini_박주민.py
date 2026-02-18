#!/usr/bin/env python3
"""Gemini API로 잘못 수집한 박주민 데이터 삭제"""

import os
from dotenv import load_dotenv
from supabase import create_client

# .env 로드
load_dotenv()

# Supabase 연결
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

politician_id = '8c5dcc89'
politician_name = '박주민'

print(f"[DELETE] {politician_name} ({politician_id}) Gemini 수집 데이터 삭제 시작...")

# 1. 삭제 전 개수 확인
result = supabase.table('collected_data_v40') \
    .select('id', count='exact') \
    .eq('politician_id', politician_id) \
    .eq('collector_ai', 'Gemini') \
    .execute()

count_before = result.count if result.count else 0
print(f"[BEFORE] 삭제 전: {count_before}개")

if count_before == 0:
    print("[OK] 삭제할 데이터가 없습니다.")
    exit(0)

# 2. 삭제 실행
try:
    delete_result = supabase.table('collected_data_v40') \
        .delete() \
        .eq('politician_id', politician_id) \
        .eq('collector_ai', 'Gemini') \
        .execute()

    print(f"[OK] 삭제 완료: {count_before}개 삭제됨")

except Exception as e:
    print(f"[ERROR] 삭제 실패: {e}")
    exit(1)

# 3. 삭제 후 확인
result_after = supabase.table('collected_data_v40') \
    .select('id', count='exact') \
    .eq('politician_id', politician_id) \
    .eq('collector_ai', 'Gemini') \
    .execute()

count_after = result_after.count if result_after.count else 0
print(f"[AFTER] 삭제 후: {count_after}개")

if count_after == 0:
    print("[OK] Gemini 데이터 완전 삭제 확인!")
else:
    print(f"[WARNING] {count_after}개 데이터가 남아있습니다.")

# 4. 현재 수집 상태 확인
print("\n[STATUS] 현재 수집 상태:")
for ai in ['Gemini', 'Naver']:
    result = supabase.table('collected_data_v40') \
        .select('id', count='exact') \
        .eq('politician_id', politician_id) \
        .eq('collector_ai', ai) \
        .execute()
    count = result.count if result.count else 0
    print(f"  {ai}: {count}개")
