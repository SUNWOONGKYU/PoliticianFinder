# -*- coding: utf-8 -*-
"""
V30 올바른 점수 계산
"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from supabase import create_client
from dotenv import load_dotenv
import os
from collections import Counter, defaultdict

# .env 파일 로드
load_dotenv()

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_KEY')
)

# 점수 계산 상수 (V30)
PRIOR = 6.0
COEFFICIENT = 0.5

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

# 카테고리별로 그룹화
category_data = defaultdict(list)

for item in result.data:
    category_data[item['category']].append(item['rating'])

print('=' * 100)
print('📊 V30 올바른 점수 계산 (조은희 - Claude)')
print('=' * 100)
print()

print('점수 공식:')
print('  카테고리 점수 = (PRIOR + avg_score × COEFFICIENT) × 10')
print('  PRIOR = 6.0')
print('  COEFFICIENT = 0.5')
print('  avg_score = 등급 점수 평균 (-8 ~ +8)')
print('  결과: 20~100점 (카테고리당)')
print()
print('=' * 100)
print()

# 전체 카테고리 점수 계산
total_score = 0

for cat in categories:
    if cat not in category_data:
        continue

    ratings = category_data[cat]

    # 등급 → 점수 변환
    scores = [RATING_TO_SCORE[r] for r in ratings]

    # 평균 점수
    avg_score = sum(scores) / len(scores)

    # 카테고리 점수 계산 (올바른 공식)
    category_score = (PRIOR + avg_score * COEFFICIENT) * 10
    category_score = max(20, min(100, round(category_score, 1)))

    total_score += category_score

    # 등급 분포
    rating_count = Counter(ratings)

    print(f'{category_names[cat]:8s} ({len(ratings):2d}개):')
    print(f'  등급 분포: ', end='')
    for r in ['+4', '+3', '+2', '+1', '-1', '-2', '-3', '-4']:
        if rating_count[r] > 0:
            print(f'{r}:{rating_count[r]:2d}개 ', end='')
    print()
    print(f'  점수 합계: {sum(scores):+6.0f}')
    print(f'  평균 점수: {avg_score:+6.2f}')
    print(f'  카테고리 점수: (6.0 + {avg_score:+.2f} × 0.5) × 10 = {category_score:.1f}점')
    print()

print('=' * 100)
print(f'총 합계: {total_score:.1f}점 / 1000점')
print(f'평균: {total_score / 10:.1f}점 / 100점')
print()

# 등급 판정
if total_score >= 920:
    grade = 'M (Mugunghwa) - 최우수'
elif total_score >= 840:
    grade = 'D (Diamond) - 우수'
elif total_score >= 760:
    grade = 'E (Emerald) - 양호'
elif total_score >= 680:
    grade = 'P (Platinum) - 보통+'
elif total_score >= 600:
    grade = 'G (Gold) - 보통'
elif total_score >= 520:
    grade = 'S (Silver) - 보통-'
elif total_score >= 440:
    grade = 'B (Bronze) - 미흡'
elif total_score >= 360:
    grade = 'I (Iron) - 부족'
elif total_score >= 280:
    grade = 'Tn (Tin) - 상당히 부족'
else:
    grade = 'L (Lead) - 매우 부족'

print(f'등급: {grade}')
print('=' * 100)
