#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
한동훈 상세 점수 분석
"""

import sys, os, io
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from supabase import create_client
from dotenv import load_dotenv
from collections import defaultdict

env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '.env')
load_dotenv(dotenv_path=env_path, override=True)

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# 한동훈 카테고리별 등급 분포 조회
politician_id = '7abadf92'

result = supabase.table('collected_data') \
    .select('category_name, rating') \
    .eq('politician_id', politician_id) \
    .execute()

category_ratings = defaultdict(list)
for item in result.data:
    category_ratings[item['category_name']].append(item['rating'])

CATEGORIES = [
    ('Expertise', '전문성'),
    ('Leadership', '리더십'),
    ('Vision', '비전'),
    ('Integrity', '청렴성'),
    ('Ethics', '윤리성'),
    ('Accountability', '책임성'),
    ('Transparency', '투명성'),
    ('Communication', '소통능력'),
    ('Responsiveness', '대응성'),
    ('PublicInterest', '공익성')
]

ALPHABET_GRADES = {
    'A': 8, 'B': 6, 'C': 4, 'D': 2,
    'E': -2, 'F': -4, 'G': -6, 'H': -8
}

print('='*100)
print('한동훈 카테고리별 등급 분포 및 평균 점수')
print('='*100)
print()

category_scores = []

for cat_en, cat_kr in CATEGORIES:
    ratings = category_ratings[cat_en]
    if not ratings:
        continue

    # 등급별 개수
    rating_counts = defaultdict(int)
    for r in ratings:
        rating_counts[r] += 1

    # 평균 계산
    total = sum(ALPHABET_GRADES.get(r, 0) for r in ratings)
    avg = total / len(ratings) if ratings else 0
    category_score = (6.0 + avg * 0.5) * 10
    category_scores.append((cat_kr, category_score))

    # 긍정/부정 비율
    positive = sum(1 for r in ratings if ALPHABET_GRADES.get(r, 0) >= 0)
    negative = len(ratings) - positive

    print(f'📊 {cat_kr} ({cat_en}) - {len(ratings)}개 항목')
    print(f'   카테고리 점수: {category_score:.1f}점')
    print(f'   평균 등급 값: {avg:+.2f}')
    print(f'   긍정/부정: {positive}개 / {negative}개 ({negative/len(ratings)*100:.1f}% 부정)')

    # 등급 분포
    grade_dist = []
    for grade in ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']:
        count = rating_counts.get(grade, 0)
        if count > 0:
            grade_dist.append(f'{grade}:{count}개')
    print(f'   등급 분포: {" ".join(grade_dist)}')
    print()

print('='*100)
print('점수가 낮은 카테고리 TOP 5')
print('='*100)
print()

sorted_scores = sorted(category_scores, key=lambda x: x[1])
for i, (cat_name, score) in enumerate(sorted_scores[:5], 1):
    status = '🔴' if score < 50 else '⚠️' if score < 60 else '📊'
    print(f'{status} {i}위: {cat_name} - {score:.1f}점')

print()
print('='*100)
print('최종 점수')
print('='*100)
total_score = min(sum(s for _, s in category_scores), 1000)
print(f'합계: {total_score:.0f}점')
print('='*100)
