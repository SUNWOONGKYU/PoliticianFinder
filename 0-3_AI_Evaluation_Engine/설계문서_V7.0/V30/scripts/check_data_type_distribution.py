#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""data_type 필드 전체 분포 확인"""

import os
import sys
from pathlib import Path
from supabase import create_client
from dotenv import load_dotenv
from collections import Counter

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
print("data_type 필드 전체 분포 확인")
print("="*70)
print()

# 전체 데이터 확인
response = supabase.table('collected_data_v30') \
    .select('category, data_type, collector_ai') \
    .eq('politician_id', 'd0a5d6e1') \
    .execute()

total = len(response.data)
print(f"총 데이터: {total}개")
print()

# data_type 분포
data_type_counter = Counter()
null_count = 0

for item in response.data:
    dt = item.get('data_type')
    if dt:
        data_type_counter[dt] += 1
    else:
        null_count += 1

print("전체 data_type 분포:")
for dt, count in sorted(data_type_counter.items()):
    percentage = (count / total * 100) if total > 0 else 0
    print(f"  - {dt}: {count}개 ({percentage:.1f}%)")

if null_count > 0:
    percentage = (null_count / total * 100) if total > 0 else 0
    print(f"  - NULL: {null_count}개 ({percentage:.1f}%)")

print()

# 카테고리별 data_type 분포
CATEGORIES = [
    ('integrity', '정직성'),
    ('leadership', '리더십'),
    ('communication', '소통'),
    ('expertise', '전문성'),
    ('vision', '비전'),
    ('transparency', '투명성'),
    ('accountability', '책임성'),
    ('ethics', '윤리성'),
    ('responsiveness', '대응성'),
    ('publicinterest', '공익성')
]

print("카테고리별 data_type 분포:")
print("-"*70)

for cat_name, cat_korean in CATEGORIES:
    cat_items = [item for item in response.data if item['category'] == cat_name]

    official = sum(1 for item in cat_items if item.get('data_type') == 'official')
    public = sum(1 for item in cat_items if item.get('data_type') == 'public')
    null = sum(1 for item in cat_items if not item.get('data_type'))

    total_cat = len(cat_items)

    print(f"{cat_korean:10} ({cat_name:15}): {total_cat:3}개 = official {official:2} + public {public:2}", end='')
    if null > 0:
        print(f" + NULL {null}")
    else:
        print()

print("="*70)
print()

# V30 목표와 비교
expected_official = 500
expected_public = 500

actual_official = data_type_counter.get('official', 0)
actual_public = data_type_counter.get('public', 0)

print("V30 목표 대비:")
print(f"  OFFICIAL: {actual_official:3}개 / {expected_official}개 ({actual_official/expected_official*100:.1f}%)")
print(f"  PUBLIC:   {actual_public:3}개 / {expected_public}개 ({actual_public/expected_public*100:.1f}%)")
print()

if null_count == 0:
    print("✅ data_type 필드: 모든 데이터에 정상 존재")
else:
    print(f"⚠️ data_type 필드: {null_count}개 누락")
