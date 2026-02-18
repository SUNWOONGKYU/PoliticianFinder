#!/usr/bin/env python3
"""URL 중복 체크"""

import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client
from collections import Counter

ENV_PATH = Path(__file__).resolve().parent.parent.parent.parent.parent / '.env'
if ENV_PATH.exists():
    load_dotenv(ENV_PATH)
else:
    load_dotenv()

supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

result = supabase.table('collected_data_v40').select('id, category, source_url, data_type, collector_ai').eq(
    'politician_id', '8c5dcc89'
).execute()

print(f'\n총 데이터 개수: {len(result.data)}\n')

# URL별 카테고리 목록
url_categories = {}
for item in result.data:
    url = item['source_url']
    cat = item['category']

    if url not in url_categories:
        url_categories[url] = []

    url_categories[url].append(cat)

# 중복 URL 찾기 (여러 카테고리에 나타나는 URL)
duplicate_urls = {url: cats for url, cats in url_categories.items() if len(cats) > 1}

print(f"중복 URL 개수: {len(duplicate_urls)}")
print(f"고유 URL 개수: {len(url_categories)}")
print(f"중복률: {len(duplicate_urls) / len(url_categories) * 100:.1f}%\n")

if duplicate_urls:
    print("중복 URL 예시 (상위 10개):")
    print("-" * 80)

    for i, (url, cats) in enumerate(list(duplicate_urls.items())[:10], 1):
        print(f"{i}. {url}")
        print(f"   카테고리: {', '.join(set(cats))} (총 {len(cats)}번)")
        print()

# 카테고리 조합 통계
category_combinations = Counter()
for url, cats in duplicate_urls.items():
    cat_set = tuple(sorted(set(cats)))
    category_combinations[cat_set] += 1

print("\n카테고리 조합 통계:")
print("-" * 80)
for combo, count in category_combinations.most_common(10):
    print(f"{' + '.join(combo)}: {count}개")
