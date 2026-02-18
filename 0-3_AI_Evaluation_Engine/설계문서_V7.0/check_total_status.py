#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""V30 전체 수집 현황 확인"""

import os
import sys
import io
from supabase import create_client
from dotenv import load_dotenv

# UTF-8 출력 설정
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# V30/scripts에서 환경 변수 로드
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'V30', 'scripts'))
load_dotenv()

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

politician_id = 'd0a5d6e1'

print('=' * 70)
print('V30 전체 수집 현황 - 조은희 (d0a5d6e1)')
print('=' * 70)

# AI별 현황
ais = ['Gemini', 'Perplexity']
ai_totals = {}

for ai in ais:
    result = supabase.table('collected_data_v30').select('*', count='exact')\
        .eq('politician_id', politician_id)\
        .eq('collector_ai', ai)\
        .execute()
    ai_totals[ai] = result.count

print(f'\nAI별 수집:')
print(f'  Gemini:     {ai_totals["Gemini"]:3d}/750 {"✅" if ai_totals["Gemini"] >= 750 else "⚠️"}')
print(f'  Perplexity: {ai_totals["Perplexity"]:3d}/250 {"✅" if ai_totals["Perplexity"] >= 250 else "⚠️"}')

total = sum(ai_totals.values())
print(f'\n전체: {total}/1000 {"✅" if total >= 1000 else "⚠️"}')

# data_type별 현황
print(f'\ndata_type별 현황:')
for dtype in ['official', 'public']:
    result = supabase.table('collected_data_v30').select('*', count='exact')\
        .eq('politician_id', politician_id)\
        .eq('data_type', dtype)\
        .execute()
    count = result.count
    expected = 500 if dtype == 'official' else 500
    print(f'  {dtype.upper():8s}: {count:3d}/{expected} {"✅" if count >= expected else "⚠️"}')

print('=' * 70)
