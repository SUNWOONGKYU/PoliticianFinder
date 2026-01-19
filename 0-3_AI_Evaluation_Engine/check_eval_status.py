# -*- coding: utf-8 -*-
"""평가 완성도 정확히 확인"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '설계문서_V7.0', '실행스크립트'))

from collect_v30 import supabase

politician_id = 'f9e00370'

# 전체 평가 수 확인 (페이지네이션)
all_evals = []
offset = 0
limit = 1000

print("평가 데이터 조회 중...")
while True:
    result = supabase.table('evaluations_v30')\
        .select('collected_data_id, category, evaluator_ai')\
        .eq('politician_id', politician_id)\
        .range(offset, offset + limit - 1)\
        .execute()

    if not result.data:
        break

    all_evals.extend(result.data)
    print(f'  {len(result.data)}개 조회 (offset {offset})')

    if len(result.data) < limit:
        break

    offset += limit

print(f'\n총 평가 수: {len(all_evals)}')

# 수집 데이터 수
collected = supabase.table('collected_data_v30')\
    .select('id', count='exact')\
    .eq('politician_id', politician_id)\
    .execute()

print(f'수집 데이터: {collected.count}개')
print(f'목표: {collected.count} × 4 = {collected.count * 4}')
print(f'달성률: {len(all_evals) / (collected.count * 4) * 100:.1f}%')

# AI별 평가 수
from collections import Counter
ai_counts = Counter([ev['evaluator_ai'] for ev in all_evals])
print(f'\nAI별 평가 수:')
for ai in ['Claude', 'ChatGPT', 'Gemini', 'Grok']:
    count = ai_counts.get(ai, 0)
    print(f'  {ai}: {count}/{collected.count} ({count/collected.count*100:.1f}%)')
