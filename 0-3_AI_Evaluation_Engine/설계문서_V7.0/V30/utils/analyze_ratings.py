# -*- coding: utf-8 -*-
"""조은희 평가 데이터 Rating 분포 분석"""

import sys
import os
from collections import Counter
from supabase import create_client
from dotenv import load_dotenv

# UTF-8 출력
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# 환경 변수 로드
load_dotenv(override=True)

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_ROLE_KEY')
)

# 조은희 평가 데이터 조회
result = supabase.table('evaluations_v30').select('*').eq('politician_id', 'd0a5d6e1').execute()
data = result.data

print(f'총 평가 개수: {len(data)}개\n')

# Rating 분포
ratings = [d.get('rating') for d in data]
rating_dist = Counter(ratings)

print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
print('📊 전체 Rating 분포')
print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
for rating in ['+4', '+3', '+2', '+1', '-1', '-2', '-3', '-4']:
    count = rating_dist.get(rating, 0)
    pct = (count / len(data)) * 100 if data else 0
    bar = '█' * (count // 50) + '░' * (20 - count // 50)
    print(f'{rating:>3}: {bar} {count:4}개 ({pct:5.1f}%)')

print('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
print('📊 AI별 Rating 분포')
print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

for ai in ['Claude', 'ChatGPT', 'Gemini', 'Grok']:
    ai_data = [d for d in data if d.get('evaluator_ai') == ai]
    ai_ratings = [d.get('rating') for d in ai_data]
    ai_dist = Counter(ai_ratings)

    print(f'\n[{ai}] ({len(ai_data)}개)')
    for rating in ['+4', '+3', '+2', '+1', '-1', '-2', '-3', '-4']:
        count = ai_dist.get(rating, 0)
        pct = (count / len(ai_data)) * 100 if ai_data else 0
        bar = '█' * (count // 20) + '░' * (10 - count // 20)
        print(f'  {rating:>3}: {bar} {count:3}개 ({pct:4.1f}%)')

print('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
print('📊 긍정 vs 부정 비율')
print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

positive = sum(rating_dist.get(r, 0) for r in ['+4', '+3', '+2', '+1'])
negative = sum(rating_dist.get(r, 0) for r in ['-1', '-2', '-3', '-4'])

print(f'긍정 (+1~+4): {positive:4}개 ({positive/len(data)*100:5.1f}%)')
print(f'부정 (-1~-4): {negative:4}개 ({negative/len(data)*100:5.1f}%)')

print('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
print('📊 카테고리별 Rating 평균')
print('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

CATEGORIES = [
    ("expertise", "전문성"),
    ("leadership", "리더십"),
    ("vision", "비전"),
    ("integrity", "청렴성"),
    ("ethics", "윤리성"),
    ("accountability", "책임감"),
    ("transparency", "투명성"),
    ("communication", "소통능력"),
    ("responsiveness", "대응성"),
    ("publicinterest", "공익성")
]

RATING_TO_SCORE = {
    '+4': 8, '+3': 6, '+2': 4, '+1': 2,
    '-1': -2, '-2': -4, '-3': -6, '-4': -8
}

for cat_name, cat_korean in CATEGORIES:
    cat_data = [d for d in data if d.get('category') == cat_name]
    count = len(cat_data)
    expected = 400
    status = 'OK' if count >= 380 else 'NG'
    if cat_data:
        scores = [RATING_TO_SCORE.get(d.get('rating'), 2) for d in cat_data]
        avg = sum(scores) / len(scores)
        print(f'[{status}] {cat_korean:8} {count:3}/400개: 평균 {avg:+.2f}점')
    else:
        print(f'[{status}] {cat_korean:8} {count:3}/400개: 데이터 없음')
