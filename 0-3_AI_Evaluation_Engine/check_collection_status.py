# -*- coding: utf-8 -*-
"""
Step 1 수집 결과 확인
"""

import os
from supabase import create_client
from dotenv import load_dotenv
from collections import Counter

load_dotenv()

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

politician_id = 'f9e00370'

result = supabase.table('collected_data_v30').select('*').eq('politician_id', politician_id).execute()

total = len(result.data)
ai_counts = Counter(item.get('collector_ai') for item in result.data)
category_counts = Counter(item.get('category') for item in result.data)

print('\n' + '='*80)
print('Step 1: 데이터 수집 최종 결과')
print('='*80)

print(f'\n총 수집: {total}개 / 1,000개 ({total/10:.1f}%)')

print(f'\nAI별:')
print(f'  Gemini: {ai_counts.get("Gemini", 0)}/600')
print(f'  Perplexity: {ai_counts.get("Perplexity", 0)}/300')
print(f'  Grok: {ai_counts.get("Grok", 0)}/100')

print(f'\n카테고리별:')
cats = ['expertise', 'leadership', 'vision', 'integrity', 'ethics',
        'accountability', 'transparency', 'communication', 'responsiveness', 'publicinterest']

incomplete = []
for cat in cats:
    count = category_counts.get(cat, 0)
    status = '[OK]' if count == 100 else f'[{count}/100]'
    print(f'  {cat}: {count} {status}')
    if count < 100:
        incomplete.append((cat, count))

print(f'\n완료 카테고리: {len([c for c in cats if category_counts.get(c, 0) == 100])}/10')
print(f'미완료 카테고리: {len(incomplete)}개')

if incomplete:
    print(f'\n미완료 항목:')
    for cat, count in incomplete:
        print(f'  - {cat}: {count}/100 (부족 {100-count}개)')

print('\n' + '='*80)

if total == 1000:
    print('\n[OK] Step 1 수집 완료!')
    print('\n다음 단계: Step 2 (수집 데이터 검증 및 평가 준비)')
else:
    print(f'\n[진행 중] 수집 진행률: {total/10:.1f}%')
    print(f'남은 수집: {1000 - total}개')
