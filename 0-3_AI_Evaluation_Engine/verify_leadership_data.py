#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
오세훈 리더십 카테고리 데이터 확인
"""

import os
from dotenv import load_dotenv
from supabase import create_client, Client

# 환경 변수 로드
load_dotenv()

# Supabase 클라이언트 초기화
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_SERVICE_KEY')
supabase: Client = create_client(supabase_url, supabase_key)

POLITICIAN_ID = '272'
CATEGORY_NUM = 2

print("=" * 80)
print("오세훈 (ID: 272) - Category 2 (리더십) 데이터 확인")
print("=" * 80)

# 전체 데이터 조회
result = supabase.table('collected_data')\
    .select('*', count='exact')\
    .eq('politician_id', POLITICIAN_ID)\
    .eq('category_num', CATEGORY_NUM)\
    .execute()

print(f"\n총 데이터 개수: {result.count}개")

# 항목별 통계
for item_num in range(1, 8):
    item_result = supabase.table('collected_data')\
        .select('rating', count='exact')\
        .eq('politician_id', POLITICIAN_ID)\
        .eq('category_num', CATEGORY_NUM)\
        .eq('item_num', item_num)\
        .execute()

    if item_result.data:
        ratings = [row['rating'] for row in item_result.data]
        avg_rating = sum(ratings) / len(ratings)
        print(f"\n항목 {item_num}: {len(ratings)}개 데이터, 평균 Rating: {avg_rating:+.2f}")
        print(f"  Rating 분포: 최저 {min(ratings):+d}, 최고 {max(ratings):+d}")

# 전체 평균 Rating
all_ratings = [row['rating'] for row in result.data]
overall_avg = sum(all_ratings) / len(all_ratings)

print("\n" + "=" * 80)
print(f"전체 평균 Rating: {overall_avg:+.2f}")
print("=" * 80)

# 샘플 데이터 출력 (항목별 1개씩)
print("\n샘플 데이터 (항목별 1개씩):")
print("-" * 80)

for item_num in range(1, 8):
    item_result = supabase.table('collected_data')\
        .select('data_title, rating, rating_rationale')\
        .eq('politician_id', POLITICIAN_ID)\
        .eq('category_num', CATEGORY_NUM)\
        .eq('item_num', item_num)\
        .limit(1)\
        .execute()

    if item_result.data:
        data = item_result.data[0]
        print(f"\n항목 {item_num}:")
        print(f"  제목: {data['data_title']}")
        print(f"  Rating: {data['rating']:+d}")
        print(f"  근거: {data['rating_rationale'][:100]}...")

print("\n" + "=" * 80)
print("데이터 확인 완료!")
print("=" * 80)
