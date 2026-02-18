#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""data_type 필드 존재 확인"""

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

# 샘플 10개 확인
response = supabase.table('collected_data_v30') \
    .select('id, category, data_type, collector_ai, title') \
    .eq('politician_id', 'd0a5d6e1') \
    .limit(10) \
    .execute()

print("="*60)
print("data_type 필드 존재 확인")
print("="*60)
print()

has_data_type = 0
null_data_type = 0

for item in response.data:
    data_type = item.get('data_type')
    if data_type:
        has_data_type += 1
        print(f"✅ {item['category']}: data_type='{data_type}' ({item['collector_ai']})")
        print(f"   {item['title'][:60]}...")
    else:
        null_data_type += 1
        print(f"❌ {item['category']}: data_type=NULL ({item['collector_ai']})")
        print(f"   {item['title'][:60]}...")
    print()

print(f"총 {len(response.data)}개 중:")
print(f"  - data_type 있음: {has_data_type}개")
print(f"  - data_type 없음: {null_data_type}개")
