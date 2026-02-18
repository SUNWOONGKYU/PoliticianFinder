# -*- coding: utf-8 -*-
"""V30 스키마 확인"""

import os
import sys
from dotenv import load_dotenv
from supabase import create_client

sys.stdout.reconfigure(encoding='utf-8')

load_dotenv(override=True)

supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_SERVICE_KEY')
supabase = create_client(supabase_url, supabase_key)

print("collected_data_v30 스키마 확인 중...")

# 샘플 레코드 1개 가져오기
result = supabase.table('collected_data_v30')\
    .select('*')\
    .limit(1)\
    .execute()

if result.data:
    sample = result.data[0]
    print("\n컬럼 목록:")
    for key in sorted(sample.keys()):
        value = str(sample[key])
        if len(value) > 50:
            value = value[:50] + "..."
        print(f"  {key}: {value}")
else:
    print("[ERROR] 데이터 없음")

print("\n조은희 카테고리별 데이터 확인...")

# 카테고리 값들 확인
result = supabase.table('collected_data_v30')\
    .select('category')\
    .eq('politician_id', 'd0a5d6e1')\
    .execute()

if result.data:
    categories = {}
    for item in result.data:
        cat = item['category']
        categories[cat] = categories.get(cat, 0) + 1

    print(f"\n카테고리별 데이터 수:")
    for cat in sorted(categories.keys()):
        print(f"  {cat}: {categories[cat]}개")

print("\n완료")
