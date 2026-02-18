#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
조은희 V40 수집 현황 확인
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
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

# .env 로드
env_path = Path(__file__).parent.parent.parent.parent / '.env'
load_dotenv(env_path)

# Supabase 초기화
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

politician_id = 'd0a5d6e1'

# 전체 개수
result = supabase.table('collected_data_v40') \
    .select('id', count='exact') \
    .eq('politician_id', politician_id) \
    .execute()
total = result.count if result.count else 0

# AI별 개수
result = supabase.table('collected_data_v40') \
    .select('collector_ai') \
    .eq('politician_id', politician_id) \
    .execute()

ai_counts = {}
for item in result.data:
    ai = item['collector_ai']
    ai_counts[ai] = ai_counts.get(ai, 0) + 1

# 카테고리별 개수
result = supabase.table('collected_data_v40') \
    .select('category') \
    .eq('politician_id', politician_id) \
    .execute()

cat_counts = {}
for item in result.data:
    cat = item['category']
    cat_counts[cat] = cat_counts.get(cat, 0) + 1

print(f'{"="*60}')
print(f'  조은희 V40 수집 현황')
print(f'{"="*60}\n')

print(f'총 수집: {total}개 / 1000개 (목표)')
print(f'진행률: {total / 10:.1f}%\n')

print(f'AI별 분포:')
# V40 1000개: Gemini 500 (50%) + Naver 500 (50%)
for ai in ['Gemini', 'Naver']:
    count = ai_counts.get(ai, 0)
    pct = (count / total * 100) if total > 0 else 0
    target = 500  # Gemini 500, Naver 500
    status = '✅' if count >= target else '🔄'
    print(f'  {status} {ai}: {count}개 / {target}개 ({pct:.1f}%)')

print(f'\n카테고리별 분포:')
categories = ['expertise', 'leadership', 'vision', 'integrity', 'ethics', 'accountability',
              'transparency', 'communication', 'responsiveness', 'publicinterest']
for cat in categories:
    count = cat_counts.get(cat, 0)
    status = '✅' if count >= 100 else '🔄'
    print(f'  {status} {cat}: {count}개 / 100개')

print(f'\n{"="*60}')
