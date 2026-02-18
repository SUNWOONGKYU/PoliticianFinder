#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""최근 수집 데이터 확인"""

import os
import sys
from pathlib import Path
from supabase import create_client
from dotenv import load_dotenv

# UTF-8 출력
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

env_path = Path(__file__).parent.parent.parent.parent / '.env'
load_dotenv(env_path)

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

print("="*70)
print("최근 수집된 데이터 확인 (최신 20개)")
print("="*70)
print()

# 최근 수집된 데이터
response = supabase.table('collected_data_v30') \
    .select('category, data_type, collector_ai, title, created_at') \
    .eq('politician_id', 'd0a5d6e1') \
    .order('created_at', desc=True) \
    .limit(20) \
    .execute()

official_count = 0
public_count = 0

for item in response.data:
    created = item.get('created_at', '')[:19]
    dt = item['data_type']

    if dt == 'official':
        official_count += 1
    else:
        public_count += 1

    print(f"{created} | {item['category']:15} | {dt:8} | {item['collector_ai']:6}")
    print(f"  → {item['title'][:60]}...")
    print()

print("="*70)
print(f"최근 20개 중: OFFICIAL {official_count}개, PUBLIC {public_count}개")
