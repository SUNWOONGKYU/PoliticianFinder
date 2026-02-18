# -*- coding: utf-8 -*-
"""
V30 카테고리별 점수 계산 및 표시
"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from supabase import create_client
from dotenv import load_dotenv
import os
from collections import defaultdict

# .env 파일 로드
load_dotenv()

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_KEY')
)

# 등급 → 점수 변환 (8단계)
RATING_TO_SCORE = {
    '+4': 8, '+3': 6, '+2': 4, '+1': 2,
    '-1': -2, '-2': -4, '-3': -6, '-4': -8
}

# 카테고리 정보
categories = ['expertise', 'leadership', 'vision', 'integrity', 'ethics',
              'accountability', 'transparency', 'communication', 'responsiveness', 'publicinterest']
category_names = {
    'expertise': '전문성', 'leadership': '리더십', 'vision': '비전',
    'integrity': '청렴성', 'ethics': '윤리성', 'accountability': '책임감',
    'transparency': '투명성', 'communication': '소통능력',
    'responsiveness': '대응성', 'publicinterest': '공익성'
}

# Claude 평가 데이터 조회
result = supabase.table('evaluations_v30') \
    .select('category, rating') \
    .eq('politician_id', 'd0a5d6e1') \
    .eq('evaluator_ai', 'Claude') \
    .execute()

# 카테고리별 점수 계산
category_scores = {}

for cat in categories:
    ratings = [item['rating'] for item in result.data if item['category'] == cat]

    if not ratings:
        continue

    # 점수 변환
    scores = [RATING_TO_SCORE.get(r, 0) for r in ratings]

    # 평균 점수 계산
    avg_score = sum(scores) / len(scores) if scores else 0

    # 1000점 만점 환산 (0점 = 500점, +8점 = 1000점, -8점 = 0점)
    # 공식: (avg_score + 8) / 16 * 1000
    final_score = ((avg_score + 8) / 16) * 1000

    category_scores[cat] = {
        'count': len(ratings),
        'avg_score': avg_score,
        'final_score': final_score,
        'ratings': ratings
    }

# 결과 출력
print('=' * 80)
print('📊 Claude V30 카테고리별 점수 (조은희)')
print('=' * 80)
print()

total_score = 0
for cat in categories:
    if cat not in category_scores:
        continue

    data = category_scores[cat]
    name = category_names[cat]

    print(f'{name:8s}: ', end='')
    print(f'{data["final_score"]:6.1f}점 ', end='')
    print(f'(평균: {data["avg_score"]:+5.2f}, ', end='')
    print(f'{data["count"]}개 평가)')

    total_score += data['final_score']

print()
print('=' * 80)
print(f'총 합계: {total_score:7.1f}점 (10개 카테고리)')
print(f'평균: {total_score / 10:7.1f}점')
print('=' * 80)
print()

# 상세 분포
print('📈 점수 분포 상세')
print('=' * 80)

for cat in categories:
    if cat not in category_scores:
        continue

    data = category_scores[cat]
    name = category_names[cat]

    # 등급별 카운트
    rating_count = defaultdict(int)
    for r in data['ratings']:
        rating_count[r] += 1

    print(f'\n{name} ({data["final_score"]:.1f}점):')

    # 긍정
    positive = []
    for r in ['+4', '+3', '+2', '+1']:
        if rating_count[r] > 0:
            positive.append(f'{r}:{rating_count[r]}개')
    if positive:
        print(f'  긍정: {", ".join(positive)}')

    # 부정
    negative = []
    for r in ['-1', '-2', '-3', '-4']:
        if rating_count[r] > 0:
            negative.append(f'{r}:{rating_count[r]}개')
    if negative:
        print(f'  부정: {", ".join(negative)}')

print()
print('=' * 80)
