#!/usr/bin/env python3
"""
V30 AI별 카테고리별 점수 비교표 생성
"""

import sys
import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client
from collections import defaultdict

# .env 파일 로드
load_dotenv()

supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
supabase = create_client(supabase_url, supabase_key)

politician_id = 'f9e00370'
politician_name = '김민석'

# 모든 평가 조회 (pagination 사용)
print(f'Querying evaluations for {politician_id}...')

# 전체 개수 확인
count_result = supabase.from_('evaluations_v30')\
    .select('*', count='exact')\
    .eq('politician_id', politician_id)\
    .execute()

total_count = count_result.count
print(f'Total evaluations in DB: {total_count}')

# 모든 데이터 가져오기 (pagination)
all_data = []
page_size = 1000
offset = 0

while offset < total_count:
    result = supabase.from_('evaluations_v30')\
        .select('evaluator_ai, category, score')\
        .eq('politician_id', politician_id)\
        .range(offset, offset + page_size - 1)\
        .execute()

    all_data.extend(result.data)
    offset += page_size
    print(f'Fetched {len(all_data)}/{total_count} records...')

print(f'Total records fetched: {len(all_data)}')

# AI별, 카테고리별 집계
stats = defaultdict(lambda: defaultdict(list))
for row in all_data:
    stats[row['evaluator_ai']][row['category']].append(row['score'])

# 카테고리 순서
categories = ['expertise', 'leadership', 'vision', 'integrity', 'ethics',
              'accountability', 'transparency', 'communication', 'responsiveness', 'publicinterest']
cat_names = {
    'expertise': '전문성',
    'leadership': '리더십',
    'vision': '비전',
    'integrity': '청렴성',
    'ethics': '윤리성',
    'accountability': '책임성',
    'transparency': '투명성',
    'communication': '소통능력',
    'responsiveness': '대응성',
    'publicinterest': '공익추구'
}

# AI 순서
ais = ['Claude', 'ChatGPT', 'Gemini', 'Grok']

print(f'\n{politician_name} ({politician_id}) - AI별 카테고리별 평균 점수\n')
print('=' * 100)

# 헤더 출력
print(f'카테고리         | Claude          | ChatGPT         | Gemini          | Grok            | AI 평균')
print('-' * 100)

# 카테고리별 점수 출력
category_totals = {}
for cat in categories:
    cat_name = cat_names[cat]
    print(f'{cat_name:8s}', end='')

    cat_scores = []
    for ai in ais:
        if cat in stats[ai] and len(stats[ai][cat]) > 0:
            avg = sum(stats[ai][cat]) / len(stats[ai][cat])
            count = len(stats[ai][cat])
            print(f' | {avg:+6.2f} ({count:3d})', end='')
            cat_scores.append(avg)
        else:
            print(f' | {"N/A":>11s}', end='')

    if cat_scores:
        cat_avg = sum(cat_scores) / len(cat_scores)
        print(f' | {cat_avg:+6.2f}')
        category_totals[cat] = cat_avg
    else:
        print(f' | {"N/A":>11s}')

print('-' * 100)

# 전체 평균 출력
print(f'전체 평균      ', end='')
for ai in ais:
    all_scores = []
    for cat in categories:
        if cat in stats[ai]:
            all_scores.extend(stats[ai][cat])

    if all_scores:
        avg = sum(all_scores) / len(all_scores)
        count = len(all_scores)
        print(f' | {avg:+6.2f} ({count:3d})', end='')
    else:
        print(f' | {"N/A":>11s}', end='')

# AI 전체 평균
all_ai_scores = []
for ai in ais:
    for cat in categories:
        if cat in stats[ai]:
            all_ai_scores.extend(stats[ai][cat])

if all_ai_scores:
    total_avg = sum(all_ai_scores) / len(all_ai_scores)
    print(f' | {total_avg:+6.2f}')
else:
    print(f' | {"N/A":>11s}')

print('=' * 100)
print()

# Claude 상세 정보
print('\nClaude 카테고리별 상세:')
print('-' * 60)
claude_stats = stats['Claude']
for cat in categories:
    cat_name = cat_names[cat]
    if cat in claude_stats and len(claude_stats[cat]) > 0:
        scores = claude_stats[cat]
        avg = sum(scores) / len(scores)
        count = len(scores)
        print(f'{cat_name:8s}: 평균 {avg:+6.2f} ({count}개 평가)')
    else:
        print(f'{cat_name:8s}: 평가 없음')

# 전체 Claude 평가 수
total_claude = sum(len(scores) for scores in claude_stats.values())
print(f'\n총 Claude 평가: {total_claude}개')
print()

# AI별 전체 통계
print('\nAI별 전체 통계:')
print('-' * 60)
for ai in ais:
    all_scores = []
    for cat in categories:
        if cat in stats[ai]:
            all_scores.extend(stats[ai][cat])

    if all_scores:
        avg = sum(all_scores) / len(all_scores)
        count = len(all_scores)
        print(f'{ai:12s}: 평균 {avg:+6.2f} ({count}개 평가)')
    else:
        print(f'{ai:12s}: 평가 없음')

print()
