#!/usr/bin/env python3
"""Detailed status check including collector AI breakdown"""

import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

ENV_PATH = Path(__file__).resolve().parent.parent.parent.parent.parent / '.env'
if ENV_PATH.exists():
    load_dotenv(ENV_PATH)
else:
    load_dotenv()

supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))

result = supabase.table('collected_data_v40').select('id', count='exact').eq(
    'politician_id', '8c5dcc89'
).execute()

print(f'\nTotal data count: {result.count}')

# Collector AI breakdown
print('\nCollector AI breakdown:')
for ai in ['Gemini', 'Naver']:
    ai_result = supabase.table('collected_data_v40').select('id', count='exact').eq(
        'politician_id', '8c5dcc89'
    ).eq('collector_ai', ai).execute()
    print(f'  {ai}: {ai_result.count}')

# Category breakdown by AI
categories = [
    'expertise', 'leadership', 'vision', 'integrity', 'ethics',
    'accountability', 'transparency', 'communication', 'responsiveness', 'publicinterest'
]

print('\nCategory breakdown by AI:')
print('-' * 80)
print(f'{"Category":<20} {"Gemini":<10} {"Naver":<10} {"Total":<10}')
print('-' * 80)

total_gemini = 0
total_naver = 0
for cat in categories:
    gemini_count = supabase.table('collected_data_v40').select('id', count='exact').eq(
        'politician_id', '8c5dcc89'
    ).eq('category', cat).eq('collector_ai', 'Gemini').execute().count

    naver_count = supabase.table('collected_data_v40').select('id', count='exact').eq(
        'politician_id', '8c5dcc89'
    ).eq('category', cat).eq('collector_ai', 'Naver').execute().count

    total = gemini_count + naver_count
    total_gemini += gemini_count
    total_naver += naver_count

    print(f'{cat:<20} {gemini_count:<10} {naver_count:<10} {total:<10}')

print('-' * 80)
print(f'{"TOTAL":<20} {total_gemini:<10} {total_naver:<10} {total_gemini + total_naver:<10}')
