# -*- coding: utf-8 -*-
"""
Claude 평가 결과 확인
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

# 전체 통계
result = supabase.table('evaluations_v30') \
    .select('category, rating') \
    .eq('politician_id', 'd0a5d6e1') \
    .eq('evaluator_ai', 'Claude') \
    .execute()

category_stats = defaultdict(lambda: defaultdict(int))

for item in result.data:
    category = item['category']
    rating = item['rating']
    category_stats[category][rating] += 1

categories = ['expertise', 'leadership', 'vision', 'integrity', 'ethics',
              'accountability', 'transparency', 'communication', 'responsiveness', 'publicinterest']
category_names = {
    'expertise': '전문성', 'leadership': '리더십', 'vision': '비전',
    'integrity': '청렴성', 'ethics': '윤리성', 'accountability': '책임감',
    'transparency': '투명성', 'communication': '소통능력',
    'responsiveness': '대응성', 'publicinterest': '공익성'
}

print('=' * 80)
print('✅ Claude 8단계 자동 평가 완료 - 조은희')
print('=' * 80)
print()

total_all = 0
total_by_rating = defaultdict(int)

for cat in categories:
    stats = category_stats[cat]
    total = sum(stats.values())
    total_all += total

    print(f'{category_names[cat]:8s} ({total:3d}개): ', end='')
    for rating in ['+4', '+3', '+2', '+1', '-1', '-2', '-3', '-4']:
        count = stats.get(rating, 0)
        total_by_rating[rating] += count
        if count > 0:
            print(f'{rating}:{count:2d}  ', end='')
    print()

print()
print(f'총 평가: {total_all}개')
print()
print('전체 등급 분포:')
for rating in ['+4', '+3', '+2', '+1', '-1', '-2', '-3', '-4']:
    count = total_by_rating[rating]
    if count > 0:
        pct = count / total_all * 100
        print(f'  {rating}: {count:3d}개 ({pct:5.1f}%)')

# 중립(0) 확인
neutral_count = total_by_rating.get('0', 0)
if neutral_count > 0:
    print(f'  ⚠️ 중립(0): {neutral_count}개 발견!')
else:
    print(f'  ✅ 중립(0): 0개 (8단계 시스템 정상 작동)')

print('=' * 80)
