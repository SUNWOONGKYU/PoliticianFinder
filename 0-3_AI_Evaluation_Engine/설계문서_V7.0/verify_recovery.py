#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Time Travel 복구 확인"""

import os
import sys
import io
from supabase import create_client
from dotenv import load_dotenv

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
load_dotenv()

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

politician_id = 'd0a5d6e1'

print('=' * 80)
print('Time Travel 복구 확인')
print('=' * 80)

# 전체 데이터
result = supabase.table('collected_data_v30').select('*', count='exact')\
    .eq('politician_id', politician_id)\
    .execute()

total = result.count
print(f'\n전체 데이터: {total}개')

# AI별
gemini = supabase.table('collected_data_v30').select('*', count='exact')\
    .eq('politician_id', politician_id)\
    .eq('collector_ai', 'Gemini')\
    .execute().count

perplexity = supabase.table('collected_data_v30').select('*', count='exact')\
    .eq('politician_id', politician_id)\
    .eq('collector_ai', 'Perplexity')\
    .execute().count

print(f'\nAI별:')
print(f'  Gemini:     {gemini:3d}/750 {"✅" if gemini >= 700 else "⚠️"}')
print(f'  Perplexity: {perplexity:3d}/250 {"✅" if perplexity >= 200 else "⚠️"}')

# 판정
print('\n' + '=' * 80)
if total >= 900:
    print('✅ 복구 성공!')
    print('   → 검증 없이 바로 평가 진행 가능')
elif total >= 500:
    print('⚠️ 부분 복구')
    print('   → 부족분 재수집 필요')
else:
    print('❌ 복구 실패 또는 미완료')
    print('   → 재수집 필요')
print('=' * 80)
