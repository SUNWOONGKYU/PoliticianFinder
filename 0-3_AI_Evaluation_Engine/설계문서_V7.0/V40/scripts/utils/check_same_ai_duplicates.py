#!/usr/bin/env python3
"""같은 AI가 중복 수집한 데이터 찾기"""

import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client
from collections import defaultdict

ENV_PATH = Path(__file__).resolve().parent.parent.parent.parent.parent / '.env'
if ENV_PATH.exists():
    load_dotenv(ENV_PATH)
else:
    load_dotenv()

supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

result = supabase.table('collected_data_v40').select('id, category, source_url, collector_ai').eq(
    'politician_id', '8c5dcc89'
).execute()

print(f'\n총 데이터: {len(result.data)}\n')

# (category, collector_ai, url) 기준으로 그룹화
groups = defaultdict(list)
for item in result.data:
    key = (item['category'], item['collector_ai'], item['source_url'])
    groups[key].append(item['id'])

# 같은 AI가 중복 수집한 것 찾기
same_ai_duplicates = {}
for key, ids in groups.items():
    if len(ids) > 1:
        category, ai, url = key
        same_ai_duplicates[key] = ids

print(f"같은 AI 중복 개수: {len(same_ai_duplicates)}")
print(f"중복으로 인한 불필요 데이터: {sum(len(ids)-1 for ids in same_ai_duplicates.values())}개\n")

if same_ai_duplicates:
    print("같은 AI 중복 예시 (상위 10개):")
    print("-" * 80)

    for i, (key, ids) in enumerate(list(same_ai_duplicates.items())[:10], 1):
        category, ai, url = key
        print(f"{i}. [{category}] {ai}")
        print(f"   URL: {url[:80]}...")
        print(f"   중복 횟수: {len(ids)}번")
        print(f"   ID: {ids}")
        print()

# AI별 중복 통계
ai_duplicate_counts = defaultdict(int)
for key, ids in same_ai_duplicates.items():
    category, ai, url = key
    ai_duplicate_counts[ai] += len(ids) - 1

print("\nAI별 불필요 중복:")
print("-" * 40)
for ai, count in sorted(ai_duplicate_counts.items()):
    print(f"{ai}: {count}개")
