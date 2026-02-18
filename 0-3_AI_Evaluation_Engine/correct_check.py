#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""조은희 V30 데이터 올바른 검증 (data_type 확인)"""

import sys
import os
from supabase import create_client
from collections import Counter
from dotenv import load_dotenv

# UTF-8 출력
if sys.platform == 'win32':
    import io
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    except AttributeError:
        pass

load_dotenv(override=True)

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

politician_id = 'd0a5d6e1'

print("="*80)
print(f"조은희 V30 데이터 올바른 검증 (data_type 필드)")
print("="*80)
print()

# 전체 데이터 조회
result = supabase.table('collected_data_v30')\
    .select('*')\
    .eq('politician_id', politician_id)\
    .limit(5)\
    .execute()

if len(result.data) > 0:
    print("📋 첫 번째 레코드의 모든 필드:")
    print()
    for key in sorted(result.data[0].keys()):
        value = result.data[0][key]
        if isinstance(value, str) and len(value) > 100:
            value = value[:100] + "..."
        print(f"  {key}: {value}")
    print()

    # data_type 필드 확인
    print("="*80)
    print("data_type 필드 확인")
    print("="*80)

    result_all = supabase.table('collected_data_v30')\
        .select('data_type')\
        .eq('politician_id', politician_id)\
        .execute()

    data_types = [d.get('data_type') for d in result_all.data]
    has_data_type = [dt for dt in data_types if dt is not None]

    print(f"총 데이터: {len(data_types)}개")
    print(f"data_type 있음: {len(has_data_type)}개 ({len(has_data_type)/len(data_types)*100:.1f}%)")

    if has_data_type:
        print()
        print("data_type 분포:")
        dt_counts = Counter(has_data_type)
        for dt, count in sorted(dt_counts.items()):
            pct = (count / len(has_data_type)) * 100
            print(f"  {dt}: {count}개 ({pct:.1f}%)")
    else:
        print()
        print("❌ data_type 필드가 모두 NULL 또는 존재하지 않음")
