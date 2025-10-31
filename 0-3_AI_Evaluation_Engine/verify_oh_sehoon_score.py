#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
오세훈 최종 점수 검증
"""
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_KEY'))

oh_id = 272

print('=' * 80)
print('오세훈 최종 점수 검증')
print('=' * 80)
print()

# 1. collected_data 확인
print('1. collected_data 테이블 확인')
print('-' * 80)
response = supabase.table('collected_data').select('category_num', count='exact').eq('politician_id', oh_id).execute()
print(f'총 데이터 수: {response.count}')

# 카테고리별 데이터 수
for i in range(1, 11):
    response = supabase.table('collected_data').select('*', count='exact').eq('politician_id', oh_id).eq('category_num', i).execute()
    print(f'  Category {i}: {response.count} data')

print()

# 2. ai_item_scores 확인
print('2. ai_item_scores 테이블 확인')
print('-' * 80)
response = supabase.table('ai_item_scores').select('*', count='exact').eq('politician_id', oh_id).execute()
print(f'총 항목 점수: {response.count}/70')
if response.data:
    for item in response.data[:5]:
        print(f"  Cat{item['category_num']} Item{item['item_num']}: {item['item_score']}")
    if len(response.data) > 5:
        print(f'  ... ({len(response.data) - 5} more)')

print()

# 3. ai_category_scores 확인
print('3. ai_category_scores 테이블 확인')
print('-' * 80)
response = supabase.table('ai_category_scores').select('*').eq('politician_id', oh_id).execute()
print(f'총 분야 점수: {len(response.data)}/10')
if response.data:
    total_category = 0
    for cat in response.data:
        print(f"  Category {cat['category_num']}: {cat['category_score']}")
        total_category += cat['category_score']
    if len(response.data) == 10:
        print(f'\n  합계: {total_category}')

print()

# 4. ai_final_scores 확인
print('4. ai_final_scores 테이블 확인')
print('-' * 80)
response = supabase.table('ai_final_scores').select('*').eq('politician_id', oh_id).execute()
if response.data:
    final = response.data[0]
    print(f"  최종 점수: {final['final_score']}")
    print(f"  등급 코드: {final['grade_code']}")
    print(f"  등급 이름: {final['grade_name']}")
    print(f"  등급 이모지: {final['grade_emoji']}")
else:
    print('  ⚠️ 최종 점수 없음 (10개 분야 미완성)')

print()
print('=' * 80)
