#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys, os, io
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from supabase import create_client
from dotenv import load_dotenv
from collections import defaultdict

env_path = os.path.join(os.path.dirname(__file__), '..', '..', '.env')
load_dotenv(dotenv_path=env_path, override=True)

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

ALPHABET_GRADES = {
    'A': 8, 'B': 6, 'C': 4, 'D': 2,
    'E': -2, 'F': -4, 'G': -6, 'H': -8
}

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

# 한동훈 데이터 조회
result = supabase.table('collected_data').select('category_name, rating').eq('politician_id', '7abadf92').execute()

cat_data = defaultdict(list)
for item in result.data:
    cat_data[item['category_name']].append(item['rating'])

print('='*80)
print('한동훈 최종 점수 계산 (Transparency 50개 완료 후)')
print('='*80)
print()

category_scores = {}
for cat_eng, cat_kor in CATEGORIES:
    ratings = cat_data.get(cat_eng, [])
    if not ratings:
        continue

    numeric_ratings = [ALPHABET_GRADES.get(r, 0) for r in ratings]
    avg_rating = sum(numeric_ratings) / len(numeric_ratings)
    category_score = (6.0 + avg_rating * 0.5) * 10

    category_scores[cat_kor] = category_score
    print(f'{cat_kor:10s}: {category_score:.2f}점 (평균: {avg_rating:+.2f}, 개수: {len(ratings)})')

total_score = sum(category_scores.values())
final_score = round(min(total_score, 1000))

print()
print('='*80)
print(f'이전 점수: 626점')
print(f'현재 점수: {final_score}점')
print(f'점수 변화: {final_score - 626:+d}점')
print('='*80)
