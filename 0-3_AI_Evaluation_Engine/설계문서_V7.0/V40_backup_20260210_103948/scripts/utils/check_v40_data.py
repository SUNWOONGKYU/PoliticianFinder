# -*- coding: utf-8 -*-
"""V40 데이터 확인"""

import os
import sys
from dotenv import load_dotenv
from supabase import create_client

sys.stdout.reconfigure(encoding='utf-8')

load_dotenv(override=True)

supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_SERVICE_KEY')
supabase = create_client(supabase_url, supabase_key)

print("1. collected_data_v40 테이블 확인...")
try:
    result = supabase.table('collected_data_v40').select('*').limit(1).execute()
    print(f"[OK] 테이블 존재: collected_data_v40")
except Exception as e:
    print(f"[ERROR] 테이블 없음: {e}")
    sys.exit(1)

print("\n2. 조은희(d0a5d6e1) 데이터 확인...")
result = supabase.table('collected_data_v40')\
    .select('*', count='exact')\
    .eq('politician_id', 'd0a5d6e1')\
    .execute()

print(f"   전체 데이터: {result.count}개")

# 카테고리별로 확인
for cat_id in range(1, 11):
    cat_result = supabase.table('collected_data_v40')\
        .select('*', count='exact')\
        .eq('politician_id', 'd0a5d6e1')\
        .eq('category_id', cat_id)\
        .execute()

    print(f"   카테고리 {cat_id}: {cat_result.count}개")

print("\n3. 카테고리 1 (expertise) 상세 확인...")
result = supabase.table('collected_data_v40')\
    .select('id, ai_name, data_type, data_title')\
    .eq('politician_id', 'd0a5d6e1')\
    .eq('category_id', 1)\
    .limit(5)\
    .execute()

if result.data:
    print(f"   예시 데이터 {len(result.data)}개:")
    for item in result.data:
        print(f"   - [{item['ai_name']}] {item['data_type']}: {item['data_title'][:50]}...")
else:
    print("   [OK] 카테고리 1 데이터 없음 (삭제 완료)")

print("\n완료")
