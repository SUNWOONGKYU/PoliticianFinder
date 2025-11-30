#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
OFFICIAL 데이터 중복 분석
왜 중복이 없는지 확인
"""
import os
import sys
from supabase import create_client
from dotenv import load_dotenv
from collections import Counter

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

load_dotenv()
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY'))

POLITICIAN_ID = "0756ec15"

# 김동연 Expertise OFFICIAL 데이터만 조회
response = supabase.table('collected_data').select('ai_name, data_title, source_url, source_type').eq(
    'politician_id', POLITICIAN_ID
).eq('category_name', 'Expertise').eq('source_type', 'OFFICIAL').execute()

print(f'OFFICIAL 데이터 총 {len(response.data)}개\n')

# AI별 OFFICIAL 데이터 수
print('AI별 OFFICIAL 데이터 수:')
ai_counts = Counter([item['ai_name'] for item in response.data])
for ai, count in ai_counts.items():
    display = 'Claude' if ai.startswith('claude') else ai
    print(f'  {display}: {count}개')

# URL 중복 체크
urls = [item.get('source_url', '') for item in response.data if item.get('source_url')]
url_counts = Counter(urls)
duplicates = {url: count for url, count in url_counts.items() if count > 1}

print(f'\n중복 URL: {len(duplicates)}개')
if duplicates:
    print('\n중복 URL 예시 (상위 5개):')
    for url, count in sorted(duplicates.items(), key=lambda x: x[1], reverse=True)[:5]:
        print(f'\n  {count}회 중복: {url[:80]}')
        # 이 URL을 사용한 AI들
        items = [item for item in response.data if item.get('source_url') == url]
        ais = [('Claude' if item['ai_name'].startswith('claude') else item['ai_name']) for item in items]
        print(f'         수집 AI: {", ".join(ais)}')
        print(f'         제목: {items[0]["data_title"][:60]}...')
else:
    print('  없음!')

    # 제목으로 유사도 체크
    print('\n제목 앞 30자로 그룹화:')
    title_groups = {}
    for item in response.data:
        title_prefix = item['data_title'][:30]
        if title_prefix not in title_groups:
            title_groups[title_prefix] = []
        title_groups[title_prefix].append(item)

    dup_titles = {k: v for k, v in title_groups.items() if len(v) > 1}
    print(f'  유사 제목 그룹: {len(dup_titles)}개')

    if dup_titles:
        print('\n유사 제목 예시 (상위 3개):')
        for prefix, items in sorted(dup_titles.items(), key=lambda x: len(x[1]), reverse=True)[:3]:
            print(f'\n  "{prefix}..." ({len(items)}개)')
            for item in items:
                ai = 'Claude' if item['ai_name'].startswith('claude') else item['ai_name']
                print(f'    - {ai}: {item["data_title"][:70]}')
                print(f'      URL: {item.get("source_url", "N/A")[:70]}')
