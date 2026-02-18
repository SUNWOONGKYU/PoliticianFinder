#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
DB에 실제 저장된 category 값 확인
"""

import os
import sys
from pathlib import Path
from supabase import create_client
from dotenv import load_dotenv

# UTF-8 출력 설정
if sys.platform == 'win32':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')

# .env 로드
env_path = Path(__file__).parent.parent.parent.parent / '.env'
load_dotenv(env_path)

# Supabase 초기화
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

politician_id = 'd0a5d6e1'

print("="*60)
print("  DB에 저장된 category 값 확인 (조은희)")
print("="*60)

# 모든 category 값 가져오기
result = supabase.table('collected_data_v30') \
    .select('category') \
    .eq('politician_id', politician_id) \
    .execute()

# 고유 category 값 추출
categories = set()
for item in result.data:
    categories.add(item['category'])

print(f"\n총 {len(categories)}개 카테고리 발견:\n")

for i, cat in enumerate(sorted(categories), 1):
    # 각 카테고리별 개수
    count_result = supabase.table('collected_data_v30') \
        .select('id', count='exact') \
        .eq('politician_id', politician_id) \
        .eq('category', cat) \
        .execute()
    count = count_result.count if count_result.count else 0
    print(f"  {i}. {cat}: {count}개")

print("\n" + "="*60)
print("  공식 V30 카테고리 (README.md 기준)")
print("="*60)

official_categories = [
    "expertise",
    "leadership",
    "vision",
    "integrity",
    "ethics",
    "accountability",
    "transparency",
    "communication",
    "responsiveness",
    "publicinterest"
]

print()
for i, cat in enumerate(official_categories, 1):
    status = "✅" if cat in categories else "❌"
    print(f"  {status} {i}. {cat}")

print("\n" + "="*60)
