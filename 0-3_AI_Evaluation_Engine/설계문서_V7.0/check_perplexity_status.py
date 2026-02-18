#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Perplexity 카테고리별 현황 확인"""

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

# Perplexity 카테고리별 현황
categories = ['expertise', 'leadership', 'vision', 'integrity', 'ethics',
              'accountability', 'transparency', 'communication', 'responsiveness', 'publicinterest']

print('=== Perplexity 카테고리별 현황 ===')
total = 0
shortage = {}
for cat in categories:
    result = supabase.table('collected_data_v30').select('*', count='exact')\
        .eq('politician_id', politician_id)\
        .eq('category', cat)\
        .eq('data_type', 'public')\
        .eq('collector_ai', 'Perplexity')\
        .execute()
    count = result.count
    total += count
    if count < 25:
        shortage[cat] = 25 - count
    status = '✅' if count >= 25 else f'⚠️ ({25-count} 부족)'
    print(f'{cat:15s}: {count:2d}/25 {status}')

print(f'\nTotal: {total}/250')
if shortage:
    print(f'\n부족 카테고리 ({len(shortage)}개):')
    for cat, need in sorted(shortage.items(), key=lambda x: -x[1]):
        print(f'  {cat}: {need}개 필요')
else:
    print('\n✅ 모든 카테고리 완료!')
