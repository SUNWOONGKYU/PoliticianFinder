#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
OFFICIAL 데이터 전체 확인
- 제목, 출처, 수집 AI 모두 출력
"""
import os
import sys
from supabase import create_client
from dotenv import load_dotenv

if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

load_dotenv()
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY'))

POLITICIAN_ID = "0756ec15"

# 김동연 Expertise OFFICIAL 데이터 전체 조회
response = supabase.table('collected_data').select(
    'ai_name, data_title, source_url, data_source, collection_date'
).eq(
    'politician_id', POLITICIAN_ID
).eq('category_name', 'Expertise').eq('source_type', 'OFFICIAL').order(
    'collection_date', desc=False
).execute()

print(f'='*100)
print(f'OFFICIAL 데이터 전체 ({len(response.data)}개)')
print(f'='*100)

for i, item in enumerate(response.data, 1):
    ai = 'Claude' if item['ai_name'].startswith('claude') else item['ai_name']
    date = item.get('collection_date', 'N/A')[:10] if item.get('collection_date') else 'N/A'

    print(f'\n{i}. [{ai}] ({date})')
    print(f'   제목: {item["data_title"]}')
    print(f'   출처: {item.get("data_source", "N/A")}')
    if item.get('source_url'):
        print(f'   URL:  {item["source_url"][:90]}')

print(f'\n{'='*100}')
print('분석:')
print(f'- ChatGPT: {sum(1 for x in response.data if x["ai_name"] == "ChatGPT")}개')
print(f'- Grok: {sum(1 for x in response.data if x["ai_name"] == "Grok")}개')
print(f'- Claude: {sum(1 for x in response.data if x["ai_name"].startswith("claude"))}개')
