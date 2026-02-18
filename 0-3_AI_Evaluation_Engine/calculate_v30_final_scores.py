# -*- coding: utf-8 -*-
"""
V30 최종 점수 계산 (올바른 공식)
PRIOR = 6.0
COEFFICIENT = 0.5
"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from supabase import create_client
from dotenv import load_dotenv
import os
from collections import defaultdict

load_dotenv()
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

# V30 점수 계산 상수
PRIOR = 6.0
COEFFICIENT = 0.5

# Rating → Score 변환
RATING_TO_SCORE = {
    '+4': 8, '+3': 6, '+2': 4, '+1': 2,
    '0': 0,
    '-1': -2, '-2': -4, '-3': -6, '-4': -8
}

politician_id = 'f9e00370'
politician_name = '김민석'

# 전체 데이터 조회 (pagination)
print(f'Querying all evaluations for {politician_name}...')
count_result = supabase.from_('evaluations_v30')\
    .select('*', count='exact')\
    .eq('politician_id', politician_id)\
    .execute()

total_count = count_result.count
print(f'Total: {total_count} evaluations\n')

all_data = []
page_size = 1000
offset = 0

while offset < total_count:
    result = supabase.from_('evaluations_v30')\
        .select('evaluator_ai, category, rating')\
        .eq('politician_id', politician_id)\
        .range(offset, offset + page_size - 1)\
        .execute()
    all_data.extend(result.data)
    offset += page_size

# AI별, 카테고리별 집계
stats = defaultdict(lambda: defaultdict(list))
for row in all_data:
    # rating을 score로 변환
    rating = row['rating']
    score = RATING_TO_SCORE.get(rating, 0)
    stats[row['evaluator_ai']][row['category']].append(score)

# 카테고리 정의
categories = [
    ('expertise', '전문성'),
    ('leadership', '리더십'),
    ('vision', '비전'),
    ('integrity', '청렴성'),
    ('ethics', '윤리성'),
    ('accountability', '책임성'),
    ('transparency', '투명성'),
    ('communication', '소통능력'),
    ('responsiveness', '대응성'),
    ('publicinterest', '공익추구')
]

ais = ['Claude', 'ChatGPT', 'Gemini', 'Grok']

def calculate_category_score(avg_score):
    """
    카테고리 점수 계산
    공식: (PRIOR + avg_score × COEFFICIENT) × 10
    """
    return (PRIOR + avg_score * COEFFICIENT) * 10

print('=' * 120)
print(f'{politician_name} (ID: {politician_id}) - AI별 카테고리별 점수 (1000점 만점)')
print(f'V30 공식: (6.0 + avg_score × 0.5) × 10')
print('=' * 120)
print()

# 표 헤더
print('| 카테고리   | Claude | ChatGPT | Gemini | Grok  | AI 평균 |')
print('|-----------|--------|---------|--------|-------|---------|')

# 카테고리별 점수
ai_totals = {ai: 0.0 for ai in ais}
category_avg_scores = []

for cat_key, cat_name in categories:
    print(f'| {cat_name:9s} |', end='')

    cat_scores = []
    for ai in ais:
        if cat_key in stats[ai] and len(stats[ai][cat_key]) > 0:
            scores = stats[ai][cat_key]
            avg_score = sum(scores) / len(scores)
            cat_score = calculate_category_score(avg_score)
            print(f' {cat_score:6.1f} |', end='')
            cat_scores.append(cat_score)
            ai_totals[ai] += cat_score
        else:
            print(f' {"N/A":>6s} |', end='')

    if cat_scores:
        cat_avg = sum(cat_scores) / len(cat_scores)
        print(f' {cat_avg:7.1f} |')
        category_avg_scores.append(cat_avg)
    else:
        print(f' {"N/A":>7s} |')

# 구분선
print('|-----------|--------|---------|--------|-------|---------|')

# 종합 점수
print(f'| 종합점수   |', end='')
final_avg_scores = []
for ai in ais:
    if ai_totals[ai] > 0:
        final_score = round(min(ai_totals[ai], 1000))
        print(f' {final_score:6d} |', end='')
        final_avg_scores.append(final_score)
    else:
        print(f' {"N/A":>6s} |', end='')

if final_avg_scores:
    overall_avg = round(sum(final_avg_scores) / len(final_avg_scores))
    print(f' {overall_avg:7d} |')
else:
    print(f' {"N/A":>7s} |')

print()
print('=' * 120)
print()

# AI별 순위
print('🏆 AI별 종합 순위 (1000점 만점)')
print('-' * 60)
ai_scores = [(ai, round(min(ai_totals[ai], 1000))) for ai in ais if ai_totals[ai] > 0]
ai_scores.sort(key=lambda x: x[1], reverse=True)

medals = ['🥇', '🥈', '🥉', '4위']
for i, (ai, score) in enumerate(ai_scores):
    medal = medals[i] if i < len(medals) else f'{i+1}위'
    print(f'{medal:4s} {ai:12s}: {score:4d}점')

print()
print('-' * 60)
print()

# 카테고리별 순위
print('🏆 카테고리별 순위 (100점 만점 기준)')
print('-' * 60)
cat_avg_with_names = [(cat_name, score) for (_, cat_name), score in zip(categories, category_avg_scores)]
cat_avg_with_names.sort(key=lambda x: x[1], reverse=True)

for i, (cat_name, score) in enumerate(cat_avg_with_names, 1):
    medal = '🥇' if i == 1 else '🥈' if i == 2 else '🥉' if i == 3 else f'{i:2d}위'
    print(f'{medal:4s} {cat_name:9s}: {score:5.1f}점')

print()
print('=' * 120)
print()

# 점수 계산 검증
print('✅ 점수 계산 공식 검증')
print('-' * 60)
print(f'PRIOR: {PRIOR}')
print(f'COEFFICIENT: {COEFFICIENT}')
print(f'Rating 범위: +4 ~ -4 (문자열)')
print(f'Score 범위: +8 ~ -8 (숫자 변환)')
print()
print('예시 계산:')
print('  평균 score = +8 (모두 +4 rating)')
print(f'  카테고리 점수 = (6.0 + 8 × 0.5) × 10 = {(6.0 + 8 * 0.5) * 10:.1f}점')
print()
print('  평균 score = 0 (중립)')
print(f'  카테고리 점수 = (6.0 + 0 × 0.5) × 10 = {(6.0 + 0 * 0.5) * 10:.1f}점')
print()
print('  평균 score = -8 (모두 -4 rating)')
print(f'  카테고리 점수 = (6.0 + (-8) × 0.5) × 10 = {(6.0 - 8 * 0.5) * 10:.1f}점')
print()
print('카테고리 점수 범위: 20~100점 ✅')
print('종합 점수 범위: 200~1000점 ✅')
print('=' * 120)
